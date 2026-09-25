import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const reqUrl = error.config?.url
        ? `${error.config.baseURL || ""}${error.config.url}`
        : "Unknown URL";
      const statusCode = error.response.status;
      const backendMessage =
        error.response.data?.message || "No response message provided";

      console.warn("[AUTH TOKEN REMOVAL TRACE]", {
        source: "api.interceptors.response",
        reason: "401 Unauthorized response received (token NOT removed)",
        requestUrl: reqUrl,
        statusCode: statusCode,
        backendResponseMessage: backendMessage,
      });
    }

    return Promise.reject(error);
  }
);

export default api;