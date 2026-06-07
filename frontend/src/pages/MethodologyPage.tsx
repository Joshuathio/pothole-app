import {
  Database,
  Crop,
  Sparkles,
  Layers,
  Split,
  Cpu,
  CheckSquare,
  Play,
  ArrowRight,
} from "lucide-react";

export default function MethodologyPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold uppercase tracking-wide text-2xl mb-2">
          Methodology
        </h1>
        <p className="text-sm text-neutral-400 max-w-3xl">
          A classical machine learning pipeline for frame-level pothole detection.
          HOG and LBP features, trained on randomly cropped patches, classified
          with an SVM. Designed for CPU-only deployment.
        </p>
      </div>

      {/* Pipeline overview visual */}
      <PipelineDiagram />

      {/* Stages */}
      <div className="space-y-5">
        <Stage
          num="A"
          icon={<Database className="w-5 h-5" />}
          title="Dataset Acquisition"
          summary="Two Kaggle datasets, pooled and re-split"
          details={[
            "virenbr11/pothole-and-plain-rode-images — primary source with Pothole and Plain folders",
            "sachinpatel21/pothole-image-dataset — supplementary positive samples",
            "Original train/test partitioning disregarded — all images pooled, then re-split with stratified sampling",
          ]}
        />

        <Stage
          num="B"
          icon={<Crop className="w-5 h-5" />}
          title="Patch-Based Data Construction"
          summary="6 random 64×64 patches per source image"
          details={[
            "Images < 128×128 px discarded (insufficient extent for cropping)",
            "Images > 800 px longest edge downsampled to 800 px (preserves aspect ratio)",
            "6 random 64×64 patches extracted per image at uniform random coordinates",
            "Each patch inherits parent image label (pothole = 1, plain = 0)",
            "Dataset balanced via random undersampling of majority class",
          ]}
        />

        <Stage
          num="C"
          icon={<Sparkles className="w-5 h-5" />}
          title="Image Preprocessing"
          summary="Grayscale, CLAHE, median filter"
          details={[
            "BGR → grayscale conversion (HOG/LBP operate on intensity)",
            "CLAHE: clip limit 2.0, tile grid 8×8 — normalizes local contrast under non-uniform illumination",
            "Median filter 3×3 — suppresses impulsive noise that would distort LBP",
          ]}
        />

        <Stage
          num="D"
          icon={<Layers className="w-5 h-5" />}
          title="Feature Engineering"
          summary="HOG (1764-d) + LBP (18-d) = 1782-d feature vector"
          details={[
            "HOG: 9 orientations, 8×8 cell, 2×2 block, L2-Hys normalization → captures edge structure",
            "LBP: P=16 points, R=2, uniform method, 18-bin histogram → captures rotation-invariant texture",
            "Concatenation: [HOG | LBP] = 1782-dimensional vector per patch",
          ]}
        />

        <Stage
          num="E"
          icon={<Split className="w-5 h-5" />}
          title="Train/Test Split & Standardization"
          summary="80:20 stratified split, scaler fit on train only"
          details={[
            "80:20 stratified split (preserves class proportions in both subsets)",
            "Fixed random seed = 42 for reproducibility",
            "StandardScaler fit on training set only (prevents test-set information leakage)",
            "Same scaler applied to transform both train and test partitions",
          ]}
        />

        <Stage
          num="F"
          icon={<Cpu className="w-5 h-5" />}
          title="Classifier Training"
          summary="SVM with RBF kernel + grid search 5-fold CV"
          details={[
            "Support Vector Machine, Radial Basis Function kernel",
            "Grid search: C ∈ {0.1, 1, 10, 100}, γ ∈ {scale, 0.01, 0.001}",
            "12 configurations × 5-fold CV = 60 total model fits",
            "Scoring objective: F1-score (balances precision and recall)",
            "class_weight=balanced to handle residual class imbalance",
          ]}
        />

        <Stage
          num="G"
          icon={<CheckSquare className="w-5 h-5" />}
          title="Evaluation Protocol"
          summary="Accuracy, Precision, Recall, F1, Confusion Matrix"
          details={[
            "Evaluation on held-out 20% test set",
            "Four standard classification metrics computed",
            "Confusion matrix for per-class breakdown",
            "Model artifacts (SVM + StandardScaler) serialized via joblib for deployment",
          ]}
        />

        <Stage
          num="H"
          icon={<Play className="w-5 h-5" />}
          title="Inference Pipeline"
          summary="Multi-scale patch sampling + temporal smoothing"
          details={[
            "Per frame: 64×64 patches sampled at scales 1.0×, 1.5×, 2.0×",
            "Region of interest: lower 70% of frame (excludes sky)",
            "Top-K (K=5) patch probabilities averaged → frame confidence",
            "Temporal smoothing window of 5 frames",
            "Threshold = 0.55 (user-adjustable via UI slider)",
          ]}
        />
      </div>

      {/* Tech stack */}
      <div className="bg-bg-card border border-border rounded-lg p-6">
        <h2 className="text-xs uppercase tracking-widest font-display font-bold text-neutral-400 mb-4">
          Tech Stack
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <TechBlock label="Language" items={["Python 3.13", "TypeScript 5"]} />
          <TechBlock label="ML" items={["scikit-learn 1.6", "scikit-image 0.25", "OpenCV"]} />
          <TechBlock label="Backend" items={["Flask 3.1", "Gunicorn", "PostgreSQL"]} />
          <TechBlock label="Frontend" items={["React 18", "Vite 5", "Tailwind CSS"]} />
          <TechBlock label="Inference" items={["CPU-only", "ffmpeg (H.264)", "Real-time"]} />
          <TechBlock label="Deployment" items={["Linux VPS", "Nginx", "Let's Encrypt SSL"]} />
        </div>
      </div>
    </div>
  );
}

function PipelineDiagram() {
  const stages = [
    "Dataset",
    "Patch Extract",
    "Preprocess",
    "HOG + LBP",
    "Train SVM",
    "Inference",
  ];

  return (
    <div className="bg-bg-card border border-border rounded-lg p-6 overflow-x-auto">
      <h2 className="text-xs uppercase tracking-widest font-display font-bold text-neutral-400 mb-4">
        Pipeline Overview
      </h2>
      <div className="flex items-center gap-2 min-w-max">
        {stages.map((stage, i) => (
          <div key={stage} className="flex items-center gap-2">
            <div className="bg-accent/10 border border-accent/30 text-accent px-4 py-3 rounded font-display font-bold text-xs uppercase tracking-wider whitespace-nowrap">
              {stage}
            </div>
            {i < stages.length - 1 && (
              <ArrowRight className="w-4 h-4 text-neutral-600" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Stage({
  num,
  icon,
  title,
  summary,
  details,
}: {
  num: string;
  icon: React.ReactNode;
  title: string;
  summary: string;
  details: string[];
}) {
  return (
    <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-start gap-4 p-5 border-b border-border">
        <div className="flex-shrink-0 w-10 h-10 rounded bg-accent/10 border border-accent/30 text-accent flex items-center justify-center font-display font-bold">
          {num}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-accent">{icon}</span>
            <h3 className="font-display font-bold uppercase tracking-wide">
              {title}
            </h3>
          </div>
          <p className="text-sm text-neutral-400 mt-1">{summary}</p>
        </div>
      </div>
      <ul className="px-5 py-4 space-y-2">
        {details.map((d, i) => (
          <li
            key={i}
            className="text-sm text-neutral-300 flex items-start gap-3"
          >
            <span className="text-accent font-mono mt-0.5">›</span>
            <span>{d}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TechBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
        {label}
      </div>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item} className="font-mono text-neutral-200">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}