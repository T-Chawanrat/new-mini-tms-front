import { Fragment, useEffect, useMemo, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import DatePicker from "../components/form/DatePicker";
import AxiosInstance from "../utils/AxiosInstance";

// =====================
// Types
// =====================
type YesNo = "Y" | "N";

type ReceiveForm = {
  receive_code: string;
  reference_no: string;

  customer_id: string;
  customer_code: string;
  customer_name: string;

  shipper_id: string;
  shipper_code: string;
  shipper_name: string;
  shipper_address: string;
  shipper_district_name: string;

  recipient_id: string;
  recipient_code: string;
  recipient_detail_id: string;
  recipient_name: string;
  address: string;

  province_id: string;
  district_id: string;
  subdistrict_id: string;

  province_name: string;
  district_name: string;
  subdistrict_name: string;

  zip_code: string;
  tel: string;

  delivery_date: string;
  payment_type_id: string;

  is_cod: YesNo;
  cod: string;

  is_document_return: YesNo;
  document_return: string;

  is_pickup_customer: YesNo;
  is_pickup_shipper: YesNo;

  remark: string;
};

type CustomerOption = {
  id: number;
  code: string;
  name: string;
};

type PaymentOption = {
  id: number;
  name: string;
};

type ShipperOption = {
  shipper_id: number;
  shipper_code: string;
  shipper_name: string;
  address: string | null;

  subdistrict_id?: number | null;
  district_id?: number | null;
  province_id?: number | null;
  zip_code?: string | null;
  tel?: string | null;

  subdistrict_name?: string | null;
  district_name?: string | null;
  province_name?: string | null;
};

type RecipientOption = {
  recipient_id: number;
  recipient_code: string;
  recipient_name: string;

  recipient_detail_id: number | null;
  recipient_detail_name: string | null;
  address: string | null;

  subdistrict_id: number | null;
  district_id: number | null;
  province_id: number | null;

  zip_code: string | null;
  tel: string | null;

  subdistrict_name: string | null;
  district_name: string | null;
  province_name: string | null;
};

type GroupedRecipient = {
  recipient_id: number;
  recipient: RecipientOption;
  details: RecipientOption[];
};

type PackageRow = {
  package_id: string;
  package_code: string;
  package_name: string;
  package_size_name: string;

  width: string;
  length: string;
  height: string;
  q: string;
  weight: string;

  qty: string;
  unit_price: string;
};

// =====================
// Initial state
// =====================
const emptyReceiveForm: ReceiveForm = {
  receive_code: "",
  reference_no: "",

  customer_id: "",
  customer_code: "",
  customer_name: "",

  shipper_id: "",
  shipper_code: "",
  shipper_name: "",
  shipper_address: "",
  shipper_district_name: "",

  recipient_id: "",
  recipient_code: "",
  recipient_detail_id: "",
  recipient_name: "",
  address: "",

  province_id: "",
  district_id: "",
  subdistrict_id: "",

  province_name: "",
  district_name: "",
  subdistrict_name: "",

  zip_code: "",
  tel: "",

  delivery_date: dayjs().format("YYYY-MM-DD"),
  payment_type_id: "",

  is_cod: "N",
  cod: "",

  is_document_return: "N",
  document_return: "",

  is_pickup_customer: "Y",
  is_pickup_shipper: "N",

  remark: "",
};

const emptyPackageRow: PackageRow = {
  package_id: "",
  package_code: "",
  package_name: "",
  package_size_name: "",

  width: "",
  length: "",
  height: "",
  q: "",
  weight: "",

  qty: "1",
  unit_price: "",
};

// =====================
// Helpers
// =====================
const money = (value: number) =>
  value.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function CreateReceivePage() {
  const [form, setForm] = useState<ReceiveForm>(emptyReceiveForm);

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [payments, setPayments] = useState<PaymentOption[]>([]);
  const [shippers, setShippers] = useState<ShipperOption[]>([]);
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);

  const [customerSearch, setCustomerSearch] = useState("");
  const [shipperSearch, setShipperSearch] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showShipperModal, setShowShipperModal] = useState(false);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [expandedRecipientIds, setExpandedRecipientIds] = useState<Record<string, boolean>>({});

  const [packageRows, setPackageRows] = useState<PackageRow[]>([]);
  const [packageForm, setPackageForm] = useState<PackageRow>(emptyPackageRow);
  const [editingPackageIndex, setEditingPackageIndex] = useState<number | null>(null);

  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanBarcode, setScanBarcode] = useState("");

  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateForm = <K extends keyof ReceiveForm>(field: K, value: ReceiveForm[K]) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updatePackageForm = <K extends keyof PackageRow>(field: K, value: PackageRow[K]) => {
    setPackageForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetCustomerRelatedFields = () => {
    setShippers([]);
    setRecipients([]);
    setShipperSearch("");
    setRecipientSearch("");
    setExpandedRecipientIds({});

    setForm((prev) => ({
      ...prev,

      shipper_id: "",
      shipper_code: "",
      shipper_name: "",
      shipper_address: "",
      shipper_district_name: "",

      recipient_id: "",
      recipient_code: "",
      recipient_detail_id: "",
      recipient_name: "",
      address: "",

      province_id: "",
      district_id: "",
      subdistrict_id: "",

      province_name: "",
      district_name: "",
      subdistrict_name: "",

      zip_code: "",
      tel: "",
    }));
  };

  // =====================
  // API
  // =====================
  const loadCustomers = async () => {
    setLoadingCustomers(true);

    try {
      const res = await AxiosInstance.get("/receives/options/customers");
      setCustomers(res.data || []);
    } catch (err) {
      console.error("LOAD CUSTOMERS ERROR:", err);

      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "โหลดข้อมูลเจ้าของงานไม่สำเร็จ");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("โหลดข้อมูลเจ้าของงานไม่สำเร็จ");
      }
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadPayments = async () => {
    try {
      const res = await AxiosInstance.get("/payments");
      setPayments(res.data || []);
    } catch (err) {
      console.error("LOAD PAYMENTS ERROR:", err);
    }
  };

  const loadReceiveOptions = async (customerId: string) => {
    if (!customerId) return;

    setLoadingOptions(true);
    setError(null);

    try {
      const [shipperRes, recipientRes] = await Promise.all([
        AxiosInstance.get(`/receives/options/shippers/${customerId}`),
        AxiosInstance.get(`/receives/options/recipients/${customerId}`),
      ]);

      setShippers(shipperRes.data || []);
      setRecipients(recipientRes.data || []);
    } catch (err) {
      console.error("LOAD RECEIVE OPTIONS ERROR:", err);

      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "โหลดข้อมูลผู้ส่ง/ผู้รับไม่สำเร็จ");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("โหลดข้อมูลผู้ส่ง/ผู้รับไม่สำเร็จ");
      }
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadPayments();
  }, []);

  useEffect(() => {
    if (!form.customer_id) return;
    loadReceiveOptions(form.customer_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.customer_id]);

  // =====================
  // Search/filter
  // =====================
  const filteredCustomers = useMemo(() => {
    const keyword = customerSearch.trim().toLowerCase();

    if (!keyword) return customers;

    return customers.filter((item) => {
      const text = [item.code, item.name].filter(Boolean).join(" ").toLowerCase();
      return text.includes(keyword);
    });
  }, [customerSearch, customers]);

  const filteredShippers = useMemo(() => {
    const keyword = shipperSearch.trim().toLowerCase();

    if (!keyword) return shippers;

    return shippers.filter((item) => {
      const text = [
        item.shipper_code,
        item.shipper_name,
        item.address,
        item.tel,
        item.zip_code,
        item.subdistrict_name,
        item.district_name,
        item.province_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });
  }, [shipperSearch, shippers]);

  const filteredRecipients = useMemo(() => {
    const keyword = recipientSearch.trim().toLowerCase();

    if (!keyword) return recipients;

    return recipients.filter((item) => {
      const text = [
        item.recipient_code,
        item.recipient_name,
        item.recipient_detail_name,
        item.address,
        item.tel,
        item.zip_code,
        item.subdistrict_name,
        item.district_name,
        item.province_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });
  }, [recipientSearch, recipients]);

  const groupedRecipients = useMemo<GroupedRecipient[]>(() => {
    const map = new Map<number, RecipientOption[]>();

    filteredRecipients.forEach((item) => {
      if (!map.has(item.recipient_id)) {
        map.set(item.recipient_id, []);
      }

      map.get(item.recipient_id)?.push(item);
    });

    return Array.from(map.entries()).map(([recipient_id, details]) => ({
      recipient_id,
      recipient: details[0],
      details,
    }));
  }, [filteredRecipients]);

  // =====================
  // Select handlers
  // =====================
  const selectCustomer = (selected: CustomerOption) => {
    setForm((prev) => ({
      ...prev,
      customer_id: String(selected.id),
      customer_code: selected.code || "",
      customer_name: selected.name || "",
    }));

    resetCustomerRelatedFields();
    setShowCustomerModal(false);
  };

  const selectShipper = (selected: ShipperOption) => {
    setForm((prev) => ({
      ...prev,
      shipper_id: String(selected.shipper_id),
      shipper_code: selected.shipper_code || "",
      shipper_name: selected.shipper_name || "",
      shipper_address: selected.address || "",
      shipper_district_name: selected.district_name || "",
    }));

    setShowShipperModal(false);
  };

  const selectRecipient = (selected: RecipientOption) => {
    setForm((prev) => ({
      ...prev,
      recipient_id: String(selected.recipient_id || ""),
      recipient_code: selected.recipient_code || "",
      recipient_detail_id: String(selected.recipient_detail_id || ""),
      recipient_name: selected.recipient_name || "",
      address: selected.address || "",

      province_id: selected.province_id ? String(selected.province_id) : "",
      district_id: selected.district_id ? String(selected.district_id) : "",
      subdistrict_id: selected.subdistrict_id ? String(selected.subdistrict_id) : "",

      province_name: selected.province_name || "",
      district_name: selected.district_name || "",
      subdistrict_name: selected.subdistrict_name || "",
      zip_code: selected.zip_code || "",
      tel: selected.tel || "",
    }));

    setShowRecipientModal(false);
  };

  // =====================
  // Package handlers
  // =====================
  const packageTotal = (row: PackageRow) => Number(row.qty || 0) * Number(row.unit_price || 0);

  const totalPrice = useMemo(() => {
    return packageRows.reduce((sum, row) => sum + packageTotal(row), 0);
  }, [packageRows]);

  const openAddPackageModal = () => {
    setPackageForm(emptyPackageRow);
    setEditingPackageIndex(null);
    setError(null);
    setShowPackageModal(true);
  };

  const openEditPackageModal = (index: number) => {
    setPackageForm(packageRows[index]);
    setEditingPackageIndex(index);
    setError(null);
    setShowPackageModal(true);
  };

  const closePackageModal = () => {
    setPackageForm(emptyPackageRow);
    setEditingPackageIndex(null);
    setShowPackageModal(false);
  };

  const handleSavePackage = () => {
    setError(null);
    setSuccess(null);

    if (!packageForm.package_name.trim()) {
      setError("กรุณาระบุชื่อสินค้า");
      return;
    }

    if (!packageForm.qty || Number(packageForm.qty) <= 0) {
      setError("กรุณาระบุจำนวนรายการให้ถูกต้อง");
      return;
    }

    const nextRow = {
      ...packageForm,
      qty: packageForm.qty || "1",
      unit_price: packageForm.unit_price || "0",
    };

    if (editingPackageIndex === null) {
      setPackageRows((prev) => [...prev, nextRow]);
    } else {
      setPackageRows((prev) => {
        const next = [...prev];
        next[editingPackageIndex] = nextRow;
        return next;
      });
    }

    closePackageModal();
  };

  const handleDeletePackage = (index: number) => {
    setPackageRows((prev) => prev.filter((_, i) => i !== index));
  };

  const openScanModal = () => {
    setPackageForm(emptyPackageRow);
    setEditingPackageIndex(null);
    setScanBarcode("");
    setError(null);
    setShowScanModal(true);
  };

  const closeScanModal = () => {
    setPackageForm(emptyPackageRow);
    setScanBarcode("");
    setShowScanModal(false);
  };

  const handleSaveScan = () => {
    setError(null);
    setSuccess(null);

    if (!packageForm.package_name.trim()) {
      setError("กรุณาระบุชื่อสินค้า");
      return;
    }

    if (!scanBarcode.trim()) {
      setError("กรุณาแสกนบาร์โค้ด");
      return;
    }

    const nextRow: PackageRow = {
      ...packageForm,
      qty: "1",
      unit_price: packageForm.unit_price || "0",
    };

    setPackageRows((prev) => [...prev, nextRow]);
    closeScanModal();
  };

  // =====================
  // Save receive
  // =====================
  const validateReceive = () => {
    if (!form.customer_id) return "กรุณาเลือกเจ้าของงาน";
    if (!form.shipper_id) return "กรุณาเลือกผู้ส่ง";
    if (!form.recipient_id || !form.recipient_detail_id) return "กรุณาเลือกผู้รับ";
    if (!form.address) return "กรุณาระบุที่อยู่ผู้รับ";
    if (!form.subdistrict_id) return "ข้อมูลตำบล/อำเภอ/จังหวัดไม่ครบ";
    if (!form.delivery_date) return "กรุณาระบุวันที่ส่ง";

    return null;
  };

  const handleSaveReceive = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const validationError = validateReceive();

      if (validationError) {
        setError(validationError);
        return;
      }

      const payload = {
        receive_code: null,
        reference_no: form.reference_no || null,

        customer_id: form.customer_id,
        shipper_id: form.shipper_id,
        recipient_id: form.recipient_id,
        recipient_detail_id: form.recipient_detail_id,

        recipient_name: form.recipient_name,
        address: form.address,

        province_id: form.province_id || null,
        district_id: form.district_id || null,
        subdistrict_id: form.subdistrict_id || null,

        zip_code: form.zip_code || null,
        tel: form.tel || null,

        delivery_date: form.delivery_date || null,
        payment_type_id: form.payment_type_id || null,

        is_cod: form.is_cod,
        cod: form.is_cod === "Y" ? Number(form.cod || 0) : 0,

        is_document_return: form.is_document_return,
        document_return: form.is_document_return === "Y" ? form.document_return || null : null,

        is_pickup_customer: form.is_pickup_customer,
        is_pickup_shipper: form.is_pickup_shipper,

        is_invoices: "N",
        app_create: "WEB",
        is_returned: "N",

        remark: form.remark || null,

        packages: packageRows.map((row) => ({
          package_id: row.package_id || null,
          package_code: row.package_code || null,
          package_name: row.package_name || null,
          package_size_name: row.package_size_name || null,
          width: row.width ? Number(row.width) : null,
          length: row.length ? Number(row.length) : null,
          height: row.height ? Number(row.height) : null,
          q: row.q ? Number(row.q) : null,
          weight: row.weight ? Number(row.weight) : null,
          qty: row.qty ? Number(row.qty) : 1,
          cost: row.unit_price ? Number(row.unit_price) : 0,
        })),
      };

      const res = await AxiosInstance.post("/receives", payload);

      setSuccess(`สร้างบิลสำเร็จ receive_id: ${res.data?.receive_id || "-"}`);

      setForm(emptyReceiveForm);
      setShippers([]);
      setRecipients([]);
      setPackageRows([]);
      setPackageForm(emptyPackageRow);
      setScanBarcode("");
    } catch (err) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "บันทึกบิลไม่สำเร็จ");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("บันทึกบิลไม่สำเร็จ");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className={`font-thai w-full min-h-[80vh] bg-slate-50 px-3 py-4 ${saving ? "cursor-wait" : ""}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-800">สร้างบิล / DO</h2>
            <p className="text-xs text-slate-500">สร้างหัวบิล แล้วเพิ่มรายการสินค้า/Package ด้านล่าง</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setForm(emptyReceiveForm);
                setShippers([]);
                setRecipients([]);
                setPackageRows([]);
                setPackageForm(emptyPackageRow);
                setError(null);
                setSuccess(null);
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              ล้างฟอร์ม
            </button>

            <button
              type="button"
              onClick={handleSaveReceive}
              disabled={saving}
              className={`rounded-lg px-5 py-1.5 text-sm font-semibold ${
                saving ? "bg-slate-300 text-slate-500" : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {saving ? "กำลังบันทึก..." : "บันทึกบิล"}
            </button>
          </div>
        </div>

        {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {success && <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-x-5 gap-y-3">
            {/* LEFT */}
            <div className="space-y-2">
              <div className="grid grid-cols-[125px_1fr] items-center gap-2">
                <label className="text-xs font-semibold text-slate-700">เลขที่เอกสาร</label>
                <input className="input-modern h-8 w-full bg-slate-100 text-slate-400" value={form.receive_code} disabled placeholder="ไม่ต้องระบุ" />

                <label className="text-xs font-semibold text-slate-700">เจ้าของงาน*</label>
                <button type="button" onClick={() => setShowCustomerModal(true)} className="input-modern h-8 w-full bg-white text-left">
                  {form.customer_name
                    ? `${form.customer_code ? `${form.customer_code} - ` : ""}${form.customer_name}`
                    : loadingCustomers
                      ? "กำลังโหลด..."
                      : "เลือกเจ้าของงาน"}
                </button>
              </div>

              <div className="rounded-md border border-slate-300 bg-blue-50/60 p-2">
                <div className="grid grid-cols-[125px_1fr_40px] items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700">ผู้ส่ง*</label>

                  <button
                    type="button"
                    disabled={!form.customer_id || loadingOptions}
                    onClick={() => setShowShipperModal(true)}
                    className="input-modern h-8 w-full bg-white text-left disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {form.shipper_name
                      ? `${form.shipper_code ? `${form.shipper_code} - ` : ""}${form.shipper_name}`
                      : form.customer_id
                        ? "เลือกผู้ส่ง"
                        : "เลือกเจ้าของงานก่อน"}
                  </button>

                  <button
                    type="button"
                    disabled={!form.customer_id || loadingOptions}
                    onClick={() => setShowShipperModal(true)}
                    className="h-8 rounded border border-slate-300 bg-white text-slate-600 disabled:bg-slate-100"
                  >
                    🔍
                  </button>

                  <label className="text-xs font-semibold text-slate-700">ที่อยู่ผู้ส่ง*</label>
                  <input className="input-modern h-8 w-full bg-white" value={form.shipper_address} readOnly />
                  <div />
                </div>
              </div>

              <div className="grid grid-cols-[125px_1fr] items-center gap-2">
                <label className="text-xs font-semibold text-slate-700">อำเภอ*</label>
                <input className="input-modern h-8 w-full bg-slate-50" value={form.shipper_district_name} readOnly />

                <label className="text-xs font-semibold text-slate-700">ประเภทการจ่าย</label>
                <select className="input-modern w-full" value={form.payment_type_id} onChange={(e) => updateForm("payment_type_id", e.target.value)}>
                  {payments.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <label className="text-xs font-semibold text-slate-700">หมายเหตุ</label>
                <input className="input-modern h-8 w-full" value={form.remark} onChange={(e) => updateForm("remark", e.target.value)} />
              </div>
            </div>

            {/* CENTER */}
            <div className="space-y-2">
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-xs font-semibold text-slate-700">Reference</label>
                <input
                  className="input-modern h-8 w-full"
                  value={form.reference_no}
                  onChange={(e) => updateForm("reference_no", e.target.value)}
                  placeholder="Reference"
                />

                <label className="text-xs font-semibold text-slate-700">วันที่ส่ง</label>
                <DatePicker value={form.delivery_date} onChange={(value) => updateForm("delivery_date", value)} placeholder="วันที่ส่ง" />
              </div>

              <div className="rounded-md border border-slate-300 bg-emerald-50/60 p-2">
                <div className="grid grid-cols-[115px_1fr_40px] items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700">ผู้รับ*</label>

                  <button
                    type="button"
                    disabled={!form.customer_id || loadingOptions}
                    onClick={() => setShowRecipientModal(true)}
                    className="input-modern h-8 w-full bg-white text-left disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {form.recipient_name
                      ? `${form.recipient_code ? `${form.recipient_code} - ` : ""}${form.recipient_name}`
                      : form.customer_id
                        ? "เลือกผู้รับ"
                        : "เลือกเจ้าของงานก่อน"}
                  </button>

                  <button
                    type="button"
                    disabled={!form.customer_id || loadingOptions}
                    onClick={() => setShowRecipientModal(true)}
                    className="h-8 rounded border border-slate-300 bg-white text-slate-600 disabled:bg-slate-100"
                  >
                    🔍
                  </button>

                  <label className="text-xs font-semibold text-slate-700">ที่อยู่ผู้รับ*</label>
                  <input className="input-modern h-8 w-full bg-white" value={form.address} readOnly />
                  <div />
                </div>
              </div>

              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-xs font-semibold text-slate-700">จังหวัด*</label>
                <input className="input-modern h-8 w-full bg-slate-50" value={form.province_name} readOnly />

                <label className="text-xs font-semibold text-slate-700">COD</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_cod === "Y"}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        is_cod: e.target.checked ? "Y" : "N",
                        cod: e.target.checked ? prev.cod : "",
                      }))
                    }
                  />

                  {form.is_cod === "Y" && (
                    <input
                      className="input-modern h-8 w-full"
                      type="number"
                      value={form.cod}
                      onChange={(e) => updateForm("cod", e.target.value)}
                      placeholder="ยอด COD"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-2">
              <div className="grid grid-cols-[130px_1fr] items-center gap-2">
                <label className="text-xs font-semibold text-slate-700" />
                <div className="flex items-center gap-5 text-xs text-slate-700">
                  <label className="inline-flex items-center gap-1">
                    <input
                      type="radio"
                      checked={form.is_pickup_customer === "Y"}
                      onChange={() =>
                        setForm((prev) => ({
                          ...prev,
                          is_pickup_customer: "Y",
                          is_pickup_shipper: "N",
                        }))
                      }
                    />
                    รับของที่เจ้าของงาน
                  </label>

                  <label className="inline-flex items-center gap-1">
                    <input
                      type="radio"
                      checked={form.is_pickup_shipper === "Y"}
                      onChange={() =>
                        setForm((prev) => ({
                          ...prev,
                          is_pickup_customer: "N",
                          is_pickup_shipper: "Y",
                        }))
                      }
                    />
                    รับของที่ผู้ส่ง
                  </label>
                </div>

                <label className="text-xs font-semibold text-slate-700">โทรศัพท์*</label>
                <input className="input-modern h-8 w-full bg-slate-50" value={form.tel} readOnly />

                <label className="text-xs font-semibold text-slate-700">ตำบล*</label>
                <input className="input-modern h-8 w-full bg-slate-50" value={form.subdistrict_name} readOnly />

                <label className="text-xs font-semibold text-slate-700">รหัสไปรษณีย์*</label>
                <input className="input-modern h-8 w-full bg-slate-50" value={form.zip_code} readOnly />

                <label className="text-xs font-semibold text-slate-700">เอกสารส่งกลับ</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_document_return === "Y"}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        is_document_return: e.target.checked ? "Y" : "N",
                        document_return: e.target.checked ? prev.document_return : "",
                      }))
                    }
                  />

                  {form.is_document_return === "Y" && (
                    <input
                      className="input-modern h-8 w-full"
                      value={form.document_return}
                      onChange={(e) => updateForm("document_return", e.target.value)}
                      placeholder="รายละเอียด"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PACKAGE TABLE */}
          <div className="mt-3 border border-slate-200">
            <div className="flex items-center justify-end border-b border-slate-200 px-3 py-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openAddPackageModal}
                  className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  เพิ่มรายการ +
                </button>

                <button
                  type="button"
                  onClick={openScanModal}
                  className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  สแกน
                </button>
              </div>

            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs text-slate-600">
                    <th className="border-b border-slate-200 px-3 py-2 w-16 text-center">ลำดับ</th>
                    <th className="border-b border-slate-200 px-3 py-2">ชื่อสินค้า</th>
                    <th className="border-b border-slate-200 px-3 py-2">กxยxส cm.,Q</th>
                    <th className="border-b border-slate-200 px-3 py-2">น้ำหนัก</th>
                    <th className="border-b border-slate-200 px-3 py-2">จำนวน</th>
                    <th className="border-b border-slate-200 px-3 py-2">ราคา/หน่วย(บาท)</th>
                    <th className="border-b border-slate-200 px-3 py-2">ราคา(บาท)</th>
                    <th className="border-b border-slate-200 px-3 py-2 w-32">จัดการ</th>
                  </tr>
                </thead>

                <tbody>
                  {!packageRows.length && (
                    <tr>
                      <td colSpan={8} className="h-56 border-b border-slate-200 text-center text-sm text-slate-400">
                        ยังไม่มีรายการสินค้า
                      </td>
                    </tr>
                  )}

                  {packageRows.map((row, index) => (
                    <tr key={`${row.package_code}-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                      <td className="border-b border-slate-200 px-3 py-2 text-center">{index + 1}</td>
                      <td className="border-b border-slate-200 px-3 py-2">
                        <div className="font-medium text-slate-800">{row.package_name || "-"}</div>
                        {row.package_size_name && <div className="text-xs text-slate-500">{row.package_size_name}</div>}
                      </td>
                      <td className="border-b border-slate-200 px-3 py-2">
                        {`${row.width || "-"} x ${row.length || "-"} x ${row.height || "-"}, ${row.q || "-"}`}
                      </td>
                      <td className="border-b border-slate-200 px-3 py-2">{row.weight || "-"}</td>
                      <td className="border-b border-slate-200 px-3 py-2">{row.qty || "-"}</td>
                      <td className="border-b border-slate-200 px-3 py-2">{money(Number(row.unit_price || 0))}</td>
                      <td className="border-b border-slate-200 px-3 py-2 font-semibold">{money(packageTotal(row))}</td>
                      <td className="border-b border-slate-200 px-3 py-2">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => openEditPackageModal(index)}
                            className="rounded-full bg-blue-500 px-2.5 py-1 text-[11px] text-white hover:bg-blue-600"
                          >
                            แก้ไข
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePackage(index)}
                            className="rounded-full bg-red-500 px-2.5 py-1 text-[11px] text-white hover:bg-red-600"
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr>
                    <td colSpan={6} className="px-3 py-3 text-right text-lg font-semibold text-slate-800">
                      รวม:
                    </td>
                    <td colSpan={2} className="px-3 py-3 text-xl font-bold text-slate-900">
                      {money(totalPrice)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* LOWER MOCK SECTIONS */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex flex-wrap gap-6 text-xs">
            <button className="border-b-2 border-blue-600 pb-1 font-semibold text-blue-700">ปัญหาการจัดส่ง</button>
            <button className="pb-1 text-slate-500">ปัญหาการจัดส่ง</button>
            <button className="pb-1 text-slate-500">ประวัติการโทร</button>
            <button className="pb-1 text-slate-500">ประวัติการส่งสำเร็จ</button>
            <button className="pb-1 text-slate-500">แนบไฟล์</button>
          </div>

          <button className="mb-2 rounded border border-blue-500 px-3 py-1 text-xs text-blue-700">เพิ่มรูป</button>

          <div className="h-24 border border-slate-200 text-center text-sm text-slate-400 flex items-center justify-center">ยังไม่มีข้อมูล</div>
        </div>

        {/* CUSTOMER MODAL */}
        {showCustomerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={() => setShowCustomerModal(false)}>
            <div className="w-full max-w-[560px] rounded-sm bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-6 text-xl font-semibold text-slate-900">ข้อมูลเจ้าของงาน</h3>

              <div className="mb-2 grid grid-cols-[80px_1fr] items-center gap-3">
                <label className="text-xs font-semibold text-slate-700">ค้นหา</label>
                <input className="input-modern h-8 w-full" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} autoFocus />
              </div>

              <div className="max-h-[610px] overflow-y-auto border border-slate-300">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="border-b border-slate-300 px-3 py-2 text-left text-xs">เจ้าของงาน</th>
                      <th className="w-[90px] border-b border-slate-300 px-3 py-2" />
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCustomers.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-100">
                        <td className="border-b border-slate-200 px-3 py-2">
                          <div className="font-medium text-slate-700">
                            {item.code} - {item.name}
                          </div>
                        </td>

                        <td className="border-b border-slate-200 px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => selectCustomer(item)}
                            className="rounded bg-green-700 px-4 py-1 text-xs font-semibold text-white hover:bg-green-800"
                          >
                            ✓เลือก
                          </button>
                        </td>
                      </tr>
                    ))}

                    {!filteredCustomers.length && (
                      <tr>
                        <td colSpan={2} className="py-8 text-center text-sm text-slate-400">
                          ไม่พบข้อมูลเจ้าของงาน
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="rounded bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SHIPPER MODAL */}
        {showShipperModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={() => setShowShipperModal(false)}>
            <div className="w-full max-w-[460px] rounded-sm bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-6 text-xl font-semibold text-slate-900">ข้อมูลผู้ส่ง</h3>

              <div className="mb-2 grid grid-cols-[80px_1fr] items-center gap-3">
                <label className="text-xs font-semibold text-slate-700">ค้นหา</label>
                <input className="input-modern h-8 w-full" value={shipperSearch} onChange={(e) => setShipperSearch(e.target.value)} autoFocus />
              </div>

              <div className="max-h-[610px] overflow-y-auto border border-slate-300">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="border-b border-slate-300 px-3 py-2 text-left text-xs">ชื่อผู้ส่ง</th>
                      <th className="w-[90px] border-b border-slate-300 px-3 py-2" />
                    </tr>
                  </thead>

                  <tbody>
                    {filteredShippers.map((item) => (
                      <tr key={item.shipper_id} className="hover:bg-slate-100">
                        <td className="border-b border-slate-200 px-3 py-2">
                          <div className="font-medium text-slate-700">
                            {item.shipper_code} - {item.shipper_name}
                          </div>
                          <div className="text-[11px] text-slate-500">{item.address || "-"}</div>
                        </td>

                        <td className="border-b border-slate-200 px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => selectShipper(item)}
                            className="rounded bg-green-700 px-4 py-1 text-xs font-semibold text-white hover:bg-green-800"
                          >
                            ✓เลือก
                          </button>
                        </td>
                      </tr>
                    ))}

                    {!filteredShippers.length && (
                      <tr>
                        <td colSpan={2} className="py-8 text-center text-sm text-slate-400">
                          ไม่พบข้อมูลผู้ส่ง
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowShipperModal(false)}
                  className="rounded bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RECIPIENT MODAL */}
        {showRecipientModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={() => setShowRecipientModal(false)}>
            <div className="w-full max-w-[920px] rounded-sm bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-6 text-xl font-semibold text-slate-900">ข้อมูลผู้รับ</h3>

              <div className="mb-2 grid grid-cols-[80px_1fr] items-center gap-3">
                <label className="text-xs font-semibold text-slate-700">ค้นหา</label>
                <input className="input-modern h-8 w-full" value={recipientSearch} onChange={(e) => setRecipientSearch(e.target.value)} autoFocus />
              </div>

              <div className="max-h-[610px] overflow-y-auto border border-slate-300">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th className="w-10 border-b border-slate-300 px-2 py-2" />
                      <th className="border-b border-slate-300 px-3 py-2 text-left text-xs">ชื่อผู้รับ</th>
                      <th className="border-b border-slate-300 px-3 py-2 text-left text-xs">ที่อยู่ผู้รับ</th>
                      <th className="w-[90px] border-b border-slate-300 px-3 py-2" />
                    </tr>
                  </thead>

                  <tbody>
                    {groupedRecipients.map(({ recipient_id, recipient, details }) => {
                      const isOpen = !!expandedRecipientIds[String(recipient_id)];
                      const firstDetail = details[0];

                      return (
                        <Fragment key={recipient_id}>
                          <tr className="hover:bg-slate-100">
                            <td className="border-b border-slate-200 px-2 py-2 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedRecipientIds((prev) => ({
                                    ...prev,
                                    [String(recipient_id)]: !prev[String(recipient_id)],
                                  }))
                                }
                                className="h-7 w-7 rounded border border-slate-300 bg-white"
                              >
                                {isOpen ? "⌄" : "›"}
                              </button>
                            </td>

                            <td className="border-b border-slate-200 px-3 py-2">
                              <div className="font-medium text-slate-700">
                                {recipient.recipient_code} - {recipient.recipient_name}
                              </div>
                            </td>

                            <td className="border-b border-slate-200 px-3 py-2 text-xs text-slate-600">{firstDetail?.address || "-"}</td>

                            <td className="border-b border-slate-200 px-3 py-2 text-right">
                              {firstDetail?.recipient_detail_id && (
                                <button
                                  type="button"
                                  onClick={() => selectRecipient(firstDetail)}
                                  className="rounded bg-green-700 px-4 py-1 text-xs font-semibold text-white hover:bg-green-800"
                                >
                                  ✓เลือก
                                </button>
                              )}
                            </td>
                          </tr>

                          {isOpen && (
                            <tr>
                              <td />
                              <td colSpan={3} className="border-b border-slate-300 bg-slate-50 p-0">
                                <table className="w-full border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-white">
                                      <th className="border-b border-slate-200 px-3 py-2 text-left">ชื่อผู้รับ</th>
                                      <th className="border-b border-slate-200 px-3 py-2 text-left">ที่อยู่</th>
                                      <th className="w-[90px] border-b border-slate-200 px-3 py-2" />
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {details.map((detail) => (
                                      <tr key={detail.recipient_detail_id}>
                                        <td className="border-b border-slate-200 px-3 py-2">
                                          {detail.recipient_detail_name || detail.recipient_name}
                                        </td>

                                        <td className="border-b border-slate-200 px-3 py-2">
                                          {[detail.address, detail.subdistrict_name, detail.district_name, detail.province_name, detail.zip_code]
                                            .filter(Boolean)
                                            .join(" ")}
                                        </td>

                                        <td className="border-b border-slate-200 px-3 py-2 text-right">
                                          <button
                                            type="button"
                                            onClick={() => selectRecipient(detail)}
                                            className="rounded border border-blue-500 bg-white px-4 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                          >
                                            ✓เลือก
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}

                    {!groupedRecipients.length && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                          ไม่พบข้อมูลผู้รับ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowRecipientModal(false)}
                  className="rounded bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADD PACKAGE MODAL */}
        {showPackageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={closePackageModal}>
            <div className="w-full max-w-5xl rounded-sm bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-6 flex items-start justify-between">
                <h3 className="text-2xl font-semibold text-slate-900">เพิ่มรายการสินค้า</h3>

                <button type="button" onClick={closePackageModal} className="text-2xl leading-none text-slate-400 hover:text-slate-700">
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-[140px_1fr_40px] items-center gap-3">
                  <label className="text-xs font-medium text-slate-700">ชื่อสินค้า</label>
                  <input
                    className="input-modern h-8 w-full"
                    value={packageForm.package_name}
                    onChange={(e) => updatePackageForm("package_name", e.target.value)}
                    placeholder="ค้นหา"
                  />
                  <button className="text-slate-500" type="button">
                    🔍
                  </button>

                  <label className="text-xs font-medium text-slate-700">ขนาดสินค้า</label>
                  <select
                    className="input-modern h-8 w-full"
                    value={packageForm.package_size_name}
                    onChange={(e) => updatePackageForm("package_size_name", e.target.value)}
                  >
                    <option value="">เลือกขนาดสินค้า</option>
                    <option value="BOX-S">BOX-S</option>
                    <option value="BOX-M">BOX-M</option>
                    <option value="BOX-L">BOX-L</option>
                  </select>
                  <div />

                  <label className="text-xs font-medium text-slate-700">กว้างยาวสูง (ซม.)</label>
                  <div className="grid grid-cols-4 gap-5">
                    <input
                      className="input-modern h-8"
                      placeholder="กว้าง"
                      value={packageForm.width}
                      onChange={(e) => updatePackageForm("width", e.target.value)}
                    />
                    <input
                      className="input-modern h-8"
                      placeholder="ยาว"
                      value={packageForm.length}
                      onChange={(e) => updatePackageForm("length", e.target.value)}
                    />
                    <input
                      className="input-modern h-8"
                      placeholder="สูง"
                      value={packageForm.height}
                      onChange={(e) => updatePackageForm("height", e.target.value)}
                    />
                    <input
                      className="input-modern h-8"
                      placeholder="ผลรวม(ซม.)"
                      value={packageForm.q}
                      onChange={(e) => updatePackageForm("q", e.target.value)}
                    />
                  </div>
                  <button className="text-slate-500" type="button">
                    🔍
                  </button>

                  <label className="text-xs font-medium text-slate-700">น้ำหนัก</label>
                  <input
                    className="input-modern h-8 w-full"
                    placeholder="น้ำหนัก(กรัม)"
                    value={packageForm.weight}
                    onChange={(e) => updatePackageForm("weight", e.target.value)}
                  />
                  <div />

                  <label className="text-xs font-medium text-slate-700">จำนวนรายการ</label>
                  <input
                    className="input-modern h-8 w-full"
                    type="number"
                    value={packageForm.qty}
                    onChange={(e) => updatePackageForm("qty", e.target.value)}
                  />
                  <div />

                  <label className="text-xs font-medium text-slate-700">ราคา/หน่วย</label>
                  <input
                    className="input-modern h-8 w-full"
                    type="number"
                    value={packageForm.unit_price}
                    onChange={(e) => updatePackageForm("unit_price", e.target.value)}
                  />
                  <div />
                </div>
              </div>

              <div className="mt-7 flex justify-end">
                <button
                  type="button"
                  onClick={handleSavePackage}
                  className="rounded bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCAN MODAL */}
        {showScanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={closeScanModal}>
            <div className="w-full max-w-5xl rounded-sm bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-6 flex items-start justify-between">
                <h3 className="text-2xl font-normal text-slate-900">Scan</h3>

                <button type="button" onClick={closeScanModal} className="text-2xl leading-none text-slate-400 hover:text-slate-700">
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-[140px_1fr_40px] items-center gap-3">
                  <label className="text-xs font-medium text-slate-700">ชื่อสินค้า</label>
                  <input
                    className="input-modern h-8 w-full"
                    value={packageForm.package_name}
                    onChange={(e) => updatePackageForm("package_name", e.target.value)}
                    placeholder="ค้นหา"
                  />
                  <button className="text-slate-500" type="button">
                    🔍
                  </button>

                  <label className="text-xs font-medium text-slate-700">ขนาดสินค้า</label>
                  <select
                    className="input-modern h-8 w-full"
                    value={packageForm.package_size_name}
                    onChange={(e) => updatePackageForm("package_size_name", e.target.value)}
                  >
                    <option value="">เลือกขนาดสินค้า</option>
                    <option value="BOX-S">BOX-S</option>
                    <option value="BOX-M">BOX-M</option>
                    <option value="BOX-L">BOX-L</option>
                  </select>
                  <div />

                  <label className="text-xs font-medium text-slate-700">กว้างยาวสูง (ซม.)</label>
                  <div className="grid grid-cols-4 gap-5">
                    <input
                      className="input-modern h-8"
                      placeholder="กว้าง"
                      value={packageForm.width}
                      onChange={(e) => updatePackageForm("width", e.target.value)}
                    />
                    <input
                      className="input-modern h-8"
                      placeholder="ยาว"
                      value={packageForm.length}
                      onChange={(e) => updatePackageForm("length", e.target.value)}
                    />
                    <input
                      className="input-modern h-8"
                      placeholder="สูง"
                      value={packageForm.height}
                      onChange={(e) => updatePackageForm("height", e.target.value)}
                    />
                    <input
                      className="input-modern h-8"
                      placeholder="ผลรวม(ซม.)"
                      value={packageForm.q}
                      onChange={(e) => updatePackageForm("q", e.target.value)}
                    />
                  </div>
                  <button className="text-slate-500" type="button">
                    🔍
                  </button>

                  <label className="text-xs font-medium text-slate-700">น้ำหนัก</label>
                  <input
                    className="input-modern h-8 w-full"
                    placeholder="น้ำหนัก(กรัม)"
                    value={packageForm.weight}
                    onChange={(e) => updatePackageForm("weight", e.target.value)}
                  />
                  <div />

                  <label className="text-xs font-medium text-slate-700">กรุณาแสกนบาร์โค้ด</label>
                  <input
                    className="input-modern h-8 w-full"
                    value={scanBarcode}
                    autoFocus
                    onChange={(e) => setScanBarcode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveScan();
                      }
                    }}
                  />
                  <div />
                </div>
              </div>

              <div className="mt-7 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveScan}
                  className="rounded bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LocalizationProvider>
  );
}
