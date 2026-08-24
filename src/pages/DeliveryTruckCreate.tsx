import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { FolderOpen, PackageCheck, Plus, Printer, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import DataGrid from "../components/DataGrid";
import DatePicker from "../components/form/DatePicker";
import AxiosInstance from "../utils/AxiosInstance";
import { formatThaiDateTime, formatThaiNumber } from "../utils/textSanitizer";

type DriverType = "EMPLOYEE" | "CONTRACTOR";

type DeliveryTruckRow = {
  id: string;
  create_date: string;
  truck_code: string;
  driver_type: DriverType;
  driver_name: string;
  license_plate: string;
  count_box: number;
  status: string;
  is_close?: string | null;
  is_go?: string | null;
  route_code?: string | null;
  route_name?: string | null;
};

type Driver = { id: number; employee_code: string | null; first_name: string | null; last_name: string | null };
type Vehicle = { id: number; license_plate: string; license_plate_province: string | null; model: string | null };
type Contractor = {
  vehicle_contractor_id: number;
  user_truck_id: number;
  employee_code: string | null;
  first_name: string | null;
  last_name: string | null;
  license_plate: string;
  license_plate_province: string | null;
};

type RouteOption = { route_id: number; warehouse_id: number; route_code: string | null; route_name: string | null };

type DeliveryTruckApiRow = Omit<DeliveryTruckRow, "id"> & { truck_load_id: number };

const driverTypeLabel: Record<DriverType, string> = {
  EMPLOYEE: "รถปกติ",
  CONTRACTOR: "รถเสริม",
};

const truckStatusLabel: Record<string, string> = {
  DC_TRUCK: "คลังไปหาลูกค้า",
};

export default function DeliveryTruckCreate() {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [driverType, setDriverType] = useState<DriverType>("EMPLOYEE");
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [rows, setRows] = useState<DeliveryTruckRow[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchDeliveryTrucks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await AxiosInstance.get<{ data?: DeliveryTruckApiRow[] }>("/delivery-trucks");
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      setRows(data.map((row) => ({ ...row, id: String(row.truck_load_id) })));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOptions = useCallback(async () => {
    const response = await AxiosInstance.get<{
      data?: { drivers?: Driver[]; vehicles?: Vehicle[]; contractors?: Contractor[]; routes?: RouteOption[] };
    }>("/delivery-trucks/options");
    setDrivers(response.data?.data?.drivers || []);
    setVehicles(response.data?.data?.vehicles || []);
    setContractors(response.data?.data?.contractors || []);
    setRoutes(response.data?.data?.routes || []);
  }, []);

  useEffect(() => {
    void fetchDeliveryTrucks();
  }, [fetchDeliveryTrucks]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rows;

    return rows.filter((row) => {
      const matchesSearch = [row.truck_code, row.driver_name, row.license_plate].some((value) => value.toLowerCase().includes(keyword));
      const date = String(row.create_date || "").slice(0, 10);
      return matchesSearch && (!dateFrom || date >= dateFrom) && (!dateTo || date <= dateTo);
    });
  }, [dateFrom, dateTo, rows, search]);

  const columns = useMemo(
    () => [
      {
        field: "create_date",
        headerName: "วันที่",
        width: 155,
        renderCell: (params: { value?: string }) => <div className="flex h-full items-center">{formatThaiDateTime(params.value)}</div>,
      },
      {
        field: "truck_code",
        headerName: "เลขที่ใบรถกระจาย",
        width: 190,
        renderCell: (params: { value?: string }) => <div className="flex h-full items-center font-semibold text-blue-700">{params.value || "-"}</div>,
      },
      {
        field: "route_name",
        headerName: "สายรถ",
        width: 190,
        renderCell: (params: { row: DeliveryTruckRow }) => (
          <div className="flex h-full items-center truncate">{[params.row.route_code, params.row.route_name].filter(Boolean).join(" - ") || "-"}</div>
        ),
      },
      {
        field: "status",
        headerName: "สถานะ",
        width: 145,
        align: "center" as const,
        headerAlign: "center" as const,
        renderCell: (params: { value?: string }) => (
          <div className="flex h-full w-full items-center justify-center">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              {truckStatusLabel[params.value || ""] || params.value || "รอจัดสินค้า"}
            </span>
          </div>
        ),
      },
      {
        field: "driver_type",
        headerName: "ประเภทรถ",
        width: 130,
        align: "center" as const,
        headerAlign: "center" as const,
        renderCell: (params: { value?: DriverType }) => (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-sm font-medium text-slate-700">{params.value ? driverTypeLabel[params.value] : "-"}</span>
          </div>
        ),
      },
      {
        field: "driver_name",
        headerName: "คนขับ / ทะเบียนรถ",
        width: 220,
        renderCell: (params: { row: DeliveryTruckRow }) => (
          <div className="flex h-full w-full flex-col justify-center leading-5">
            <span className="truncate font-medium text-slate-800">{params.row.driver_name || "-"}</span>
            <span className="truncate text-xs text-slate-500">{params.row.license_plate || "-"}</span>
          </div>
        ),
      },
      {
        field: "count_box",
        headerName: "จำนวนกล่อง",
        width: 105,
        align: "center" as const,
        headerAlign: "center" as const,
        renderCell: (params: { value?: number }) => (
          <div className="flex h-full w-full items-center justify-center font-semibold">{formatThaiNumber(params.value)}</div>
        ),
      },
      {
        field: "actions",
        headerName: "จัดการ",
        width: 155,
        sortable: false,
        filterable: false,
        align: "center" as const,
        headerAlign: "center" as const,
        renderCell: (params: { row: DeliveryTruckRow }) => (
          <div className="flex h-full w-full items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => navigate(`/delivery-truck-scan/${params.row.id}`)}
              title="จัดสินค้าขึ้นรถ"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600 transition hover:bg-amber-100"
            >
              <FolderOpen size={16} />
            </button>
            <button
              type="button"
              disabled
              title="ปิดบรรทุกและปล่อยรถ"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-400"
            >
              <PackageCheck size={16} />
            </button>
            <button
              type="button"
              onClick={() => navigate(`/delivery-truck-print/${params.row.id}`)}
              title="ปริ๊น"
              disabled={Number(params.row.count_box || 0) <= 0}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              <Printer size={16} />
            </button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  const closeModal = () => {
    setIsCreateModalOpen(false);
    setDriverType("EMPLOYEE");
    setDriverId("");
    setVehicleId("");
    setRouteId("");
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    void fetchOptions();
  };

  const handleCreate = async () => {
    const contractor = contractors.find((item) => String(item.vehicle_contractor_id) === vehicleId);
    const userTruckId = driverType === "CONTRACTOR" ? contractor?.user_truck_id : Number(driverId);

    if (!userTruckId || !vehicleId) {
      alert(driverType === "CONTRACTOR" ? "กรุณาเลือกคนขับและรถเสริม" : "กรุณาเลือกคนขับและรถ");
      return;
    }

    if (!routeId) {
      alert("กรุณาเลือกสายรถ");
      return;
    }

    try {
      setCreating(true);
      await AxiosInstance.post("/delivery-trucks", {
        driver_type: driverType,
        user_truck_id: userTruckId,
        vehicle_id: driverType === "EMPLOYEE" ? Number(vehicleId) : null,
        vehicle_contractor_id: driverType === "CONTRACTOR" ? Number(vehicleId) : null,
        route_id: Number(routeId),
      });
      closeModal();
      await fetchDeliveryTrucks();
    } catch (error) {
      alert(error instanceof Error ? error.message : "ไม่สามารถสร้างใบรถกระจายได้");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 px-1 py-2 text-slate-800">
      <section className="mb-3 shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-800">ใบรถกระจายสินค้า</h1>
            <p className="mt-0.5 text-xs text-slate-500">สร้างใบรถกระจาย แล้วเลือกสายรถเพื่อจัดสินค้าออกส่งลูกค้า</p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
          >
            <Plus size={17} />
            สร้างใบรถกระจาย
          </button>
        </div>
      </section>

      <section className="mb-3 shrink-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_auto]">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">ค้นหาเลขที่ใบรถ</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหาเลขที่ใบรถ คนขับ หรือทะเบียนรถ"
              className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">วันที่เริ่มต้น</label>
            <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="เลือกวันที่เริ่มต้น" variant="compact" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">วันที่สิ้นสุด</label>
            <DatePicker value={dateTo} onChange={setDateTo} placeholder="เลือกวันที่สิ้นสุด" variant="compact" />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void fetchDeliveryTrucks()}
              className="h-9 rounded-md bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-900"
            >
              ค้นหา
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDateFrom("");
                setDateTo("");
              }}
              className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ล้าง
            </button>
          </div>
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="min-h-0 flex-1 overflow-hidden">
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={loading}
            framed={false}
            getRowId={(row: DeliveryTruckRow) => row.id}
            height="100%"
            pageSize={100}
            getRowClassName={(params) => (Number(params.row.count_box || 0) <= 0 ? "truck-empty-row" : "truck-active-row")}
          />
        </div>
      </section>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">สร้างใบรถกระจาย</h2>
                <p className="mt-0.5 text-xs text-slate-500">ระบุประเภทรถ คนขับ ทะเบียนรถ และสายรถ</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={creating}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="ปิด"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-5">
              <section>
                <label className="mb-2 block text-sm font-semibold text-slate-700">ประเภทรถ</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["EMPLOYEE", "CONTRACTOR"] as DriverType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      disabled={creating}
                      onClick={() => {
                        setDriverType(type);
                        setDriverId("");
                        setVehicleId("");
                      }}
                      className={`h-11 rounded-lg border px-4 text-left text-sm font-semibold transition disabled:cursor-not-allowed ${driverType === type ? "border-blue-600 bg-blue-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"}`}
                    >
                      {driverTypeLabel[type]}
                    </button>
                  ))}
                </div>
              </section>

              {driverType === "EMPLOYEE" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <ModalSelect label="พนักงานขับรถ" value={driverId} onChange={setDriverId} disabled={creating}>
                    <option value="">เลือกพนักงานขับรถ</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={String(driver.id)}>
                        {[driver.employee_code, driver.first_name, driver.last_name].filter(Boolean).join(" - ")}
                      </option>
                    ))}
                  </ModalSelect>
                  <ModalSelect label="ทะเบียนรถ" value={vehicleId} onChange={setVehicleId} disabled={creating}>
                    <option value="">เลือกทะเบียนรถ</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={String(vehicle.id)}>
                        {[vehicle.license_plate, vehicle.license_plate_province, vehicle.model].filter(Boolean).join(" - ")}
                      </option>
                    ))}
                  </ModalSelect>
                </div>
              ) : (
                <ModalSelect label="คนขับ / รถเสริม" value={vehicleId} onChange={setVehicleId} disabled={creating}>
                  <option value="">เลือกคนขับและรถเสริม</option>
                  {contractors.map((contractor) => (
                    <option key={contractor.vehicle_contractor_id} value={String(contractor.vehicle_contractor_id)}>
                      {[contractor.employee_code, contractor.first_name, contractor.last_name].filter(Boolean).join(" ")} -{" "}
                      {[contractor.license_plate, contractor.license_plate_province].filter(Boolean).join(" ")}
                    </option>
                  ))}
                </ModalSelect>
              )}

              <section className="rounded-lg border border-blue-100 bg-blue-50/70 p-4">
                <ModalSelect label="สายรถ" value={routeId} onChange={setRouteId} disabled={creating}>
                  <option value="">เลือกสายรถ</option>
                  {routes.map((route) => (
                    <option key={route.route_id} value={String(route.route_id)}>
                      {[route.route_code, route.route_name].filter(Boolean).join(" - ")}
                    </option>
                  ))}
                </ModalSelect>
              </section>

              {!creating && driverType === "EMPLOYEE" && drivers.length === 0 && <p className="text-xs text-red-600">ไม่พบข้อมูลพนักงานขับรถ</p>}
              {!creating && driverType === "EMPLOYEE" && vehicles.length === 0 && <p className="text-xs text-red-600">ไม่พบข้อมูลทะเบียนรถ</p>}
              {!creating && driverType === "CONTRACTOR" && contractors.length === 0 && (
                <p className="text-xs text-red-600">ไม่พบข้อมูลคนขับและรถเสริมที่พร้อมใช้งาน</p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={creating}
                className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={creating || !routeId || !vehicleId || (driverType === "EMPLOYEE" && !driverId)}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Plus size={16} />
                {creating ? "กำลังสร้าง..." : "สร้างใบรถกระจาย"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type ModalSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
};

function ModalSelect({ label, value, onChange, disabled = false, children }: ModalSelectProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        {children}
      </select>
    </div>
  );
}
