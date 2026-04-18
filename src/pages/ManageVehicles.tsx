import { useEffect, useState } from "react";
import AxiosInstance from "../utils/AxiosInstance";
import { useAuth } from "../context/AuthContext";
import { TrashIcon } from "lucide-react";

export default function AdminVehicles() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterUsage, setFilterUsage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [statusModal, setStatusModal] = useState(false);
  const [selected, setSelected] = useState<{
    id: number;
    current: string;
  } | null>(null);

  const { user } = useAuth();

  const [form, setForm] = useState({
    license_plate: "",
    brand: "",
    model: "",
    vehicle_type: "",
    usage_type: "",
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

  const USAGE_TYPES = [
    { value: "LINEHAUL", label: "รถขนย้าย" },
    { value: "DELIVERY", label: "รถกระจาย" },
    { value: "PICKUP", label: "รับพัสดุ" },
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

  const getLabel = (list: any[], value: string) =>
    list.find((x) => x.value === value)?.label || value;

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await AxiosInstance.get("/manage/vehicles", {
        params: {
          search: search || undefined,
          vehicle_type: filterType || undefined,
          usage_type: filterUsage || undefined,
          status: filterStatus || undefined,
        },
        headers: { role_id: user?.role_id },
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

  const handleCreate = async () => {
    try {
      setError("");

      if (!form.license_plate) return setError("กรุณากรอกทะเบียนรถ");
      if (!form.brand) return setError("กรุณากรอกยี่ห้อรถ");
      if (!form.model) return setError("กรุณากรอกรุ่นรถ");
      if (!form.vehicle_type) return setError("กรุณาเลือกประเภทรถ");
      if (!form.usage_type) return setError("กรุณาเลือกประเภทการใช้งาน");
      if (!form.status) return setError("กรุณาเลือกสถานะ");
      if (!form.warehouse_id) return setError("กรุณาเลือก warehouse");
      if (!form.capacity_kg) return setError("กรุณากรอกน้ำหนัก (kg)");
      if (form.capacity_kg && isNaN(Number(form.capacity_kg))) {
        return setError("capacity ต้องเป็นตัวเลข");
      }

      await AxiosInstance.post("/manage/vehicles", form, {
        headers: { role_id: user?.role_id },
      });

      setShowModal(false);
      setForm({
        license_plate: "",
        brand: "",
        model: "",
        vehicle_type: "",
        usage_type: "",
        capacity_kg: "",
        warehouse_id: "",
        status: "ACTIVE",
      });

      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  const changeStatus = async (status: string) => {
    if (!selected) return;

    try {
      await AxiosInstance.patch(
        `/manage/vehicles/${selected.id}`,
        { status },
        {
          headers: { role_id: user?.role_id },
        },
      );
      setStatusModal(false);
      setSelected(null);
      fetchData();
    } catch {
      console.log("error");
    }
  };
  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      await AxiosInstance.delete(`/manage/vehicles/${confirmDelete}`, {
        headers: { role_id: user?.role_id },
      });

      setConfirmDelete(null);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "ลบไม่สำเร็จ");
    }
  };

  const openStatusModal = (id: number, current: string) => {
    setSelected({ id, current });
    setStatusModal(true);
  };

  return (
    <div className="w-full min-h-screen px-1 py-4 bg-slate-50">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">
            Vehicle Management
          </h2>
          <p className="text-sm text-slate-500">จัดการรถในระบบ</p>
        </div>

        <button
          onClick={() => {
            setError("");
            setShowModal(true);
            fetchWarehouses();
          }}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white shadow hover:bg-blue-700 transition"
        >
          + เพิ่มรถ
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-5 flex gap-3 flex-wrap">
        <input
          placeholder="ค้นหา..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-modern w-[220px]"
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
          value={filterUsage}
          onChange={(e) => setFilterUsage(e.target.value)}
          className="input-modern w-[180px]"
        >
          <option value="">การใช้งาน</option>
          {USAGE_TYPES.map((x) => (
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
          onClick={fetchData}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
        >
          ค้นหา
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="py-4 text-center w-12">#</th>
              <th className="text-left py-4">ทะเบียน</th>
              <th className="text-left py-4">ยี่ห้อ</th>
              <th className="text-left py-4">รุ่น</th>
              <th className="text-left py-4">ประเภท</th>
              <th className="text-left py-4">การใช้งาน</th>
              <th className="text-left py-4">น้ำหนักบรรทุก (kg)</th>
              <th className="text-left py-4">สังกัด</th>
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
                  <td className="text-center text-slate-400 py-4">{i + 1}</td>
                  <td className="font-medium py-4">{r.license_plate}</td>
                  <td className="py-4">{getLabel(BRANDS, r.brand)}</td>
                  <td className="py-4">{r.model || "-"}</td>
                  <td className="py-4">
                    {getLabel(VEHICLE_TYPES, r.vehicle_type)}
                  </td>
                  <td className="py-4">
                    {getLabel(USAGE_TYPES, r.usage_type)}
                  </td>
                  <td className="text-slate-500 py-4">
                    {r.capacity_kg || "-"}
                  </td>
                  <td className="text-slate-500 py-4">
                    {r.warehouse_name || "-"}
                  </td>
                  <td className="text-center py-4">
                    <div
                      onClick={() => openStatusModal(r.id, r.status)}
                      className="cursor-pointer inline-block"
                    >
                      {r.status === "ACTIVE" ? (
                        <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-600 font-medium">
                          Active
                        </span>
                      ) : r.status === "MAINTENANCE" ? (
                        <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-600 font-medium">
                          Maintenance
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-500 font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 flex items-center justify-center">
                    <button
                      onClick={() => setConfirmDelete(r.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg 
             bg-red-50 text-red-600 
             hover:bg-red-100 
             border border-red-200 
             transition-all"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-[520px] animate-scaleIn">
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

              <select
                className="input-modern"
                value={form.usage_type}
                onChange={(e) => handleChange("usage_type", e.target.value)}
              >
                <option value="">การใช้งาน</option>
                {USAGE_TYPES.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </select>

              <select
                className="input-modern"
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
              >
                <option value="">สถานะ</option>
                {STATUS.map((x) => (
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
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {statusModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-[300px]">
            <h3 className="text-lg font-semibold mb-4 text-slate-800">
              เปลี่ยนสถานะ
            </h3>

            <div className="flex flex-col gap-3">
              <button
                disabled={selected?.current === "ACTIVE"}
                onClick={() => changeStatus("ACTIVE")}
                className={`px-4 py-2 rounded-lg 
    ${
      selected?.current === "ACTIVE"
        ? "bg-green-50 text-green-300 cursor-not-allowed"
        : "bg-green-100 text-green-600 hover:bg-green-200"
    }`}
              >
                Active
              </button>

              <button
                disabled={selected?.current === "MAINTENANCE"}
                onClick={() => changeStatus("MAINTENANCE")}
                className={`px-4 py-2 rounded-lg 
    ${
      selected?.current === "MAINTENANCE"
        ? "bg-yellow-50 text-yellow-300 cursor-not-allowed"
        : "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
    }`}
              >
                Maintenance
              </button>

              <button
                disabled={selected?.current === "INACTIVE"}
                onClick={() => changeStatus("INACTIVE")}
                className={`px-4 py-2 rounded-lg 
    ${
      selected?.current === "INACTIVE"
        ? "bg-red-50 text-red-300 cursor-not-allowed"
        : "bg-red-100 text-red-500 hover:bg-red-200"
    }`}
              >
                Inactive
              </button>
            </div>

            <button
              onClick={() => {
                setStatusModal(false);
                setSelected(null);
              }}
              className="mt-4 w-full px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center w-[320px]">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              ยืนยันการลบ
            </h3>

            <p className="text-sm text-slate-500 mb-4">
              คุณแน่ใจหรือไม่ว่าจะลบรถคันนี้
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600"
              >
                ลบ
              </button>

              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
