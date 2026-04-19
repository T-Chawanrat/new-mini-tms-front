import { useEffect, useState } from "react";
import AxiosInstance from "../utils/AxiosInstance";
import { useAuth } from "../context/AuthContext";
import { TrashIcon, X } from "lucide-react";

export default function ManageCustomers() {
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [form, setForm] = useState({
    code: "",
    name: "",
    tax_id: "",
    address: "",
    contact_name: "",
    contact_tel: "",
  });

  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
  });

  // =====================
  // FETCH
  // =====================
  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await AxiosInstance.get("/manage/customers", {
        params: { search: search || undefined },
        headers: { role_id: user?.role_id },
      });

      setRows(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  // =====================
  // CREATE
  // =====================
  const handleCreate = async () => {
    await AxiosInstance.post("/manage/customers", form, {
      headers: { role_id: user?.role_id },
    });

    setShowModal(false);
    setForm({
      code: "",
      name: "",
      tax_id: "",
      address: "",
      contact_name: "",
      contact_tel: "",
    });

    fetchData();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    await AxiosInstance.delete(`/manage/customers/${confirmDelete}`, {
      headers: { role_id: user?.role_id },
    });

    setConfirmDelete(null);
    fetchData();
  };

  const handleCreateUser = async () => {
    if (!selectedCustomer) return;

    try {
      await AxiosInstance.post(
        "/manage/customer-users",
        {
          ...userForm,
          customer_id: selectedCustomer.id,
        },
        {
          headers: { role_id: user?.role_id },
        },
      );

      setShowUserModal(false);
      setUserForm({
        username: "",
        password: "",
        first_name: "",
        last_name: "",
      });
    } catch (err) {
      alert(err?.response?.data?.message || "create user failed");
    }
  };

  const handleHardDelete = async () => {
    if (!confirmDelete) return;

    try {
      await AxiosInstance.delete(`/manage/customers/${confirmDelete.id}/hard`, {
        headers: { role_id: user?.role_id },
      });

      setConfirmDelete(null);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "hard delete failed");
    }
  };

  return (
    <div className="w-full min-h-screen px-1 py-4 bg-slate-50">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">
            Customer Management
          </h2>
          <p className="text-sm text-slate-500">จัดการลูกค้าในระบบ</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white shadow hover:bg-blue-700 transition"
        >
          + เพิ่มลูกค้า
        </button>
      </div>

      {/* FILTER CARD */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-5 flex gap-3 flex-wrap">
        <input
          placeholder="ค้นหา code / ชื่อ"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-modern w-[220px]"
        />

        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
        >
          ค้นหา
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="py-4 text-center w-12">#</th>
              <th className="text-left py-4">Code</th>
              <th className="text-left py-4">Name</th>
              <th className="text-left py-4">Tax ID</th>
              <th className="text-left py-4">Address</th>
              <th className="text-left py-4">Contact</th>
              <th className="text-left py-4">Tel</th>
              <th className="text-center py-4">Status</th>
              <th className="text-center w-12">จัดการ</th>
            </tr>
          </thead>

          <tbody className="text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400">
                  ไม่มีข้อมูล
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id} className="border-t hover:bg-slate-50">
                  <td className="text-center text-slate-400 py-4">{i + 1}</td>

                  <td className="py-4 font-medium">{r.code}</td>
                  <td className="py-4">{r.name}</td>
                  <td className="py-4">{r.tax_id || "-"}</td>
                  <td className="py-4">{r.address || "-"}</td>
                  <td className="py-4">{r.contact_name || "-"}</td>
                  <td className="py-4">{r.contact_tel || "-"}</td>
                  <td className="text-center py-4">
                    {r.is_active ? (
                      <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-600 font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-500 font-medium">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="text-right py-4 px-4">
                    <div className="flex gap-2 justify-end">
                      {[1, 10].includes(user?.role_id) && (
                        <button
                          onClick={() => {
                            setSelectedCustomer(r);
                            setShowUserModal(true);
                          }}
                          className="px-2 text-xs rounded-lg 
                   bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
                        >
                          + User
                        </button>
                      )}

                      <button
                        onClick={() => setConfirmDelete({ id: r.id })}
                        className="
      w-8 h-8 flex items-center justify-center
      rounded-lg bg-red-50 text-red-600 border border-red-200 
      hover:bg-red-100
    "
                      >
                        <X size={14} />
                      </button>

                      {[1, 10].includes(user?.role_id) && (
                        <button
                          onClick={() =>
                            setConfirmDelete({ id: r.id, type: "hard" })
                          }
                          className="
                          px-2 text-xs rounded-lg
                        bg-red-300 text-red-600 border border-red-200 
                        hover:bg-red-100"
                        >
                          <TrashIcon size={14} />
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-[420px] animate-scaleIn">
            <h3 className="text-lg font-semibold text-slate-800 mb-5">
              เพิ่มลูกค้า
            </h3>

            <div className="space-y-3">
              <input
                className="input-modern w-full"
                placeholder="Code"
                value={form.code}
                onChange={(e) => handleChange("code", e.target.value)}
              />

              <input
                className="input-modern w-full"
                placeholder="Name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />

              <input
                className="input-modern w-full"
                placeholder="Tax ID"
                onChange={(e) => handleChange("tax_id", e.target.value)}
              />

              <input
                className="input-modern w-full"
                placeholder="Address"
                onChange={(e) => handleChange("address", e.target.value)}
              />

              <input
                className="input-modern w-full"
                placeholder="Contact Name"
                onChange={(e) => handleChange("contact_name", e.target.value)}
              />

              <input
                className="input-modern w-full"
                placeholder="Contact Tel"
                onChange={(e) => handleChange("contact_tel", e.target.value)}
              />
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
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center w-[320px]">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {confirmDelete.type === "hard" ? "ยืนยันการลบ" : "ปิดการใช้งาน"}
            </h3>

            <p className="text-sm text-slate-500 mb-4">
              {confirmDelete.type === "hard"
                ? "ลบลูกค้ารายนี้?"
                : "ปิดการใช้งานลูกค้ารายนี้?"}
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() =>
                  confirmDelete.type === "hard"
                    ? handleHardDelete()
                    : handleDelete()
                }
                className={`px-4 py-2 rounded-xl text-white ${
                  confirmDelete.type === "hard" ? "bg-red-500" : "bg-red-500"
                }`}
              >
                ยืนยัน
              </button>

              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-xl bg-gray-100"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-[400px]">
            <h3 className="text-lg font-semibold text-slate-800 mb-5">
              เพิ่ม User ให้ {selectedCustomer?.name}
            </h3>

            <div className="space-y-3">
              <input
                className="input-modern w-full"
                placeholder="Username"
                value={userForm.username}
                onChange={(e) =>
                  setUserForm({ ...userForm, username: e.target.value })
                }
              />

              <input
                className="input-modern w-full"
                type="password"
                placeholder="Password"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
              />

              <input
                className="input-modern w-full"
                placeholder="First Name"
                value={userForm.first_name}
                onChange={(e) =>
                  setUserForm({ ...userForm, first_name: e.target.value })
                }
              />

              <input
                className="input-modern w-full"
                placeholder="Last Name"
                value={userForm.last_name}
                onChange={(e) =>
                  setUserForm({ ...userForm, last_name: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
              >
                ยกเลิก
              </button>

              <button
                onClick={handleCreateUser}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
