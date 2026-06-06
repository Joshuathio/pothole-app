import { useState } from "react";
import UploadPanel from "../components/UploadPanel";
import ResultViewer from "../components/ResultViewer";
import StatsBar from "../components/StatsBar";
import type { Prediction } from "../types";

interface Props {
  refreshKey: number;
  onUploadSuccess: () => void;
}

export default function HomePage({ refreshKey, onUploadSuccess }: Props) {
  const [current, setCurrent] = useState<Prediction | null>(null);

  const handleNewPrediction = (p: Prediction) => {
    setCurrent(p);
    onUploadSuccess();
  };

  return (
    <div className="space-y-6">
      <StatsBar refreshKey={refreshKey} />

      <UploadPanel onSuccess={handleNewPrediction} />

      {current ? (
        <ResultViewer prediction={current} />
      ) : (
        <div className="bg-bg-card border border-border rounded-lg p-12 text-center">
          <div className="text-xs uppercase tracking-widest text-neutral-600 mb-2">
            No video analyzed yet
          </div>
          <p className="text-sm text-neutral-500">
            Upload a video above to see analysis results
          </p>
        </div>
      )}
    </div>
  );
}