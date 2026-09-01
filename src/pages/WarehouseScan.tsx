import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import errorSound from "../../assets/sounds/error.mp3";
import successSound from "../../assets/sounds/success.mp3";
import AxiosInstance from "../utils/AxiosInstance";
import { formatThaiNumber, normalizeSerialText } from "../utils/textSanitizer";
import CustomerDropdown, { type Customer } from "../components/dropdown/CustomerDropdown";
import ScanInput from "../components/scan/ScanInput";

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
  draft?: WarehouseReceiveRow[];
  total: number;
};

export default function WarehouseScan() {
  const receiveInputRef = useRef<HTMLInputElement | null>(null);
  const removeInputRef = useRef<HTMLInputElement | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);

  const [customerFilter, setCustomerFilter] = useState("");
  const [customerText, setCustomerText] = useState("");
  const [receiveSerialInput, setReceiveSerialInput] = useState("");
  const [removeSerialInput, setRemoveSerialInput] = useState("");

  const [pendingRows, setPendingRows] = useState<WarehouseReceiveRow[]>([]);
  const [scannedRows, setScannedRows] = useState<WarehouseReceiveRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
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

  const fetchSerials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setInfo(null);

      const response = await AxiosInstance.get<WarehouseReceiveResponse>("/warehouse-receives/serials", {
        params: {
          customer_id: customerFilter || undefined,
        },
      });

      const rows = Array.isArray(response.data?.data) ? response.data.data : [];
      const draftRows = Array.isArray(response.data?.draft) ? response.data.draft : [];
      const draftSerials = new Set(draftRows.map((row) => normalizeSerialText(row.serial_no)));

      setPendingRows(rows.filter((row) => !draftSerials.has(normalizeSerialText(row.serial_no))));
      setScannedRows(draftRows);
      setReceiveSerialInput("");
    } catch (err) {
      console.error("fetch warehouse receive serials error:", err);
      setPendingRows([]);
      setScannedRows([]);
      setError("ไม่สามารถโหลดรายการ Serial No ได้");
    } finally {
      setLoading(false);
      focusReceiveInput();
    }
  }, [customerFilter, focusReceiveInput]);

  useEffect(() => {
    fetchSerials();
  }, [fetchSerials]);

  const handleReceiveScan = async (value?: string) => {
    const rawSerial = (value ?? receiveSerialInput).trim();
    const serial = normalizeSerialText(rawSerial);

    if (!serial) {
      focusReceiveInput();
      return;
    }

    setError(null);
    setInfo(null);

    const targetIndex = pendingRows.findIndex((row) => normalizeSerialText(row.serial_no) === serial);

    if (targetIndex === -1) {
      playSound("error");
      setError(`ไม่พบ Serial No ${rawSerial} ในรายการรอยิง`);
      setReceiveSerialInput("");
      focusReceiveInput();
      return;
    }

    const row = pendingRows[targetIndex];
    setReceiveSerialInput("");

    try {
      setSaving(true);
      const response = await AxiosInstance.post("/warehouse-receives", {
        action: "DRAFT",
        serial_no: rawSerial,
        resend_date: null,
      });
      setPendingRows((current) => current.filter((item) => normalizeSerialText(item.serial_no) !== serial));
      setScannedRows((current) =>
        current.some((item) => normalizeSerialText(item.serial_no) === serial) ? current : [...current, row],
      );
      setInfo(response.data?.message || `เพิ่ม SN ${row.serial_no} ในรายการรอยืนยันแล้ว`);
      playSound("success");
    } catch (err: any) {
      setError(err?.response?.data?.message || "ไม่สามารถบันทึกรับเข้าคลังได้");
      playSound("error");
    } finally {
      setSaving(false);
      focusReceiveInput();
    }
  };

  const handleSave = async () => {
    if (!scannedRows.length) {
      setError("ยังไม่มีรายการรอยืนยัน");
      focusReceiveInput();
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const receivedCount = scannedRows.length;
      const response = await AxiosInstance.post("/warehouse-receives", {
        action: "CONFIRM",
        resend_date: null,
      });
      await fetchSerials();
      setInfo(response.data?.message || `บันทึกรับเข้าคลังสำเร็จ ${formatThaiNumber(receivedCount)} รายการ`);
      playSound("success");
    } catch (err: any) {
      setError(err?.response?.data?.message || "ไม่สามารถบันทึกรับเข้าคลังได้");
      playSound("error");
    } finally {
      setSaving(false);
      setConfirmSaveOpen(false);
      focusReceiveInput();
    }
  };

  const handleRemoveScan = async (value?: string) => {
    const rawSerial = (value ?? removeSerialInput).trim();
    const serial = normalizeSerialText(rawSerial);

    if (!serial) {
      focusRemoveInput();
      return;
    }

    const row = scannedRows.find((item) => normalizeSerialText(item.serial_no) === serial);
    setRemoveSerialInput("");

    try {
      setSaving(true);
      setError(null);
      const response = await AxiosInstance.post("/warehouse-receives", {
        action: "REMOVE",
        serial_no: rawSerial,
      });
      if (row) {
        setScannedRows((current) => current.filter((item) => normalizeSerialText(item.serial_no) !== serial));
        setPendingRows((current) =>
          current.some((item) => normalizeSerialText(item.serial_no) === serial) ? current : [...current, row],
        );
      }
      setInfo(response.data?.message || `นำ SN ${rawSerial} กลับไปรายการรอยิงแล้ว`);
      playSound("success");
    } catch (err: any) {
      setError(err?.response?.data?.message || "ไม่สามารถนำรายการกลับไปรายการรอยิงได้");
      playSound("error");
    } finally {
      setSaving(false);
      focusRemoveInput();
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
          <p className="mt-0.5 text-xs text-slate-500">เลือก Customer แล้วยิง Barcode เพื่อรับสินค้า</p>
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

          <div className="hidden flex-1 sm:block" />

          <button
            type="button"
            onClick={() => setConfirmSaveOpen(true)}
            disabled={saving || loading || scannedRows.length === 0}
            className="inline-flex h-9 w-full items-center justify-center rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
          >
            {saving ? "กำลังบันทึก..." : `บันทึก (${formatThaiNumber(scannedRows.length)})`}
          </button>

        </div>

        <div className="mt-2.5 grid gap-x-4 gap-y-2 border-t border-slate-100 pt-2.5 lg:grid-cols-2">
          <ScanInput
            label="ยิงรับสินค้า"
            value={receiveSerialInput}
            onChange={setReceiveSerialInput}
            onScan={(value) => void handleReceiveScan(value)}
            inputRef={receiveInputRef}
            disabled={loading}
            placeholder="ยิง SN เพื่อเพิ่มในรายการรอยืนยัน"
          />

          <ScanInput
            label="ยิงลบรายการ"
            value={removeSerialInput}
            onChange={setRemoveSerialInput}
            onScan={(value) => void handleRemoveScan(value)}
            inputRef={removeInputRef}
            disabled={loading || scannedRows.length === 0}
            placeholder="ยิง SN ฝั่งขวาเพื่อส่งกลับฝั่งซ้าย"
            tone="amber"
          />

        </div>
      </section>

      {error && <div className="mb-3 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {info && <div className="mb-3 shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</div>}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-2">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-700">รายการรอยิง</span>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
              {formatThaiNumber(pendingRows.length)} รายการ
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
            <span className="text-sm font-semibold text-slate-700">รายการรอยืนยัน</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {formatThaiNumber(scannedRows.length)} รายการ
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
                      ยังไม่มีรายการรอยืนยัน
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

      {confirmSaveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm animate-scaleIn rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-800">ยืนยันรับสินค้าเข้าคลัง</h2>
              <button
                type="button"
                onClick={() => setConfirmSaveOpen(false)}
                disabled={saving}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                title="ปิด"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 text-sm text-slate-600">
              ต้องการรับสินค้าเข้าคลัง <strong className="text-slate-800">{formatThaiNumber(scannedRows.length)} รายการ</strong> ใช่หรือไม่
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setConfirmSaveOpen(false)}
                disabled={saving}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-60"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? "กำลังบันทึก..." : "ยืนยันบันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
