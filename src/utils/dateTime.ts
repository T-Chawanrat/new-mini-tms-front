import dayjs from "dayjs";

export const toInputDateTime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 16);
};

export const toThaiDateTime = (value: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export const toThaiDate = (value: string) => {
  if (!value) return "-";
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// ใช้แสดงวันที่ในรายงานด้วยปี ค.ศ. ตามรูปแบบเดิมของหน้ารายงาน
export const formatReportDate = (value: string | Date | null | undefined, fallback = "-") => {
  if (!value) return fallback;

  const date = dayjs(value);
  return date.isValid() ? date.format("DD/MM/YYYY") : fallback;
};

// ใช้แสดงวันที่และเวลาในรายงานด้วยปี ค.ศ. ตามรูปแบบเดิมของหน้ารายงาน
export const formatReportDateTime = (value: string | Date | null | undefined, fallback = "-") => {
  if (!value) return fallback;

  const date = dayjs(value);
  return date.isValid() ? date.format("DD/MM/YYYY HH:mm") : fallback;
};
