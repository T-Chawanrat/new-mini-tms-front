import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import AxiosInstance from "../../utils/AxiosInstance";

import ReceiveHeaderForm from "./ReceiveHeaderForm";
import PackageSection from "./PackageSection";
// import ReceiveTrackingSection from "./ReceiveTrackingSection";
import ReceiveModals from "./ReceiveModals";
import { toNum } from "../../utils/packageRate";
import {
  type CustomerOption,
  type GroupedRecipient,
  type PackageRow,
  type PaymentOption,
  type ReceiveForm,
  type RecipientOption,
  type ShipperOption,
  type ShipperROCodeOption,
  emptyPackageRow,
  emptyReceiveForm,
} from "./createReceiveConfig";

export default function CreateReceivePage() {
  const [form, setForm] = useState<ReceiveForm>(emptyReceiveForm);

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [payments, setPayments] = useState<PaymentOption[]>([]);
  const [shippers, setShippers] = useState<ShipperOption[]>([]);
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);

  const [roCodes, setRoCodes] = useState<ShipperROCodeOption[]>([]);
  const [loadingROCodes, setLoadingROCodes] = useState(false);

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
    setRoCodes([]);

    setShipperSearch("");
    setRecipientSearch("");
    setExpandedRecipientIds({});

    setPackageRows([]);
    setPackageForm(emptyPackageRow);
    setEditingPackageIndex(null);
    setScanBarcode("");

    setForm((prev) => ({
      ...prev,

      shipper_id: "",
      shipper_code: "",
      shipper_name: "",
      shipper_address: "",

      shipper_subdistrict_id: "",
      shipper_district_id: "",
      shipper_province_id: "",

      shipper_subdistrict_name: "",
      shipper_district_name: "",
      shipper_province_name: "",

      shipper_zip_code: "",
      shipper_tel: "",

      recipient_id: "",
      recipient_code: "",
      recipient_name: "",
      recipient_detail_id: "",
      recipient_detail_name: "",
      address: "",

      province_id: "",
      district_id: "",
      subdistrict_id: "",

      province_name: "",
      district_name: "",
      subdistrict_name: "",

      zip_code: "",
      tel: "",

      is_document_return: "N",
      document_return: "",
    }));
  };

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

      const shipperData = Array.isArray(shipperRes.data) ? shipperRes.data : Array.isArray(shipperRes.data?.data) ? shipperRes.data.data : [];

      const recipientData = Array.isArray(recipientRes.data)
        ? recipientRes.data
        : Array.isArray(recipientRes.data?.data)
          ? recipientRes.data.data
          : [];

      setShippers(shipperData);
      setRecipients(recipientData);
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

  const loadShipperROCodes = async (customerId: string, shipperId: string) => {
    if (!customerId || !shipperId) {
      setRoCodes([]);
      return;
    }

    setLoadingROCodes(true);

    try {
      const res = await AxiosInstance.get(`/receives/options/ro-codes/${customerId}/${shipperId}`);

      const data = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];

      setRoCodes(data);
    } catch (err) {
      console.error("LOAD SHIPPER RO CODES ERROR:", err);
      setRoCodes([]);
    } finally {
      setLoadingROCodes(false);
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

  const filteredCustomers = useMemo(() => {
    const keyword = customerSearch.trim().toLowerCase();
    if (!keyword) return customers;

    return customers.filter((item) => {
      const text = [item.code, item.name].filter(Boolean).join(" ").toLowerCase();
      return text.includes(keyword);
    });
  }, [customerSearch, customers]);

  const filteredShippers = useMemo(() => {
    const list = Array.isArray(shippers) ? shippers : [];

    const keyword = shipperSearch.trim().toLowerCase();
    if (!keyword) return list;

    return list.filter((item) => {
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
    const list = Array.isArray(recipients) ? recipients : [];

    const keyword = recipientSearch.trim().toLowerCase();
    if (!keyword) return list;

    return list.filter((item) => {
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
    const selectedShipperId = String(selected.shipper_id || "");

    setForm((prev) => ({
      ...prev,

      shipper_id: selectedShipperId,
      shipper_code: selected.shipper_code || "",
      shipper_name: selected.shipper_name || "",
      shipper_address: selected.address || "",

      shipper_subdistrict_id: selected.subdistrict_id ? String(selected.subdistrict_id) : "",
      shipper_district_id: selected.district_id ? String(selected.district_id) : "",
      shipper_province_id: selected.province_id ? String(selected.province_id) : "",

      shipper_subdistrict_name: selected.subdistrict_name || "",
      shipper_district_name: selected.district_name || "",
      shipper_province_name: selected.province_name || "",

      shipper_zip_code: selected.zip_code || "",
      shipper_tel: selected.tel || "",

      is_document_return: "N",
      document_return: "",
    }));

    setRoCodes([]);
    loadShipperROCodes(form.customer_id, selectedShipperId);

    setShowShipperModal(false);
  };

  const selectRecipient = (selected: RecipientOption) => {
    setForm((prev) => ({
      ...prev,

      recipient_id: String(selected.recipient_id || ""),
      recipient_code: selected.recipient_code || "",
      recipient_name: selected.recipient_name || "",

      recipient_detail_id: String(selected.recipient_detail_id || ""),
      recipient_detail_name: selected.recipient_detail_name || "",

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

  const packageTotal = (row: PackageRow) => Number(row.qty || 0) * Number(row.unit_price || 0);

  const totalPrice = useMemo(() => {
    return packageRows.reduce((sum, row) => sum + packageTotal(row), 0);
  }, [packageRows]);

  const openAddPackageModal = () => {
    setPackageForm(emptyPackageRow);
    setEditingPackageIndex(null);
    setError(null);
    setSuccess(null);
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

    if (!packageForm.package_id || !packageForm.package_name.trim()) {
      setError("กรุณาเลือกชื่อสินค้า");
      return;
    }

    if (!packageForm.package_detail_id || !packageForm.package_size_name.trim()) {
      setError("กรุณาเลือกขนาดสินค้า");
      return;
    }

    if (toNum(packageForm.unit_price) <= 0) {
      setError("ไม่พบราคาสินค้า กรุณาตรวจสอบขนาดและน้ำหนัก");
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

  const closeScanModal = () => {
    setPackageForm(emptyPackageRow);
    setScanBarcode("");
    setShowScanModal(false);
  };

  const handleSaveScan = () => {
    setError(null);
    setSuccess(null);

    if (!packageForm.package_id || !packageForm.package_name.trim()) {
      setError("กรุณาเลือกชื่อสินค้า");
      return;
    }

    if (!packageForm.package_detail_id || !packageForm.package_size_name.trim()) {
      setError("กรุณาเลือกขนาดสินค้า");
      return;
    }

    if (toNum(packageForm.unit_price) <= 0) {
      setError("ไม่พบราคาสินค้า กรุณาตรวจสอบขนาดและน้ำหนัก");
      return;
    }

    const cleanBarcode = scanBarcode.trim();

    if (!cleanBarcode) {
      setError("กรุณาสแกนบาร์โค้ด");
      return;
    }

    const nextRow: PackageRow = {
      ...packageForm,
      barcode: cleanBarcode,
      qty: "1",
      unit_price: packageForm.unit_price || "0",
    };

    setPackageRows((prev) => [...prev, nextRow]);

    setScanBarcode("");
  };

  const validateReceive = () => {
    if (!form.customer_id) return "กรุณาเลือกเจ้าของงาน";
    if (!form.shipper_id) return "กรุณาเลือกผู้ส่ง";
    if (!form.recipient_id || !form.recipient_detail_id) return "กรุณาเลือกผู้รับ";
    if (!form.address) return "กรุณาระบุที่อยู่ผู้รับ";
    if (!form.subdistrict_id) return "ข้อมูลตำบล/อำเภอ/จังหวัดไม่ครบ";
    if (!form.delivery_date) return "กรุณาระบุวันที่ส่ง";

    return null;
  };

  const handleClearForm = () => {
    setForm(emptyReceiveForm);
    setShippers([]);
    setRecipients([]);
    setRoCodes([]);
    setPackageRows([]);
    setPackageForm(emptyPackageRow);
    setScanBarcode("");
    setCustomerSearch("");
    setShipperSearch("");
    setRecipientSearch("");
    setExpandedRecipientIds({});
    setError(null);
    setSuccess(null);
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

          barcode: row.barcode || null,

          package_detail_id: row.package_detail_id || null,
          package_detail_code: row.package_detail_code || null,
          package_detail_type: row.package_detail_type || null,

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
      handleClearForm();
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

  const disablePackageActions = !form.customer_id || !form.shipper_id || !form.recipient_id || !form.recipient_detail_id;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className={`font-thai min-h-[80vh] w-full bg-slate-50 px-2 py-2 ${saving ? "cursor-wait" : ""}`}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-800">สร้างบิล / DO</h2>
            <p className="text-[11px] text-slate-500">สร้างหัวบิล แล้วเพิ่มรายการสินค้า/Package ด้านล่าง</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClearForm}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
            >
              ล้างฟอร์ม
            </button>

            <button
              type="button"
              onClick={handleSaveReceive}
              disabled={saving}
              className={`rounded-md px-4 py-1 text-xs font-semibold ${
                saving ? "bg-slate-300 text-slate-500" : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {saving ? "กำลังบันทึก..." : "บันทึกบิล"}
            </button>
          </div>
        </div>

        {error && <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">{error}</div>}
        {success && <div className="mb-2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs text-emerald-700">{success}</div>}

        <div className="rounded-md border border-slate-200 bg-white p-2 shadow-sm">
          <ReceiveHeaderForm
            form={form}
            payments={payments}
            roCodes={roCodes}
            loadingCustomers={loadingCustomers}
            loadingOptions={loadingOptions}
            loadingROCodes={loadingROCodes}
            updateForm={updateForm}
            setForm={setForm}
            onOpenCustomerModal={() => setShowCustomerModal(true)}
            onOpenShipperModal={() => setShowShipperModal(true)}
            onOpenRecipientModal={() => setShowRecipientModal(true)}
          />

          <PackageSection
            packageRows={packageRows}
            totalPrice={totalPrice}
            packageTotal={packageTotal}
            onAdd={openAddPackageModal}
            onDelete={handleDeletePackage}
            disabled={disablePackageActions}
          />
        </div>

        {/* <ReceiveTrackingSection /> */}

        <ReceiveModals
          customerId={form.customer_id}
          showCustomerModal={showCustomerModal}
          showShipperModal={showShipperModal}
          showRecipientModal={showRecipientModal}
          showPackageModal={showPackageModal}
          showScanModal={showScanModal}
          customers={filteredCustomers}
          shippers={filteredShippers}
          groupedRecipients={groupedRecipients}
          customerSearch={customerSearch}
          shipperSearch={shipperSearch}
          recipientSearch={recipientSearch}
          packageForm={packageForm}
          packageRows={packageRows}
          scanBarcode={scanBarcode}
          expandedRecipientIds={expandedRecipientIds}
          setCustomerSearch={setCustomerSearch}
          setShipperSearch={setShipperSearch}
          setRecipientSearch={setRecipientSearch}
          setExpandedRecipientIds={setExpandedRecipientIds}
          setScanBarcode={setScanBarcode}
          updatePackageForm={updatePackageForm}
          selectCustomer={selectCustomer}
          selectShipper={selectShipper}
          selectRecipient={selectRecipient}
          closeCustomerModal={() => setShowCustomerModal(false)}
          closeShipperModal={() => setShowShipperModal(false)}
          closeRecipientModal={() => setShowRecipientModal(false)}
          closePackageModal={closePackageModal}
          closeScanModal={closeScanModal}
          handleSavePackage={handleSavePackage}
          handleSaveScan={handleSaveScan}
        />
      </div>
    </LocalizationProvider>
  );
}
