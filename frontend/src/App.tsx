import { useState } from "react";
import { Home, History, BookOpen, BarChart3, Info } from "lucide-react";
import HomePage from "./pages/HomePage";
import HistoryPage from "./pages/HistoryPage";
import MethodologyPage from "./pages/MethodologyPage";
import ResultsPage from "./pages/ResultsPage";
import AboutPage from "./pages/AboutPage";

type Page = "home" | "history" | "methodology" | "results" | "about";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="min-h-screen bg-bg text-white">
      <header className="border-b border-border sticky top-0 z-10 bg-bg/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-baseline gap-3">
            <h1 className="font-display font-bold text-xl tracking-tight">
              POTHOLE<span className="text-accent">.</span>DETECT
            </h1>
            <span className="text-[10px] uppercase tracking-widest text-neutral-500 hidden md:inline">
              Classical ML · HOG + LBP + SVM
            </span>
          </div>

          <nav className="flex items-center gap-1 flex-wrap">
            <NavButton
              active={page === "home"}
              onClick={() => setPage("home")}
              icon={<Home className="w-4 h-4" />}
              label="Home"
            />
            <NavButton
              active={page === "history"}
              onClick={() => setPage("history")}
              icon={<History className="w-4 h-4" />}
              label="History"
            />
            <NavButton
              active={page === "methodology"}
              onClick={() => setPage("methodology")}
              icon={<BookOpen className="w-4 h-4" />}
              label="Methodology"
            />
            <NavButton
              active={page === "results"}
              onClick={() => setPage("results")}
              icon={<BarChart3 className="w-4 h-4" />}
              label="Results"
            />
            <NavButton
              active={page === "about"}
              onClick={() => setPage("about")}
              icon={<Info className="w-4 h-4" />}
              label="About"
            />
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {page === "home" && (
          <HomePage refreshKey={refreshKey} onUploadSuccess={triggerRefresh} />
        )}
        {page === "history" && <HistoryPage refreshKey={refreshKey} />}
        {page === "methodology" && <MethodologyPage />}
        {page === "results" && <ResultsPage />}
        {page === "about" && <AboutPage />}
      </main>

      <footer className="border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4 text-[10px] uppercase tracking-widest text-neutral-600 font-mono flex justify-between flex-wrap gap-2">
          <span>Pothole Detection · Classical ML Pipeline</span>
          <span>Backend: Flask · DB: PostgreSQL</span>
        </div>
      </footer>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded text-xs uppercase tracking-wider font-bold transition ${
        active
          ? "bg-accent/15 text-accent"
          : "text-neutral-400 hover:text-white hover:bg-bg-elevated"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}