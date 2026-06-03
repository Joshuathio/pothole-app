export interface FramePrediction {
  frameIndex: number;
  timestampSeconds: number | null;
  confidence: number;
  isPothole: boolean;
}

export interface Prediction {
  id: number;
  originalFilename: string;
  storedFilename: string;
  outputFilename: string | null;
  fileSizeBytes: number | null;
  durationSeconds: number | null;
  totalFrames: number | null;
  fps: number | null;
  width: number | null;
  height: number | null;
  potholeFrameCount: number;
  plainFrameCount: number;
  avgConfidence: number | null;
  maxConfidence: number | null;
  thresholdUsed: number | null;
  scalesUsed: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  errorMessage: string | null;
  createdAt: string | null;
  completedAt: string | null;
  frames?: FramePrediction[];
}

export interface PredictionList {
  total: number;
  limit: number;
  offset: number;
  items: Prediction[];
}

export interface DashboardStats {
  totalVideos: number;
  completed: number;
  failed: number;
  totalPotholeFrames: number;
  totalPlainFrames: number;
  overallAvgConfidence: number;
}
