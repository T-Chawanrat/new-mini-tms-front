import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import MoveTkTruckTable from "../components/moveTk/MoveTkTruckTable";
import type { MoveTkTruck } from "../components/moveTk/types";
import AxiosInstance from "../utils/AxiosInstance";
import { formatThaiNumber } from "../utils/textSanitizer";

type Warehouse = {
  id: number;
  name: string;
};

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
  const [sourceWarehouseId, setSourceWarehouseId] = useState("");
  const [sourceSearch, setSourceSearch] = useState("");
  const [targetSearch, setTargetSearch] = useState("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadTrucks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [sources, targets, warehouseResponse] = await Promise.all([
        AxiosInstance.get("/move-dt/source-trucks"),
        AxiosInstance.get("/move-dt/target-trucks"),
        AxiosInstance.get<Warehouse[]>("/warehouses"),
      ]);
      setSourceTrucks(Array.isArray(sources.data?.data) ? sources.data.data : []);
      setTargetTrucks(Array.isArray(targets.data?.data) ? targets.data.data : []);
      setWarehouses(Array.isArray(warehouseResponse.data) ? warehouseResponse.data : []);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "ไม่สามารถโหลดรายการใบรถกระจายได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrucks();
  }, [loadTrucks]);

  const selectSource = (truck: MoveTkTruck) => {
    setSourceId(String(truck.truck_load_id));
  };

  const visibleSources = useMemo(
    () =>
      filterTrucks(sourceTrucks, sourceSearch).filter(
        (truck) => !sourceWarehouseId || String(truck.to_warehouse_id) === sourceWarehouseId,
      ),
    [sourceSearch, sourceTrucks, sourceWarehouseId],
  );
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
    <div className="flex h-[calc(100vh-105px)] w-full flex-col overflow-hidden bg-slate-50 px-1 py-2 text-slate-800">
      <header className="mb-3 flex shrink-0 items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">ย้ายสินค้าจากรถขนย้ายขึ้นรถกระจาย</h1>
          <p className="mt-0.5 text-xs text-slate-500">เลือกใบรถขนย้ายต้นทางที่ปิดแล้ว และใบรถกระจายปลายทางก่อนเข้าสู่หน้ายิงสินค้า</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/move/dt/${sourceId}/to/${targetId}`)}
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
            <div className="text-[11px] font-medium uppercase tracking-wide text-blue-600">จากรถขนย้าย</div>
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
            <div className="text-[11px] font-medium uppercase tracking-wide text-emerald-600">ไปรถกระจาย</div>
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
                <h2 className="text-sm font-semibold">1. เลือกใบรถขนย้ายต้นทาง</h2>
                <p className="text-xs text-slate-500">เฉพาะใบรถขนย้ายที่ปิดบรรทุกแล้ว</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={sourceWarehouseId}
                  onChange={(event) => setSourceWarehouseId(event.target.value)}
                  className="h-7 max-w-44 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-500"
                  title="กรองคลังปลายทาง"
                >
                  <option value="">ทุกคลังปลายทาง</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {formatThaiNumber(visibleSources.length)} ใบ
                </span>
              </div>
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
            emptyText="ไม่พบใบรถขนย้ายต้นทาง"
            onSelect={selectSource}
          />
        </section>

        <section
          className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="shrink-0 border-b border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">2. เลือกใบรถกระจายปลายทาง</h2>
                <p className="text-xs text-slate-500">ใบรถกระจายใน DC เดียวกัน</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {formatThaiNumber(visibleTargets.length)} ใบ
              </span>
            </div>
            <div className="mt-2.5">
              <input
                value={targetSearch}
                onChange={(event) => setTargetSearch(event.target.value)}
                placeholder="ค้นหาเลขใบ, คลัง, คนขับ หรือทะเบียนรถ"
                className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <MoveTkTruckTable
            rows={visibleTargets}
            selectedId={targetId}
            loading={loading}
            emptyText="ไม่พบใบรถกระจายปลายทาง"
            onSelect={(truck) => setTargetId(String(truck.truck_load_id))}
          />
        </section>
      </div>
    </div>
  );
}
