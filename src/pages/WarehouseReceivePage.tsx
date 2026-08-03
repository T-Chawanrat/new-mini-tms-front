import { useCallback, useEffect, useRef, useState } from "react";

import errorSound from "../../assets/sounds/error.mp3";
import successSound from "../../assets/sounds/success.mp3";
import AxiosInstance from "../utils/AxiosInstance";
import CustomerDropdown, { type Customer } from "../components/dropdown/CustomerDropdown";

type Option = {
  id: number | string;
  code?: string | null;
  name: string;
};

type WarehouseReceiveRow = {
  serial_no: string;
  customer_id: number | null;
  customer_name: string | null;
  to_warehouse_id: number | null;
  to_warehouse_name: string | null;
};

type WarehouseReceiveResponse = {
  success?: boolean;
  data: WarehouseReceiveRow[];
  total: number;
};

const formatNumber = (value: number) => {
  return value.toLocaleString("th-TH");
};

const normalizeSerial = (value: string | number | null | undefined) => {
  return String(value ?? "")
    .trim()
    .toLowerCase();
};

const getOptionLabel = (option: Option) => {
  return option.code ? `${option.code} - ${option.name}` : option.name;
};

export default function WarehouseReceivePage() {
  const receiveInputRef = useRef<HTMLInputElement | null>(null);
  const removeInputRef = useRef<HTMLInputElement | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);

  const [warehouses, setWarehouses] = useState<Option[]>([]);

  const [customerFilter, setCustomerFilter] = useState("");
  const [customerText, setCustomerText] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [receiveSerialInput, setReceiveSerialInput] = useState("");
  const [removeSerialInput, setRemoveSerialInput] = useState("");

  const [pendingRows, setPendingRows] = useState<WarehouseReceiveRow[]>([]);
  const [scannedRows, setScannedRows] = useState<WarehouseReceiveRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    successAudioRef.current = new Audio(successSound);
    errorAudioRef.current = new Audio(errorSound);

    successAudioRef.current.preload = "auto";
    errorAudioRef.current.preload = "auto";

    return () => {
      successAudioRef.current?.pause();
      errorAudioRef.current?.pause();
      successAudioRef.current = null;
      errorAudioRef.current = null;
    };
  }, []);

  const playSound = useCallback((type: "success" | "error") => {
    const audio = type === "success" ? successAudioRef.current : errorAudioRef.current;

    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;

    void audio.play().catch((playError) => {
      console.warn(`unable to play ${type} sound:`, playError);
    });
  }, []);

  const focusReceiveInput = useCallback(() => {
    window.setTimeout(() => {
      receiveInputRef.current?.focus();
    }, 0);
  }, []);

  const focusRemoveInput = useCallback(() => {
    window.setTimeout(() => {
      removeInputRef.current?.focus();
    }, 0);
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const warehousesResponse = await AxiosInstance.get<Option[]>("/warehouses");

      setWarehouses(Array.isArray(warehousesResponse.data) ? warehousesResponse.data : []);
    } catch (err) {
      console.error("fetch warehouse options error:", err);
      setWarehouses([]);
    }
  }, []);

  const fetchSerials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setInfo(null);

      const response = await AxiosInstance.get<WarehouseReceiveResponse>("/warehouse-receives/serials", {
        params: {
          customer_id: customerFilter || undefined,
          to_warehouse_id: warehouseFilter || undefined,
        },
      });

      const rows = Array.isArray(response.data?.data) ? response.data.data : [];

      setPendingRows(rows);
      setScannedRows([]);
      setReceiveSerialInput("");
      setRemoveSerialInput("");
    } catch (err) {
      console.error("fetch warehouse receive serials error:", err);
      setPendingRows([]);
      setScannedRows([]);
      setError("ไม่สามารถโหลดรายการ Serial No ได้");
    } finally {
      setLoading(false);
      focusReceiveInput();
    }
  }, [customerFilter, warehouseFilter, focusReceiveInput]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchSerials();
  }, [fetchSerials]);

  const handleReceiveScan = (value?: string) => {
    const rawSerial = (value ?? receiveSerialInput).trim();
    const serial = normalizeSerial(rawSerial);

    if (!serial) {
      focusReceiveInput();
      return;
    }

    setError(null);
    setInfo(null);

    const alreadyScanned = scannedRows.some((row) => normalizeSerial(row.serial_no) === serial);

    if (alreadyScanned) {
      playSound("error");
      setError(`SN ${rawSerial} อยู่ในรายการที่ยิงแล้ว`);
      setReceiveSerialInput("");
      focusReceiveInput();
      return;
    }

    const targetIndex = pendingRows.findIndex((row) => normalizeSerial(row.serial_no) === serial);

    if (targetIndex === -1) {
      playSound("error");
      setError(`ไม่พบ Serial No ${rawSerial} ในรายการรอยิง`);
      setReceiveSerialInput("");
      focusReceiveInput();
      return;
    }

    const targetRow = pendingRows[targetIndex];

    playSound("success");
    setPendingRows((previousRows) => previousRows.filter((_, index) => index !== targetIndex));
    setScannedRows((previousRows) => [targetRow, ...previousRows]);

    setInfo(`ย้าย SN ${targetRow.serial_no} ไปยังรายการที่ยิงแล้ว`);
    setReceiveSerialInput("");
    focusReceiveInput();
  };

  const handleRemoveScan = (value?: string) => {
    const rawSerial = (value ?? removeSerialInput).trim();
    const serial = normalizeSerial(rawSerial);

    if (!serial) {
      focusRemoveInput();
      return;
    }

    setError(null);
    setInfo(null);

    const targetIndex = scannedRows.findIndex((row) => normalizeSerial(row.serial_no) === serial);

    if (targetIndex === -1) {
      playSound("error");
      setError(`ไม่พบ SN ${rawSerial} ในรายการที่ยิงแล้ว`);
      setRemoveSerialInput("");
      focusRemoveInput();
      return;
    }

    const targetRow = scannedRows[targetIndex];

    playSound("success");
    setScannedRows((previousRows) => previousRows.filter((_, index) => index !== targetIndex));
    setPendingRows((previousRows) => [targetRow, ...previousRows]);

    setInfo(`นำ SN ${targetRow.serial_no} กลับไปรายการรอยิงแล้ว`);
    setRemoveSerialInput("");
    focusRemoveInput();
  };

  const handleSave = async () => {
    if (scannedRows.length === 0) {
      setError("ยังไม่มีรายการที่ยิงแล้วสำหรับบันทึก");
      focusReceiveInput();
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setInfo(null);

      const receivedCount = scannedRows.length;

      const response = await AxiosInstance.post("/warehouse-receives", {
        serial_nos: scannedRows.map((row) => row.serial_no),
        resend_date: null,
      });

      await fetchSerials();

      setInfo(response.data?.message || `บันทึกรับเข้าคลังสำเร็จ ${formatNumber(receivedCount)} รายการ`);

      playSound("success");
    } catch (err: any) {
      console.error("save warehouse receive error:", err);

      setError(err?.response?.data?.message || "ไม่สามารถบันทึกรับเข้าคลังได้");

      playSound("error");
    } finally {
      setSaving(false);
      focusReceiveInput();
    }
  };

  return (
    <div
      className={`flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 px-1 py-2 text-slate-800 ${
        loading || saving ? "cursor-wait" : ""
      }`}
    >
      <header className="mb-3 shrink-0">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-slate-900">รับสินค้าเข้าคลัง</h1>
          <p className="mt-0.5 text-xs text-slate-500">เลือก Customer และคลังปลายทาง แล้วยิง Barcode เพื่อรับสินค้า</p>
        </div>

        <div className="hidden">
          <p className="text-[10px] uppercase tracking-wider text-slate-400">ผู้ใช้งาน</p>
          <p className="text-sm font-medium text-slate-700">{"-"}</p>
        </div>
      </header>

      <section className="mb-3 shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-[420px] lg:w-[520px]">
            <label className="mb-1 block text-xs font-medium text-slate-600">Customer</label>

            <div className={loading || saving ? "pointer-events-none opacity-70" : ""}>
              <CustomerDropdown
                value={customerText}
                onChange={(customer: Customer | null, inputText?: string) => {
                  setCustomerText(inputText || "");
                  setCustomerFilter(customer ? String(customer.id) : "");
                  setError(null);
                  setInfo(null);
                }}
              />
            </div>
          </div>

          <div className="w-full sm:w-60">
            <label className="mb-1 block text-xs font-medium text-slate-600">To Warehouse</label>
            <select
              value={warehouseFilter}
              onChange={(event) => setWarehouseFilter(event.target.value)}
              disabled={loading || saving}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            >
              <option value="">To Warehouse ทั้งหมด</option>
              {warehouses.map((warehouse) => (
                <option key={`warehouse-${warehouse.id}`} value={warehouse.id}>
                  {getOptionLabel(warehouse)}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden flex-1 sm:block" />

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading || scannedRows.length === 0}
            className="inline-flex h-9 w-full items-center justify-center rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
          >
            {saving ? "กำลังบันทึก..." : `บันทึก (${formatNumber(scannedRows.length)})`}
          </button>
        </div>

        <div className="mt-2.5 grid gap-x-4 gap-y-2 border-t border-slate-100 pt-2.5 lg:grid-cols-2">
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium text-slate-600">ยิงรับสินค้า</label>
            <input
              ref={receiveInputRef}
              type="text"
              value={receiveSerialInput}
              onChange={(event) => setReceiveSerialInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleReceiveScan(event.currentTarget.value);
                }
              }}
              disabled={loading || saving}
              placeholder="ยิง SN เพื่อย้ายไปฝั่งขวา"
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 font-mono text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            />
          </div>

          <div className="min-w-0 lg:border-l lg:border-slate-200 lg:pl-4">
            <label className="mb-1 block text-xs font-medium text-slate-600">ยิงลบรายการ</label>
            <input
              ref={removeInputRef}
              type="text"
              value={removeSerialInput}
              onChange={(event) => setRemoveSerialInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleRemoveScan(event.currentTarget.value);
                }
              }}
              disabled={loading || saving || scannedRows.length === 0}
              placeholder="ยิง SN ฝั่งขวาเพื่อส่งกลับฝั่งซ้าย"
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 font-mono text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:border-slate-200 disabled:bg-slate-100"
            />
          </div>

          <div className="hidden" />

          <button type="button" onClick={handleSave} disabled={saving || loading || scannedRows.length === 0} className="hidden">
            {saving ? "กำลังบันทึก..." : `บันทึก (${formatNumber(scannedRows.length)})`}
          </button>
        </div>
      </section>

      {error && <div className="mb-3 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {info && <div className="mb-3 shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</div>}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-2">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-700">รายการรอยิง</span>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">{formatNumber(pendingRows.length)} รายการ</span>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full table-fixed border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-slate-100 text-slate-600">
                <tr>
                  <th className="w-[45%] border-b border-slate-200 px-3 py-2 text-left">SERIAL NO</th>
                  <th className="w-[35%] border-b border-slate-200 px-3 py-2 text-left">CUSTOMER</th>
                  <th className="w-[20%] border-b border-slate-200 px-3 py-2 text-right">TO WAREHOUSE</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-10 text-center text-sm text-slate-500">
                      กำลังโหลดรายการ...
                    </td>
                  </tr>
                ) : pendingRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-10 text-center text-sm text-slate-500">
                      ไม่มีรายการรอยิง
                    </td>
                  </tr>
                ) : (
                  pendingRows.map((row, index) => (
                    <tr
                      key={`pending-${row.serial_no}-${index}`}
                      className={index % 2 === 0 ? "bg-white hover:bg-blue-50/50" : "bg-slate-50/70 hover:bg-blue-50/50"}
                    >
                      <td title={row.serial_no} className="border-b border-slate-100 px-3 py-2 align-top">
                        <span className="inline-block max-w-full break-all whitespace-normal rounded-lg border border-red-300 bg-red-50 px-2.5 py-1 font-mono text-sm font-semibold leading-5 text-red-600">
                          {row.serial_no}
                        </span>
                      </td>
                      <td title={row.customer_name || "-"} className="truncate border-b border-slate-100 px-3 py-2">
                        {row.customer_name || "-"}
                      </td>
                      <td title={row.to_warehouse_name || "-"} className="truncate border-b border-slate-100 px-3 py-2 text-right">
                        {row.to_warehouse_name || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-700">รายการที่ยิงแล้ว</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {formatNumber(scannedRows.length)} รายการ
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full table-fixed border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-slate-100 text-slate-600">
                <tr>
                  <th className="w-[45%] border-b border-slate-200 px-3 py-2 text-left">SERIAL NO</th>
                  <th className="w-[35%] border-b border-slate-200 px-3 py-2 text-left">CUSTOMER</th>
                  <th className="w-[20%] border-b border-slate-200 px-3 py-2 text-right">TO WAREHOUSE</th>
                </tr>
              </thead>

              <tbody>
                {scannedRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-10 text-center text-sm text-slate-500">
                      ยังไม่มีรายการที่ยิง
                    </td>
                  </tr>
                ) : (
                  scannedRows.map((row, index) => (
                    <tr
                      key={`scanned-${row.serial_no}-${index}`}
                      className={index % 2 === 0 ? "bg-white hover:bg-emerald-50/50" : "bg-slate-50/70 hover:bg-emerald-50/50"}
                    >
                      <td title={row.serial_no} className="border-b border-slate-100 px-3 py-2 align-top">
                        <span className="inline-block max-w-full break-all whitespace-normal rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 font-mono text-sm font-semibold leading-5 text-emerald-700">
                          {row.serial_no}
                        </span>
                      </td>
                      <td title={row.customer_name || "-"} className="truncate border-b border-slate-100 px-3 py-2">
                        {row.customer_name || "-"}
                      </td>
                      <td title={row.to_warehouse_name || "-"} className="truncate border-b border-slate-100 px-3 py-2 text-right">
                        {row.to_warehouse_name || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
