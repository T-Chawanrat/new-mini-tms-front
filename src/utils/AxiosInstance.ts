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
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

AxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenExpiredHandler();
    }
    return Promise.reject(error);
  }
);

export default AxiosInstance;