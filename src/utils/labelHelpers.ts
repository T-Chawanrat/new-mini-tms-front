import type { LabelFilters, LabelRow } from "../types/label";
import { normalizeText } from "./textSanitizer";

export const getText = (value: unknown, fallback = "-") => {
  const text = normalizeText(value);
  return text || fallback;
};

export const formatNumber = (value: unknown, digits = 0) => {
  const numberValue = Number(value || 0);

  if (!Number.isFinite(numberValue)) return "0";

  return numberValue.toLocaleString("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

export const formatMoney = (value: unknown) => {
  const numberValue = Number(value || 0);

  if (!Number.isFinite(numberValue)) return "0.00";

  return numberValue.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatDate = (value: string | Date | null) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export const formatDateTime = (value: string | Date | null) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getFullAddress = (row: LabelRow) => {
  return [
    row.address,
    row.subdistrict_name,
    // row.district_name,
    row.province_name,
    row.zip_code,
  ]
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .join(" ");
};

export const buildLabelReceiveQueryParams = (
  filters: LabelFilters,
  page: number,
  limit: number,
) => {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));

  Object.entries(filters).forEach(([key, value]) => {
    const text = normalizeText(value);

    if (text) {
      params.set(key, text);
    }
  });

  return params;
};

export const buildLabelSerialQueryParams = (
  receiveCode: string,
  serialNo = "",
) => {
  const params = new URLSearchParams();

  params.set("receive_code", receiveCode);
  params.set("page", "1");
  params.set("limit", "500");

  const cleanSerialNo = normalizeText(serialNo);

  if (cleanSerialNo) {
    params.set("serial_no", cleanSerialNo);
  }

  return params;
};