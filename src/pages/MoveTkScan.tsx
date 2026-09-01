import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftRight, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import alertSound from "../../assets/sounds/alert.mp3";
import errorSound from "../../assets/sounds/error.mp3";
import successSound from "../../assets/sounds/success.mp3";
import MoveTkDestinationWarning from "../components/moveTk/MoveTkDestinationWarning";
import MoveTkProductTable from "../components/moveTk/MoveTkProductTable";
import type { MoveTkProduct, MoveTkTruck } from "../components/moveTk/types";
import ScanInput from "../components/scan/ScanInput";
import AxiosInstance from "../utils/AxiosInstance";
import { formatThaiNumber, normalizeSerialText } from "../utils/textSanitizer";

type MoveTkProductsResponse = {
  data?: MoveTkProduct[];
  draft?: MoveTkProduct[];
};

export default function MoveTkScan() {
  const navigate = useNavigate();
  const { sourceTruckLoadId = "", targetTruckLoadId = "" } = useParams<{
    sourceTruckLoadId: string;
    targetTruckLoadId: string;
  }>();
  const addInputRef = useRef<HTMLInputElement>(null);
  const removeInputRef = useRef<HTMLInputElement>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);
  const alertAudioRef = useRef<HTMLAudioElement | null>(null);
  const [sourceTruck, setSourceTruck] = useState<MoveTkTruck | null>(null);
  const [targetTruck, setTargetTruck] = useState<MoveTkTruck | null>(null);
  const [pendingRows, setPendingRows] = useState<MoveTkProduct[]>([]);
  const [movingRows, setMovingRows] = useState<MoveTkProduct[]>([]);
  const [addInput, setAddInput] = useState("");
  const [removeInput, setRemoveInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [destinationWarning, setDestinationWarning] = useState<MoveTkProduct | null>(null);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const getTruckDetail = (truck: MoveTkTruck | null) => {
    if (!truck) return "กำลังโหลดข้อมูล";
    const vehicleType = truck.driver_type === "CONTRACTOR" ? "รถเสริม" : "รถปกติ";
    const licensePlate = [truck.license_plate, truck.license_province].filter(Boolean).join(" - ") || "-";
    return `${vehicleType} | ${truck.driver_name || "-"} | ${licensePlate}`;
  };

  useEffect(() => {
    successAudioRef.current = new Audio(successSound);
    errorAudioRef.current = new Audio(errorSound);
    alertAudioRef.current = new Audio(alertSound);
    return () => {
      successAudioRef.current?.pause();
      errorAudioRef.current?.pause();
      alertAudioRef.current?.pause();
    };
  }, []);

  const playSound = (type: "success" | "error" | "alert") => {
    const audio = type === "success" ? successAudioRef.current : type === "alert" ? alertAudioRef.current : errorAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  };

  const loadProducts = useCallback(async () => {
    if (!sourceTruckLoadId) return;
    try {
      setLoading(true);
      setError("");
      const sourceResponse = await AxiosInstance.get<MoveTkProductsResponse>(`/move-tk/${sourceTruckLoadId}/products`, {
      });
      const rows = Array.isArray(sourceResponse.data?.data) ? sourceResponse.data.data : [];
      const draftRows = Array.isArray(sourceResponse.data?.draft) ? sourceResponse.data.draft : [];
      const draftSerials = new Set(draftRows.map((row) => normalizeSerialText(row.serial_no)));
      setPendingRows(rows.filter((row) => !draftSerials.has(normalizeSerialText(row.serial_no))));
      setMovingRows(draftRows);
      window.setTimeout(() => addInputRef.current?.focus(), 0);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "ไม่สามารถโหลดสินค้าในใบปิดบรรทุกได้");
    } finally {
      setLoading(false);
    }
  }, [sourceTruckLoadId]);

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        const [sources, targets] = await Promise.all([
          AxiosInstance.get("/move-tk/source-trucks"),
          AxiosInstance.get("/move-tk/target-trucks", { params: { source_truck_load_id: sourceTruckLoadId } }),
        ]);
        const sourceRows: MoveTkTruck[] = Array.isArray(sources.data?.data) ? sources.data.data : [];
        const targetRows: MoveTkTruck[] = Array.isArray(targets.data?.data) ? targets.data.data : [];
        const source = sourceRows.find((truck) => String(truck.truck_load_id) === sourceTruckLoadId) || null;
        const target = targetRows.find((truck) => String(truck.truck_load_id) === targetTruckLoadId) || null;
        setSourceTruck(source);
        setTargetTruck(target);
        if (!source || !target) {
          setError("ไม่พบใบปิดบรรทุกต้นทางหรือปลายทาง");
          return;
        }
        await loadProducts();
      } catch (requestError: any) {
        setError(requestError?.response?.data?.message || "ไม่สามารถโหลดข้อมูลใบปิดบรรทุกได้");
      } finally {
        setLoading(false);
      }
    };
    void initialize();
  }, [loadProducts, sourceTruckLoadId, targetTruckLoadId]);

  const moveProduct = async (row: MoveTkProduct, confirmedDestinationMismatch = false) => {
    try {
      setSaving(true);
      setError("");
      const response = await AxiosInstance.patch("/move-tk/products", {
        action: "DRAFT",
        source_truck_load_id: Number(sourceTruckLoadId),
        target_truck_load_id: Number(targetTruckLoadId),
        serial_nos: [row.serial_no],
        confirmed_destination_mismatch_serial_nos: confirmedDestinationMismatch ? [row.serial_no] : [],
      });
      playSound("success");
      const serial = normalizeSerialText(row.serial_no);
      setPendingRows((current) => current.filter((item) => normalizeSerialText(item.serial_no) !== serial));
      setMovingRows((current) =>
        current.some((item) => normalizeSerialText(item.serial_no) === serial) ? current : [...current, row],
      );
      setMessage(response.data?.message || `เพิ่ม SN ${row.serial_no} ในรายการรอยืนยันแล้ว`);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "ไม่สามารถย้ายสินค้าได้");
      playSound("error");
    } finally {
      setSaving(false);
      window.setTimeout(() => addInputRef.current?.focus(), 0);
    }
  };

  const removeProduct = async (value?: string) => {
    const rawSerial = (value ?? removeInput).trim();
    const serial = normalizeSerialText(rawSerial);
    if (!serial) return;
    const row = movingRows.find((item) => normalizeSerialText(item.serial_no) === serial);
    setRemoveInput("");

    try {
      setSaving(true);
      setError("");
      const response = await AxiosInstance.patch("/move-tk/products", {
        action: "REMOVE",
        source_truck_load_id: Number(sourceTruckLoadId),
        target_truck_load_id: Number(targetTruckLoadId),
        serial_no: rawSerial,
      });
      if (row) {
        setMovingRows((current) => current.filter((item) => normalizeSerialText(item.serial_no) !== serial));
        setPendingRows((current) =>
          current.some((item) => normalizeSerialText(item.serial_no) === serial) ? current : [...current, row],
        );
      }
      setMessage(response.data?.message || `นำ SN ${rawSerial} กลับไปรายการต้นทางแล้ว`);
      playSound("success");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "ไม่สามารถนำสินค้าออกจากรายการรอยืนยันได้");
      playSound("error");
    } finally {
      setSaving(false);
      window.setTimeout(() => removeInputRef.current?.focus(), 0);
    }
  };

  const saveMoveProducts = async () => {
    if (!movingRows.length) {
      setError("ยังไม่มีรายการรอยืนยัน");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const response = await AxiosInstance.patch("/move-tk/products", {
        action: "CONFIRM",
        source_truck_load_id: Number(sourceTruckLoadId),
        target_truck_load_id: Number(targetTruckLoadId),
      });
      playSound("success");
      if (response.data?.source_deleted) {
        navigate("/move-tk");
        return;
      }
      await loadProducts();
      setMessage(response.data?.message || "บันทึกย้ายสินค้าเรียบร้อยแล้ว");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "ไม่สามารถบันทึกย้ายสินค้าได้");
      playSound("error");
    } finally {
      setSaving(false);
      setConfirmSaveOpen(false);
      window.setTimeout(() => addInputRef.current?.focus(), 0);
    }
  };

  const scan = async (value?: string) => {
    const rawSerial = (value ?? addInput).trim();
    const normalized = normalizeSerialText(rawSerial);
    if (!normalized) return;
    setAddInput("");

    const row = pendingRows.find((item) => normalizeSerialText(item.serial_no) === normalized);
    if (!row) {
      setError(`ไม่พบ Serial No ${rawSerial} ในรายการ`);
      playSound("error");
    } else if (
      row.to_warehouse_id !== null &&
      targetTruck?.to_warehouse_id != null &&
      Number(row.to_warehouse_id) !== Number(targetTruck.to_warehouse_id)
    ) {
      setDestinationWarning(row);
      setMessage("");
      playSound("alert");
      return;
    } else {
      await moveProduct(row);
    }
    window.setTimeout(() => addInputRef.current?.focus(), 0);
  };

  return (
    <div
      className={`flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 px-1 py-2 text-slate-800 ${loading || saving ? "cursor-wait" : ""}`}
    >
      <header className="mb-3 shrink-0">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">ย้ายสินค้าไปใบปิดบรรทุก</h1>
            <p className="mt-0.5 text-xs text-slate-500">ยิง Barcode เพื่อย้ายสินค้าจากใบต้นทางไปยังใบปลายทางที่เลือก</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmSaveOpen(true)}
              disabled={loading || saving || movingRows.length === 0}
              className="h-9 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              บันทึก ({formatThaiNumber(movingRows.length)})
            </button>
            <button
              type="button"
              onClick={() => navigate("/move-tk")}
              className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              เปลี่ยนใบปิดบรรทุก
            </button>
          </div>
        </div>
      </header>

      <section className="mb-3 shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
        <div className="flex w-full items-stretch gap-3">
          <div className="min-w-0 flex-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
            <div className="text-[11px] font-medium uppercase tracking-wide text-blue-600">จากใบต้นทาง</div>
            <div className="font-semibold text-slate-800">{sourceTruck?.truck_code || sourceTruckLoadId}</div>
            <div className="text-xs text-slate-500">
              {sourceTruck ? `${sourceTruck.warehouse_name || "-"} → ${sourceTruck.to_warehouse_name || "-"}` : "กำลังโหลดข้อมูล"}
            </div>
            <div className="mt-1 truncate text-xs font-medium text-slate-600" title={getTruckDetail(sourceTruck)}>
              {getTruckDetail(sourceTruck)}
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-center px-1 text-slate-400">
            <ArrowLeftRight size={24} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <div className="text-[11px] font-medium uppercase tracking-wide text-emerald-600">ไปใบปลายทาง</div>
            <div className="font-semibold text-slate-800">{targetTruck?.truck_code || targetTruckLoadId}</div>
            <div className="text-xs text-slate-500">
              {targetTruck ? `${targetTruck.warehouse_name || "-"} → ${targetTruck.to_warehouse_name || "-"}` : "กำลังโหลดข้อมูล"}
            </div>
            <div className="mt-1 truncate text-xs font-medium text-slate-600" title={getTruckDetail(targetTruck)}>
              {getTruckDetail(targetTruck)}
            </div>
          </div>
        </div>
        <div className="mt-2.5 grid gap-3 border-t border-slate-100 pt-2.5 lg:grid-cols-2">
          <ScanInput label="ยิงย้ายสินค้า" value={addInput} onChange={setAddInput} onScan={(value) => void scan(value)} inputRef={addInputRef} disabled={loading || !sourceTruck || !targetTruck} placeholder="ยิง SN เพื่อเพิ่มในรายการรอยืนยัน" />
          <ScanInput label="ยิงลบรายการ" value={removeInput} onChange={setRemoveInput} onScan={(value) => void removeProduct(value)} inputRef={removeInputRef} disabled={loading || movingRows.length === 0} placeholder="ยิง SN ฝั่งขวาเพื่อส่งกลับฝั่งซ้าย" tone="amber" />
        </div>
      </section>

      {error && <div className="mb-3 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {message && !error && (
        <div className="mb-3 shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>
      )}
      {destinationWarning && (
        <MoveTkDestinationWarning
          product={destinationWarning}
          targetTruck={targetTruck || undefined}
          onCancel={() => {
            setDestinationWarning(null);
            window.setTimeout(() => addInputRef.current?.focus(), 0);
          }}
          onConfirm={() => {
            setDestinationWarning(null);
            void moveProduct(destinationWarning, true);
          }}
        />
      )}

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-700">สินค้าในใบต้นทาง</span>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
              {formatThaiNumber(pendingRows.length)} รายการ
            </span>
          </div>
          <MoveTkProductTable rows={pendingRows} loading={loading} emptyText="ไม่มีสินค้าในใบต้นทาง" />
        </section>
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-700">รายการรอยืนยัน</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {formatThaiNumber(movingRows.length)} รายการ
            </span>
          </div>
          <MoveTkProductTable rows={movingRows} moved destinationTruck={targetTruck} emptyText="ยังไม่มีรายการรอยืนยัน" />
        </section>
      </div>
      {confirmSaveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm animate-scaleIn rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-800">ยืนยันย้ายสินค้า</h2>
              <button type="button" onClick={() => setConfirmSaveOpen(false)} disabled={saving} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50" title="ปิด"><X size={20} /></button>
            </div>
            <div className="p-5 text-sm text-slate-600">ต้องการย้ายสินค้า <strong className="text-slate-800">{formatThaiNumber(movingRows.length)} รายการ</strong> ใช่หรือไม่</div>
            <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4">
              <button type="button" onClick={() => setConfirmSaveOpen(false)} disabled={saving} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-60">ยกเลิก</button>
              <button type="button" onClick={() => void saveMoveProducts()} disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">{saving ? "กำลังบันทึก..." : "ยืนยันบันทึก"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
