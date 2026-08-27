import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import alertSound from "../../assets/sounds/alert.mp3";
import errorSound from "../../assets/sounds/error.mp3";
import successSound from "../../assets/sounds/success.mp3";
import MoveTkDestinationWarning from "../components/moveTk/MoveTkDestinationWarning";
import MoveTkProductTable from "../components/moveTk/MoveTkProductTable";
import type { MoveTkProduct, MoveTkTruck } from "../components/moveTk/types";
import AxiosInstance from "../utils/AxiosInstance";
import { formatThaiNumber, normalizeSerialText } from "../utils/textSanitizer";

export default function MoveDtScan() {
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
  const [confirmedMismatchSerialNos, setConfirmedMismatchSerialNos] = useState<string[]>([]);
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
      const response = await AxiosInstance.get(`/move-tk/${sourceTruckLoadId}/products`);
      setPendingRows(Array.isArray(response.data?.data) ? response.data.data : []);
      setMovingRows([]);
      setConfirmedMismatchSerialNos([]);
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

  const moveRow = (row: MoveTkProduct, direction: "right" | "left") => {
    if (direction === "right") {
      setPendingRows((current) => current.filter((item) => item.product_truck_id !== row.product_truck_id));
      setMovingRows((current) => [row, ...current]);
    } else {
      setMovingRows((current) => current.filter((item) => item.product_truck_id !== row.product_truck_id));
      setPendingRows((current) => [row, ...current]);
    }
    setError("");
    setMessage(`ย้าย ${row.serial_no} ${direction === "right" ? "ไปฝั่งบันทึก" : "กลับฝั่งต้นทาง"}แล้ว`);
    playSound("success");
  };

  const scan = (direction: "right" | "left") => {
    const input = direction === "right" ? addInput : removeInput;
    const rows = direction === "right" ? pendingRows : movingRows;
    const normalized = normalizeSerialText(input);
    if (!normalized) return;

    const row = rows.find((item) => normalizeSerialText(item.serial_no) === normalized);
    if (!row) {
      setError(`ไม่พบ Serial No ${input.trim()} ในรายการ`);
      playSound("error");
    } else if (
      direction === "right" &&
      row.to_warehouse_id !== null &&
      targetTruck?.to_warehouse_id != null &&
      Number(row.to_warehouse_id) !== Number(targetTruck.to_warehouse_id)
    ) {
      setDestinationWarning(row);
      setMessage("");
      playSound("alert");
      setAddInput("");
      return;
    } else {
      moveRow(row, direction);
    }

    if (direction === "right") {
      setAddInput("");
      window.setTimeout(() => addInputRef.current?.focus(), 0);
    } else {
      setRemoveInput("");
      window.setTimeout(() => removeInputRef.current?.focus(), 0);
    }
  };

  const save = async () => {
    if (!movingRows.length) return;
    try {
      setSaving(true);
      setError("");
      const response = await AxiosInstance.patch("/move-tk/products", {
        source_truck_load_id: Number(sourceTruckLoadId),
        target_truck_load_id: Number(targetTruckLoadId),
        serial_nos: movingRows.map((row) => row.serial_no),
        confirmed_destination_mismatch_serial_nos: confirmedMismatchSerialNos,
      });
      playSound("success");
      if (response.data?.source_deleted) {
        navigate("/move-tk");
        return;
      }
      await loadProducts();
      setMessage(response.data?.message || "ย้ายสินค้าไปยังใบปิดบรรทุกใหม่สำเร็จ");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "ไม่สามารถย้ายสินค้าได้");
      playSound("error");
    } finally {
      setSaving(false);
    }
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
              onClick={() => navigate("/move-tk")}
              className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              เปลี่ยนใบปิดบรรทุก
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || !movingRows.length}
              className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {saving ? "กำลังบันทึก..." : `บันทึก (${formatThaiNumber(movingRows.length)})`}
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
        <div className="mt-2.5 grid gap-x-4 gap-y-2 border-t border-slate-100 pt-2.5 lg:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">ยิงย้ายสินค้า</label>
            <input
              ref={addInputRef}
              value={addInput}
              onChange={(event) => setAddInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  scan("right");
                }
              }}
              disabled={loading || saving || !sourceTruck || !targetTruck}
              placeholder="ยิง SN เพื่อย้ายไปฝั่งขวา"
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">ยิงลบรายการ</label>
            <input
              ref={removeInputRef}
              value={removeInput}
              onChange={(event) => setRemoveInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  scan("left");
                }
              }}
              disabled={saving || !movingRows.length}
              placeholder="ยิง SN ฝั่งขวาเพื่อส่งกลับฝั่งซ้าย"
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 font-mono text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-100"
            />
          </div>
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
            moveRow(destinationWarning, "right");
            setConfirmedMismatchSerialNos((current) =>
              current.includes(destinationWarning.serial_no)
                ? current
                : [...current, destinationWarning.serial_no],
            );
            setDestinationWarning(null);
            window.setTimeout(() => addInputRef.current?.focus(), 0);
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
            <span className="text-sm font-semibold text-slate-700">รายการที่จะย้าย</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {formatThaiNumber(movingRows.length)} รายการ
            </span>
          </div>
          <MoveTkProductTable rows={movingRows} moved destinationTruck={targetTruck} emptyText="ยังไม่มีรายการที่จะย้าย" />
        </section>
      </div>
    </div>
  );
}
