import axios from "axios";

// Pada aplikasi terinstal, tampilan depan disajikan oleh backend itu sendiri,
// jadi alamatnya cukup relatif terhadap halaman ini. REACT_APP_BACKEND_URL
// hanya dipakai saat pengembangan atau kalau backend dijalankan terpisah.
const BACKEND = process.env.REACT_APP_BACKEND_URL || "";
export const API = `${BACKEND}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("pp_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  const lang = localStorage.getItem("pp_lang") === "en" ? "en" : "id";
  cfg.headers["Accept-Language"] = lang;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("pp_token");
      localStorage.removeItem("pp_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
