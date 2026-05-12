import React from "react";
import { useState, ChangeEvent, useMemo } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import ResizableColumns from "../components/ResizableColumns";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import AxiosInstance from "../utils/AxiosInstance";
import { DownloadIcon } from "lucide-react";

type ImportRow = {
  NO_BILL: string;
  REFERENCE: string;
  SEND_DATE: string | number;
  SHIPPER_CODE: string;
  RECIPIENT_CODE: string;

  RECIPIENT_NAME: string;
  RECIPIENT_TEL: string;
  RECIPIENT_ADDRESS: string;
  RECIPIENT_SUBDISTRICT: string;
  RECIPIENT_DISTRICT: string;
  RECIPIENT_PROVINCE: string;
  RECIPIENT_ZIPCODE: string;

  PACKAGE_CODE?: string;
  WEIGHT?: number;
  WIDTH?: number;
  HEIGHT?: number;
  LENGTH?: number;
  Q?: number;

  subdistrict_id?: number;

  SERIAL_NO: string;
};

const headers = [
  "ลำดับ",
  "จัดการ",
  "NO_BILL",
  "SERIAL_NO",
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

  "PACKAGE_CODE",
  "WEIGHT",
  "WIDTH",
  "HEIGHT",
  "LENGTH",
  "Q",
];

export default function ImportSTD() {
  const [fileName, setFileName] = useState<string>("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(250);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<Record<string, number>>({});
  const { user } = useAuth();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setSuccess(null);
    setRows([]);
    setVisibleCount(250);

    if (!file) return;
    setFileName(file.name);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) {
          setError("ไม่สามารถอ่านไฟล์ได้");
          setLoading(false);
          return;
        }

        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const json: ImportRow[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
          raw: false,
        }) as ImportRow[];

        const cleaned = json.filter((r) => r.SERIAL_NO && r.SERIAL_NO !== "");

        // 🔥 ใส่ตรงนี้
        const telErrors: Record<number, boolean> = {};

        cleaned.forEach((r, i) => {
          if (isInvalidTel(r.RECIPIENT_TEL)) {
            telErrors[i] = true;
          }
        });

        // 👇 ของเดิม
        setRows(cleaned);
        setDuplicates(findDuplicates(cleaned));

        setRows(cleaned);
        setDuplicates(findDuplicates(cleaned));
      } catch (err) {
        console.error(err);
        setError("ไฟล์ไม่ถูกต้องหรืออ่านไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError("เกิดข้อผิดพลาดในการอ่านไฟล์");
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSave = async () => {
    if (!rows.length) {
      setError("ยังไม่มีข้อมูลให้นำเข้าฐานข้อมูล");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await AxiosInstance.post("/import/std", {
        rows,
        file_name: fileName,
      });

      setSuccess(res.data?.message || "บันทึกข้อมูลสำเร็จ");
      setRows([]);
      setFileName("");
      setVisibleCount(200);
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูล",
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูล");
      }
    } finally {
      setSaving(false);
    }
  };

  const findDuplicates = (rows: ImportRow[]) => {
    const count: Record<string, number> = {};
    for (let i = 0; i < rows.length; i++) {
      const sn = rows[i].SERIAL_NO;
      if (!sn) continue;
      count[sn] = (count[sn] || 0) + 1;
    }
    return count;
  };

  const isInvalidTel = (tel: string) => {
    if (!tel) return false;

    const clean = tel.replace(/\D/g, "");

    return !(
      clean.startsWith("0") &&
      (clean.length === 9 || clean.length === 10)
    );
  };

  const handleDeleteRow = (index: number) => {
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setDuplicates(findDuplicates(next));
      return next;
    });
  };

  const excelDateToJSDate = (value: string | number): Date | null => {
    if (!value) return null;

    // ✅ Excel serial
    if (!isNaN(Number(value))) {
      return new Date((Number(value) - 25569) * 86400 * 1000);
    }

    // ✅ dd/mm/yyyy
    if (typeof value === "string" && value.includes("/")) {
      const [d, m, y] = value.split("/");
      const date = new Date(`${y}-${m}-${d}`);
      return isNaN(date.getTime()) ? null : date;
    }

    // fallback
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  const visibleRows = useMemo(() => {
    return rows.slice(0, visibleCount);
  }, [rows, visibleCount]);

  const hasDuplicate = Object.values(duplicates).some((c) => c > 1);
  const hasInvalidTel = rows.some((r) => isInvalidTel(r.RECIPIENT_TEL));
  const isInvalidData = hasDuplicate || hasInvalidTel;

  const Row = React.memo(({ row, idx }: any) => {
    return (
      <tr
        className={`transition ${
          idx % 2 === 0 ? "bg-white" : "bg-slate-50"
        } hover:bg-blue-100/70`}
      >
        <td className="px-2 py-1.5 border-b bg-gray-100 text-center sticky left-0">
          {idx + 1}
        </td>

        <td className="px-2 py-1.5 border-b text-center">
          <button
            onClick={() => handleDeleteRow(idx)}
            className="px-3 py-1 rounded-full bg-red-500 text-white hover:bg-red-600"
          >
            ลบ
          </button>
        </td>

        <td className="px-2 py-1.5 border-b">{row.NO_BILL}</td>

        <td
          className={
            duplicates[row.SERIAL_NO] > 1
              ? "bg-red-100 text-red-700 font-semibold"
              : " border-b"
          }
        >
          {row.SERIAL_NO}
        </td>

        <td className="px-2 py-1.5 border-b">{row.REFERENCE}</td>

        <td className="px-2 py-1.5 border-b">
          {excelDateToJSDate(row.SEND_DATE)
            ? format(excelDateToJSDate(row.SEND_DATE)!, "dd/MM/yyyy")
            : "-"}
        </td>

        <td className="px-2 py-1.5 border-b">{row.SHIPPER_CODE}</td>
        <td className="px-2 py-1.5 border-b">{row.RECIPIENT_CODE}</td>
        <td className="px-2 py-1.5 border-b">{row.RECIPIENT_NAME}</td>
        <td
          className={`px-2 py-1.5 border-b ${
            isInvalidTel(row.RECIPIENT_TEL)
              ? "bg-red-100 text-red-700 font-semibold"
              : ""
          }`}
        >
          {row.RECIPIENT_TEL}
        </td>
        <td className="px-2 py-1.5 border-b">{row.RECIPIENT_ADDRESS}</td>
        <td className="px-2 py-1.5 border-b">{row.RECIPIENT_SUBDISTRICT}</td>
        <td className="px-2 py-1.5 border-b">{row.RECIPIENT_DISTRICT}</td>
        <td className="px-2 py-1.5 border-b">{row.RECIPIENT_PROVINCE}</td>
        <td className="px-2 py-1.5 border-b">{row.RECIPIENT_ZIPCODE}</td>
        <td className="px-2 py-1.5 border-b">{row.PACKAGE_CODE}</td>
        <td className="px-2 py-1.5 border-b">{row.WEIGHT}</td>
        <td className="px-2 py-1.5 border-b">{row.WIDTH}</td>
        <td className="px-2 py-1.5 border-b">{row.HEIGHT}</td>
        <td className="px-2 py-1.5 border-b">{row.LENGTH}</td>
        <td className="px-2 py-1.5 border-b">{row.Q}</td>
      </tr>
    );
  });

  return (
    <div
      className={`font-thai w-full h-[70vh] bg-white px-4 py-5 ${
        loading || saving ? "cursor-wait" : ""
      }`}
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            นำเข้าข้อมูลบิลจาก Excel
          </h2>
        </div>

        <div className="flex items-end gap-4 text-sm">
          <div className="flex flex-col items-end text-slate-600">
            <span className="uppercase tracking-wide text-slate-500">
              ผู้ใช้งาน
            </span>
            <span className="font-medium">
              {user?.first_name || user?.username || "-"}
            </span>
          </div>

          <div className="flex flex-col items-end text-slate-600">
            <span className="uppercase tracking-wide text-slate-500">
              จำนวนแถวในไฟล์
            </span>
            <span className="font-semibold text-slate-800">
              {rows.length.toLocaleString("th-TH")}
            </span>
          </div>
        </div>
      </div>

      {/* Upload Panel */}
      <div className="mb-4 bg-white/90 border border-slate-200 rounded-xl shadow-sm px-4 py-3 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-600 mb-1 font-medium">
              เลือกไฟล์ Excel
            </span>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full cursor-pointer hover:bg-blue-100">
                <span className="text-blue-700 font-medium">เลือกไฟล์</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <a
                href="/templates/import-std.xlsx"
                download
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full hover:bg-blue-100"
              >
                <DownloadIcon className="w-4 h-4 text-blue-700" /> Template
              </a>

              {fileName ? (
                <span className="inline-flex items-center max-w-[260px] rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700 truncate">
                  📄 <span className="ml-1 truncate">{fileName}</span>
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  ยังไม่ได้เลือกไฟล์
                </span>
              )}
            </div>

            <span className="mt-1 text-[11px] text-slate-500">
              รองรับไฟล์ .xlsx, .xls, .csv เท่านั้น
            </span>
          </div>

          <div className="flex-1 flex flex-col md:flex-row md:items-center justify-end gap-3 mt-1">
            {rows.length > 0 && (
              <span className="text-slate-600">
                พบข้อมูล{" "}
                <span className="font-semibold">
                  {rows.length.toLocaleString("th-TH")}
                </span>{" "}
                แถว
                {Object.values(duplicates).some((c) => c > 1) && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-[1px]">
                    มี SERIAL_NO ซ้ำในไฟล์
                  </span>
                )}
                {hasInvalidTel && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-red-50 text-red-700 border border-red-200 px-2 py-[1px]">
                    พบเบอร์โทรไม่ถูกต้อง
                  </span>
                )}
              </span>
            )}

            <button
              onClick={handleSave}
              disabled={!rows.length || saving || isInvalidData}
              className={`px-4 py-1.5 rounded-full font-medium transition ${
                !rows.length || saving || isInvalidData
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              }`}
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-3 text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-3 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
          {success}
        </div>
      )}

      {/* Table */}
      <div className="border border-slate-200 rounded-xl bg-white shadow-sm">
        <div className="max-h-[75vh] overflow-auto rounded-xl">
          {!rows.length && !loading && (
            <div className="p-4 text-center text-sm text-slate-500">
              ยังไม่มีข้อมูลตัวอย่าง กรุณาเลือกไฟล์ Excel
            </div>
          )}

          {rows.length > 0 && (
            <table className="border-collapse min-w-max text-[13px]">
              <ResizableColumns headers={headers} pageKey="import-std" />

              <tbody>
                {visibleRows.map((row, idx) => (
                  <Row key={idx} row={row} idx={idx} />
                ))}
              </tbody>
            </table>
          )}

          {/* Load more */}
          {visibleCount < rows.length && (
            <div className="p-3 text-center">
              <button
                onClick={() => setVisibleCount((prev) => prev + 250)}
                className="px-4 py-1.5 bg-blue-500 text-white rounded"
              >
                โหลดเพิ่ม
              </button>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center mt-4">
          <div className="h-6 w-6 rounded-full border border-slate-300 border-t-blue-500 animate-spin" />
        </div>
      )}
    </div>
  );
}
