import { useEffect, useState } from "react";
import AxiosInstance from "../utils/AxiosInstance";

export default function AdminVehicles() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [statusModal, setStatusModal] = useState(false);
  const [selected, setSelected] = useState<{
    id: number;
    current: string;
  } | null>(null);

  const [form, setForm] = useState({
    license_plate: "",
    brand: "",
    model: "",
    vehicle_type: "",
    capacity_kg: "",
    warehouse_id: "",
    status: "ACTIVE",
  });

  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  const VEHICLE_TYPES = [
    { value: "BIKE", label: "มอเตอร์ไซค์" },
    { value: "4W", label: "รถ 4 ล้อ" },
    { value: "TRUCK_6W", label: "รถ 6 ล้อ" },
    { value: "TRUCK_10W", label: "รถ 10 ล้อ" },
  ];

  const STATUS = [
    { value: "ACTIVE", label: "ใช้งาน" },
    { value: "MAINTENANCE", label: "ซ่อมบำรุง" },
    { value: "INACTIVE", label: "ปิดใช้งาน" },
  ];

  const BRANDS = [
    { value: "TOYOTA", label: "Toyota" },
    { value: "ISUZU", label: "Isuzu" },
    { value: "HONDA", label: "Honda" },
    { value: "NISSAN", label: "Nissan" },
    { value: "MITSUBISHI", label: "Mitsubishi" },
    { value: "MAZDA", label: "Mazda" },
    { value: "SUZUKI", label: "Suzuki" },
    { value: "OTHER", label: "อื่นๆ" },
  ];

  const getLabel = (list: any[], value: string) => {
    return list.find((x) => x.value === value)?.label || value;
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
          vehicle_type: filterType || undefined,
          status: filterStatus || undefined,
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

  useEffect(() => {
    fetchData();
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
      brand: "",
      model: "",
      vehicle_type: "",
      capacity_kg: "",
      warehouse_id: "",
      status: "ACTIVE",
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
      if (!form.brand) return setError("กรุณากรอกยี่ห้อรถ");
      if (!form.model) return setError("กรุณากรอกรุ่นรถ");
      if (!form.vehicle_type) return setError("กรุณาเลือกประเภทรถ");
      if (!form.warehouse_id) return setError("กรุณาเลือก warehouse");
      if (!form.capacity_kg) return setError("กรุณากรอกน้ำหนักบรรทุก (kg)");

      if (form.capacity_kg && isNaN(Number(form.capacity_kg))) {
        return setError("capacity ต้องเป็นตัวเลข");
      }

      await AxiosInstance.post("/manage/vehicles", {
        ...form,
        status: "ACTIVE",
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
            fetchWarehouses();
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
          {VEHICLE_TYPES.map((x) => (
            <option key={x.value} value={x.value}>
              {x.label}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-modern w-[180px]"
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
        <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="py-4 text-center w-12">#</th>
              <th className="text-left py-4">ทะเบียน</th>
              <th className="text-left py-4">ยี่ห้อ</th>
              <th className="text-left py-4 hidden md:table-cell">รุ่น</th>
              <th className="text-left py-4 hidden md:table-cell">ประเภท</th>
              <th className="text-left py-4 hidden lg:table-cell">
                น้ำหนักบรรทุก (kg)
              </th>
              <th className="text-left py-4 hidden lg:table-cell">สังกัด</th>
              <th className="text-center py-4">สถานะ</th>
            </tr>
          </thead>

          <tbody className="text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400">
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

                  <td className="py-2.5">
                    <div className="leading-tight">
                      <div>{getLabel(BRANDS, r.brand)}</div>

                      <div className="text-xs text-slate-400 md:hidden">
                        {getLabel(VEHICLE_TYPES, r.vehicle_type)}
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 hidden md:table-cell">
                    {r.model || "-"}
                  </td>

                  <td className="py-2.5 hidden md:table-cell">
                    {getLabel(VEHICLE_TYPES, r.vehicle_type)}
                  </td>

                  <td className="text-slate-500 py-2.5 hidden lg:table-cell">
                    {r.capacity_kg || "-"}
                  </td>

                  <td className="text-slate-500 py-2.5 hidden lg:table-cell">
                    {r.warehouse_name || "-"}
                  </td>

                  <td className="text-center py-2.5">
                    <button
                      type="button"
                      onClick={() => openStatusModal(r.id, r.status)}
                      className="cursor-pointer inline-block"
                    >
                      {r.status === "ACTIVE" ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600 font-medium hover:bg-green-200">
                          Active
                        </span>
                      ) : r.status === "MAINTENANCE" ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-600 font-medium hover:bg-yellow-200">
                          Maintenance
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-500 font-medium hover:bg-red-200">
                          Inactive
                        </span>
                      )}
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
            className="bg-white p-6 rounded-2xl shadow-xl w-[520px] animate-scaleIn"
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

            <div className="grid grid-cols-2 gap-4">
              <input
                className="input-modern"
                placeholder="ทะเบียน"
                value={form.license_plate}
                onChange={(e) => {
                  const v = e.target.value
                    .toUpperCase()
                    .replace(/\s+/g, "")
                    .replace(/-/g, "");

                  handleChange("license_plate", v);
                }}
              />

              <select
                className="input-modern"
                value={form.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
              >
                <option value="">เลือกยี่ห้อ</option>
                {BRANDS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>

              {form.brand === "OTHER" && (
                <input
                  className="input-modern"
                  placeholder="กรอกยี่ห้อ"
                  onChange={(e) => handleChange("brand", e.target.value)}
                />
              )}

              <input
                className="input-modern"
                placeholder="รุ่น"
                value={form.model}
                onChange={(e) => handleChange("model", e.target.value)}
              />

              <select
                className="input-modern"
                value={form.vehicle_type}
                onChange={(e) => handleChange("vehicle_type", e.target.value)}
              >
                <option value="">ประเภท</option>
                {VEHICLE_TYPES.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>

              <input
                className="input-modern"
                placeholder="น้ำหนักบรรทุก (kg)"
                value={form.capacity_kg}
                onChange={(e) => handleChange("capacity_kg", e.target.value)}
              />

              <select
                className="input-modern"
                value={form.warehouse_id}
                onChange={(e) => handleChange("warehouse_id", e.target.value)}
              >
                <option value="">เลือก warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
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