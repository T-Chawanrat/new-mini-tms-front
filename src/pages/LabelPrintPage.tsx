import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import {
  ChevronDown,
  ChevronRight,
  Printer,
  RefreshCcw,
  Search,
} from "lucide-react";

import AxiosInstance from "../utils/AxiosInstance";

import DatePicker from "../components/form/DatePicker";
import LabelCard from "../components/labels/LabelCard";
import LabelPrintStyle from "../components/labels/LabelPrintStyle";
import ResizableColumns from "../components/ResizableColumns";

import type {
  LabelFilters,
  LabelReceiveRow,
  LabelReceivesResponse,
  LabelRow,
  LabelSerialsResponse,
  Option,
  Pagination,
  PrintResponse,
} from "../types/label";

import { defaultLabelFilters, defaultLabelPagination } from "../types/label";

import {
  buildLabelReceiveQueryParams,
  buildLabelSerialQueryParams,
  formatDate,
  formatDateTime,
  formatNumber,
  getText,
} from "../utils/labelHelpers";

const LABEL_API_PATH = "/labels";
const PRINTED_BY_USER_ID = 1;

const RECEIVE_HEADERS = [
  <span key="expand-column" />,
  "#",
  "Receive Code",
  "Receive Date",
  "Customer",
  "To Warehouse",
  "SN",
  "Print",
  "Reprint",
  "Last Printed",
];

const RECEIVE_MIN_WIDTHS: Record<number, number> = {
  0: 42,
  1: 56,
  2: 170,
  3: 120,
  4: 220,
  5: 180,
  6: 65,
  7: 70,
  8: 75,
  9: 150,
};

const RECEIVE_DEFAULT_WIDTHS: Record<number, number> = {
  0: 42,
  1: 56,
  2: 220,
  3: 140,
  4: 360,
  5: 260,
  6: 75,
  7: 85,
  8: 90,
  9: 180,
};

const RECEIVE_MAX_WIDTHS: Record<number, number> = {
  0: 42,
  1: 70,
  2: 380,
  3: 180,
  4: 600,
  5: 480,
  6: 110,
  7: 120,
  8: 130,
  9: 260,
};

export default function LabelPrintPage() {
  const [receiveRows, setReceiveRows] = useState<LabelReceiveRow[]>([]);
  const [serialRows, setSerialRows] = useState<LabelRow[]>([]);

  const [customers, setCustomers] = useState<Option[]>([]);
  const [warehousesTo, setWarehousesTo] = useState<Option[]>([]);

  const [filters, setFilters] = useState<LabelFilters>(defaultLabelFilters);

  const [appliedFilters, setAppliedFilters] =
    useState<LabelFilters>(defaultLabelFilters);

  const [activeReceiveCode, setActiveReceiveCode] = useState("");
  const [serialSearch, setSerialSearch] = useState("");
  const [appliedSerialSearch, setAppliedSerialSearch] = useState("");

  const [selectedSerialNos, setSelectedSerialNos] = useState<string[]>([]);
  const [printItems, setPrintItems] = useState<LabelRow[]>([]);

  const pendingPrintItemsRef = useRef<LabelRow[]>([]);
  const afterPrintHandledRef = useRef(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const [pagination, setPagination] = useState<Pagination>(
    defaultLabelPagination,
  );

  const [receiveLoading, setReceiveLoading] = useState(false);
  const [serialLoading, setSerialLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [printing, setPrinting] = useState(false);

  const [receiveError, setReceiveError] = useState<string | null>(null);
  const [serialError, setSerialError] = useState<string | null>(null);

  const selectedItems = useMemo(() => {
    const selectedSet = new Set(selectedSerialNos);

    return serialRows.filter((row) => selectedSet.has(row.serial_no));
  }, [serialRows, selectedSerialNos]);

  const showingFrom = useMemo(() => {
    if (!pagination.total) return 0;

    return (pagination.page - 1) * pagination.limit + 1;
  }, [pagination]);

  const showingTo = useMemo(() => {
    return Math.min(pagination.page * pagination.limit, pagination.total);
  }, [pagination]);

  const allSerialChecked =
    serialRows.length > 0 &&
    serialRows.every((row) => selectedSerialNos.includes(row.serial_no));

  const someSerialChecked =
    serialRows.some((row) => selectedSerialNos.includes(row.serial_no)) &&
    !allSerialChecked;

  const updateFilter = (name: keyof LabelFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchFilterOptions = async () => {
    try {
      setFilterLoading(true);

      const [customersRes, warehousesRes] = await Promise.all([
        AxiosInstance.get("/customers"),

        AxiosInstance.get("/warehouses"),
      ]);

      setCustomers(customersRes.data || []);

      setWarehousesTo(warehousesRes.data || []);
    } catch (err) {
      console.error("fetch label filter options error:", err);

      setCustomers([]);
      setWarehousesTo([]);
    } finally {
      setFilterLoading(false);
    }
  };

  const fetchReceives = async () => {
    try {
      setReceiveLoading(true);
      setReceiveError(null);

      const params = buildLabelReceiveQueryParams(appliedFilters, page, limit);

      if (appliedSerialSearch.trim()) {
        params.set("serial_no", appliedSerialSearch.trim());
      }

      const res = await AxiosInstance.get<LabelReceivesResponse>(
        `${LABEL_API_PATH}/receives?${params.toString()}`,
      );

      const nextRows = res.data?.data || [];

      setReceiveRows(nextRows);

      setPagination(
        res.data?.pagination || {
          page,
          limit,
          total: 0,
          totalPages: 1,
        },
      );

      if (
        activeReceiveCode &&
        !nextRows.some((row) => row.receive_code === activeReceiveCode)
      ) {
        setActiveReceiveCode("");
        setSerialRows([]);
        setSelectedSerialNos([]);
      }
    } catch (err) {
      console.error("fetch label receives error:", err);

      setReceiveRows([]);

      setReceiveError("โหลดรายการ Receive ไม่สำเร็จ");
    } finally {
      setReceiveLoading(false);
    }
  };

  const fetchSerials = async (receiveCode: string, serialNo = "") => {
    if (!receiveCode) {
      setSerialRows([]);
      setSelectedSerialNos([]);

      return;
    }

    try {
      setSerialLoading(true);
      setSerialError(null);

      const params = buildLabelSerialQueryParams(receiveCode, serialNo);

      const res = await AxiosInstance.get<LabelSerialsResponse>(
        `${LABEL_API_PATH}/serials?${params.toString()}`,
      );

      setSerialRows(res.data?.data || []);

      setSelectedSerialNos([]);
    } catch (err) {
      console.error("fetch label serials error:", err);

      setSerialRows([]);
      setSelectedSerialNos([]);

      setSerialError("โหลด Serial No ไม่สำเร็จ");
    } finally {
      setSerialLoading(false);
    }
  };

  const handleChooseReceive = async (receiveCode: string) => {
    const isSameReceive = activeReceiveCode === receiveCode;

    if (isSameReceive) {
      setActiveReceiveCode("");
      setSerialRows([]);
      setSelectedSerialNos([]);
      setSerialSearch("");

      return;
    }

    setActiveReceiveCode(receiveCode);

    setSelectedSerialNos([]);

    await fetchSerials(receiveCode, appliedSerialSearch);
  };

  const handleSearch = () => {
    setPage(1);

    setActiveReceiveCode("");
    setSerialRows([]);
    setSelectedSerialNos([]);

    setAppliedFilters(filters);

    setAppliedSerialSearch(serialSearch.trim());
  };

  const handleReset = () => {
    setFilters(defaultLabelFilters);

    setAppliedFilters(defaultLabelFilters);

    setActiveReceiveCode("");
    setSerialRows([]);
    setSelectedSerialNos([]);
    setSerialSearch("");
    setAppliedSerialSearch("");

    setPage(1);
  };

  const handleRefresh = async () => {
    await fetchReceives();

    if (activeReceiveCode) {
      await fetchSerials(activeReceiveCode, appliedSerialSearch);
    }
  };

  const handleLimitChange = (value: string) => {
    setLimit(Number(value));

    setPage(1);

    setActiveReceiveCode("");
    setSerialRows([]);
    setSelectedSerialNos([]);
    setSerialSearch("");
  };

  const toggleAllSerials = () => {
    if (allSerialChecked) {
      setSelectedSerialNos([]);

      return;
    }

    setSelectedSerialNos(serialRows.map((row) => row.serial_no));
  };

  const toggleOneSerial = (serialNo: string) => {
    setSelectedSerialNos((prev) => {
      if (prev.includes(serialNo)) {
        return prev.filter((item) => item !== serialNo);
      }

      return [...prev, serialNo];
    });
  };

  const markPrinted = async (items: LabelRow[]) => {
    const hasPrintedBefore = items.some(
      (item) => Number(item.print_count || 0) > 0,
    );

    const res = await AxiosInstance.post<PrintResponse>(
      `${LABEL_API_PATH}/print`,
      {
        items: items.map((item) => ({
          serial_no: item.serial_no,
        })),

        printed_by_user: PRINTED_BY_USER_ID,

        is_reprint: hasPrintedBefore,
      },
    );

    return res.data;
  };

const finishPrint = async () => {
  if (afterPrintHandledRef.current) {
    return;
  }

  afterPrintHandledRef.current = true;

  const items = pendingPrintItemsRef.current;

  if (!items.length) {
    setPrinting(false);
    return;
  }

  try {
    await markPrinted(items);

    await Promise.all([
      fetchReceives(),

      activeReceiveCode
        ? fetchSerials(activeReceiveCode, appliedSerialSearch)
        : Promise.resolve(),
    ]);
  } catch (err) {
    console.error("print label error:", err);
  } finally {
    pendingPrintItemsRef.current = [];

    setPrintItems([]);
    setPrinting(false);
  }
};

  const handlePrint = () => {
    if (!selectedItems.length) {
      alert("กรุณาเลือก Serial No ที่ต้องการปริ้น");

      return;
    }

    const snapshotItems = [...selectedItems];

    pendingPrintItemsRef.current = snapshotItems;

    afterPrintHandledRef.current = false;

    setPrintItems(snapshotItems);

    setPrinting(true);

    window.setTimeout(() => {
      window.print();
    }, 300);
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      finishPrint();
    };

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReceiveCode, serialSearch]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchReceives();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, appliedSerialSearch, page, limit]);

  return (
    <div className="flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 p-3 text-slate-800">
      <LabelPrintStyle />

      <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-semibold text-slate-900">
            Print Labels
          </h1>

          <p className="mt-0.5 text-[11px] text-slate-500">
            เลือก Receive Code แล้วเลือก Serial No ที่ต้องการปริ้น
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={printing || selectedItems.length === 0}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            <Printer size={13} />

            {printing
              ? "กำลังปริ้น..."
              : `Print ${formatNumber(selectedItems.length)} Label`}
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={receiveLoading || serialLoading || printing}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw
              size={13}
              className={receiveLoading || serialLoading ? "animate-spin" : ""}
            />
            รีเฟรช
          </button>
        </div>
      </div>

      <div className="mb-2 shrink-0 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[150px_1fr_1fr_1.25fr_1.25fr_auto] lg:items-center">
          <div className="h-9">
            <DatePicker
              variant="compact"
              value={filters.receive_date}
              onChange={(value) => updateFilter("receive_date", value)}
              placeholder="Receive Date"
            />
          </div>

          <FilterInput
            value={filters.receive_code}
            onChange={(value) => updateFilter("receive_code", value)}
            placeholder="Receive Code"
            onEnter={handleSearch}
          />

          <FilterInput
            value={serialSearch}
            onChange={setSerialSearch}
            placeholder="Serial No"
            onEnter={handleSearch}
          />

          <FilterDropdown
            value={filters.customer_id}
            options={customers}
            onChange={(value) => updateFilter("customer_id", value)}
            placeholder={
              filterLoading ? "กำลังโหลด Customer..." : "Customer ทั้งหมด"
            }
            showCode
          />

          <FilterDropdown
            value={filters.to_warehouse_id}
            options={warehousesTo}
            onChange={(value) => updateFilter("to_warehouse_id", value)}
            placeholder={
              filterLoading
                ? "กำลังโหลด To Warehouse..."
                : "To Warehouse ทั้งหมด"
            }
            optionKeyPrefix="warehouse-to"
            showCode
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSearch}
              disabled={receiveLoading}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              <Search size={13} />
              ค้นหา
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={receiveLoading}
              className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              ล้าง
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {receiveError ? (
          <div className="p-6 text-center text-sm text-red-600">
            {receiveError}
          </div>
        ) : (
          <div className="h-[calc(100%-46px)] overflow-auto">
            <table className="w-max min-w-full table-fixed border-collapse text-left text-xs">
              <ResizableColumns
                headers={RECEIVE_HEADERS}
                pageKey="label-print-receive"
                minWidths={RECEIVE_MIN_WIDTHS}
                defaultWidths={RECEIVE_DEFAULT_WIDTHS}
                maxWidths={RECEIVE_MAX_WIDTHS}
              />

              <tbody className="divide-y divide-slate-100 bg-white">
                {receiveLoading ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-3 py-10 text-center text-sm text-slate-500"
                    >
                      กำลังโหลด Receive...
                    </td>
                  </tr>
                ) : receiveRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-3 py-10 text-center text-sm text-slate-500"
                    >
                      ไม่พบ Receive Code
                    </td>
                  </tr>
                ) : (
                  receiveRows.map((row, index) => {
                    const expanded = activeReceiveCode === row.receive_code;

                    return (
                      <ReceiveWithSerialRow
                        key={`${row.receive_code}-${index}`}
                        row={row}
                        index={index}
                        expanded={expanded}
                        pagination={pagination}
                        serialRows={expanded ? serialRows : []}
                        serialLoading={serialLoading}
                        serialError={serialError}
                        selectedSerialNos={selectedSerialNos}
                        allSerialChecked={allSerialChecked}
                        someSerialChecked={someSerialChecked}
                        onChoose={() => handleChooseReceive(row.receive_code)}
                        onToggleAll={toggleAllSerials}
                        onToggleOne={toggleOneSerial}
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <PaginationBar
          loading={receiveLoading}
          page={page}
          limit={limit}
          pagination={pagination}
          showingFrom={showingFrom}
          showingTo={showingTo}
          onLimitChange={handleLimitChange}
          onPageChange={setPage}
        />
      </div>

      <div id="label-print-area" className="screen-only-label-print-area">
        {printItems.map((item) => (
          <LabelCard key={item.serial_no} item={item} />
        ))}
      </div>
    </div>
  );
}

type ReceiveWithSerialRowProps = {
  row: LabelReceiveRow;

  index: number;

  expanded: boolean;

  pagination: Pagination;

  serialRows: LabelRow[];

  serialLoading: boolean;

  serialError: string | null;

  selectedSerialNos: string[];

  allSerialChecked: boolean;

  someSerialChecked: boolean;

  onChoose: () => void;

  onToggleAll: () => void;

  onToggleOne: (serialNo: string) => void;
};

function ReceiveWithSerialRow({
  row,

  index,

  expanded,

  pagination,

  serialRows,

  serialLoading,

  serialError,

  selectedSerialNos,

  allSerialChecked,

  someSerialChecked,

  onChoose,

  onToggleAll,

  onToggleOne,
}: ReceiveWithSerialRowProps) {
  return (
    <>
      <tr
        onClick={onChoose}
        className={
          expanded
            ? "cursor-pointer bg-blue-50/90"
            : index % 2 === 0
              ? "cursor-pointer bg-white hover:bg-blue-50/40"
              : "cursor-pointer bg-slate-50/70 hover:bg-blue-50/40"
        }
      >
        <td className="border-b border-slate-100 px-2 py-2 text-center text-slate-500">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </td>

        <td className="whitespace-nowrap border-b border-slate-100 px-2 py-2 text-center font-semibold text-slate-500">
          {formatNumber((pagination.page - 1) * pagination.limit + index + 1)}
        </td>

        <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2">
          <div className="truncate font-semibold text-blue-700">
            {row.receive_code}
          </div>

          <div className="truncate text-[11px] text-slate-400">
            {expanded ? "กำลังแสดง Serial No" : "กดเพื่อดู Serial No"}
          </div>
        </td>

        <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-slate-700">
          {formatDate(row.receive_date)}
        </td>

        <td
          className="truncate border-b border-slate-100 px-3 py-2 text-slate-700"
          title={getText(row.customer_name || row.customer_id)}
        >
          {getText(row.customer_name || row.customer_id)}
        </td>

        <td
          className="truncate border-b border-slate-100 px-3 py-2 text-slate-700"
          title={getText(row.to_warehouse_name || row.to_warehouse_id)}
        >
          {getText(row.to_warehouse_name || row.to_warehouse_id)}
        </td>

        <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-right font-semibold text-slate-800">
          {formatNumber(row.total_serial)}
        </td>

        <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-right font-semibold text-emerald-700">
          {formatNumber(row.total_print_count)}
        </td>

        <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-right font-semibold text-amber-700">
          {formatNumber(row.total_reprint_count)}
        </td>

        <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-slate-600">
          {formatDateTime(row.last_printed_at)}
        </td>
      </tr>

      {expanded ? (
        <tr>
          <td colSpan={10} className="bg-slate-50 px-3 py-3">
            <SerialInlineTable
              rows={serialRows}
              loading={serialLoading}
              error={serialError}
              selectedSerialNos={selectedSerialNos}
              allChecked={allSerialChecked}
              someChecked={someSerialChecked}
              onToggleAll={onToggleAll}
              onToggleOne={onToggleOne}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}

type SerialInlineTableProps = {
  rows: LabelRow[];

  loading: boolean;

  error: string | null;

  selectedSerialNos: string[];

  allChecked: boolean;

  someChecked: boolean;

  onToggleAll: () => void;

  onToggleOne: (serialNo: string) => void;
};

function SerialInlineTable({
  rows,

  loading,

  error,

  selectedSerialNos,

  allChecked,

  someChecked,

  onToggleAll,

  onToggleOne,
}: SerialInlineTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      {error ? (
        <div className="p-5 text-center text-sm text-red-600">{error}</div>
      ) : (
        <div className="max-h-[330px] overflow-auto">
          <table className="w-full min-w-[420px] border-collapse text-left text-xs">
            <thead className="sticky top-0 z-20 bg-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              <tr className="border-b border-slate-200">
                <th className="w-[42px] px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = someChecked;
                      }
                    }}
                    onChange={onToggleAll}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>

                <th className="w-[56px] px-2 py-2 text-center">#</th>

                <th className="whitespace-nowrap px-3 py-2">Serial No</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-8 text-center text-sm text-slate-500"
                  >
                    กำลังโหลด Serial No...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-8 text-center text-sm text-slate-500"
                  >
                    ไม่พบ Serial No
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <SerialTableRow
                    key={`${row.serial_no}-${index}`}
                    row={row}
                    index={index}
                    checked={selectedSerialNos.includes(row.serial_no)}
                    onToggle={() => onToggleOne(row.serial_no)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type SerialTableRowProps = {
  row: LabelRow;

  index: number;

  checked: boolean;

  onToggle: () => void;
};

function SerialTableRow({
  row,

  index,

  checked,

  onToggle,
}: SerialTableRowProps) {
  return (
    <tr
      onClick={onToggle}
      className={
        checked
          ? "cursor-pointer bg-blue-50/80"
          : index % 2 === 0
            ? "cursor-pointer bg-white hover:bg-blue-50/40"
            : "cursor-pointer bg-slate-50/70 hover:bg-blue-50/40"
      }
    >
      <td
        onClick={(event) => event.stopPropagation()}
        className="w-[42px] border-b border-slate-100 px-2 py-2 text-center"
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
      </td>

      <td className="w-[56px] whitespace-nowrap border-b border-slate-100 px-2 py-2 text-center font-semibold text-slate-500">
        {formatNumber(index + 1)}
      </td>

      <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2">
        <span className="font-semibold text-blue-700">
          {getText(row.serial_no)}
        </span>
      </td>
    </tr>
  );
}

type PaginationBarProps = {
  loading: boolean;

  page: number;

  limit: number;

  pagination: Pagination;

  showingFrom: number;

  showingTo: number;

  onLimitChange: (value: string) => void;

  onPageChange: Dispatch<SetStateAction<number>>;
};

function PaginationBar({
  loading,

  page,

  limit,

  pagination,

  showingFrom,

  showingTo,

  onLimitChange,

  onPageChange,
}: PaginationBarProps) {
  return (
    <div className="flex h-[46px] shrink-0 items-center justify-between gap-6 border-t border-slate-200 bg-white px-4">
      <div className="min-w-[240px] whitespace-nowrap text-xs text-slate-500">
        {pagination.total > 0
          ? `แสดง ${formatNumber(showingFrom)} - ${formatNumber(
              showingTo,
            )} จาก ${formatNumber(pagination.total)} receive`
          : "ยังไม่มีข้อมูล"}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-xs text-slate-500">แสดง</span>

          <select
            value={limit}
            onChange={(event) => onLimitChange(event.target.value)}
            className="h-8 min-w-[64px] rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value={25}>25</option>

            <option value={50}>50</option>

            <option value={100}>100</option>

            <option value={200}>200</option>
          </select>

          <span className="whitespace-nowrap text-xs text-slate-500">
            รายการ
          </span>
        </div>

        <div className="h-5 w-px bg-slate-200" />

        <div className="min-w-[82px] whitespace-nowrap text-center text-xs text-slate-500">
          {formatNumber(pagination.page)} /{" "}
          {formatNumber(pagination.totalPages || 1)}
        </div>

        <button
          type="button"
          disabled={loading || page <= 1}
          onClick={() => onPageChange((prev) => Math.max(prev - 1, 1))}
          className="inline-flex h-8 min-w-[68px] items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ก่อนหน้า
        </button>

        <button
          type="button"
          disabled={loading || page >= pagination.totalPages}
          onClick={() =>
            onPageChange((prev) => Math.min(prev + 1, pagination.totalPages))
          }
          className="inline-flex h-8 min-w-[68px] items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ถัดไป
        </button>
      </div>
    </div>
  );
}

type FilterInputProps = {
  value: string;

  onChange: (value: string) => void;

  placeholder?: string;

  disabled?: boolean;

  onEnter?: () => void;
};

function FilterInput({
  value,

  onChange,

  placeholder,

  disabled = false,

  onEnter,
}: FilterInputProps) {
  return (
    <input
      type="text"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          onEnter?.();
        }
      }}
      placeholder={placeholder}
      className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
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

function FilterDropdown({
  value,

  options,

  onChange,

  placeholder = "ทั้งหมด",

  showCode = false,

  optionKeyPrefix = "option",
}: FilterDropdownProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    >
      <option value="">{placeholder}</option>

      {options.map((option) => (
        <option key={`${optionKeyPrefix}-${option.id}`} value={option.id}>
          {showCode && option.code
            ? `${option.code} - ${option.name}`
            : option.name}
        </option>
      ))}
    </select>
  );
}
