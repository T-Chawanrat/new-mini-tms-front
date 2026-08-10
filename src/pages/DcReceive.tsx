import { useCallback, useEffect, useRef, useState } from "react";

import errorSound from "../../assets/sounds/error.mp3";
import successSound from "../../assets/sounds/success.mp3";
import AxiosInstance from "../utils/AxiosInstance";
import { formatThaiDateTime, formatThaiNumber, normalizeSerialText } from "../utils/textSanitizer";

type DcReceiveRow = {
  serial_id: string;
  serial_no: string;
  movement_date: string | null;
  truck_load_id: number;
  truck_code: string;
  driver_name: string | null;
  license_plate: string | null;
  license_province: string | null;
};

const countTruckLoads = (rows: DcReceiveRow[]) =>
  new Set(rows.map((row) => row.truck_load_id).filter(Boolean)).size;

export default function DcReceive() {
  const receiveInputRef = useRef<HTMLInputElement>(null);
  const removeInputRef = useRef<HTMLInputElement>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);
  const [pendingRows, setPendingRows] = useState<DcReceiveRow[]>([]);
  const [scannedRows, setScannedRows] = useState<DcReceiveRow[]>([]);
  const [receiveInput, setReceiveInput] = useState("");
  const [removeInput, setRemoveInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    successAudioRef.current = new Audio(successSound);
    errorAudioRef.current = new Audio(errorSound);
    return () => {
      successAudioRef.current?.pause();
      errorAudioRef.current?.pause();
    };
  }, []);

  const playSound = (type: "success" | "error") => {
    const audio = type === "success" ? successAudioRef.current : errorAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  };

  const loadSerials = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await AxiosInstance.get("/dc-receives/serials");
      setPendingRows(Array.isArray(response.data?.data) ? response.data.data : []);
      setScannedRows([]);
    } catch (requestError: any) {
      setPendingRows([]);
      setError(requestError?.response?.data?.message || "ไม่สามารถโหลดรายการรอรับเข้า DC ได้");
    } finally {
      setLoading(false);
      window.setTimeout(() => receiveInputRef.current?.focus(), 0);
    }
  }, []);

  useEffect(() => {
    void loadSerials();
  }, [loadSerials]);

  const scanToRight = () => {
    const normalized = normalizeSerialText(receiveInput);
    if (!normalized) return;
    const index = pendingRows.findIndex((row) => normalizeSerialText(row.serial_no) === normalized);
    if (index < 0) {
      setError(`ไม่พบ Serial No ${receiveInput.trim()} ในรายการรอรับเข้า DC`);
      playSound("error");
    } else {
      const row = pendingRows[index];
      setPendingRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
      setScannedRows((current) => [row, ...current]);
      setError("");
      setMessage(`ยิง ${row.serial_no} แล้ว`);
      playSound("success");
    }
    setReceiveInput("");
    window.setTimeout(() => receiveInputRef.current?.focus(), 0);
  };

  const scanToLeft = () => {
    const normalized = normalizeSerialText(removeInput);
    if (!normalized) return;
    const index = scannedRows.findIndex((row) => normalizeSerialText(row.serial_no) === normalized);
    if (index < 0) {
      setError(`ไม่พบ Serial No ${removeInput.trim()} ในฝั่งที่ยิงแล้ว`);
      playSound("error");
    } else {
      const row = scannedRows[index];
      setScannedRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
      setPendingRows((current) => [row, ...current]);
      setError("");
      setMessage(`นำ ${row.serial_no} กลับฝั่งรอยิงแล้ว`);
      playSound("success");
    }
    setRemoveInput("");
    window.setTimeout(() => removeInputRef.current?.focus(), 0);
  };

  const save = async () => {
    if (!scannedRows.length) return;
    try {
      setSaving(true);
      setError("");
      const response = await AxiosInstance.post("/dc-receives", {
        serial_nos: scannedRows.map((row) => row.serial_no),
      });
      setMessage(response.data?.message || "รับสินค้าเข้า DC สำเร็จ");
      playSound("success");
      await loadSerials();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "ไม่สามารถรับสินค้าเข้า DC ได้");
      playSound("error");
    } finally {
      setSaving(false);
    }
  };

  const renderTable = (rows: DcReceiveRow[], emptyText: string, color: "red" | "green") => (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full min-w-[1050px] table-fixed border-collapse text-xs">
        <thead className="sticky top-0 z-10 bg-slate-100 text-slate-600">
          <tr>
            <th className="w-[330px] whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left">SERIAL NO</th>
            <th className="w-[180px] whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left">วันที่</th>
            <th className="w-[200px] whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left">เลขใบปิดบรรทุก</th>
            <th className="w-[170px] whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left">คนขับ</th>
            <th className="w-[170px] whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left">ทะเบียนรถ</th>
          </tr>
        </thead>
        <tbody>
          {!rows.length ? (
            <tr><td colSpan={5} className="px-3 py-10 text-center text-sm text-slate-500">{loading ? "กำลังโหลดรายการ..." : emptyText}</td></tr>
          ) : rows.map((row, index) => (
            <tr
              key={`${row.truck_load_id}-${row.serial_id}-${row.serial_no}`}
              className={
                index % 2 === 0
                  ? color === "red" ? "bg-white hover:bg-blue-50/50" : "bg-white hover:bg-emerald-50/50"
                  : color === "red" ? "bg-slate-50/70 hover:bg-blue-50/50" : "bg-slate-50/70 hover:bg-emerald-50/50"
              }
            >
              <td title={row.serial_no} className="whitespace-nowrap border-b border-slate-100 px-3 py-2 align-top">
                <span className={`inline-block whitespace-nowrap rounded-lg border px-2.5 py-1 font-mono text-sm font-semibold leading-5 ${color === "red" ? "border-red-300 bg-red-50 text-red-600" : "border-emerald-300 bg-emerald-50 text-emerald-700"}`}>
                  {row.serial_no}
                </span>
              </td>
              <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2">{formatThaiDateTime(row.movement_date)}</td>
              <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2">{row.truck_code || "-"}</td>
              <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2">{row.driver_name || "-"}</td>
              <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2">{[row.license_plate, row.license_province].filter(Boolean).join(" ") || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-61px)] flex-col overflow-hidden bg-slate-50 px-1 py-2 text-slate-800">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div><h1 className="text-lg font-bold text-slate-900">รับสินค้าเข้าคลัง DC</h1><p className="text-xs text-slate-500">ยิง Serial No จากรถลงคลัง DC</p></div>
        <button type="button" onClick={save} disabled={saving || loading || !scannedRows.length} className="h-9 rounded-md bg-emerald-600 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">{saving ? "กำลังบันทึก..." : `บันทึก (${formatThaiNumber(scannedRows.length)})`}</button>
      </div>
      <div className="mb-3 grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:grid-cols-2">
        <input ref={receiveInputRef} value={receiveInput} onChange={(event) => setReceiveInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); scanToRight(); } }} disabled={loading || saving} placeholder="ยิง SN เพื่อรับเข้า DC" className="h-9 rounded-md border border-slate-300 px-3 font-mono text-sm outline-none focus:border-blue-500" />
        <input ref={removeInputRef} value={removeInput} onChange={(event) => setRemoveInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); scanToLeft(); } }} disabled={loading || saving || !scannedRows.length} placeholder="ยิง SN เพื่อนำกลับฝั่งซ้าย" className="h-9 rounded-md border border-slate-300 px-3 font-mono text-sm outline-none focus:border-amber-500 disabled:bg-slate-100" />
      </div>
      {error && <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {message && !error && <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}
      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-2">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2.5"><span className="text-sm font-semibold text-slate-700">รายการรอยิง</span><span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">{formatThaiNumber(pendingRows.length)} รายการ · {formatThaiNumber(countTruckLoads(pendingRows))} ใบปิดบรรทุก</span></div>{renderTable(pendingRows, "ไม่มีรายการรอยิง", "red")}</section>
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2.5"><span className="text-sm font-semibold text-slate-700">รายการที่ยิงแล้ว</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{formatThaiNumber(scannedRows.length)} รายการ · {formatThaiNumber(countTruckLoads(scannedRows))} ใบปิดบรรทุก</span></div>{renderTable(scannedRows, "ยังไม่มีรายการที่ยิง", "green")}</section>
      </div>
    </div>
  );
}
