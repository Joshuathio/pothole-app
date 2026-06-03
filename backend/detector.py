"""ML inference module — wraps the SVM + HOG + LBP pipeline."""
import os
import cv2
import numpy as np
import joblib
from skimage.feature import hog, local_binary_pattern

# Same hyperparameters as training notebook
PATCH_SIZE = 64
HOG_PIXELS_PER_CELL = (8, 8)
HOG_CELLS_PER_BLOCK = (2, 2)
HOG_ORIENTATIONS = 9
LBP_P = 16
LBP_R = 2
LBP_METHOD = "uniform"


class PotholeDetector:
    """Singleton-ish wrapper for the SVM model + feature extraction."""

    _instance = None

    def __init__(self, model_path: str, scaler_path: str):
        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)

    @classmethod
    def get_instance(cls, model_path: str = None, scaler_path: str = None):
        if cls._instance is None:
            if not model_path or not scaler_path:
                raise ValueError("First call must provide model_path and scaler_path")
            cls._instance = cls(model_path, scaler_path)
        return cls._instance

    # --- Feature extraction ---
    @staticmethod
    def preprocess_patch(patch):
        if len(patch.shape) == 3:
            gray = cv2.cvtColor(patch, cv2.COLOR_BGR2GRAY)
        else:
            gray = patch
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        gray = clahe.apply(gray)
        gray = cv2.medianBlur(gray, 3)
        return gray

    @staticmethod
    def extract_hog_feat(gray):
        return hog(
            gray,
            orientations=HOG_ORIENTATIONS,
            pixels_per_cell=HOG_PIXELS_PER_CELL,
            cells_per_block=HOG_CELLS_PER_BLOCK,
            block_norm="L2-Hys",
            transform_sqrt=True,
            feature_vector=True,
        )

    @staticmethod
    def extract_lbp_feat(gray):
        lbp = local_binary_pattern(gray, LBP_P, LBP_R, method=LBP_METHOD)
        n_bins = LBP_P + 2
        hist, _ = np.histogram(lbp.ravel(), bins=n_bins, range=(0, n_bins), density=True)
        return hist

    def extract_features(self, patch):
        gray = self.preprocess_patch(patch)
        return np.hstack([self.extract_hog_feat(gray), self.extract_lbp_feat(gray)])

    # --- Frame-level classification ---
    def classify_frame(
        self,
        frame,
        scales=(1.0, 1.5, 2.0),
        stride_ratio=0.5,
        roi_top_ratio=0.3,
        agg="top_k_mean",
        top_k=5,
    ):
        """Return confidence (0..1) that this frame contains a pothole."""
        h, w = frame.shape[:2]
        roi_top = int(h * roi_top_ratio)
        all_probs = []

        for scale in scales:
            patch_size = int(PATCH_SIZE * scale)
            if patch_size > min(h - roi_top, w):
                continue
            stride = max(8, int(patch_size * stride_ratio))

            patches = []
            for y in range(roi_top, h - patch_size + 1, stride):
                for x in range(0, w - patch_size + 1, stride):
                    patch = frame[y:y + patch_size, x:x + patch_size]
                    if patch_size != PATCH_SIZE:
                        patch = cv2.resize(patch, (PATCH_SIZE, PATCH_SIZE))
                    patches.append(patch)

            if not patches:
                continue

            feats = np.array([self.extract_features(p) for p in patches])
            feats_s = self.scaler.transform(feats)
            probs = self.model.predict_proba(feats_s)[:, 1]
            all_probs.extend(probs.tolist())

        if not all_probs:
            return 0.0

        all_probs = np.array(all_probs)
        if agg == "mean":
            return float(all_probs.mean())
        elif agg == "max":
            return float(all_probs.max())
        else:  # top_k_mean
            k = min(top_k, len(all_probs))
            return float(np.sort(all_probs)[-k:].mean())

    # --- Video processing ---
    def process_video(
        self,
        input_path: str,
        output_path: str,
        threshold: float = 0.55,
        scales=(1.0, 1.5, 2.0),
        frame_skip: int = 2,
        smoothing_window: int = 5,
        progress_callback=None,
    ):
        """
        Process video frame-by-frame, write annotated output.
        Returns dict with metadata + per-frame predictions.
        """
        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            raise RuntimeError(f"Cannot open video: {input_path}")

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else None

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        frame_predictions = []  # for DB
        confidence_history = []
        last_conf = 0.0
        frame_idx = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Classify every frame_skip-th frame
            if frame_idx % frame_skip == 0:
                conf = self.classify_frame(frame, scales=scales)
                confidence_history.append(conf)
                if len(confidence_history) > smoothing_window:
                    confidence_history = confidence_history[-smoothing_window:]
                last_conf = float(np.mean(confidence_history))

                # Record this frame's prediction
                frame_predictions.append({
                    "frame_index": frame_idx,
                    "timestamp_seconds": frame_idx / fps if fps > 0 else 0.0,
                    "confidence": last_conf,
                    "is_pothole": last_conf >= threshold,
                })

            is_pothole = last_conf >= threshold
            label = "POTHOLE DETECTED" if is_pothole else "PLAIN ROAD"
            color = (0, 0, 255) if is_pothole else (0, 200, 0)

            # Draw label overlay (top-left)
            text1 = f"Status: {label}"
            text2 = f"Confidence: {last_conf:.3f}"
            (tw1, th1), _ = cv2.getTextSize(text1, cv2.FONT_HERSHEY_SIMPLEX, 0.9, 2)
            (tw2, th2), _ = cv2.getTextSize(text2, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
            box_w = max(tw1, tw2) + 30
            box_h = th1 + th2 + 40

            overlay = frame.copy()
            cv2.rectangle(overlay, (10, 10), (10 + box_w, 10 + box_h), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)

            cv2.putText(frame, text1, (20, 10 + th1 + 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
            cv2.putText(frame, text2, (20, 10 + th1 + th2 + 25),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

            # Confidence bar
            bar_x = 20
            bar_y = 10 + th1 + th2 + 35
            bar_w_max = box_w - 30
            bar_h = 8
            cv2.rectangle(frame, (bar_x, bar_y), (bar_x + bar_w_max, bar_y + bar_h),
                         (80, 80, 80), -1)
            filled = int(bar_w_max * min(last_conf, 1.0))
            cv2.rectangle(frame, (bar_x, bar_y), (bar_x + filled, bar_y + bar_h), color, -1)
            thresh_x = bar_x + int(bar_w_max * threshold)
            cv2.line(frame, (thresh_x, bar_y - 2), (thresh_x, bar_y + bar_h + 2),
                    (255, 255, 255), 2)

            out.write(frame)
            frame_idx += 1

            if progress_callback and frame_idx % 30 == 0:
                progress_callback(frame_idx, total_frames)

        cap.release()
        out.release()

        # Compute summary
        confidences = [fp["confidence"] for fp in frame_predictions]
        pothole_count = sum(1 for fp in frame_predictions if fp["is_pothole"])
        plain_count = len(frame_predictions) - pothole_count

        return {
            "metadata": {
                "width": width,
                "height": height,
                "fps": fps,
                "total_frames": total_frames,
                "duration_seconds": duration,
            },
            "summary": {
                "pothole_frame_count": pothole_count,
                "plain_frame_count": plain_count,
                "avg_confidence": float(np.mean(confidences)) if confidences else 0.0,
                "max_confidence": float(np.max(confidences)) if confidences else 0.0,
            },
            "frame_predictions": frame_predictions,
        }
