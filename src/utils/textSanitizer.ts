// client/src/utils/textSanitizer.ts

// remove all spaces from the input
export const removeSpaces = (value: string) => {
  return value.replace(/\s/g, "");
};

// input ทั่วไปที่เป็น code เช่น username, employee_code, license_no
// อนุญาต: อังกฤษ, ตัวเลข, underscore, dash
export const cleanCodeInput = (value: string) => {
  return removeSpaces(value).replace(/[^a-zA-Z0-9_-]/g, "");
};

// Name input
export const cleanNameInput = (value: string) => {
  return removeSpaces(value).replace(/[^ก-๙a-zA-Z]/g, "");
};

// Number input
export const cleanNumberInput = (value: string) => {
  return removeSpaces(value).replace(/\D/g, "");
};

// email
export const cleanEmailInput = (value: string) => {
  return removeSpaces(value).replace(/[^a-zA-Z0-9@._+-]/g, "");
};

// ใช้ normalize ค่าจาก Excel / API / form ให้เป็น string trim แล้ว
export const normalizeText = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

// ใช้เช็คค่าว่าง หลัง trim แล้ว
export const isBlankText = (value: unknown) => {
  return normalizeText(value) === "";
};

// ใช้กับเบอร์โทร เอาเฉพาะตัวเลข
export const cleanPhoneDigits = (value: string) => {
  return String(value || "").replace(/\D/g, "");
};

// ใช้ validate เบอร์โทรไทยแบบง่าย
export const isValidThaiPhone = (value: string) => {
  const tel = cleanPhoneDigits(value);

  if (!tel) return false;

  return tel.startsWith("0") && (tel.length === 9 || tel.length === 10);
};

// ใช้เช็ค id ที่มาจาก Excel เช่น subdistrict_id
export const isPositiveNumberText = (value: unknown) => {
  const text = normalizeText(value);
  const numberValue = Number(text);

  return Boolean(text) && Number.isFinite(numberValue) && numberValue > 0;
};

// ใช้ format วันที่ Excel serial หรือ string ธรรมดา สำหรับ preview
export const formatExcelPreviewDate = (value: string) => {
  if (!value) return "-";

  const serial = Number(value);

  if (Number.isFinite(serial) && serial > 20000) {
    const date = new Date((serial - 25569) * 86400 * 1000);

    if (!Number.isNaN(date.getTime())) {
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = date.getFullYear();

      return `${dd}/${mm}/${yyyy}`;
    }
  }

  return value;
};

export const formatDate = (
value: string | Date | null | undefined,
fallback = "-",
) => {
if (!value) {
return fallback;
}

const date = value instanceof Date ? value : new Date(value);

if (Number.isNaN(date.getTime())) {
return fallback;
}

return new Intl.DateTimeFormat("th-TH", {
day: "2-digit",
month: "2-digit",
year: "numeric",
}).format(date);
};


export const getText = (
  value: string | number | null | undefined,
  fallback = "-",
) => {
  const text = String(value ?? "").trim();

  return text || fallback;
};

export const formatCod = (
  value: string | number | null | undefined,
) => {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "";
  }

  return `COD ${amount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} บาท`;
};

// ใช้เทียบ Serial No จากช่องสแกนโดยไม่สนตัวพิมพ์เล็ก-ใหญ่
export const normalizeSerialText = (value: unknown) => {
  return normalizeText(value).toLowerCase();
};

// ใช้แสดงตัวเลขรูปแบบไทยในตารางและจำนวนรายการ
export const formatThaiNumber = (
  value: string | number | null | undefined,
  digits = 0,
) => {
  const numberValue = Number(value || 0);

  return (Number.isFinite(numberValue) ? numberValue : 0).toLocaleString("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

// ใช้แสดงวันและเวลารูปแบบไทยใน DataGrid
export const formatThaiDateTime = (
  value: string | Date | null | undefined,
  fallback = "-",
) => {
  if (!value) return fallback;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ใช้กับ option ที่มี code และ name
export const formatCodeNameOption = (option: {
  code?: string | null;
  name: string;
}) => {
  return option.code ? `${option.code} - ${option.name}` : option.name;
};
