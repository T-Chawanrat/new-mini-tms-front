import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Download, PackageOpen, RefreshCcw, Search } from "lucide-react";
import TablePagination from "@mui/material/TablePagination";
import * as XLSX from "xlsx";
import { Link } from "react-router-dom";

import AxiosInstance from "../services/apiClient";
import ResizableColumns from "../components/tms/table/ResizableColumns";
import { formatThaiNumber } from "../utils/textSanitizer";

type ProductWarehouseSerialItem = {
  serial_no: string;
  package_name: string | null;
  package_detail_name: string | null;
};

type ProductWarehouseRow = {
  delivery_date: string | null;
  receive_code: string | null;
  package_names: string | null;
  customer_id: number | null;
  customer_name: string | null;
  recipient_name: string | null;
  recipient_code: string | null;
  recipient_id: number | null;
  serial_nos: string | null;
  total_items: number | string;
  now_warehouse_id: number | null;
  now_warehouse_name: string | null;
  to_warehouse_id: number | null;
  to_warehouse_name: string | null;
  created_by: number | null;
  created_name: string | null;
  route_name: string | null;
};

type ProductWarehouseResponse = {
  success?: boolean;
  message?: string;
  data?: ProductWarehouseRow[];
  summary?: {
    total_bills?: number;
    total_items?: number;
  };
};

type ProductWarehouseSerialResponse = {
  success?: boolean;
  message?: string;
  data?: ProductWarehouseSerialItem[];
};

type AxiosLikeError = {
  response?: { data?: { message?: string } };
  message?: string;
};

const TABLE_COLUMN_COUNT = 11;

const getErrorMessage = (error: unknown) => {
  if (typeof error !== "object" || error === null) return "ไม่สามารถโหลดสินค้าในคลังได้";

  const axiosError = error as AxiosLikeError;
  return axiosError.response?.data?.message || axiosError.message || "ไม่สามารถโหลดสินค้าในคลังได้";
};

const formatDeliveryDate = (value: string | null) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function ProductWarehouse() {
  const [rows, setRows] = useState<ProductWarehouseRow[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeReceiveCode, setActiveReceiveCode] = useState("");
  const [serialItemsByReceiveCode, setSerialItemsByReceiveCode] = useState<Record<string, ProductWarehouseSerialItem[]>>({});
  const [loadingReceiveCode, setLoadingReceiveCode] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [totalBills, setTotalBills] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTerm = search.trim();
  const requestedSearch = searchTerm.length >= 3 ? searchTerm : "";
  const searchPending = requestedSearch !== debouncedSearch;
  const tableHeaders = useMemo(
    () => ["", "#", "วันที่ส่ง", "คลังปัจจุบัน", "คลังปลายทาง", "เลขที่บิล", "SN", "เจ้าของงาน", "ผู้รับ", "ผู้ยิงรับ", "สายรถ"],
    [],
  );
  const tableDefaultWidths = useMemo(
    () => Object.fromEntries([42, 56, 120, 180, 180, 210, 80, 230, 240, 170, 400].map((width, index) => [index, width])),
    [],
  );
  const tableMinWidths = useMemo(
    () => Object.fromEntries([42, 56, 105, 140, 140, 160, 65, 170, 180, 140, 180].map((width, index) => [index, width])),
    [],
  );

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await AxiosInstance.get<ProductWarehouseResponse>("/product-warehouses", {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: debouncedSearch || undefined,
        },
      });

      setRows(Array.isArray(response.data?.data) ? response.data.data : []);
      setTotalBills(Number(response.data?.summary?.total_bills || 0));
      setTotalItems(Number(response.data?.summary?.total_items || 0));
    } catch (loadError) {
      setRows([]);
      setTotalBills(0);
      setTotalItems(0);
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, rowsPerPage]);

  useEffect(() => {
    if (searchPending) return;
    void loadProducts();
  }, [loadProducts, searchPending]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(requestedSearch), 300);
    return () => window.clearTimeout(timer);
  }, [requestedSearch]);

  useEffect(() => {
    const lastPage = Math.max(Math.ceil(totalBills / rowsPerPage) - 1, 0);
    if (page > lastPage) setPage(lastPage);
  }, [totalBills, page, rowsPerPage]);

  const toggleReceive = async (receiveCode: string) => {
    if (activeReceiveCode === receiveCode) {
      setActiveReceiveCode("");
      return;
    }

    setActiveReceiveCode(receiveCode);
    if (loadingReceiveCode === receiveCode || Object.prototype.hasOwnProperty.call(serialItemsByReceiveCode, receiveCode)) return;

    setLoadingReceiveCode(receiveCode);
    try {
      const response = await AxiosInstance.get<ProductWarehouseSerialResponse>(
        `/product-warehouses/${encodeURIComponent(receiveCode)}/serials`,
      );
      setSerialItemsByReceiveCode((current) => ({
        ...current,
        [receiveCode]: Array.isArray(response.data?.data) ? response.data.data : [],
      }));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoadingReceiveCode((current) => (current === receiveCode ? "" : current));
    }
  };

  const exportExcel = async () => {
    if (!totalBills) return;

    try {
      const response = await AxiosInstance.get<ProductWarehouseResponse>("/product-warehouses", {
        params: { search: search.trim() || undefined, export: 1 },
      });
      const exportRows = (response.data?.data || []).map((row) => ({
        "วันที่ส่ง": formatDeliveryDate(row.delivery_date),
        "คลังปัจจุบัน": row.now_warehouse_name || "",
        "คลังปลายทาง": row.to_warehouse_name || "",
        "เลขที่บิล": row.receive_code || "",
        "Serial No": row.serial_nos || "",
        "จำนวนชิ้น": Number(row.total_items || 0),
        "สินค้า": row.package_names || "",
        "เจ้าของงาน": row.customer_name || "",
        "ผู้รับ": row.recipient_name || "",
        "รหัสผู้รับ": row.recipient_code || "",
        "ผู้ยิงรับ": row.created_name || "",
      }));

      if (!exportRows.length) return;

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "สินค้าในคลัง");

      const dateText = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      XLSX.writeFile(workbook, `สินค้าในคลัง_${dateText}.xlsx`);
    } catch (exportError) {
      setError(getErrorMessage(exportError));
    }
  };

  return (
    <div className="flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 px-1 py-2 text-slate-800">
      <section className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <PackageOpen size={18} className="text-blue-600" />
            สินค้าในคลัง
          </h1>
          <p className="mt-0.5 text-[11px] text-slate-500">กดรายการบิลเพื่อดู Serial No ภายในบิล</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
            ทั้งหมด <span className="font-bold">{formatThaiNumber(totalBills)}</span> บิล,
            <span className="ml-1 font-bold">{formatThaiNumber(totalItems)}</span> ชิ้น
          </div>
          <button
            type="button"
            onClick={() => void exportExcel()}
            disabled={loading || totalBills === 0}
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full gap-1 overflow-x-auto sm:w-auto">
            <Link
              to="/product-warehouse"
              className="inline-flex h-8 items-center rounded-md bg-blue-600 px-3 text-xs font-semibold text-white"
            >
              บิล
            </Link>
            <Link
              to="/product-warehouse/serials"
              className="inline-flex h-8 items-center rounded-md bg-slate-100 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              ราย SN
            </Link>
          </div>
          <div className="relative w-full max-w-2xl">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
                setActiveReceiveCode("");
              }}
              placeholder="ค้นหาเลขที่บิล, Serial No, สินค้า, เจ้าของงาน หรือผู้รับ"
              className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </section>

      {error && <div className="mb-2 shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[1620px] table-fixed border-collapse text-left text-xs">
            <ResizableColumns
              headers={tableHeaders}
              pageKey="product-warehouse"
              defaultWidths={tableDefaultWidths}
              minWidths={tableMinWidths}
              headerClassName="sticky top-0 z-0 bg-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-600"
              headerCellClassName="relative sticky top-0 z-0 border-b border-slate-200 bg-slate-100 px-3 py-2 select-none"
            />

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={TABLE_COLUMN_COUNT} className="px-3 py-12 text-center text-sm text-slate-500">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_COLUMN_COUNT} className="px-3 py-12 text-center text-sm text-slate-500">ไม่พบสินค้าในคลัง</td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const receiveCode = row.receive_code || `warehouse-bill-${page}-${index}`;
                  const expanded = activeReceiveCode === receiveCode;
                  const absoluteIndex = page * rowsPerPage + index + 1;

                  return (
                    <WarehouseBillRows
                      key={receiveCode}
                      row={row}
                      rowNumber={absoluteIndex}
                      striped={index % 2 === 1}
                      expanded={expanded}
                      serialItems={serialItemsByReceiveCode[receiveCode] || []}
                      loadingSerialItems={loadingReceiveCode === receiveCode}
                      onToggle={() => void toggleReceive(receiveCode)}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white">
          <TablePagination
            component="div"
            count={totalBills}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onPageChange={(_, nextPage) => {
              setPage(nextPage);
              setActiveReceiveCode("");
            }}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value));
              setPage(0);
              setActiveReceiveCode("");
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

type WarehouseBillRowsProps = {
  row: ProductWarehouseRow;
  rowNumber: number;
  striped: boolean;
  expanded: boolean;
  serialItems: ProductWarehouseSerialItem[];
  loadingSerialItems: boolean;
  onToggle: () => void;
};

function WarehouseBillRows({ row, rowNumber, striped, expanded, serialItems, loadingSerialItems, onToggle }: WarehouseBillRowsProps) {

  return (
    <>
      <tr
        onClick={onToggle}
        className={expanded ? "cursor-pointer bg-blue-50/90" : `cursor-pointer hover:bg-blue-100 ${striped ? "bg-slate-50" : "bg-white"}`}
      >
        <td className="border-b border-slate-100 px-2 py-2 text-center text-slate-500">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </td>
        <td className="border-b border-slate-100 px-2 py-2 text-center font-semibold text-slate-500">{formatThaiNumber(rowNumber)}</td>
        <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-slate-700">{formatDeliveryDate(row.delivery_date)}</td>
        <td className="truncate border-b border-slate-100 px-3 py-2 text-slate-700" title={row.now_warehouse_name || "-"}>{row.now_warehouse_name || "-"}</td>
        <td className="truncate border-b border-slate-100 px-3 py-2 text-slate-700" title={row.to_warehouse_name || "-"}>{row.to_warehouse_name || "-"}</td>
        <td className="border-b border-slate-100 px-3 py-2">
          <div className="truncate font-semibold text-blue-700">{row.receive_code || "-"}</div>
          <div className="truncate text-[11px] text-slate-400">{expanded ? "กำลังแสดง Serial No" : "กดเพื่อดู Serial No"}</div>
        </td>
        <td className="border-b border-slate-100 px-3 py-2 text-right font-semibold text-slate-800">{formatThaiNumber(row.total_items)}</td>
        <td className="truncate border-b border-slate-100 px-3 py-2 text-slate-700" title={row.customer_name || "-"}>{row.customer_name || "-"}</td>
        <td className="border-b border-slate-100 px-3 py-2">
          <div className="truncate text-slate-700">{row.recipient_name || "-"}</div>
          <div className="truncate text-[11px] text-slate-400">{row.recipient_code || "-"}</div>
        </td>
        <td className="truncate border-b border-slate-100 px-3 py-2 text-slate-700" title={row.created_name || "-"}>{row.created_name || "-"}</td>
        <td className="truncate border-b border-slate-100 px-3 py-2 text-slate-700" title={row.route_name || "-"}>{row.route_name || "-"}</td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={TABLE_COLUMN_COUNT} className="bg-slate-50 px-3 py-3">
            <SerialInlineTable items={serialItems} loading={loadingSerialItems} />
          </td>
        </tr>
      )}
    </>
  );
}

function SerialInlineTable({ items, loading }: { items: ProductWarehouseSerialItem[]; loading: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[330px] overflow-auto">
        <table className="w-full min-w-[420px] border-collapse text-left text-xs">
          <thead className="sticky top-0 z-0 bg-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <tr className="border-b border-slate-200">
              <th className="w-[70px] px-3 py-2 text-center">#</th>
              <th className="w-[42%] px-3 py-2">Serial No</th>
              <th className="px-3 py-2">สินค้า</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-sm text-slate-500">กำลังโหลด Serial No...</td>
              </tr>
            ) : items.length ? (
              items.map((item, index) => (
                <tr key={`${item.serial_no}-${index}`} className={index % 2 === 0 ? "bg-white hover:bg-blue-100" : "bg-slate-50 hover:bg-blue-100"}>
                  <td className="border-b border-slate-100 px-3 py-2 text-center font-semibold text-slate-500">{formatThaiNumber(index + 1)}</td>
                  <td className="border-b border-slate-100 px-3 py-2 font-mono font-semibold text-blue-700">{item.serial_no}</td>
                  <td className="border-b border-slate-100 px-3 py-2 text-slate-700">
                    {[item.package_name, item.package_detail_name].filter(Boolean).join(" - ") || "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-sm text-slate-500">ไม่พบ Serial No</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
