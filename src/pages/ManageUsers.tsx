import { useState, useEffect } from "react";
import AxiosInstance from "../utils/AxiosInstance";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "../context/AuthContext";
import { X, Pencil } from "lucide-react";

export default function ManageUsers() {
  const [rows, setRows] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const [statusModal, setStatusModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const [selectedZones, setSelectedZones] = useState<number[]>([]);

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [error, setError] = useState("");

  const [editModal, setEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const { user } = useAuth();

  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    license_no: "",
    license_expire: "",
  });

  const [form, setForm] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    role_id: "",
    warehouse_id: "",
    license_no: "",
    license_expire: "",
  });

  // =====================
  // FETCH USERS
  // =====================
  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await AxiosInstance.get("/manage/users", {
        params: {
          role_id: filterRole || undefined,
          search: search || undefined,
        },
      });

      setRows(res.data);
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // FETCH DROPDOWN
  // =====================
  const fetchDropdown = async () => {
    const [r, w] = await Promise.all([
      AxiosInstance.get("/roles", { headers: { role_id: user?.role_id } }),
      AxiosInstance.get("/warehouses", { headers: { role_id: user?.role_id } }),
    ]);

    const employeeRoles = [3, 4, 5, 6, 7, 8, 9, 10];

    setRoles(r.data.filter((x: any) => employeeRoles.includes(x.id)));
    setWarehouses(w.data);

    setZones([
      { id: 1, zone_name: "กทม. ปริมณฑล" },
      { id: 2, zone_name: "ภาคกลาง" },
      { id: 3, zone_name: "ภาคเหนือ" },
      { id: 4, zone_name: "ภาคใต้" },
      { id: 5, zone_name: "ภาคอีสาน" },
    ]);
  };

  useEffect(() => {
    fetchData();
    fetchDropdown();
  }, []);

  const handleChange = (k: string, v: any) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  const handleEditChange = (k: string, v: any) => {
    setEditForm((prev) => ({ ...prev, [k]: v }));
  };

  // =====================
  // MODAL CLOSE / RESET
  // =====================
  const resetCreateForm = () => {
    setForm({
      username: "",
      password: "",
      first_name: "",
      last_name: "",
      role_id: "",
      warehouse_id: "",
      license_no: "",
      license_expire: "",
    });

    setSelectedZones([]);
    setError("");
    setShowPassword(false);
  };

  const closeCreateModal = () => {
    setShowModal(false);
    resetCreateForm();
  };

  const closeEditModal = () => {
    setEditModal(false);
    setEditingUser(null);
    setEditForm({
      first_name: "",
      last_name: "",
      license_no: "",
      license_expire: "",
    });
  };

  const closeStatusModal = () => {
    setStatusModal(false);
    setSelected(null);
  };

  const closeConfirmDelete = () => {
    setConfirmDelete(null);
  };

  // =====================
  // CREATE
  // =====================
  const handleCreate = async () => {
    try {
      setError("");

      const role = Number(form.role_id);

      if (!form.username || !form.password) {
        setError("กรุณากรอก username และ password");
        return;
      }

      if (!form.first_name || !form.last_name) {
        setError("กรุณากรอกชื่อ และนามสกุล");
        return;
      }

      if (!form.role_id) {
        setError("กรุณาเลือก role");
        return;
      }

      if (![3, 4, 6, 9, 10].includes(role)) {
        if (!form.warehouse_id) {
          setError("กรุณาเลือก warehouse");
          return;
        }
      }

      if (role === 7) {
        if (!form.license_no || !form.license_expire) {
          setError("กรุณากรอกเลขใบขับขี่ และวันหมดอายุ");
          return;
        }
      }

      if (role === 3 && selectedZones.length === 0) {
        setError("กรุณาเลือก zone อย่างน้อย 1");
        return;
      }

      const payload = {
        ...form,
        role_id: role,
        zones: selectedZones,
      } as any;

      if ([3, 4, 9, 10].includes(role)) {
        payload.warehouse_id = null;
      } else if (role === 6) {
        payload.warehouse_id = 15;
      } else {
        payload.warehouse_id = form.warehouse_id ? Number(form.warehouse_id) : null;
      }

      await AxiosInstance.post("/manage/users", payload, {});

      closeCreateModal();
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  // =====================
  // UPDATE USER
  // =====================
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    if (!editForm.first_name || !editForm.last_name) {
      alert("กรุณากรอกชื่อ และนามสกุล");
      return;
    }

    try {
      await AxiosInstance.put(`/manage/users/${editingUser.id}`, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        license_no: editForm.license_no || null,
        license_expire: editForm.license_expire || null,
      });

      closeEditModal();
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "update user failed");
    }
  };

  // =====================
  // STATUS
  // =====================
  const changeStatus = async (status: "ACTIVE" | "INACTIVE") => {
    if (!selected) return;

    const is_active = status === "ACTIVE" ? 1 : 0;

    try {
      await AxiosInstance.put(`/manage/users/${selected.id}`, {
        is_active,
      });

      closeStatusModal();
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "change status failed");
    }
  };

  // =====================
  // OPEN EDIT
  // =====================
  const openEdit = (row: any) => {
    setEditingUser(row);

    setEditForm({
      first_name: row.first_name || "",
      last_name: row.last_name || "",
      license_no: row.license_no || "",
      license_expire: row.license_expire ? new Date(row.license_expire).toISOString().split("T")[0] : "",
    });

    setEditModal(true);
  };

  // =====================
  // HARD DELETE
  // =====================
  const handleHardDelete = async () => {
    if (!confirmDelete) return;

    try {
      await AxiosInstance.delete(`/manage/users/${confirmDelete.id}/hard`, {});

      closeConfirmDelete();
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "hard delete failed");
    }
  };

  return (
    <div className="w-full min-h-screen px-1 py-4 bg-slate-50">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">User Management</h2>
          <p className="text-sm text-slate-500">จัดการผู้ใช้งานในระบบ</p>
        </div>

        <button
          onClick={() => {
            resetCreateForm();
            setShowModal(true);
            fetchDropdown();
          }}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white shadow hover:bg-blue-700 transition"
        >
          + เพิ่มผู้ใช้
        </button>
      </div>

      {/* FILTER */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-5 flex gap-3 flex-wrap">
        <input
          placeholder="ค้นหา username / ชื่อ"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-modern w-[220px]"
          onKeyDown={(e) => {
            if (e.key === "Enter") fetchData();
          }}
        />

        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="input-modern w-[180px]">
          <option value="">ทุก role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <button onClick={fetchData} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
          ค้นหา
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="py-4 text-center w-12">#</th>
              <th className="text-left py-4">Username</th>
              <th className="text-left py-4">ชื่อ - นามสกุล</th>
              <th className="text-left py-4 hidden md:table-cell">ตำแหน่ง</th>
              <th className="text-left py-4 hidden lg:table-cell">สังกัด</th>
              <th className="text-center py-4 hidden lg:table-cell">เลขที่ใบขับขี่</th>
              <th className="text-center py-4 hidden lg:table-cell">ใบขับขี่หมดอายุ</th>
              <th className="text-center py-4">สถานะ</th>
              <th className="text-left w-24">จัดการ</th>
            </tr>
          </thead>

          <tbody className="text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-slate-400">
                  ไม่มีข้อมูล
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id} className="border-t hover:bg-slate-50 transition">
                  <td className="text-center text-slate-400 py-2.5">{i + 1}</td>

                  <td className="font-medium py-2.5">{r.username}</td>

                  <td className="py-2.5">
                    <div className="leading-tight">
                      <div>
                        {r.first_name} {r.last_name}
                      </div>

                      <div className="text-xs text-slate-400 md:hidden">{r.role_name}</div>
                    </div>
                  </td>

                  <td className="py-2.5 hidden md:table-cell">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">{r.role_name}</span>
                  </td>

                  <td className="text-slate-500 py-2.5 hidden lg:table-cell">{r.warehouse_name || "-"}</td>

                  <td className="text-slate-500 py-2.5 hidden lg:table-cell">{r.license_no || "-"}</td>

                  <td className="text-slate-500 py-2.5 hidden lg:table-cell">
                    {r.license_expire
                      ? new Date(r.license_expire).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })
                      : "-"}
                  </td>

                  <td className="text-center py-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelected({
                          id: r.id,
                          username: r.username,
                          current: r.is_active ? "ACTIVE" : "INACTIVE",
                        });
                        setStatusModal(true);
                      }}
                      className={`px-2 py-1 text-xs rounded-full font-medium transition ${
                        r.is_active ? "bg-green-100 text-green-600 hover:bg-green-200" : "bg-red-100 text-red-500 hover:bg-red-200"
                      }`}
                    >
                      {r.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>

                  <td className="py-2.5">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
                      >
                        <Pencil size={14} />
                      </button>

                      {[1, 10, 11].includes(Number(user?.role_id)) && (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete({ id: r.id, type: "hard" })}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeCreateModal}>
          <div className="bg-white p-6 rounded-2xl shadow-xl w-[520px] animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 mb-5">เพิ่มผู้ใช้</h3>

            {error && <div className="mb-4 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}

            <div className="grid grid-cols-2 gap-4">
              <input
                className="input-modern"
                placeholder="Username"
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-modern w-full pr-10"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 cursor-pointer text-gray-400 hover:text-gray-600"
                >
                  👁
                </span>
              </div>

              <input
                className="input-modern"
                placeholder="ชื่อ"
                value={form.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
              />

              <input
                className="input-modern"
                placeholder="นามสกุล"
                value={form.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
              />

              <select className="input-modern" value={form.role_id} onChange={(e) => handleChange("role_id", e.target.value)}>
                <option value="">เลือก role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              {![3, 4, 6, 9, 10].includes(Number(form.role_id)) && (
                <select className="input-modern" value={form.warehouse_id} onChange={(e) => handleChange("warehouse_id", e.target.value)}>
                  <option value="">เลือก warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {Number(form.role_id) === 7 && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <input
                  className="input-modern"
                  placeholder="เลขใบขับขี่"
                  value={form.license_no}
                  onChange={(e) => handleChange("license_no", e.target.value)}
                />

                <DatePicker
                  selected={form.license_expire ? new Date(form.license_expire) : null}
                  onChange={(date: Date | null) => handleChange("license_expire", date ? date.toISOString().split("T")[0] : "")}
                  className="input-modern w-full"
                  placeholderText="วันหมดอายุใบขับขี่"
                  dateFormat="yyyy-MM-dd"
                />
              </div>
            )}

            {Number(form.role_id) === 3 && (
              <div className="mt-5">
                <label className="text-sm text-slate-500 mb-2 block">Zones</label>

                <div className="grid grid-cols-2 gap-2 border border-slate-200 rounded-xl p-3">
                  {zones.map((z) => (
                    <label key={z.id} className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={selectedZones.includes(z.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedZones([...selectedZones, z.id]);
                          } else {
                            setSelectedZones(selectedZones.filter((x) => x !== z.id));
                          }
                        }}
                      />
                      {z.zone_name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={closeCreateModal} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">
                ยกเลิก
              </button>

              <button type="button" onClick={handleCreate} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow">
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeEditModal}>
          <div className="bg-white p-6 rounded-2xl shadow-xl w-[460px] animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">แก้ไขผู้ใช้</h3>

            <p className="text-sm text-slate-500 mb-5">{editingUser?.username || "-"}</p>

            <div className="grid grid-cols-2 gap-4">
              <input
                className="input-modern"
                placeholder="ชื่อ"
                value={editForm.first_name}
                onChange={(e) => handleEditChange("first_name", e.target.value)}
              />

              <input
                className="input-modern"
                placeholder="นามสกุล"
                value={editForm.last_name}
                onChange={(e) => handleEditChange("last_name", e.target.value)}
              />

              <input
                className="input-modern"
                placeholder="เลขใบขับขี่"
                value={editForm.license_no}
                onChange={(e) => handleEditChange("license_no", e.target.value)}
              />

              <DatePicker
                selected={editForm.license_expire ? new Date(editForm.license_expire) : null}
                onChange={(date: Date | null) => handleEditChange("license_expire", date ? date.toISOString().split("T")[0] : "")}
                className="input-modern w-full"
                placeholderText="วันหมดอายุใบขับขี่"
                dateFormat="yyyy-MM-dd"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={closeEditModal} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">
                ยกเลิก
              </button>

              <button type="button" onClick={handleUpdateUser} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow">
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS MODAL */}
      {statusModal && (
        <div onClick={closeStatusModal} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div onClick={(e) => e.stopPropagation()} className="bg-white p-6 rounded-2xl shadow-xl w-[300px]">
            <h3 className="text-lg font-semibold mb-1 text-slate-800">สถานะ</h3>

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

      {/* CONFIRM DELETE MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={closeConfirmDelete}>
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center w-[320px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">ยืนยันการลบ</h3>

            <p className="text-sm text-slate-500 mb-4">ลบผู้ใช้งานรายนี้ถาวร?</p>

            <div className="flex justify-center gap-3">
              <button type="button" onClick={handleHardDelete} className="px-4 py-2 rounded-xl bg-red-500 text-white">
                ยืนยัน
              </button>

              <button type="button" onClick={closeConfirmDelete} className="px-4 py-2 rounded-xl bg-gray-100">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
