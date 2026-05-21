import { useEffect, useState } from "react";
import AxiosInstance from "../utils/AxiosInstance";
import { useAuth } from "../context/AuthContext";
import { Pencil, X } from "lucide-react";

export default function ManageCustomers() {
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const [statusModal, setStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<{
    id: number;
    current: number;
  } | null>(null);

  const [form, setForm] = useState({
    code: "",
    name: "",
    tax_id: "",
    address: "",
    subdistrict_id: "",
    district_id: "",
    province_id: "",
    zip_code: "",
    tel: "",
    line: "",
    contact_name: "",
    contact_tel: "",
    email: "",
    type: "EXPRESS",
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
        params: {
          search: search || undefined,
        },
      });

      setRows(res.data);
    } finally {
      setLoading(false);
    }
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
  const resetCustomerForm = () => {
    setForm({
      code: "",
      name: "",
      tax_id: "",
      address: "",
      subdistrict_id: "",
      district_id: "",
      province_id: "",
      zip_code: "",
      tel: "",
      line: "",
      contact_name: "",
      contact_tel: "",
      email: "",
      type: "EXPRESS",
    });
  };

  const resetUserForm = () => {
    setUserForm({
      username: "",
      password: "",
      first_name: "",
      last_name: "",
    });
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    resetCustomerForm();
    setShowModal(true);
  };

  const openEditModal = (row: any) => {
    setEditingCustomer(row);

    setForm({
      code: row.code || "",
      name: row.name || "",
      tax_id: row.tax_id || "",
      address: row.address || "",
      subdistrict_id: row.subdistrict_id || "",
      district_id: row.district_id || "",
      province_id: row.province_id || "",
      zip_code: row.zip_code || "",
      tel: row.tel || "",
      line: row.line || "",
      contact_name: row.contact_name || "",
      contact_tel: row.contact_tel || "",
      email: row.email || "",
      type: row.type || "EXPRESS",
    });

    setShowModal(true);
  };

  const closeCustomerModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    resetCustomerForm();
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedCustomer(null);
    resetUserForm();
  };

  const closeStatusModal = () => {
    setStatusModal(false);
    setSelectedStatus(null);
  };

  const closeConfirmDelete = () => {
    setConfirmDelete(null);
  };

  // =====================
  // CREATE / UPDATE CUSTOMER
  // =====================
const handleSaveCustomer = async () => {
  try {
    if (editingCustomer) {
      await AxiosInstance.patch(`/manage/customers/${editingCustomer.id}`, form);
    } else {
      await AxiosInstance.post("/manage/customers", form);
    }

    closeCustomerModal();
    fetchData();
  } catch (err: any) {
    alert(err?.response?.data?.message || "save customer failed");
  }
};

  // =====================
  // STATUS
  // =====================
  const openStatusModal = (row: any) => {
    setSelectedStatus({
      id: row.id,
      current: Number(row.is_active),
    });

    setStatusModal(true);
  };

  const changeStatus = async (isActive: number) => {
    if (!selectedStatus) return;

    try {
      await AxiosInstance.patch(`/manage/customers/${selectedStatus.id}/status`, {
        is_active: isActive,
      });

      closeStatusModal();
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "update status failed");
    }
  };

  // =====================
  // CREATE CUSTOMER USER
  // =====================
  const openUserModal = (row: any) => {
    setSelectedCustomer(row);
    resetUserForm();
    setShowUserModal(true);
  };

  const handleCreateUser = async () => {
    if (!selectedCustomer) return;

    try {
      await AxiosInstance.post("/manage/customer-users", {
        ...userForm,
        customer_id: selectedCustomer.id,
      });

      closeUserModal();
    } catch (err: any) {
      alert(err?.response?.data?.message || "create user failed");
    }
  };

  // =====================
  // HARD DELETE
  // =====================
  const handleHardDelete = async () => {
    if (!confirmDelete) return;

    try {
      await AxiosInstance.delete(`/manage/customers/${confirmDelete.id}/hard`);

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
          <h2 className="text-2xl font-semibold text-slate-800">Customer Management</h2>
          <p className="text-sm text-slate-500">จัดการลูกค้าในระบบ</p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
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
          onKeyDown={(e) => {
            if (e.key === "Enter") fetchData();
          }}
        />

        <button type="button" onClick={fetchData} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
          ค้นหา
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-auto">
        <table className="min-w-[1000px] w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="py-4 text-center w-12">#</th>
              <th className="text-left py-4">Code</th>
              <th className="text-left py-4">Name</th>
              <th className="text-left py-4">Type</th>
              <th className="text-left py-4 hidden md:table-cell">Tax ID</th>
              <th className="text-left py-4 hidden lg:table-cell">Address</th>
              <th className="text-left py-4 hidden lg:table-cell">Contact</th>
              <th className="text-left py-4 hidden lg:table-cell">Tel</th>
              <th className="text-center py-4">Status</th>
              <th className="text-center w-32">จัดการ</th>
            </tr>
          </thead>

          <tbody className="text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center py-10 text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-10 text-slate-400">
                  ไม่มีข้อมูล
                </td>
              </tr>
            ) : (
              rows.map((r: any, i) => (
                <tr key={r.id} className="border-t hover:bg-slate-50">
                  <td className="text-center text-slate-400 py-3">{i + 1}</td>

                  <td className="py-3 font-medium">{r.code}</td>

                  <td className="py-3">
                    <div className="leading-tight">
                      <div>{r.name}</div>

                      <div className="text-xs text-slate-400 md:hidden">
                        {r.contact_name || "-"} / {r.contact_tel || "-"}
                      </div>
                    </div>
                  </td>

                  <td className="py-3">
                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                      {r.type || "-"}
                    </span>
                  </td>

                  <td className="py-3 hidden md:table-cell">{r.tax_id || "-"}</td>

                  <td className="py-3 hidden lg:table-cell">{r.address || "-"}</td>

                  <td className="py-3 hidden lg:table-cell">{r.contact_name || "-"}</td>

                  <td className="py-3 hidden lg:table-cell">{r.contact_tel || r.tel || "-"}</td>

                  <td className="text-center py-3">
                    <button type="button" onClick={() => openStatusModal(r)} className="inline-block">
                      {Number(r.is_active) === 1 ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600 font-medium hover:bg-green-200 cursor-pointer">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-500 font-medium hover:bg-red-200 cursor-pointer">
                          Inactive
                        </span>
                      )}
                    </button>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        onClick={() => openEditModal(r)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100"
                      >
                        <Pencil size={14} />
                      </button>

                      {[1, 10].includes(Number(user?.role_id)) && (
                        <button
                          type="button"
                          onClick={() => openUserModal(r)}
                          className="px-2 text-xs rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
                        >
                          + User
                        </button>
                      )}

                      {[1, 10].includes(Number(user?.role_id)) && (
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

      {/* CREATE / EDIT CUSTOMER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeCustomerModal}>
          <div
            className="bg-white p-6 rounded-2xl shadow-xl w-[620px] max-h-[90vh] overflow-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-5">
              {editingCustomer ? "แก้ไขลูกค้า" : "เพิ่มลูกค้า"}
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="input-modern w-full" placeholder="Code" value={form.code} onChange={(e) => handleChange("code", e.target.value)} />

                <input className="input-modern w-full" placeholder="Name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} />

                <select className="input-modern w-full" value={form.type} onChange={(e) => handleChange("type", e.target.value)}>
                  <option value="EXPRESS">EXPRESS</option>
                  <option value="BUSINESS">BUSINESS</option>
                </select>

                <input
                  className="input-modern w-full"
                  placeholder="Tax ID"
                  value={form.tax_id}
                  onChange={(e) => handleChange("tax_id", e.target.value)}
                />

                <input className="input-modern w-full" placeholder="Tel" value={form.tel} onChange={(e) => handleChange("tel", e.target.value)} />

                <input className="input-modern w-full" placeholder="Line" value={form.line} onChange={(e) => handleChange("line", e.target.value)} />

                <input className="input-modern w-full" placeholder="Email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />

                <input
                  className="input-modern w-full"
                  placeholder="Zip Code"
                  value={form.zip_code}
                  onChange={(e) => handleChange("zip_code", e.target.value)}
                />

                <input
                  className="input-modern w-full"
                  placeholder="Subdistrict ID"
                  value={form.subdistrict_id}
                  onChange={(e) => handleChange("subdistrict_id", e.target.value)}
                />

                <input
                  className="input-modern w-full"
                  placeholder="District ID"
                  value={form.district_id}
                  onChange={(e) => handleChange("district_id", e.target.value)}
                />

                <input
                  className="input-modern w-full"
                  placeholder="Province ID"
                  value={form.province_id}
                  onChange={(e) => handleChange("province_id", e.target.value)}
                />

                <input
                  className="input-modern w-full"
                  placeholder="Contact Name"
                  value={form.contact_name}
                  onChange={(e) => handleChange("contact_name", e.target.value)}
                />

                <input
                  className="input-modern w-full"
                  placeholder="Contact Tel"
                  value={form.contact_tel}
                  onChange={(e) => handleChange("contact_tel", e.target.value)}
                />
              </div>

              <textarea
                className="input-modern w-full min-h-[90px]"
                placeholder="Address"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={closeCustomerModal} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">
                ยกเลิก
              </button>

              <button type="button" onClick={handleSaveCustomer} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
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
                disabled={selectedStatus?.current === 1}
                onClick={() => changeStatus(1)}
                className={`px-4 py-2 rounded-lg ${
                  selectedStatus?.current === 1 ? "bg-green-50 text-green-300 cursor-not-allowed" : "bg-green-100 text-green-600 hover:bg-green-200"
                }`}
              >
                Active
              </button>

              <button
                type="button"
                disabled={selectedStatus?.current === 0}
                onClick={() => changeStatus(0)}
                className={`px-4 py-2 rounded-lg ${
                  selectedStatus?.current === 0 ? "bg-red-50 text-red-300 cursor-not-allowed" : "bg-red-100 text-red-500 hover:bg-red-200"
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={closeConfirmDelete}>
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center w-[320px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">ยืนยันการลบ</h3>

            <p className="text-sm text-slate-500 mb-4">ลบลูกค้ารายนี้?</p>

            <div className="flex justify-center gap-3">
              <button type="button" onClick={handleHardDelete} className="px-4 py-2 rounded-xl text-white bg-red-500 hover:bg-red-600">
                ยืนยัน
              </button>

              <button type="button" onClick={closeConfirmDelete} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CUSTOMER USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeUserModal}>
          <div className="bg-white p-6 rounded-2xl shadow-xl w-[400px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 mb-5">เพิ่ม User ให้ {selectedCustomer?.name}</h3>

            <div className="space-y-3">
              <input
                className="input-modern w-full"
                placeholder="Username"
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
              />

              <input
                className="input-modern w-full"
                type="password"
                placeholder="Password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              />

              <input
                className="input-modern w-full"
                placeholder="First Name"
                value={userForm.first_name}
                onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
              />

              <input
                className="input-modern w-full"
                placeholder="Last Name"
                value={userForm.last_name}
                onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={closeUserModal} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">
                ยกเลิก
              </button>

              <button type="button" onClick={handleCreateUser} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}