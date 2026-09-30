import AxiosInstance from "./AxiosInstance";

export const getUploadUrl = (value?: string | null) => {
  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;

  const baseUrl = (AxiosInstance.defaults.baseURL || "").replace(/\/$/, "");
  return `${baseUrl}/${value.replace(/^\/+/, "")}`;
};
