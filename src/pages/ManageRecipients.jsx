import { useEffect, useState } from "react";
import AxiosInstance from "../utils/AxiosInstance";
import { useAuth } from "../context/AuthContext";
import { X, Pencil } from "lucide-react";

export default function ManageRecipients() {
  const { user } = useAuth();

  const isCustomer = Number(user?.role_id) === 2;
  const canSelectCustomer = !isCustomer;

  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const emptyForm = {
    recipient_code: "",
    recipient_type_id: "",
    recipient_name: "",
  };

  const [form, setForm] = useState(emptyForm);

  const selectedCustomer = customers.find(
    (c) => String(c.id) === String(customerId)
  );

  const handleChange = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const fetchCustomers = async () => {
    try {
      const res = await AxiosInstance.get("/manage/customers");
      setCustomers(res.data || []);

      if (res.data?.length > 0) {
        setCustomerId((prev) => prev || String(res.data[0].id));
      }
    } catch (err) {
      alert(err?.response?.data?.message || "fetch customers failed");
    }
  };

  const fetchData = async () => {
    if (!customerId) return;

    try {
      setLoading(true);

      const res = await AxiosInstance.get(
        `/manage/customers/${customerId}/recipients`,
        {
          params: {
            search: search || undefined,
          },
        }
      );

      setRows(res.data || []);
    } catch (err) {
      alert(err?.response?.data?.message || "fetch recipients failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    if (isCustomer) {
      if (user.customer_id) {
        setCustomerId(String(user.customer_id));
      }
      return;
    }

    fetchCustomers();
  }, [user]);

  useEffect(() => {
    if (customerId) fetchData();
  }, [customerId]);

  const openCreate = () => {
    if (!customerId) {
      alert("กรุณาเลือก customer ก่อน");
      return;
    }

    resetForm();
    setShowModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);

    setForm({
      recipient_code: row.recipient_code || "",
      recipient_type_id: row.recipient_type_id || "",
      recipient_name: row.recipient_name || "",
    });

    setShowModal(true);
  };

  const handleSave = async () => {
    if (!customerId) {
      alert("กรุณาเลือก customer ก่อน");
      return;
    }

    if (!form.recipient_code || !form.recipient_name) {
      alert("กรุณากรอก recipient code และ recipient name");
      return;
    }

    try {
      if (editing) {
        await AxiosInstance.patch(
          `/manage/customers/${customerId}/recipients/${editing.recipient_id}`,
          form
        );
      } else {
        await AxiosInstance.post(
          `/manage/customers/${customerId}/recipients`,
          form
        );
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "save recipient failed");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete || !customerId) return;

    try {
      await AxiosInstance.delete(
        `/manage/customers/${customerId}/recipients/${confirmDelete.recipient_id}`
      );

      setConfirmDelete(null);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "delete recipient failed");
    }
  };

  return (
    <div className="w-full min-h-screen px-1 py-4 bg-slate-50">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">
            Recipient Management
          </h2>
          <p className="text-sm text-slate-500">
            {isCustomer ? (
              <>จัดการผู้รับของคุณ</>
            ) : (
              <>
                จัดการผู้รับของลูกค้า
                {selectedCustomer ? (
                  <span className="font-medium text-slate-700">
                    {" "}
                    {selectedCustomer.name}
                  </span>
                ) : null}
              </>
            )}
          </p>
        </div>

        <button
          onClick={openCreate}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white shadow hover:bg-blue-700 transition"
        >
          + เพิ่มผู้รับ
        </button>
      </div>

      {/* FILTER CARD */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-5 flex gap-3 flex-wrap">
        {canSelectCustomer && (
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="input-modern w-[280px]"
          >
            <option value="">เลือก Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        )}

        <input
          placeholder="ค้นหา code / ชื่อผู้รับ"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-modern w-[260px]"
          onKeyDown={(e) => {
            if (e.key === "Enter") fetchData();
          }}
        />

        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
        >
          ค้นหา
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-auto">
        <table className="min-w-[700px] w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="py-4 text-center w-12">#</th>
              <th className="text-left py-4">Code</th>
              <th className="text-left py-4">Name</th>
              <th className="text-left py-4 hidden md:table-cell">Type ID</th>
              <th className="text-center py-4">Status</th>
              <th className="text-center w-28">จัดการ</th>
            </tr>
          </thead>

          <tbody className="text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">
                  ไม่มีข้อมูล
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr
                  key={r.recipient_id}
                  className="border-t hover:bg-slate-50"
                >
                  <td className="text-center text-slate-400 py-3">{i + 1}</td>

                  <td className="py-3 font-medium">
                    {r.recipient_code || "-"}
                  </td>

                  <td className="py-3">
                    <div className="leading-tight">
                      <div>{r.recipient_name || "-"}</div>
                      <div className="text-xs text-slate-400 md:hidden">
                        Type: {r.recipient_type_id || "-"}
                      </div>
                    </div>
                  </td>

                  <td className="py-3 hidden md:table-cell">
                    {r.recipient_type_id || "-"}
                  </td>

                  <td className="text-center py-3">
                    {r.is_deleted === "N" ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600 font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-500 font-medium">
                        Deleted
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => openEdit(r)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        onClick={() => setConfirmDelete(r)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-[420px] animate-scaleIn">
            <h3 className="text-lg font-semibold text-slate-800 mb-5">
              {editing ? "แก้ไขผู้รับ" : "เพิ่มผู้รับ"}
            </h3>

            <div className="space-y-3">
              <input
                className="input-modern w-full"
                placeholder="Recipient Code *"
                value={form.recipient_code}
                onChange={(e) =>
                  handleChange("recipient_code", e.target.value)
                }
              />

              <input
                className="input-modern w-full"
                placeholder="Recipient Name *"
                value={form.recipient_name}
                onChange={(e) =>
                  handleChange("recipient_name", e.target.value)
                }
              />

              <input
                className="input-modern w-full"
                placeholder="Recipient Type ID"
                value={form.recipient_type_id}
                onChange={(e) =>
                  handleChange("recipient_type_id", e.target.value)
                }
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
              >
                ยกเลิก
              </button>

              <button
                onClick={handleSave}
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
          <div className="bg-white p-6 rounded-2xl shadow-xl text-center w-[340px]">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              ลบผู้รับ
            </h3>

            <p className="text-sm text-slate-500 mb-4">
              ลบผู้รับ {confirmDelete.recipient_name} ?
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl text-white bg-red-500"
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
    </div>
  );
}