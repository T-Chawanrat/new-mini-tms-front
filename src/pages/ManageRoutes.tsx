import { useEffect, useMemo, useState } from "react";
import AxiosInstance from "../utils/AxiosInstance";
import { Pencil, Plus, Route, Trash2, X } from "lucide-react";
import AddressSearchDropdown from "../components/dropdown/AddressSearchDropdown";
import DataGrid from "../components/DataGrid";
import { type GridColDef } from "@mui/x-data-grid";

type RouteRow = {
  route_id: number;
  warehouse_id: number | null;
  warehouse_name: string | null;
  route_code: string | null;
  route_name: string | null;
  cost_oil: string | number | null;
  is_deleted: "Y" | "N";
  route_detail_id: number | null;
  subdistrict_id: number | null;
  subdistrict_name: string | null;
  district_name: string | null;
  province_name: string | null;
  zip_code: string | null;
  route_detail_day_id: number | null;
  day: string | null;
};

type RouteDetail = {
  route_detail_id: number;
  subdistrict_id: number | null;
  subdistrict_name: string | null;
  district_name: string | null;
  province_name: string | null;
  zip_code: string | null;
  days: string[];
};

type RouteItem = Omit<RouteRow, "route_detail_id" | "subdistrict_id" | "subdistrict_name" | "district_name" | "province_name" | "zip_code" | "route_detail_day_id" | "day"> & {
  details: RouteDetail[];
};

type Warehouse = {
  id: number;
  name: string;
};

type StatusTarget = {
  route_id: number;
  is_deleted: "Y" | "N";
};

type DeleteDetailTarget = {
  route_detail_id: number;
  subdistrict_name: string | null;
};

const thaiDays: Record<string, string> = {
  Monday: "จ",
  Tuesday: "อ",
  Wednesday: "พ",
  Thursday: "พฤ",
  Friday: "ศ",
  Saturday: "ส",
  Sunday: "อา",
};

const weekDays = [
  { value: "Monday", label: "จันทร์" },
  { value: "Tuesday", label: "อังคาร" },
  { value: "Wednesday", label: "พุธ" },
  { value: "Thursday", label: "พฤหัสบดี" },
  { value: "Friday", label: "ศุกร์" },
  { value: "Saturday", label: "เสาร์" },
  { value: "Sunday", label: "อาทิตย์" },
];

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || "ไม่สามารถโหลดข้อมูลสายรถได้";
  }

  return "ไม่สามารถโหลดข้อมูลสายรถได้";
};

export default function ManageRoutes() {
  const [rows, setRows] = useState<RouteRow[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [addressSearch, setAddressSearch] = useState("");
  const [routeCode, setRouteCode] = useState("");
  const [routeName, setRouteName] = useState("");
  const [selectedSubdistrictId, setSelectedSubdistrictId] = useState<number | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [routeFormError, setRouteFormError] = useState("");
  const [detailFormError, setDetailFormError] = useState("");
  const [savingRoute, setSavingRoute] = useState(false);
  const [savingDetail, setSavingDetail] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<number | null>(null);
  const [editingDetailId, setEditingDetailId] = useState<number | null>(null);
  const [statusTarget, setStatusTarget] = useState<StatusTarget | null>(null);
  const [deleteDetailTarget, setDeleteDetailTarget] = useState<DeleteDetailTarget | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingDetail, setDeletingDetail] = useState(false);

  const loadRoutes = async (searchValue = search) => {
    try {
      setLoading(true);
      setError("");
      const response = await AxiosInstance.get<RouteRow[]>("/manage/routes", {
        params: { search: searchValue.trim() || undefined },
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setRows(data);
      setSelectedRouteId((current) => current ?? data[0]?.route_id ?? null);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(
      () => {
        void loadRoutes();
      },
      search ? 300 : 0,
    );

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const response = await AxiosInstance.get<Warehouse[]>("/warehouses");
        setWarehouses(Array.isArray(response.data) ? response.data : []);
      } catch {
        setWarehouses([]);
      }
    };

    void loadWarehouses();
  }, []);

  const openCreateRoute = () => {
    setEditingRouteId(null);
    setSelectedWarehouseId("");
    setRouteCode("");
    setRouteName("");
    setRouteFormError("");
    setRouteModalOpen(true);
  };

  const openCreateDetail = () => {
    setEditingDetailId(null);
    setAddressSearch("");
    setSelectedSubdistrictId(null);
    setSelectedDays([]);
    setDetailFormError("");
    setDetailModalOpen(true);
  };

  const openEditRoute = (route: RouteItem) => {
    setEditingRouteId(route.route_id);
    setSelectedWarehouseId(String(route.warehouse_id || ""));
    setRouteCode(route.route_code || "");
    setRouteName(route.route_name || "");
    setRouteFormError("");
    setRouteModalOpen(true);
  };

  const openEditDetail = (detail: RouteDetail) => {
    setEditingDetailId(detail.route_detail_id);
    setAddressSearch(detail.subdistrict_name || "");
    setSelectedSubdistrictId(detail.subdistrict_id);
    setSelectedDays(detail.days);
    setDetailFormError("");
    setDetailModalOpen(true);
  };

  const handleCreateRoute = async () => {
    try {
      setSavingRoute(true);
      setRouteFormError("");

      const payload = {
        warehouse_id: selectedWarehouseId,
        route_code: routeCode,
        route_name: routeName,
      };
      const response = editingRouteId
        ? await AxiosInstance.put(`/manage/routes/${editingRouteId}`, payload)
        : await AxiosInstance.post<{ route_id: number }>("/manage/routes", payload);

      setRouteModalOpen(false);
      await loadRoutes();
      setSelectedRouteId(editingRouteId || response.data.route_id);
    } catch (saveError) {
      setRouteFormError(getErrorMessage(saveError));
    } finally {
      setSavingRoute(false);
    }
  };

  const handleCreateDetail = async () => {
    if (!selectedRoute) return;

    try {
      setSavingDetail(true);
      setDetailFormError("");

      const payload = {
        subdistrict_id: selectedSubdistrictId,
        days: selectedDays,
      };

      if (editingDetailId) {
        await AxiosInstance.put(`/manage/routes/${selectedRoute.route_id}/details/${editingDetailId}`, payload);
      } else {
        await AxiosInstance.post(`/manage/routes/${selectedRoute.route_id}/details`, payload);
      }

      setDetailModalOpen(false);
      await loadRoutes();
    } catch (saveError) {
      setDetailFormError(getErrorMessage(saveError));
    } finally {
      setSavingDetail(false);
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays((current) => (current.includes(day) ? current.filter((item) => item !== day) : [...current, day]));
  };

  const handleUpdateRouteStatus = async (isDeleted: "Y" | "N") => {
    if (!statusTarget) return;

    try {
      setUpdatingStatus(true);
      await AxiosInstance.patch(`/manage/routes/${statusTarget.route_id}/status`, { is_deleted: isDeleted });
      setStatusTarget(null);
      await loadRoutes();
    } catch (updateError) {
      setError(getErrorMessage(updateError));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteDetail = async () => {
    if (!selectedRoute || !deleteDetailTarget) return;

    try {
      setDeletingDetail(true);
      await AxiosInstance.delete(`/manage/routes/${selectedRoute.route_id}/details/${deleteDetailTarget.route_detail_id}`);
      setDeleteDetailTarget(null);
      await loadRoutes();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setDeletingDetail(false);
    }
  };

  const routes = useMemo<RouteItem[]>(() => {
    const grouped = new Map<number, RouteItem>();

    rows.forEach((row) => {
      let route = grouped.get(row.route_id);

      if (!route) {
        route = {
          route_id: row.route_id,
          warehouse_id: row.warehouse_id,
          warehouse_name: row.warehouse_name,
          route_code: row.route_code,
          route_name: row.route_name,
          cost_oil: row.cost_oil,
          is_deleted: row.is_deleted,
          details: [],
        };
        grouped.set(row.route_id, route);
      }

      if (!row.route_detail_id) return;

      let detail = route.details.find((item) => item.route_detail_id === row.route_detail_id);
      if (!detail) {
        detail = {
          route_detail_id: row.route_detail_id,
          subdistrict_id: row.subdistrict_id,
          subdistrict_name: row.subdistrict_name,
          district_name: row.district_name,
          province_name: row.province_name,
          zip_code: row.zip_code,
          days: [],
        };
        route.details.push(detail);
      }

      if (row.day && !detail.days.includes(row.day)) detail.days.push(row.day);
    });

    return [...grouped.values()];
  }, [rows]);

  const selectedRoute = routes.find((route) => route.route_id === selectedRouteId) ?? null;

  const routeColumns = useMemo<GridColDef<RouteItem>[]>(
    () => [
      { field: "route_code", headerName: "รหัสสายรถ", width: 115 },
      { field: "route_name", headerName: "ชื่อสายรถ", minWidth: 170, flex: 1 },
      { field: "warehouse_name", headerName: "คลัง", width: 185 },
      {
        field: "detail_count",
        headerName: "จำนวนตำบล",
        width: 110,
        align: "center",
        headerAlign: "center",
        valueGetter: (_, row) => row.details.length,
      },
      {
        field: "is_deleted",
        headerName: "สถานะ",
        width: 105,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setStatusTarget({ route_id: row.route_id, is_deleted: row.is_deleted });
            }}
            className={`rounded-full px-2 py-1 text-xs font-medium ${row.is_deleted === "N" ? "bg-green-100 text-green-600 hover:bg-green-200" : "bg-red-100 text-red-500 hover:bg-red-200"}`}
          >
            {row.is_deleted === "N" ? "Active" : "Inactive"}
          </button>
        ),
      },
      {
        field: "edit",
        headerName: "แก้ไข",
        width: 80,
        sortable: false,
        filterable: false,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openEditRoute(row);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
            title="แก้ไขสายรถ"
          >
            <Pencil size={14} />
          </button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex h-[calc(100vh-61px)] w-full flex-col overflow-auto bg-slate-50 px-1 py-1 xl:overflow-hidden">
      <div className="mb-2 shrink-0 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-800">
            <Route size={22} className="text-blue-600" />
            จัดการสายรถ
          </h1>
          <p className="mt-1 text-sm text-slate-500">เลือกสายรถเพื่อดูตำบลและวันที่รถเข้าส่ง</p>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-stretch">
        <div className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex shrink-0 flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-slate-700">รายการสายรถ</div>
            <div className="flex w-full gap-2 sm:w-auto">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ค้นหารหัสหรือชื่อสายรถ"
                className="input-modern min-w-0 flex-1 sm:w-64 sm:flex-none"
              />
              <button
                type="button"
                onClick={openCreateRoute}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus size={16} />
                เพิ่มสายรถ
              </button>
            </div>
          </div>

          {error ? (
            <div className="px-4 py-10 text-center text-sm text-red-500">{error}</div>
          ) : (
            <div className="min-h-0 flex-1">
              <DataGrid
                rows={routes}
                columns={routeColumns}
                loading={loading}
                getRowId={(row) => row.route_id}
                getRowClassName={(params) => (params.row.route_id === selectedRouteId ? "truck-active-row" : "")}
                height="100%"
                pageSize={100}
                framed={false}
                onRowClick={(params) => setSelectedRouteId(params.row.route_id)}
              />
            </div>
          )}
        </div>

        <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm xl:flex xl:min-h-0 xl:flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4">
            <div>
              <div className="text-sm font-semibold text-slate-700">ตำบลในสายรถ</div>
              <div className="mt-1 text-sm text-slate-500">
                {selectedRoute ? `${selectedRoute.route_code || "-"} · ${selectedRoute.route_name || "-"}` : "เลือกสายรถจากรายการ"}
              </div>
            </div>
            <button
              type="button"
              onClick={openCreateDetail}
              disabled={!selectedRoute}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={16} />
              เพิ่มตำบล
            </button>
          </div>

          <div className="xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
            {!selectedRoute ? (
              <div className="px-4 py-10 text-center text-sm text-slate-400">เลือกสายรถเพื่อดูตำบล</div>
            ) : !selectedRoute.details.length ? (
              <div className="px-4 py-10 text-center text-sm text-slate-400">สายรถนี้ยังไม่มีตำบล</div>
            ) : (
              <div className="overflow-x-scroll">
                <table className="min-w-[500px] w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                    <tr>
                      <th className="px-4 py-3">ตำบล / อำเภอ / จังหวัด</th>
                      <th className="px-4 py-3">วันที่รถเข้า</th>
                      <th className="px-4 py-3 text-center">แก้ไข</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRoute.details.map((detail) => (
                      <tr key={detail.route_detail_id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-700">{detail.subdistrict_name || "-"}</div>
                          <div className="mt-0.5 text-xs text-slate-500">
                            {[detail.district_name && `อ.${detail.district_name}`, detail.province_name && `จ.${detail.province_name}`, detail.zip_code]
                              .filter(Boolean)
                              .join(" · ") || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {detail.days.length ? detail.days.map((day) => thaiDays[day] || day).join(", ") : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditDetail(detail)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                              title="แก้ไขตำบล"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteDetailTarget({ route_detail_id: detail.route_detail_id, subdistrict_name: detail.subdistrict_name })
                              }
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
                              title="ลบตำบล"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </aside>
      </div>

      {statusTarget && (
        <div onClick={() => setStatusTarget(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div onClick={(event) => event.stopPropagation()} className="w-[300px] animate-scaleIn rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-slate-800">สถานะ</h2>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={updatingStatus || statusTarget.is_deleted === "N"}
                onClick={() => void handleUpdateRouteStatus("N")}
                className={`rounded-lg px-4 py-2 ${statusTarget.is_deleted === "N" ? "cursor-not-allowed bg-green-50 text-green-300" : "bg-green-100 text-green-600 hover:bg-green-200"}`}
              >
                Active
              </button>
              <button
                type="button"
                disabled={updatingStatus || statusTarget.is_deleted === "Y"}
                onClick={() => void handleUpdateRouteStatus("Y")}
                className={`rounded-lg px-4 py-2 ${statusTarget.is_deleted === "Y" ? "cursor-not-allowed bg-red-50 text-red-300" : "bg-red-100 text-red-500 hover:bg-red-200"}`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteDetailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm animate-scaleIn rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-800">ยืนยันลบตำบล</h2>
              <button
                type="button"
                onClick={() => setDeleteDetailTarget(null)}
                disabled={deletingDetail}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                title="ปิด"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 text-sm text-slate-600">
              ต้องการลบตำบล <strong className="text-slate-800">{deleteDetailTarget.subdistrict_name || "-"}</strong> ออกจากสายรถนี้ใช่หรือไม่
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setDeleteDetailTarget(null)}
                disabled={deletingDetail}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-60"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteDetail()}
                disabled={deletingDetail}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deletingDetail ? "กำลังลบ..." : "ลบ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {routeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg animate-scaleIn rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-800">{editingRouteId ? "แก้ไขสายรถ" : "เพิ่มสายรถ"}</h2>
              <button
                type="button"
                onClick={() => setRouteModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                title="ปิด"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">คลัง</label>
                <select className="input-modern w-full" value={selectedWarehouseId} onChange={(event) => setSelectedWarehouseId(event.target.value)}>
                  <option value="" disabled>
                    เลือกคลัง
                  </option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">รหัสสายรถ</label>
                <input
                  className="input-modern w-full"
                  placeholder="เช่น BKK-01"
                  value={routeCode}
                  onChange={(event) => setRouteCode(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">ชื่อสายรถ</label>
                <input
                  className="input-modern w-full"
                  placeholder="เช่น บางนา - สมุทรปราการ"
                  value={routeName}
                  onChange={(event) => setRouteName(event.target.value)}
                />
              </div>
            </div>
            {routeFormError && <div className="px-5 pb-3 text-sm text-red-500">{routeFormError}</div>}
            <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setRouteModalOpen(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => void handleCreateRoute()}
                disabled={savingRoute}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingRoute ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg animate-scaleIn rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">{editingDetailId ? "แก้ไขตำบล" : "เพิ่มตำบล"}</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {selectedRoute?.route_code || "-"} {selectedRoute?.route_name || ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                title="ปิด"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-5 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">ตำบล / อำเภอ / จังหวัด</label>
                <AddressSearchDropdown
                  value={addressSearch}
                  placeholder="ค้นหาตำบล / อำเภอ / จังหวัด"
                  onChange={(value) => {
                    setAddressSearch(value);
                    setSelectedSubdistrictId(null);
                  }}
                  onSelect={(address) => {
                    setAddressSearch(`${address.subdistrict_name} • ${address.district_name} • ${address.province_name} • ${address.zip_code}`);
                    setSelectedSubdistrictId(address.subdistrict_id);
                  }}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">วันที่รถเข้า</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {weekDays.map((day) => (
                    <label
                      key={day.value}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(day.value)}
                        onChange={() => toggleDay(day.value)}
                        className="h-4 w-4 accent-blue-600"
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {detailFormError && <div className="px-5 pb-3 text-sm text-red-500">{detailFormError}</div>}
            <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => void handleCreateDetail()}
                disabled={savingDetail}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingDetail ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
