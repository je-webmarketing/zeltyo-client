const API_BASE = "http://localhost:3001";

export function buildApiUrl(path) {
  return `${API_BASE}${path}`;
}