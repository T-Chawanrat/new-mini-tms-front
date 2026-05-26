import { useState, ChangeEvent, useMemo } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import AxiosInstance from "../utils/AxiosInstance";
import { DownloadIcon, X } from "lucide-react";
import DataGrid from "../components/DataGrid";
import CustomerDropdown, { type Customer } from "../components/dropdown/CustomerDropdown";

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
  WEIGHT?: number | string;
  WIDTH?: number | string;
  HEIGHT?: number | string;
  LENGTH?: number | string;
  Q?: number | string;

  subdistrict_id?: number | string | null;

  SERIAL_NO: string;
};

export default function ImportSTD() {
  const [fileName, setFileName] = useState<string>("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<Record<string, number>>({});

  const [customerId, setCustomerId] = useState<string>("");
  const [customerKeyword, setCustomerKeyword] = useState<string>("");

  const { user } = useAuth();

  const cleanText = (value: unknown) => {
    const text = String(value ?? "").trim();
    return text || null;
  };

  const toNumberOrNull = (value: unknown) => {
    if (value === undefined || value === null || value === "") return null;

    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const buildPayloadRows = () => {
    return rows.map((r) => ({
      NO_BILL: cleanText(r.NO_BILL),
      SERIAL_NO: cleanText(r.SERIAL_NO),
      REFERENCE: cleanText(r.REFERENCE),
      SEND_DATE: r.SEND_DATE || null,

      SHIPPER_CODE: cleanText(r.SHIPPER_CODE),
      RECIPIENT_CODE: cleanText(r.RECIPIENT_CODE),

      RECIPIENT_NAME: cleanText(r.RECIPIENT_NAME),
      RECIPIENT_TEL: cleanText(r.RECIPIENT_TEL),
      RECIPIENT_ADDRESS: cleanText(r.RECIPIENT_ADDRESS),
      RECIPIENT_SUBDISTRICT: cleanText(r.RECIPIENT_SUBDISTRICT),
      RECIPIENT_DISTRICT: cleanText(r.RECIPIENT_DISTRICT),
      RECIPIENT_PROVINCE: cleanText(r.RECIPIENT_PROVINCE),
      RECIPIENT_ZIPCODE: cleanText(r.RECIPIENT_ZIPCODE),

      PACKAGE_CODE: cleanText(r.PACKAGE_CODE),

      WEIGHT: toNumberOrNull(r.WEIGHT),
      WIDTH: toNumberOrNull(r.WIDTH),
      HEIGHT: toNumberOrNull(r.HEIGHT),
      LENGTH: toNumberOrNull(r.LENGTH),
      Q: toNumberOrNull(r.Q),

      subdistrict_id: toNumberOrNull(r.subdistrict_id),

      from_warehouse: null,
      to_warehouse: null,

      receive_code: null,
      shipper_id: null,
      recipient_id: null,
      package_id: null,
      price: null,
    }));
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

    return !(clean.startsWith("0") && (clean.length === 9 || clean.length === 10));
  };

  const excelDateToJSDate = (value: string | number): Date | null => {
    if (!value) return null;

    if (!isNaN(Number(value))) {
      return new Date((Number(value) - 25569) * 86400 * 1000);
    }

    if (typeof value === "string" && value.includes("/")) {
      const [d, m, y] = value.split("/");
      const date = new Date(`${y}-${m}-${d}`);
      return isNaN(date.getTime()) ? null : date;
    }

    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  const handleCustomerChange = (customer: Customer | null, inputText?: string) => {
    if (!customer) {
      setCustomerId("");
      setCustomerKeyword(inputText || "");
      return;
    }

    setCustomerId(String(customer.id));
    setCustomerKeyword(customer.name || "");
  };

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

  const handleDeleteRow = (index: number) => {
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setDuplicates(findDuplicates(next));
      return next;
    });
  };

  const handleSave = async () => {
    if (!customerId) {
      setError("กรุณาเลือกลูกค้าก่อนบันทึก");
      return;
    }

    if (!rows.length) {
      setError("ยังไม่มีข้อมูลให้นำเข้าฐานข้อมูล");
      return;
    }

    const payloadRows = buildPayloadRows();

    setSaving(true);
    setError(null);
    setSuccess(null);

    console.log("IMPORT PAYLOAD =", {
      customer_id: Number(customerId),
      customerId,
      rows_count: payloadRows.length,
      file_name: fileName,
      first_row: payloadRows[0],
    });

    try {
      const res = await AxiosInstance.post("/import/std", {
        customer_id: Number(customerId),
        rows: payloadRows,
        file_name: fileName || null,
      });

      console.log("IMPORT RESPONSE =", res.data);

      if (res.data?.failed > 0 || res.data?.total === 0) {
        setError(res.data?.message || "นำเข้าไม่สำเร็จ");
        return;
      }

      setSuccess(res.data?.message || "บันทึกข้อมูลสำเร็จ");
      setRows([]);
      setFileName("");
      setDuplicates({});
    } catch (err) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูล");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูล");
      }
    } finally {
      setSaving(false);
    }
  };

  const hasDuplicate = Object.values(duplicates).some((c) => c > 1);
  const hasInvalidTel = rows.some((r) => isInvalidTel(r.RECIPIENT_TEL));
  const isInvalidData = hasDuplicate || hasInvalidTel;

  const gridRows = useMemo(() => {
    return rows.map((row, index) => {
      const sendDate = excelDateToJSDate(row.SEND_DATE);

      return {
        ...row,
        id: index + 1,
        row_index: index,
        no: index + 1,
        SEND_DATE_DISPLAY: sendDate ? format(sendDate, "dd/MM/yyyy") : "-",
      };
    });
  }, [rows]);

  const importColumns = useMemo(
    () => [
      {
        field: "no",
        headerName: "#",
        width: 60,
        minWidth: 60,
        sortable: false,
        filterable: false,
        resizable: false,
        align: "center" as const,
        headerAlign: "center" as const,
      },
      {
        field: "actions",
        headerName: "จัดการ",
        width: 100,
        minWidth: 90,
        sortable: false,
        filterable: false,
        resizable: false,
        align: "center" as const,
        headerAlign: "center" as const,
        renderCell: (params: any) => (
          <div className="flex h-full w-full items-center justify-center">
            <button
              type="button"
              onClick={() => handleDeleteRow(params.row.row_index)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
              title="ลบ"
            >
              <X size={14} />
            </button>
          </div>
        ),
      },
      {
        field: "NO_BILL",
        headerName: "NO_BILL",
        width: 100,
        minWidth: 80,
        renderCell: (params: any) => params.value || "-",
      },
      {
        field: "SERIAL_NO",
        headerName: "SERIAL_NO",
        width: 160,
        minWidth: 140,
        renderCell: (params: any) => {
          const isDuplicate = duplicates[params.value] > 1;

          return (
            <div
              title={params.value || ""}
              className={`flex h-full w-full items-center px-2 truncate ${isDuplicate ? "bg-red-100 text-red-700 font-semibold" : ""}`}
            >
              {params.value || "-"}
            </div>
          );
        },
      },
      {
        field: "REFERENCE",
        headerName: "REFERENCE",
        width: 150,
        minWidth: 130,
        renderCell: (params: any) => params.value || "-",
      },
      {
        field: "SEND_DATE_DISPLAY",
        headerName: "SEND_DATE",
        width: 130,
        minWidth: 120,
        renderCell: (params: any) => params.value || "-",
      },
      {
        field: "SHIPPER_CODE",
        headerName: "SHIPPER_CODE",
        width: 150,
        minWidth: 130,
        renderCell: (params: any) => params.value || "-",
      },
      {
        field: "RECIPIENT_CODE",
        headerName: "RECIPIENT_CODE",
        width: 160,
        minWidth: 140,
        renderCell: (params: any) => params.value || "-",
      },
      {
        field: "RECIPIENT_NAME",
        headerName: "RECIPIENT_NAME",
        width: 220,
        minWidth: 180,
        renderCell: (params: any) => (
          <div title={params.value || ""} className="truncate">
            {params.value || "-"}
          </div>
        ),
      },
      {
        field: "RECIPIENT_TEL",
        headerName: "RECIPIENT_TEL",
        width: 150,
        minWidth: 130,
        renderCell: (params: any) => {
          const invalid = isInvalidTel(params.value);

          return (
            <div className={`flex h-full w-full items-center px-2 truncate ${invalid ? "bg-red-100 text-red-700 font-semibold" : ""}`}>
              {params.value || "-"}
            </div>
          );
        },
      },
      {
        field: "RECIPIENT_ADDRESS",
        headerName: "RECIPIENT_ADDRESS",
        width: 320,
        minWidth: 240,
        renderCell: (params: any) => (
          <div title={params.value || ""} className="truncate">
            {params.value || "-"}
          </div>
        ),
      },
      {
        field: "RECIPIENT_SUBDISTRICT",
        headerName: "RECIPIENT_SUBDISTRICT",
        width: 190,
        minWidth: 160,
        renderCell: (params: any) => params.value || "-",
      },
      {
        field: "RECIPIENT_DISTRICT",
        headerName: "RECIPIENT_DISTRICT",
        width: 180,
        minWidth: 150,
        renderCell: (params: any) => params.value || "-",
      },
      {
        field: "RECIPIENT_PROVINCE",
        headerName: "RECIPIENT_PROVINCE",
        width: 180,
        minWidth: 150,
        renderCell: (params: any) => params.value || "-",
      },
      {
        field: "RECIPIENT_ZIPCODE",
        headerName: "RECIPIENT_ZIPCODE",
        width: 170,
        minWidth: 150,
        renderCell: (params: any) => params.value || "-",
      },
      {
        field: "PACKAGE_CODE",
        headerName: "PACKAGE_CODE",
        width: 150,
        minWidth: 130,
        renderCell: (params: any) => params.value || "-",
      },
      {
        field: "WEIGHT",
        headerName: "WEIGHT",
        width: 110,
        minWidth: 90,
        renderCell: (params: any) => params.value || "-",
      },
      {
        field: "WIDTH",
        headerName: "WIDTH",
        width: 100,
        minWidth: 90,
        renderCell: (params: any) => params.value || "-",
      },
      {
        field: "HEIGHT",
        headerName: "HEIGHT",
        width: 100,
        minWidth: 90,
        renderCell: (params: any) => params.value || "-",
      },
      {
        field: "LENGTH",
        headerName: "LENGTH",
        width: 110,
        minWidth: 90,
        renderCell: (params: any) => params.value || "-",
      },
      {
        field: "Q",
        headerName: "Q",
        width: 90,
        minWidth: 80,
        renderCell: (params: any) => params.value || "-",
      },
    ],
    [duplicates],
  );

  return (
    <div
      className={`font-thai w-full h-[calc(100vh-61px)] bg-slate-50 px-4 py-4 overflow-hidden flex flex-col ${
        loading || saving ? "cursor-wait" : ""
      }`}
    >
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">นำเข้าข้อมูลบิลจาก Excel</h2>
        </div>

        <div className="flex items-end gap-4 text-sm">
          <div className="flex flex-col items-end text-slate-600">
            <span className="uppercase tracking-wide text-slate-500">ผู้ใช้งาน</span>
            <span className="font-medium">{user?.first_name || user?.username || "-"}</span>
          </div>

          <div className="flex flex-col items-end text-slate-600">
            <span className="uppercase tracking-wide text-slate-500">จำนวนแถวในไฟล์</span>
            <span className="font-semibold text-slate-800">{rows.length.toLocaleString("th-TH")}</span>
          </div>
        </div>
      </div>

      {/* Upload Panel */}
      <div className="mb-3 bg-white/90 border border-slate-200 rounded-xl shadow-sm px-4 py-3 flex flex-col gap-3 shrink-0">
        <div className="flex flex-col xl:flex-row xl:items-end gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-600 mb-1 font-medium">เลือกไฟล์ Excel</span>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full cursor-pointer hover:bg-blue-100">
                <span className="text-blue-700 font-medium">เลือกไฟล์</span>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
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
                <span className="text-[11px] text-slate-400">ยังไม่ได้เลือกไฟล์</span>
              )}

              <div className="w-full md:w-[420px] xl:w-[520px]">
                <CustomerDropdown value={customerKeyword} onChange={handleCustomerChange} />
              </div>

              {/* {!customerId && (
                <span className="text-[11px] text-red-500">
                  เลือกเจ้าของงาน
                </span>
              )} */}
            </div>

            <span className="mt-1 text-[11px] text-slate-500">รองรับไฟล์ .xlsx, .xls, .csv เท่านั้น</span>
          </div>

          <div className="flex-1 flex flex-col md:flex-row md:items-center justify-end gap-3 mt-1">
            {rows.length > 0 && (
              <span className="text-slate-600">
                พบข้อมูล <span className="font-semibold">{rows.length.toLocaleString("th-TH")}</span> แถว
                {hasDuplicate && (
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
              type="button"
              onClick={handleSave}
              disabled={!customerId || !rows.length || saving || isInvalidData}
              className={`px-4 py-1.5 rounded-full font-medium transition ${
                !customerId || !rows.length || saving || isInvalidData
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
      {error && <div className="mb-3 text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg shrink-0">{error}</div>}

      {success && <div className="mb-3 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg shrink-0">{success}</div>}

      {/* DataGrid */}
      <div className="flex-1 min-h-0 overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm">
        {rows.length === 0 && !loading ? (
          <div className="p-4 text-center text-sm text-slate-500">ยังไม่มีข้อมูลตัวอย่าง กรุณาเลือกไฟล์ Excel</div>
        ) : (
          <DataGrid rows={gridRows} columns={importColumns} loading={loading} getRowId={(row: any) => row.id} height="100%" pageSize={100} />
        )}
      </div>

      {loading && (
        <div className="flex justify-center mt-4 shrink-0">
          <div className="h-6 w-6 rounded-full border border-slate-300 border-t-blue-500 animate-spin" />
        </div>
      )}
    </div>
  );
}
