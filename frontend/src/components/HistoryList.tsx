import { useEffect, useState } from "react";
import { Trash2, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import type { Prediction } from "../types";

interface Props {
  onSelect: (prediction: Prediction) => void;
  selectedId?: number;
  refreshKey?: number;
}

export default function HistoryList({ onSelect, selectedId, refreshKey }: Props) {
  const [items, setItems] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listPredictions(50, 0);
      setItems(data.items);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this prediction and its files?")) return;
    try {
      await api.deletePrediction(id);
      setItems(items.filter((p) => p.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSelect = async (p: Prediction) => {
    // Fetch full data with frames
    try {
      const full = await api.getPrediction(p.id);
      onSelect(full);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-wider font-display font-bold">
          History
        </h2>
        <button
          onClick={load}
          className="text-neutral-500 hover:text-accent transition"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {error && (
          <div className="p-4 text-xs text-danger">{error}</div>
        )}
        {!loading && items.length === 0 && (
          <div className="p-6 text-center text-xs text-neutral-500">
            No predictions yet. Upload a video to start.
          </div>
        )}
        {items.map((p) => {
          const isPothole = p.potholeFrameCount > p.plainFrameCount;
          return (
            <div
              key={p.id}
              onClick={() => handleSelect(p)}
              className={`px-4 py-3 border-b border-border last:border-b-0 cursor-pointer transition group ${
                selectedId === p.id
                  ? "bg-accent/5 border-l-2 border-l-accent"
                  : "hover:bg-bg-elevated"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate font-medium">
                    {p.originalFilename}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold ${
                        p.status === "completed"
                          ? isPothole
                            ? "bg-danger/15 text-danger"
                            : "bg-success/15 text-success"
                          : p.status === "failed"
                          ? "bg-danger/15 text-danger"
                          : "bg-neutral-700 text-neutral-400"
                      }`}
                    >
                      {p.status === "completed"
                        ? isPothole
                          ? "Pothole"
                          : "Clear"
                        : p.status}
                    </span>
                    {p.avgConfidence !== null && (
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {(p.avgConfidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-600 mt-1 font-mono">
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleString()
                      : ""}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(p.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-danger transition p-1"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
