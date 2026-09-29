import { useEffect, useMemo, useState } from "react";
import type { GridColDef } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import type { Dayjs } from "dayjs";
import { Download, RefreshCw, Search, Truck } from "lucide-react";
import * as XLSX from "xlsx";

import DataGrid from "../components/DataGrid";
import AxiosInstance from "../utils/AxiosInstance";
import { formatReportDateTime } from "../utils/dateTime";
import { formatThaiNumber } from "../utils/textSanitizer";

type DeliveryDtRow = {
  idx: number;
  truck_code: string;
  route_code?: string;
  route_name?: string;
  driver_type?: string;
  driver_name?: string;
  user_truck_id?: number;
  username?: string;
  license_plate?: string;
  license_plate_province?: string;
  total_sn?: number;
  created_date?: string;
};

const getDriverTypeLabel = (driverType?: string) => {
  if (driverType === "EMPLOYEE") return "รถประจำ";
  if (driverType === "CONTRACTOR") return "รถเสริม";
  return driverType || "-";
};

export default function DeliveryPendingReportDt() {
  const [rows, setRows] = useState<DeliveryDtRow[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadReport = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await AxiosInstance.get<{ data?: DeliveryDtRow[] }>("/delivery-reports/dt", {
          params: {
            search: search || undefined,
            date_from: dateFrom?.format("YYYY-MM-DD"),
            date_to: dateTo?.format("YYYY-MM-DD"),
          },
        });
        if (active) setRows(Array.isArray(response.data.data) ? response.data.data.map((row, index) => ({ ...row, idx: index + 1 })) : []);
      } catch (requestError) {
        const message = requestError as { response?: { data?: { message?: string } }; message?: string };
        if (active) setError(message.response?.data?.message || message.message || "ไม่สามารถโหลดรายงานงานค้างส่งได้");
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadReport();
    return () => {
      active = false;
    };
  }, [search, dateFrom, dateTo, refreshKey]);

  const summary = useMemo(
    () => ({
      trucks: rows.length,
      serials: rows.reduce((sum, row) => sum + Number(row.total_sn || 0), 0),
    }),
    [rows],
  );

  const columns = useMemo<GridColDef<DeliveryDtRow>[]>(
    () => [
      { field: "idx", headerName: "ลำดับ", width: 60, align: "center", headerAlign: "center" },
      { field: "truck_code", headerName: "เลขใบรถกระจาย", width: 155 },
      {
        field: "route_name",
        headerName: "สายรถ",
        minWidth: 180,
        flex: 1,
        valueGetter: (_value, row) => [row.route_code, row.route_name].filter(Boolean).join(" - ") || "-",
      },
      { field: "driver_type", headerName: "ประเภทคนขับ", width: 115, valueGetter: (value) => getDriverTypeLabel(value) },
      { field: "driver_name", headerName: "คนขับ", minWidth: 180, flex: 1, valueGetter: (value) => value || "-" },
      {
        field: "license_plate",
        headerName: "ทะเบียนรถ",
        width: 180,
        valueGetter: (_value, row) => [row.license_plate, row.license_plate_province].filter(Boolean).join(" ") || "-",
      },
      { field: "username", headerName: "Username", width: 145, valueGetter: (value) => value || "-" },
      {
        field: "total_sn",
        headerName: "จำนวน SN",
        width: 95,
        align: "right",
        headerAlign: "right",
        valueFormatter: (value) => formatThaiNumber(value),
      },
      { field: "created_date", headerName: "วันที่สร้าง", width: 155, valueFormatter: (value) => formatReportDateTime(value) },
    ],
    [],
  );

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      rows.map((row) => ({
        ลำดับ: row.idx,
        เลขใบรถกระจาย: row.truck_code,
        สายรถ: [row.route_code, row.route_name].filter(Boolean).join(" - "),
        ประเภทคนขับ: getDriverTypeLabel(row.driver_type),
        คนขับ: row.driver_name || "",
        ทะเบียนรถ: [row.license_plate, row.license_plate_province].filter(Boolean).join(" "),
        Username: row.username || "",
        จำนวนSN: row.total_sn || 0,
        วันที่สร้าง: formatReportDateTime(row.created_date),
      })),
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "รายงานตาม DT");
    XLSX.writeFile(workbook, "delivery-pending-report-dt.xlsx");
  };

  return (
    <div className="flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 px-1 py-2 text-slate-800">
      <section className="mb-3 grid shrink-0 grid-cols-2 gap-2">
        {[
          ["ใบรถกระจาย", summary.trucks],
          ["จำนวน SN", summary.serials],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Truck size={18} />
            </span>
            <span>
              <span className="block text-lg font-bold leading-none">{formatThaiNumber(Number(value))}</span>
              <span className="mt-1 block text-xs font-medium text-slate-500">{label}</span>
            </span>
          </div>
        ))}
      </section>

      <section className="mb-3 shrink-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(160px,0.7fr)_170px_170px_auto] lg:items-end">
          <label className="block text-xs font-medium text-slate-600">
            ค้นหา
            <span className="relative mt-1 block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="DT, คนขับ, Username หรือทะเบียนรถ"
                className="h-9 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </span>
          </label>
          <DatePicker
            label="วันที่จัดส่ง ตั้งแต่"
            value={dateFrom}
            onChange={setDateFrom}
            format="DD/MM/YYYY"
            slotProps={{ textField: { size: "small", fullWidth: true } }}
          />
          <DatePicker
            label="ถึงวันที่"
            value={dateTo}
            onChange={setDateTo}
            format="DD/MM/YYYY"
            slotProps={{ textField: { size: "small", fullWidth: true } }}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={15} /> รีเฟรช
            </button>
            <button
              type="button"
              onClick={exportExcel}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Download size={15} /> Export Excel
            </button>
          </div>
        </div>
      </section>

      <section className="min-h-0 flex-1 overflow-hidden">
        {error ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-4 text-sm text-rose-700">
            {error}
          </div>
        ) : loading ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-slate-200 bg-white text-sm text-slate-400">
            กำลังโหลดรายงาน...
          </div>
        ) : (
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row.truck_code}
            getRowClassName={(params) => (params.indexRelativeToCurrentPage % 2 === 1 ? "bg-slate-50" : "")}
            rowHoverColor="#dbeafe"
            height="100%"
          />
        )}
      </section>
    </div>
  );
}
