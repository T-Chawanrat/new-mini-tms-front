import { Fragment, useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search } from "lucide-react";
import AxiosInstance from "../utils/AxiosInstance";
import DatePicker from "../components/form/DatePicker";
import ResizableColumns from "../components/ResizableColumns";
import type { Filters, Option, Pagination, ReceiveReportRow, ReceiveReportSummary, ReceiveSerialRow } from "../types/receiveReport";
import {
  buildReceiveReportQueryParams,
  defaultReceiveReportFilters,
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  getReturnedText,
  getText,
  receiveReportHeaders,
  receiveReportMinWidths,
  receiveSerialHeaders,
  receiveSerialMinWidths,
} from "../utils/receiveReportHelpers";

export default function ReceiveReport() {
  const [rows, setRows] = useState<ReceiveReportRow[]>([]);
  const [summary, setSummary] = useState<ReceiveReportSummary | null>(null);

  const [customers, setCustomers] = useState<Option[]>([]);
  const [warehousesTo, setWarehousesTo] = useState<Option[]>([]);

  const [filters, setFilters] = useState<Filters>(defaultReceiveReportFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(defaultReceiveReportFilters);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [serialMap, setSerialMap] = useState<Record<string, ReceiveSerialRow[]>>({});
  const [serialLoadingMap, setSerialLoadingMap] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showingFrom = useMemo(() => {
    if (!pagination.total) return 0;
    return (pagination.page - 1) * pagination.limit + 1;
  }, [pagination]);

  const showingTo = useMemo(() => {
    return Math.min(pagination.page * pagination.limit, pagination.total);
  }, [pagination]);

  const summaryTotal = summary?.total || null;
  const summaryDaily = summary?.daily || [];

  const updateFilter = (name: keyof Filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getRowKey = (row: ReceiveReportRow, index: number) => {
    return String(row.receive_business_id || row.receive_code || index);
  };

  const fetchReceiveSerials = async (row: ReceiveReportRow, rowKey: string) => {
    if (serialMap[rowKey]) return;

    if (Array.isArray(row.serials)) {
      setSerialMap((prev) => ({
        ...prev,
        [rowKey]: row.serials || [],
      }));
      return;
    }

    if (!row.receive_business_id) return;

    try {
      setSerialLoadingMap((prev) => ({
        ...prev,
        [rowKey]: true,
      }));

      const res = await AxiosInstance.get(`/receive-report/${row.receive_business_id}/serials`);

      setSerialMap((prev) => ({
        ...prev,
        [rowKey]: res.data?.data || [],
      }));
    } catch (err) {
      console.error("fetch receive serials error:", err);

      setSerialMap((prev) => ({
        ...prev,
        [rowKey]: [],
      }));
    } finally {
      setSerialLoadingMap((prev) => ({
        ...prev,
        [rowKey]: false,
      }));
    }
  };

  const toggleRow = async (row: ReceiveReportRow, rowKey: string) => {
    const nextExpanded = !expandedRows[rowKey];

    setExpandedRows((prev) => ({
      ...prev,
      [rowKey]: nextExpanded,
    }));

    if (nextExpanded) {
      await fetchReceiveSerials(row, rowKey);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      setFilterLoading(true);

      const [customersRes, warehousesRes] = await Promise.all([AxiosInstance.get("/customers"), AxiosInstance.get("/warehouses")]);

      setCustomers(customersRes.data || []);
      setWarehousesTo(warehousesRes.data || []);
    } catch (err) {
      console.error("fetch filter options error:", err);
      setCustomers([]);
      setWarehousesTo([]);
    } finally {
      setFilterLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = buildReceiveReportQueryParams(appliedFilters, page, limit);
      const res = await AxiosInstance.get(`/receive-report?${params.toString()}`);

      const nextRows: ReceiveReportRow[] = res.data?.data || [];

      setRows(nextRows);
      setSerialMap({});
      setSerialLoadingMap({});
      setExpandedRows({});

      setPagination(
        res.data?.pagination || {
          page,
          limit,
          total: 0,
          totalPages: 1,
        },
      );
    } catch (err) {
      console.error("fetch receive report error:", err);
      setRows([]);
      setError("โหลดข้อมูล Receive Report ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      setSummaryLoading(true);

      const params = buildReceiveReportQueryParams(appliedFilters, 1, limit);
      params.delete("page");
      params.delete("limit");

      const res = await AxiosInstance.get(`/receive-report/summary?${params.toString()}`);

      setSummary(res.data?.data || null);
    } catch (err) {
      console.error("fetch receive report summary error:", err);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  const resetExpandedData = () => {
    setExpandedRows({});
    setSerialMap({});
    setSerialLoadingMap({});
  };

  const handleSearch = () => {
    setPage(1);
    resetExpandedData();
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    setFilters(defaultReceiveReportFilters);
    setAppliedFilters(defaultReceiveReportFilters);
    resetExpandedData();
    setPage(1);
  };

  const handleRefresh = () => {
    resetExpandedData();
    fetchReport();
    fetchSummary();
  };

  const handleLimitChange = (value: string) => {
    setLimit(Number(value));
    setPage(1);
    resetExpandedData();
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchReport();
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, page, limit]);

  return (
    <div className="flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 p-3 text-slate-800">
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Receive Report</h1>
          <p className="mt-0.5 text-[11px] text-slate-500">ค้นหา receive, serial และดูรายละเอียดแบบขยายแถว</p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading || summaryLoading}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw size={13} className={loading || summaryLoading ? "animate-spin" : ""} />
          รีเฟรช
        </button>
      </div>

      <div className="mb-3 shrink-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[160px_1fr_1fr_1.25fr_1.25fr_auto] lg:items-center">
          <div className="h-9">
            <DatePicker
              variant="compact"
              value={filters.receive_date_from}
              onChange={(value) => updateFilter("receive_date_from", value)}
              placeholder="Receive Date"
            />
          </div>

          <FilterInput value={filters.receive_code} onChange={(value) => updateFilter("receive_code", value)} placeholder="Receive Code" />

          <FilterInput value={filters.serial_no} onChange={(value) => updateFilter("serial_no", value)} placeholder="Serial No" />

          <FilterDropdown
            value={filters.customer_id}
            options={customers}
            onChange={(value) => updateFilter("customer_id", value)}
            placeholder={filterLoading ? "กำลังโหลด Customer..." : "Customer ทั้งหมด"}
            showCode
          />

          <FilterDropdown
            value={filters.to_warehouse_id}
            options={warehousesTo}
            onChange={(value) => updateFilter("to_warehouse_id", value)}
            placeholder={filterLoading ? "กำลังโหลด To Warehouse..." : "To Warehouse ทั้งหมด"}
            optionKeyPrefix="warehouse-to"
            showCode
          />

          <div className="flex min-w-[132px] gap-2">
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              <Search size={13} />
              ค้นหา
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              ล้าง
            </button>
          </div>
        </div>
      </div>

      <div className="mb-3 grid shrink-0 grid-cols-2 gap-2 md:grid-cols-5">
        <SummaryCard label="Receive" value={summaryLoading ? "..." : formatNumber(summaryTotal?.total_receive)} accent />
        <SummaryCard label="Serial" value={summaryLoading ? "..." : formatNumber(summaryTotal?.total_serial)} />
        <SummaryCard label="Rows" value={summaryLoading ? "..." : formatNumber(summaryTotal?.total_rows)} />
        <SummaryCard label="Cost" value={summaryLoading ? "..." : formatMoney(summaryTotal?.total_cost)} />
        <SummaryCard label="COD" value={summaryLoading ? "..." : formatMoney(summaryTotal?.total_cod)} />
      </div>

      <div className="mb-3 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-3 py-2">
          <div className="text-xs font-semibold text-slate-800">สรุปรายวัน</div>
        </div>

        <div className="max-h-[150px] overflow-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              <tr className="border-b border-slate-200">
                <th className="px-3 py-2">Receive Date</th>
                <th className="px-3 py-2 text-right">Receive</th>
                <th className="px-3 py-2 text-right">Serial</th>
                <th className="px-3 py-2 text-right">Cost</th>
                <th className="px-3 py-2 text-right">COD</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {summaryLoading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-5 text-center text-xs text-slate-500">
                    กำลังโหลดข้อมูลสรุป...
                  </td>
                </tr>
              ) : summaryDaily.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-5 text-center text-xs text-slate-500">
                    ไม่พบข้อมูลสรุปรายวัน
                  </td>
                </tr>
              ) : (
                summaryDaily.map((day) => (
                  <tr key={String(day.receive_date)} className="hover:bg-blue-50/40">
                    <td className="whitespace-nowrap px-3 py-1.5 font-medium text-slate-800">{formatDate(day.receive_date)}</td>
                    <td className="whitespace-nowrap px-3 py-1.5 text-right font-semibold text-blue-700">{formatNumber(day.total_receive)}</td>
                    <td className="whitespace-nowrap px-3 py-1.5 text-right text-slate-700">{formatNumber(day.total_serial)}</td>
                    <td className="whitespace-nowrap px-3 py-1.5 text-right text-slate-700">{formatMoney(day.total_cost)}</td>
                    <td className="whitespace-nowrap px-3 py-1.5 text-right text-slate-700">{formatMoney(day.total_cod)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex h-10 items-center justify-between border-b border-slate-200 px-3">
          <div className="text-xs font-semibold text-slate-800">รายการ Receive</div>

          <div className="text-[11px] text-slate-500">
            {pagination.total > 0
              ? `แสดง ${formatNumber(showingFrom)} - ${formatNumber(showingTo)} จาก ${formatNumber(pagination.total)} receive_code`
              : "ยังไม่มีข้อมูล"}
          </div>
        </div>

        {error ? (
          <div className="p-6 text-center text-sm text-red-600">{error}</div>
        ) : (
          <div className="h-[calc(100%-82px)] overflow-auto">
            <table className="min-w-max border-collapse text-left text-xs">
              <ResizableColumns headers={receiveReportHeaders} pageKey="receive-report-main-v1" minWidths={receiveReportMinWidths} />

              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={receiveReportHeaders.length} className="px-3 py-10 text-center text-sm text-slate-500">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={receiveReportHeaders.length} className="px-3 py-10 text-center text-sm text-slate-500">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => {
                    const rowKey = getRowKey(row, index);
                    const isExpanded = !!expandedRows[rowKey];
                    const serials = serialMap[rowKey] || [];
                    const serialLoading = !!serialLoadingMap[rowKey];

                    return (
                      <Fragment key={rowKey}>
                        <tr
                          className={
                            isExpanded ? "bg-blue-50/70" : index % 2 === 0 ? "bg-white hover:bg-blue-50/40" : "bg-slate-50/70 hover:bg-blue-50/40"
                          }
                        >
                          <td className="w-[60px] min-w-[60px] max-w-[60px] whitespace-nowrap border-b border-slate-100 px-2 py-2 text-center font-semibold text-slate-500">
                            {formatNumber((pagination.page - 1) * pagination.limit + index + 1)}
                          </td>

                          <td className="sticky left-0 z-10 whitespace-nowrap border-b border-slate-100 bg-inherit px-3 py-2">
                            <button
                              type="button"
                              onClick={() => toggleRow(row, rowKey)}
                              className="font-semibold text-blue-700 underline-offset-2 hover:underline"
                              title="กดเพื่อดู Serial No"
                            >
                              {getText(row.receive_code)}
                            </button>
                          </td>

                          <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-slate-700">{formatDateTime(row.receive_date)}</td>
                          <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-slate-700">{formatDate(row.delivery_date)}</td>
                          <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-right font-semibold text-slate-800">
                            {formatNumber(row.total_serial)}
                          </td>
                          <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-right text-slate-700">
                            {formatMoney(row.total_cost)}
                          </td>
                          <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-right text-slate-700">
                            {formatMoney(row.total_cod)}
                          </td>

                          <td
                            className="max-w-[260px] truncate border-b border-slate-100 px-3 py-2 text-slate-700"
                            title={getText(row.customer_name || row.customer_id)}
                          >
                            {getText(row.customer_name || row.customer_id)}
                          </td>

                          <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-slate-700">{getText(row.customer_type)}</td>

                          <td
                            className="max-w-[220px] truncate border-b border-slate-100 px-3 py-2 text-slate-700"
                            title={getText(row.to_warehouse_name || row.to_warehouse_id)}
                          >
                            {getText(row.to_warehouse_name || row.to_warehouse_id)}
                          </td>

                          <td className="max-w-[220px] truncate border-b border-slate-100 px-3 py-2 text-slate-700" title={getText(row.shipper_name)}>
                            {getText(row.shipper_name)}
                          </td>

                          <td className="max-w-[260px] border-b border-slate-100 px-3 py-2 text-slate-800">
                            <div className="truncate" title={getText(row.recipient_name)}>
                              {getText(row.recipient_name)}
                            </div>
                            <div className="truncate text-[11px] text-slate-400" title={getText(row.recipient_code)}>
                              {getText(row.recipient_code)}
                            </div>
                          </td>

                          <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-slate-700">{getText(row.tel)}</td>

                          <td className="max-w-[240px] border-b border-slate-100 px-3 py-2 text-slate-700">
                            <div className="truncate" title={getText(row.province_name)}>
                              {getText(row.province_name)}
                            </div>
                            <div
                              className="truncate text-[11px] text-slate-400"
                              title={`${getText(row.district_name)} / ${getText(row.subdistrict_name)}`}
                            >
                              {getText(row.district_name)} / {getText(row.subdistrict_name)}
                            </div>
                          </td>
                        </tr>

                        {isExpanded ? (
                          <tr>
                            <td colSpan={receiveReportHeaders.length} className="bg-slate-50 px-3 py-3">
                              <SerialTable loading={serialLoading} serials={serials} />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex h-[42px] shrink-0 items-center justify-between border-t border-slate-200 bg-white px-3 py-1.5">
          <div className="text-[11px] text-slate-500">
            {pagination.total > 0
              ? `แสดง ${formatNumber(showingFrom)} - ${formatNumber(showingTo)} จาก ${formatNumber(pagination.total)} receive_code`
              : "ยังไม่มีข้อมูล"}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500">แสดง</span>

              <select
                value={limit}
                onChange={(e) => handleLimitChange(e.target.value)}
                className="h-7 rounded-md border border-slate-300 bg-white px-1.5 text-[11px] text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>

              <span className="text-[11px] text-slate-500">รายการ</span>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <div className="text-[11px] text-slate-500">
              Page {formatNumber(pagination.page)} / {formatNumber(pagination.totalPages || 1)}
            </div>

            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="inline-flex h-7 items-center justify-center rounded-md border border-slate-300 bg-white px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ก่อนหน้า
            </button>

            <button
              type="button"
              disabled={loading || page >= pagination.totalPages}
              onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
              className="inline-flex h-7 items-center justify-center rounded-md border border-slate-300 bg-white px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  accent?: boolean;
};

function SummaryCard({ label, value, accent = false }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="text-[11px] font-medium text-slate-500">{label}</div>
      <div className={`mt-1 truncate text-base font-bold ${accent ? "text-blue-700" : "text-slate-800"}`}>{value}</div>
    </div>
  );
}

type SerialTableProps = {
  loading: boolean;
  serials: ReceiveSerialRow[];
};

function SerialTable({ loading, serials }: SerialTableProps) {
  if (loading) {
    return <div className="rounded-md border border-slate-200 bg-white px-3 py-4 text-center text-xs text-slate-500">กำลังโหลด Serial No...</div>;
  }

  if (!serials.length) {
    return (
      <div className="rounded-md border border-slate-200 bg-white px-3 py-4 text-center text-xs text-slate-500">
        ไม่พบ Serial No ใน Receive Code นี้
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-max border-collapse text-left text-xs">
        <ResizableColumns headers={receiveSerialHeaders} pageKey="receive-report-serial" minWidths={receiveSerialMinWidths} />

        <tbody className="divide-y divide-slate-100">
          {serials.map((serial, index) => (
            <tr
              key={`${serial.serial_no || "serial"}-${index}`}
              className={index % 2 === 0 ? "bg-white hover:bg-blue-50/40" : "bg-slate-50/70 hover:bg-blue-50/40"}
            >
              <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 font-medium text-slate-900">{getText(serial.serial_no)}</td>

              <td className="max-w-[260px] border-b border-slate-100 px-3 py-2 text-slate-700">
                <div className="truncate" title={getText(serial.package_name)}>
                  {getText(serial.package_name)}
                </div>
                <div className="truncate text-[11px] text-slate-400" title={getText(serial.package_detail_name)}>
                  {getText(serial.package_detail_name)}
                </div>
              </td>

              <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-right text-slate-700">{formatMoney(serial.cost)}</td>
              <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-right text-slate-700">{formatMoney(serial.cod)}</td>

              <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-right text-slate-700">
                {formatNumber(serial.width, 0)} x {formatNumber(serial.length, 0)} x {formatNumber(serial.height, 0)}
              </td>

              <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-slate-700">{getReturnedText(serial.is_returned)}</td>

              <td className="max-w-[260px] truncate border-b border-slate-100 px-3 py-2 text-slate-700" title={getText(serial.remark)}>
                {getText(serial.remark)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type FilterInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function FilterInput({ value, onChange, placeholder }: FilterInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  );
}

type FilterDropdownProps = {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  showCode?: boolean;
  optionKeyPrefix?: string;
};

function FilterDropdown({ value, options, onChange, placeholder = "ทั้งหมด", showCode = false, optionKeyPrefix = "option" }: FilterDropdownProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    >
      <option value="">{placeholder}</option>

      {options.map((option) => (
        <option key={`${optionKeyPrefix}-${option.id}`} value={option.id}>
          {showCode && option.code ? `${option.code} - ${option.name}` : option.name}
        </option>
      ))}
    </select>
  );
}
