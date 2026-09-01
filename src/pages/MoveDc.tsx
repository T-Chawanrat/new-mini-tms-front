import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowRightLeft, X } from "lucide-react";

import errorSound from "../../assets/sounds/error.mp3";
import successSound from "../../assets/sounds/success.mp3";
import AxiosInstance from "../utils/AxiosInstance";
import { normalizeSerialText } from "../utils/textSanitizer";

type Warehouse = { id: number; name: string };
type ProductRow = {
  serial_no: string;
  customer_name: string | null;
  recipient_name: string | null;
  to_warehouse_name: string | null;
};
type ProductResponse = { data?: ProductRow[]; draft?: ProductRow[] };
type RequestError = { response?: { data?: { message?: string } } };

const getErrorMessage = (error: unknown, fallback: string) => {
  const requestError = error as RequestError;
  return requestError?.response?.data?.message || fallback;
};

export default function MoveDc() {
  const scanInputRef = useRef<HTMLInputElement | null>(null);
  const removeInputRef = useRef<HTMLInputElement | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [scanSerial, setScanSerial] = useState("");
  const [removeSerial, setRemoveSerial] = useState("");
  const [pendingRows, setPendingRows] = useState<ProductRow[]>([]);
  const [movedRows, setMovedRows] = useState<ProductRow[]>([]);
  const [moving, setMoving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const fromWarehouseName = warehouses.find((warehouse) => String(warehouse.id) === fromWarehouseId)?.name || "คลังต้นทาง";
  const toWarehouseName = warehouses.find((warehouse) => String(warehouse.id) === toWarehouseId)?.name || "คลังปลายทาง";
  const hasDrafts = movedRows.length > 0;

  const fetchProducts = useCallback(async () => {
    if (!fromWarehouseId) {
      setPendingRows([]);
      setMovedRows([]);
      return;
    }

    try {
      setError("");
      const response = await AxiosInstance.get<ProductResponse>("/move-dc/products", {
        params: {
          from_warehouse_id: fromWarehouseId,
          to_warehouse_id: toWarehouseId || undefined,
        },
      });
      setPendingRows(Array.isArray(response.data?.data) ? response.data.data : []);
      setMovedRows(Array.isArray(response.data?.draft) ? response.data.draft : []);
    } catch (requestError) {
      setPendingRows([]);
      setMovedRows([]);
      setError(getErrorMessage(requestError, "ไม่สามารถโหลดรายการสินค้าในคลังต้นทางได้"));
    }
  }, [fromWarehouseId, toWarehouseId]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await AxiosInstance.get<Warehouse[]>("/warehouses");
        setWarehouses(Array.isArray(response.data) ? response.data : []);
      } catch {
        setWarehouses([]);
      }
    };

    void fetchWarehouses();
  }, []);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!moving && !saving && fromWarehouseId && toWarehouseId) scanInputRef.current?.focus();
  }, [fromWarehouseId, moving, saving, toWarehouseId]);

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
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }, []);

  const getMovePayload = (action: "DRAFT" | "REMOVE" | "CONFIRM", serialNo?: string) => ({
    action,
    from_warehouse_id: fromWarehouseId,
    to_warehouse_id: toWarehouseId,
    ...(serialNo ? { serial_no: serialNo } : {}),
  });

  const handleDraftScan = async () => {
    const rawSerial = scanSerial.trim();
    const serial = normalizeSerialText(rawSerial);

    if (!fromWarehouseId || !toWarehouseId) {
      playSound("error");
      setError("กรุณาเลือกคลังต้นทางและคลังปลายทาง");
      return;
    }
    if (!serial) return;

    try {
      setMoving(true);
      setError("");
      setInfo("");
      await AxiosInstance.patch("/move-dc/products", getMovePayload("DRAFT", rawSerial));
      await fetchProducts();
      setInfo(`เพิ่ม SN ${rawSerial} ในรายการรอยืนยันแล้ว`);
      playSound("success");
    } catch (requestError) {
      playSound("error");
      setError(getErrorMessage(requestError, "ไม่สามารถเพิ่มสินค้าในรายการรอยืนยันได้"));
    } finally {
      setScanSerial("");
      setMoving(false);
      window.setTimeout(() => scanInputRef.current?.focus(), 0);
    }
  };

  const handleRemoveScan = async () => {
    const rawSerial = removeSerial.trim();
    if (!rawSerial) return;

    try {
      setMoving(true);
      setError("");
      setInfo("");
      await AxiosInstance.patch("/move-dc/products", getMovePayload("REMOVE", rawSerial));
      await fetchProducts();
      setInfo(`นำ SN ${rawSerial} กลับไปรายการต้นทางแล้ว`);
      playSound("success");
    } catch (requestError) {
      playSound("error");
      setError(getErrorMessage(requestError, "ไม่สามารถนำสินค้าออกจากรายการรอยืนยันได้"));
    } finally {
      setRemoveSerial("");
      setMoving(false);
      window.setTimeout(() => removeInputRef.current?.focus(), 0);
    }
  };

  const handleConfirmSave = async () => {
    try {
      setSaving(true);
      setError("");
      setInfo("");
      const response = await AxiosInstance.patch<{ message?: string }>("/move-dc/products", getMovePayload("CONFIRM"));
      setConfirmSaveOpen(false);
      await fetchProducts();
      setInfo(response.data?.message || "ย้ายสินค้าไปคลังปลายทางสำเร็จ");
      playSound("success");
    } catch (requestError) {
      playSound("error");
      setError(getErrorMessage(requestError, "ไม่สามารถบันทึกการย้ายคลังได้"));
    } finally {
      setSaving(false);
      window.setTimeout(() => scanInputRef.current?.focus(), 0);
    }
  };

  const Table = ({ title, rows, moved }: { title: string; rows: ProductRow[]; moved?: boolean }) => (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2.5">
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${moved ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{rows.length} รายการ</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full table-fixed text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 text-xs text-slate-600">
            <tr>
              <th className="w-[38%] px-3 py-2 text-left">SERIAL NO</th>
              <th className="w-[31%] px-3 py-2 text-left">ผู้รับ</th>
              <th className="w-[31%] px-3 py-2 text-left">คลังปลายทาง</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row, index) => (
              <tr key={`${title}-${row.serial_no}`} className={index % 2 ? "bg-slate-50/70" : "bg-white"}>
                <td className="border-b border-slate-100 px-3 py-2"><span className={`inline-flex max-w-full rounded-lg border px-2.5 py-1 font-mono text-sm font-semibold ${moved ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-blue-300 bg-blue-50 text-blue-700"}`}><span className="truncate">{row.serial_no}</span></span></td>
                <td className="truncate border-b border-slate-100 px-3 py-2">{row.recipient_name || row.customer_name || "-"}</td>
                <td className="truncate border-b border-slate-100 px-3 py-2">{row.to_warehouse_name || "-"}</td>
              </tr>
            )) : (
              <tr><td colSpan={3} className="px-3 py-10 text-center text-sm text-slate-500">{moved ? "ยังไม่มีรายการรอยืนยัน" : "ไม่มีรายการในคลังต้นทาง"}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 px-1 py-2 text-slate-800">
      <header className="mb-3 shrink-0">
        <div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><ArrowRightLeft size={21} className="shrink-0 text-blue-600" /><div><h1 className="text-lg font-bold text-slate-900">ย้ายสินค้าระหว่างคลัง</h1><p className="mt-0.5 text-xs text-slate-500">เลือกเส้นทางย้าย แล้วยิง Barcode เพื่อเพิ่มรายการรอยืนยัน</p></div></div><button type="button" onClick={() => setConfirmSaveOpen(true)} disabled={moving || saving || !hasDrafts} className="h-9 shrink-0 rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">{saving ? "กำลังบันทึก..." : `บันทึก (${movedRows.length})`}</button></div>
      </header>
      <section className="mb-3 shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
        <div className="grid items-end gap-2 md:grid-cols-[minmax(0,1fr)_36px_minmax(0,1fr)]">
          <div className="rounded-md border border-blue-200 bg-blue-50/60 p-2"><label className="mb-1 block text-xs font-semibold text-blue-700">คลังต้นทาง</label><select value={fromWarehouseId} onChange={(event) => setFromWarehouseId(event.target.value)} disabled={moving || saving || hasDrafts} className="h-9 w-full rounded-md border border-blue-200 bg-white px-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 disabled:bg-slate-100"><option value="">เลือกคลังต้นทาง</option>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select></div>
          <div className="hidden h-9 items-center justify-center text-slate-400 md:flex"><ArrowRight size={19} /></div>
          <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-2"><label className="mb-1 block text-xs font-semibold text-emerald-700">คลังปลายทาง</label><select value={toWarehouseId} onChange={(event) => setToWarehouseId(event.target.value)} disabled={moving || saving || hasDrafts} className="h-9 w-full rounded-md border border-emerald-200 bg-white px-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 disabled:bg-slate-100"><option value="">เลือกคลังปลายทาง</option>{warehouses.filter((warehouse) => String(warehouse.id) !== fromWarehouseId).map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select></div>
        </div>
        <div className="mt-2.5 grid gap-x-4 gap-y-2 border-t border-slate-100 pt-2.5 lg:grid-cols-2">
          <div><label className="mb-1 block text-xs font-medium text-slate-600">ยิงย้ายสินค้า</label><input ref={scanInputRef} value={scanSerial} onChange={(event) => setScanSerial(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void handleDraftScan(); }} disabled={moving || saving || !fromWarehouseId || !toWarehouseId} placeholder="ยิง SN เพื่อเพิ่มรายการรอยืนยัน" className="h-9 w-full rounded-md border border-slate-300 px-3 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100" /></div>
          <div><label className="mb-1 block text-xs font-medium text-slate-600">ยิงลบรายการ</label><input ref={removeInputRef} value={removeSerial} onChange={(event) => setRemoveSerial(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void handleRemoveScan(); }} disabled={moving || saving || !hasDrafts} placeholder="ยิง SN ฝั่งขวาเพื่อส่งกลับฝั่งซ้าย" className="h-9 w-full rounded-md border border-slate-300 px-3 font-mono text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-100" /></div>
        </div>
        {error && <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {info && <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</div>}
      </section>
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2"><Table title={`รอย้ายจาก: ${fromWarehouseName}`} rows={pendingRows} /><Table title={`รายการรอยืนยัน: ${toWarehouseName}`} rows={movedRows} moved /></div>
      {confirmSaveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-sm animate-scaleIn rounded-2xl bg-white shadow-xl"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="text-lg font-semibold text-slate-800">ยืนยันย้ายสินค้าระหว่างคลัง</h2><button type="button" onClick={() => setConfirmSaveOpen(false)} disabled={saving} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50" title="ปิด"><X size={18} /></button></div><div className="px-5 py-4 text-sm text-slate-600">{`ต้องการย้าย ${movedRows.length} รายการ จาก ${fromWarehouseName} ไป ${toWarehouseName} ใช่หรือไม่`}</div><div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4"><button type="button" onClick={() => setConfirmSaveOpen(false)} disabled={saving} className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50">ไม่</button><button type="button" onClick={() => void handleConfirmSave()} disabled={saving} className="h-9 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-300">{saving ? "กำลังบันทึก..." : "ใช่"}</button></div></div></div>
      )}
    </div>
  );
}
