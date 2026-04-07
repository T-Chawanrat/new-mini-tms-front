import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ResizableColumns from "../components/ResizableColumns";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import { useAuth } from "../context/AuthContext";
import CustomerDropdown from "../components/dropdown/CustomerDropdown";
import AddressDropdown from "../components/AddressDropdown";
import AxiosInstance from "../utils/AxiosInstance";

type ImportRow = {
  NO_BILL: string;
  REFERENCE: string;
  SEND_DATE: string;
  CUSTOMER_NAME: string;
  RECIPIENT_CODE: string;
  RECIPIENT_NAME: string;
  RECIPIENT_TEL: string;
  RECIPIENT_ADDRESS: string;
  RECIPIENT_SUBDISTRICT: string;
  RECIPIENT_DISTRICT: string;
  RECIPIENT_PROVINCE: string;
  RECIPIENT_ZIPCODE: string;
  SERIAL_NO: string;
  PRICE: string;
};

type ZipAddressRow = {
  id: number;
  tambon_id: number;
  tambon_name_th: string;
  ampur_id: number;
  ampur_name_th: string;
  province_id: number;
  province_name_th: string;
  zip_code: string;
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
};

const headers = [
  "ลำดับ",
  "จัดการ",
  "SERIAL_NO",
  "REFERENCE",
  "CREATE_DATE",
  "ชื่อลูกค้า",
  "รหัสผู้รับ",
  "ชื่อผู้รับ",
  "เบอร์โทร",
  "ที่อยู่",
  "ตำบล",
  "อำเภอ",
  "จังหวัด",
  "รหัสไปรษณีย์",
  "ราคา",
];

const emptyRow: ImportRow = {
  NO_BILL: "",
  REFERENCE: "",
  SEND_DATE: "",
  CUSTOMER_NAME: "",
  RECIPIENT_CODE: "",
  RECIPIENT_NAME: "",
  RECIPIENT_TEL: "",
  RECIPIENT_ADDRESS: "",
  RECIPIENT_SUBDISTRICT: "",
  RECIPIENT_DISTRICT: "",
  RECIPIENT_PROVINCE: "",
  RECIPIENT_ZIPCODE: "",
  SERIAL_NO: "",
  PRICE: "",
};

const requiredFields: (keyof ImportRow)[] = [
  "REFERENCE",
  "SEND_DATE",
  "CUSTOMER_NAME",
  "RECIPIENT_CODE",
  "RECIPIENT_NAME",
  "RECIPIENT_TEL",
  "RECIPIENT_ADDRESS",
  "RECIPIENT_SUBDISTRICT",
  "RECIPIENT_DISTRICT",
  "RECIPIENT_PROVINCE",
  "RECIPIENT_ZIPCODE",
  "SERIAL_NO",
];

export default function BillManual() {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [formRow, setFormRow] = useState<ImportRow>(emptyRow);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [addressOptions, setAddressOptions] = useState<ZipAddressRow[]>([]);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [activeField, setActiveField] = useState<keyof ImportRow | null>(null);
  const [duplicates, setDuplicates] = useState<Record<string, number>>({});
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();

  const handleChangeField = (field: keyof ImportRow, value: string) => {
    setFormRow((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressInputChange = async (
    field: keyof ImportRow,
    value: string
  ) => {
    handleChangeField(field, value);

    const keyword = value.trim();

    if (!keyword || keyword.length < 2) {
      setAddressOptions([]);
      return;
    }

    try {
      setLoadingAddress(true);

      const res = await AxiosInstance.get("/address-search", {
        params: { keyword },
      });

      const data: ZipAddressRow[] = res.data.data || [];
      setAddressOptions(data);
    } catch (err) {
      console.error("Error fetching address search:", err);
      setAddressOptions([]);
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleSelectAddress = (row: ZipAddressRow) => {
    handleChangeField("RECIPIENT_SUBDISTRICT", row.tambon_name_th);
    handleChangeField("RECIPIENT_DISTRICT", row.ampur_name_th);
    handleChangeField("RECIPIENT_PROVINCE", row.province_name_th);
    handleChangeField("RECIPIENT_ZIPCODE", row.zip_code);

    setAddressOptions([]);
  };

  const generateSerialNo = () => {
    const prefix = "KM";

    const rand10 = () =>
      Math.floor(Math.random() * 1_000_000_0000)
        .toString()
        .padStart(10, "0");

    const used = new Set<string>(
      [formRow.SERIAL_NO, ...rows.map((r) => r.SERIAL_NO)]
        .filter(Boolean)
        .map((s) => s.trim().toUpperCase())
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

    handleChangeField("SERIAL_NO", serial);
  };

  const handleAddOrUpdateRow = () => {
    setError(null);
    setSuccess(null);

    const missingFields = requiredFields.filter((field) => {
      const value = (formRow[field] ?? "").toString().trim();
      return value === "";
    });

    if (missingFields.length > 0) {
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
    setFormRow(row);
    setEditingIndex(null);
    setError(null);
    setSuccess(null);
  };

  const findDuplicates = (rows: ImportRow[]) => {
    const count: Record<string, number> = {};

    rows.forEach((r) => {
      if (!r.SERIAL_NO) return;
      count[r.SERIAL_NO] = (count[r.SERIAL_NO] || 0) + 1;
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
        ...r,
        SEND_DATE: r.SEND_DATE || "",
      }));

      const res = await AxiosInstance.post("/import-bills", {
        rows: payloadRows,
        user_id: user?.user_id,
        type: "INPUT",
      });

      if (res.data?.success) {
        setSuccess(res.data.message || "บันทึกข้อมูลสำเร็จ");
        setRows([]);
      } else {
        setSuccess("บันทึกข้อมูลสำเร็จ");
      }
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูล"
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target as Node)) {
        setAddressOptions([]);
        setActiveField(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      className={`font-thai w-full h-[70vh] bg-white px-4 py-5 ${
        saving ? "cursor-wait" : ""
      }`}
    >
      {/* Header / Summary */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            คีย์บิลด้วยตนเอง
          </h2>
          {/* <p className=" text-slate-500">
            กรอกข้อมูลบิลด้วยมือ และบันทึกเข้าสู่ระบบในรูปแบบเดียวกับไฟล์นำเข้า
          </p> */}
        </div>

        <div className="flex items-end gap-4 text-sm">
          <div className="flex flex-col items-end text-slate-600">
            <span className=" uppercase tracking-wide text-slate-500">
              ผู้ใช้งาน
            </span>
            <span className="font-medium">
              {user?.first_name || user?.username || "-"}
            </span>
          </div>
          <div className="flex flex-col items-end text-slate-600">
            <span className=" uppercase tracking-wide text-slate-500">
              จำนวนรายการที่คีย์
            </span>
            <span className="font-semibold text-slate-800">
              {rows.length.toLocaleString("th-TH")}
            </span>
          </div>
        </div>
      </div>

      {/* ฟอร์มคีย์บิล */}
      <div className="mb-4 bg-white/90 border border-slate-200 rounded-xl shadow-sm px-4 py-3 space-y-3">
        <div
          ref={dropdownRef}
          className="grid grid-cols-1 md:grid-cols-6 gap-3"
        >
          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              REFERENCE
            </label>
            <input
              type="text"
              value={formRow.REFERENCE}
              onChange={(e) => handleChangeField("REFERENCE", e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              CREATE_DATE
            </label>
            <DatePicker
              selected={formRow.SEND_DATE ? new Date(formRow.SEND_DATE) : null}
              onChange={(date: Date | null) => {
                const iso = date ? format(date, "yyyy-MM-dd") : "";
                handleChangeField("SEND_DATE", iso);
              }}
              dateFormat="dd/MM/yyyy"
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              ชื่อลูกค้า (CUSTOMER_NAME)
            </label>
            <CustomerDropdown
              onChange={(customer, inputText) => {
                handleChangeField(
                  "CUSTOMER_NAME",
                  (customer?.customer_name ?? inputText ?? "").toString()
                );
              }}
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              รหัสผู้รับ (RECIPIENT_CODE)
            </label>
            <input
              type="text"
              value={formRow.RECIPIENT_CODE}
              onChange={(e) =>
                handleChangeField("RECIPIENT_CODE", e.target.value)
              }
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              ชื่อผู้รับ (RECIPIENT_NAME)
            </label>
            <input
              type="text"
              value={formRow.RECIPIENT_NAME}
              onChange={(e) =>
                handleChangeField("RECIPIENT_NAME", e.target.value)
              }
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              เบอร์โทร (RECIPIENT_TEL)
            </label>
            <input
              type="text"
              value={formRow.RECIPIENT_TEL}
              onChange={(e) =>
                handleChangeField("RECIPIENT_TEL", e.target.value)
              }
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              ที่อยู่ (RECIPIENT_ADDRESS)
            </label>
            <input
              type="text"
              value={formRow.RECIPIENT_ADDRESS}
              onChange={(e) =>
                handleChangeField("RECIPIENT_ADDRESS", e.target.value)
              }
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          <div className="relative">
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              ตำบล (RECIPIENT_SUBDISTRICT)
            </label>
            <input
              type="text"
              value={formRow.RECIPIENT_SUBDISTRICT}
              onChange={(e) =>
                handleAddressInputChange(
                  "RECIPIENT_SUBDISTRICT",
                  e.target.value
                )
              }
              onFocus={() => setActiveField("RECIPIENT_SUBDISTRICT")}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
            {activeField === "RECIPIENT_SUBDISTRICT" &&
              addressOptions.length > 0 && (
                <AddressDropdown
                  addressOptions={addressOptions}
                  loading={loadingAddress}
                  onSelect={handleSelectAddress}
                />
              )}
          </div>

          <div className="relative">
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              อำเภอ (RECIPIENT_DISTRICT)
            </label>
            <input
              type="text"
              value={formRow.RECIPIENT_DISTRICT}
              onChange={(e) =>
                handleAddressInputChange("RECIPIENT_DISTRICT", e.target.value)
              }
              onFocus={() => setActiveField("RECIPIENT_DISTRICT")}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
            {activeField === "RECIPIENT_DISTRICT" &&
              addressOptions.length > 0 && (
                <AddressDropdown
                  addressOptions={addressOptions}
                  loading={loadingAddress}
                  onSelect={handleSelectAddress}
                />
              )}
          </div>

          <div className="relative">
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              จังหวัด (RECIPIENT_PROVINCE)
            </label>
            <input
              type="text"
              value={formRow.RECIPIENT_PROVINCE}
              onChange={(e) =>
                handleAddressInputChange("RECIPIENT_PROVINCE", e.target.value)
              }
              onFocus={() => setActiveField("RECIPIENT_PROVINCE")}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
            {activeField === "RECIPIENT_PROVINCE" &&
              addressOptions.length > 0 && (
                <AddressDropdown
                  addressOptions={addressOptions}
                  loading={loadingAddress}
                  onSelect={handleSelectAddress}
                />
              )}
          </div>

          <div className="relative">
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              รหัสไปรษณีย์ (RECIPIENT_ZIPCODE)
            </label>
            <input
              type="text"
              value={formRow.RECIPIENT_ZIPCODE}
              onChange={(e) =>
                handleAddressInputChange("RECIPIENT_ZIPCODE", e.target.value)
              }
              onFocus={() => setActiveField("RECIPIENT_ZIPCODE")}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
            {activeField === "RECIPIENT_ZIPCODE" &&
              addressOptions.length > 0 && (
                <AddressDropdown
                  addressOptions={addressOptions}
                  loading={loadingAddress}
                  onSelect={handleSelectAddress}
                />
              )}
          </div>

          {/* <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              SERIAL_NO
            </label>
            <input
              type="text"
              value={formRow.SERIAL_NO}
              onChange={(e) => handleChangeField("SERIAL_NO", e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div> */}
          <div>
            <label className="block text-[11px] font-medium mb-1 text-slate-700">
              SERIAL_NO
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={formRow.SERIAL_NO}
                onChange={(e) => handleChangeField("SERIAL_NO", e.target.value)}
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
              ราคา
            </label>
            <input
              type="number"
              value={formRow.PRICE}
              onChange={(e) => handleChangeField("PRICE", e.target.value)}
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
              className="px-4 py-1.5 rounded-full border border-slate-300 bg-white  text-slate-700 hover:bg-slate-50 transition"
            >
              ยกเลิกแก้ไข
            </button>
          )}
          <button
            type="button"
            onClick={handleAddOrUpdateRow}
            className="px-4 py-1.5 rounded-full bg-blue-600 text-white  font-medium hover:bg-blue-700 shadow-sm transition"
          >
            {editingIndex === null ? "เพิ่มรายการ" : "บันทึกการแก้ไข"}
          </button>
        </div>
      </div>

      {/* ปุ่มบันทึกทั้งหมด */}
      <div className="mb-4 flex justify-between items-center">
        {rows.length > 0 && (
          <span className=" text-slate-600">
            พบข้อมูล {rows.length.toLocaleString("th-TH")} แถว
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={!rows.length || saving}
          className={`px-4 py-1.5 rounded-full  font-medium transition
            ${
              !rows.length || saving
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
            }`}
        >
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>

      {/* error / success */}
      {error && (
        <div className="mb-3  text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-3  text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
          {success}
        </div>
      )}

      {/* Preview Table */}
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
                {rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`transition ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                    } hover:bg-blue-100/70`}
                  >
                    <td className="px-2 py-1.5 border-b border-slate-200  bg-gray-100 font-semibold text-center sticky left-0 z-10">
                      {idx + 1}
                    </td>

                    <td className="px-2 py-1.5 border-b border-slate-200  whitespace-nowrap">
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
                        "px-2 py-1.5 border-b border-slate-200  truncate font-mono " +
                        (row.SERIAL_NO && duplicates[row.SERIAL_NO] > 1
                          ? "text-red-600 font-semibold"
                          : "text-slate-800")
                      }
                    >
                      {row.SERIAL_NO || "-"}
                    </td>
                    <td className="px-2 py-1.5 border-b border-slate-200  truncate">
                      {row.REFERENCE || "-"}
                    </td>
                    <td className="px-2 py-1.5 border-b border-slate-200  truncate">
                      {row.SEND_DATE
                        ? format(new Date(row.SEND_DATE), "dd/MM/yyyy")
                        : "-"}
                    </td>
                    <td className="px-2 py-1.5 border-b border-slate-200  truncate">
                      {row.CUSTOMER_NAME || "-"}
                    </td>
                    <td className="px-2 py-1.5 border-b border-slate-200  truncate">
                      {row.RECIPIENT_CODE || "-"}
                    </td>
                    <td className="px-2 py-1.5 border-b border-slate-200  truncate">
                      {row.RECIPIENT_NAME || "-"}
                    </td>
                    <td className="px-2 py-1.5 border-b border-slate-200  truncate">
                      {row.RECIPIENT_TEL || "-"}
                    </td>
                    <td className="px-2 py-1.5 border-b border-slate-200 text-[11px] truncate max-w-[220px]">
                      {row.RECIPIENT_ADDRESS || "-"}
                    </td>
                    <td className="px-2 py-1.5 border-b border-slate-200  truncate">
                      {row.RECIPIENT_SUBDISTRICT || "-"}
                    </td>
                    <td className="px-2 py-1.5 border-b border-slate-200  truncate">
                      {row.RECIPIENT_DISTRICT || "-"}
                    </td>
                    <td className="px-2 py-1.5 border-b border-slate-200  truncate">
                      {row.RECIPIENT_PROVINCE || "-"}
                    </td>
                    <td className="px-2 py-1.5 border-b border-slate-200  truncate">
                      {row.RECIPIENT_ZIPCODE || "-"}
                    </td>
                    <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                      {row.PRICE ? Number(row.PRICE).toFixed(2) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
