import { useState, useEffect } from "react";
import AxiosInstance from "../utils/AxiosInstance";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "../context/AuthContext";
import { Pencil } from "lucide-react";
import {
  cleanCodeInput,
  cleanNameInput,
  cleanNumberInput,
  cleanEmailInput,
} from "../utils/textSanitizer";

const RequiredLabel = ({
  children,
  required = false,
}: {
  children: string;
  required?: boolean;
}) => {
  return (
    <label className="block text-xs font-medium text-slate-500 mb-1">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

export default function ManageUsers() {
  const [rows, setRows] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [statusModal, setStatusModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const [selectedZones, setSelectedZones] = useState<number[]>([]);

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [error, setError] = useState("");

  const [editModal, setEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const { user } = useAuth();

  const titleOptions = ["นาย", "นาง", "นางสาว"];

  const genderOptions = [
    { value: "ชาย", label: "ชาย" },
    { value: "หญิง", label: "หญิง" },
  ];

  const [editForm, setEditForm] = useState({
    employee_code: "",
    title_name: "",
    first_name: "",
    last_name: "",
    gender: "",
    citizen_id: "",
    email: "",
    tel: "",
    license_no: "",
    license_expire: "",
  });

  const [form, setForm] = useState({
    employee_code: "",
    username: "",
    title_name: "",
    first_name: "",
    last_name: "",
    gender: "",
    citizen_id: "",
    email: "",
    tel: "",
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
      AxiosInstance.get("/warehouses", {
        headers: { role_id: user?.role_id },
      }),
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
      employee_code: "",
      username: "",
      title_name: "",
      first_name: "",
      last_name: "",
      gender: "",
      citizen_id: "",
      email: "",
      tel: "",
      role_id: "",
      warehouse_id: "",
      license_no: "",
      license_expire: "",
    });

    setSelectedZones([]);
    setError("");
  };

  const closeCreateModal = () => {
    setShowModal(false);
    resetCreateForm();
  };

  const closeEditModal = () => {
    setEditModal(false);
    setEditingUser(null);
    setEditForm({
      employee_code: "",
      title_name: "",
      first_name: "",
      last_name: "",
      gender: "",
      citizen_id: "",
      email: "",
      tel: "",
      license_no: "",
      license_expire: "",
    });
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

      const role = Number(form.role_id);

      const username = cleanCodeInput(form.username);
      const employee_code = cleanCodeInput(form.employee_code);
      const first_name = cleanNameInput(form.first_name);
      const last_name = cleanNameInput(form.last_name);
      const citizen_id = cleanNumberInput(form.citizen_id).slice(0, 13);
      const email = cleanEmailInput(form.email);
      const tel = cleanNumberInput(form.tel);
      const license_no = cleanCodeInput(form.license_no);

      if (!employee_code) {
        setError("กรุณากรอกรหัสพนักงาน");
        return;
      }

      if (!username) {
        setError("กรุณากรอก username");
        return;
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        setError("username ใช้ได้เฉพาะภาษาอังกฤษ ตัวเลข _ และ -");
        return;
      }

      if (!form.title_name) {
        setError("กรุณาเลือกคำนำหน้า");
        return;
      }

      if (!first_name) {
        setError("กรุณากรอกชื่อ");
        return;
      }

      if (!last_name) {
        setError("กรุณากรอกนามสกุล");
        return;
      }

      if (!form.gender) {
        setError("กรุณาเลือกเพศ");
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
        if (!license_no) {
          setError("กรุณากรอกเลขใบขับขี่");
          return;
        }

        if (!form.license_expire) {
          setError("กรุณาเลือกวันหมดอายุใบขับขี่");
          return;
        }
      }

      if (role === 3 && selectedZones.length === 0) {
        setError("กรุณาเลือก zone อย่างน้อย 1");
        return;
      }

      const payload = {
        ...form,
        employee_code,
        username,
        title_name: form.title_name,
        first_name,
        last_name,
        gender: form.gender,
        citizen_id,
        email,
        tel,
        license_no,
        role_id: role,
        zones: selectedZones,
      } as any;

      if ([3, 4, 9, 10].includes(role)) {
        payload.warehouse_id = null;
      } else if (role === 6) {
        payload.warehouse_id = 15;
      } else {
        payload.warehouse_id = form.warehouse_id
          ? Number(form.warehouse_id)
          : null;
      }

      await AxiosInstance.post("/manage/users", payload);

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

    const employee_code = cleanCodeInput(editForm.employee_code);
    const first_name = cleanNameInput(editForm.first_name);
    const last_name = cleanNameInput(editForm.last_name);
    const citizen_id = cleanNumberInput(editForm.citizen_id).slice(0, 13);
    const email = cleanEmailInput(editForm.email);
    const tel = cleanNumberInput(editForm.tel);
    const license_no = cleanCodeInput(editForm.license_no);

    if (!employee_code) {
      alert("กรุณากรอกรหัสพนักงาน");
      return;
    }

    if (!editForm.title_name) {
      alert("กรุณาเลือกคำนำหน้า");
      return;
    }

    if (!first_name) {
      alert("กรุณากรอกชื่อ");
      return;
    }

    if (!last_name) {
      alert("กรุณากรอกนามสกุล");
      return;
    }

    if (!editForm.gender) {
      alert("กรุณาเลือกเพศ");
      return;
    }

    try {
      await AxiosInstance.put(`/manage/users/${editingUser.id}`, {
        employee_code,
        title_name: editForm.title_name,
        first_name,
        last_name,
        gender: editForm.gender,
        citizen_id: citizen_id || null,
        email: email || null,
        tel: tel || null,
        license_no: license_no || null,
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
      employee_code: row.employee_code || "",
      title_name: row.title_name || "",
      first_name: row.first_name || "",
      last_name: row.last_name || "",
      gender: row.gender || "",
      citizen_id: row.citizen_id || "",
      email: row.email || "",
      tel: row.tel || "",
      license_no: row.license_no || "",
      license_expire: row.license_expire
        ? new Date(row.license_expire).toISOString().split("T")[0]
        : "",
    });

    setEditModal(true);
  };

  return (
    <div className="w-full min-h-screen px-1 py-4 bg-slate-50">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">
            User Management
          </h2>
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
          placeholder="ค้นหา username / ชื่อ / รหัสพนักงาน / เบอร์โทร"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-modern w-[320px]"
          onKeyDown={(e) => {
            if (e.key === "Enter") fetchData();
          }}
        />

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="input-modern w-[180px]"
        >
          <option value="">ทุก role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
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

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-auto">
        <table className="min-w-[1280px] w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="py-4 text-center w-12">#</th>
              <th className="text-left py-4">รหัสพนักงาน</th>
              <th className="text-left py-4">Username</th>
              <th className="text-left py-4">ชื่อ - นามสกุล</th>
              <th className="text-left py-4 hidden md:table-cell">Email</th>
              <th className="text-left py-4 hidden md:table-cell">เบอร์โทร</th>
              <th className="text-left py-4 hidden md:table-cell">ตำแหน่ง</th>
              <th className="text-left py-4 hidden lg:table-cell">สังกัด</th>
              <th className="text-center py-4 hidden lg:table-cell">
                เลขที่ใบขับขี่
              </th>
              <th className="text-center py-4 hidden lg:table-cell">
                ใบขับขี่หมดอายุ
              </th>
              <th className="text-center py-4">สถานะ</th>
              <th className="text-left w-24">จัดการ</th>
            </tr>
          </thead>

          <tbody className="text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={12} className="text-center py-10 text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-10 text-slate-400">
                  ไม่มีข้อมูล
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr
                  key={r.id}
                  className="border-t hover:bg-slate-50 transition"
                >
                  <td className="text-center text-slate-400 py-2.5">
                    {i + 1}
                  </td>

                  <td className="py-2.5 font-medium">
                    {r.employee_code || "-"}
                  </td>

                  <td className="font-medium py-2.5">{r.username}</td>

                  <td className="py-2.5">
                    <div className="leading-tight">
                      <div>
                        {r.title_name ? `${r.title_name} ` : ""}
                        {r.first_name || "-"} {r.last_name || ""}
                      </div>

                      <div className="text-xs text-slate-400 md:hidden">
                        {r.role_name || "-"} / {r.tel || "-"}
                      </div>

                      <div className="text-xs text-slate-400 lg:hidden">
                        {r.email || "-"}
                      </div>
                    </div>
                  </td>

                  <td className="text-slate-500 py-2.5 hidden md:table-cell">
                    {r.email || "-"}
                  </td>

                  <td className="text-slate-500 py-2.5 hidden md:table-cell">
                    {r.tel || "-"}
                  </td>

                  <td className="py-2.5 hidden md:table-cell">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                      {r.role_name || "-"}
                    </span>
                  </td>

                  <td className="text-slate-500 py-2.5 hidden lg:table-cell">
                    {r.warehouse_name || "-"}
                  </td>

                  <td className="text-slate-500 py-2.5 hidden lg:table-cell">
                    {r.license_no || "-"}
                  </td>

                  <td className="text-slate-500 py-2.5 hidden lg:table-cell">
                    {r.license_expire
                      ? new Date(r.license_expire).toLocaleDateString(
                          "th-TH",
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          },
                        )
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
                        r.is_active
                          ? "bg-green-100 text-green-600 hover:bg-green-200"
                          : "bg-red-100 text-red-500 hover:bg-red-200"
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
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={closeCreateModal}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-xl w-[720px] max-h-[90vh] overflow-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-5">
              เพิ่มผู้ใช้
            </h3>

            {error && (
              <div className="mb-4 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <RequiredLabel required>Username</RequiredLabel>
                <input
                  className="input-modern w-full"
                  placeholder="Username"
                  value={form.username}
                  onChange={(e) =>
                    handleChange("username", cleanCodeInput(e.target.value))
                  }
                />
              </div>

              <div>
                <RequiredLabel>Password</RequiredLabel>
                <p className="text-sm mt-2 text-blue-600">
                  Password 123456 สามารถเปลี่ยนได้ภายหลัง
                </p>
              </div>

              <div>
                <RequiredLabel required>รหัสพนักงาน</RequiredLabel>
                <input
                  className="input-modern w-full"
                  placeholder="รหัสพนักงาน"
                  value={form.employee_code}
                  onChange={(e) =>
                    handleChange(
                      "employee_code",
                      cleanCodeInput(e.target.value),
                    )
                  }
                />
              </div>

              <div>
                <RequiredLabel required>คำนำหน้า</RequiredLabel>
                <select
                  className="input-modern w-full"
                  value={form.title_name}
                  onChange={(e) => handleChange("title_name", e.target.value)}
                >
                  <option value="">เลือกคำนำหน้า</option>
                  {titleOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <RequiredLabel required>ชื่อ</RequiredLabel>
                <input
                  className="input-modern w-full"
                  placeholder="ชื่อ"
                  value={form.first_name}
                  onChange={(e) =>
                    handleChange("first_name", cleanNameInput(e.target.value))
                  }
                />
              </div>

              <div>
                <RequiredLabel required>นามสกุล</RequiredLabel>
                <input
                  className="input-modern w-full"
                  placeholder="นามสกุล"
                  value={form.last_name}
                  onChange={(e) =>
                    handleChange("last_name", cleanNameInput(e.target.value))
                  }
                />
              </div>

              <div>
                <RequiredLabel required>เพศ</RequiredLabel>
                <select
                  className="input-modern w-full"
                  value={form.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                >
                  <option value="">เลือกเพศ</option>
                  {genderOptions.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <RequiredLabel>เลขบัตรประชาชน</RequiredLabel>
                <input
                  className="input-modern w-full"
                  placeholder="เลขบัตรประชาชน"
                  value={form.citizen_id}
                  maxLength={13}
                  onChange={(e) =>
                    handleChange(
                      "citizen_id",
                      cleanNumberInput(e.target.value).slice(0, 13),
                    )
                  }
                />
              </div>

              <div>
                <RequiredLabel>Email</RequiredLabel>
                <input
                  className="input-modern w-full"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) =>
                    handleChange("email", cleanEmailInput(e.target.value))
                  }
                />
              </div>

              <div>
                <RequiredLabel>เบอร์โทร</RequiredLabel>
                <input
                  className="input-modern w-full"
                  placeholder="เบอร์โทร"
                  value={form.tel}
                  onChange={(e) =>
                    handleChange("tel", cleanNumberInput(e.target.value))
                  }
                />
              </div>

              <div>
                <RequiredLabel required>Role</RequiredLabel>
                <select
                  className="input-modern w-full"
                  value={form.role_id}
                  onChange={(e) => handleChange("role_id", e.target.value)}
                >
                  <option value="">เลือก role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {![3, 4, 6, 9, 10].includes(Number(form.role_id)) && (
                <div>
                  <RequiredLabel required>Warehouse</RequiredLabel>
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
              )}
            </div>

            {Number(form.role_id) === 7 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <RequiredLabel required>เลขใบขับขี่</RequiredLabel>
                  <input
                    className="input-modern w-full"
                    placeholder="เลขใบขับขี่"
                    value={form.license_no}
                    onChange={(e) =>
                      handleChange(
                        "license_no",
                        cleanCodeInput(e.target.value),
                      )
                    }
                  />
                </div>

                <div>
                  <RequiredLabel required>วันหมดอายุใบขับขี่</RequiredLabel>
                  <DatePicker
                    selected={
                      form.license_expire
                        ? new Date(form.license_expire)
                        : null
                    }
                    onChange={(date: Date | null) =>
                      handleChange(
                        "license_expire",
                        date ? date.toISOString().split("T")[0] : "",
                      )
                    }
                    className="input-modern w-full"
                    wrapperClassName="w-full"
                    placeholderText="วันหมดอายุใบขับขี่"
                    dateFormat="yyyy-MM-dd"
                  />
                </div>
              </div>
            )}

            {Number(form.role_id) === 3 && (
              <div className="mt-5">
                <RequiredLabel required>Zones</RequiredLabel>

                <div className="grid grid-cols-2 gap-2 border border-slate-200 rounded-xl p-3">
                  {zones.map((z) => (
                    <label
                      key={z.id}
                      className="flex items-center gap-2 text-sm text-slate-600"
                    >
                      <input
                        type="checkbox"
                        checked={selectedZones.includes(z.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedZones([...selectedZones, z.id]);
                          } else {
                            setSelectedZones(
                              selectedZones.filter((x) => x !== z.id),
                            );
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

      {/* EDIT MODAL */}
      {editModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={closeEditModal}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-xl w-[720px] max-h-[90vh] overflow-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-1">
              แก้ไขผู้ใช้
            </h3>

            <p className="text-sm text-slate-500 mb-5">
              {editingUser?.username || "-"}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <RequiredLabel required>รหัสพนักงาน</RequiredLabel>
                <input
                  className="input-modern w-full"
                  placeholder="รหัสพนักงาน"
                  value={editForm.employee_code}
                  onChange={(e) =>
                    handleEditChange(
                      "employee_code",
                      cleanCodeInput(e.target.value),
                    )
                  }
                />
              </div>

              <div>
                <RequiredLabel required>คำนำหน้า</RequiredLabel>
                <select
                  className="input-modern w-full"
                  value={editForm.title_name}
                  onChange={(e) =>
                    handleEditChange("title_name", e.target.value)
                  }
                >
                  <option value="">เลือกคำนำหน้า</option>
                  {titleOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <RequiredLabel required>ชื่อ</RequiredLabel>
                <input
                  className="input-modern w-full"
                  placeholder="ชื่อ"
                  value={editForm.first_name}
                  onChange={(e) =>
                    handleEditChange(
                      "first_name",
                      cleanNameInput(e.target.value),
                    )
                  }
                />
              </div>

              <div>
                <RequiredLabel required>นามสกุล</RequiredLabel>
                <input
                  className="input-modern w-full"
                  placeholder="นามสกุล"
                  value={editForm.last_name}
                  onChange={(e) =>
                    handleEditChange(
                      "last_name",
                      cleanNameInput(e.target.value),
                    )
                  }
                />
              </div>

              <div>
                <RequiredLabel required>เพศ</RequiredLabel>
                <select
                  className="input-modern w-full"
                  value={editForm.gender}
                  onChange={(e) => handleEditChange("gender", e.target.value)}
                >
                  <option value="">เลือกเพศ</option>
                  {genderOptions.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <RequiredLabel>เลขบัตรประชาชน</RequiredLabel>
                <input
                  className="input-modern w-full"
                  placeholder="เลขบัตรประชาชน"
                  value={editForm.citizen_id}
                  maxLength={13}
                  onChange={(e) =>
                    handleEditChange(
                      "citizen_id",
                      cleanNumberInput(e.target.value).slice(0, 13),
                    )
                  }
                />
              </div>

              <div>
                <RequiredLabel>Email</RequiredLabel>
                <input
                  className="input-modern w-full"
                  placeholder="Email"
                  value={editForm.email}
                  onChange={(e) =>
                    handleEditChange(
                      "email",
                      cleanEmailInput(e.target.value),
                    )
                  }
                />
              </div>

              <div>
                <RequiredLabel>เบอร์โทร</RequiredLabel>
                <input
                  className="input-modern w-full"
                  placeholder="เบอร์โทร"
                  value={editForm.tel}
                  onChange={(e) =>
                    handleEditChange(
                      "tel",
                      cleanNumberInput(e.target.value),
                    )
                  }
                />
              </div>

              <div>
                <RequiredLabel>เลขใบขับขี่</RequiredLabel>
                <input
                  className="input-modern w-full"
                  placeholder="เลขใบขับขี่"
                  value={editForm.license_no}
                  onChange={(e) =>
                    handleEditChange(
                      "license_no",
                      cleanCodeInput(e.target.value),
                    )
                  }
                />
              </div>

              <div>
                <RequiredLabel>วันหมดอายุใบขับขี่</RequiredLabel>
                <DatePicker
                  selected={
                    editForm.license_expire
                      ? new Date(editForm.license_expire)
                      : null
                  }
                  onChange={(date: Date | null) =>
                    handleEditChange(
                      "license_expire",
                      date ? date.toISOString().split("T")[0] : "",
                    )
                  }
                  className="input-modern w-full"
                  wrapperClassName="w-full"
                  placeholderText="วันหมดอายุใบขับขี่"
                  dateFormat="yyyy-MM-dd"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleUpdateUser}
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
          onClick={closeStatusModal}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-2xl shadow-xl w-[300px]"
          >
            <h3 className="text-lg font-semibold mb-1 text-slate-800">
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