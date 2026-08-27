import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import MoveTkTruckTable from "../components/moveTk/MoveTkTruckTable";
import type { MoveTkTruck } from "../components/moveTk/types";
import AxiosInstance from "../utils/AxiosInstance";
import { formatThaiNumber } from "../utils/textSanitizer";

const filterTrucks = (rows: MoveTkTruck[], searchValue: string) => {
  const search = searchValue.trim().toLowerCase();
  if (!search) return rows;
  return rows.filter((truck) =>
    [truck.truck_code, truck.warehouse_name, truck.to_warehouse_name, truck.driver_name, truck.license_plate].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(search),
    ),
  );
};

export default function MoveDt() {
  const navigate = useNavigate();
  const [sourceTrucks, setSourceTrucks] = useState<MoveTkTruck[]>([]);
  const [targetTrucks, setTargetTrucks] = useState<MoveTkTruck[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [sourceSearch, setSourceSearch] = useState("");
  const [targetSearch, setTargetSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadTrucks = useCallback(async (selectedSourceId = "") => {
    try {
      setLoading(true);
      setError("");
      const [sources, targets] = await Promise.all([
        AxiosInstance.get("/move-tk/source-trucks"),
        AxiosInstance.get("/move-tk/target-trucks", {
          params: { source_truck_load_id: selectedSourceId || undefined },
        }),
      ]);
      setSourceTrucks(Array.isArray(sources.data?.data) ? sources.data.data : []);
      setTargetTrucks(Array.isArray(targets.data?.data) ? targets.data.data : []);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "ไม่สามารถโหลดรายการใบปิดบรรทุกได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrucks();
  }, [loadTrucks]);

  const selectSource = async (truck: MoveTkTruck) => {
    const value = String(truck.truck_load_id);
    setSourceId(value);
    setTargetId("");
    setTargetSearch("");
    await loadTrucks(value);
  };

  const visibleSources = useMemo(() => filterTrucks(sourceTrucks, sourceSearch), [sourceSearch, sourceTrucks]);
  const visibleTargets = useMemo(() => filterTrucks(targetTrucks, targetSearch), [targetSearch, targetTrucks]);
  const selectedSource = sourceTrucks.find((truck) => String(truck.truck_load_id) === sourceId);
  const selectedTarget = targetTrucks.find((truck) => String(truck.truck_load_id) === targetId);
  const getTruckDetail = (truck?: MoveTkTruck) => {
    if (!truck) return "เลือกจากตาราง";
    const vehicleType = truck.driver_type === "CONTRACTOR" ? "รถเสริม" : "รถปกติ";
    const licensePlate = [truck.license_plate, truck.license_province].filter(Boolean).join(" - ") || "-";
    return `${vehicleType} | ${truck.driver_name || "-"} | ${licensePlate}`;
  };

  return (
    <div className="flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 px-1 py-2 text-slate-800">
      <header className="mb-3 flex shrink-0 items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">เลือกใบปิดบรรทุกสำหรับย้ายสินค้า</h1>
          <p className="mt-0.5 text-xs text-slate-500">เลือกใบต้นทางที่ปิดแล้ว และเลือกใบปลายทางก่อนเข้าสู่หน้ายิงสินค้า</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/move-tk/${sourceId}/to/${targetId}`)}
          disabled={!sourceId || !targetId}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          เริ่มย้ายสินค้า
        </button>
      </header>

      {error && <div className="mb-3 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <section className="mb-3 shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
        <div className="flex w-full items-stretch gap-3">
          <div className="min-w-0 flex-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
            <div className="text-[11px] font-medium uppercase tracking-wide text-blue-600">จากใบต้นทาง</div>
            <div className="font-semibold text-slate-800">{selectedSource?.truck_code || "ยังไม่ได้เลือก"}</div>
            <div className="text-xs text-slate-500">
              {selectedSource ? `${selectedSource.warehouse_name || "-"} → ${selectedSource.to_warehouse_name || "-"}` : "เลือกจากตารางด้านซ้าย"}
            </div>
            <div className="mt-1 truncate text-xs font-medium text-slate-600" title={getTruckDetail(selectedSource)}>
              {getTruckDetail(selectedSource)}
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-center px-1 text-slate-400">
            <ArrowLeftRight size={24} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <div className="text-[11px] font-medium uppercase tracking-wide text-emerald-600">ไปใบปลายทาง</div>
            <div className="font-semibold text-slate-800">{selectedTarget?.truck_code || "ยังไม่ได้เลือก"}</div>
            <div className="text-xs text-slate-500">
              {selectedTarget ? `${selectedTarget.warehouse_name || "-"} → ${selectedTarget.to_warehouse_name || "-"}` : "เลือกจากตารางด้านขวา"}
            </div>
            <div className="mt-1 truncate text-xs font-medium text-slate-600" title={getTruckDetail(selectedTarget)}>
              {getTruckDetail(selectedTarget)}
            </div>
          </div>
        </div>
      </section>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="shrink-0 border-b border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">1. เลือกใบต้นทาง</h2>
                <p className="text-xs text-slate-500">เฉพาะใบที่ปิดบรรทุกแล้ว</p>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {formatThaiNumber(visibleSources.length)} ใบ
              </span>
            </div>
            <div className="mt-2.5">
              <input
                value={sourceSearch}
                onChange={(event) => setSourceSearch(event.target.value)}
                placeholder="ค้นหาเลขใบ, คลัง, คนขับ หรือทะเบียนรถ"
                className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <MoveTkTruckTable
            rows={visibleSources}
            selectedId={sourceId}
            loading={loading}
            emptyText="ไม่พบใบปิดบรรทุกต้นทาง"
            onSelect={(truck) => void selectSource(truck)}
          />
        </section>

        <section
          className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${!sourceId ? "opacity-60" : ""}`}
        >
          <div className="shrink-0 border-b border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">2. เลือกใบปลายทาง</h2>
                <p className="text-xs text-slate-500">เฉพาะใบรถขนย้ายระหว่าง DC</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {formatThaiNumber(sourceId ? visibleTargets.length : 0)} ใบ
              </span>
            </div>
            <div className="mt-2.5">
              <input
                value={targetSearch}
                onChange={(event) => setTargetSearch(event.target.value)}
                disabled={!sourceId}
                placeholder="ค้นหาเลขใบ, คลัง, คนขับ หรือทะเบียนรถ"
                className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>
          </div>
          {sourceId ? (
            <MoveTkTruckTable
              rows={visibleTargets}
              selectedId={targetId}
              loading={loading}
              emptyText="ไม่พบใบปิดบรรทุกปลายทาง"
              onSelect={(truck) => setTargetId(String(truck.truck_load_id))}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500">กรุณาเลือกใบต้นทางก่อน</div>
          )}
        </section>
      </div>
    </div>
  );
}
