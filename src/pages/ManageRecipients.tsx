import { useEffect, useMemo, useState } from "react";
import { DataGrid, type GridColDef, type GridPaginationModel } from "@mui/x-data-grid";
import { ChevronDown, ChevronRight, Pencil, Plus } from "lucide-react";

import AxiosInstance from "../utils/AxiosInstance";
import { useAuth } from "../context/AuthContext";
import AddressSearchDropdown from "../components/dropdown/AddressSearchDropdown";
import RequiredLabel from "../components/form/RequiredLabel";

type Id = string | number;
type YesNo = "Y" | "N" | string;

type Customer = {
  id: Id;
  code?: string;
  name?: string;
};

type RecipientType = {
  id: Id;
  name: string;
};

type RecipientDetail = {
  recipient_detail_id: Id;
  recipient_detail_name?: string;
  address?: string;
  subdistrict_id?: Id | "";
  district_id?: Id | "";
  province_id?: Id | "";
  subdistrict_name?: string;
  district_name?: string;
  province_name?: string;
  zip_code?: string;
  tel1?: string;
  line_id?: string;
  detail_is_deleted?: YesNo;
};

type ApiRecipientRow = {
  recipient_id?: Id;
  recipient_code?: string;
  recipient_type_id?: Id | "";
  recipient_type_name?: string;
  recipient_name?: string;
  customer_id?: Id;
  recipient_customer_id?: Id;
  customer_code?: string;
  customer_name?: string;
  recipient_is_deleted?: YesNo;
  address_count?: number | string;
  recipient_detail_id?: Id;
  recipient_detail_name?: string;
  address?: string;
  subdistrict_id?: Id | "";
  district_id?: Id | "";
  province_id?: Id | "";
  subdistrict_name?: string;
  district_name?: string;
  province_name?: string;
  zip_code?: string;
  tel1?: string;
  line_id?: string;
  detail_is_deleted?: YesNo;
};

type Recipient = {
  recipient_id: Id;
  recipient_code?: string;
  recipient_type_id?: Id | "";
  recipient_type_name?: string;
  recipient_name?: string;
  customer_id?: Id;
  recipient_customer_id?: Id;
  customer_code?: string;
  customer_name?: string;
  recipient_is_deleted?: YesNo;
  address_count?: number;
  details: RecipientDetail[];
};

type DisplayRow =
  | (Recipient & {
      id: string;
      rowType: "recipient";
    })
  | {
      id: string;
      rowType: "detail";
      recipient: Recipient;
    };

type ModalMode = "createRecipient" | "editRecipient" | "createDetail" | "editDetail";

type RecipientForm = {
  recipient_code: string;
  recipient_type_id: string;
  recipient_name: string;
  recipient_detail_id: string;
  recipient_detail_name: string;
  address: string;
  address_search: string;
  subdistrict_id: string;
  district_id: string;
  province_id: string;
  zip_code: string;
  tel1: string;
  line_id: string;
};

type AddressSearchRow = {
  subdistrict_id?: Id;
  district_id?: Id;
  province_id?: Id;
  subdistrict_name?: string;
  district_name?: string;
  province_name?: string;
  zip_code?: string;
};

type StatusValue = "ACTIVE" | "INACTIVE";

type SelectedStatus = {
  recipient_id: Id;
  recipient_detail_id: Id;
  current: StatusValue;
};

type RecipientDetailsInlinePanelProps = {
  recipient: Recipient;
  onCreateDetail: (recipient: Recipient) => void;
  onEditDetail: (recipient: Recipient, detail: RecipientDetail) => void;
  onOpenStatus: (recipient: Recipient, detail: RecipientDetail) => void;
};

const getErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err !== null && "response" in err) {
    const axiosError = err as {
      response?: {
        data?: {
          message?: string;
        };
      };
    };

    return axiosError.response?.data?.message || fallback;
  }

  return fallback;
};

function RecipientDetailsInlinePanel({ recipient, onCreateDetail, onEditDetail, onOpenStatus }: RecipientDetailsInlinePanelProps) {
  return (
    <div className="w-full bg-slate-50 px-6 py-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold text-slate-800 truncate">
              รายละเอียดที่อยู่ของ {recipient.recipient_code || "-"} - {recipient.recipient_name || "-"}
            </div>

            <div className="text-xs text-slate-500 mt-0.5">ทั้งหมด {recipient.address_count || recipient.details?.length || 0} ที่อยู่</div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCreateDetail(recipient);
            }}
            className="inline-flex h-9 items-center justify-center gap-1 px-3 rounded-xl bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 text-sm"
          >
            <Plus size={14} />
            เพิ่มที่อยู่
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1320px]">
            <div className="grid grid-cols-[220px_320px_140px_140px_140px_100px_130px_150px_110px_90px] gap-3 px-4 py-2 bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-100">
              <div>recipient_detail_name</div>
              <div>address</div>
              <div>subdistrict</div>
              <div>district</div>
              <div>province</div>
              <div>zip_code</div>
              <div>tel1</div>
              <div>line_id</div>
              <div className="text-center">status</div>
              <div className="text-center">edit</div>
            </div>

            {!recipient.details?.length ? (
              <div className="px-4 py-5 text-sm text-slate-400">ยังไม่มีที่อยู่ของผู้รับนี้ กดปุ่ม “เพิ่มที่อยู่” เพื่อเพิ่ม</div>
            ) : (
              recipient.details.map((detail: RecipientDetail) => (
                <div
                  key={detail.recipient_detail_id}
                  className="grid grid-cols-[220px_320px_140px_140px_140px_100px_130px_150px_110px_90px] items-center gap-3 px-4 py-3 text-sm text-slate-700 border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
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

                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenStatus(recipient, detail);
                      }}
                      className="inline-flex items-center justify-center"
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

                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditDetail(recipient, detail);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
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
    </div>
  );
}

export default function ManageRecipients() {
  const { user } = useAuth();

  const isCustomer = Number(user?.role_id) === 2;
  const canSelectCustomer = !isCustomer;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [recipientTypes, setRecipientTypes] = useState<RecipientType[]>([]);
  const [customerId, setCustomerId] = useState("");

  const [rows, setRows] = useState<ApiRecipientRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 100,
  });

  const [rowCount, setRowCount] = useState(0);
  const [expandedRecipientId, setExpandedRecipientId] = useState<Id | null>(null);

  const [showModal, setShowModal] = useState(false);

  const [modalMode, setModalMode] = useState<ModalMode>("createRecipient");

  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null);
  const [editingDetail, setEditingDetail] = useState<RecipientDetail | null>(null);

  const [statusModal, setStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<SelectedStatus | null>(null);

  const emptyForm: RecipientForm = {
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

  const [form, setForm] = useState<RecipientForm>(emptyForm);

  const selectedCustomer = customers.find((customer) => String(customer.id) === String(customerId));

  const groupedRows = useMemo<Recipient[]>(() => {
    const map = new Map<Id, Recipient>();

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
        map.get(key)?.details.push({
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

  const displayRows = useMemo<DisplayRow[]>(() => {
    const result: DisplayRow[] = [];

    groupedRows.forEach((recipient) => {
      result.push({
        ...recipient,
        id: `recipient-${recipient.recipient_id}`,
        rowType: "recipient",
      });

      if (String(expandedRecipientId) === String(recipient.recipient_id)) {
        result.push({
          id: `detail-${recipient.recipient_id}`,
          rowType: "detail",
          recipient,
        });
      }
    });

    return result;
  }, [groupedRows, expandedRecipientId]);

  const getAddressLabel = (detail: RecipientDetail | null) => {
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

  const handleChange = (key: keyof RecipientForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectAddress = (row: AddressSearchRow) => {
    setForm((prev) => ({
      ...prev,
      address_search: `${row.subdistrict_name} • ${row.district_name} • ${row.province_name} • ${row.zip_code}`,
      subdistrict_id: row.subdistrict_id ? String(row.subdistrict_id) : "",
      district_id: row.district_id ? String(row.district_id) : "",
      province_id: row.province_id ? String(row.province_id) : "",
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
      const res = await AxiosInstance.get("/customers");
      const data = res.data || [];

      setCustomers(data);

      if (data.length > 0) {
        setCustomerId((prev) => prev || String(data[0].id));
      }
    } catch (err) {
      alert(getErrorMessage(err, "fetch customers failed"));
    }
  };

  const fetchRecipientTypes = async () => {
    try {
      const res = await AxiosInstance.get("/recipient-types");
      setRecipientTypes(res.data || []);
    } catch (err) {
      alert(getErrorMessage(err, "fetch recipient types failed"));
    }
  };

  const fetchData = async (searchValue: string = search, model: GridPaginationModel = paginationModel) => {
    if (!customerId) return;

    try {
      setLoading(true);

      const res = await AxiosInstance.get(`/manage/recipients/${customerId}`, {
        params: {
          search: searchValue || undefined,
          page: model.page + 1,
          pageSize: model.pageSize,
        },
      });

      const responseData = res.data;

      if (Array.isArray(responseData)) {
        setRows(responseData);
        setRowCount(responseData.length);
        return;
      }

      setRows(responseData?.data || []);
      setRowCount(Number(responseData?.pagination?.total || 0));
    } catch (err) {
      alert(getErrorMessage(err, "fetch recipients failed"));
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

    const firstPage = {
      page: 0,
      pageSize: paginationModel.pageSize,
    };

    setPaginationModel(firstPage);
    setExpandedRecipientId(null);
    fetchData(search, firstPage);
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

  const openEditRecipient = (recipient: Recipient) => {
    setModalMode("editRecipient");
    setEditingRecipient(recipient);
    setEditingDetail(null);

    setForm({
      ...emptyForm,
      recipient_code: recipient.recipient_code || "",
      recipient_type_id: recipient.recipient_type_id ? String(recipient.recipient_type_id) : "",
      recipient_name: recipient.recipient_name || "",
    });

    setShowModal(true);
  };

  const openCreateDetail = (recipient: Recipient) => {
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

  const openEditDetail = (recipient: Recipient, detail: RecipientDetail) => {
    setModalMode("editDetail");
    setEditingRecipient(recipient);
    setEditingDetail(detail);

    setForm({
      ...emptyForm,
      recipient_detail_id: detail.recipient_detail_id ? String(detail.recipient_detail_id) : "",
      recipient_detail_name: detail.recipient_detail_name || "",
      address: detail.address || "",
      address_search: getAddressLabel(detail),
      subdistrict_id: detail.subdistrict_id ? String(detail.subdistrict_id) : "",
      district_id: detail.district_id ? String(detail.district_id) : "",
      province_id: detail.province_id ? String(detail.province_id) : "",
      zip_code: detail.zip_code || "",
      tel1: detail.tel1 || "",
      line_id: detail.line_id || "",
    });

    setShowModal(true);
  };

  const openDetailStatusModal = (recipient: Recipient, detail: RecipientDetail) => {
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

        await AxiosInstance.post(`/manage/recipients/${customerId}`, payload);
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

        await AxiosInstance.patch(`/manage/recipients/${customerId}/${editingRecipient.recipient_id}`, payload);
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

        await AxiosInstance.post(`/manage/recipients/${customerId}/${editingRecipient.recipient_id}/details`, payload);
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

        await AxiosInstance.patch(`/manage/recipients/${customerId}/${editingRecipient.recipient_id}`, payload);
      }

      closeModal();
      fetchData(search, paginationModel);
    } catch (err) {
      alert(getErrorMessage(err, "save recipient failed"));
    }
  };

  const changeStatus = async (status: StatusValue) => {
    if (!selectedStatus || !customerId) return;

    try {
      await AxiosInstance.patch(
        `/manage/recipients/${customerId}/${selectedStatus.recipient_id}/details/${selectedStatus.recipient_detail_id}/status`,
        {
          is_deleted: status === "ACTIVE" ? "N" : "Y",
        },
      );

      closeStatusModal();
      fetchData(search, paginationModel);
    } catch (err) {
      alert(getErrorMessage(err, "update recipient detail status failed"));
    }
  };

  const toggleExpandedRecipient = (recipient: DisplayRow) => {
    if (!recipient || recipient.rowType === "detail") return;

    setExpandedRecipientId((prev) => (String(prev) === String(recipient.recipient_id) ? null : recipient.recipient_id));
  };

  const columns = useMemo<GridColDef<DisplayRow>[]>(
    () => [
      {
        field: "detailPanel",
        headerName: "",
        width: 56,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        colSpan: (...args: any[]) => {
          const row = args[1] || args[0]?.row;
          return row?.rowType === "detail" ? 999 : undefined;
        },
        renderCell: (params: any) => {
          if (params.row.rowType === "detail") {
            return (
              <div className="w-full">
                <RecipientDetailsInlinePanel
                  recipient={params.row.recipient}
                  onCreateDetail={openCreateDetail}
                  onEditDetail={openEditDetail}
                  onOpenStatus={openDetailStatusModal}
                />
              </div>
            );
          }

          const isExpanded = String(expandedRecipientId) === String(params.row.recipient_id);

          return (
            <div className="w-full h-full flex items-center justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpandedRecipient(params.row);
                }}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600"
                title={isExpanded ? "ปิดรายละเอียด" : "ดูรายละเอียดที่อยู่"}
              >
                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
            </div>
          );
        },
      },
      {
        field: "recipient_code",
        headerName: "รหัสผู้รับ",
        width: 170,
        minWidth: 150,
        renderCell: (params: any) => {
          if (params.row.rowType === "detail") return null;

          return (
            <div className="w-full h-full flex items-center">
              <span className="font-semibold text-slate-800">{params.value || "-"}</span>
            </div>
          );
        },
      },
      {
        field: "recipient_name",
        headerName: "ชื่อผู้รับ",
        flex: 1,
        minWidth: 260,
        renderCell: (params: any) => {
          if (params.row.rowType === "detail") return null;

          return (
            <div className="w-full h-full flex items-center truncate" title={params.value || ""}>
              {params.value || "-"}
            </div>
          );
        },
      },
      {
        field: "recipient_type_name",
        headerName: "ประเภท",
        width: 160,
        minWidth: 140,
        renderCell: (params: any) => {
          if (params.row.rowType === "detail") return null;

          return (
            <div className="w-full h-full flex items-center">
              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600">{params.value || "-"}</span>
            </div>
          );
        },
      },
      {
        field: "address_count",
        headerName: "ที่อยู่ทั้งหมด",
        width: 120,
        align: "center",
        headerAlign: "center",
        renderCell: (params: any) => {
          if (params.row.rowType === "detail") return null;

          return (
            <div className="w-full h-full flex items-center justify-center">
              <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">
                {params.row.address_count || params.row.details?.length || 0} ที่อยู่
              </span>
            </div>
          );
        },
      },

      {
        field: "actions",
        headerName: "จัดการ",
        width: 180,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        align: "center",
        headerAlign: "center",
        renderCell: (params: any) => {
          if (params.row.rowType === "detail") return null;

          return (
            <div className="w-full h-full flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openCreateDetail(params.row);
                }}
                className="inline-flex h-8 items-center justify-center gap-1 px-3 rounded-lg bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 text-xs"
                title="เพิ่มที่อยู่ให้ผู้รับนี้"
              >
                <Plus size={13} />
                ที่อยู่
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditRecipient(params.row);
                }}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
                title="แก้ไขข้อมูลผู้รับ"
              >
                <Pencil size={14} />
              </button>
            </div>
          );
        },
      },
    ],
    [expandedRecipientId],
  );

  return (
    <div className="w-full h-[calc(100vh-61px)] px-1 py-4 bg-slate-50 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mt-[-15px] mb-2 shrink-0">
        <div>
          <h2 className="text-xl font-semibold mb-1 text-slate-800">Recipient Management</h2>

          <p className="text-sm text-slate-500">
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

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-2 shrink-0">
        <div className="flex flex-col lg:flex-row gap-3">
          {canSelectCustomer && (
            <select
              value={customerId}
              onChange={(e) => {
                const firstPage = {
                  ...paginationModel,
                  page: 0,
                };

                setCustomerId(e.target.value);
                setRows([]);
                setRowCount(0);
                setExpandedRecipientId(null);
                setPaginationModel(firstPage);
              }}
              className="input-modern"
            >
              {customers.map((customer: Customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.id} {customer.code} - {customer.name}
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
              if (e.key === "Enter") {
                const firstPage = {
                  ...paginationModel,
                  page: 0,
                };

                setPaginationModel(firstPage);
                setExpandedRecipientId(null);
                fetchData(e.currentTarget.value, firstPage);
              }
            }}
          />

          <button
            type="button"
            onClick={() => {
              const firstPage = {
                ...paginationModel,
                page: 0,
              };

              setPaginationModel(firstPage);
              setExpandedRecipientId(null);
              fetchData(search, firstPage);
            }}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            ค้นหา
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <DataGrid
          rows={displayRows}
          columns={columns}
          getRowId={(row: DisplayRow) => row.id}
          loading={loading}
          rowCount={rowCount}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={(model: GridPaginationModel) => {
            setPaginationModel(model);
            setExpandedRecipientId(null);
            fetchData(search, model);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          columnHeaderHeight={48}
          getRowHeight={(params: any) => {
            if (String(params.id).startsWith("detail-")) {
              return "auto";
            }

            return 52;
          }}
          getRowClassName={(params: any) => (String(params.id).startsWith("detail-") ? "recipient-detail-row" : "")}
          onRowClick={(params: any) => {
            if (params.row.rowType === "detail") return;
            toggleExpandedRecipient(params.row);
          }}
          sx={{
            border: 0,
            fontFamily: "inherit",

            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
            },

            "& .MuiDataGrid-columnHeader": {
              backgroundColor: "#f8fafc",
              paddingLeft: "12px",
              paddingRight: "12px",
            },

            "& .MuiDataGrid-columnHeaderTitle": {
              color: "#64748b",
              fontSize: "12px",
              fontWeight: 600,
              lineHeight: "18px",
            },

            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
            },

            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
              outline: "none",
            },

            "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": {
              outline: "none",
            },

            "& .MuiDataGrid-row:hover": {
              backgroundColor: "#f8fafc",
              cursor: "pointer",
            },

            "& .recipient-detail-row": {
              backgroundColor: "#f8fafc",
            },

            "& .recipient-detail-row:hover": {
              backgroundColor: "#f8fafc",
              cursor: "default",
            },

            "& .recipient-detail-row .MuiDataGrid-cell": {
              padding: 0,
              borderBottom: "1px solid #e2e8f0",
              alignItems: "stretch",
              maxHeight: "none !important",
            },

            "& .recipient-detail-row .MuiDataGrid-cellContent": {
              width: "100%",
              maxHeight: "none !important",
            },

            "& .MuiDataGrid-footerContainer": {
              borderTop: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
            },
          }}
        />
      </div>

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
                    <div>
                      <RequiredLabel required>รหัสผู้รับ</RequiredLabel>
                      <input
                        className="input-modern w-full"
                        placeholder="Recipient Code"
                        value={form.recipient_code}
                        onChange={(e) => handleChange("recipient_code", e.target.value)}
                      />
                    </div>

                    <div>
                      <RequiredLabel required>ประเภทผู้รับ</RequiredLabel>
                      <select
                        className="input-modern w-full"
                        value={form.recipient_type_id}
                        onChange={(e) => handleChange("recipient_type_id", e.target.value)}
                      >
                        <option value="">เลือกประเภทผู้รับ</option>
                        {recipientTypes.map((type: RecipientType) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <RequiredLabel required>ชื่อผู้รับ</RequiredLabel>
                    <input
                      className="input-modern w-full"
                      placeholder="Recipient Name"
                      value={form.recipient_name}
                      onChange={(e) => handleChange("recipient_name", e.target.value)}
                    />
                  </div>
                </>
              )}

              {isDetailMode && (
                <>
                  <div>
                    <RequiredLabel required>ชื่อที่อยู่</RequiredLabel>
                    <input
                      className="input-modern w-full"
                      placeholder="เช่น สำนักงานใหญ่ / สาขา"
                      value={form.recipient_detail_name}
                      onChange={(e) => handleChange("recipient_detail_name", e.target.value)}
                    />
                  </div>

                  <div>
                    <RequiredLabel required>ที่อยู่</RequiredLabel>
                    <textarea
                      className="input-modern w-full min-h-[80px]"
                      placeholder="Address"
                      value={form.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                    />
                  </div>

                  <div>
                    <RequiredLabel required>ค้นหาตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์</RequiredLabel>

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
                    <div>
                      <RequiredLabel required>เบอร์โทร</RequiredLabel>
                      <input
                        className="input-modern w-full"
                        placeholder="Tel"
                        value={form.tel1}
                        onChange={(e) => handleChange("tel1", e.target.value)}
                      />
                    </div>

                    <div>
                      <RequiredLabel>Line ID</RequiredLabel>
                      <input
                        className="input-modern w-full"
                        placeholder="Line ID"
                        value={form.line_id}
                        onChange={(e) => handleChange("line_id", e.target.value)}
                      />
                    </div>
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