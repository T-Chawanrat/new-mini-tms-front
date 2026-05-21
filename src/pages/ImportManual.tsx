import { useState, useEffect } from "react";
import axios from "axios";
import ResizableColumns from "../components/ResizableColumns";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import { useAuth } from "../context/AuthContext";
import AddressSearchDropdown, {
  type ZipAddressRow,
} from "../components/dropdown/AddressSearchDropdown";
import AxiosInstance from "../utils/AxiosInstance";
import CustomerDropdown from "../components/dropdown/CustomerDropdown";
import WarehouseDropdown from "../components/dropdown/WarehouseDropdown";

type ImportRow = {
  no_bill: string;
  reference: string;
  send_date: string;

  customer_id: string;
  customer_name: string;

  warehouse_id: string;
  warehouse_name: string;

  shipper_code: string;
  recipient_code: string;
  recipient_name: string;
  recipient_tel: string;

  address: string;
  subdistrict: string;
  district: string;
  province: string;
  zipcode: string;
  subdistrict_id: string;

  package_code: string;
  weight: string;
  width: string;
  height: string;
  length: string;
  q: string;

  serial_no: string;
};

const headers = [
  "ลำดับ",
  "จัดการ",
  "SERIAL_NO",
  "REFERENCE",
  "SEND_DATE",
  "ชื่อลูกค้า",
  "คลัง",
  "SHIPPER_CODE",
  "รหัสผู้รับ",
  "ชื่อผู้รับ",
  "เบอร์โทร",
  "ที่อยู่",
  "ตำบล",
  "อำเภอ",
  "จังหวัด",
  "รหัสไปรษณีย์",
  "PACKAGE_CODE",
  "WEIGHT",
  "WIDTH",
  "HEIGHT",
  "LENGTH",
  "Q",
];

const emptyRow: ImportRow = {
  no_bill: "",
  reference: "",
  send_date: "",

  customer_id: "",
  customer_name: "",

  warehouse_id: "",
  warehouse_name: "",

  shipper_code: "",
  recipient_code: "",
  recipient_name: "",
  recipient_tel: "",

  address: "",
  subdistrict: "",
  district: "",
  province: "",
  zipcode: "",
  subdistrict_id: "",

  package_code: "",
  weight: "",
  width: "",
  height: "",
  length: "",
  q: "",

  serial_no: "",
};

const requiredFields: (keyof ImportRow)[] = [
  "reference",
  "send_date",
  "customer_id",
  "customer_name",
  "recipient_code",
  "recipient_name",
  "recipient_tel",
  "address",
  "subdistrict",
  "district",
  "province",
  "zipcode",
  "subdistrict_id",
  "serial_no",
];

export default function ImportManual() {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [formRow, setFormRow] = useState<ImportRow>(emptyRow);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<Record<string, number>>({});

  const { user } = useAuth();

  const handleChangeField = (field: keyof ImportRow, value: string) => {
    setFormRow((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectAddress = (row: ZipAddressRow) => {
    handleChangeField("subdistrict", row.subdistrict_name);
    handleChangeField("district", row.district_name);
    handleChangeField("province", row.province_name);
    handleChangeField("zipcode", row.zip_code);
    handleChangeField("subdistrict_id", String(row.subdistrict_id));
  };

  const clearAddress = () => {
    handleChangeField("subdistrict", "");
    handleChangeField("district", "");
    handleChangeField("province", "");
    handleChangeField("zipcode", "");
    handleChangeField("subdistrict_id", "");
  };

  const generateSerialNo = () => {
    const prefix = "KM";

    const rand10 = () =>
      Math.floor(Math.random() * 1_000_000_0000)
        .toString()
        .padStart(10, "0");

    const used = new Set<string>(
      [formRow.serial_no, ...rows.map((r) => r.serial_no)]
        .filter(Boolean)
        .map((s) => s.trim().toUpperCase()),
    );

    let serial = "";
    let tries = 0;

    do {
      serial = `${prefix}${rand10()}`;
      tries++;

      if (tries > 3000) {
        setError("ไม่สามารถสร้าง SERIAL_NO ที่ไม่ซ้ำได้ กรุณาลองใหม่");
        return;
      }
    } while (used.has(serial));

    handleChangeField("serial_no", serial);
  };

  const handleAddOrUpdateRow = () => {
    setError(null);
    setSuccess(null);

    const missingFields = requiredFields.filter((field) => {
      const value = (formRow[field] ?? "").toString().trim();
      return value === "";
    });

    if (missingFields.length > 0) {
      if (missingFields.includes("customer_id")) {
        setError("กรุณาเลือกลูกค้า");
        return;
      }

      if (missingFields.includes("subdistrict_id")) {
        setError("กรุณาเลือกที่อยู่จากรายการค้นหา เพื่อให้ระบบระบุพื้นที่ได้");
        return;
      }

      setError("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    let nextRows: ImportRow[] = [];

    if (editingIndex === null) {
      nextRows = [...rows, formRow];
    } else {
      nextRows = [...rows];
      nextRows[editingIndex] = formRow;
    }

    setRows(nextRows);
    setFormRow(emptyRow);
    setEditingIndex(null);
  };

  const handleEditRow = (index: number) => {
    setFormRow(rows[index]);
    setEditingIndex(index);
    setError(null);
    setSuccess(null);
  };

  const handleDeleteRow = (index: number) => {
    const nextRows = rows.filter((_, i) => i !== index);

    setRows(nextRows);
    setError(null);
    setSuccess(null);

    if (editingIndex === index) {
      setFormRow(emptyRow);
      setEditingIndex(null);
    }
  };

  const handleCopyRow = (index: number) => {
    const row = rows[index];

    setFormRow({
      ...row,
      serial_no: "",
    });

    setEditingIndex(null);
    setError(null);
    setSuccess(null);
  };

  const findDuplicates = (rows: ImportRow[]) => {
    const count: Record<string, number> = {};

    rows.forEach((r) => {
      if (!r.serial_no) return;

      const key = r.serial_no.trim().toUpperCase();
      count[key] = (count[key] || 0) + 1;
    });

    return count;
  };

  const handleSave = async () => {
    if (!rows.length) {
      setError("ยังไม่มีข้อมูลให้นำเข้าฐานข้อมูล");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payloadRows = rows.map((r) => ({
        no_bill: r.no_bill || null,
        serial_no: r.serial_no,
        receive_code: null,
        reference: r.reference,
        send_date: r.send_date || "",

        customer_id: r.customer_id || null,
        customer_name: r.customer_name || null,

        warehouse_id: r.warehouse_id || null,
        warehouse_name: r.warehouse_name || null,

        shipper_code: r.shipper_code || null,
        recipient_code: r.recipient_code || null,
        recipient_name: r.recipient_name,
        recipient_tel: r.recipient_tel,

        address: r.address,
        subdistrict: r.subdistrict,
        district: r.district,
        province: r.province,
        zipcode: r.zipcode,
        subdistrict_id: r.subdistrict_id,

        package_code: r.package_code || null,
        weight: r.weight ? Number(r.weight) : null,
        width: r.width ? Number(r.width) : null,
        height: r.height ? Number(r.height) : null,
        length: r.length ? Number(r.length) : null,
        q: r.q ? Number(r.q) : null,
      }));

      const res = await AxiosInstance.post("/import/manual", {
        rows: payloadRows,
        file_name: "manual-input",
      });

      setSuccess(res.data?.message || "บันทึกข้อมูลสำเร็จ");
      setRows([]);
      setFormRow(emptyRow);
      setEditingIndex(null);
    } catch (err) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูล",
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูล");
      }
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    setDuplicates(findDuplicates(rows));
  }, [rows]);

  return (
    <div
      className={`font-thai w-full h-[70vh] bg-white px-4 py-5 ${
        saving ? "cursor-wait" : ""
      }`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            คีย์บิลด้วยตนเอง
          </h2>
        </div>

        <div className="flex items-end gap-4 text-sm">
          <div className="flex flex-col items-end text-slate-600">
            <span className="uppercase tracking-wide text-slate-500">
              ผู้ใช้งาน
            </span>
            <span className="font-medium">
              {user?.first_name || user?.username || "-"}
            </span>
          </div>

          <div className="flex flex-col items-end text-slate-600">
            <span className="uppercase tracking-wide text-slate-500">
              จำนวนรายการที่คีย์
            </span>
            <span className="font-semibold text-slate-800">
              {rows.length.toLocaleString("th-TH")}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-4 bg-white/90 border border-slate-200 rounded-xl shadow-sm px-4 py-3 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              REFERENCE
            </label>
            <input
              type="text"
              value={formRow.reference}
              onChange={(e) => handleChangeField("reference", e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              SEND_DATE
            </label>
            <DatePicker
              selected={formRow.send_date ? new Date(formRow.send_date) : null}
              onChange={(date: Date | null) => {
                const iso = date ? format(date, "yyyy-MM-dd") : "";
                handleChangeField("send_date", iso);
              }}
              dateFormat="dd/MM/yyyy"
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              ชื่อลูกค้า
            </label>
            <CustomerDropdown
              value={formRow.customer_name}
              onChange={(customer, inputText) => {
                handleChangeField(
                  "customer_id",
                  customer ? String(customer.id) : "",
                );
                handleChangeField(
                  "customer_name",
                  customer?.name || inputText || "",
                );
              }}
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              คลัง
            </label>
            <WarehouseDropdown
              value={formRow.warehouse_name}
              onChange={(warehouse, inputText) => {
                handleChangeField(
                  "warehouse_id",
                  warehouse ? String(warehouse.id) : "",
                );
                handleChangeField(
                  "warehouse_name",
                  warehouse?.name || inputText || "",
                );
              }}
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              SHIPPER_CODE
            </label>
            <input
              type="text"
              value={formRow.shipper_code}
              onChange={(e) =>
                handleChangeField("shipper_code", e.target.value)
              }
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              รหัสผู้รับ
            </label>
            <input
              type="text"
              value={formRow.recipient_code}
              onChange={(e) =>
                handleChangeField("recipient_code", e.target.value)
              }
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              ชื่อผู้รับ
            </label>
            <input
              type="text"
              value={formRow.recipient_name}
              onChange={(e) =>
                handleChangeField("recipient_name", e.target.value)
              }
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              เบอร์โทร
            </label>
            <input
              type="text"
              value={formRow.recipient_tel}
              onChange={(e) =>
                handleChangeField("recipient_tel", e.target.value)
              }
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              ที่อยู่
            </label>
            <input
              type="text"
              value={formRow.address}
              onChange={(e) => handleChangeField("address", e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              ค้นหาพื้นที่
            </label>
            <AddressSearchDropdown
              value={
                formRow.subdistrict
                  ? `${formRow.subdistrict} • ${formRow.district} • ${formRow.province} • ${formRow.zipcode}`
                  : ""
              }
              onChange={() => {
                clearAddress();
              }}
              onSelect={handleSelectAddress}
            />
          </div>

          {/* <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              ตำบล
            </label>
            <input
              type="text"
              value={formRow.subdistrict}
              readOnly
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm bg-slate-50 text-slate-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              อำเภอ
            </label>
            <input
              type="text"
              value={formRow.district}
              readOnly
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm bg-slate-50 text-slate-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              จังหวัด
            </label>
            <input
              type="text"
              value={formRow.province}
              readOnly
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm bg-slate-50 text-slate-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              รหัสไปรษณีย์
            </label>
            <input
              type="text"
              value={formRow.zipcode}
              readOnly
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm bg-slate-50 text-slate-600"
            />
          </div> */}

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              SERIAL_NO
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={formRow.serial_no}
                onChange={(e) => handleChangeField("serial_no", e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              />

              <button
                type="button"
                onClick={generateSerialNo}
                className="shrink-0 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition"
                title="Generate SERIAL_NO"
              >
                Generate
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              PACKAGE_CODE
            </label>
            <input
              type="text"
              value={formRow.package_code}
              onChange={(e) =>
                handleChangeField("package_code", e.target.value)
              }
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              WEIGHT
            </label>
            <input
              type="number"
              value={formRow.weight}
              onChange={(e) => handleChangeField("weight", e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              WIDTH
            </label>
            <input
              type="number"
              value={formRow.width}
              onChange={(e) => handleChangeField("width", e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              HEIGHT
            </label>
            <input
              type="number"
              value={formRow.height}
              onChange={(e) => handleChangeField("height", e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              LENGTH
            </label>
            <input
              type="number"
              value={formRow.length}
              onChange={(e) => handleChangeField("length", e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              Q
            </label>
            <input
              type="number"
              value={formRow.q}
              onChange={(e) => handleChangeField("q", e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>
        </div>

        <div className="mt-3 flex gap-2 justify-end">
          {editingIndex !== null && (
            <button
              type="button"
              onClick={() => {
                setFormRow(emptyRow);
                setEditingIndex(null);
              }}
              className="px-4 py-1.5 rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition"
            >
              ยกเลิกแก้ไข
            </button>
          )}

          <button
            type="button"
            onClick={handleAddOrUpdateRow}
            className="px-4 py-1.5 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm transition"
          >
            {editingIndex === null ? "เพิ่มรายการ" : "บันทึกการแก้ไข"}
          </button>
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        {rows.length > 0 && (
          <span className="text-slate-600">
            พบข้อมูล {rows.length.toLocaleString("th-TH")} แถว
          </span>
        )}

        <button
          onClick={handleSave}
          disabled={!rows.length || saving}
          className={`px-4 py-1.5 rounded-full font-medium transition ${
            !rows.length || saving
              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
          }`}
        >
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>

      {error && (
        <div className="mb-3 text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-3 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
          {success}
        </div>
      )}

      <div className="border border-slate-200 rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto overflow-y-auto max-h-[70vh] w-full rounded-xl">
          {!rows.length && (
            <div className="p-4 text-center text-sm text-slate-500">
              ยังไม่มีข้อมูลในตาราง กรุณาเพิ่มรายการจากฟอร์มด้านบน
            </div>
          )}

          {rows.length > 0 && (
            <table className="border-collapse min-w-max text-[13px]">
              <ResizableColumns
                headers={headers}
                pageKey="bill-manual"
                minWidths={{
                  0: 60,
                  1: 150,
                }}
              />

              <tbody>
                {rows.map((row, idx) => {
                  const serialKey = row.serial_no.trim().toUpperCase();
                  const isDuplicate =
                    row.serial_no && duplicates[serialKey] > 1;

                  return (
                    <tr
                      key={idx}
                      className={`transition ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                      } hover:bg-blue-100/70`}
                    >
                      <td className="px-2 py-1.5 border-b border-slate-200 bg-gray-100 font-semibold text-center sticky left-0 z-10">
                        {idx + 1}
                      </td>

                      <td className="px-2 py-1.5 border-b border-slate-200 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleEditRow(idx)}
                          className="px-2.5 py-1 rounded-full text-[11px] bg-blue-500 text-white hover:bg-blue-600 shadow-sm mr-1"
                        >
                          แก้ไข
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyRow(idx)}
                          className="px-2.5 py-1 rounded-full text-[11px] bg-amber-400 text-white hover:bg-amber-500 shadow-sm mr-1"
                        >
                          คัดลอก
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRow(idx)}
                          className="px-2.5 py-1 rounded-full text-[11px] bg-red-500 text-white hover:bg-red-600 shadow-sm"
                        >
                          ลบ
                        </button>
                      </td>

                      <td
                        className={
                          "px-2 py-1.5 border-b border-slate-200 truncate font-mono " +
                          (isDuplicate
                            ? "text-red-600 font-semibold"
                            : "text-slate-800")
                        }
                      >
                        {row.serial_no || "-"}
                      </td>

                      <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                        {row.reference || "-"}
                      </td>

                      <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                        {row.send_date
                          ? format(new Date(row.send_date), "dd/MM/yyyy")
                          : "-"}
                      </td>

                      <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                        {row.customer_name || "-"}
                      </td>

                      <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                        {row.warehouse_name || "-"}
                      </td>

                      <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                        {row.shipper_code || "-"}
                      </td>

                      <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                        {row.recipient_code || "-"}
                      </td>

                      <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                        {row.recipient_name || "-"}
                      </td>

                      <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                        {row.recipient_tel || "-"}
                      </td>

                      <td className="px-2 py-1.5 border-b border-slate-200 text-[11px] truncate max-w-[220px]">
                        {row.address || "-"}
                      </td>

                      <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                        {row.subdistrict || "-"}
                      </td>

                      <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                        {row.district || "-"}
                      </td>

                      <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                        {row.province || "-"}
                      </td>

                      <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                        {row.zipcode || "-"}
                      </td>

                      <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                        {row.package_code || "-"}
                      </td>

                      <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                        {row.weight || "-"}
                      </td>

                      <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                        {row.width || "-"}
                      </td>

                      <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                        {row.height || "-"}
                      </td>

                      <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                        {row.length || "-"}
                      </td>

                      <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                        {row.q || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
