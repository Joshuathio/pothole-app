import { useState } from "react";
import UploadPanel from "./components/UploadPanel";
import ResultViewer from "./components/ResultViewer";
import HistoryList from "./components/HistoryList";
import StatsBar from "./components/StatsBar";
import type { Prediction } from "./types";

export default function App() {
  const [current, setCurrent] = useState<Prediction | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNewPrediction = (p: Prediction) => {
    setCurrent(p);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-bg text-white">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="font-display font-bold text-xl tracking-tight">
              POTHOLE<span className="text-accent">.</span>DETECT
            </h1>
            <span className="text-[10px] uppercase tracking-widest text-neutral-500">
              Classical ML · HOG + LBP + SVM
            </span>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-neutral-600 font-mono">
            v0.1
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <StatsBar refreshKey={refreshKey} />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <UploadPanel onSuccess={handleNewPrediction} />
            {current && <ResultViewer prediction={current} />}
            {!current && (
              <div className="bg-bg-card border border-border rounded-lg p-12 text-center">
                <div className="text-xs uppercase tracking-widest text-neutral-600 mb-2">
                  No video selected
                </div>
                <p className="text-sm text-neutral-500">
                  Upload a video or pick one from history to view results
                </p>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <aside>
            <HistoryList
              onSelect={setCurrent}
              selectedId={current?.id}
              refreshKey={refreshKey}
            />
          </aside>
        </div>
      </main>

      <footer className="border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-600 font-mono flex justify-between">
          <span>Pothole Detection · Classical ML Pipeline</span>
          <span>Backend: Flask · DB: PostgreSQL</span>
        </div>
      </footer>
    </div>
  );
}
