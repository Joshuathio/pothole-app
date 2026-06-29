"""Flask API for pothole detection."""
import os
import uuid
from datetime import datetime
from pathlib import Path

from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

from models import db, Prediction, FramePrediction
from detector import PotholeDetector

load_dotenv()


def create_app():
    app = Flask(__name__)

    # Config
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-key")
    app.config["MAX_CONTENT_LENGTH"] = int(os.getenv("MAX_CONTENT_LENGTH", 104857600))

    upload_folder = Path(os.getenv("UPLOAD_FOLDER", "./uploads")).resolve()
    output_folder = Path(os.getenv("OUTPUT_FOLDER", "./outputs")).resolve()
    upload_folder.mkdir(parents=True, exist_ok=True)
    output_folder.mkdir(parents=True, exist_ok=True)

    app.config["UPLOAD_FOLDER"] = str(upload_folder)
    app.config["OUTPUT_FOLDER"] = str(output_folder)

    # CORS — allow frontend origin
    frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    CORS(app, origins=[frontend_origin], supports_credentials=True)

    # DB
    db.init_app(app)
    with app.app_context():
        db.create_all()

    # Load ML model once at startup
    model_path = os.getenv("MODEL_PATH", "./models/pothole_svm_model.pkl")
    scaler_path = os.getenv("SCALER_PATH", "./models/pothole_scaler.pkl")
    PotholeDetector.get_instance(model_path, scaler_path)
    print(f"Model loaded from {model_path}")

    # ===== Routes =====

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "timestamp": datetime.utcnow().isoformat()})

    @app.route("/api/predictions", methods=["POST"])
    def upload_and_predict():
        """Upload a video, process it, return prediction result."""
        if "video" not in request.files:
            return jsonify({"error": "No video file in request"}), 400

        file = request.files["video"]
        if file.filename == "":
            return jsonify({"error": "Empty filename"}), 400

        # Validate extension
        allowed_ext = {"mp4", "avi", "mov", "mkv", "webm"}
        ext = file.filename.rsplit(".", 1)[-1].lower()
        if ext not in allowed_ext:
            return jsonify({"error": f"Unsupported file extension: {ext}"}), 400

        # Optional params from frontend
        threshold = float(request.form.get("threshold", 0.55))
        scales_str = request.form.get("scales", "1.0,1.5,2.0")
        try:
            scales = tuple(float(s) for s in scales_str.split(","))
        except ValueError:
            return jsonify({"error": "Invalid scales format"}), 400

        # Save uploaded file with unique name
        original_filename = secure_filename(file.filename)
        unique_id = uuid.uuid4().hex[:12]
        stored_filename = f"{unique_id}_{original_filename}"
        input_path = os.path.join(app.config["UPLOAD_FOLDER"], stored_filename)
        file.save(input_path)
        file_size = os.path.getsize(input_path)

        # Create DB record (status: processing)
        prediction = Prediction(
            original_filename=original_filename,
            stored_filename=stored_filename,
            file_size_bytes=file_size,
            status="processing",
            threshold_used=threshold,
            scales_used=scales_str,
        )
        db.session.add(prediction)
        db.session.commit()

        # Process video
        output_filename = f"annotated_{Path(stored_filename).stem}.mp4"
        output_path = os.path.join(app.config["OUTPUT_FOLDER"], output_filename)

        try:
            detector = PotholeDetector.get_instance()
            result = detector.process_video(
                input_path=input_path,
                output_path=output_path,
                threshold=threshold,
                scales=scales,
            )

            # Save metadata
            meta = result["metadata"]
            summary = result["summary"]
            prediction.output_filename = output_filename
            prediction.width = meta["width"]
            prediction.height = meta["height"]
            prediction.fps = meta["fps"]
            prediction.total_frames = meta["total_frames"]
            prediction.duration_seconds = meta["duration_seconds"]
            prediction.pothole_frame_count = summary["pothole_frame_count"]
            prediction.plain_frame_count = summary["plain_frame_count"]
            prediction.avg_confidence = summary["avg_confidence"]
            prediction.max_confidence = summary["max_confidence"]
            prediction.status = "completed"
            prediction.completed_at = datetime.utcnow()

            # Save per-frame predictions
            for fp in result["frame_predictions"]:
                db.session.add(FramePrediction(
                    prediction_id=prediction.id,
                    frame_index=fp["frame_index"],
                    timestamp_seconds=fp["timestamp_seconds"],
                    confidence=fp["confidence"],
                    is_pothole=fp["is_pothole"],
                ))

            db.session.commit()

            return jsonify(prediction.to_dict(include_frames=True)), 201

        except Exception as e:
            prediction.status = "failed"
            prediction.error_message = str(e)
            db.session.commit()
            return jsonify({"error": str(e), "predictionId": prediction.id}), 500

    @app.route("/api/predictions", methods=["GET"])
    def list_predictions():
        """List all predictions (history), newest first."""
        limit = min(int(request.args.get("limit", 50)), 200)
        offset = int(request.args.get("offset", 0))

        query = Prediction.query.order_by(Prediction.created_at.desc())
        total = query.count()
        items = query.offset(offset).limit(limit).all()

        return jsonify({
            "total": total,
            "limit": limit,
            "offset": offset,
            "items": [p.to_dict() for p in items],
        })

    @app.route("/api/predictions/<int:prediction_id>", methods=["GET"])
    def get_prediction(prediction_id):
        """Get one prediction with all frame details."""
        prediction = Prediction.query.get_or_404(prediction_id)
        return jsonify(prediction.to_dict(include_frames=True))

    @app.route("/api/predictions/<int:prediction_id>", methods=["DELETE"])
    def delete_prediction(prediction_id):
        prediction = Prediction.query.get_or_404(prediction_id)

        # Remove files
        for folder_key, filename in [
            ("UPLOAD_FOLDER", prediction.stored_filename),
            ("OUTPUT_FOLDER", prediction.output_filename),
        ]:
            if filename:
                path = os.path.join(app.config[folder_key], filename)
                if os.path.exists(path):
                    os.remove(path)

        db.session.delete(prediction)
        db.session.commit()
        return jsonify({"deleted": prediction_id})

    @app.route("/api/predictions/stats", methods=["GET"])
    def stats():
        """Dashboard stats."""
        total = Prediction.query.count()
        completed = Prediction.query.filter_by(status="completed").count()
        failed = Prediction.query.filter_by(status="failed").count()

        # Aggregate counts
        pothole_total = db.session.query(
            db.func.coalesce(db.func.sum(Prediction.pothole_frame_count), 0)
        ).scalar()
        plain_total = db.session.query(
            db.func.coalesce(db.func.sum(Prediction.plain_frame_count), 0)
        ).scalar()
        avg_confidence = db.session.query(
            db.func.avg(Prediction.avg_confidence)
        ).filter(Prediction.status == "completed").scalar()

        return jsonify({
            "totalVideos": total,
            "completed": completed,
            "failed": failed,
            "totalPotholeFrames": int(pothole_total or 0),
            "totalPlainFrames": int(plain_total or 0),
            "overallAvgConfidence": float(avg_confidence) if avg_confidence else 0.0,
        })

    @app.route("/api/videos/<path:filename>", methods=["GET"])
    def serve_output_video(filename):
        """Stream annotated video back to frontend."""
        # Security: only allow files that exist in output folder
        safe_path = os.path.join(app.config["OUTPUT_FOLDER"], filename)
        if not os.path.exists(safe_path):
            abort(404)
        return send_from_directory(app.config["OUTPUT_FOLDER"], filename)

    @app.errorhandler(413)
    def file_too_large(e):
        return jsonify({"error": "File too large (max 100MB)"}), 413

    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("FLASK_ENV") == "development")
