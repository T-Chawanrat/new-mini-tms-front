import { useEffect, useRef, useState } from "react";
import { FilterDropdown } from "../components/dropdown/FilterDropdown";
import { useScanSounds } from "../hooks/useScanSounds";
import successSound from "../../assets/sounds/success.mp3";
import errorSound from "../../assets/sounds/error.mp3";
import { useAuth } from "../context/AuthContext";
import AxiosInstance from "../utils/AxiosInstance";

type BillRow = {
  id: number;
  NO_BILL: string;
  SERIAL_NO: string;
  CUSTOMER_NAME: string;
  warehouse_name: string;
};

export default function BillScanWarehouse() {
  const [pendingRows, setPendingRows] = useState<BillRow[]>([]);
  const [scannedRows, setScannedRows] = useState<BillRow[]>([]);
  const [serialInput, setSerialInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const successSoundRef = useRef<HTMLAudioElement | null>(null);
  const errorSoundRef = useRef<HTMLAudioElement | null>(null);
  const { playSuccess, playError } = useScanSounds(successSound, errorSound, {
    poolSize: 8,
    volume: 1,
  });

  const [customerFilter, setCustomerFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");

  const { user } = useAuth();

  const fetchPendingBills = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await AxiosInstance.get(
        "/bills-warehouse",
        {}
      );
      const data: BillRow[] = res.data.data || [];
      setPendingRows(data);
    } catch (err) {
      console.error("Error fetching pending bills:", err);
      setError("ไม่สามารถดึงข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBills();
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScanSerial = (value?: string) => {
    const serial = (value || serialInput).trim();
    if (!serial) return;

    setError(null);
    setInfo(null);

    const index = pendingRows.findIndex((row) => row.SERIAL_NO === serial);

    if (index === -1) {
      const alreadyIndex = scannedRows.findIndex(
        (row) => row.SERIAL_NO === serial
      );

      if (alreadyIndex !== -1) {
        setError(`SN : ${serial} ถูกยิงไปแล้ว`);
      } else {
        setError(`ไม่พบ SERIAL_NO ${serial}`);
      }

      playError();
      setSerialInput("");
      return;
    }

    const row = pendingRows[index];
    setPendingRows((prev) => prev.filter((_, i) => i !== index));
    setScannedRows((prev) => [row, ...prev]);

    setInfo(`ยิง SN : ${serial} สำเร็จ`);

    playSuccess();
    setSerialInput("");
    inputRef.current?.focus();
  };

  const handleSaveAccept = async () => {
    if (!scannedRows.length) {
      setError("ยังไม่มีรายการที่ยิงแล้วสำหรับบันทึก");
      return;
    }

    setSaving(true);
    setError(null);
    setInfo(null);

    try {
      const serials = scannedRows.map((r) => r.SERIAL_NO);

      await AxiosInstance.post("/bills-warehouse/accept", {
        serials,
        accept_flag: "Y",
      });

      setInfo(`บันทึกผลการยิงแล้วจำนวน ${serials.length} รายการ`);

      await fetchPendingBills();
      setScannedRows([]);
    } catch (err) {
      console.error("Error saving warehouse accept:", err);
      setError("เกิดข้อผิดพลาดในการบันทึกผลการยิง");
    } finally {
      setSaving(false);
    }
  };

  const totalCount = pendingRows.length + scannedRows.length;

  const customerOptions = Array.from(
    new Set(
      [...pendingRows, ...scannedRows]
        .map((r) => r.CUSTOMER_NAME)
        .filter((v) => !!v)
    )
  );

  const warehouseOptions = Array.from(
    new Set(
      [...pendingRows, ...scannedRows]
        .map((r) => r.warehouse_name)
        .filter((v) => !!v)
    )
  );

  const normalize = (s: string | null | undefined) =>
    (s || "").toLowerCase().trim();

  const customerFilterNorm = normalize(customerFilter);
  const warehouseFilterNorm = normalize(warehouseFilter);

  const filteredPendingRows = pendingRows.filter((row) => {
    const customerMatch =
      !customerFilterNorm ||
      normalize(row.CUSTOMER_NAME).includes(customerFilterNorm);

    const warehouseMatch =
      !warehouseFilterNorm ||
      normalize(row.warehouse_name).includes(warehouseFilterNorm);

    return customerMatch && warehouseMatch;
  });

  const filteredScannedRows = scannedRows.filter((row) => {
    const customerMatch =
      !customerFilterNorm ||
      normalize(row.CUSTOMER_NAME).includes(customerFilterNorm);

    const warehouseMatch =
      !warehouseFilterNorm ||
      normalize(row.warehouse_name).includes(warehouseFilterNorm);

    return customerMatch && warehouseMatch;
  });

  return (
    <div
      className={`font-thai w-full h-[70vh] bg-white px-4 py-5 ${
        loading || saving ? "cursor-wait" : ""
      }`}
    >
      <audio ref={successSoundRef} src={successSound} preload="auto" />
      <audio ref={errorSoundRef} src={errorSound} preload="auto" />

      {/* Header / Summary */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            ยิงเทียบพัสดุ (คลัง 345)
          </h2>
          {/* <p className=" text-slate-500">
            ยิงบาร์โค้ดเพื่อเช็คพัสดุเข้าคลัง แยกรายการรอเช็ค / ยิงแล้วแบบเรียลไทม์
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
              รวมรายการ
            </span>
            <span className="font-semibold text-slate-800">
              {totalCount.toLocaleString("th-TH")}
            </span>
          </div>
        </div>
      </div>

      {/* ส่วนช่องยิงบาร์โค้ด + ปุ่มบันทึก */}
      <form className="mb-4 bg-white/90 border border-slate-200 rounded-xl shadow-sm px-4 py-3 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex flex-col gap-1">
          <input
            ref={inputRef}
            type="text"
            value={serialInput}
            onChange={(e) => setSerialInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                handleScanSerial(e.currentTarget.value); // ✅ ใช้ค่าจากช่อง ณ ตอนนั้น
              }
            }}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm w-64 shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            placeholder="ยิงบาร์โค้ด..."
          />
        </div>

        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-end gap-3  text-slate-600 mt-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:mr-2">
            <span>
              ทั้งหมด{" "}
              <span className="font-semibold text-lg text-slate-800">
                {totalCount.toLocaleString("th-TH")}
              </span>
            </span>
            <span>
              | รอเช็ค{" "}
              <span className="font-semibold text-lg text-red-600">
                {pendingRows.length.toLocaleString("th-TH")}
              </span>
            </span>
            <span>
              | เช็คแล้ว{" "}
              <span className="font-semibold text-lg text-emerald-600">
                {scannedRows.length.toLocaleString("th-TH")}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleSaveAccept}
            disabled={!scannedRows.length || saving}
            className={`px-4 py-1.5 rounded-full  font-medium transition
              ${
                !scannedRows.length || saving
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              }`}
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </form>

      {/* แถว filter CUSTOMER_NAME + warehouse_name */}
      <div className="mb-3 flex flex-col md:flex-row gap-3">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
          <span className="text-[11px] font-medium text-slate-700 whitespace-nowrap">
            ชื่อลูกค้า
          </span>
          <div className="w-48">
            <FilterDropdown
              value={customerFilter}
              onChange={setCustomerFilter}
              options={customerOptions}
              placeholder="ค้นหาลูกค้า"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
          <span className="text-[11px] font-medium text-slate-700 whitespace-nowrap">
            DC ปลายทาง
          </span>
          <div className="w-48">
            <FilterDropdown
              value={warehouseFilter}
              onChange={setWarehouseFilter}
              options={warehouseOptions}
              placeholder="ค้นหา DC"
            />
          </div>
        </div>
      </div>

      {/* error / info */}
      {error && (
        <div className="mb-3  text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
      {info && (
        <div className="mb-3  text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
          {info}
        </div>
      )}

      {loading && (
        <div className="mb-3  text-slate-500">กำลังโหลดข้อมูล...</div>
      )}

      {/* สองฝั่ง: ซ้าย (รอเช็ค) / ขวา (ยิงแล้ว) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ฝั่งซ้าย: รอเช็ค */}
        <div className="border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col max-h-[70vh]">
          <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 rounded-t-xl flex justify-between items-center">
            <span className="font-medium  text-slate-700">รายการรอเช็ค</span>
            <span className="text-lg text-red-600 font-semibold">
              {filteredPendingRows.length.toLocaleString("th-TH")} /{" "}
              {pendingRows.length.toLocaleString("th-TH")} รายการ
            </span>
          </div>

          <div className="overflow-auto rounded-b-xl">
            {pendingRows.length === 0 ? (
              <div className="p-3 text-center  text-slate-500">
                ไม่มีรายการที่รอเช็ค
              </div>
            ) : filteredPendingRows.length === 0 ? (
              <div className="p-3 text-center  text-slate-500">
                ไม่พบรายการที่ตรงกับเงื่อนไขกรอง
              </div>
            ) : (
              <table className="w-full table-fixed border-collapse text-[13px]">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-1.5 border-b border-slate-200 w-14  text-slate-600">
                      ลำดับ
                    </th>
                    <th className="px-2 py-1.5 border-b border-slate-200 min-w-[400px]  text-slate-600">
                      SERIAL_NO
                    </th>
                    <th className="px-2 py-1.5 border-b border-slate-200  text-slate-600">
                      CUSTOMER_NAME
                    </th>
                    <th className="px-2 py-1.5 border-b border-slate-200  text-slate-600">
                      DC ปลายทาง
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPendingRows.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`transition ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                      } hover:bg-blue-50/50`}
                    >
                      <td className="px-2 py-1.5 border-b border-slate-200 text-center ">
                        {idx + 1}
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-200">
                        <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-[1px] text-lg font-mono font-semibold text-red-600">
                          {row.SERIAL_NO}
                        </span>
                      </td>
                      {/* <td className="px-2 py-1.5 border-b border-slate-200">
                        <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-[1px] text-lg font-mono font-semibold text-red-600">
                          {row.SERIAL_NO}
                        </span>
                      </td> */}
                      <td className="px-2 py-1.5 border-b border-slate-200  truncate">
                        {row.CUSTOMER_NAME || "-"}
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-200  truncate">
                        {row.warehouse_name || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ฝั่งขวา: ยิงแล้ว */}
        <div className="border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col max-h-[70vh]">
          <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 rounded-t-xl flex justify-between items-center">
            <span className="font-medium  text-slate-700">
              รายการที่ยิงแล้ว
            </span>
            <span className="text-lg text-emerald-600 font-semibold">
              {filteredScannedRows.length.toLocaleString("th-TH")} /{" "}
              {scannedRows.length.toLocaleString("th-TH")} รายการ
            </span>
          </div>

          <div className="overflow-auto rounded-b-xl">
            {scannedRows.length === 0 ? (
              <div className="p-3 text-center  text-slate-500">
                ยังไม่มีรายการที่ถูกยิง
              </div>
            ) : filteredScannedRows.length === 0 ? (
              <div className="p-3 text-center  text-slate-500">
                ไม่พบรายการที่ตรงกับเงื่อนไขกรอง
              </div>
            ) : (
              <table className="w-full table-fixed border-collapse text-[13px]">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-1.5 border-b border-slate-200 w-14  text-slate-600">
                      ลำดับ
                    </th>
                    <th className="px-2 py-1.5 border-b border-slate-200 min-w-[400px]  text-slate-600">
                      SERIAL_NO
                    </th>
                    <th className="px-2 py-1.5 border-b border-slate-200  text-slate-600">
                      CUSTOMER_NAME
                    </th>
                    <th className="px-2 py-1.5 border-b border-slate-200  text-slate-600">
                      DC ปลายทาง
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScannedRows.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`transition ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                      } hover:bg-blue-50/50`}
                    >
                      <td className="px-2 py-1.5 border-b border-slate-200 text-center ">
                        {idx + 1}
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-200">
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-[1px] text-lg font-mono font-semibold text-emerald-700">
                          {row.SERIAL_NO}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-200 truncate">
                        {row.CUSTOMER_NAME || "-"}
                      </td>
                      <td className="px-2 py-1.5 border-b border-slate-200  truncate">
                        {row.warehouse_name || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
