// import axios from "axios";

// const AxiosInstance = axios.create({
//   baseURL: import.meta.env.VITE_API_URL as string,
// });

// export default AxiosInstance;

import axios from "axios";

const AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// 🔥 ใส่ token อัตโนมัติทุก request
AxiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default AxiosInstance;