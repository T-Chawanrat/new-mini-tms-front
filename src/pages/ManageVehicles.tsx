import { useEffect, useMemo, useState } from "react";
import AxiosInstance from "../utils/AxiosInstance";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Pencil } from "lucide-react";
import { cleanCodeInput, cleanNameInput, cleanNumberInput, removeSpaces } from "../utils/textSanitizer";
import DataGrid from "../components/DataGrid";
import RequiredLabel from "../components/form/RequiredLabel";

type MasterOption = {
  id: number;
  name: string;
};

export default function ManageVehicles() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [brands, setBrands] = useState<MasterOption[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<MasterOption[]>([]);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterOwnerType, setFilterOwnerType] = useState("");

  const [statusModal, setStatusModal] = useState(false);
  const [selected, setSelected] = useState<{
    id: number;
    current: string;
  } | null>(null);

  const [editing, setEditing] = useState<any | null>(null);

  const emptyForm = {
    license_plate: "",
    license_province: "",
    brand_id: "",
    model: "",
    color: "",
    vehicle_year: "",
    vehicle_type_id: "",
    fuel_type: "",
    capacity_kg: "",
    max_load_kg: "",
    warehouse_id: "",
    owner_type: "COMPANY",
    owner_name: "",
    purchase_date: "",
    fleet_card_no: "",
    chassis_no: "",
    engine_no: "",
  };

  const [form, setForm] = useState(emptyForm);

  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  const STATUS = [
    { value: "ACTIVE", label: "ใช้งาน" },
    { value: "MAINTENANCE", label: "ซ่อมบำรุง" },
    { value: "INACTIVE", label: "ปิดใช้งาน" },
  ];

  const OWNER_TYPES = [
    { value: "COMPANY", label: "รถบริษัท" },
    { value: "DRIVER", label: "รถคนขับ" },
  ];

  const FUEL_TYPES = [
    { value: "DIESEL", label: "ดีเซล" },
    { value: "BENZINE", label: "เบนซิน" },
    { value: "LPG", label: "LPG" },
    { value: "NGV", label: "NGV" },
  ];

  const getOwnerTypeLabel = (value: string) => {
    return OWNER_TYPES.find((x) => x.value === value)?.label || value;
  };

  const getStatusBadge = (status: string) => {
    if (status === "ACTIVE") {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600 font-medium hover:bg-green-200 cursor-pointer">Active</span>;
    }

    if (status === "MAINTENANCE") {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-600 font-medium hover:bg-yellow-200 cursor-pointer">
          Maintenance
        </span>
      );
    }

    return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-500 font-medium hover:bg-red-200 cursor-pointer">Inactive</span>;
  };

  const formatDateInput = (value: any) => {
    if (!value) return "";
    return String(value).slice(0, 10);
  };

  // =====================
  // FETCH
  // =====================
  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await AxiosInstance.get("/manage/vehicles", {
        params: {
          search: search || undefined,
          vehicle_type_id: filterType || undefined,
          status: filterStatus || undefined,
          owner_type: filterOwnerType || undefined,
        },
      });

      setRows(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    const res = await AxiosInstance.get("/warehouses");
    setWarehouses(res.data || []);
  };

  const fetchVehicleBrands = async () => {
    const res = await AxiosInstance.get("/vehicle-brands");
    setBrands(res.data || []);
  };

  const fetchVehicleTypes = async () => {
    const res = await AxiosInstance.get("/vehicle-types");
    setVehicleTypes(res.data || []);
  };

  useEffect(() => {
    fetchData();
    fetchWarehouses();
    fetchVehicleBrands();
    fetchVehicleTypes();
  }, []);

  const handleChange = (k: string, v: any) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  // =====================
  // MODAL CLOSE / RESET
  // =====================
  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setError("");
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);

    setForm({
      license_plate: row.license_plate || "",
      license_province: row.license_province || "",
      brand_id: row.brand_id ? String(row.brand_id) : "",
      model: row.model || "",
      color: row.color || "",
      vehicle_year: row.vehicle_year ? String(row.vehicle_year) : "",
      vehicle_type_id: row.vehicle_type_id ? String(row.vehicle_type_id) : "",
      fuel_type: row.fuel_type || "",
      capacity_kg: row.capacity_kg ? String(row.capacity_kg) : "",
      max_load_kg: row.max_load_kg ? String(row.max_load_kg) : "",
      warehouse_id: row.warehouse_id ? String(row.warehouse_id) : "",
      owner_type: row.owner_type || "COMPANY",
      owner_name: row.owner_name || "",
      purchase_date: formatDateInput(row.purchase_date),
      fleet_card_no: row.fleet_card_no || "",
      chassis_no: row.chassis_no || "",
      engine_no: row.engine_no || "",
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const closeStatusModal = () => {
    setStatusModal(false);
    setSelected(null);
  };

  const validateForm = () => {
    if (!form.license_plate) return "กรุณากรอกทะเบียนรถ";
    if (!form.license_province) return "กรุณากรอกจังหวัดทะเบียน";
    if (!form.brand_id) return "กรุณาเลือกยี่ห้อรถ";
    if (!form.vehicle_type_id) return "กรุณาเลือกประเภทรถ";
    if (!form.capacity_kg) return "กรุณากรอกน้ำหนักใช้งานจริง (kg)";
    if (!form.warehouse_id) return "กรุณาเลือก warehouse";
    if (!form.owner_type) return "กรุณาเลือกเจ้าของรถ";

    return "";
  };

  const buildPayload = () => {
    return {
      license_plate: form.license_plate,
      license_province: form.license_province,
      brand_id: form.brand_id,
      model: form.model || null,
      color: form.color || null,
      vehicle_year: form.vehicle_year || null,
      vehicle_type_id: form.vehicle_type_id,
      fuel_type: form.fuel_type || null,
      capacity_kg: form.capacity_kg,
      max_load_kg: form.max_load_kg || null,
      warehouse_id: form.warehouse_id,
      owner_type: form.owner_type,
      owner_name: form.owner_type === "DRIVER" ? form.owner_name || null : null,
      purchase_date: form.owner_type === "COMPANY" ? form.purchase_date || null : null,
      fleet_card_no: form.fleet_card_no || null,
      chassis_no: form.chassis_no || null,
      engine_no: form.engine_no || null,
    };
  };

  // =====================
  // CREATE / UPDATE
  // =====================
  const handleSave = async () => {
    try {
      setError("");

      const message = validateForm();
      if (message) return setError(message);

      const payload = buildPayload();

      if (editing) {
        await AxiosInstance.put(`/manage/vehicles/${editing.id}`, payload);
      } else {
        await AxiosInstance.post("/manage/vehicles", payload);
      }

      closeModal();
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  // =====================
  // STATUS
  // =====================
  const openStatusModal = (id: number, current: string) => {
    setSelected({ id, current });
    setStatusModal(true);
  };

  const changeStatus = async (status: string) => {
    if (!selected) return;

    try {
      await AxiosInstance.patch(`/manage/vehicles/${selected.id}/status`, {
        status,
      });

      closeStatusModal();
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "update status failed");
    }
  };

  const gridRows = useMemo(() => {
    return rows.map((r: any, i) => ({
      ...r,
      id: r.id,
      no: i + 1,
    }));
  }, [rows]);

  const vehicleColumns = useMemo(
    () => [
      {
        field: "no",
        headerName: "#",
        width: 70,
        minWidth: 60,
        sortable: false,
        filterable: false,
        resizable: false,
        align: "center" as const,
        headerAlign: "center" as const,
      },
      {
        field: "license_plate",
        headerName: "ทะเบียน",
        width: 130,
        minWidth: 105,
        renderCell: (params: any) => {
          const row = params.row;

          return (
            <div className="flex h-full w-full items-center">
              <div className="min-w-0 leading-tight truncate">
                <div title={row.license_plate || ""} className="font-medium truncate">
                  {row.license_plate || "-"}
                </div>

                {row.license_province && (
                  <div title={row.license_province || ""} className="text-xs text-slate-400 truncate">
                    {row.license_province || "-"}
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        field: "brand_name",
        headerName: "ยี่ห้อ",
        width: 190,
        minWidth: 160,
        renderCell: (params: any) => {
          const row = params.row;

          return (
            <div className="flex h-full w-full items-center">
              <div className="min-w-0 leading-tight truncate">
                <div title={row.brand_name || ""} className="font-medium truncate">
                  {row.brand_name || "-"}
                </div>

                {(row.model || row.color) && (
                  <div title={`${row.model || "-"}${row.color ? ` / ${row.color}` : ""}`} className="text-xs text-slate-400 truncate">
                    {row.model || "-"}
                    {row.color ? ` / ${row.color}` : ""}
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        field: "vehicle_year",
        headerName: "ปี",
        width: 100,
        minWidth: 80,
        renderCell: (params: any) => params.value || "-",
      },
      {
        field: "vehicle_type_name",
        headerName: "ประเภท",
        width: 160,
        minWidth: 130,
        renderCell: (params: any) => params.value || "-",
      },
      {
        field: "capacity_kg",
        headerName: "น้ำหนักใช้งาน",
        width: 130,
        minWidth: 100,
        renderCell: (params: any) => params.value || "-",
      },
      {
        field: "max_load_kg",
        headerName: "น้ำหนักสูงสุด",
        width: 130,
        minWidth: 100,
        renderCell: (params: any) => params.value || "-",
      },
      {
        field: "warehouse_name",
        headerName: "สังกัด",
        width: 170,
        minWidth: 140,
        renderCell: (params: any) => (
          <div title={params.value || ""} className="truncate">
            {params.value || "-"}
          </div>
        ),
      },
      {
        field: "owner_type",
        headerName: "เจ้าของรถ",
        width: 190,
        minWidth: 160,
        renderCell: (params: any) => {
          const row = params.row;
          const ownerType = String(row.owner_type || "")
            .trim()
            .toUpperCase();

          return (
            <div className="flex h-full w-full items-center">
              <div className="min-w-0 leading-tight truncate">
                <div className="truncate">{getOwnerTypeLabel(row.owner_type || "-")}</div>

                {ownerType === "COMPANY"
                  ? row.purchase_date && <div className="text-xs text-slate-400 truncate">{formatDateInput(row.purchase_date)}</div>
                  : row.owner_name && <div className="text-xs text-slate-400 truncate">{row.owner_name}</div>}
              </div>
            </div>
          );
        },
      },
      {
        field: "fleet_card_no",
        headerName: "หมายเลขบัตร fleet",
        width: 180,
        minWidth: 150,
        renderCell: (params: any) => (
          <div title={params.value || ""} className="truncate">
            {params.value || "-"}
          </div>
        ),
      },
      {
        field: "chassis_no",
        headerName: "หมายเลขตัวถัง",
        width: 180,
        minWidth: 150,
        renderCell: (params: any) => (
          <div title={params.value || ""} className="truncate">
            {params.value || "-"}
          </div>
        ),
      },
      {
        field: "engine_no",
        headerName: "หมายเลขเครื่องยนต์",
        width: 190,
        minWidth: 150,
        renderCell: (params: any) => (
          <div title={params.value || ""} className="truncate">
            {params.value || "-"}
          </div>
        ),
      },
      {
        field: "status",
        headerName: "สถานะ",
        width: 140,
        minWidth: 120,
        sortable: false,
        filterable: false,
        align: "center" as const,
        headerAlign: "center" as const,
        renderCell: (params: any) => (
          <button
            type="button"
            onClick={() => openStatusModal(params.row.id, params.row.status)}
            className="inline-block"
            title="คลิกเพื่อเปลี่ยนสถานะ"
          >
            {getStatusBadge(params.row.status)}
          </button>
        ),
      },
      {
        field: "actions",
        headerName: "จัดการ",
        width: 110,
        minWidth: 100,
        sortable: false,
        filterable: false,
        resizable: false,
        align: "center" as const,
        headerAlign: "center" as const,
        renderCell: (params: any) => (
          <div className="flex h-full w-full items-center justify-center">
            <button
              type="button"
              onClick={() => openEdit(params.row)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
            >
              <Pencil size={14} />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="w-full h-[calc(100vh-61px)] px-1 py-4 bg-slate-50 overflow-hidden flex flex-col">
      {/* HEADER */}
      <div className="flex justify-between items-center mt-[-15px] mb-2 shrink-0">
        <div>
          <h2 className="text-xl font-semibold mb-1 text-slate-800">Vehicle Management</h2>
          <p className="text-sm text-slate-500">จัดการรถในระบบ</p>
        </div>

        <button type="button" onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white shadow hover:bg-blue-700 transition">
          + เพิ่มรถ
        </button>
      </div>

      {/* FILTER */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-2 flex gap-3 flex-wrap shrink-0">
        <input
          placeholder="ค้นหา..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-modern w-[220px]"
          onKeyDown={(e) => {
            if (e.key === "Enter") fetchData();
          }}
        />

        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input-modern w-[180px]">
          <option value="">ประเภทรถ</option>
          {vehicleTypes.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>

        <select value={filterOwnerType} onChange={(e) => setFilterOwnerType(e.target.value)} className="input-modern w-[160px]">
          <option value="">เจ้าของรถ</option>
          {OWNER_TYPES.map((x) => (
            <option key={x.value} value={x.value}>
              {x.label}
            </option>
          ))}
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-modern w-[160px]">
          <option value="">สถานะ</option>
          {STATUS.map((x) => (
            <option key={x.value} value={x.value}>
              {x.label}
            </option>
          ))}
        </select>

        <button type="button" onClick={fetchData} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
          ค้นหา
        </button>
      </div>

      {/* DATAGRID */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <DataGrid rows={gridRows} columns={vehicleColumns} loading={loading} getRowId={(row: any) => row.id} height="100%" pageSize={100} />
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeModal}>
          <div
            className="bg-white p-6 rounded-2xl shadow-xl w-[820px] max-h-[90vh] overflow-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-5">{editing ? "แก้ไขรถ" : "เพิ่มรถ"}</h3>

            {error && <div className="mb-4 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

            <div className="space-y-5">
              <div>
                <div className="text-sm font-semibold text-slate-700 mb-3">ข้อมูลรถ</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <RequiredLabel required>ทะเบียนรถ</RequiredLabel>
                    <input
                      className="input-modern w-full"
                      placeholder="เช่น 1กก1234"
                      value={form.license_plate}
                      onChange={(e) => {
                        const value = removeSpaces(e.target.value).toUpperCase().replace(/-/g, "");

                        handleChange("license_plate", value);
                      }}
                    />
                  </div>

                  <div>
                    <RequiredLabel required>จังหวัดทะเบียน</RequiredLabel>
                    <input
                      className="input-modern w-full"
                      placeholder="เช่น กรุงเทพมหานคร"
                      value={form.license_province}
                      onChange={(e) => handleChange("license_province", e.target.value)}
                    />
                  </div>

                  <div>
                    <RequiredLabel required>ยี่ห้อรถ</RequiredLabel>
                    <select className="input-modern w-full" value={form.brand_id} onChange={(e) => handleChange("brand_id", e.target.value)}>
                      <option value="">เลือกยี่ห้อ</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <RequiredLabel>รุ่นรถ</RequiredLabel>
                    <input
                      className="input-modern w-full"
                      placeholder="เช่น D-Max / Revo"
                      value={form.model}
                      onChange={(e) => handleChange("model", e.target.value)}
                    />
                  </div>

                  <div>
                    <RequiredLabel>สีรถ</RequiredLabel>
                    <input
                      className="input-modern w-full"
                      placeholder="เช่น ขาว / ดำ / เทา"
                      value={form.color}
                      onChange={(e) => handleChange("color", e.target.value)}
                    />
                  </div>

                  <div>
                    <RequiredLabel>ปีรถ</RequiredLabel>
                    <input
                      className="input-modern w-full"
                      placeholder="เช่น 2024"
                      value={form.vehicle_year}
                      onChange={(e) => handleChange("vehicle_year", cleanNumberInput(e.target.value))}
                    />
                  </div>

                  <div>
                    <RequiredLabel required>ประเภทรถ</RequiredLabel>
                    <select
                      className="input-modern w-full"
                      value={form.vehicle_type_id}
                      onChange={(e) => handleChange("vehicle_type_id", e.target.value)}
                    >
                      <option value="">เลือกประเภทรถ</option>
                      {vehicleTypes.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <RequiredLabel>เชื้อเพลิง</RequiredLabel>
                    <select className="input-modern w-full" value={form.fuel_type} onChange={(e) => handleChange("fuel_type", e.target.value)}>
                      <option value="">เลือกเชื้อเพลิง</option>
                      {FUEL_TYPES.map((x) => (
                        <option key={x.value} value={x.value}>
                          {x.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-700 mb-3">น้ำหนัก / สังกัด</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <RequiredLabel required>น้ำหนักใช้งานจริง (kg)</RequiredLabel>
                    <input
                      className="input-modern w-full"
                      placeholder="เช่น 1000"
                      value={form.capacity_kg}
                      onChange={(e) => handleChange("capacity_kg", cleanNumberInput(e.target.value))}
                    />
                  </div>

                  <div>
                    <RequiredLabel>น้ำหนักสูงสุดตามเล่มรถ (kg)</RequiredLabel>
                    <input
                      className="input-modern w-full"
                      placeholder="เช่น 1500"
                      value={form.max_load_kg}
                      onChange={(e) => handleChange("max_load_kg", cleanNumberInput(e.target.value))}
                    />
                  </div>

                  <div>
                    <RequiredLabel required>Warehouse</RequiredLabel>
                    <select className="input-modern w-full" value={form.warehouse_id} onChange={(e) => handleChange("warehouse_id", e.target.value)}>
                      <option value="">เลือก warehouse</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <RequiredLabel required>เจ้าของรถ</RequiredLabel>
                    <select className="input-modern w-full" value={form.owner_type} onChange={(e) => handleChange("owner_type", e.target.value)}>
                      {OWNER_TYPES.map((x) => (
                        <option key={x.value} value={x.value}>
                          {x.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-700 mb-3">ข้อมูลเจ้าของ / เอกสารรถ</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {form.owner_type === "DRIVER" ? (
                    <div>
                      <RequiredLabel>ชื่อเจ้าของรถ / คนขับ</RequiredLabel>
                      <input
                        className="input-modern w-full"
                        placeholder="ชื่อเจ้าของรถ / คนขับ"
                        value={form.owner_name}
                        onChange={(e) => handleChange("owner_name", cleanNameInput(e.target.value))}
                      />
                    </div>
                  ) : (
                    <div>
                      <RequiredLabel>วันที่ซื้อรถ</RequiredLabel>
                      <DatePicker
                        selected={form.purchase_date ? new Date(form.purchase_date) : null}
                        onChange={(date: Date | null) => handleChange("purchase_date", date ? date.toISOString().split("T")[0] : "")}
                        className="input-modern w-full"
                        wrapperClassName="w-full"
                        placeholderText="วันที่ซื้อรถ"
                        dateFormat="yyyy-MM-dd"
                      />
                    </div>
                  )}

                  <div>
                    <RequiredLabel>Fleet Card</RequiredLabel>
                    <input
                      className="input-modern w-full"
                      placeholder="Fleet Card"
                      value={form.fleet_card_no}
                      onChange={(e) => handleChange("fleet_card_no", cleanCodeInput(e.target.value))}
                    />
                  </div>

                  <div>
                    <RequiredLabel>เลขตัวถัง</RequiredLabel>
                    <input
                      className="input-modern w-full"
                      placeholder="เลขตัวถัง"
                      value={form.chassis_no}
                      onChange={(e) => handleChange("chassis_no", cleanCodeInput(e.target.value))}
                    />
                  </div>

                  <div>
                    <RequiredLabel>เลขเครื่องยนต์</RequiredLabel>
                    <input
                      className="input-modern w-full"
                      placeholder="เลขเครื่องยนต์"
                      value={form.engine_no}
                      onChange={(e) => handleChange("engine_no", cleanCodeInput(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">
                ยกเลิก
              </button>

              <button type="button" onClick={handleSave} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow">
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS MODAL */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={closeStatusModal}>
          <div className="bg-white p-6 rounded-2xl shadow-xl w-[300px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4 text-slate-800">สถานะ</h3>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={selected?.current === "ACTIVE"}
                onClick={() => changeStatus("ACTIVE")}
                className={`px-4 py-2 rounded-lg ${
                  selected?.current === "ACTIVE" ? "bg-green-50 text-green-300 cursor-not-allowed" : "bg-green-100 text-green-600 hover:bg-green-200"
                }`}
              >
                Active
              </button>

              <button
                type="button"
                disabled={selected?.current === "MAINTENANCE"}
                onClick={() => changeStatus("MAINTENANCE")}
                className={`px-4 py-2 rounded-lg ${
                  selected?.current === "MAINTENANCE"
                    ? "bg-yellow-50 text-yellow-300 cursor-not-allowed"
                    : "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                }`}
              >
                Maintenance
              </button>

              <button
                type="button"
                disabled={selected?.current === "INACTIVE"}
                onClick={() => changeStatus("INACTIVE")}
                className={`px-4 py-2 rounded-lg ${
                  selected?.current === "INACTIVE" ? "bg-red-50 text-red-300 cursor-not-allowed" : "bg-red-100 text-red-500 hover:bg-red-200"
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
