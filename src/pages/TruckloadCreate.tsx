import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { FolderOpen, PackageCheck, Plus, Printer, RefreshCw, Truck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import DataGrid from "../components/DataGrid";
import DatePicker from "../components/form/DatePicker";
import AxiosInstance from "../utils/AxiosInstance";

type TruckType = "MAIN" | "EXTRA";

type Option = {
  id: number | string;
  code?: string | null;
  name: string;
};

type DriverUser = {
  id?: number;
  user_id?: number;
  employee_code: string | null;
  first_name: string | null;
  last_name: string | null;
};

type Vehicle = {
  id?: number;
  vehicle_id?: number;
  license_plate: string;
  license_province: string | null;
  model: string | null;
};

type TruckLoadRow = {
  truck_load_id: number;
  truck_code: string;
  create_date: string | null;

  customer_id: number | null;
  user_truck_id: number | null;
  status: string | null;

  warehouse_id: number | null;
  to_warehouse_id: number | null;

  job_id: number | null;

  is_close: string | null;
  is_go: string | null;
  is_completed: string | null;
  is_arrived: string | null;

  close_datetime: string | null;
  go_datetime: string | null;
  arrived_datetime: string | null;

  close_by: number | null;
  go_by: number | null;
  arrived_by: number | null;

  shipper_id: number | null;
  recipient_id: number | null;
  recipient_detail_id?: number | null;

  note: string | null;
  sub_warehouse: string | null;

  warehouse_name?: string | null;
  to_warehouse_name?: string | null;

  driver_name?: string | null;
  employee_code?: string | null;

  vehicle_id?: number | null;
  license_plate?: string | null;
  license_province?: string | null;
  model?: string | null;
};



type TruckLoadResponse = {
  success?: boolean;
  message?: string;
  data: TruckLoadRow[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

type DriverUsersResponse = {
  success?: boolean;
  message?: string;
  data: DriverUser[];
};

type VehiclesResponse = {
  success?: boolean;
  message?: string;
  data: Vehicle[];
};

type CreateTruckLoadResponse = {
  success?: boolean;
  message?: string;
  data?: TruckLoadRow;
};

type AxiosLikeError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

type GridCellParams<T> = {
  value?: string | number | null;
  row: T;
};

type ColumnDef<T> = {
  field: string;
  headerName: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  align?: "left" | "right" | "center";
  headerAlign?: "left" | "right" | "center";
  renderCell?: (params: GridCellParams<T>) => ReactNode;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const axiosError = error as AxiosLikeError;

    return axiosError.response?.data?.message || axiosError.message || fallback;
  }

  return fallback;
};

const getOptionLabel = (option: Option) => {
  return option.code ? `${option.code} - ${option.name}` : option.name;
};

const getDriverLabel = (driver: DriverUser) => {
  const fullName = [driver.first_name, driver.last_name].filter(Boolean).join(" ").trim();
  const userCode = driver.employee_code || driver.id || driver.user_id || "User";

  return fullName ? `${userCode} - ${fullName}` : String(userCode);
};

const getVehicleLabel = (vehicle: Vehicle) => {
  const detail = [vehicle.license_province, vehicle.model].filter(Boolean).join(" - ");

  return detail ? `${vehicle.license_plate} - ${detail}` : vehicle.license_plate;
};

const formatNumber = (value: number | null | undefined) => {
  return Number(value || 0).toLocaleString("th-TH");
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function TruckLoadCreate() {
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState<Option[]>([]);

  const [drivers, setDrivers] = useState<DriverUser[]>([]);

  const [dummyUsers, setDummyUsers] = useState<DriverUser[]>([]);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [rows, setRows] = useState<TruckLoadRow[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [truckType, setTruckType] = useState<TruckType>("MAIN");

  const [selectedDriver, setSelectedDriver] = useState("");

  const [selectedDummyUser, setSelectedDummyUser] = useState("");

  const [selectedVehicle, setSelectedVehicle] = useState("");

  const [selectedToWarehouse, setSelectedToWarehouse] = useState("");

  const [extraDriverFirstName, setExtraDriverFirstName] = useState("");

  const [extraDriverLastName, setExtraDriverLastName] = useState("");

  const [extraLicensePlate, setExtraLicensePlate] = useState("");

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [isClose, setIsClose] = useState("");
  const [isGo, setIsGo] = useState("");
  const [isCompleted, setIsCompleted] = useState("");

  const [total, setTotal] = useState(0);

  const [loadingOptions, setLoadingOptions] = useState(false);

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [info, setInfo] = useState<string | null>(null);

  const resetCreateForm = () => {
    setTruckType("MAIN");

    setSelectedDriver("");
    setSelectedDummyUser("");
    setSelectedVehicle("");
    setSelectedToWarehouse("");

    setExtraDriverFirstName("");
    setExtraDriverLastName("");
    setExtraLicensePlate("");
  };

  const fetchOptions = useCallback(async () => {
    try {
      setLoadingOptions(true);
      setError(null);

      const [warehouseResponse, driverResponse, dummyUserResponse, vehicleResponse] = await Promise.all([
        AxiosInstance.get<Option[]>("/warehouses"),

        AxiosInstance.get<DriverUsersResponse>("/truck-loads/drivers"),

        AxiosInstance.get<DriverUsersResponse>("/truck-loads/dummy-users"),

        AxiosInstance.get<VehiclesResponse>("/vehicles"),
      ]);

      setWarehouses(Array.isArray(warehouseResponse.data) ? warehouseResponse.data : []);

      setDrivers(Array.isArray(driverResponse.data?.data) ? driverResponse.data.data : []);

      setDummyUsers(Array.isArray(dummyUserResponse.data?.data) ? dummyUserResponse.data.data : []);

      setVehicles(Array.isArray(vehicleResponse.data?.data) ? vehicleResponse.data.data : []);
    } catch (err) {
      console.error("fetch truck load options error:", err);

      setWarehouses([]);
      setDrivers([]);
      setDummyUsers([]);
      setVehicles([]);

      setError(getErrorMessage(err, "ไม่สามารถโหลดข้อมูลคนขับ รถ และคลังปลายทางได้"));
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  const fetchTruckLoads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await AxiosInstance.get<TruckLoadResponse>("/truck-loads/get-truck", {
        params: {
          truck_code: search || undefined,

          create_date_from: dateFrom || undefined,

          create_date_to: dateTo || undefined,

          is_close: isClose || undefined,

          is_go: isGo || undefined,

          is_completed: isCompleted || undefined,

          page: 1,
          limit: 100,
        },
      });

      setRows(Array.isArray(response.data?.data) ? response.data.data : []);

      setTotal(Number(response.data?.pagination?.total || response.data?.data?.length || 0));
    } catch (err) {
      console.error("fetch truck loads error:", err);

      setRows([]);
      setTotal(0);

      setError(getErrorMessage(err, "ไม่สามารถโหลดรายการใบปิดบรรทุกได้"));
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, isClose, isCompleted, isGo, search]);

  useEffect(() => {
    void fetchTruckLoads();
  }, [fetchTruckLoads]);

  const openCreateModal = () => {
    setError(null);
    setInfo(null);

    resetCreateForm();

    setIsCreateModalOpen(true);

    void fetchOptions();
  };

  const closeCreateModal = () => {
    if (creating) return;

    setIsCreateModalOpen(false);

    resetCreateForm();
  };

  const handleTruckTypeChange = (value: TruckType) => {
    setTruckType(value);
    setError(null);

    setSelectedDriver("");
    setSelectedDummyUser("");
    setSelectedVehicle("");

    setExtraDriverFirstName("");
    setExtraDriverLastName("");
    setExtraLicensePlate("");
  };

  const handleSearch = () => {
    setInfo(null);

    void fetchTruckLoads();
  };

  const handleReset = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setIsClose("");
    setIsGo("");
    setIsCompleted("");
    setInfo(null);
    setError(null);
  };

  const handleCreate = async () => {
    if (!selectedToWarehouse) {
      setError("กรุณาเลือก To Warehouse");
      return;
    }

    if (truckType === "MAIN") {
      if (!selectedDriver) {
        setError("กรุณาเลือกพนักงานขับรถ");
        return;
      }

      if (!selectedVehicle) {
        setError("กรุณาเลือกทะเบียนรถ");
        return;
      }
    }

    if (truckType === "EXTRA") {
      if (!selectedDummyUser) {
        setError("กรุณาเลือก User Dummy");
        return;
      }

      if (!extraDriverFirstName.trim()) {
        setError("กรุณากรอกชื่อคนขับรถ");
        return;
      }

      if (!extraDriverLastName.trim()) {
        setError("กรุณากรอกนามสกุลคนขับรถ");
        return;
      }

      if (!extraLicensePlate.trim()) {
        setError("กรุณากรอกทะเบียนรถ");
        return;
      }
    }

    const selectedDriverData =
      truckType === "MAIN"
        ? drivers.find((driver) => String(driver.id ?? driver.user_id ?? "") === selectedDriver)
        : undefined;

    const selectedVehicleData = truckType === "MAIN" ? vehicles.find((vehicle) => vehicle.license_plate === selectedVehicle) : undefined;

    const selectedDummyUserData =
      truckType === "EXTRA"
        ? dummyUsers.find((user) => String(user.id ?? user.user_id ?? "") === selectedDummyUser)
        : undefined;

    if (truckType === "MAIN" && !selectedDriverData) {
      setError("ไม่พบข้อมูลพนักงานขับรถที่เลือก");
      return;
    }

    if (truckType === "MAIN" && !selectedVehicleData) {
      setError("ไม่พบข้อมูลรถที่เลือก");
      return;
    }

    const userTruckId =
      truckType === "MAIN"
        ? (selectedDriverData?.id ?? selectedDriverData?.user_id ?? null)
        : (selectedDummyUserData?.id ?? selectedDummyUserData?.user_id ?? null);

    if (userTruckId === null) {
      setError(truckType === "EXTRA" ? "ข้อมูล User Dummy ไม่มี user id" : "ข้อมูลพนักงานขับรถไม่มี user id");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      setInfo(null);

      const response = await AxiosInstance.post<CreateTruckLoadResponse>("/truck-loads/create-truck", {
        truck_type: truckType,

        user_truck_id: userTruckId,

        employee_code: truckType === "MAIN" ? selectedDriverData?.employee_code : null,

        driver_first_name: truckType === "EXTRA" ? extraDriverFirstName.trim() : selectedDriverData?.first_name || null,

        driver_last_name: truckType === "EXTRA" ? extraDriverLastName.trim() : selectedDriverData?.last_name || null,

        vehicle_id: truckType === "MAIN" ? (selectedVehicleData?.id ?? selectedVehicleData?.vehicle_id ?? null) : null,

        license_plate: truckType === "MAIN" ? selectedVehicleData?.license_plate : extraLicensePlate.trim(),

        to_warehouse_id: Number(selectedToWarehouse),
      });

      setInfo(response.data?.message || "สร้างใบปิดบรรทุกสำเร็จ");

      setIsCreateModalOpen(false);

      resetCreateForm();

      const createdTruckLoadId = response.data?.data?.truck_load_id;

      if (createdTruckLoadId) {
        navigate(`/truck-scan/${createdTruckLoadId}`);
        return;
      }

      await fetchTruckLoads();
    } catch (err) {
      console.error("create truck load error:", err);

      setError(getErrorMessage(err, "ไม่สามารถสร้างใบปิดบรรทุกได้"));
    } finally {
      setCreating(false);
    }
  };

  const handleCloseTruckLoad = useCallback(
    async (row: TruckLoadRow) => {
      if (row.is_close === "Y") return;

      try {
        setActionLoadingId(row.truck_load_id);
        setError(null);
        setInfo(null);

        const response = await AxiosInstance.patch(`/truck-loads/${row.truck_load_id}/close`);
        setInfo(response.data?.message || "ปิดบรรทุกสำเร็จ");
        await fetchTruckLoads();
      } catch (err) {
        console.error("close truck load error:", err);
        setError(getErrorMessage(err, "ไม่สามารถปิดบรรทุกได้"));
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchTruckLoads],
  );

  const handleGoTruckLoad = useCallback(
    async (row: TruckLoadRow) => {
      if (row.is_close !== "Y" || row.is_go === "Y") return;

      try {
        setActionLoadingId(row.truck_load_id);
        setError(null);
        setInfo(null);

        const response = await AxiosInstance.post(`/truck-loads/${row.truck_load_id}/go`);
        setInfo(response.data?.message || "ปล่อยรถสำเร็จ");
        await fetchTruckLoads();
      } catch (err) {
        console.error("go truck load error:", err);
        setError(getErrorMessage(err, "ไม่สามารถปล่อยรถได้"));
      } finally {
        setActionLoadingId(null);
      }
    },
    [fetchTruckLoads],
  );

  const columns = useMemo<ColumnDef<TruckLoadRow>[]>(
    () => [
      {
        field: "create_date",
        headerName: "วันที่",
        width: 155,
        minWidth: 145,
        renderCell: (params) => <div className="flex h-full w-full items-center text-slate-700">{formatDateTime(params.row.create_date)}</div>,
      },
      {
        field: "truck_code",
        headerName: "เลขที่ใบปิดบรรทุก",
        width: 190,
        minWidth: 175,
        renderCell: (params) => <div className="flex h-full w-full items-center font-semibold text-blue-700">{params.row.truck_code || "-"}</div>,
      },
      {
        field: "warehouse_name",
        headerName: "รับที่",
        width: 165,
        minWidth: 150,
        renderCell: (params) => (
          <div className="flex h-full w-full items-center text-slate-700">
            {params.row.warehouse_name || (params.row.warehouse_id ? `Warehouse ${params.row.warehouse_id}` : "-")}
          </div>
        ),
      },
      {
        field: "to_warehouse_name",
        headerName: "ส่งที่",
        width: 165,
        minWidth: 150,
        renderCell: (params) => (
          <div className="flex h-full w-full items-center text-slate-700">
            {params.row.to_warehouse_name || (params.row.to_warehouse_id ? `Warehouse ${params.row.to_warehouse_id}` : "-")}
          </div>
        ),
      },
      {
        field: "driver_vehicle",
        headerName: "คนขับ / ทะเบียนรถ",
        width: 220,
        minWidth: 200,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <div className="flex h-full w-full flex-col justify-center leading-5">
            <span className="truncate font-medium text-slate-800">
              {params.row.driver_name || params.row.employee_code || params.row.user_truck_id || "-"}
            </span>

            <span className="truncate text-xs text-slate-500">{params.row.license_plate || "-"}</span>
          </div>
        ),
      },
      {
        field: "actions",
        headerName: "จัดการ",
        width: 155,
        minWidth: 150,
        sortable: false,
        filterable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <div className="flex h-full w-full items-center justify-center gap-1.5">
            <button
              type="button"
              title="เข้าสู่ใบปิดบรรทุก"
              onClick={() => navigate(`/truck-scan/${params.row.truck_load_id}`)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600 transition hover:bg-amber-100"
            >
              <FolderOpen size={16} />
            </button>

            <button
              type="button"
              title={params.row.is_close === "Y" ? "ปิดบรรทุกแล้ว" : "ปิดบรรทุก"}
              onClick={() => void handleCloseTruckLoad(params.row)}
              disabled={actionLoadingId === params.row.truck_load_id || params.row.is_close === "Y"}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <PackageCheck size={16} />
            </button>

            <button
              type="button"
              title={params.row.is_go === "Y" ? "ปล่อยรถแล้ว" : params.row.is_close !== "Y" ? "ต้องปิดบรรทุกก่อน" : "ปล่อยรถ"}
              onClick={() => void handleGoTruckLoad(params.row)}
              disabled={actionLoadingId === params.row.truck_load_id || params.row.is_close !== "Y" || params.row.is_go === "Y"}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <Truck size={16} />
            </button>

            <button
              type="button"
              title="ปริ๊น"
              onClick={() => navigate(`/truck-print/${params.row.truck_load_id}`)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
            >
              <Printer size={16} />
            </button>
          </div>
        ),
      },
    ],
    [actionLoadingId, handleCloseTruckLoad, handleGoTruckLoad, navigate],
  );

  const isCreateDisabled =
    loadingOptions ||
    creating ||
    !selectedToWarehouse ||
    (truckType === "MAIN" && (!selectedDriver || !selectedVehicle)) ||
    (truckType === "EXTRA" && (!selectedDummyUser || !extraDriverFirstName.trim() || !extraDriverLastName.trim() || !extraLicensePlate.trim()));

  return (
    <div className="flex h-[calc(100vh-61px)] w-full flex-col overflow-hidden bg-slate-50 px-1 py-2 text-slate-800">
      <section className="mb-3 shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-800">ใบปิดบรรทุก</h1>

            <p className="mt-0.5 text-xs text-slate-500">สร้างใบปิดบรรทุกใหม่และตรวจสอบรายการที่ผ่านมา</p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-auto"
          >
            <Plus size={17} />
            สร้างใบปิดบรรทุก
          </button>
        </div>
      </section>

      <section className="mb-3 shrink-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[1.3fr_1fr_1fr_.8fr_.8fr_.8fr_auto]">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">ค้นหา Truck Code</label>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="กรอกเลขที่ใบปิดบรรทุก"
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

          <StatusSelect label="ปิดบรรทุก" value={isClose} onChange={setIsClose} />

          <StatusSelect label="ปล่อยรถ" value={isGo} onChange={setIsGo} />

          <StatusSelect label="ส่งสำเร็จ" value={isCompleted} onChange={setIsCompleted} />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="h-9 rounded-md bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              ค้นหา
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              ล้าง
            </button>
          </div>
        </div>
      </section>

      {error && <div className="mb-3 shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {info && <div className="mb-3 shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</div>}

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-2.5">
          <div>
            <h2 className="text-sm font-bold text-slate-800">รายการใบปิดบรรทุก</h2>

            <p className="text-xs text-slate-500">ทั้งหมด {formatNumber(total)} รายการ</p>
          </div>

          <button
            type="button"
            onClick={() => void fetchTruckLoads()}
            disabled={loading}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            รีเฟรช
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            getRowId={(row: TruckLoadRow) => row.truck_load_id}
            height="100%"
            pageSize={100}
          />
        </div>
      </section>

      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateModal();
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">สร้างใบปิดบรรทุก</h2>

                <p className="mt-0.5 text-xs text-slate-500">ระบุประเภทรถ คนขับ ทะเบียนรถ และคลังปลายทาง</p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={creating}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5">
              <ModalSelect label="ประเภทรถ" value={truckType} onChange={(value) => handleTruckTypeChange(value as TruckType)} disabled={creating}>
                <option value="MAIN">รถหลัก</option>

                <option value="EXTRA">รถเสริม</option>
              </ModalSelect>

              {truckType === "MAIN" ? (
                <>
                  <ModalSelect label="พนักงานขับรถ" value={selectedDriver} onChange={setSelectedDriver} disabled={loadingOptions || creating}>
                    <option value="">เลือกพนักงานขับรถ</option>

                    {drivers.map((driver) => (
                      <option
                        key={driver.id ?? driver.user_id ?? driver.employee_code}
                        value={String(driver.id ?? driver.user_id ?? "")}
                      >
                        {getDriverLabel(driver)}
                      </option>
                    ))}
                  </ModalSelect>

                  <ModalSelect label="ทะเบียนรถ" value={selectedVehicle} onChange={setSelectedVehicle} disabled={loadingOptions || creating}>
                    <option value="">เลือกทะเบียนรถ</option>

                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id ?? vehicle.vehicle_id ?? vehicle.license_plate} value={vehicle.license_plate}>
                        {getVehicleLabel(vehicle)}
                      </option>
                    ))}
                  </ModalSelect>
                </>
              ) : (
                <>
                  <ModalSelect label="User Dummy" value={selectedDummyUser} onChange={setSelectedDummyUser} disabled={loadingOptions || creating}>
                    <option value="">เลือก User Dummy</option>

                    {dummyUsers.map((user) => (
                      <option key={user.id ?? user.user_id ?? user.employee_code} value={String(user.id ?? user.user_id ?? "")}>
                        {getDriverLabel(user)}
                      </option>
                    ))}
                  </ModalSelect>

                  <ModalInput
                    label="ชื่อคนขับรถ"
                    value={extraDriverFirstName}
                    onChange={setExtraDriverFirstName}
                    placeholder="กรอกชื่อคนขับรถ"
                    disabled={creating}
                  />

                  <ModalInput
                    label="นามสกุลคนขับรถ"
                    value={extraDriverLastName}
                    onChange={setExtraDriverLastName}
                    placeholder="กรอกนามสกุลคนขับรถ"
                    disabled={creating}
                  />

                  <ModalInput
                    label="ทะเบียนรถ"
                    value={extraLicensePlate}
                    onChange={setExtraLicensePlate}
                    placeholder="กรอกทะเบียนรถ"
                    disabled={creating}
                  />
                </>
              )}

              <ModalSelect label="To Warehouse" value={selectedToWarehouse} onChange={setSelectedToWarehouse} disabled={loadingOptions || creating}>
                <option value="">เลือก To Warehouse</option>

                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={String(warehouse.id)}>
                    {getOptionLabel(warehouse)}
                  </option>
                ))}
              </ModalSelect>

              {loadingOptions && (
                <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  กำลังโหลดข้อมูลคนขับ รถ และคลังปลายทาง...
                </div>
              )}

              {!loadingOptions && truckType === "MAIN" && drivers.length === 0 && <p className="text-xs text-red-600">ไม่พบข้อมูลพนักงานขับรถ</p>}

              {!loadingOptions && truckType === "MAIN" && vehicles.length === 0 && <p className="text-xs text-red-600">ไม่พบข้อมูลทะเบียนรถ</p>}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={creating}
                className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={isCreateDisabled}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Plus size={16} />

                {creating ? "กำลังสร้าง..." : "สร้างใบปิดบรรทุก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type StatusSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function StatusSelect({ label, value, onChange }: StatusSelectProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">ทั้งหมด</option>
        <option value="Y">ใช่</option>
        <option value="N">ไม่ใช่</option>
      </select>
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

type ModalInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

function ModalInput({ label, value, onChange, placeholder = "", disabled = false }: ModalInputProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
      />
    </div>
  );
}
