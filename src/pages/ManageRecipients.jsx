import { useEffect, useMemo, useState } from "react";
import AxiosInstance from "../utils/AxiosInstance";
import { useAuth } from "../context/AuthContext";
import { Pencil, Plus } from "lucide-react";
import AddressSearchDropdown from "../components/dropdown/AddressSearchDropdown";

export default function ManageRecipients() {
  const { user } = useAuth();

  const isCustomer = Number(user?.role_id) === 2;
  const canSelectCustomer = !isCustomer;

  const [customers, setCustomers] = useState([]);
  const [recipientTypes, setRecipientTypes] = useState([]);
  const [customerId, setCustomerId] = useState("");

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);

  // createRecipient | editRecipient | createDetail | editDetail
  const [modalMode, setModalMode] = useState("createRecipient");

  const [editingRecipient, setEditingRecipient] = useState(null);
  const [editingDetail, setEditingDetail] = useState(null);

  const [statusModal, setStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);

  const emptyForm = {
    recipient_code: "",
    recipient_type_id: "",
    recipient_name: "",

    recipient_detail_id: "",
    recipient_detail_name: "",
    address: "",
    address_search: "",
    subdistrict_id: "",
    district_id: "",
    province_id: "",
    zip_code: "",
    tel1: "",
    line_id: "",
  };

  const [form, setForm] = useState(emptyForm);

  const selectedCustomer = customers.find((customer) => String(customer.id) === String(customerId));

  const groupedRows = useMemo(() => {
    const map = new Map();

    rows.forEach((row) => {
      if (!row.recipient_id) return;

      const key = row.recipient_id;

      if (!map.has(key)) {
        map.set(key, {
          recipient_id: row.recipient_id,
          recipient_code: row.recipient_code,
          recipient_type_id: row.recipient_type_id,
          recipient_type_name: row.recipient_type_name,
          recipient_name: row.recipient_name,

          customer_id: row.customer_id,
          recipient_customer_id: row.recipient_customer_id,
          customer_code: row.customer_code,
          customer_name: row.customer_name,

          recipient_is_deleted: row.recipient_is_deleted,
          address_count: Number(row.address_count || 0),

          details: [],
        });
      }

      if (row.recipient_detail_id) {
        map.get(key).details.push({
          recipient_detail_id: row.recipient_detail_id,
          recipient_detail_name: row.recipient_detail_name,
          address: row.address,

          subdistrict_id: row.subdistrict_id,
          district_id: row.district_id,
          province_id: row.province_id,

          subdistrict_name: row.subdistrict_name,
          district_name: row.district_name,
          province_name: row.province_name,

          zip_code: row.zip_code,
          tel1: row.tel1,
          line_id: row.line_id,

          detail_is_deleted: row.detail_is_deleted,
        });
      }
    });

    return Array.from(map.values());
  }, [rows]);

  const getAddressLabel = (detail) => {
    if (!detail) return "";

    const parts = [detail.subdistrict_name, detail.district_name, detail.province_name, detail.zip_code].filter(Boolean);

    return parts.join(" • ");
  };

  const getModalTitle = () => {
    if (modalMode === "createRecipient") return "เพิ่มผู้รับ";
    if (modalMode === "editRecipient") return "แก้ไขผู้รับ";
    if (modalMode === "createDetail") return "เพิ่มที่อยู่ผู้รับ";
    if (modalMode === "editDetail") return "แก้ไขที่อยู่ผู้รับ";
    return "ผู้รับ";
  };

  const isRecipientMode = modalMode === "createRecipient" || modalMode === "editRecipient";

  const isDetailMode = modalMode === "createDetail" || modalMode === "editDetail";

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectAddress = (row) => {
    setForm((prev) => ({
      ...prev,
      address_search: `${row.subdistrict_name} • ${row.district_name} • ${row.province_name} • ${row.zip_code}`,
      subdistrict_id: row.subdistrict_id || "",
      district_id: row.district_id || "",
      province_id: row.province_id || "",
      zip_code: row.zip_code || "",
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setModalMode("createRecipient");
    setEditingRecipient(null);
    setEditingDetail(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const closeStatusModal = () => {
    setStatusModal(false);
    setSelectedStatus(null);
  };

  const fetchCustomers = async () => {
    try {
      const res = await AxiosInstance.get("/manage/customers");
      const data = res.data || [];

      setCustomers(data);

      if (data.length > 0) {
        setCustomerId((prev) => prev || String(data[0].id));
      }
    } catch (err) {
      alert(err?.response?.data?.message || "fetch customers failed");
    }
  };

  const fetchRecipientTypes = async () => {
    try {
      const res = await AxiosInstance.get("/recipient-types");
      setRecipientTypes(res.data || []);
    } catch (err) {
      alert(err?.response?.data?.message || "fetch recipient types failed");
    }
  };

  const fetchData = async (searchValue = search) => {
    if (!customerId) return;

    try {
      setLoading(true);

      const res = await AxiosInstance.get(`/manage/customers/${customerId}/recipients`, {
        params: {
          search: searchValue || undefined,
        },
      });

      setRows(res.data || []);
    } catch (err) {
      alert(err?.response?.data?.message || "fetch recipients failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchRecipientTypes();

    if (isCustomer) {
      if (user.customer_id) {
        setCustomerId(String(user.customer_id));
      }
      return;
    }

    fetchCustomers();
  }, [user, isCustomer]);

  useEffect(() => {
    if (!user || !customerId) return;
    fetchData();
  }, [customerId, user]);

  const openCreateRecipient = () => {
    if (!customerId) {
      alert("กรุณาเลือก customer ก่อน");
      return;
    }

    resetForm();
    setModalMode("createRecipient");
    setShowModal(true);
  };

  const openEditRecipient = (recipient) => {
    setModalMode("editRecipient");
    setEditingRecipient(recipient);
    setEditingDetail(null);

    setForm({
      ...emptyForm,
      recipient_code: recipient.recipient_code || "",
      recipient_type_id: recipient.recipient_type_id || "",
      recipient_name: recipient.recipient_name || "",
    });

    setShowModal(true);
  };

  const openCreateDetail = (recipient) => {
    setModalMode("createDetail");
    setEditingRecipient(recipient);
    setEditingDetail(null);

    setForm({
      ...emptyForm,
      recipient_detail_name: "",
      address: "",
      address_search: "",
      subdistrict_id: "",
      district_id: "",
      province_id: "",
      zip_code: "",
      tel1: "",
      line_id: "",
    });

    setShowModal(true);
  };

  const openEditDetail = (recipient, detail) => {
    setModalMode("editDetail");
    setEditingRecipient(recipient);
    setEditingDetail(detail);

    setForm({
      ...emptyForm,
      recipient_detail_id: detail.recipient_detail_id || "",
      recipient_detail_name: detail.recipient_detail_name || "",
      address: detail.address || "",
      address_search: getAddressLabel(detail),
      subdistrict_id: detail.subdistrict_id || "",
      district_id: detail.district_id || "",
      province_id: detail.province_id || "",
      zip_code: detail.zip_code || "",
      tel1: detail.tel1 || "",
      line_id: detail.line_id || "",
    });

    setShowModal(true);
  };

  const openDetailStatusModal = (recipient, detail) => {
    setSelectedStatus({
      recipient_id: recipient.recipient_id,
      recipient_detail_id: detail.recipient_detail_id,
      current: detail.detail_is_deleted === "N" ? "ACTIVE" : "INACTIVE",
    });

    setStatusModal(true);
  };

  const validateRecipientForm = () => {
    if (!form.recipient_code || !form.recipient_name) {
      alert("กรุณากรอก recipient_code และ recipient_name");
      return false;
    }

    return true;
  };

  const validateDetailForm = () => {
    if (!form.recipient_detail_name || !form.address || !form.tel1) {
      alert("กรุณากรอก recipient_detail_name, address และ tel1");
      return false;
    }

    if (!form.subdistrict_id || !form.district_id || !form.province_id) {
      alert("กรุณาเลือกตำบล / อำเภอ / จังหวัด จาก dropdown");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!customerId) {
      alert("กรุณาเลือก customer ก่อน");
      return;
    }

    try {
      if (modalMode === "createRecipient") {
        if (!validateRecipientForm()) return;

        const payload = {
          recipient_code: form.recipient_code,
          recipient_type_id: form.recipient_type_id || null,
          recipient_name: form.recipient_name,
        };

        await AxiosInstance.post(`/manage/customers/${customerId}/recipients`, payload);
      }

      if (modalMode === "editRecipient") {
        if (!editingRecipient) {
          alert("ไม่พบข้อมูล recipient ที่จะแก้ไข");
          return;
        }

        if (!validateRecipientForm()) return;

        const payload = {
          mode: "recipient",
          recipient_code: form.recipient_code,
          recipient_type_id: form.recipient_type_id || null,
          recipient_name: form.recipient_name,
        };

        await AxiosInstance.patch(`/manage/customers/${customerId}/recipients/${editingRecipient.recipient_id}`, payload);
      }

      if (modalMode === "createDetail") {
        if (!editingRecipient) {
          alert("ไม่พบข้อมูล recipient ที่จะเพิ่มที่อยู่");
          return;
        }

        if (!validateDetailForm()) return;

        const payload = {
          recipient_detail_name: form.recipient_detail_name,
          address: form.address,
          subdistrict_id: form.subdistrict_id || null,
          district_id: form.district_id || null,
          province_id: form.province_id || null,
          zip_code: form.zip_code || null,
          tel1: form.tel1,
          line_id: form.line_id || null,
        };

        await AxiosInstance.post(`/manage/customers/${customerId}/recipients/${editingRecipient.recipient_id}/details`, payload);
      }

      if (modalMode === "editDetail") {
        if (!editingRecipient || !editingDetail) {
          alert("ไม่พบข้อมูล detail ที่จะแก้ไข");
          return;
        }

        if (!validateDetailForm()) return;

        const payload = {
          mode: "detail",
          detail: {
            recipient_detail_id: form.recipient_detail_id,
            recipient_detail_name: form.recipient_detail_name,
            address: form.address,
            subdistrict_id: form.subdistrict_id || null,
            district_id: form.district_id || null,
            province_id: form.province_id || null,
            zip_code: form.zip_code || null,
            tel1: form.tel1,
            line_id: form.line_id || null,
          },
        };

        await AxiosInstance.patch(`/manage/customers/${customerId}/recipients/${editingRecipient.recipient_id}`, payload);
      }

      closeModal();
      fetchData(search);
    } catch (err) {
      alert(err?.response?.data?.message || "save recipient failed");
    }
  };

  const changeStatus = async (status) => {
    if (!selectedStatus || !customerId) return;

    try {
      await AxiosInstance.patch(
        `/manage/customers/${customerId}/recipients/${selectedStatus.recipient_id}/details/${selectedStatus.recipient_detail_id}/status`,
        {
          is_deleted: status === "ACTIVE" ? "N" : "Y",
        },
      );

      closeStatusModal();
      fetchData(search);
    } catch (err) {
      alert(err?.response?.data?.message || "update recipient detail status failed");
    }
  };

  return (
    <div className="w-full min-h-screen px-1 py-4 bg-slate-50">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Recipient Management</h2>

          <p className="text-sm text-slate-500 mt-1">
            {isCustomer ? (
              <>จัดการผู้รับของคุณ</>
            ) : (
              <>
                จัดการผู้รับของลูกค้า
                {selectedCustomer ? (
                  <span className="font-medium text-slate-700">
                    {" "}
                    {selectedCustomer.code} - {selectedCustomer.name}
                  </span>
                ) : null}
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateRecipient}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white shadow hover:bg-blue-700 transition"
        >
          <Plus size={16} />
          เพิ่มผู้รับ
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-5">
        <div className="flex flex-col lg:flex-row gap-3">
          {canSelectCustomer && (
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setRows([]);
              }}
              className="input-modern"
            >
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.code} - {customer.name}
                </option>
              ))}
            </select>
          )}

          <input
            placeholder="ค้นหา code / ชื่อผู้รับ / ที่อยู่ / เบอร์ / รหัสไปรษณีย์"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-modern w-full lg:w-[360px]"
            onKeyDown={(e) => {
              if (e.key === "Enter") fetchData(e.target.value);
            }}
          />

          <button type="button" onClick={() => fetchData(search)} className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
            ค้นหา
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">Loading...</div>
      ) : groupedRows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">ไม่มีข้อมูล</div>
      ) : (
        <div className="space-y-4">
          {groupedRows.map((recipient, recipientIndex) => (
            <div
              key={recipient.recipient_id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-semibold shrink-0">
                    {recipientIndex + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-800">{recipient.recipient_code || "-"}</span>

                      <span className="text-slate-300">•</span>

                      <span className="font-medium text-slate-700 truncate">{recipient.recipient_name || "-"}</span>

                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-500">{recipient.recipient_type_name || "-"}</span>

                      <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-500">
                        {recipient.address_count || recipient.details.length} ที่อยู่
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openCreateDetail(recipient)}
                    className="inline-flex items-center gap-1 px-3 h-9 rounded-xl bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 text-sm"
                    title="เพิ่มที่อยู่ให้ผู้รับนี้"
                  >
                    <Plus size={14} />
                    ที่อยู่
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditRecipient(recipient)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
                    title="แก้ไขข้อมูลผู้รับ"
                  >
                    <Pencil size={15} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[1520px]">
                  <div className="grid grid-cols-[260px_340px_130px_130px_130px_110px_130px_150px_120px_100px] gap-3 px-4 py-2 bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-100">
                    <div>recipient_detail_name</div>
                    <div>address</div>
                    <div>subdistrict</div>
                    <div>district</div>
                    <div>province</div>
                    <div>zip_code</div>
                    <div>tel1</div>
                    <div>line_id</div>
                    <div>status</div>
                    <div>edit</div>
                  </div>

                  {recipient.details.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-slate-400">ยังไม่มีที่อยู่ของผู้รับนี้ กดปุ่ม “+ ที่อยู่” เพื่อเพิ่ม</div>
                  ) : (
                    recipient.details.map((detail) => (
                      <div
                        key={detail.recipient_detail_id}
                        className="grid grid-cols-[260px_340px_130px_130px_130px_110px_130px_150px_120px_100px] gap-3 px-4 py-3 text-sm text-slate-700 border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                      >
                        <div className="truncate font-medium">{detail.recipient_detail_name || "-"}</div>

                        <div className="truncate" title={detail.address || ""}>
                          {detail.address || "-"}
                        </div>

                        <div className="truncate">{detail.subdistrict_name || detail.subdistrict_id || "-"}</div>

                        <div className="truncate">{detail.district_name || detail.district_id || "-"}</div>

                        <div className="truncate">{detail.province_name || detail.province_id || "-"}</div>

                        <div className="truncate">{detail.zip_code || "-"}</div>

                        <div className="truncate">{detail.tel1 || "-"}</div>

                        <div className="truncate">{detail.line_id || "-"}</div>

                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => openDetailStatusModal(recipient, detail)}
                            className="inline-block"
                            title="คลิกเพื่อเปลี่ยนสถานะ"
                          >
                            {detail.detail_is_deleted === "N" ? (
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600 font-medium hover:bg-green-200 cursor-pointer">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-500 font-medium hover:bg-red-200 cursor-pointer">
                                Inactive
                              </span>
                            )}
                          </button>
                        </div>

                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => openEditDetail(recipient, detail)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
                            title="แก้ไขที่อยู่นี้"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeModal}>
          <div
            className="bg-white p-6 rounded-2xl shadow-xl w-[560px] max-h-[90vh] overflow-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-5">{getModalTitle()}</h3>

            {isDetailMode && editingRecipient && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
                เพิ่ม/แก้ไขที่อยู่ของ{" "}
                <span className="font-semibold text-slate-800">
                  {editingRecipient.recipient_code} - {editingRecipient.recipient_name}
                </span>
              </div>
            )}

            <div className="space-y-3">
              {isRecipientMode && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      className="input-modern w-full"
                      placeholder="Recipient Code *"
                      value={form.recipient_code}
                      onChange={(e) => handleChange("recipient_code", e.target.value)}
                    />

                    <select
                      className="input-modern w-full"
                      value={form.recipient_type_id}
                      onChange={(e) => handleChange("recipient_type_id", e.target.value)}
                    >
                      <option value="">เลือกประเภทผู้รับ</option>
                      {recipientTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    className="input-modern w-full"
                    placeholder="Recipient Name *"
                    value={form.recipient_name}
                    onChange={(e) => handleChange("recipient_name", e.target.value)}
                  />
                </>
              )}

              {isDetailMode && (
                <>
                  <input
                    className="input-modern w-full"
                    placeholder="Detail Name * เช่น สำนักงานใหญ่ / สาขา"
                    value={form.recipient_detail_name}
                    onChange={(e) => handleChange("recipient_detail_name", e.target.value)}
                  />

                  <textarea
                    className="input-modern w-full min-h-[80px]"
                    placeholder="Address *"
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                  />

                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-600">ค้นหาพื้นที่</label>

                    <AddressSearchDropdown
                      value={form.address_search || ""}
                      onChange={() => {
                        setForm((prev) => ({
                          ...prev,
                          address_search: "",
                          subdistrict_id: "",
                          district_id: "",
                          province_id: "",
                          zip_code: "",
                        }));
                      }}
                      onSelect={handleSelectAddress}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      className="input-modern w-full"
                      placeholder="Tel *"
                      value={form.tel1}
                      onChange={(e) => handleChange("tel1", e.target.value)}
                    />

                    <input
                      className="input-modern w-full"
                      placeholder="Line ID"
                      value={form.line_id}
                      onChange={(e) => handleChange("line_id", e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">
                ยกเลิก
              </button>

              <button type="button" onClick={handleSave} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
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
