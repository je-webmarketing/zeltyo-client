const API_BASE_URL = "https://zeltyo-app.onrender.com";

function buildApiUrl(path) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export { API_BASE_URL, buildApiUrl };