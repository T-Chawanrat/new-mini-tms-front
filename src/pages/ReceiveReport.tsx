import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Package,
  Users,
  CreditCard,
} from "lucide-react";
import AxiosInstance from "../utils/AxiosInstance";

type Option = {
  id: number;
  name: string;
  code?: string;
};

type ReceiveReportRow = {
  receive_code: string | null;
  receive_date: string | null;
  delivery_date: string | null;

  serial_no: string | null;

  package_name: string | null;
  package_detail_name: string | null;

  customer_id: number | null;
  customer_type: string | null;

  cost: number | string | null;
  cod: number | string | null;

  from_warehouse_id: number | null;
  to_warehouse_id: number | null;

  recipient_code: string | null;
  recipient_name: string | null;

  address: string | null;
  subdistrict_name: string | null;
  district_name: string | null;
  province_name: string | null;
  zip_code: string | null;
  tel: string | null;

  shipper_name: string | null;

  weight: number | string | null;
  q: number | string | null;
  vol: number | string | null;
  size_type: string | null;

  is_returned: string | null;
  payment_type_id: number | null;

  item_is_deleted: string | null;
  last_modified: string | null;
};

type ReceiveReportSummary = {
  total_rows: number | string;
  total_receive: number | string;
  total_serial: number | string;
  total_recipient: number | string;
  total_cost: number | string;
  total_cod: number | string;
  total_weight: number | string;
  total_qty: number | string;
  total_vol: number | string;
  total_customer: number | string;
  total_shipper: number | string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type Filters = {
  receive_code: string;
  serial_no: string;
  recipient_name: string;

  customer_id: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  payment_type_id: string;

  delivery_date_from: string;
  delivery_date_to: string;
};

const defaultFilters: Filters = {
  receive_code: "",
  serial_no: "",
  recipient_name: "",

  customer_id: "",
  from_warehouse_id: "",
  to_warehouse_id: "",
  payment_type_id: "",

  delivery_date_from: "",
  delivery_date_to: "",
};

const formatDate = (value: string | null) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const formatDateTime = (value: string | null) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatNumber = (value: number | string | null | undefined, digits = 0) => {
  const numberValue = Number(value || 0);

  return numberValue.toLocaleString("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const formatMoney = (value: number | string | null | undefined) => {
  return formatNumber(value, 2);
};

const getText = (value: string | number | null | undefined) => {
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
};

const buildQueryParams = (
  filters: Filters,
  page: number,
  limit: number
): URLSearchParams => {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));

  Object.entries(filters).forEach(([key, value]) => {
    const cleanValue = String(value || "").trim();

    if (cleanValue) {
      params.set(key, cleanValue);
    }
  });

  return params;
};

export default function ReceiveReport() {
  const [rows, setRows] = useState<ReceiveReportRow[]>([]);
  const [summary, setSummary] = useState<ReceiveReportSummary | null>(null);

  const [customers, setCustomers] = useState<Option[]>([]);
  const [warehouses, setWarehouses] = useState<Option[]>([]);
  const [payments, setPayments] = useState<Option[]>([]);

  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(defaultFilters);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

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

  const updateFilter = (name: keyof Filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchFilterOptions = async () => {
    try {
      setFilterLoading(true);

      const [customersRes, warehousesRes, paymentsRes] = await Promise.all([
        AxiosInstance.get("/customers"),
        AxiosInstance.get("/warehouses"),
        AxiosInstance.get("/payments"),
      ]);

      setCustomers(customersRes.data || []);
      setWarehouses(warehousesRes.data || []);
      setPayments(paymentsRes.data || []);
    } catch (err) {
      console.error("fetch filter options error:", err);
      setCustomers([]);
      setWarehouses([]);
      setPayments([]);
    } finally {
      setFilterLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = buildQueryParams(appliedFilters, page, limit);
      const res = await AxiosInstance.get(`/receive-report?${params.toString()}`);

      setRows(res.data?.data || []);
      setPagination(
        res.data?.pagination || {
          page,
          limit,
          total: 0,
          totalPages: 1,
        }
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

      const params = buildQueryParams(appliedFilters, 1, limit);
      params.delete("page");
      params.delete("limit");

      const res = await AxiosInstance.get(
        `/receive-report/summary?${params.toString()}`
      );

      setSummary(res.data?.data || null);
    } catch (err) {
      console.error("fetch receive report summary error:", err);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setPage(1);
  };

  const handleLimitChange = (value: string) => {
    setLimit(Number(value));
    setPage(1);
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
    <div className="min-h-screen bg-slate-50 p-4 text-slate-800">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Receive Report
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              รายงานข้อมูลจาก tm_receive_serials
            </p>
          </div>

          <button
            type="button"
            onClick={fetchReport}
            disabled={loading}
            className="inline-flex h-9 w-fit items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
            รีเฟรช
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
          <SummaryCard
            title="Receive"
            value={summary?.total_receive}
            icon={<FileText size={16} />}
            loading={summaryLoading}
          />

          <SummaryCard
            title="Serial"
            value={summary?.total_serial}
            icon={<Package size={16} />}
            loading={summaryLoading}
          />

          <SummaryCard
            title="Rows"
            value={summary?.total_rows}
            icon={<FileText size={16} />}
            loading={summaryLoading}
          />

          <SummaryCard
            title="Recipient"
            value={summary?.total_recipient}
            icon={<Users size={16} />}
            loading={summaryLoading}
          />

          <SummaryCard
            title="COD"
            value={summary?.total_cod}
            suffix="บาท"
            digits={2}
            icon={<CreditCard size={16} />}
            loading={summaryLoading}
          />

          <SummaryCard
            title="Weight"
            value={summary?.total_weight}
            suffix="kg"
            digits={2}
            loading={summaryLoading}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">ตัวกรอง</h2>

            {filterLoading ? (
              <span className="text-xs text-slate-400">กำลังโหลด dropdown...</span>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <FilterInput
              label="Receive Code"
              value={filters.receive_code}
              onChange={(value) => updateFilter("receive_code", value)}
              placeholder="ค้นหา receive_code"
            />

            <FilterInput
              label="Serial No"
              value={filters.serial_no}
              onChange={(value) => updateFilter("serial_no", value)}
              placeholder="ค้นหา serial_no"
            />

            <FilterInput
              label="Recipient Name"
              value={filters.recipient_name}
              onChange={(value) => updateFilter("recipient_name", value)}
              placeholder="ค้นหาชื่อผู้รับ"
            />

            <FilterDropdown
              label="Customer"
              value={filters.customer_id}
              options={customers}
              onChange={(value) => updateFilter("customer_id", value)}
              placeholder="Customer ทั้งหมด"
              showCode
            />

            <FilterDropdown
              label="From Warehouse"
              value={filters.from_warehouse_id}
              options={warehouses}
              onChange={(value) => updateFilter("from_warehouse_id", value)}
              placeholder="From Warehouse ทั้งหมด"
            />

            <FilterDropdown
              label="To Warehouse"
              value={filters.to_warehouse_id}
              options={warehouses}
              onChange={(value) => updateFilter("to_warehouse_id", value)}
              placeholder="To Warehouse ทั้งหมด"
            />

            <FilterDropdown
              label="Payment"
              value={filters.payment_type_id}
              options={payments}
              onChange={(value) => updateFilter("payment_type_id", value)}
              placeholder="Payment ทั้งหมด"
            />

            <FilterInput
              label="Delivery Date From"
              value={filters.delivery_date_from}
              onChange={(value) => updateFilter("delivery_date_from", value)}
              type="date"
            />

            <FilterInput
              label="Delivery Date To"
              value={filters.delivery_date_to}
              onChange={(value) => updateFilter("delivery_date_to", value)}
              type="date"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 disabled:shadow-none"
            >
              <Search size={14} />
              ค้นหา
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              ล้างค่า
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                รายการ Receive
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {pagination.total > 0
                  ? `แสดง ${formatNumber(showingFrom)} - ${formatNumber(
                      showingTo
                    )} จาก ${formatNumber(pagination.total)} รายการ`
                  : "ยังไม่มีข้อมูล"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">แสดง</span>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(e.target.value)}
                className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
              <span className="text-xs text-slate-500">รายการ</span>
            </div>
          </div>

          {error ? (
            <div className="p-6 text-center text-sm text-red-600">{error}</div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="min-w-[1900px] w-full border-collapse text-left text-xs">
                <thead className="bg-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  <tr className="border-b border-slate-200">
                    <th className="sticky left-0 z-20 bg-slate-100 px-3 py-3">
                      Receive Code
                    </th>
                    <th className="px-3 py-3">Receive Date</th>
                    <th className="px-3 py-3">Delivery Date</th>
                    <th className="px-3 py-3">Serial No</th>
                    <th className="px-3 py-3">Package</th>
                    <th className="px-3 py-3">Customer ID</th>
                    <th className="px-3 py-3">Shipper</th>
                    <th className="px-3 py-3">Recipient</th>
                    <th className="px-3 py-3">Tel</th>
                    <th className="px-3 py-3">Address</th>
                    <th className="px-3 py-3">Province</th>
                    <th className="px-3 py-3 text-right">Cost</th>
                    <th className="px-3 py-3 text-right">COD</th>
                    <th className="px-3 py-3 text-right">Weight</th>
                    <th className="px-3 py-3 text-right">Q</th>
                    <th className="px-3 py-3">Payment</th>
                    <th className="px-3 py-3">Returned</th>
                    <th className="px-3 py-3">Deleted</th>
                    <th className="px-3 py-3">Last Modified</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={19}
                        className="px-3 py-10 text-center text-sm text-slate-500"
                      >
                        กำลังโหลดข้อมูล...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={19}
                        className="px-3 py-10 text-center text-sm text-slate-500"
                      >
                        ไม่พบข้อมูล
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, index) => (
                      <tr
                        key={`${row.receive_code || "receive"}-${
                          row.serial_no || "serial"
                        }-${index}`}
                        className="transition hover:bg-blue-50/40"
                      >
                        <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-2 font-medium text-blue-700">
                          {getText(row.receive_code)}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                          {formatDateTime(row.receive_date)}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                          {formatDate(row.delivery_date)}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-800">
                          {getText(row.serial_no)}
                        </td>

                        <td className="min-w-[160px] px-3 py-2 text-slate-700">
                          <div>{getText(row.package_name)}</div>
                          <div className="text-[11px] text-slate-400">
                            {getText(row.package_detail_name)}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                          {getText(row.customer_id)}
                        </td>

                        <td className="min-w-[160px] px-3 py-2 text-slate-700">
                          {getText(row.shipper_name)}
                        </td>

                        <td className="min-w-[200px] px-3 py-2 text-slate-800">
                          <div>{getText(row.recipient_name)}</div>
                          <div className="text-[11px] text-slate-400">
                            {getText(row.recipient_code)}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                          {getText(row.tel)}
                        </td>

                        <td className="min-w-[260px] px-3 py-2 text-slate-700">
                          {getText(row.address)}
                        </td>

                        <td className="min-w-[180px] px-3 py-2 text-slate-700">
                          <div>{getText(row.province_name)}</div>
                          <div className="text-[11px] text-slate-400">
                            {getText(row.district_name)} /{" "}
                            {getText(row.subdistrict_name)}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-3 py-2 text-right text-slate-700">
                          {formatMoney(row.cost)}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2 text-right text-slate-700">
                          {formatMoney(row.cod)}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2 text-right text-slate-700">
                          {formatNumber(row.weight, 2)}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2 text-right text-slate-700">
                          {formatNumber(row.q, 0)}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                          {getText(row.payment_type_id)}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2">
                          <StatusBadge value={row.is_returned} />
                        </td>

                        <td className="whitespace-nowrap px-3 py-2">
                          <StatusBadge value={row.item_is_deleted} />
                        </td>

                        <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                          {formatDateTime(row.last_modified)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-slate-500">
              Page {formatNumber(pagination.page)} /{" "}
              {formatNumber(pagination.totalPages || 1)}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading || page <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={14} />
                ก่อนหน้า
              </button>

              <button
                type="button"
                disabled={loading || page >= pagination.totalPages}
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, pagination.totalPages))
                }
                className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ถัดไป
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type FilterInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date";
};

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: FilterInputProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

type FilterDropdownProps = {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  showCode?: boolean;
};

function FilterDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "ทั้งหมด",
  showCode = false,
}: FilterDropdownProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={`${label}-${option.id}`} value={option.id}>
            {showCode && option.code
              ? `${option.code} - ${option.name}`
              : option.name}
          </option>
        ))}
      </select>
    </div>
  );
}

type SummaryCardProps = {
  title: string;
  value: number | string | null | undefined;
  suffix?: string;
  digits?: number;
  icon?: React.ReactNode;
  loading?: boolean;
};

function SummaryCard({
  title,
  value,
  suffix,
  digits = 0,
  icon,
  loading = false,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{title}</p>

        {icon ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            {icon}
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex items-end gap-1">
        <p className="text-lg font-semibold text-slate-900">
          {loading ? "..." : formatNumber(value, digits)}
        </p>

        {suffix ? (
          <span className="mb-0.5 text-[11px] text-slate-500">{suffix}</span>
        ) : null}
      </div>
    </div>
  );
}

function StatusBadge({ value }: { value: string | null }) {
  const text = getText(value);

  if (text === "Y" || text === "1") {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-red-100">
        {text}
      </span>
    );
  }

  if (text === "N" || text === "0") {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-100">
        {text}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-100">
      -
    </span>
  );
}