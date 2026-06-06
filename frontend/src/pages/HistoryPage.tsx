import { useEffect, useState } from "react";
import { Trash2, RefreshCw, ChevronDown, ChevronRight, CheckCircle2, XCircle, Calendar, Clock } from "lucide-react";
import { api } from "../lib/api";
import type { Prediction } from "../types";
import ResultViewer from "../components/ResultViewer";

interface Props {
  refreshKey?: number;
}

export default function HistoryPage({ refreshKey }: Props) {
  const [items, setItems] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedData, setExpandedData] = useState<Prediction | null>(null);
  const [filter, setFilter] = useState<"all" | "pothole" | "clear">("all");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listPredictions(100, 0);
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
    if (!confirm("Delete this prediction and its files? This cannot be undone.")) return;
    try {
      await api.deletePrediction(id);
      setItems(items.filter((p) => p.id !== id));
      if (expandedId === id) {
        setExpandedId(null);
        setExpandedData(null);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleExpand = async (p: Prediction) => {
    if (expandedId === p.id) {
      setExpandedId(null);
      setExpandedData(null);
      return;
    }
    setExpandedId(p.id);
    setExpandedData(null);
    try {
      const full = await api.getPrediction(p.id);
      setExpandedData(full);
    } catch (e: any) {
      alert(e.message);
      setExpandedId(null);
    }
  };

  const filtered = items.filter((p) => {
    if (filter === "all") return true;
    const isPothole = p.potholeFrameCount > p.plainFrameCount;
    return filter === "pothole" ? isPothole : !isPothole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-bold uppercase tracking-wide text-lg">
            Analysis History
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            {items.length} prediction{items.length !== 1 ? "s" : ""} stored
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex bg-bg-card border border-border rounded overflow-hidden">
            <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>
              All
            </FilterBtn>
            <FilterBtn active={filter === "pothole"} onClick={() => setFilter("pothole")}>
              Pothole
            </FilterBtn>
            <FilterBtn active={filter === "clear"} onClick={() => setFilter("clear")}>
              Clear
            </FilterBtn>
          </div>

          <button
            onClick={load}
            className="p-2 bg-bg-card border border-border rounded text-neutral-400 hover:text-accent transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/30 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="bg-bg-card border border-border rounded-lg p-12 text-center">
          <div className="text-xs uppercase tracking-widest text-neutral-600 mb-2">
            {items.length === 0 ? "No predictions yet" : "No matches for current filter"}
          </div>
          <p className="text-sm text-neutral-500">
            {items.length === 0
              ? "Upload a video on the Home page to start analyzing"
              : "Try changing the filter above"}
          </p>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {filtered.map((p) => {
          const isExpanded = expandedId === p.id;
          const isPothole = p.potholeFrameCount > p.plainFrameCount;
          return (
            <div
              key={p.id}
              className="bg-bg-card border border-border rounded-lg overflow-hidden transition"
            >
              {/* Summary row — clickable */}
              <div
                onClick={() => handleExpand(p)}
                className="px-5 py-4 cursor-pointer hover:bg-bg-elevated transition flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                  )}

                  <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider flex-shrink-0 ${
                      p.status === "completed"
                        ? isPothole
                          ? "bg-danger/15 text-danger border border-danger/30"
                          : "bg-success/15 text-success border border-success/30"
                        : p.status === "failed"
                        ? "bg-danger/15 text-danger border border-danger/30"
                        : "bg-neutral-700 text-neutral-400"
                    }`}
                  >
                    {p.status === "completed" ? (
                      isPothole ? (
                        <>
                          <XCircle className="w-3 h-3" />
                          Pothole
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Clear
                        </>
                      )
                    ) : (
                      p.status
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {p.originalFilename}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-[11px] text-neutral-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}
                      </span>
                      {p.durationSeconds && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {p.durationSeconds.toFixed(1)}s
                        </span>
                      )}
                      {p.avgConfidence !== null && (
                        <span className="text-accent">
                          conf: {(p.avgConfidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right text-[11px] font-mono hidden md:block">
                    <div className="text-danger">
                      {p.potholeFrameCount} pothole
                    </div>
                    <div className="text-success">
                      {p.plainFrameCount} clear
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(p.id, e)}
                    className="p-2 text-neutral-500 hover:text-danger transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded content — video player + full result */}
              {isExpanded && (
                <div className="border-t border-border">
                  {expandedData ? (
                    <ResultViewer prediction={expandedData} embedded />
                  ) : (
                    <div className="p-8 text-center text-sm text-neutral-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Loading details...
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-xs uppercase tracking-wider font-bold transition ${
        active ? "bg-accent text-bg" : "text-neutral-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}