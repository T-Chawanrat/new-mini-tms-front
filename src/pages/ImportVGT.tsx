import { useState, ChangeEvent } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import ResizableColumns from "../components/ResizableColumns";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import AxiosInstance from "../utils/AxiosInstance";

type ImportRow = {
  NO_BILL: string;
  REFERENCE: string;
  SEND_DATE: string | number;
  CUSTOMER_NAME: string;
  RECIPIENT_CODE: string;
  RECIPIENT_NAME: string;
  RECIPIENT_TEL: string;
  RECIPIENT_ADDRESS: string;
  RECIPIENT_SUBDISTRICT: string;
  RECIPIENT_DISTRICT: string;
  RECIPIENT_PROVINCE: string;
  RECIPIENT_ZIPCODE: string;
  SERIAL_NO: string;
};

const headers = [
  "ลำดับ",
  "จัดการ",
  "NO_BILL",
  "SERIAL_NO",
  "REFERENCE",
  "SEND_DATE",
  "CUSTOMER_NAME",
  "RECIPIENT_CODE",
  "RECIPIENT_NAME",
  "RECIPIENT_TEL",
  "RECIPIENT_ADDRESS",
  "RECIPIENT_SUBDISTRICT",
  "RECIPIENT_DISTRICT",
  "RECIPIENT_PROVINCE",
  "RECIPIENT_ZIPCODE",
];

export default function ImportSTD() {
  const [fileName, setFileName] = useState<string>("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<Record<string, number>>({});

  const { user } = useAuth();

  // ================= FILE =================
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    setError(null);
    setSuccess(null);
    setRows([]);

    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;

        if (!data) {
          setError("ไม่สามารถอ่านไฟล์ได้");
          return;
        }

        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const json = XLSX.utils.sheet_to_json<ImportRow>(sheet, {
          defval: "",
        });

        setRows(json);
        setDuplicates(findDuplicates(json));
      } catch (err) {
        console.error(err);
        setError("ไฟล์ไม่ถูกต้อง");
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError("อ่านไฟล์ไม่สำเร็จ");
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // ================= SAVE =================
  const handleSave = async () => {
    if (!rows.length) {
      setError("ยังไม่มีข้อมูล");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await AxiosInstance.post("/import/std", {
        rows,
        import_log_id: Date.now(),
      });

      setSuccess(res.data?.message || "สำเร็จ");
      setRows([]);
      setFileName("");
    } catch (err) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "error");
      } else {
        setError("error");
      }
    } finally {
      setSaving(false);
    }
  };

  // ================= DUP =================
  const findDuplicates = (rows: ImportRow[]) => {
    const map: Record<string, number> = {};

    rows.forEach((r) => {
      if (!r.SERIAL_NO) return;
      map[r.SERIAL_NO] = (map[r.SERIAL_NO] || 0) + 1;
    });

    return map;
  };

  // ================= DELETE =================
  const handleDeleteRow = (index: number) => {
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setDuplicates(findDuplicates(next));
      return next;
    });
  };

  // ================= DATE =================
  const excelDateToJSDate = (value: string | number) => {
    if (!value) return null;

    const num = Number(value);
    if (isNaN(num)) return null;

    return new Date((num - 25569) * 86400 * 1000);
  };

  // ================= UI =================
  return (
    <div
      className={`font-thai w-full h-[70vh] bg-white px-4 py-5 ${
        loading || saving ? "cursor-wait" : ""
      }`}
    >
      {/* HEADER */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">
          Import STD (Excel)
        </h2>
        <span className="text-sm text-slate-500">
          {user?.first_name || user?.username}
        </span>
      </div>

      {/* UPLOAD */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
        />

        {fileName && (
          <span className="text-sm text-slate-600">
            📄 {fileName}
          </span>
        )}

        <button
          onClick={handleSave}
          disabled={!rows.length || saving}
          className={`px-4 py-1.5 rounded text-white ${
            !rows.length || saving
              ? "bg-gray-400"
              : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-2 text-red-600">{error}</div>
      )}

      {/* SUCCESS */}
      {success && (
        <div className="mb-2 text-green-600">{success}</div>
      )}

      {/* TABLE */}
      <div className="border rounded overflow-auto max-h-[60vh]">
        {!rows.length && !loading && (
          <div className="p-4 text-center text-sm text-gray-500">
            ยังไม่มีข้อมูล
          </div>
        )}

        {rows.length > 0 && (
          <table className="min-w-max text-[13px]">
            <ResizableColumns headers={headers} pageKey="std-import" />

            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-2">{idx + 1}</td>

                  <td className="px-2">
                    <button
                      onClick={() => handleDeleteRow(idx)}
                      className="text-red-500"
                    >
                      ลบ
                    </button>
                  </td>

                  <td className="px-2">{row.NO_BILL}</td>

                  <td
                    className={
                      duplicates[row.SERIAL_NO] > 1
                        ? "text-red-500 font-semibold"
                        : ""
                    }
                  >
                    {row.SERIAL_NO}
                  </td>

                  <td className="px-2">{row.REFERENCE}</td>

                  <td className="px-2">
                    {row.SEND_DATE &&
                    excelDateToJSDate(row.SEND_DATE)
                      ? format(
                          excelDateToJSDate(row.SEND_DATE)!,
                          "dd/MM/yyyy"
                        )
                      : "-"}
                  </td>

                  <td className="px-2">{row.CUSTOMER_NAME}</td>
                  <td className="px-2">{row.RECIPIENT_CODE}</td>
                  <td className="px-2">{row.RECIPIENT_NAME}</td>
                  <td className="px-2">{row.RECIPIENT_TEL}</td>
                  <td className="px-2">{row.RECIPIENT_ADDRESS}</td>
                  <td className="px-2">{row.RECIPIENT_SUBDISTRICT}</td>
                  <td className="px-2">{row.RECIPIENT_DISTRICT}</td>
                  <td className="px-2">{row.RECIPIENT_PROVINCE}</td>
                  <td className="px-2">{row.RECIPIENT_ZIPCODE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex justify-center mt-3">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}