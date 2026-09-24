import axios from "axios";

// ===============================
// BASE URL — env-la irundhu varum
// Local .env          : REACT_APP_API_URL=http://localhost:5000
// Production build/env: REACT_APP_API_URL=https://back.bullrise.in
// (env maathina REBUILD + REDEPLOY kattayam — React build time-la dhaan env padikkum)
// ===============================
const getBaseURL = () => {
  const configuredUrl =
    process.env.REACT_APP_API_URL || "http://localhost:5001";

  const trimmedUrl = configuredUrl.replace(/\/+$/, "");

  return trimmedUrl.endsWith("/api")
    ? trimmedUrl
    : `${trimmedUrl}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ===============================
// REQUEST INTERCEPTOR
// ===============================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ===============================
// RESPONSE INTERCEPTOR
// ===============================
api.interceptors.response.use(
  (response) => response,

  (error) => {
    // Backend not running / unreachable
    if (error.code === "ERR_NETWORK") {
      console.warn("Backend not reachable.");
      return Promise.reject(error);
    }

    // Unauthorized
    if (error.response?.status === 401) {
      console.warn("Unauthorized. Please login again.");

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Uncomment if you want auto redirect
      // window.location.href = "/login";
    }

    // Forbidden
    if (error.response?.status === 403) {
      console.warn("Admin access required.");
    }

    return Promise.reject(error);
  }
);

export default api;