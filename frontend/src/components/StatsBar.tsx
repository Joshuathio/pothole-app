import { useEffect, useState } from "react";
import { Activity, Video, TrendingUp } from "lucide-react";
import { api } from "../lib/api";
import type { DashboardStats } from "../types";

interface Props {
  refreshKey?: number;
}

export default function StatsBar({ refreshKey }: Props) {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {});
  }, [refreshKey]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Stat
        icon={<Video className="w-4 h-4" />}
        label="Total Videos"
        value={stats.totalVideos}
      />
      <Stat
        icon={<Activity className="w-4 h-4" />}
        label="Pothole Frames"
        value={stats.totalPotholeFrames}
        accent="danger"
      />
      <Stat
        icon={<Activity className="w-4 h-4" />}
        label="Clear Frames"
        value={stats.totalPlainFrames}
        accent="success"
      />
      <Stat
        icon={<TrendingUp className="w-4 h-4" />}
        label="Avg Confidence"
        value={(stats.overallAvgConfidence * 100).toFixed(1) + "%"}
      />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: "danger" | "success";
}) {
  return (
    <div className="bg-bg-card border border-border rounded-lg px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-neutral-500">
          {label}
        </span>
        <span className="text-neutral-600">{icon}</span>
      </div>
      <div
        className={`font-mono text-xl font-bold ${
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
