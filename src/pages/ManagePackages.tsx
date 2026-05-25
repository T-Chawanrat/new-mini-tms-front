import { useEffect, useMemo, useState } from "react";
import AxiosInstance from "../utils/AxiosInstance";
import { useAuth } from "../context/AuthContext";
import { Pencil } from "lucide-react";
import DataGrid from "../components/DataGrid";
import RequiredLabel from "../components/form/RequiredLabel";
import { cleanCodeInput, cleanNumberInput } from "../utils/textSanitizer";

type Customer = {
  id: number;
  code?: string;
  name: string;
  type?: "BUSINESS" | "EXPRESS";
  is_active?: number | string;
};

type PackageRow = {
  package_id: number;
  package_code: string;
  package_name: string;
  customer_id: number;
  customer_name?: string;
  customer_type?: "BUSINESS" | "EXPRESS";
  package_type?: "BUSINESS" | "EXPRESS";
  is_document_return?: "Y" | "N";
  pay_commission?: string | null;
  is_actived: "Y" | "N";
  express_detail_count?: number;
  business_detail_count?: number;
  detail_count?: number;
};

type DetailRow = {
  id: number;
  package_detail_code?: string | null;
  package_detail_name?: string | null;
  size_min?: number | string | null;
  size_max?: number | string | null;
  weight_min?: number | string | null;
  weight_max?: number | string | null;
  cost?: number | string | null;
  cost_difference_warehouse?: number | string | null;
  package_setting_id?: number | string | null;
  cost_go?: number | string | null;
  cost_return?: number | string | null;
  is_document_return?: "Y" | "N";
  is_weight_fix?: "Y" | "N";
  is_vat?: "Y" | "N";
  is_actived?: "Y" | "N";
};

const emptyPackageForm = {
  package_code: "",
  package_name: "",
  pay_commission: "",
};

const emptyDetailForm = {
  package_detail_code: "",
  package_detail_name: "",
  size_min: "",
  size_max: "",
  weight_min: "",
  weight_max: "",
  cost: "",
  cost_difference_warehouse: "",
  package_setting_id: "",
};

export default function ManagePackages() {
  const { user } = useAuth();

  const roleId = Number(user?.role_id);
  const isCustomer = roleId === 2;
  const canManage = !isCustomer;
  const canSelectCustomer = !isCustomer;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rows, setRows] = useState<PackageRow[]>([]);
  const [details, setDetails] = useState<DetailRow[]>([]);

  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("");

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDetailFormModal, setShowDetailFormModal] = useState(false);

  const [editing, setEditing] = useState<PackageRow | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageRow | null>(null);
  const [editingDetail, setEditingDetail] = useState<DetailRow | null>(null);

  const [statusModal, setStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<{
    mode: "PACKAGE" | "DETAIL";
    id: number;
    current: "Y" | "N";
  } | null>(null);

  const [form, setForm] = useState(emptyPackageForm);
  const [detailForm, setDetailForm] = useState(emptyDetailForm);

  const selectedCustomer = customers.find((c) => String(c.id) === String(customerId));

  const selectedPackageType = selectedPackage?.package_type || editing?.package_type || selectedCustomer?.type || "";

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDetailChange = (key: string, value: any) => {
    setDetailForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyPackageForm);
    setEditing(null);
  };

  const resetDetailForm = () => {
    setDetailForm(emptyDetailForm);
    setEditingDetail(null);
  };

  const fetchCustomers = async () => {
    try {
      const res = await AxiosInstance.get("/customers");
      const data = Array.isArray(res.data) ? res.data : [];

      const activeCustomers = data.filter((c: Customer) => {
        return c.is_active === undefined || c.is_active === 1 || c.is_active === "1";
      });

      setCustomers(activeCustomers);

      if (activeCustomers.length > 0) {
        setCustomerId((prev) => prev || String(activeCustomers[0].id));
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "fetch customers failed");
    }
  };

  const fetchData = async () => {
    if (isCustomer && !customerId) {
      setRows([]);
      return;
    }

    if (canSelectCustomer && !customerId) {
      setRows([]);
      return;
    }

    try {
      setLoading(true);

      const params: any = {
        search: search || undefined,
      };

      if (customerId) {
        params.customer_id = customerId;
      }

      const res = await AxiosInstance.get("/manage/packages", { params });
      setRows(res.data || []);
    } catch (err: any) {
      alert(err?.response?.data?.message || "fetch packages failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async (packageId: number) => {
    try {
      setDetailLoading(true);

      const res = await AxiosInstance.get(`/manage/packages/${packageId}`);

      setSelectedPackage(res.data);
      setDetails(Array.isArray(res.data?.details) ? res.data.details : []);
    } catch (err: any) {
      alert(err?.response?.data?.message || "fetch package details failed");
    } finally {
      setDetailLoading(false);
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
    if (!user) return;
    if (!customerId) return;

    fetchData();
  }, [customerId]);

  const openCreate = () => {
    if (!customerId) {
      alert("กรุณาเลือกลูกค้าก่อน");
      return;
    }

    resetForm();
    setShowModal(true);
  };

  const openEdit = (row: PackageRow) => {
    setEditing(row);

    setForm({
      package_code: row.package_code || "",
      package_name: row.package_name || "",
      pay_commission: row.pay_commission || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!canManage) return;

    const package_code = cleanCodeInput(form.package_code);
    const package_name = form.package_name.trim();

    if (!package_code) {
      alert("กรุณากรอก Package Code");
      return;
    }

    if (!package_name) {
      alert("กรุณากรอก Package Name");
      return;
    }

    if (!customerId && !editing?.customer_id) {
      alert("กรุณาเลือกลูกค้าก่อน");
      return;
    }

    const payload = {
      package_code,
      package_name,
      customer_id: editing ? editing.customer_id : customerId,
      pay_commission: form.pay_commission || null,
    };

    try {
      setSaving(true);

      if (editing) {
        await AxiosInstance.patch(`/manage/packages/${editing.package_id}`, payload);
      } else {
        await AxiosInstance.post("/manage/packages", payload);
      }

      closeModal();
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "save package failed");
    } finally {
      setSaving(false);
    }
  };

  const openDetails = async (row: PackageRow) => {
    setSelectedPackage(row);
    setDetails([]);
    setShowDetailModal(true);
    await fetchDetails(row.package_id);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedPackage(null);
    setDetails([]);
    resetDetailForm();
  };

  const openCreateDetail = () => {
    resetDetailForm();
    setShowDetailFormModal(true);
  };

  const openEditDetail = (row: DetailRow) => {
    setEditingDetail(row);

    setDetailForm({
      package_detail_code: row.package_detail_code || "",
      package_detail_name: row.package_detail_name || "",
      size_min: String(row.size_min ?? ""),
      size_max: String(row.size_max ?? ""),
      weight_min: String(row.weight_min ?? ""),
      weight_max: String(row.weight_max ?? ""),
      cost: String(row.cost ?? ""),
      cost_difference_warehouse: String(row.cost_difference_warehouse ?? ""),
      package_setting_id: String(row.package_setting_id ?? ""),
    });

    setShowDetailFormModal(true);
  };

  const closeDetailFormModal = () => {
    setShowDetailFormModal(false);
    resetDetailForm();
  };

  const handleSaveDetail = async () => {
    if (!canManage || !selectedPackage) return;

    const package_detail_code = cleanCodeInput(detailForm.package_detail_code);
    const package_detail_name = detailForm.package_detail_name.trim();

    const payload: any = {
      package_detail_code: package_detail_code || null,
      package_detail_name: package_detail_name || null,
      size_min: detailForm.size_min || null,
      size_max: detailForm.size_max || null,
      weight_min: detailForm.weight_min || null,
      weight_max: detailForm.weight_max || null,
      cost: detailForm.cost || null,
      cost_difference_warehouse: detailForm.cost_difference_warehouse || null,
    };

    if (selectedPackageType === "EXPRESS") {
      payload.package_setting_id = detailForm.package_setting_id || null;
    }

    try {
      setSaving(true);

      if (editingDetail) {
        await AxiosInstance.patch(`/manage/packages/${selectedPackage.package_id}/details/${editingDetail.id}`, payload);
      } else {
        await AxiosInstance.post(`/manage/packages/${selectedPackage.package_id}/details`, payload);
      }

      closeDetailFormModal();
      fetchDetails(selectedPackage.package_id);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "save detail failed");
    } finally {
      setSaving(false);
    }
  };

  const openStatusModal = (mode: "PACKAGE" | "DETAIL", row: any) => {
    setSelectedStatus({
      mode,
      id: mode === "PACKAGE" ? row.package_id : row.id,
      current: row.is_actived || "N",
    });

    setStatusModal(true);
  };

  const closeStatusModal = () => {
    setStatusModal(false);
    setSelectedStatus(null);
  };

  const changeStatus = async (isActived: "Y" | "N") => {
    if (!selectedStatus) return;

    try {
      setSaving(true);

      if (selectedStatus.mode === "PACKAGE") {
        await AxiosInstance.patch(`/manage/packages/${selectedStatus.id}/status`, {
          is_actived: isActived,
        });

        fetchData();
      }

      if (selectedStatus.mode === "DETAIL" && selectedPackage) {
        await AxiosInstance.patch(`/manage/packages/${selectedPackage.package_id}/details/${selectedStatus.id}/status`, {
          is_actived: isActived,
        });

        fetchDetails(selectedPackage.package_id);
        fetchData();
      }

      closeStatusModal();
    } catch (err: any) {
      alert(err?.response?.data?.message || "update status failed");
    } finally {
      setSaving(false);
    }
  };

  const gridRows = useMemo(() => {
    return rows.map((r, i) => ({
      ...r,
      id: r.package_id,
      no: i + 1,
    }));
  }, [rows]);

  const detailGridRows = useMemo(() => {
    return details.map((r, i) => ({
      ...r,
      no: i + 1,
    }));
  }, [details]);

  const packageColumns = useMemo(
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
        field: "package_code",
        headerName: "Package Code",
        width: 160,
        minWidth: 130,
        renderCell: (params: any) => (
          <div title={params.value || ""} className="font-medium truncate">
            {params.value || "-"}
          </div>
        ),
      },
      {
        field: "package_name",
        headerName: "Package Name",
        width: 280,
        minWidth: 220,
        renderCell: (params: any) => (
          <div title={params.value || ""} className="truncate">
            {params.value || "-"}
          </div>
        ),
      },
      ...(!isCustomer
        ? [
            {
              field: "customer_name",
              headerName: "Customer",
              width: 280,
              minWidth: 220,
              renderCell: (params: any) => (
                <div title={params.value || ""} className="truncate">
                  {params.value || "-"}
                </div>
              ),
            },
          ]
        : []),
      {
        field: "detail_count",
        headerName: "Detail",
        width: 120,
        minWidth: 100,
        align: "center" as const,
        headerAlign: "center" as const,
        sortable: false,
        filterable: false,
        renderCell: (params: any) => {
          const count =
            params.row.detail_count ??
            (params.row.package_type === "EXPRESS" ? params.row.express_detail_count || 0 : params.row.business_detail_count || 0);

          return <span>{count} รายการ</span>;
        },
      },
      {
        field: "is_actived",
        headerName: "Status",
        width: 130,
        minWidth: 120,
        sortable: false,
        filterable: false,
        align: "center" as const,
        headerAlign: "center" as const,
        renderCell: (params: any) =>
          canManage ? (
            <button type="button" onClick={() => openStatusModal("PACKAGE", params.row)} className="inline-block" title="คลิกเพื่อเปลี่ยนสถานะ">
              {params.row.is_actived === "Y" ? (
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600 font-medium hover:bg-green-200 cursor-pointer">
                  Active
                </span>
              ) : (
                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-500 font-medium hover:bg-red-200 cursor-pointer">Inactive</span>
              )}
            </button>
          ) : params.row.is_actived === "Y" ? (
            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600 font-medium">Active</span>
          ) : (
            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-500 font-medium">Inactive</span>
          ),
      },
      {
        field: "actions",
        headerName: "จัดการ",
        width: canManage ? 170 : 110,
        minWidth: canManage ? 150 : 100,
        sortable: false,
        filterable: false,
        resizable: false,
        align: "center" as const,
        headerAlign: "center" as const,
        renderCell: (params: any) => (
          <div className="flex h-full w-full items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => openDetails(params.row)}
              className="h-8 px-3 text-xs rounded-lg bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100"
            >
              ราคา
            </button>

            {canManage && (
              <button
                type="button"
                onClick={() => openEdit(params.row)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>
        ),
      },
    ],
    [isCustomer, canManage],
  );

  const detailColumns = useMemo(
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
        field: "package_detail_code",
        headerName: "Detail Code",
        width: 150,
        minWidth: 130,
        renderCell: (params: any) => (
          <div title={params.value || ""} className="font-medium truncate">
            {params.value || "-"}
          </div>
        ),
      },
      {
        field: "package_detail_name",
        headerName: "Detail Name",
        width: 240,
        minWidth: 200,
        renderCell: (params: any) => (
          <div title={params.value || ""} className="truncate">
            {params.value || "-"}
          </div>
        ),
      },
      {
        field: "size",
        headerName: "Size",
        width: 140,
        minWidth: 120,
        renderCell: (params: any) => `${params.row.size_min ?? "-"} - ${params.row.size_max ?? "-"}`,
      },
      {
        field: "weight",
        headerName: "Weight",
        width: 150,
        minWidth: 130,
        renderCell: (params: any) => `${params.row.weight_min ?? "-"} - ${params.row.weight_max ?? "-"}`,
      },
      {
        field: "cost",
        headerName: "Cost",
        width: 120,
        minWidth: 100,
        renderCell: (params: any) => params.value ?? "-",
      },
      {
        field: "cost_difference_warehouse",
        headerName: "Diff WH",
        width: 120,
        minWidth: 100,
        renderCell: (params: any) => params.value ?? "-",
      },
      {
        field: "is_actived",
        headerName: "Status",
        width: 130,
        minWidth: 120,
        sortable: false,
        filterable: false,
        align: "center" as const,
        headerAlign: "center" as const,
        renderCell: (params: any) =>
          canManage ? (
            <button type="button" onClick={() => openStatusModal("DETAIL", params.row)} className="inline-block" title="คลิกเพื่อเปลี่ยนสถานะ">
              {params.row.is_actived === "Y" ? (
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600 font-medium hover:bg-green-200 cursor-pointer">
                  Active
                </span>
              ) : (
                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-500 font-medium hover:bg-red-200 cursor-pointer">Inactive</span>
              )}
            </button>
          ) : params.row.is_actived === "Y" ? (
            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600 font-medium">Active</span>
          ) : (
            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-500 font-medium">Inactive</span>
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
        align: "center" as const,
        headerAlign: "center" as const,
        renderCell: (params: any) =>
          canManage ? (
            <div className="flex h-full w-full items-center justify-center">
              <button
                type="button"
                onClick={() => openEditDetail(params.row)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
              >
                <Pencil size={14} />
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-400">ดูอย่างเดียว</span>
          ),
      },
    ],
    [canManage],
  );

  return (
    <div className="w-full h-[calc(100vh-61px)] px-1 py-4 bg-slate-50 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mt-[-15px] mb-2 shrink-0">
        <div>
          <h2 className="text-xl font-semibold mb-1 text-slate-800">Package Management</h2>
          <p className="text-sm text-slate-500">{isCustomer ? "ดูราคาค่าส่งของคุณ" : "จัดการราคาค่าส่งของลูกค้า"}</p>
        </div>

        {canManage && (
          <button type="button" onClick={openCreate} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white shadow hover:bg-blue-700 transition">
            + เพิ่ม Package
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-2 flex gap-3 flex-wrap shrink-0">
        {canSelectCustomer && (
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="input-modern w-auto">
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} {c.code ? `${c.code} - ` : ""}
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        )}

        <input
          placeholder="ค้นหา Package Code / Package Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-modern w-[320px]"
          onKeyDown={(e) => {
            if (e.key === "Enter") fetchData();
          }}
        />

        <button type="button" onClick={fetchData} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
          ค้นหา
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <DataGrid rows={gridRows} columns={packageColumns} loading={loading} getRowId={(row: any) => row.package_id} height="100%" pageSize={100} />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeModal}>
          <div
            className="bg-white p-6 rounded-2xl shadow-xl w-[620px] max-h-[90vh] overflow-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-5">{editing ? "แก้ไข Package" : "เพิ่ม Package"}</h3>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <RequiredLabel>Customer</RequiredLabel>
                  <div className="input-modern w-full bg-slate-100 text-slate-600 flex items-center">
                    {editing ? (
                      <>
                        {editing.customer_name || "-"}
                        {editing.package_type ? ` (${editing.package_type})` : ""}
                      </>
                    ) : selectedCustomer ? (
                      <>
                        {selectedCustomer.id} {selectedCustomer.code ? `${selectedCustomer.code} - ` : ""}
                        {selectedCustomer.name}
                        {selectedCustomer.type ? ` (${selectedCustomer.type})` : ""}
                      </>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>

                <div>
                  <RequiredLabel required>Package Code</RequiredLabel>
                  <input
                    className="input-modern w-full"
                    placeholder="Package Code"
                    value={form.package_code}
                    onChange={(e) => handleChange("package_code", cleanCodeInput(e.target.value))}
                  />
                </div>

                <div>
                  <RequiredLabel required>Package Name</RequiredLabel>
                  <input
                    className="input-modern w-full"
                    placeholder="Package Name"
                    value={form.package_name}
                    onChange={(e) => handleChange("package_name", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeDetailModal}>
          <div
            className="bg-white p-6 rounded-2xl shadow-xl w-[1180px] max-h-[90vh] overflow-hidden animate-scaleIn flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4 shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">ราคา</h3>
                <p className="text-sm text-slate-500">
                  {selectedPackage.package_code} / {selectedPackage.package_name} / {selectedPackageType || "-"}
                </p>
              </div>

              <div className="flex gap-2">
                {canManage && (
                  <button type="button" onClick={openCreateDetail} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                    + เพิ่มราคา
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <DataGrid
                rows={detailGridRows}
                columns={detailColumns}
                loading={detailLoading}
                getRowId={(row: any) => row.id}
                height="100%"
                pageSize={100}
              />
            </div>
          </div>
        </div>
      )}

      {showDetailFormModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={closeDetailFormModal}>
          <div
            className="bg-white p-6 rounded-2xl shadow-xl w-[820px] max-h-[90vh] overflow-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-1">{editingDetail ? "แก้ไขราคา" : "เพิ่มราคา"}</h3>
            <p className="text-sm text-slate-500 mb-5">ประเภท: {selectedPackageType || "-"}</p>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <RequiredLabel>Detail Code</RequiredLabel>
                  <input
                    className="input-modern w-full"
                    placeholder="Detail Code"
                    value={detailForm.package_detail_code}
                    onChange={(e) => handleDetailChange("package_detail_code", cleanCodeInput(e.target.value))}
                  />
                </div>

                <div>
                  <RequiredLabel>Detail Name</RequiredLabel>
                  <input
                    className="input-modern w-full"
                    placeholder="Detail Name"
                    value={detailForm.package_detail_name}
                    onChange={(e) => handleDetailChange("package_detail_name", e.target.value)}
                  />
                </div>

                {selectedPackageType === "EXPRESS" && (
                  <div>
                    <RequiredLabel>Package Setting ID</RequiredLabel>
                    <input
                      className="input-modern w-full"
                      placeholder="Package Setting ID"
                      value={detailForm.package_setting_id}
                      onChange={(e) => handleDetailChange("package_setting_id", cleanNumberInput(e.target.value))}
                    />
                  </div>
                )}

                <div>
                  <RequiredLabel>Size Min</RequiredLabel>
                  <input
                    className="input-modern w-full"
                    placeholder="Size Min"
                    value={detailForm.size_min}
                    onChange={(e) => handleDetailChange("size_min", cleanNumberInput(e.target.value))}
                  />
                </div>

                <div>
                  <RequiredLabel>Size Max</RequiredLabel>
                  <input
                    className="input-modern w-full"
                    placeholder="Size Max"
                    value={detailForm.size_max}
                    onChange={(e) => handleDetailChange("size_max", cleanNumberInput(e.target.value))}
                  />
                </div>

                <div>
                  <RequiredLabel>Weight Min</RequiredLabel>
                  <input
                    className="input-modern w-full"
                    placeholder="Weight Min"
                    value={detailForm.weight_min}
                    onChange={(e) => handleDetailChange("weight_min", cleanNumberInput(e.target.value))}
                  />
                </div>

                <div>
                  <RequiredLabel>Weight Max</RequiredLabel>
                  <input
                    className="input-modern w-full"
                    placeholder="Weight Max"
                    value={detailForm.weight_max}
                    onChange={(e) => handleDetailChange("weight_max", cleanNumberInput(e.target.value))}
                  />
                </div>

                <div>
                  <RequiredLabel>Cost</RequiredLabel>
                  <input
                    className="input-modern w-full"
                    placeholder="Cost"
                    value={detailForm.cost}
                    onChange={(e) => handleDetailChange("cost", cleanNumberInput(e.target.value))}
                  />
                </div>

                <div>
                  <RequiredLabel>Cost Difference Warehouse</RequiredLabel>
                  <input
                    className="input-modern w-full"
                    placeholder="Cost Difference Warehouse"
                    value={detailForm.cost_difference_warehouse}
                    onChange={(e) => handleDetailChange("cost_difference_warehouse", cleanNumberInput(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={closeDetailFormModal} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleSaveDetail}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {statusModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70]" onClick={closeStatusModal}>
          <div className="bg-white p-6 rounded-2xl shadow-xl w-[300px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4 text-slate-800">สถานะ</h3>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={selectedStatus?.current === "Y" || saving}
                onClick={() => changeStatus("Y")}
                className={`px-4 py-2 rounded-lg ${
                  selectedStatus?.current === "Y" ? "bg-green-50 text-green-300 cursor-not-allowed" : "bg-green-100 text-green-600 hover:bg-green-200"
                }`}
              >
                Active
              </button>

              <button
                type="button"
                disabled={selectedStatus?.current === "N" || saving}
                onClick={() => changeStatus("N")}
                className={`px-4 py-2 rounded-lg ${
                  selectedStatus?.current === "N" ? "bg-red-50 text-red-300 cursor-not-allowed" : "bg-red-100 text-red-500 hover:bg-red-200"
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