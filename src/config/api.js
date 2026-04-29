const API_BASE = "https://zeltyo-backend.onrender.com";

export function buildApiUrl(path) {
  return `${API_BASE}${path}`;
}