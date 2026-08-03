// src/pages/BillImport.tsx

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import ResizableColumns from "../components/ResizableColumns";
import { useAuth } from "../context/AuthContext";
import AxiosInstance from "../utils/AxiosInstance";
import CustomerDropdown, { type Customer } from "../components/dropdown/CustomerDropdown";
import { normalizeText, isBlankText, isValidThaiPhone, isPositiveNumberText, formatExcelPreviewDate } from "../utils/textSanitizer";

type ImportRow = {
  NO_BILL: string;
  REFERENCE: string;
  SEND_DATE: string;
  SHIPPER_CODE: string;
  RECIPIENT_CODE: string;
  RECIPIENT_NAME: string;
  RECIPIENT_TEL: string;
  RECIPIENT_ADDRESS: string;
  RECIPIENT_SUBDISTRICT: string;
  RECIPIENT_DISTRICT: string;
  RECIPIENT_PROVINCE: string;
  RECIPIENT_ZIPCODE: string;
  IS_DOCUMENT_RETURN: string;
  DOCUMENT_RETURN_CODE: string;
  PAYMENT_TYPE_ID: string;
  IS_COD: string;
  COD: string;
  PICKUP: string;
  NOTE: string;
  URL: string;
  PACKAGE_CODE: string;
  WEIGHT: string;
  WIDTH: string;
  HEIGHT: string;
  LENGTH: string;
  Q: string;
  IS_SERIAL_NO: string;
  SERIAL_NO: string;
  subdistrict_id: string;
};

type ImportResponse = {
  success?: boolean;
  message?: string;
  total_rows?: number;
  inserted_rows?: number;

  // เผื่อ backend เก่า/อนาคต
  receive_count?: number;
  detail_count?: number;
  error?: string;
};

const excelColumns: Array<keyof ImportRow> = [
  "NO_BILL",
  "REFERENCE",
  "SEND_DATE",
  "SHIPPER_CODE",
  "RECIPIENT_CODE",
  "RECIPIENT_NAME",
  "RECIPIENT_TEL",
  "RECIPIENT_ADDRESS",
  "RECIPIENT_SUBDISTRICT",
  "RECIPIENT_DISTRICT",
  "RECIPIENT_PROVINCE",
  "RECIPIENT_ZIPCODE",
  "IS_DOCUMENT_RETURN",
  "DOCUMENT_RETURN_CODE",
  "PAYMENT_TYPE_ID",
  "IS_COD",
  "COD",
  "PICKUP",
  "NOTE",
  "URL",
  "PACKAGE_CODE",
  "WEIGHT",
  "WIDTH",
  "HEIGHT",
  "LENGTH",
  "Q",
  "IS_SERIAL_NO",
  "SERIAL_NO",
  "subdistrict_id",
];

const headers = ["ลำดับ", ...excelColumns];

const normalizeRow = (row: Record<string, unknown>): ImportRow => {
  const normalized: Partial<ImportRow> = {};

  excelColumns.forEach((column) => {
    normalized[column] = normalizeText(row[column]);
  });

  return normalized as ImportRow;
};

const findDuplicateSerials = (rows: ImportRow[]) => {
  const count: Record<string, number> = {};

  rows.forEach((row) => {
    const serialNo = row.SERIAL_NO?.trim();

    if (!serialNo) return;

    count[serialNo] = (count[serialNo] || 0) + 1;
  });

  return count;
};

const findInvalidPhoneRows = (rows: ImportRow[]) => {
  const invalid: Record<number, boolean> = {};

  rows.forEach((row, index) => {
    if (!isValidThaiPhone(row.RECIPIENT_TEL)) {
      invalid[index] = true;
    }
  });

  return invalid;
};

const findBlankShipperCodeRows = (rows: ImportRow[]) => {
  const invalid: Record<number, boolean> = {};

  rows.forEach((row, index) => {
    if (isBlankText(row.SHIPPER_CODE)) {
      invalid[index] = true;
    }
  });

  return invalid;
};

const findInvalidSubdistrictRows = (rows: ImportRow[]) => {
  const invalid: Record<number, boolean> = {};

  rows.forEach((row, index) => {
    // invalid ฝั่ง frontend = ว่าง / ไม่ใช่ตัวเลข / <= 0
    if (!isPositiveNumberText(row.subdistrict_id)) {
      invalid[index] = true;
    }
  });

  return invalid;
};

const buildDuplicateSerialRowMap = (rows: ImportRow[], duplicates: Record<string, number>) => {
  const map: Record<number, boolean> = {};

  rows.forEach((row, index) => {
    const serialNo = row.SERIAL_NO?.trim();

    if (serialNo && duplicates[serialNo] > 1) {
      map[index] = true;
    }
  });

  return map;
};

export default function BillImport() {
  const { user } = useAuth();

  const authUser = user as
    | {
        user_id?: number | string;
        id?: number | string;
        role_id?: number | string;
        customer_id?: number | string | null;
        first_name?: string;
        username?: string;
      }
    | null
    | undefined;

  const [customerId, setCustomerId] = useState("");
  const [customerText, setCustomerText] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);

  const [loadingFile, setLoadingFile] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedCustomerId = String(authUser?.customer_id || customerId || "");

  const isCustomerUser = Number(authUser?.role_id) === 2;

  const duplicates = useMemo(() => findDuplicateSerials(rows), [rows]);

  const duplicateSerialRows = useMemo(() => {
    return buildDuplicateSerialRowMap(rows, duplicates);
  }, [rows, duplicates]);

  const invalidPhoneRows = useMemo(() => findInvalidPhoneRows(rows), [rows]);

  const blankShipperCodeRows = useMemo(() => findBlankShipperCodeRows(rows), [rows]);

  const invalidSubdistrictRows = useMemo(() => findInvalidSubdistrictRows(rows), [rows]);

  const duplicateSerialValueCount = useMemo(() => {
    return Object.values(duplicates).filter((count) => count > 1).length;
  }, [duplicates]);

  const duplicateSerialRowCount = useMemo(() => {
    return Object.values(duplicateSerialRows).filter(Boolean).length;
  }, [duplicateSerialRows]);

  const invalidPhoneCount = useMemo(() => {
    return Object.values(invalidPhoneRows).filter(Boolean).length;
  }, [invalidPhoneRows]);

  const blankShipperCodeCount = useMemo(() => {
    return Object.values(blankShipperCodeRows).filter(Boolean).length;
  }, [blankShipperCodeRows]);

  const invalidSubdistrictCount = useMemo(() => {
    return Object.values(invalidSubdistrictRows).filter(Boolean).length;
  }, [invalidSubdistrictRows]);

  const hasDuplicateSerial = duplicateSerialRowCount > 0;
  const hasInvalidPhone = invalidPhoneCount > 0;
  const hasBlankShipperCode = blankShipperCodeCount > 0;
  const hasInvalidSubdistrict = invalidSubdistrictCount > 0;

  const hasValidationError = hasDuplicateSerial || hasInvalidPhone || hasBlankShipperCode || hasInvalidSubdistrict;

  const billCount = useMemo(() => {
    const set = new Set<string>();

    rows.forEach((row) => {
      if (row.NO_BILL) set.add(row.NO_BILL);
    });

    return set.size;
  }, [rows]);

  const disabledReason = !selectedCustomerId
    ? "ยังไม่ได้เลือกเจ้าของงาน"
    : !file
      ? "ยังไม่ได้เลือกไฟล์ Excel"
      : loadingFile
        ? "กำลังอ่านไฟล์"
        : saving
          ? "กำลังบันทึก"
          : !rows.length
            ? "อ่านข้อมูล Excel ไม่ได้ / ไม่มี rows"
            : "";

  useEffect(() => {
    if (authUser?.customer_id) {
      const customerIdText = String(authUser.customer_id);

      setCustomerId(customerIdText);
      setCustomerText(customerIdText);
    }
  }, [authUser?.customer_id]);

  const clearFile = () => {
    setFile(null);
    setFileName("");
    setRows([]);
    setError(null);
    setSuccess(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;

    setFile(null);
    setFileName("");
    setRows([]);
    setError(null);
    setSuccess(null);

    if (!selectedFile) return;

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setLoadingFile(true);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;

        if (!data) {
          setError("ไม่สามารถอ่านไฟล์ได้");
          return;
        }

        const workbook = XLSX.read(data, {
          type: "array",
          cellDates: false,
          raw: false,
        });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
          setFile(null);
          setFileName("");
          setRows([]);
          setError("ไม่พบ Sheet ในไฟล์ Excel");
          return;
        }

        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          defval: "",
          raw: false,
        });

        const normalizedRows = json.map(normalizeRow).filter((row) => excelColumns.some((column) => row[column]));

        setRows(normalizedRows);

        // ไม่ setError สำหรับ validation จากข้อมูล Excel ตรงนี้
        // เพราะมี badge + แถบสีในตารางแสดงอยู่แล้ว
        // setError จะใช้เฉพาะกรณีอ่านไฟล์พัง / ไม่มี sheet / import backend fail เท่านั้น
      } catch (err) {
        console.error(err);
        setFile(null);
        setFileName("");
        setRows([]);
        setError("ไฟล์ไม่ถูกต้องหรืออ่านไม่สำเร็จ");
      } finally {
        setLoadingFile(false);
      }
    };

    reader.onerror = () => {
      setFile(null);
      setFileName("");
      setRows([]);
      setError("เกิดข้อผิดพลาดในการอ่านไฟล์");
      setLoadingFile(false);
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleSave = async () => {
    if (!selectedCustomerId) {
      setError("กรุณาเลือก Customer ก่อนนำเข้า");
      return;
    }

    if (!file) {
      setError("กรุณาเลือกไฟล์ Excel");
      return;
    }

    if (!rows.length) {
      setError("ไม่พบข้อมูลในไฟล์ Excel");
      return;
    }

    if (hasDuplicateSerial || hasInvalidPhone || hasBlankShipperCode || hasInvalidSubdistrict) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("customer_id", String(selectedCustomerId));

      const res = await AxiosInstance.post<ImportResponse>("/create/receives/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess(`นำเข้าสำเร็จ: ทั้งหมด ${res.data?.total_rows ?? rows.length} แถว, บันทึกแล้ว ${res.data?.inserted_rows ?? rows.length} แถว`);

      setFile(null);
      setFileName("");
      setRows([]);
    } catch (err) {
      console.error(err);

      if (axios.isAxiosError<ImportResponse>(err)) {
        setError(err.response?.data?.message || err.response?.data?.error || "นำเข้า Excel ไม่สำเร็จ");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("นำเข้า Excel ไม่สำเร็จ");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`font-thai min-h-[80vh] w-full bg-slate-50 px-1 py-2 ${loadingFile || saving ? "cursor-wait" : ""}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-800">นำเข้าบิลจาก Excel</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-600">
            ผู้ใช้: <span className="font-semibold text-slate-800">{authUser?.first_name || authUser?.username || "-"}</span>
          </div>

          <div className="rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-600">
            บิล: <span className="font-semibold text-slate-800">{billCount.toLocaleString("th-TH")}</span>
          </div>

          <div className="rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-600">
            แถว: <span className="font-semibold text-slate-800">{rows.length.toLocaleString("th-TH")}</span>
          </div>
        </div>
      </div>

      <div className="mb-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-[480px_1fr_auto] xl:items-end">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Customer</label>

            {isCustomerUser ? (
              <input
                className="h-8 w-full rounded-md border border-slate-300 bg-slate-100 px-2 text-xs text-slate-700"
                value={selectedCustomerId || "-"}
                disabled
              />
            ) : (
              <div className={saving ? "pointer-events-none opacity-70" : ""}>
                <CustomerDropdown
                  value={customerText}
                  onChange={(customer: Customer | null, inputText?: string) => {
                    setCustomerText(inputText || "");

                    if (customer) {
                      setCustomerId(String(customer.id));
                    } else {
                      setCustomerId("");
                    }

                    setError(null);
                    setSuccess(null);
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">ไฟล์ Excel</label>

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex h-8 cursor-pointer items-center rounded-md border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                เลือกไฟล์
                <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
              </label>

              <a
                href="/tamplates/import.xlsx"
                download
                className="inline-flex h-8 items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                โหลด Template Excel
              </a>

              <span className="h-8 max-w-[420px] truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-600">
                {fileName || "ยังไม่ได้เลือกไฟล์"}
              </span>

              {file && (
                <button
                  type="button"
                  onClick={clearFile}
                  disabled={saving || loadingFile}
                  className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-600 hover:bg-slate-50"
                >
                  ล้างไฟล์
                </button>
              )}

              {loadingFile && <span className="text-xs text-slate-500">กำลังอ่านไฟล์...</span>}
            </div>
          </div>

          <div className="flex items-end justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={Boolean(disabledReason) || hasValidationError}
              title={disabledReason}
              className={`h-8 rounded-md px-4 text-xs font-semibold ${
                Boolean(disabledReason) || hasValidationError
                  ? "cursor-not-allowed bg-slate-300 text-slate-500"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>

        {hasValidationError && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {hasDuplicateSerial && (
              <span className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                SERIAL_NO ซ้ำ {duplicateSerialValueCount} ค่า / {duplicateSerialRowCount} แถว
              </span>
            )}

            {hasInvalidPhone && (
              <span className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                เบอร์โทรผิด {invalidPhoneCount} แถว
              </span>
            )}

            {hasBlankShipperCode && (
              <span className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                SHIPPER_CODE ว่าง {blankShipperCodeCount} แถว
              </span>
            )}

            {hasInvalidSubdistrict && (
              <span className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                subdistrict_id ผิด {invalidSubdistrictCount} แถว
              </span>
            )}
          </div>
        )}

        {disabledReason && (
          <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">{disabledReason}</div>
        )}
      </div>

      {error && <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">{error}</div>}

      {success && <div className="mb-2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs text-emerald-700">{success}</div>}

      <div className="rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="max-h-[72vh] overflow-auto rounded-md">
          {!rows.length && !loadingFile && <div className="p-4 text-center text-sm text-slate-500">ยังไม่มีข้อมูล กรุณาเลือกไฟล์ Excel</div>}

          {rows.length > 0 && (
            <table className="min-w-max border-collapse text-[12px]">
              <ResizableColumns
                headers={headers}
                pageKey="bill-import-v2"
                minWidths={{
                  0: 56,
                  1: 90,
                  2: 130,
                  3: 100,
                  4: 110,
                  5: 120,
                  6: 120,
                  7: 220,
                  8: 120,
                  9: 260,
                  10: 130,
                  11: 130,
                  12: 130,
                  13: 110,
                  14: 130,
                  15: 160,
                  16: 120,
                  17: 80,
                  18: 80,
                  19: 110,
                  20: 180,
                  21: 160,
                  22: 120,
                  23: 80,
                  24: 80,
                  25: 80,
                  26: 80,
                  27: 80,
                  28: 120,
                  29: 240,
                  30: 120,
                }}
              />

              <tbody>
                {rows.map((row, index) => {
                  const serialNo = row.SERIAL_NO?.trim();

                  const isDuplicateSerial = Boolean(serialNo && duplicates[serialNo] > 1);
                  const isInvalidPhone = Boolean(invalidPhoneRows[index]);
                  const isBlankShipperCode = Boolean(blankShipperCodeRows[index]);
                  const isInvalidSubdistrict = Boolean(invalidSubdistrictRows[index]);

                  const isErrorRow = isDuplicateSerial || isInvalidPhone || isBlankShipperCode || isInvalidSubdistrict;

                  return (
                    <tr
                      key={`${row.NO_BILL}-${row.SERIAL_NO}-${index}`}
                      className={
                        isErrorRow ? "bg-red-200 hover:bg-red-300" : index % 2 === 0 ? "bg-white hover:bg-blue-50" : "bg-slate-50 hover:bg-blue-50"
                      }
                    >
                      <td
                        className={
                          isErrorRow
                            ? "sticky left-0 z-10 border-b border-red-300 bg-red-300 px-2 py-1.5 text-center font-bold text-red-900"
                            : "sticky left-0 z-10 border-b border-slate-200 bg-gray-100 px-2 py-1.5 text-center font-semibold text-slate-700"
                        }
                      >
                        {index + 1}
                      </td>

                      {excelColumns.map((column) => {
                        const rawValue = row[column];

                        const value = column === "SEND_DATE" ? formatExcelPreviewDate(rawValue) : rawValue || "-";

                        const isSerialColumn = column === "SERIAL_NO";
                        const isTelColumn = column === "RECIPIENT_TEL";
                        const isShipperCodeColumn = column === "SHIPPER_CODE";

                        const isRecipientAddressColumn =
                          column === "RECIPIENT_SUBDISTRICT" ||
                          column === "RECIPIENT_DISTRICT" ||
                          column === "RECIPIENT_PROVINCE" ||
                          column === "subdistrict_id";

                        const isBadCell =
                          (isDuplicateSerial && isSerialColumn) ||
                          (isInvalidPhone && isTelColumn) ||
                          (isBlankShipperCode && isShipperCodeColumn) ||
                          (isInvalidSubdistrict && isRecipientAddressColumn);

                        return (
                          <td
                            key={column}
                            className={
                              isBadCell
                                ? "max-w-[300px] truncate border-b border-red-300 bg-red-400 px-2 py-1.5 font-bold text-white"
                                : isErrorRow
                                  ? "max-w-[300px] truncate border-b border-red-300 bg-red-200 px-2 py-1.5 text-red-950"
                                  : "max-w-[300px] truncate border-b border-slate-200 px-2 py-1.5 text-slate-700"
                            }
                            title={String(value)}
                          >
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
