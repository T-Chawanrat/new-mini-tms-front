import { useEffect, useMemo, useState } from "react";
import AxiosInstance from "../utils/AxiosInstance";
import { useAuth } from "../context/AuthContext";
import AddressSearchDropdown from "../components/dropdown/AddressSearchDropdown";
import { Pencil } from "lucide-react";
import { cleanCodeInput, cleanNameInput, cleanNumberInput } from "../utils/textSanitizer";
import DataGrid from "../components/DataGrid";
import RequiredLabel from "../components/form/RequiredLabel";

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
    shipper_type_id: "1",
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
      const res = await AxiosInstance.get("/customers");

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

      const res = await AxiosInstance.get(`/manage/shippers/${customerId}`, {
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
      shipper_type_id: row.shipper_type_id || "1",
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

    const shipper_code = cleanCodeInput(form.shipper_code);
    const shipper_name = cleanNameInput(form.shipper_name);
    const tel = cleanNumberInput(form.tel);
    const fax = cleanNumberInput(form.fax);

    if (!shipper_code || !shipper_name) {
      alert("กรุณากรอก shipper code และ shipper name");
      return;
    }

    if (!form.subdistrict_id || !form.district_id || !form.province_id) {
      alert("กรุณาเลือกตำบล / อำเภอ / จังหวัด จาก dropdown");
      return;
    }

    const payload = {
      shipper_code,
      shipper_type_id: form.shipper_type_id || null,
      shipper_name,
      address: form.address || null,

      subdistrict_id: form.subdistrict_id || null,
      district_id: form.district_id || null,
      province_id: form.province_id || null,

      zip_code: form.zip_code || null,
      tel: tel || null,
      fax: fax || null,
    };

    try {
      if (editing) {
        await AxiosInstance.patch(`/manage/shippers/${customerId}/${editing.shipper_id}`, payload);
      } else {
        await AxiosInstance.post(`/manage/shippers/${customerId}`, payload);
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
      await AxiosInstance.patch(`/manage/shippers/${customerId}/${selectedStatus.shipper_id}/status`, {
        is_deleted: status === "ACTIVE" ? "N" : "Y",
      });

      setStatusModal(false);
      setSelectedStatus(null);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || "update status failed");
    }
  };

  const gridRows = useMemo(() => {
    return rows.map((r, i) => ({
      ...r,
      id: r.shipper_id,
      no: i + 1,
    }));
  }, [rows]);

  const shipperColumns = useMemo(
    () => [
      {
        field: "no",
        headerName: "#",
        width: 70,
        minWidth: 60,
        sortable: false,
        filterable: false,
        resizable: false,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "shipper_code",
        headerName: "รหัสผู้ส่ง",
        width: 150,
        minWidth: 120,
      },
      {
        field: "shipper_name",
        headerName: "ชื่อผู้ส่ง",
        width: 240,
        minWidth: 180,
        renderCell: (params) => (
          <div title={params.value || ""} className="truncate">
            {params.value || "-"}
          </div>
        ),
      },
      {
        field: "tel",
        headerName: "เบอร์โทร",
        width: 140,
        minWidth: 120,
        renderCell: (params) => params.value || "-",
      },
      {
        field: "address",
        headerName: "ที่อยู่",
        width: 360,
        minWidth: 240,
        maxWidth: 3000,
        renderCell: (params) => (
          <div title={params.value || ""} className="truncate">
            {params.value || "-"}
          </div>
        ),
      },
      {
        field: "subdistrict_name",
        headerName: "ตำบล",
        width: 160,
        minWidth: 130,
        renderCell: (params) => params.value || "-",
      },
      {
        field: "district_name",
        headerName: "อำเภอ",
        width: 160,
        minWidth: 130,
        renderCell: (params) => params.value || "-",
      },
      {
        field: "province_name",
        headerName: "จังหวัด",
        width: 160,
        minWidth: 130,
        renderCell: (params) => params.value || "-",
      },
      {
        field: "zip_code",
        headerName: "รหัสไปรษณีย์",
        width: 120,
        minWidth: 100,
        renderCell: (params) => params.value || "-",
      },
      {
        field: "is_deleted",
        headerName: "สถานะ",
        width: 130,
        minWidth: 120,
        sortable: false,
        filterable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <button type="button" onClick={() => openStatusModal(params.row)} className="inline-block" title="คลิกเพื่อเปลี่ยนสถานะ">
            {params.row.is_deleted === "N" ? (
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600 font-medium hover:bg-green-200 cursor-pointer">Active</span>
            ) : (
              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-500 font-medium hover:bg-red-200 cursor-pointer">Inactive</span>
            )}
          </button>
        ),
      },
      {
        field: "actions",
        headerName: "จัดการ",
        width: 110,
        minWidth: 100,
        sortable: false,
        filterable: false,
        resizable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <div className="flex h-full w-full items-center justify-center">
            <button
              type="button"
              onClick={() => openEdit(params.row)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
            >
              <Pencil size={14} />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="w-full h-[calc(100vh-61px)] px-1 py-4 bg-slate-50 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mt-[-15px] mb-2 shrink-0">
        <div>
          <h2 className="text-xl font-semibold mb-1 text-slate-800">Shipper Management</h2>

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

        <button type="button" onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white shadow hover:bg-blue-700 transition">
          + เพิ่มผู้ส่ง
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-2 flex gap-3 flex-wrap shrink-0">
        {canSelectCustomer && (
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="input-modern w-auto">
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} {c.code} - {c.name}
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

        <button type="button" onClick={fetchData} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
          ค้นหา
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <DataGrid rows={gridRows} columns={shipperColumns} loading={loading} getRowId={(row) => row.shipper_id} height="100%" pageSize={100} />
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
                <div>
                  <RequiredLabel required>รหัสผู้ส่ง</RequiredLabel>
                  <input
                    className="input-modern w-full"
                    placeholder="รหัสผู้ส่ง"
                    value={form.shipper_code}
                    onChange={(e) => handleChange("shipper_code", cleanCodeInput(e.target.value))}
                  />
                </div>

                <div>
                  <RequiredLabel>ประเภทผู้ส่ง</RequiredLabel>
                  <select
                    className="input-modern w-full"
                    value={form.shipper_type_id}
                    onChange={(e) => handleChange("shipper_type_id", e.target.value)}
                  >
                    <option value="1">บุคคลธรรมดา</option>
                    <option value="2">นิติบุคคล</option>
                  </select>
                </div>
              </div>

              <div>
                <RequiredLabel required>ชื่อผู้ส่ง</RequiredLabel>
                <input
                  className="input-modern w-full"
                  placeholder="ชื่อผู้ส่ง"
                  value={form.shipper_name}
                  onChange={(e) => handleChange("shipper_name", cleanNameInput(e.target.value))}
                />
              </div>

              <div>
                <RequiredLabel>ที่อยู่</RequiredLabel>
                <textarea
                  className="input-modern w-full min-h-[80px]"
                  placeholder="ที่อยู่"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>

              <div>
                <RequiredLabel required>ค้นหาตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์</RequiredLabel>

                <AddressSearchDropdown
                  value={form.subdistrict_name ? `${form.subdistrict_name} • ${form.district_name} • ${form.province_name} • ${form.zip_code}` : ""}
                  onChange={() => {
                    clearAddress();
                  }}
                  onSelect={handleSelectAddress}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <RequiredLabel>เบอร์โทร</RequiredLabel>
                  <input
                    className="input-modern w-full"
                    placeholder="เบอร์โทร"
                    value={form.tel}
                    onChange={(e) => handleChange("tel", cleanNumberInput(e.target.value))}
                  />
                </div>

                <div>
                  <RequiredLabel>Fax</RequiredLabel>
                  <input
                    className="input-modern w-full"
                    placeholder="Fax"
                    value={form.fax}
                    onChange={(e) => handleChange("fax", cleanNumberInput(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
              >
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
                type="button"
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
                type="button"
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
