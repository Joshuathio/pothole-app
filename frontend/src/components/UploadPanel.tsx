import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { api } from "../lib/api";
import type { Prediction } from "../types";

interface Props {
  onSuccess: (prediction: Prediction) => void;
}

export default function UploadPanel({ onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(0.55);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setError(null);
    const validExts = [".mp4", ".avi", ".mov", ".mkv", ".webm"];
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!validExts.includes(ext)) {
      setError(`Unsupported format. Use: ${validExts.join(", ")}`);
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      setError("File too large (max 100MB)");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsUploading(true);
    setProgress(0);
    setError(null);
    try {
      const prediction = await api.uploadVideo(
        file,
        { threshold },
        (p) => setProgress(p)
      );
      onSuccess(prediction);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="bg-bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-bold uppercase tracking-wide">
          Upload Video
        </h2>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-accent bg-accent/5"
            : "border-border hover:border-neutral-600"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileInput}
        />
        <Upload className="mx-auto w-10 h-10 text-neutral-500 mb-3" />
        {file ? (
          <div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-neutral-500 mt-1">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-neutral-300">
              Drop a video here, or click to browse
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              MP4, AVI, MOV, MKV, WEBM (max 100MB)
            </p>
          </div>
        )}
      </div>

      {/* Threshold control */}
      <div className="mt-5">
        <label className="flex items-center justify-between text-xs uppercase tracking-wider text-neutral-400 mb-2">
          <span>Detection Threshold</span>
          <span className="text-accent font-mono">{threshold.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min="0.3"
          max="0.9"
          step="0.05"
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          className="w-full accent-accent"
          disabled={isUploading}
        />
        <div className="flex justify-between text-[10px] text-neutral-600 mt-1">
          <span>More sensitive (0.30)</span>
          <span>More strict (0.90)</span>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-sm text-danger bg-danger/10 border border-danger/30 px-3 py-2 rounded">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {isUploading && (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-sm text-neutral-400 mb-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {progress < 100 ? "Uploading..." : "Processing..."}
          </div>
          <div className="h-1 bg-bg-elevated rounded overflow-hidden">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!file || isUploading}
        className="mt-5 w-full bg-accent text-bg font-display font-bold uppercase tracking-wider py-3 rounded hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        {isUploading ? "Processing..." : "Analyze Video"}
      </button>
    </div>
  );
}
