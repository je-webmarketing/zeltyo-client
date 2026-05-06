import { buildApiUrl } from "../config/api";

export function buildApiUrl(path) {
  return `${API_BASE}${path}`;
}