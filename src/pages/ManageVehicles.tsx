import { useEffect, useState } from "react";
import AxiosInstance from "../utils/AxiosInstance";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Pencil } from "lucide-react";
import {
  cleanCodeInput,
  cleanNameInput,
  cleanNumberInput,
  removeSpaces,
} from "../utils/textSanitizer";

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
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600 font-medium hover:bg-green-200">
          Active
        </span>
      );
    }

    if (status === "MAINTENANCE") {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-600 font-medium hover:bg-yellow-200">
          Maintenance
        </span>
      );
    }

    return (
      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-500 font-medium hover:bg-red-200">
        Inactive
      </span>
    );
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

  return (
    <div className="w-full min-h-screen px-1 py-4 bg-slate-50">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">
            Vehicle Management
          </h2>
          <p className="text-sm text-slate-500">จัดการรถในระบบ</p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white shadow hover:bg-blue-700 transition"
        >
          + เพิ่มรถ
        </button>
      </div>

      {/* FILTER */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-5 flex gap-3 flex-wrap">
        <input
          placeholder="ค้นหา..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-modern w-[220px]"
          onKeyDown={(e) => {
            if (e.key === "Enter") fetchData();
          }}
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="input-modern w-[180px]"
        >
          <option value="">ประเภทรถ</option>
          {vehicleTypes.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>

        <select
          value={filterOwnerType}
          onChange={(e) => setFilterOwnerType(e.target.value)}
          className="input-modern w-[160px]"
        >
          <option value="">เจ้าของรถ</option>
          {OWNER_TYPES.map((x) => (
            <option key={x.value} value={x.value}>
              {x.label}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-modern w-[160px]"
        >
          <option value="">สถานะ</option>
          {STATUS.map((x) => (
            <option key={x.value} value={x.value}>
              {x.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={fetchData}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
        >
          ค้นหา
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="min-w-[1500px] w-full text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="py-4 px-3 text-center w-12">#</th>
                <th className="py-4 px-3 text-left">ทะเบียน</th>
                <th className="py-4 px-3 text-left">จังหวัดทะเบียน</th>
                <th className="py-4 px-3 text-left">ยี่ห้อ</th>
                <th className="py-4 px-3 text-left">รุ่น</th>
                <th className="py-4 px-3 text-left">สี</th>
                <th className="py-4 px-3 text-left">ปี</th>
                <th className="py-4 px-3 text-left">ประเภท</th>
                <th className="py-4 px-3 text-left">น้ำหนักใช้งาน</th>
                <th className="py-4 px-3 text-left">น้ำหนักสูงสุด</th>
                <th className="py-4 px-3 text-left">สังกัด</th>
                <th className="py-4 px-3 text-left">เจ้าของรถ</th>
                <th className="py-4 px-3 text-left">หมายเลขบัตร fleet</th>
                <th className="py-4 px-3 text-left">หมายเลขตัวถัง</th>
                <th className="py-4 px-3 text-left">หมายเลขเครื่องยนต์</th>
                <th className="py-4 px-3 text-center">สถานะ</th>
                <th className="py-4 px-3 text-center">จัดการ</th>
              </tr>
            </thead>

            <tbody className="text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={17} className="text-center py-10 text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={17} className="text-center py-10 text-slate-400">
                    ไม่มีข้อมูล
                  </td>
                </tr>
              ) : (
                rows.map((r: any, i) => (
                  <tr key={r.id} className="border-t hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 text-center text-slate-400">
                      {i + 1}
                    </td>

                    <td className="py-2.5 px-3 font-medium">
                      {r.license_plate}
                    </td>

                    <td className="py-2.5 px-3 text-slate-500">
                      {r.license_province || "-"}
                    </td>

                    <td className="py-2.5 px-3">{r.brand_name || "-"}</td>

                    <td className="py-2.5 px-3">{r.model || "-"}</td>

                    <td className="py-2.5 px-3 text-slate-500">
                      {r.color || "-"}
                    </td>

                    <td className="py-2.5 px-3 text-slate-500">
                      {r.vehicle_year || "-"}
                    </td>

                    <td className="py-2.5 px-3">
                      {r.vehicle_type_name || "-"}
                    </td>

                    <td className="py-2.5 px-3 text-slate-500">
                      {r.capacity_kg || "-"}
                    </td>

                    <td className="py-2.5 px-3 text-slate-500">
                      {r.max_load_kg || "-"}
                    </td>

                    <td className="py-2.5 px-3 text-slate-500">
                      {r.warehouse_name || "-"}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="leading-tight">
                        <div>{getOwnerTypeLabel(r.owner_type)}</div>

                        {String(r.owner_type || "").trim().toUpperCase() ===
                        "COMPANY"
                          ? r.purchase_date && (
                              <div className="text-xs text-slate-400">
                                {r.purchase_date}
                              </div>
                            )
                          : r.owner_name && (
                              <div className="text-xs text-slate-400">
                                {r.owner_name}
                              </div>
                            )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-slate-500">
                      {r.fleet_card_no || "-"}
                    </td>

                    <td className="py-2.5 px-3 text-slate-500">
                      {r.chassis_no || "-"}
                    </td>

                    <td className="py-2.5 px-3 text-slate-500">
                      {r.engine_no || "-"}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => openStatusModal(r.id, r.status)}
                        className="cursor-pointer inline-block"
                      >
                        {getStatusBadge(r.status)}
                      </button>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-xl w-[820px] max-h-[90vh] overflow-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-5">
              {editing ? "แก้ไขรถ" : "เพิ่มรถ"}
            </h3>

            {error && (
              <div className="mb-4 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <div className="text-sm font-semibold text-slate-700 mb-3">
                  ข้อมูลรถ
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">
                      ทะเบียนรถ <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="input-modern w-full"
                      placeholder="เช่น 1กก1234"
                      value={form.license_plate}
                      onChange={(e) => {
                        const value = removeSpaces(e.target.value)
                          .toUpperCase()
                          .replace(/-/g, "");

                        handleChange("license_plate", value);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">
                      จังหวัดทะเบียน <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="input-modern w-full"
                      placeholder="เช่น กรุงเทพมหานคร"
                      value={form.license_province}
                      onChange={(e) =>
                        handleChange("license_province", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">
                      ยี่ห้อรถ <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="input-modern w-full"
                      value={form.brand_id}
                      onChange={(e) => handleChange("brand_id", e.target.value)}
                    >
                      <option value="">เลือกยี่ห้อ</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">
                      รุ่นรถ
                    </label>
                    <input
                      className="input-modern w-full"
                      placeholder="เช่น D-Max / Revo"
                      value={form.model}
                      onChange={(e) => handleChange("model", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">
                      สีรถ
                    </label>
                    <input
                      className="input-modern w-full"
                      placeholder="เช่น ขาว / ดำ / เทา"
                      value={form.color}
                      onChange={(e) => handleChange("color", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">
                      ปีรถ
                    </label>
                    <input
                      className="input-modern w-full"
                      placeholder="เช่น 2024"
                      value={form.vehicle_year}
                      onChange={(e) =>
                        handleChange(
                          "vehicle_year",
                          cleanNumberInput(e.target.value),
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">
                      ประเภทรถ <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="input-modern w-full"
                      value={form.vehicle_type_id}
                      onChange={(e) =>
                        handleChange("vehicle_type_id", e.target.value)
                      }
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
                    <label className="block text-xs font-medium mb-1 text-slate-600">
                      เชื้อเพลิง
                    </label>
                    <select
                      className="input-modern w-full"
                      value={form.fuel_type}
                      onChange={(e) =>
                        handleChange("fuel_type", e.target.value)
                      }
                    >
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
                <div className="text-sm font-semibold text-slate-700 mb-3">
                  น้ำหนัก / สังกัด
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">
                      น้ำหนักใช้งานจริง (kg){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="input-modern w-full"
                      placeholder="เช่น 1000"
                      value={form.capacity_kg}
                      onChange={(e) =>
                        handleChange(
                          "capacity_kg",
                          cleanNumberInput(e.target.value),
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">
                      น้ำหนักสูงสุดตามเล่มรถ (kg)
                    </label>
                    <input
                      className="input-modern w-full"
                      placeholder="เช่น 1500"
                      value={form.max_load_kg}
                      onChange={(e) =>
                        handleChange(
                          "max_load_kg",
                          cleanNumberInput(e.target.value),
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">
                      Warehouse <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="input-modern w-full"
                      value={form.warehouse_id}
                      onChange={(e) =>
                        handleChange("warehouse_id", e.target.value)
                      }
                    >
                      <option value="">เลือก warehouse</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">
                      เจ้าของรถ <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="input-modern w-full"
                      value={form.owner_type}
                      onChange={(e) =>
                        handleChange("owner_type", e.target.value)
                      }
                    >
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
                <div className="text-sm font-semibold text-slate-700 mb-3">
                  ข้อมูลเจ้าของ / เอกสารรถ
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {form.owner_type === "DRIVER" ? (
                    <div>
                      <label className="block text-xs font-medium mb-1 text-slate-600">
                        ชื่อเจ้าของรถ / คนขับ
                      </label>
                      <input
                        className="input-modern w-full"
                        placeholder="ชื่อเจ้าของรถ / คนขับ"
                        value={form.owner_name}
                        onChange={(e) =>
                          handleChange(
                            "owner_name",
                            cleanNameInput(e.target.value),
                          )
                        }
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium mb-1 text-slate-600">
                        วันที่ซื้อรถ
                      </label>
                      <DatePicker
                        selected={
                          form.purchase_date
                            ? new Date(form.purchase_date)
                            : null
                        }
                        onChange={(date: Date | null) =>
                          handleChange(
                            "purchase_date",
                            date ? date.toISOString().split("T")[0] : "",
                          )
                        }
                        className="input-modern w-full"
                        wrapperClassName="w-full"
                        placeholderText="วันที่ซื้อรถ"
                        dateFormat="yyyy-MM-dd"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">
                      Fleet Card
                    </label>
                    <input
                      className="input-modern w-full"
                      placeholder="Fleet Card"
                      value={form.fleet_card_no}
                      onChange={(e) =>
                        handleChange(
                          "fleet_card_no",
                          cleanCodeInput(e.target.value),
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">
                      เลขตัวถัง
                    </label>
                    <input
                      className="input-modern w-full"
                      placeholder="เลขตัวถัง"
                      value={form.chassis_no}
                      onChange={(e) =>
                        handleChange(
                          "chassis_no",
                          cleanCodeInput(e.target.value),
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">
                      เลขเครื่องยนต์
                    </label>
                    <input
                      className="input-modern w-full"
                      placeholder="เลขเครื่องยนต์"
                      value={form.engine_no}
                      onChange={(e) =>
                        handleChange(
                          "engine_no",
                          cleanCodeInput(e.target.value),
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS MODAL */}
      {statusModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={closeStatusModal}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-xl w-[300px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-slate-800">
              สถานะ
            </h3>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={selected?.current === "ACTIVE"}
                onClick={() => changeStatus("ACTIVE")}
                className={`px-4 py-2 rounded-lg ${
                  selected?.current === "ACTIVE"
                    ? "bg-green-50 text-green-300 cursor-not-allowed"
                    : "bg-green-100 text-green-600 hover:bg-green-200"
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
                  selected?.current === "INACTIVE"
                    ? "bg-red-50 text-red-300 cursor-not-allowed"
                    : "bg-red-100 text-red-500 hover:bg-red-200"
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