import { useEffect, useMemo, useState } from "react";
import type { GridColDef } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import type { Dayjs } from "dayjs";
import { Download, FileText, RefreshCw, Search } from "lucide-react";
import * as XLSX from "xlsx";

import DataGrid from "../components/tms/table/DataGrid";
import AxiosInstance from "../services/apiClient";
import { formatReportDate } from "../utils/dateTime";
import { formatThaiNumber } from "../utils/textSanitizer";

type Warehouse = { warehouse_id?: number; id?: number; warehouse_name?: string; name?: string };
type DeliveryReceiveRow = {
  idx: number;
  receive_business_id: number;
  receive_code?: string;
  reference_no?: string;
  payment_type_name?: string;
  receive_date?: string;
  delivery_date?: string;
  customer_name?: string;
  shipper_name?: string;
  recipient_code?: string;
  recipient_name?: string;
  tel?: string;
  address?: string;
  subdistrict_name?: string;
  district_name?: string;
  province_name?: string;
  zip_code?: string;
  total_sn?: number;
  total_cost?: number;
  cod?: number;
  remark?: string;

  delivered_sn?: number;
  pending_sn?: number;
  status_message?: string;
};

export default function DeliveryPendingReportReceive() {
  const [rows, setRows] = useState<DeliveryReceiveRow[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [search, setSearch] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void AxiosInstance.get<Warehouse[]>("/warehouses")
      .then((response) => setWarehouses(Array.isArray(response.data) ? response.data : []))
      .catch(() => setWarehouses([]));
  }, []);

  useEffect(() => {
    let active = true;
    const loadReport = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await AxiosInstance.get<{ data?: DeliveryReceiveRow[] }>("/delivery-reports/receive", {
          params: {
            search: search || undefined,
            to_warehouse_id: toWarehouseId || undefined,
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
  }, [search, toWarehouseId, dateFrom, dateTo, refreshKey]);

  const summary = useMemo(
    () => ({
      bills: rows.length,
      serials: rows.reduce((sum, row) => sum + Number(row.total_sn || 0), 0),
      pending: rows.reduce((sum, row) => sum + Number(row.pending_sn || 0), 0),
      cod: rows.reduce((sum, row) => sum + Number(row.cod || 0), 0),
    }),
    [rows],
  );
  const columns = useMemo<GridColDef<DeliveryReceiveRow>[]>(
    () => [
      { field: "idx", headerName: "ลำดับ", width: 70, align: "center", headerAlign: "center" },
      { field: "receive_code", headerName: "เลขที่บิล", width: 220, valueGetter: (value) => value || "-" },
      { field: "reference_no", headerName: "Reference", width: 135, valueGetter: (value) => value || "-" },
      { field: "payment_type_name", headerName: "ประเภทการจ่าย", width: 120, valueGetter: (value) => value || "-" },
      { field: "receive_date", headerName: "วันที่บิล", width: 115, valueFormatter: (value) => formatReportDate(value) },
      { field: "delivery_date", headerName: "วันที่กำหนดส่ง", width: 125, valueFormatter: (value) => formatReportDate(value) },
      { field: "customer_name", headerName: "เจ้าของงาน", width: 100, valueGetter: (value) => value || "-" },
      { field: "shipper_name", headerName: "ชื่อผู้ส่ง", width: 140, valueGetter: (value) => value || "-" },
      { field: "recipient_code", headerName: "รหัสผู้รับ", width: 110, valueGetter: (value) => value || "-" },
      { field: "recipient_name", headerName: "ชื่อผู้รับ", width: 140, valueGetter: (value) => value || "-" },
      { field: "address", headerName: "ที่อยู่", width: 220, valueGetter: (value) => value || "-" },
      { field: "subdistrict_name", headerName: "ตำบล", width: 120, valueGetter: (value) => value || "-" },
      { field: "district_name", headerName: "อำเภอ", width: 120, valueGetter: (value) => value || "-" },
      { field: "province_name", headerName: "จังหวัด", width: 120, valueGetter: (value) => value || "-" },
      { field: "zip_code", headerName: "รหัสไปรษณีย์", width: 105, valueGetter: (value) => value || "-" },
      {
        field: "total_sn",
        headerName: "จำนวนสินค้า (กล่อง)",
        width: 145,
        align: "right",
        headerAlign: "right",
        valueFormatter: (value) => (value == null || value === "" ? "-" : formatThaiNumber(value)),
      },
      {
        field: "total_cost",
        headerName: "ราคา",
        width: 110,
        align: "right",
        headerAlign: "right",
        valueFormatter: (value) => (value == null || value === "" ? "-" : formatThaiNumber(value, 2)),
      },
      { field: "cod", headerName: "COD", width: 110, align: "right", headerAlign: "right", valueFormatter: (value) => (value == null || value === "" ? "-" : formatThaiNumber(value, 2)) },
      { field: "remark", headerName: "เงื่อนไขการจัดส่ง", width: 160, valueGetter: (value) => value || "-" },

      {
        field: "status_message",
        headerName: "จัดส่งสำเร็จ",
        width: 100,
        align: "center",
        headerAlign: "center",
        valueGetter: (value) => value || "-",
      },
    ],
    [],
  );

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      rows.map((row) => ({
        ลำดับ: row.idx,
        เลขที่บิล: row.receive_code || "",
        Reference: row.reference_no || "",
        ประเภทการจ่าย: row.payment_type_name || "",
        วันที่บิล: formatReportDate(row.receive_date),
        วันที่กำหนดส่ง: formatReportDate(row.delivery_date),
        เจ้าของงาน: row.customer_name || "",
        ผู้ส่ง: row.shipper_name || "",
        รหัสผู้รับ: row.recipient_code || "",
        ผู้รับ: row.recipient_name || "",
        ที่อยู่: row.address || "",
        ตำบล: row.subdistrict_name || "",
        อำเภอ: row.district_name || "",
        จังหวัด: row.province_name || "",
        รหัสไปรษณีย์: row.zip_code || "",
        "จำนวนสินค้า (กล่อง)": row.total_sn ?? "",
        ราคา: row.total_cost || 0,
        COD: row.cod || 0,
        เงื่อนไขการจัดส่ง: row.remark || "-",
        จัดส่งสำเร็จ: row.status_message || "",
      })),
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "รายงานตามบิล");
    XLSX.writeFile(workbook, "delivery-pending-report-receive.xlsx");
  };

  return (
    <div className="flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 px-1 py-2 text-slate-800">
      <section className="mb-3 grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
        {[
          ["จำนวนบิล", summary.bills],
          ["จำนวน SN", summary.serials],
          ["SN ค้างส่ง", summary.pending],
          ["COD", formatThaiNumber(summary.cod, 2)],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <FileText size={18} />
            </span>
            <span>
              <span className="block text-lg font-bold leading-none">{typeof value === "number" ? formatThaiNumber(value) : value}</span>
              <span className="mt-1 block text-xs font-medium text-slate-500">{label}</span>
            </span>
          </div>
        ))}
      </section>
      <section className="mb-3 shrink-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(160px,0.7fr)_180px_170px_170px_auto] lg:items-end">
          <label className="block text-xs font-medium text-slate-600">
            ค้นหา
            <span className="relative mt-1 block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="บิล, SN หรือ ref"
                className="h-9 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </span>
          </label>
          <label className="block text-xs font-medium text-slate-600">
            คลังปลายทาง
            <select
              value={toWarehouseId}
              onChange={(event) => setToWarehouseId(event.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">ทุกคลัง</option>
              {warehouses.map((warehouse) => {
                const id = warehouse.warehouse_id ?? warehouse.id;
                const name = warehouse.warehouse_name ?? warehouse.name;
                return id ? (
                  <option key={id} value={id}>
                    {name || `คลัง ${id}`}
                  </option>
                ) : null;
              })}
            </select>
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
            getRowId={(row) => row.receive_business_id}
            getRowClassName={(params) => (params.indexRelativeToCurrentPage % 2 === 1 ? "bg-slate-50" : "")}
            rowHoverColor="#dbeafe"
            height="100%"
          />
        )}
      </section>
    </div>
  );
}
