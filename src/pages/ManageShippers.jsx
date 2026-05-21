import { useEffect, useState } from "react";
import AxiosInstance from "../utils/AxiosInstance";
import { useAuth } from "../context/AuthContext";
import AddressSearchDropdown from "../components/dropdown/AddressSearchDropdown";
import { Pencil } from "lucide-react";

export default function ManageShippers() {
  const { user } = useAuth();

  const roleId = Number(user?.role_id);
  const isCustomer = roleId === 2;
  const canSelectCustomer = roleId === 1 || roleId === 11;

  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [statusModal, setStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const emptyForm = {
    shipper_code: "",
    shipper_type_id: "",
    shipper_name: "",
    address: "",

    subdistrict_id: "",
    district_id: "",
    province_id: "",

    subdistrict_name: "",
    district_name: "",
    province_name: "",

    zip_code: "",
    tel: "",
    fax: "",
  };

  const [form, setForm] = useState(emptyForm);

  const selectedCustomer = customers.find((c) => String(c.id) === String(customerId));

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const clearAddress = () => {
    setForm((prev) => ({
      ...prev,
      subdistrict_id: "",
      district_id: "",
      province_id: "",
      subdistrict_name: "",
      district_name: "",
      province_name: "",
      zip_code: "",
    }));
  };

  const handleSelectAddress = (row) => {
    setForm((prev) => ({
      ...prev,

      subdistrict_id: row.subdistrict_id || "",
      district_id: row.district_id || "",
      province_id: row.province_id || "",

      subdistrict_name: row.subdistrict_name || "",
      district_name: row.district_name || "",
      province_name: row.province_name || "",

      zip_code: row.zip_code || "",
    }));
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

      const res = await AxiosInstance.get(`/manage/customers/${customerId}/shippers`, {
        params: {
          search: search || undefined,
        },
      });

      setRows(res.data || []);
    } catch (err) {
      alert(err?.response?.data?.message || "fetch shippers failed");
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

    if (canSelectCustomer) {
      fetchCustomers();
    }
  }, [user]);

  useEffect(() => {
    if (customerId) {
      fetchData();
    }
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
      shipper_code: row.shipper_code || "",
      shipper_type_id: row.shipper_type_id || "",
      shipper_name: row.shipper_name || "",
      address: row.address || "",

      subdistrict_id: row.subdistrict_id || "",
      district_id: row.district_id || "",
      province_id: row.province_id || "",

      subdistrict_name: row.subdistrict_name || "",
      district_name: row.district_name || "",
      province_name: row.province_name || "",

      zip_code: row.zip_code || "",
      tel: row.tel || "",
      fax: row.fax || "",
    });

    setShowModal(true);
  };

  const handleSave = async () => {
    if (!customerId) {
      alert("กรุณาเลือก customer ก่อน");
      return;
    }

    if (!form.shipper_code || !form.shipper_name) {
      alert("กรุณากรอก shipper code และ shipper name");
      return;
    }

    if (!form.subdistrict_id || !form.district_id || !form.province_id) {
      alert("กรุณาเลือกตำบล / อำเภอ / จังหวัด จาก dropdown");
      return;
    }

    const payload = {
      shipper_code: form.shipper_code,
      shipper_type_id: form.shipper_type_id || null,
      shipper_name: form.shipper_name,
      address: form.address || null,

      subdistrict_id: form.subdistrict_id || null,
      district_id: form.district_id || null,
      province_id: form.province_id || null,

      zip_code: form.zip_code || null,
      tel: form.tel || null,
      fax: form.fax || null,
    };

    try {
      if (editing) {
        await AxiosInstance.patch(`/manage/customers/${customerId}/shippers/${editing.shipper_id}`, payload);
      } else {
        await AxiosInstance.post(`/manage/customers/${customerId}/shippers`, payload);
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "save shipper failed");
    }
  };

  const openStatusModal = (row) => {
    setSelectedStatus({
      shipper_id: row.shipper_id,
      current: row.is_deleted === "N" ? "ACTIVE" : "INACTIVE",
    });

    setStatusModal(true);
  };

  const changeStatus = async (status) => {
    if (!selectedStatus || !customerId) return;

    try {
      await AxiosInstance.patch(`/manage/customers/${customerId}/shippers/${selectedStatus.shipper_id}/status`, {
        is_deleted: status === "ACTIVE" ? "N" : "Y",
      });

      setStatusModal(false);
      setSelectedStatus(null);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "update status failed");
    }
  };

  return (
    <div className="w-full min-h-screen px-1 py-4 bg-slate-50">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Shipper Management</h2>

          <p className="text-sm text-slate-500">
            {isCustomer ? (
              <>จัดการผู้ส่งของคุณ</>
            ) : (
              <>
                จัดการผู้ส่งของลูกค้า
                {selectedCustomer ? <span className="font-medium text-slate-700"> {selectedCustomer.name}</span> : null}
              </>
            )}
          </p>
        </div>

        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white shadow hover:bg-blue-700 transition">
          + เพิ่มผู้ส่ง
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-5 flex gap-3 flex-wrap">
        {canSelectCustomer && (
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="input-modern w-auto">
            <option value="">เลือก Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        )}

        <input
          placeholder="ค้นหา code / ชื่อผู้ส่ง / เบอร์โทร"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-modern w-[260px]"
          onKeyDown={(e) => {
            if (e.key === "Enter") fetchData();
          }}
        />

        <button onClick={fetchData} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
          ค้นหา
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="py-4 text-center w-12">#</th>
              <th className="text-left py-4">Shipper Code</th>
              <th className="text-left py-4">Shipper Name</th>
              <th className="text-left py-4 hidden md:table-cell">Tel</th>
              <th className="text-left py-4 hidden lg:table-cell">Address</th>
              <th className="text-left py-4 hidden lg:table-cell">Subdistrict</th>
              <th className="text-left py-4 hidden lg:table-cell">District</th>
              <th className="text-left py-4 hidden lg:table-cell">Province</th>
              <th className="text-left py-4 hidden lg:table-cell">Zipcode</th>
              <th className="text-center py-4">Status</th>
              <th className="text-center w-28">จัดการ</th>
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
              rows.map((r, i) => (
                <tr key={r.shipper_id} className="border-t hover:bg-slate-50">
                  <td className="text-center text-slate-400 py-3">{i + 1}</td>

                  <td className="py-3 font-medium">{r.shipper_code || "-"}</td>

                  <td className="py-3">
                    <div className="leading-tight">
                      <div>{r.shipper_name || "-"}</div>
                      <div className="text-xs text-slate-400 md:hidden">
                        {r.tel || "-"} / {r.zip_code || "-"}
                      </div>
                    </div>
                  </td>

                  <td className="py-3 hidden md:table-cell">{r.tel || "-"}</td>

                  <td className="py-3 hidden lg:table-cell max-w-[320px] truncate">{r.address || "-"}</td>

                  <td className="py-3 hidden lg:table-cell">{r.subdistrict_name || "-"}</td>

                  <td className="py-3 hidden lg:table-cell">{r.district_name || "-"}</td>

                  <td className="py-3 hidden lg:table-cell">{r.province_name || "-"}</td>

                  <td className="py-3 hidden lg:table-cell">{r.zip_code || "-"}</td>

                  <td className="text-center py-3">
                    <button type="button" onClick={() => openStatusModal(r)} className="inline-block" title="คลิกเพื่อเปลี่ยนสถานะ">
                      {r.is_deleted === "N" ? (
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

      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => {
            setShowModal(false);
            resetForm();
          }}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-xl w-[560px] max-h-[90vh] overflow-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-5">{editing ? "แก้ไขผู้ส่ง" : "เพิ่มผู้ส่ง"}</h3>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="input-modern w-full"
                  placeholder="Shipper Code *"
                  value={form.shipper_code}
                  onChange={(e) => handleChange("shipper_code", e.target.value)}
                />

                <select
                  className="input-modern w-full"
                  value={form.shipper_type_id}
                  onChange={(e) => handleChange("shipper_type_id", e.target.value)}
                >
                  <option value="1">บุคคลธรรมดา</option>
                  <option value="2">นิติบุคคล</option>
                </select>
              </div>

              <input
                className="input-modern w-full"
                placeholder="Shipper Name *"
                value={form.shipper_name}
                onChange={(e) => handleChange("shipper_name", e.target.value)}
              />

              <textarea
                className="input-modern w-full min-h-[80px]"
                placeholder="Address"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />

              <div>
                <label className="block text-xs font-medium mb-1 text-slate-600">ค้นหาพื้นที่</label>

                <AddressSearchDropdown
                  value={form.subdistrict_name ? `${form.subdistrict_name} • ${form.district_name} • ${form.province_name} • ${form.zip_code}` : ""}
                  onChange={() => {
                    clearAddress();
                  }}
                  onSelect={handleSelectAddress}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="input-modern w-full" placeholder="Tel" value={form.tel} onChange={(e) => handleChange("tel", e.target.value)} />

                <input className="input-modern w-full" placeholder="Fax" value={form.fax} onChange={(e) => handleChange("fax", e.target.value)} />
              </div>
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

              <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {statusModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => {
            setStatusModal(false);
            setSelectedStatus(null);
          }}
        >
          <div className="bg-white p-6 rounded-2xl shadow-xl w-[300px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4 text-slate-800">สถานะ</h3>

            <div className="flex flex-col gap-3">
              <button
                disabled={selectedStatus?.current === "ACTIVE"}
                onClick={() => changeStatus("ACTIVE")}
                className={`px-4 py-2 rounded-lg ${
                  selectedStatus?.current === "ACTIVE"
                    ? "bg-green-50 text-green-300 cursor-not-allowed"
                    : "bg-green-100 text-green-600 hover:bg-green-200"
                }`}
              >
                Active
              </button>

              <button
                disabled={selectedStatus?.current === "INACTIVE"}
                onClick={() => changeStatus("INACTIVE")}
                className={`px-4 py-2 rounded-lg ${
                  selectedStatus?.current === "INACTIVE" ? "bg-red-50 text-red-300 cursor-not-allowed" : "bg-red-100 text-red-500 hover:bg-red-200"
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
