import type { Prediction, PredictionList, DashboardStats } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  async uploadVideo(
    file: File,
    options: { threshold?: number; scales?: string } = {},
    onProgress?: (percent: number) => void
  ): Promise<Prediction> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("video", file);
      if (options.threshold !== undefined) {
        formData.append("threshold", String(options.threshold));
      }
      if (options.scales) {
        formData.append("scales", options.scales);
      }

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/predictions`);

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            onProgress((e.loaded / e.total) * 100);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          let msg = `Upload failed: ${xhr.status}`;
          try {
            msg = JSON.parse(xhr.responseText).error || msg;
          } catch {
            // ignore
          }
          reject(new Error(msg));
        }
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(formData);
    });
  },

  async listPredictions(limit = 50, offset = 0): Promise<PredictionList> {
    const res = await fetch(
      `${API_BASE}/predictions?limit=${limit}&offset=${offset}`
    );
    return handleResponse(res);
  },

  async getPrediction(id: number): Promise<Prediction> {
    const res = await fetch(`${API_BASE}/predictions/${id}`);
    return handleResponse(res);
  },

  async deletePrediction(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/predictions/${id}`, {
      method: "DELETE",
    });
    return handleResponse(res);
  },

  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/predictions/stats`);
    return handleResponse(res);
  },

  videoUrl(filename: string): string {
    return `${API_BASE}/videos/${filename}`;
  },
};
