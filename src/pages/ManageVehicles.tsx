import { useEffect, useState } from "react";
import AxiosInstance from "../utils/AxiosInstance";

type MasterOption = {
  id: number;
  name: string;
};

export default function AdminVehicles() {
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

  const [form, setForm] = useState({
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
  });

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

      setRows(res.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    const res = await AxiosInstance.get("/warehouses");
    setWarehouses(res.data);
  };

  const fetchVehicleBrands = async () => {
    const res = await AxiosInstance.get("/vehicle-brands");
    setBrands(res.data);
  };

  const fetchVehicleTypes = async () => {
    const res = await AxiosInstance.get("/vehicle-types");
    setVehicleTypes(res.data);
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
    setForm({
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
    });

    setError("");
  };

  const closeCreateModal = () => {
    setShowModal(false);
    resetForm();
  };

  const closeStatusModal = () => {
    setStatusModal(false);
    setSelected(null);
  };

  // =====================
  // CREATE
  // =====================
  const handleCreate = async () => {
    try {
      setError("");

      if (!form.license_plate) return setError("กรุณากรอกทะเบียนรถ");
      if (!form.license_province) return setError("กรุณากรอกจังหวัดทะเบียน");
      if (!form.brand_id) return setError("กรุณาเลือกยี่ห้อรถ");
      if (!form.model) return setError("กรุณากรอกรุ่นรถ");
      if (!form.vehicle_type_id) return setError("กรุณาเลือกประเภทรถ");
      if (!form.capacity_kg) return setError("กรุณากรอกน้ำหนักใช้งานจริง (kg)");
      if (!form.warehouse_id) return setError("กรุณาเลือก warehouse");

      if (form.capacity_kg && isNaN(Number(form.capacity_kg))) {
        return setError("น้ำหนักใช้งานจริงต้องเป็นตัวเลข");
      }

      if (form.max_load_kg && isNaN(Number(form.max_load_kg))) {
        return setError("น้ำหนักสูงสุดต้องเป็นตัวเลข");
      }

      if (form.vehicle_year && isNaN(Number(form.vehicle_year))) {
        return setError("ปีรถต้องเป็นตัวเลข");
      }

      await AxiosInstance.post("/manage/vehicles", {
        license_plate: form.license_plate,
        license_province: form.license_province,
        brand_id: form.brand_id,
        model: form.model,
        color: form.color || null,
        vehicle_year: form.vehicle_year || null,
        vehicle_type_id: form.vehicle_type_id,
        fuel_type: form.fuel_type || null,
        capacity_kg: form.capacity_kg,
        max_load_kg: form.max_load_kg || "",
        warehouse_id: form.warehouse_id,
        owner_type: form.owner_type || "COMPANY",
        owner_name: form.owner_type === "DRIVER" ? form.owner_name || null : null,
        purchase_date:
          form.owner_type === "COMPANY" ? form.purchase_date || null : null,
        fleet_card_no: form.fleet_card_no || null,
        chassis_no: form.chassis_no || null,
        engine_no: form.engine_no || null,
      });

      closeCreateModal();
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
      await AxiosInstance.patch(`/manage/vehicles/${selected.id}`, { status });

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
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-auto">
        <table className="min-w-[1450px] w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="py-4 text-center w-12">#</th>
              <th className="text-left py-4">ทะเบียน</th>
              <th className="text-left py-4">จังหวัด</th>
              <th className="text-left py-4">ยี่ห้อ</th>
              <th className="text-left py-4">รุ่น</th>
              <th className="text-left py-4">สี</th>
              <th className="text-left py-4">ปี</th>
              <th className="text-left py-4">ประเภท</th>
              <th className="text-left py-4">น้ำหนักใช้งาน</th>
              <th className="text-left py-4">น้ำหนักสูงสุด</th>
              <th className="text-left py-4">สังกัด</th>
              <th className="text-left py-4">เจ้าของรถ</th>
              <th className="text-center py-4">สถานะ</th>
            </tr>
          </thead>

          <tbody className="text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={13} className="text-center py-10 text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={13} className="text-center py-10 text-slate-400">
                  ไม่มีข้อมูล
                </td>
              </tr>
            ) : (
              rows.map((r: any, i) => (
                <tr
                  key={r.id}
                  className="border-t hover:bg-slate-50 transition"
                >
                  <td className="text-center text-slate-400 py-2.5">
                    {i + 1}
                  </td>

                  <td className="font-medium py-2.5">{r.license_plate}</td>

                  <td className="py-2.5 text-slate-500">
                    {r.license_province || "-"}
                  </td>

                  <td className="py-2.5">{r.brand_name || "-"}</td>

                  <td className="py-2.5">{r.model || "-"}</td>

                  <td className="py-2.5 text-slate-500">{r.color || "-"}</td>

                  <td className="py-2.5 text-slate-500">
                    {r.vehicle_year || "-"}
                  </td>

                  <td className="py-2.5">{r.vehicle_type_name || "-"}</td>

                  <td className="py-2.5 text-slate-500">
                    {r.capacity_kg || "-"}
                  </td>

                  <td className="py-2.5 text-slate-500">
                    {r.max_load_kg || "-"}
                  </td>

                  <td className="py-2.5 text-slate-500">
                    {r.warehouse_name || "-"}
                  </td>

                  <td className="py-2.5">
                    <div className="leading-tight">
                      <div>{getOwnerTypeLabel(r.owner_type)}</div>
                      {r.owner_name && (
                        <div className="text-xs text-slate-400">
                          {r.owner_name}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="text-center py-2.5">
                    <button
                      type="button"
                      onClick={() => openStatusModal(r.id, r.status)}
                      className="cursor-pointer inline-block"
                    >
                      {getStatusBadge(r.status)}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={closeCreateModal}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-xl w-[820px] max-h-[90vh] overflow-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-5">
              เพิ่มรถ
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
                  <input
                    className="input-modern"
                    placeholder="ทะเบียนรถ *"
                    value={form.license_plate}
                    onChange={(e) => {
                      const v = e.target.value
                        .toUpperCase()
                        .replace(/\s+/g, "")
                        .replace(/-/g, "");

                      handleChange("license_plate", v);
                    }}
                  />

                  <input
                    className="input-modern"
                    placeholder="จังหวัดทะเบียน *"
                    value={form.license_province}
                    onChange={(e) =>
                      handleChange("license_province", e.target.value)
                    }
                  />

                  <select
                    className="input-modern"
                    value={form.brand_id}
                    onChange={(e) => handleChange("brand_id", e.target.value)}
                  >
                    <option value="">เลือกยี่ห้อ *</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>

                  <input
                    className="input-modern"
                    placeholder="รุ่นรถ *"
                    value={form.model}
                    onChange={(e) => handleChange("model", e.target.value)}
                  />

                  <input
                    className="input-modern"
                    placeholder="สีรถ"
                    value={form.color}
                    onChange={(e) => handleChange("color", e.target.value)}
                  />

                  <input
                    className="input-modern"
                    placeholder="ปีรถ เช่น 2024"
                    value={form.vehicle_year}
                    onChange={(e) =>
                      handleChange("vehicle_year", e.target.value)
                    }
                  />

                  <select
                    className="input-modern"
                    value={form.vehicle_type_id}
                    onChange={(e) =>
                      handleChange("vehicle_type_id", e.target.value)
                    }
                  >
                    <option value="">เลือกประเภทรถ *</option>
                    {vehicleTypes.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </select>

                  <select
                    className="input-modern"
                    value={form.fuel_type}
                    onChange={(e) => handleChange("fuel_type", e.target.value)}
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

              <div>
                <div className="text-sm font-semibold text-slate-700 mb-3">
                  น้ำหนัก / สังกัด
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    className="input-modern"
                    placeholder="น้ำหนักใช้งานจริง (kg) *"
                    value={form.capacity_kg}
                    onChange={(e) =>
                      handleChange("capacity_kg", e.target.value)
                    }
                  />

                  <input
                    className="input-modern"
                    placeholder="น้ำหนักสูงสุดตามเล่มรถ (kg)"
                    value={form.max_load_kg}
                    onChange={(e) =>
                      handleChange("max_load_kg", e.target.value)
                    }
                  />

                  <select
                    className="input-modern"
                    value={form.warehouse_id}
                    onChange={(e) =>
                      handleChange("warehouse_id", e.target.value)
                    }
                  >
                    <option value="">เลือก warehouse *</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>

                  <select
                    className="input-modern"
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

              <div>
                <div className="text-sm font-semibold text-slate-700 mb-3">
                  ข้อมูลเจ้าของ / เอกสารรถ
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {form.owner_type === "DRIVER" ? (
                    <input
                      className="input-modern"
                      placeholder="ชื่อเจ้าของรถ / คนขับ"
                      value={form.owner_name}
                      onChange={(e) =>
                        handleChange("owner_name", e.target.value)
                      }
                    />
                  ) : (
                    <input
                      className="input-modern"
                      type="date"
                      placeholder="วันที่ซื้อ"
                      value={form.purchase_date}
                      onChange={(e) =>
                        handleChange("purchase_date", e.target.value)
                      }
                    />
                  )}

                  <input
                    className="input-modern"
                    placeholder="Fleet Card"
                    value={form.fleet_card_no}
                    onChange={(e) =>
                      handleChange("fleet_card_no", e.target.value)
                    }
                  />

                  <input
                    className="input-modern"
                    placeholder="เลขตัวถัง"
                    value={form.chassis_no}
                    onChange={(e) => handleChange("chassis_no", e.target.value)}
                  />

                  <input
                    className="input-modern"
                    placeholder="เลขเครื่องยนต์"
                    value={form.engine_no}
                    onChange={(e) => handleChange("engine_no", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={closeCreateModal}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleCreate}
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