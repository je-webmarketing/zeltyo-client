export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/+$/, "");

export function buildApiUrl(path) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}