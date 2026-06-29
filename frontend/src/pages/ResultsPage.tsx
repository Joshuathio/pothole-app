import {
  Target,
  AlertTriangle,
  Award,
  TrendingDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";

// === Hasil aktual training (update angka ini sesuai notebook Anda) ===
const RESULTS = {
  accuracy: 0.6696,
  precision: 0.6479,
  recall: 0.7433,
  f1: 0.6923,
  cvF1: 0.6924, // jika beda dari test F1, update
  bestC: 0.1, // dari grid search — update sesuai output Anda
  bestGamma: "scale",

  // Confusion matrix [TN, FP / FN, TP] for [Plain, Pothole]
  confusionMatrix: {
    TN: 267, // Plain predicted Plain (448 * 0.62)
    FP: 181, // Plain predicted Pothole (448 * 0.38)
    FN: 115, // Pothole predicted Plain (448 * 0.27)
    TP: 333, // Pothole predicted Pothole (448 * 0.73)
  },

  totalPatches: 4476, // total dataset (update sesuai notebook)
  trainSize: 3580,
  testSize: 896,

  // Target dari proposal
  targets: {
    accuracy: 0.85,
    precision: 0.8,
    f1: 0.82,
  },
};

export default function ResultsPage() {
  const metricsData = [
    {
      name: "Accuracy",
      value: RESULTS.accuracy,
      target: RESULTS.targets.accuracy,
    },
    {
      name: "Precision",
      value: RESULTS.precision,
      target: RESULTS.targets.precision,
    },
    { name: "Recall", value: RESULTS.recall, target: null },
    { name: "F1 Score", value: RESULTS.f1, target: RESULTS.targets.f1 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold uppercase tracking-wide text-2xl mb-2">
          Experimental Results
        </h1>
        <p className="text-sm text-neutral-400 max-w-3xl">
          Quantitative evaluation of the trained SVM classifier on the held-out
          test set. Metrics, confusion matrix, and honest assessment of model
          performance against proposal targets.
        </p>
      </div>

      {/* Top metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          icon={<Target className="w-4 h-4" />}
          label="Accuracy"
          value={(RESULTS.accuracy * 100).toFixed(2) + "%"}
          target={(RESULTS.targets.accuracy * 100) + "%"}
          met={RESULTS.accuracy >= RESULTS.targets.accuracy}
        />
        <MetricCard
          icon={<Target className="w-4 h-4" />}
          label="Precision"
          value={(RESULTS.precision * 100).toFixed(2) + "%"}
          target={(RESULTS.targets.precision * 100) + "%"}
          met={RESULTS.precision >= RESULTS.targets.precision}
        />
        <MetricCard
          icon={<Target className="w-4 h-4" />}
          label="Recall"
          value={(RESULTS.recall * 100).toFixed(2) + "%"}
          target={null}
        />
        <MetricCard
          icon={<Award className="w-4 h-4" />}
          label="F1 Score"
          value={RESULTS.f1.toFixed(4)}
          target={RESULTS.targets.f1.toFixed(2)}
          met={RESULTS.f1 >= RESULTS.targets.f1}
        />
      </div>

      {/* 2-col: chart + confusion matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart vs target */}
        <div className="bg-bg-card border border-border rounded-lg p-6">
          <h2 className="text-xs uppercase tracking-widest font-display font-bold text-neutral-400 mb-4">
            Metrics vs Proposal Targets
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricsData}>
                <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#525252" fontSize={11} />
                <YAxis
                  stroke="#525252"
                  fontSize={11}
                  domain={[0, 1]}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#141414",
                    border: "1px solid #262626",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => (v * 100).toFixed(2) + "%"}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {metricsData.map((entry, idx) => {
                    const met = entry.target ? entry.value >= entry.target : true;
                    return (
                      <Cell
                        key={idx}
                        fill={
                          entry.target === null
                            ? "#fb923c"
                            : met
                            ? "#22c55e"
                            : "#ef4444"
                        }
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-3 text-[10px] uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-success rounded-sm"></span>
              <span className="text-neutral-400">Met target</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-danger rounded-sm"></span>
              <span className="text-neutral-400">Below target</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-accent rounded-sm"></span>
              <span className="text-neutral-400">No target</span>
            </span>
          </div>
        </div>

        {/* Confusion Matrix */}
        <div className="bg-bg-card border border-border rounded-lg p-6">
          <h2 className="text-xs uppercase tracking-widest font-display font-bold text-neutral-400 mb-4">
            Confusion Matrix
          </h2>
          <ConfusionMatrix cm={RESULTS.confusionMatrix} />
        </div>
      </div>

      {/* Dataset stats */}
      <div className="bg-bg-card border border-border rounded-lg p-6">
        <h2 className="text-xs uppercase tracking-widest font-display font-bold text-neutral-400 mb-4">
          Dataset & Training Configuration
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatItem label="Total Patches" value={RESULTS.totalPatches.toLocaleString()} />
          <StatItem label="Training Set (80%)" value={RESULTS.trainSize.toLocaleString()} />
          <StatItem label="Test Set (20%)" value={RESULTS.testSize.toLocaleString()} />
          <StatItem label="Best C" value={String(RESULTS.bestC)} />
          <StatItem label="Best γ" value={RESULTS.bestGamma} />
          <StatItem label="CV F1 Score" value={RESULTS.cvF1.toFixed(4)} />
          <StatItem label="Feature Dim" value="1782" />
          <StatItem label="Patch Size" value="64×64" />
        </div>
      </div>

      {/* Honest analysis */}
      <div className="bg-bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-accent" />
          <h2 className="text-xs uppercase tracking-widest font-display font-bold">
            Discussion & Limitations
          </h2>
        </div>

        <div className="space-y-4 text-sm text-neutral-300 leading-relaxed">
          <p>
            The trained model achieves <span className="text-accent font-bold">F1 = {RESULTS.f1.toFixed(4)}</span>{" "}
            on a balanced test set of {RESULTS.testSize} patches, falling short of
            the proposal's accuracy and F1 targets. This honest result reveals
            the inherent trade-offs of classical ML for pothole detection:
          </p>

          <LimitationItem
            title="Random Patch Noise"
            desc="Without bounding box annotations, random crops from pothole-labeled images sometimes sample background asphalt regions, introducing label noise during training."
          />

          <LimitationItem
            title="Domain Shift"
            desc="Training images are predominantly close-up captures. Real-world dashcam frames present potholes at oblique angles, introducing distribution shift that classical features struggle to bridge."
          />

          <LimitationItem
            title="Hand-Crafted Feature Ceiling"
            desc="HOG and LBP capture structural and textural patterns but lack the representational flexibility of learned features (e.g., CNNs). For complex textures with high visual variance, performance plateaus around this range."
          />

          <LimitationItem
            title="Trade-off with Deployment Constraint"
            desc="The proposal explicitly targets CPU-only deployment for resource-constrained settings. This constraint precludes deep learning approaches that would likely achieve higher accuracy at the cost of GPU dependency."
          />
        </div>
      </div>

      {/* Future work */}
      <div className="bg-bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-4 h-4 text-accent rotate-180" />
          <h2 className="text-xs uppercase tracking-widest font-display font-bold">
            Future Work
          </h2>
        </div>
        <ul className="space-y-2 text-sm text-neutral-300">
          <li className="flex items-start gap-3">
            <span className="text-accent font-mono mt-0.5">›</span>
            <span>
              <strong>Hard negative mining</strong> — iteratively retrain with false
              positive samples from real-world frames to reduce confusion with
              non-pothole road artifacts.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-accent font-mono mt-0.5">›</span>
            <span>
              <strong>Cross-dataset evaluation</strong> — validate on entirely
              independent imagery from different geographic regions.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-accent font-mono mt-0.5">›</span>
            <span>
              <strong>Spatial localization</strong> — extend with sliding-window
              detection + NMS for bounding box output, enabling pothole mapping.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-accent font-mono mt-0.5">›</span>
            <span>
              <strong>Lightweight CNN baseline</strong> — compare against MobileNet
              variants to characterize the accuracy-efficiency trade-off frontier.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  target,
  met,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  target: string | null;
  met?: boolean;
}) {
  return (
    <div className="bg-bg-card border border-border rounded-lg px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-neutral-500">
          {label}
        </span>
        <span className="text-neutral-600">{icon}</span>
      </div>
      <div className="font-mono text-2xl font-bold text-white">{value}</div>
      {target !== null && (
        <div
          className={`text-[10px] mt-1 font-mono ${
            met ? "text-success" : "text-danger"
          }`}
        >
          {met ? "✓ ≥" : "✗ <"} target {target}
        </div>
      )}
    </div>
  );
}

function ConfusionMatrix({
  cm,
}: {
  cm: { TN: number; FP: number; FN: number; TP: number };
}) {
  const total = cm.TN + cm.FP + cm.FN + cm.TP;
  const cells = [
    { label: "TN", count: cm.TN, color: "bg-success/15 text-success border-success/30" },
    { label: "FP", count: cm.FP, color: "bg-danger/15 text-danger border-danger/30" },
    { label: "FN", count: cm.FN, color: "bg-danger/15 text-danger border-danger/30" },
    { label: "TP", count: cm.TP, color: "bg-success/15 text-success border-success/30" },
  ];

  return (
    <div>
      <div className="grid grid-cols-[auto_1fr_1fr] gap-1 text-xs">
        <div></div>
        <div className="text-center text-[10px] uppercase tracking-wider text-neutral-500 pb-1">
          Pred: Plain
        </div>
        <div className="text-center text-[10px] uppercase tracking-wider text-neutral-500 pb-1">
          Pred: Pothole
        </div>

        <div className="text-[10px] uppercase tracking-wider text-neutral-500 flex items-center pr-2">
          Actual<br />Plain
        </div>
        <CMCell {...cells[0]} pct={(cm.TN / total) * 100} />
        <CMCell {...cells[1]} pct={(cm.FP / total) * 100} />

        <div className="text-[10px] uppercase tracking-wider text-neutral-500 flex items-center pr-2">
          Actual<br />Pothole
        </div>
        <CMCell {...cells[2]} pct={(cm.FN / total) * 100} />
        <CMCell {...cells[3]} pct={(cm.TP / total) * 100} />
      </div>
    </div>
  );
}

function CMCell({
  label,
  count,
  color,
  pct,
}: {
  label: string;
  count: number;
  color: string;
  pct: number;
}) {
  return (
    <div className={`${color} border rounded p-4 text-center`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="font-mono text-2xl font-bold my-1">{count}</div>
      <div className="text-[10px] font-mono opacity-70">{pct.toFixed(1)}%</div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
        {label}
      </div>
      <div className="font-mono text-lg font-bold">{value}</div>
    </div>
  );
}

function LimitationItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="border-l-2 border-accent pl-4">
      <div className="font-display font-bold uppercase tracking-wide text-xs text-accent mb-1">
        {title}
      </div>
      <p className="text-sm text-neutral-300">{desc}</p>
    </div>
  );
}