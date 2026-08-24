import { useEffect, useMemo, useState } from "react";
import AxiosInstance from "../utils/AxiosInstance";
import { useAuth } from "../context/AuthContext";
import { Pencil, X } from "lucide-react";
import AddressSearchDropdown, { type ZipAddressRow } from "../components/dropdown/AddressSearchDropdown";
import { cleanCodeInput, cleanNameInput, cleanNumberInput, cleanEmailInput } from "../utils/textSanitizer";
import DataGrid from "../components/DataGrid";
import RequiredLabel from "../components/form/RequiredLabel";

export default function ManageCustomers() {
  const { user } = useAuth();

  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [statusModal, setStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<{
    id: number;
    current: number;
  } | null>(null);

  const [addressKeyword, setAddressKeyword] = useState("");

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
    type: "BUSINESS",
  });

  const [userForm, setUserForm] = useState({
    username: "",
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

      setRows(res.data || []);
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

  const handleUserChange = (k: string, v: any) => {
    setUserForm((prev) => ({ ...prev, [k]: v }));
  };

  const handleSelectAddress = (row: ZipAddressRow) => {
    setForm((prev) => ({
      ...prev,
      subdistrict_id: String(row.subdistrict_id),
      district_id: String(row.district_id),
      province_id: String(row.province_id),
      zip_code: row.zip_code || "",
    }));

    setAddressKeyword(`${row.subdistrict_name} • ${row.district_name} • ${row.province_name} • ${row.zip_code}`);
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
      type: "BUSINESS",
    });

    setAddressKeyword("");
  };

  const resetUserForm = () => {
    setUserForm({
      username: "",
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
      type: row.type || "BUSINESS",
    });

    const addressLabel = [row.subdistrict_name, row.district_name, row.province_name, row.zip_code].filter(Boolean).join(" • ");

    setAddressKeyword(addressLabel);

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

  // =====================
  // CREATE / UPDATE CUSTOMER
  // =====================
  const handleSaveCustomer = async () => {
    try {
      const code = cleanCodeInput(form.code);
      const name = cleanNameInput(form.name);

      if (!code) {
        alert("กรุณากรอกรหัสลูกค้า");
        return;
      }

      if (!name) {
        alert("กรุณากรอกชื่อลูกค้า");
        return;
      }

      const payload = {
        ...form,
        code,
        name,
        tax_id: cleanNumberInput(form.tax_id),
        tel: cleanNumberInput(form.tel),
        line: cleanCodeInput(form.line),
        contact_name: cleanNameInput(form.contact_name),
        contact_tel: cleanNumberInput(form.contact_tel),
        email: cleanEmailInput(form.email),
      };

      if ((payload.tel && !payload.tel.startsWith("0")) || (payload.contact_tel && !payload.contact_tel.startsWith("0"))) {
        alert("เบอร์โทรต้องขึ้นต้นด้วย 0");
        return;
      }

      if (editingCustomer) {
        await AxiosInstance.patch(`/manage/customers/${editingCustomer.id}`, payload);
      } else {
        await AxiosInstance.post("/manage/customers", payload);
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

    const username = cleanCodeInput(userForm.username);
    const first_name = cleanNameInput(userForm.first_name);
    const last_name = cleanNameInput(userForm.last_name);

    if (!username) {
      alert("กรุณากรอก Username");
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

    try {
      await AxiosInstance.post("/manage/customers/add-user", {
        username,
        first_name,
        last_name,
        customer_id: selectedCustomer.id,
      });

      closeUserModal();
    } catch (err: any) {
      alert(err?.response?.data?.message || "create user failed");
    }
  };

  const gridRows = useMemo(() => {
    return rows.map((r: any, i) => ({
      ...r,
      id: r.id,
      no: i + 1,
    }));
  }, [rows]);

  const customerColumns = useMemo(
    () => [
      {
        field: "no",
        headerName: "#",
        width: 70,
        minWidth: 60,
        sortable: false,
        filterable: false,
        resizable: false,
        align: "center" as const,
        headerAlign: "center" as const,
      },
      {
        field: "code",
        headerName: "รหัสลูกค้า",
        width: 140,
        minWidth: 120,
        renderCell: (params: any) => (
          <div title={params.value || ""} className="font-medium truncate">
            {params.value || "-"}
          </div>
        ),
      },
      {
        field: "name",
        headerName: "ชื่อลูกค้า",
        width: 260,
        minWidth: 200,
        renderCell: (params: any) => (
          <div className="flex h-full w-full items-center">
            <div className="leading-tight truncate" title={params.value || ""}>
              <div className="truncate">{params.value || "-"}</div>
              <div className="text-xs text-slate-400 truncate">
                {params.row.contact_name || "-"} / {params.row.contact_tel || params.row.tel || "-"}
              </div>
            </div>
          </div>
        ),
      },
      {
        field: "type",
        headerName: "ประเภท",
        width: 130,
        minWidth: 110,
        renderCell: (params: any) => (
          <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">{params.value || "-"}</span>
        ),
      },
      {
        field: "tax_id",
        headerName: "เลขประจำตัวผู้เสียภาษี",
        width: 170,
        minWidth: 140,
        renderCell: (params: any) => (
          <div title={params.value || ""} className="truncate">
            {params.value || "-"}
          </div>
        ),
      },
      {
        field: "address",
        headerName: "ที่อยู่",
        width: 360,
        minWidth: 240,
        maxWidth: 3000,
        renderCell: (params: any) => (
          <div title={params.value || ""} className="truncate text-slate-500">
            {params.value || "-"}
          </div>
        ),
      },
      {
        field: "contact_name",
        headerName: "ผู้ติดต่อ",
        width: 180,
        minWidth: 140,
        renderCell: (params: any) => (
          <div title={params.value || ""} className="truncate">
            {params.value || "-"}
          </div>
        ),
      },
      {
        field: "contact_tel",
        headerName: "เบอร์โทรผู้ติดต่อ",
        width: 150,
        minWidth: 120,
        renderCell: (params: any) => {
          const value = params.value || params.row.tel || "-";

          return (
            <div title={value} className="truncate">
              {value}
            </div>
          );
        },
      },
      {
        field: "email",
        headerName: "Email",
        width: 220,
        minWidth: 180,
        renderCell: (params: any) => (
          <div title={params.value || ""} className="truncate text-slate-500">
            {params.value || "-"}
          </div>
        ),
      },
      {
        field: "line",
        headerName: "Line ID",
        width: 150,
        minWidth: 120,
        renderCell: (params: any) => (
          <div title={params.value || ""} className="truncate">
            {params.value || "-"}
          </div>
        ),
      },
      {
        field: "is_active",
        headerName: "สถานะ",
        width: 130,
        minWidth: 120,
        sortable: false,
        filterable: false,
        align: "center" as const,
        headerAlign: "center" as const,
        renderCell: (params: any) => (
          <button type="button" onClick={() => openStatusModal(params.row)} className="inline-block">
            {Number(params.row.is_active) === 1 ? (
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
        width: 150,
        minWidth: 130,
        sortable: false,
        filterable: false,
        resizable: false,
        align: "center" as const,
        headerAlign: "center" as const,
        renderCell: (params: any) => (
          <div className="flex h-full w-full items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => openEditModal(params.row)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
            >
              <Pencil size={14} />
            </button>

            {[1, 10].includes(Number(user?.role_id)) && (
              <button
                type="button"
                onClick={() => openUserModal(params.row)}
                className="h-8 px-2 text-xs rounded-lg bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100"
              >
                + User
              </button>
            )}
          </div>
        ),
      },
    ],
    [user?.role_id],
  );

  return (
    <div className="w-full h-[calc(100vh-61px)] px-1 py-4 bg-slate-50 overflow-hidden flex flex-col">
      {/* HEADER */}
      <div className="flex justify-between items-center mt-[-15px] mb-2 shrink-0">
        <div>
          <h2 className="text-xl font-semibold mb-1 text-slate-800">Customer Management</h2>
          <p className="text-sm text-slate-500">จัดการลูกค้าในระบบ</p>
        </div>

        <button type="button" onClick={openCreateModal} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white shadow hover:bg-blue-700 transition">
          + เพิ่มลูกค้า
        </button>
      </div>

      {/* FILTER CARD */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-2 flex gap-3 flex-wrap shrink-0">
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

      {/* DATAGRID */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <DataGrid rows={gridRows} columns={customerColumns} loading={loading} getRowId={(row: any) => row.id} height="100%" pageSize={100} />
      </div>

      {/* CREATE / EDIT CUSTOMER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="relative bg-white p-6 rounded-2xl shadow-xl w-[620px] max-h-[90vh] overflow-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={closeCustomerModal} className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700" aria-label="ปิด">
              <X size={18} />
            </button>
            <h3 className="text-lg font-semibold text-slate-800 mb-5">{editingCustomer ? "แก้ไขลูกค้า" : "เพิ่มลูกค้า"}</h3>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <RequiredLabel required>รหัสลูกค้า</RequiredLabel>
                  <input
                    className="input-modern w-full"
                    placeholder="รหัสลูกค้า"
                    value={form.code}
                    onChange={(e) => handleChange("code", cleanCodeInput(e.target.value))}
                  />
                </div>

                <div>
                  <RequiredLabel required>ชื่อลูกค้า</RequiredLabel>
                  <input
                    className="input-modern w-full"
                    placeholder="ชื่อลูกค้า"
                    value={form.name}
                    onChange={(e) => handleChange("name", cleanNameInput(e.target.value))}
                  />
                </div>

                <div>
                  <RequiredLabel>ประเภทลูกค้า</RequiredLabel>
                  <select className="input-modern w-full" value={form.type} onChange={(e) => handleChange("type", e.target.value)}>
                    <option value="BUSINESS">BUSINESS</option>
                    <option value="EXPRESS">EXPRESS</option>
                  </select>
                </div>

                <div>
                  <RequiredLabel>เลขประจำตัวผู้เสียภาษี</RequiredLabel>
                  <input
                    className="input-modern w-full"
                    placeholder="เลขประจำตัวผู้เสียภาษี"
                    value={form.tax_id}
                    onChange={(e) => handleChange("tax_id", cleanNumberInput(e.target.value))}
                  />
                </div>

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
                  <RequiredLabel>Line ID</RequiredLabel>
                  <input
                    className="input-modern w-full"
                    placeholder="Line ID"
                    value={form.line}
                    onChange={(e) => handleChange("line", cleanCodeInput(e.target.value))}
                  />
                </div>

                <div>
                  <RequiredLabel>Email</RequiredLabel>
                  <input
                    className="input-modern w-full"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => handleChange("email", cleanEmailInput(e.target.value))}
                  />
                </div>

                <div className="md:col-span-2">
                  <RequiredLabel>ค้นหาตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์</RequiredLabel>
                  <AddressSearchDropdown value={addressKeyword} onChange={setAddressKeyword} onSelect={handleSelectAddress} />
                </div>

                <div>
                  <RequiredLabel>ชื่อผู้ติดต่อ</RequiredLabel>
                  <input
                    className="input-modern w-full"
                    placeholder="ชื่อผู้ติดต่อ"
                    value={form.contact_name}
                    onChange={(e) => handleChange("contact_name", cleanNameInput(e.target.value))}
                  />
                </div>

                <div>
                  <RequiredLabel>เบอร์โทรผู้ติดต่อ</RequiredLabel>
                  <input
                    className="input-modern w-full"
                    placeholder="เบอร์โทรผู้ติดต่อ"
                    value={form.contact_tel}
                    onChange={(e) => handleChange("contact_tel", cleanNumberInput(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <RequiredLabel>ที่อยู่</RequiredLabel>
                <textarea
                  className="input-modern w-full min-h-[90px]"
                  placeholder="ที่อยู่"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>
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
          <div className="bg-white p-6 rounded-2xl shadow-xl w-[300px] animate-scaleIn" onClick={(e) => e.stopPropagation()}>
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

      {/* CREATE CUSTOMER USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-white p-6 rounded-2xl shadow-xl w-[400px] animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={closeUserModal} className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700" aria-label="ปิด">
              <X size={18} />
            </button>
            <h3 className="text-lg font-semibold text-slate-800 mb-5">เพิ่ม User ให้ {selectedCustomer?.name}</h3>

            <div className="space-y-3">
              <div>
                <RequiredLabel required>Username</RequiredLabel>
                <input
                  className="input-modern w-full"
                  placeholder="Username"
                  value={userForm.username}
                  onChange={(e) => handleUserChange("username", cleanCodeInput(e.target.value))}
                />
              </div>

              <p className="text-sm ml-2 text-blue-600">Password 123456 สามารถเปลี่ยนได้ภายหลัง</p>

              <div>
                <RequiredLabel required>ชื่อ</RequiredLabel>
                <input
                  className="input-modern w-full"
                  placeholder="ชื่อ"
                  value={userForm.first_name}
                  onChange={(e) => handleUserChange("first_name", cleanNameInput(e.target.value))}
                />
              </div>

              <div>
                <RequiredLabel required>นามสกุล</RequiredLabel>
                <input
                  className="input-modern w-full"
                  placeholder="นามสกุล"
                  value={userForm.last_name}
                  onChange={(e) => handleUserChange("last_name", cleanNameInput(e.target.value))}
                />
              </div>
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
