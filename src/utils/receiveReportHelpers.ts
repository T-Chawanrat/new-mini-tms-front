import type { Filters } from "../types/receiveReport";

export const defaultReceiveReportFilters: Filters = {
  receive_date_from: "",
  receive_code: "",
  serial_no: "",
  customer_id: "",
  to_warehouse_id: "",
};
export const receiveReportHeaders = [
  "#",
  "Receive Code",
  "Receive Date",
  "Delivery Date",
  "Serial",
  "Cost",
  "COD",
  "Customer",
  "Type",
  "To Warehouse",
  "Shipper",
  "Recipient",
  "Tel",
  "Province",
];

export const receiveReportMinWidths: Record<number, number> = {
  0: 60,
  1: 150,
  2: 150,
  3: 130,
  4: 90,
  5: 110,
  6: 110,
  7: 180,
  8: 90,
  9: 180,
  10: 150,
  11: 220,
  12: 120,
  13: 190,
};

export const receiveSerialHeaders = ["Serial No", "Package", "Cost", "COD", "Size", "Returned", "Remark"];

export const receiveSerialMinWidths: Record<number, number> = {
  0: 180,
  1: 220,
  2: 100,
  3: 100,
  4: 150,
  5: 110,
  6: 220,
};

export const formatDate = (value: string | null) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export const formatDateTime = (value: string | null) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatNumber = (value: number | string | null | undefined, digits = 0) => {
  const numberValue = Number(value || 0);

  return numberValue.toLocaleString("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

export const formatMoney = (value: number | string | null | undefined) => {
  return formatNumber(value, 2);
};

export const getText = (value: string | number | null | undefined) => {
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
};

export const getReturnedText = (value: string | null) => {
  const text = getText(value);

  if (text === "Y" || text === "1") return "Returned";

  return "-";
};

export const buildReceiveReportQueryParams = (filters: Filters, page: number, limit: number): URLSearchParams => {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));

  Object.entries(filters).forEach(([key, value]) => {
    const cleanValue = String(value || "").trim();

    if (cleanValue) {
      params.set(key, cleanValue);
    }
  });

  return params;
};
