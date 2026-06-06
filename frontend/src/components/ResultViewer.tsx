import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import type { Prediction } from "../types";
import { api } from "../lib/api";

interface Props {
  prediction: Prediction;
  embedded?: boolean;
}

export default function ResultViewer({ prediction, embedded = false }: Props) {
  const isPotholeOverall =
    prediction.potholeFrameCount > prediction.plainFrameCount;

  const chartData =
    prediction.frames?.map((f) => ({
      time: f.timestampSeconds?.toFixed(1) ?? f.frameIndex,
      confidence: f.confidence,
      isPothole: f.isPothole,
    })) ?? [];

  const containerClasses = embedded
    ? "bg-bg-card overflow-hidden"
    : "bg-bg-card border border-border rounded-lg overflow-hidden";

  return (
    <div className={containerClasses}>
      {!embedded && (
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold uppercase tracking-wide">
              Analysis Result
            </h2>
            <p className="text-xs text-neutral-500 mt-1 font-mono">
              {prediction.originalFilename}
            </p>
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs uppercase font-bold tracking-wider ${
              isPotholeOverall
                ? "bg-danger/15 text-danger border border-danger/30"
                : "bg-success/15 text-success border border-success/30"
            }`}
          >
            {isPotholeOverall ? (
              <>
                <XCircle className="w-4 h-4" />
                Pothole Detected
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Road Clear
              </>
            )}
          </div>
        </div>
      )}

      {/* Annotated video player */}
      {prediction.outputFilename && (
        <div className="bg-black flex justify-center">
          <video
            key={prediction.outputFilename}
            controls
            playsInline
            preload="metadata"
            className="w-full max-h-[500px]"
            src={api.videoUrl(prediction.outputFilename)}
          >
            Your browser does not support video playback.
          </video>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
        <StatBox label="Pothole Frames" value={prediction.potholeFrameCount} accent="danger" />
        <StatBox label="Plain Frames" value={prediction.plainFrameCount} accent="success" />
        <StatBox
          label="Avg Confidence"
          value={prediction.avgConfidence?.toFixed(3) ?? "—"}
        />
        <StatBox
          label="Max Confidence"
          value={prediction.maxConfidence?.toFixed(3) ?? "—"}
        />
      </div>

      {/* Confidence timeline */}
      {chartData.length > 0 && (
        <div className="p-6">
          <h3 className="text-xs uppercase tracking-wider text-neutral-400 mb-4 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Confidence Timeline
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis
                  dataKey="time"
                  stroke="#525252"
                  fontSize={10}
                  tickFormatter={(v) => `${v}s`}
                />
                <YAxis stroke="#525252" fontSize={10} domain={[0, 1]} />
                <Tooltip
                  contentStyle={{
                    background: "#141414",
                    border: "1px solid #262626",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => v.toFixed(3)}
                />
                <ReferenceLine
                  y={prediction.thresholdUsed ?? 0.55}
                  stroke="#fb923c"
                  strokeDasharray="3 3"
                  label={{
                    value: "Threshold",
                    fill: "#fb923c",
                    fontSize: 10,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="confidence"
                  stroke="#fb923c"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Metadata footer */}
      <div className="border-t border-border px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <MetaItem label="Resolution" value={`${prediction.width}×${prediction.height}`} />
        <MetaItem label="FPS" value={prediction.fps?.toFixed(1) ?? "—"} />
        <MetaItem
          label="Duration"
          value={prediction.durationSeconds ? `${prediction.durationSeconds.toFixed(1)}s` : "—"}
        />
        <MetaItem label="Total Frames" value={prediction.totalFrames ?? "—"} />
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "danger" | "success";
}) {
  return (
    <div className="bg-bg-card px-5 py-4">
      <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
        {label}
      </div>
      <div
        className={`font-mono text-2xl font-bold ${
          accent === "danger"
            ? "text-danger"
            : accent === "success"
            ? "text-success"
            : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-neutral-500 text-[10px] uppercase tracking-wider">
        {label}
      </div>
      <div className="font-mono mt-0.5">{value}</div>
    </div>
  );
}