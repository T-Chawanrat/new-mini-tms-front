import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCcw, Search, Truck } from "lucide-react";
import TablePagination from "@mui/material/TablePagination";
import * as XLSX from "xlsx";

import AxiosInstance from "../utils/AxiosInstance";
import { filterProductTruckRows } from "../utils/productTruckFilters.js";
import { formatThaiDateTime, formatThaiNumber } from "../utils/textSanitizer";

type ProductTruckRow = {
  receive_code?: string | null;
  customer_id?: number | null;
  customer_name?: string | null;
  product_truck_id: number;
  serial_id: string;
  serial_no: string;
  created_by: number | null;
  user_truck_id: number | null;
  truck_id: number | null;
  product_status: string | null;
  resend_date: string | null;
  truck_load_id: number;
  created_date: string | null;
  truck_code: string | null;
  truck_create_date: string | null;
  driver_type: "EMPLOYEE" | "CONTRACTOR" | null;
  truck_status: string | null;
  warehouse_id: number | null;
  to_warehouse_id: number | null;
  is_close: "Y" | "N" | null;
  is_go: "Y" | "N" | null;
  driver_name: string | null;
  driver_username: string | null;
  license_plate: string | null;
  license_plate_province: string | null;
  vehicle_model: string | null;
  warehouse_name: string | null;
  to_warehouse_name: string | null;
  created_name: string | null;
};

type ProductTruckResponse = {
  success?: boolean;
  message?: string;
  data?: ProductTruckRow[];
};

type AxiosLikeError = {
  response?: { data?: { message?: string } };
  message?: string;
};

const getErrorMessage = (error: unknown) => {
  if (typeof error !== "object" || error === null) return "ไม่สามารถโหลดสินค้าบนรถได้";

  const axiosError = error as AxiosLikeError;
  return axiosError.response?.data?.message || axiosError.message || "ไม่สามารถโหลดสินค้าบนรถได้";
};

const getDriverTypeLabel = (driverType: ProductTruckRow["driver_type"]) => {
  const normalizedType = String(driverType || "")
    .trim()
    .toUpperCase();
  if (normalizedType === "EMPLOYEE") return "รถปกติ";
  if (normalizedType === "CONTRACTOR") return "รถเสริม";
  return driverType || "-";
};

export default function ProductTruck() {
  const [rows, setRows] = useState<ProductTruckRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await AxiosInstance.get<ProductTruckResponse>("/product-trucks");
      setRows(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (loadError) {
      setRows([]);
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const filteredRows = useMemo(() => {
    return filterProductTruckRows(rows, search);
  }, [rows, search]);

  const visibleRows = useMemo(() => filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [filteredRows, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  useEffect(() => {
    const lastPage = Math.max(Math.ceil(filteredRows.length / rowsPerPage) - 1, 0);
    if (page > lastPage) setPage(lastPage);
  }, [filteredRows.length, page, rowsPerPage]);

  const exportExcel = () => {
    if (!filteredRows.length) return;

    const exportRows = filteredRows.map((row) => ({
      เลขที่บิล: row.receive_code || "",
      "Serial No": row.serial_no,
      เจ้าของงาน: row.customer_name || "",
      ชื่อคนขับรถ: row.driver_name || "",
      Username: row.driver_username || "",
      ทะเบียนรถ: [row.vehicle_model ? `(${row.vehicle_model})` : "", row.license_plate, row.license_plate_province].filter(Boolean).join(" "),
      ประเภทรถ: getDriverTypeLabel(row.driver_type),
      "DC ต้นทาง": row.warehouse_name || "",
      "DC ปลายทาง": row.to_warehouse_name || "",
      วันที่ขึ้นรถ: formatThaiDateTime(row.created_date),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "สินค้าบนรถ");

    const dateText = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    XLSX.writeFile(workbook, `สินค้าบนรถ_${dateText}.xlsx`);
  };

  return (
    <div className="flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 px-1 py-2 text-slate-800">
      <section className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Truck size={18} className="text-blue-600" />
            สินค้าบนรถ
          </h1>
          <p className="mt-0.5 text-[11px] text-slate-500">ตรวจสอบ Serial No ที่อยู่ภายในใบปิดบรรทุก</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
            ทั้งหมด <span className="font-bold">{formatThaiNumber(filteredRows.length)}</span> ชิ้น
          </div>
          <button
            type="button"
            onClick={exportExcel}
            disabled={loading || filteredRows.length === 0}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={13} />
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => void loadProducts()}
            disabled={loading}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw size={13} className={loading ? "animate-spin" : ""} />
            รีเฟรช
          </button>
        </div>
      </section>

      <section className="mb-2 shrink-0 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <div className="relative max-w-2xl">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ค้นหา Serial No, เลขใบปิดบรรทุก, คนขับ, ทะเบียนรถ หรือคลัง"
            className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </section>

      {error && <div className="mb-2 shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[1740px] table-fixed border-collapse text-left text-xs">
            <thead className="sticky top-0 z-20 bg-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              <tr className="border-b border-slate-200">
                <th className="w-[210px] px-3 py-2">เลขที่บิล</th>
                <th className="w-[250px] px-3 py-2">Serial No</th>
                <th className="w-[250px] px-3 py-2">เจ้าของงาน</th>
                <th className="w-[190px] px-3 py-2">ชื่อคนขับรถ</th>
                <th className="w-[130px] px-3 py-2">Username</th>
                <th className="w-[250px] px-3 py-2">ทะเบียนรถ</th>
                <th className="w-[120px] px-3 py-2">ประเภทรถ</th>
                <th className="w-[190px] px-3 py-2">DC ต้นทาง</th>
                <th className="w-[190px] px-3 py-2">DC ปลายทาง</th>
                <th className="w-[165px] px-3 py-2">วันที่ขึ้นรถ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-3 py-12 text-center text-sm text-slate-500">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-12 text-center text-sm text-slate-500">
                    ไม่พบสินค้าบนรถ
                  </td>
                </tr>
              ) : (
                visibleRows.map((row, index) => (
                  <tr key={row.product_truck_id} className={index % 2 === 0 ? "bg-white hover:bg-blue-50/40" : "bg-slate-50/70 hover:bg-blue-50/40"}>
                    <td className="border-b border-slate-100 px-3 py-2 text-slate-700">{row.receive_code || ""}</td>
                    <td className="border-b border-slate-100 px-3 py-2 font-mono font-semibold text-blue-700">{row.serial_no || "-"}</td>
                    <td className="truncate border-b border-slate-100 px-3 py-2 text-slate-700" title={row.customer_name || ""}>
                      {row.customer_name || ""}
                    </td>
                    <td className="truncate border-b border-slate-100 px-3 py-2 text-slate-700" title={row.driver_name || ""}>
                      {row.driver_name || ""}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2 text-slate-700">{row.driver_username || ""}</td>
                    <td className="truncate border-b border-slate-100 px-3 py-2 text-slate-700">
                      {[row.vehicle_model ? `(${row.vehicle_model})` : "", row.license_plate, row.license_plate_province].filter(Boolean).join(" ")}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-2 text-slate-700">{getDriverTypeLabel(row.driver_type)}</td>
                    <td className="truncate border-b border-slate-100 px-3 py-2 text-slate-700" title={row.warehouse_name || ""}>
                      {row.warehouse_name || ""}
                    </td>
                    <td className="truncate border-b border-slate-100 px-3 py-2 text-slate-700" title={row.to_warehouse_name || ""}>
                      {row.to_warehouse_name || ""}
                    </td>
                    <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-slate-600">{formatThaiDateTime(row.created_date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white">
          <TablePagination
            component="div"
            count={filteredRows.length}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value));
              setPage(0);
            }}
            labelRowsPerPage="Rows per page:"
            disabled={loading}
            sx={{
              color: "#475569",
              "& .MuiTablePagination-toolbar": { minHeight: 52 },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { margin: 0, fontSize: 13 },
            }}
          />
        </div>
      </section>
    </div>
  );
}
