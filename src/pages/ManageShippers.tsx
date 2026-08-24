import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import AxiosInstance from "../utils/AxiosInstance";
import { useAuth } from "../context/AuthContext";
import AddressSearchDropdown from "../components/dropdown/AddressSearchDropdown";
import { FileImage, Pencil, Trash2, X } from "lucide-react";
import { cleanCodeInput, cleanNameInput, cleanNumberInput } from "../utils/textSanitizer";
import DataGrid from "../components/DataGrid";
import RequiredLabel from "../components/form/RequiredLabel";

type Id = string | number;
type StatusValue = "ACTIVE" | "INACTIVE";
type YesNo = "Y" | "N" | string;

type Customer = {
  id: Id;
  code?: string;
  name?: string;
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

type ShipperForm = {
  shipper_code: string;
  shipper_type_id: string;
  shipper_name: string;
  address: string;

  subdistrict_id: string;
  district_id: string;
  province_id: string;

  subdistrict_name: string;
  district_name: string;
  province_name: string;

  zip_code: string;
  tel: string;
  fax: string;
};

type ShipperRow = {
  shipper_id: Id;
  shipper_code?: string;
  shipper_type_id?: Id | string;
  shipper_name?: string;
  address?: string;

  subdistrict_id?: Id | string;
  district_id?: Id | string;
  province_id?: Id | string;

  subdistrict_name?: string;
  district_name?: string;
  province_name?: string;

  zip_code?: string;
  tel?: string;
  fax?: string;
  is_deleted?: YesNo;
};

type ShipperGridRow = ShipperRow & {
  id: Id;
  no: number;
};

type ROImage = {
  ro_image_id?: Id;
  image_url: string;
  image_order?: number;
};

type RORow = {
  ro_code_id: Id;
  ro_code?: string;
  ro_name?: string;
  images?: ROImage[];
};

type ROGridRow = RORow & {
  id: Id;
  no: number;
  image_count: number;
};

type SelectedStatus = {
  shipper_id: Id;
  current: StatusValue;
};

type GridCellParams<T> = {
  value?: string | number | null;
  row: T;
};

type ColumnDef<T> = {
  field: string;
  headerName: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  align?: "left" | "right" | "center";
  headerAlign?: "left" | "right" | "center";
  renderCell?: (params: GridCellParams<T>) => ReactNode;
};

type AxiosLikeError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

const getErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err !== null) {
    const error = err as AxiosLikeError;
    return error.response?.data?.message || error.message || fallback;
  }

  return fallback;
};

export default function ManageShippers() {
  const { user } = useAuth();

  const roleId = Number(user?.role_id);
  const isCustomer = roleId === 2;
  const canSelectCustomer = roleId === 1 || roleId === 11;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");

  const [rows, setRows] = useState<ShipperRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [statusModal, setStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<SelectedStatus | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ShipperRow | null>(null);

  const [roModal, setRoModal] = useState(false);
  const [selectedShipper, setSelectedShipper] = useState<ShipperRow | null>(null);

  const [roEditing, setRoEditing] = useState<RORow | null>(null);
  const [roCode, setRoCode] = useState("");
  const [roName, setRoName] = useState("");
  const [roImages, setRoImages] = useState<File[]>([]);

  const [roRows, setRoRows] = useState<RORow[]>([]);
  const [roLoading, setRoLoading] = useState(false);
  const [roSaving, setRoSaving] = useState(false);

  const roFileInputRef = useRef<HTMLInputElement | null>(null);

  const emptyForm: ShipperForm = {
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

  const [form, setForm] = useState<ShipperForm>(emptyForm);

  const selectedCustomer = customers.find((c) => String(c.id) === String(customerId));

  const handleChange = (key: keyof ShipperForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const resetROForm = () => {
    setRoEditing(null);
    setRoCode("");
    setRoName("");
    setRoImages([]);

    if (roFileInputRef.current) {
      roFileInputRef.current.value = "";
    }
  };

  const closeROModal = () => {
    setRoModal(false);
    setSelectedShipper(null);
    setRoRows([]);
    resetROForm();
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

  const handleSelectAddress = (row: AddressSearchRow) => {
    setForm((prev) => ({
      ...prev,

      subdistrict_id: row.subdistrict_id ? String(row.subdistrict_id) : "",
      district_id: row.district_id ? String(row.district_id) : "",
      province_id: row.province_id ? String(row.province_id) : "",

      subdistrict_name: row.subdistrict_name || "",
      district_name: row.district_name || "",
      province_name: row.province_name || "",

      zip_code: row.zip_code || "",
    }));
  };

  const fetchCustomers = async () => {
    try {
      const res = await AxiosInstance.get("/customers");
      const data: Customer[] = res.data || [];

      setCustomers(data);
    } catch (err) {
      alert(getErrorMessage(err, "fetch customers failed"));
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
      alert(getErrorMessage(err, "fetch shippers failed"));
    } finally {
      setLoading(false);
    }
  };

  const fetchRODocuments = async (shipperId: Id) => {
    if (!customerId || !shipperId) return;

    try {
      setRoLoading(true);

      const res = await AxiosInstance.get(`/manage/shippers/${customerId}/${shipperId}/ro-codes`);

      setRoRows(res.data || []);
    } catch (err) {
      alert(getErrorMessage(err, "fetch ro documents failed"));
      setRoRows([]);
    } finally {
      setRoLoading(false);
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
    if (!customerId) {
      setRows([]);
      return;
    }

    fetchData();
  }, [customerId]);

  const openCreate = () => {
    if (!customerId) {
      alert("กรุณาเลือก customer ก่อน");
      return;
    }

    resetForm();
    setShowModal(true);
  };

  const openEdit = (row: ShipperRow) => {
    setEditing(row);

    setForm({
      shipper_code: row.shipper_code || "",
      shipper_type_id: row.shipper_type_id ? String(row.shipper_type_id) : "1",
      shipper_name: row.shipper_name || "",
      address: row.address || "",

      subdistrict_id: row.subdistrict_id ? String(row.subdistrict_id) : "",
      district_id: row.district_id ? String(row.district_id) : "",
      province_id: row.province_id ? String(row.province_id) : "",

      subdistrict_name: row.subdistrict_name || "",
      district_name: row.district_name || "",
      province_name: row.province_name || "",

      zip_code: row.zip_code || "",
      tel: row.tel || "",
      fax: row.fax || "",
    });

    setShowModal(true);
  };

  const openROModal = (row: ShipperRow) => {
    if (!customerId) {
      alert("กรุณาเลือก customer ก่อน");
      return;
    }

    setSelectedShipper(row);
    resetROForm();
    setRoRows([]);
    setRoModal(true);
    fetchRODocuments(row.shipper_id);
  };

  const handleROImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.currentTarget.files || []);

    if (files.length > 5) {
      alert("อัปโหลดรูปได้สูงสุด 5 รูป");
      e.currentTarget.value = "";
      setRoImages([]);
      return;
    }

    if (roEditing) {
      const oldCount = roEditing.images?.length || 0;

      if (oldCount + files.length > 5) {
        alert(`RO นี้มีรูปเดิม ${oldCount} รูป เพิ่มได้อีกไม่เกิน ${5 - oldCount} รูป`);
        e.currentTarget.value = "";
        setRoImages([]);
        return;
      }
    }

    setRoImages(files);
  };

  const getImageSrc = (url?: string | null) => {
    if (!url) return "";

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    const baseURL = AxiosInstance.defaults.baseURL || "";

    return `${baseURL}${url}`;
  };

  const uploadROImages = async (roCodeId: Id) => {
    if (roImages.length === 0 || !selectedShipper) return;

    const formData = new FormData();

    roImages.forEach((file) => {
      formData.append("images", file);
    });

    await AxiosInstance.post(`/manage/shippers/${customerId}/${selectedShipper.shipper_id}/ro-codes/${roCodeId}/images`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  };

  const handleSaveRO = async () => {
    if (!customerId) {
      alert("กรุณาเลือก customer ก่อน");
      return;
    }

    if (!selectedShipper?.shipper_id) {
      alert("ไม่พบข้อมูลผู้ส่ง");
      return;
    }

    const cleanROCode = cleanCodeInput(roCode);
    const cleanROName = roName.trim();

    if (!cleanROCode) {
      alert("กรุณากรอก RO Code");
      return;
    }

    if (!cleanROName) {
      alert("กรุณากรอกชื่อ RO");
      return;
    }

    if (!roEditing && roImages.length === 0) {
      alert("กรุณาเลือกรูปเอกสารรับกลับอย่างน้อย 1 รูป");
      return;
    }

    if (roImages.length > 5) {
      alert("อัปโหลดรูปได้สูงสุด 5 รูป");
      return;
    }

    try {
      setRoSaving(true);

      if (roEditing) {
        await AxiosInstance.patch(`/manage/shippers/${customerId}/${selectedShipper.shipper_id}/ro-codes/${roEditing.ro_code_id}`, {
          ro_code: cleanROCode,
          ro_name: cleanROName,
        });

        if (roImages.length > 0) {
          await uploadROImages(roEditing.ro_code_id);
        }

        alert("แก้ไขเอกสารรับกลับสำเร็จ");
      } else {
        const createRes = await AxiosInstance.post(`/manage/shippers/${customerId}/${selectedShipper.shipper_id}/ro-codes`, {
          ro_code: cleanROCode,
          ro_name: cleanROName,
        });

        const roCodeId = createRes.data?.ro_code_id;

        if (!roCodeId) {
          throw new Error("ไม่พบ ro_code_id");
        }

        await uploadROImages(roCodeId);

        alert("บันทึกเอกสารรับกลับสำเร็จ");
      }

      resetROForm();
      await fetchRODocuments(selectedShipper.shipper_id);
    } catch (err) {
      alert(getErrorMessage(err, "save ro failed"));
    } finally {
      setRoSaving(false);
    }
  };

  const handleEditRO = (row: RORow) => {
    setRoEditing(row);
    setRoCode(row.ro_code || "");
    setRoName(row.ro_name || "");
    setRoImages([]);

    if (roFileInputRef.current) {
      roFileInputRef.current.value = "";
    }
  };

  const handleCancelEditRO = () => {
    resetROForm();
  };

  const handleDeleteRO = async (row: RORow) => {
    if (!customerId || !selectedShipper?.shipper_id || !row?.ro_code_id) return;

    const ok = window.confirm(`ต้องการลบ RO "${row.ro_code}" ใช่ไหม?`);

    if (!ok) return;

    try {
      await AxiosInstance.delete(`/manage/shippers/${customerId}/${selectedShipper.shipper_id}/ro-codes/${row.ro_code_id}`);

      if (roEditing?.ro_code_id === row.ro_code_id) {
        resetROForm();
      }

      await fetchRODocuments(selectedShipper.shipper_id);

      alert("ลบ RO สำเร็จ");
    } catch (err) {
      alert(getErrorMessage(err, "delete ro failed"));
    }
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

    if (tel && !tel.startsWith("0")) {
      alert("เบอร์โทรต้องขึ้นต้นด้วย 0");
      return;
    }

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
      alert(getErrorMessage(err, "save shipper failed"));
    }
  };

  const openStatusModal = (row: ShipperRow) => {
    setSelectedStatus({
      shipper_id: row.shipper_id,
      current: row.is_deleted === "N" ? "ACTIVE" : "INACTIVE",
    });

    setStatusModal(true);
  };

  const changeStatus = async (status: StatusValue) => {
    if (!selectedStatus || !customerId) return;

    try {
      await AxiosInstance.patch(`/manage/shippers/${customerId}/${selectedStatus.shipper_id}/status`, {
        is_deleted: status === "ACTIVE" ? "N" : "Y",
      });

      setStatusModal(false);
      setSelectedStatus(null);
      fetchData();
    } catch (err) {
      alert(getErrorMessage(err, "update status failed"));
    }
  };

  const gridRows = useMemo<ShipperGridRow[]>(() => {
    return rows.map((r, i) => ({
      ...r,
      id: r.shipper_id,
      no: i + 1,
    }));
  }, [rows]);

  const roGridRows = useMemo<ROGridRow[]>(() => {
    return roRows.map((r, i) => ({
      ...r,
      id: r.ro_code_id,
      no: i + 1,
      image_count: r.images?.length || 0,
    }));
  }, [roRows]);

  const shipperColumns = useMemo<ColumnDef<ShipperGridRow>[]>(
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
          <div title={String(params.value || "")} className="truncate">
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
          <div title={String(params.value || "")} className="truncate">
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
        width: 150,
        minWidth: 140,
        sortable: false,
        filterable: false,
        resizable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <div className="flex h-full w-full items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => openEdit(params.row)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
              title="แก้ไขผู้ส่ง"
            >
              <Pencil size={14} />
            </button>

            <button
              type="button"
              onClick={() => openROModal(params.row)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100"
              title="เอกสารรับกลับ"
            >
              <FileImage size={14} />
            </button>
          </div>
        ),
      },
    ],
    [customerId],
  );

  const roColumns = useMemo<ColumnDef<ROGridRow>[]>(
    () => [
      {
        field: "no",
        headerName: "#",
        width: 52,
        minWidth: 50,
        sortable: false,
        filterable: false,
        resizable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => <div className="h-full w-full flex items-center justify-center text-sm">{params.value}</div>,
      },
      {
        field: "ro_code",
        headerName: "RO Code",
        width: 115,
        minWidth: 105,
        renderCell: (params) => (
          <div className="h-full w-full flex items-center">
            <span title={String(params.value || "")} className="truncate text-sm">
              {params.value || "-"}
            </span>
          </div>
        ),
      },
      {
        field: "ro_name",
        headerName: "ชื่อ RO",
        width: 170,
        minWidth: 145,
        renderCell: (params) => (
          <div className="h-full w-full flex items-center">
            <span title={String(params.value || "")} className="truncate text-sm">
              {params.value || "-"}
            </span>
          </div>
        ),
      },
      {
        field: "images",
        headerName: "รูปเอกสาร",
        width: 225,
        minWidth: 215,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const images = params.row.images || [];

          if (images.length === 0) {
            return (
              <div className="h-full w-full flex items-center">
                <span className="text-xs text-slate-400">ไม่มีรูป</span>
              </div>
            );
          }

          return (
            <div className="h-full w-full flex items-center gap-1 overflow-hidden">
              {images.slice(0, 5).map((img, index) => (
                <a
                  key={img.ro_image_id || `${params.row.ro_code_id}-${index}`}
                  href={getImageSrc(img.image_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-7 h-7 rounded border border-slate-200 overflow-hidden bg-slate-100 shrink-0 hover:border-blue-300"
                  title={`เปิดรูปที่ ${img.image_order || index + 1}`}
                >
                  <img src={getImageSrc(img.image_url)} alt={`${params.row.ro_code}-${index + 1}`} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          );
        },
      },
      {
        field: "actions",
        headerName: "จัดการ",
        width: 95,
        minWidth: 90,
        sortable: false,
        filterable: false,
        resizable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <div className="h-full w-full flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => handleEditRO(params.row)}
              className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
              title="แก้ไข RO"
            >
              <Pencil size={12} />
            </button>

            <button
              type="button"
              onClick={() => handleDeleteRO(params.row)}
              className="w-6 h-6 flex items-center justify-center rounded-md bg-red-50 text-red-500 border border-red-200 hover:bg-red-100"
              title="ลบ RO"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ),
      },
    ],
    [roEditing],
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
            <option value="">เลือกผู้ส่ง</option>
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
        <DataGrid
          rows={gridRows}
          columns={shipperColumns}
          loading={loading}
          getRowId={(row: ShipperGridRow) => row.shipper_id}
          height="100%"
          pageSize={100}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="relative bg-white p-6 rounded-2xl shadow-xl w-[560px] max-h-[90vh] overflow-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={closeModal} className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700" aria-label="ปิด">
              <X size={18} />
            </button>
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

      {roModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="bg-white p-4 rounded-2xl shadow-xl w-[760px] max-h-[88vh] overflow-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-800">เอกสารรับกลับ</h3>
                <p className="text-slate-500 mt-1 text-sm">
                  ผู้ส่ง: {selectedShipper?.shipper_code || "-"} - {selectedShipper?.shipper_name || "-"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeROModal}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50 mb-3">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h4 className="font-medium text-slate-700 text-sm">{roEditing ? "แก้ไขเอกสารรับกลับ" : "เพิ่มเอกสารรับกลับ"}</h4>

                {roEditing && (
                  <button
                    type="button"
                    onClick={handleCancelEditRO}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs"
                  >
                    ยกเลิกแก้ไข
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <div className="w-full sm:w-[180px] shrink-0">
                  <RequiredLabel required>RO Code</RequiredLabel>
                  <input
                    className="input-modern w-full h-9 text-sm bg-white"
                    placeholder="รหัสเอกสารรับกลับ"
                    value={roCode}
                    onChange={(e) => setRoCode(cleanCodeInput(e.target.value))}
                  />
                </div>

                <div className="w-full sm:flex-1 sm:min-w-[220px]">
                  <RequiredLabel required>ชื่อ RO</RequiredLabel>
                  <input
                    className="input-modern w-full h-9 text-sm bg-white"
                    placeholder="ชื่อเอกสารรับกลับ"
                    value={roName}
                    onChange={(e) => setRoName(e.target.value)}
                  />
                </div>

                <div className="w-[105px] shrink-0">
                  <RequiredLabel required={!roEditing}>{roEditing ? "เพิ่มรูป" : "รูปเอกสาร"}</RequiredLabel>

                  <input
                    ref={roFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleROImageChange}
                  />

                  <button
                    type="button"
                    onClick={() => roFileInputRef.current?.click()}
                    className="w-full h-9 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 text-xs px-2 whitespace-nowrap"
                  >
                    เลือกรูป
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveRO}
                  disabled={roSaving}
                  className="w-[70px] h-9 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 text-xs shrink-0"
                >
                  {roSaving ? "..." : roEditing ? "อัปเดต" : "บันทึก"}
                </button>
              </div>

              <div className="flex items-center justify-between mt-2 gap-3">
                <p className="text-[11px] text-slate-500">
                  {roEditing ? "ถ้าไม่เพิ่มรูปใหม่ ไม่ต้องเลือกไฟล์ รวมได้ไม่เกิน 5 รูป" : "สูงสุด 5 รูป รองรับ JPG, PNG, WEBP"}
                </p>

                {roImages.length > 0 && (
                  <span className="text-[11px] text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5 shrink-0">
                    เลือกแล้ว {roImages.length} รูป
                  </span>
                )}
              </div>
            </div>

            {roImages.length > 0 && (
              <div className="mt-2 rounded-lg border border-slate-200 bg-white px-2 py-1">
                <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-slate-500">
                  {roImages.map((file, index) => (
                    <span
                      key={`${file.name}-${index}`}
                      className="max-w-[135px] truncate bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5"
                      title={file.name}
                    >
                      {index + 1}. {file.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-medium text-slate-700 mb-2 text-sm">รายการเอกสารรับกลับ</h4>

              {roLoading ? (
                <div className="text-sm text-slate-500 py-5 text-center border rounded-xl">กำลังโหลด...</div>
              ) : roRows.length === 0 ? (
                <div className="text-sm text-slate-500 py-5 text-center border rounded-xl">ยังไม่มีเอกสารรับกลับ</div>
              ) : (
                <div className="h-[320px] overflow-hidden border border-slate-200 rounded-xl">
                  <DataGrid
                    rows={roGridRows}
                    columns={roColumns}
                    loading={roLoading}
                    getRowId={(row) => row.ro_code_id}
                    height="100%"
                    pageSize={10}
                  />
                </div>
              )}
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
          <div className="bg-white p-6 rounded-2xl shadow-xl w-[300px] animate-scaleIn" onClick={(e) => e.stopPropagation()}>
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
