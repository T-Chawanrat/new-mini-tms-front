import axios from "axios";

const AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

let tokenExpiredHandler: () => void = () => {};

export const setTokenExpiredHandler = (fn: () => void) => {
  tokenExpiredHandler = fn;
};

AxiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

AxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    // ✅ endpoint login ไม่ต้องถือว่า token หมดอายุ
    const isLoginRequest =
      url.includes("/login") ||
      url.includes("/auth/login") ||
      url.includes("/select-warehouse");

    if (status === 401 && !isLoginRequest) {
      tokenExpiredHandler();
    }

    return Promise.reject(error);
  }
);

export default AxiosInstance;
