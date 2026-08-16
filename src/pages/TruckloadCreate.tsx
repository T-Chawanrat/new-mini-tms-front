import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { FolderOpen, PackageCheck, Plus, Printer, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import DataGrid from "../components/DataGrid";
import DatePicker from "../components/form/DatePicker";
import AxiosInstance from "../utils/AxiosInstance";
import { formatCodeNameOption, formatThaiDateTime, formatThaiNumber } from "../utils/textSanitizer";

type TruckType = "MAIN" | "EXTRA";

const truckTypeLabels: Record<string, string> = {
  SHIPPER_TRUCK: "รับสินค้าปลายทาง",
  DC_TRUCK: "คลัง ไปหา ลูกค้า",
  DC_TRUCK_DC: "ขนสินค้า ระหว่าง DC",
};

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
  license_plate_province: string | null;
  model: string | null;
};

type ContractorVehicle = {
  vehicle_contractor_id: number;
  user_truck_id: number;
  employee_code: string | null;
  first_name: string | null;
  last_name: string | null;
  tel: string | null;
  license_plate: string;
  license_plate_province_id: number;
  license_plate_province: string | null;
  model: string | null;
};

type TruckLoadRow = {
  truck_load_id: number;
  truck_code: string;
  create_date: string | null;

  user_truck_id: number | null;
  driver_type?: "EMPLOYEE" | "CONTRACTOR" | null;
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

  note: string | null;
  sub_warehouse: string | null;

  warehouse_name?: string | null;
  to_warehouse_name?: string | null;

  driver_name?: string | null;
  employee_code?: string | null;
  tel?: string | null;

  vehicle_id?: number | null;
  license_plate?: string | null;
  license_plate_province_id?: number | null;
  license_province?: string | null;
  model?: string | null;
  serial_count?: number | string | null;
  count_box?: number | string | null;
};

type ConfirmAction = {
  row: TruckLoadRow;
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

type ContractorVehiclesResponse = {
  success?: boolean;
  message?: string;
  data: ContractorVehicle[];
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

const getDriverLabel = (driver: DriverUser) => {
  const fullName = [driver.first_name, driver.last_name].filter(Boolean).join(" ").trim();
  const userCode = driver.employee_code || driver.id || driver.user_id || "User";

  return fullName ? `${userCode} - ${fullName}` : String(userCode);
};

const getVehicleLabel = (vehicle: Vehicle) => {
  const detail = [vehicle.license_plate_province, vehicle.model].filter(Boolean).join(" - ");

  return detail ? `${vehicle.license_plate} - ${detail}` : vehicle.license_plate;
};

const getContractorLabel = (contractor: ContractorVehicle) => {
  const driverName = [contractor.first_name, contractor.last_name].filter(Boolean).join(" ").trim();
  const vehicle = [contractor.license_plate, contractor.license_plate_province].filter(Boolean).join(" - ");

  return `${contractor.employee_code || contractor.user_truck_id} - ${driverName || "ไม่ระบุชื่อ"} | ${vehicle}`;
};

export default function TruckLoadCreate() {
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState<Option[]>([]);

  const [drivers, setDrivers] = useState<DriverUser[]>([]);

  const [contractors, setContractors] = useState<ContractorVehicle[]>([]);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [rows, setRows] = useState<TruckLoadRow[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [truckType, setTruckType] = useState<TruckType>("MAIN");

  const [selectedDriver, setSelectedDriver] = useState("");

  const [selectedContractor, setSelectedContractor] = useState("");

  const [selectedVehicle, setSelectedVehicle] = useState("");

  const [selectedToWarehouse, setSelectedToWarehouse] = useState("");

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [isClose, setIsClose] = useState("");
  const [isGo, setIsGo] = useState("");
  const [isCompleted, setIsCompleted] = useState("");


  const [loadingOptions, setLoadingOptions] = useState(false);

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [info, setInfo] = useState<string | null>(null);

  const resetCreateForm = () => {
    setTruckType("MAIN");

    setSelectedDriver("");
    setSelectedContractor("");
    setSelectedVehicle("");
    setSelectedToWarehouse("");

  };

  const fetchOptions = useCallback(async () => {
    try {
      setLoadingOptions(true);
      setError(null);

      const [warehouseResponse, driverResponse, contractorResponse, vehicleResponse] = await Promise.all([
        AxiosInstance.get<Option[]>("/warehouses"),

        AxiosInstance.get<DriverUsersResponse>("/truck-loads/drivers"),

        AxiosInstance.get<ContractorVehiclesResponse>("/contractors/available"),

        AxiosInstance.get<VehiclesResponse>("/vehicles"),

      ]);

      setWarehouses(Array.isArray(warehouseResponse.data) ? warehouseResponse.data : []);

      setDrivers(Array.isArray(driverResponse.data?.data) ? driverResponse.data.data : []);

      setContractors(Array.isArray(contractorResponse.data?.data) ? contractorResponse.data.data : []);

      setVehicles(Array.isArray(vehicleResponse.data?.data) ? vehicleResponse.data.data : []);

    } catch (err) {
      console.error("fetch truck load options error:", err);

      setWarehouses([]);
      setDrivers([]);
      setContractors([]);
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

    } catch (err) {
      console.error("fetch truck loads error:", err);

      setRows([]);

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
    setSelectedContractor("");
    setSelectedVehicle("");

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
      if (!selectedContractor) {
        setError("กรุณาเลือกคนขับและรถเสริม");
        return;
      }
    }

    const selectedDriverData =
      truckType === "MAIN" ? drivers.find((driver) => String(driver.id ?? driver.user_id ?? "") === selectedDriver) : undefined;

    const selectedVehicleData = truckType === "MAIN" ? vehicles.find((vehicle) => vehicle.license_plate === selectedVehicle) : undefined;

    const selectedContractorData =
      truckType === "EXTRA"
        ? contractors.find((contractor) => String(contractor.vehicle_contractor_id) === selectedContractor)
        : undefined;

    if (truckType === "MAIN" && !selectedDriverData) {
      setError("ไม่พบข้อมูลพนักงานขับรถที่เลือก");
      return;
    }

    if (truckType === "MAIN" && !selectedVehicleData) {
      setError("ไม่พบข้อมูลรถที่เลือก");
      return;
    }

    if (truckType === "EXTRA" && !selectedContractorData) {
      setError("ไม่พบข้อมูลคนขับและรถเสริมที่เลือก");
      return;
    }

    const userTruckId =
      truckType === "MAIN"
        ? (selectedDriverData?.id ?? selectedDriverData?.user_id ?? null)
        : (selectedContractorData?.user_truck_id ?? null);

    if (userTruckId === null) {
      setError("ข้อมูลคนขับไม่มี user id");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      setInfo(null);

      const response = await AxiosInstance.post<CreateTruckLoadResponse>("/truck-loads/create-truck", {
        truck_type: truckType,

        user_truck_id: userTruckId,

        vehicle_id: truckType === "MAIN" ? (selectedVehicleData?.id ?? selectedVehicleData?.vehicle_id ?? null) : null,

        vehicle_contractor_id: truckType === "EXTRA" ? selectedContractorData?.vehicle_contractor_id : null,

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

  const handleCloseAndGoTruckLoad = useCallback(
    async (row: TruckLoadRow) => {
      if (row.is_close === "Y" && row.is_go === "Y") return;

      try {
        setActionLoadingId(row.truck_load_id);
        setError(null);
        setInfo(null);

        const response = await AxiosInstance.patch(`/truck-loads/${row.truck_load_id}/close-and-go`);
        setInfo(response.data?.message || "ปิดบรรทุกและปล่อยรถสำเร็จ");
        await fetchTruckLoads();
      } catch (err) {
        console.error("close and go truck load error:", err);
        setError(getErrorMessage(err, "ไม่สามารถปิดบรรทุกและปล่อยรถได้"));
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
        renderCell: (params) => <div className="flex h-full w-full items-center text-slate-700">{formatThaiDateTime(params.row.create_date)}</div>,
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
        field: "status",
        headerName: "Status",
        width: 145,
        minWidth: 130,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <div className="flex h-full w-full items-center justify-center">
            <span className="inline-flex h-7 items-center justify-center rounded-full border border-slate-300 bg-white px-2.5 text-center text-xs font-semibold leading-none text-slate-700">
              {truckTypeLabels[params.row.status || ""] || params.row.status || "-"}
            </span>
          </div>
        ),
      },
      {
        field: "driver_type",
        headerName: "ประเภทรถ",
        width: 105,
        minWidth: 95,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <div className="flex h-full w-full items-center justify-center text-slate-700">
            {params.row.driver_type === "CONTRACTOR" ? "รถเสริม" : params.row.driver_type === "EMPLOYEE" ? "รถปกติ" : "-"}
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

            <span className="truncate text-xs text-slate-500">
              {[params.row.license_plate, params.row.license_province].filter(Boolean).join(" - ") || "-"}
            </span>
          </div>
        ),
      },
      {
        field: "tel",
        headerName: "เบอร์โทรคนขับ",
        width: 135,
        minWidth: 125,
        renderCell: (params) => <div className="flex h-full w-full items-center text-slate-700">{params.row.tel || "-"}</div>,
      },
      {
        field: "count_box",
        headerName: "จำนวนกล่อง",
        width: 105,
        minWidth: 95,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <div className="flex h-full w-full items-center justify-center font-semibold text-slate-700">{formatThaiNumber(params.row.count_box)}</div>
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
              title={
                Number(params.row.serial_count || 0) <= 0
                  ? "ยังไม่มี Serial No"
                  : params.row.is_close === "Y" && params.row.is_go === "Y"
                    ? "ปิดบรรทุกและปล่อยรถแล้ว"
                    : "ปิดบรรทุกและปล่อยรถ"
              }
              onClick={() => setConfirmAction({ row: params.row })}
              disabled={
                actionLoadingId === params.row.truck_load_id ||
                (params.row.is_close === "Y" && params.row.is_go === "Y") ||
                Number(params.row.serial_count || 0) <= 0
              }
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <PackageCheck size={16} />
            </button>

            <button
              type="button"
              title="ปริ๊น"
              onClick={() => navigate(`/truck-print/${params.row.truck_load_id}`)}
              disabled={params.row.is_close !== "Y" || Number(params.row.serial_count || 0) <= 0}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              <Printer size={16} />
            </button>
          </div>
        ),
      },
    ],
    [actionLoadingId, handleCloseAndGoTruckLoad, navigate],
  );

  const isCreateDisabled =
    loadingOptions ||
    creating ||
    !selectedToWarehouse ||
    (truckType === "MAIN" && (!selectedDriver || !selectedVehicle)) ||
    (truckType === "EXTRA" && !selectedContractor);

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

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="min-h-0 flex-1 overflow-hidden">
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            framed={false}
            getRowId={(row: TruckLoadRow) => row.truck_load_id}
            height="100%"
            pageSize={100}
            getRowClassName={(params: { row: TruckLoadRow }) =>
              Number(params.row.serial_count || 0) <= 0 ? "truck-empty-row" : "truck-active-row"
            }
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
                      <option key={driver.id ?? driver.user_id ?? driver.employee_code} value={String(driver.id ?? driver.user_id ?? "")}>
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
                <ModalSelect
                  label="คนขับ / รถเสริม"
                  value={selectedContractor}
                  onChange={setSelectedContractor}
                  disabled={loadingOptions || creating}
                >
                  <option value="">เลือกคนขับและรถเสริม</option>

                  {contractors.map((contractor) => (
                    <option
                      key={contractor.vehicle_contractor_id}
                      value={String(contractor.vehicle_contractor_id)}
                    >
                      {getContractorLabel(contractor)}
                    </option>
                  ))}
                </ModalSelect>
              )}

              <ModalSelect label="To Warehouse" value={selectedToWarehouse} onChange={setSelectedToWarehouse} disabled={loadingOptions || creating}>
                <option value="">เลือก To Warehouse</option>

                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={String(warehouse.id)}>
                    {formatCodeNameOption(warehouse)}
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

              {!loadingOptions && truckType === "EXTRA" && contractors.length === 0 && (
                <p className="text-xs text-red-600">ไม่พบข้อมูลคนขับและรถเสริมที่พร้อมใช้งาน</p>
              )}
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

      {confirmAction && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800">ยืนยันปิดบรรทุกและปล่อยรถ</h3>
            <p className="mt-2 text-sm text-slate-600">
              {`ต้องการปิดบรรทุกและปล่อยรถของใบ ${confirmAction.row.truck_code} ใช่หรือไม่`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50"
              >
                ไม่
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = confirmAction;
                  setConfirmAction(null);
                  void handleCloseAndGoTruckLoad(action.row);
                }}
                className="h-9 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
              >
                ใช่
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

