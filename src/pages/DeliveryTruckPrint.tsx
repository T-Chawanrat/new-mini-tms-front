import { ArrowLeft, Maximize2, Printer, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { type CSSProperties, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AxiosInstance from "../utils/AxiosInstance";

type DeliveryTruckPrintHeader = {
  truck_load_id: number;
  truck_code: string;
  create_date: string | null;
  close_datetime: string | null;
  driver_name: string | null;
  warehouse_name: string | null;
  route_code: string | null;
  route_name: string | null;
  license_plate: string | null;
  license_province: string | null;
};

type DeliveryTruckPrintItem = {
  id: number;
  receive_code: string | null;
  delivery_date: string | null;
  reference_no: string | null;
  customer_name: string | null;
  recipient_name: string | null;
  address: string | null;
  subdistrict_name: string | null;
  district_name: string | null;
  province_name: string | null;
  zip_code: string | null;
  recipient_tel: string | null;
  qty: number | string | null;
};

type DeliveryTruckPrintResponse = { data?: { truck: DeliveryTruckPrintHeader; items: DeliveryTruckPrintItem[] } };

const getText = (value: unknown) => String(value ?? "").trim();

const formatShortDateTime = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return getText(value);
  const dateText = date.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeText = date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${dateText} ${timeText} น.`;
};

const formatThaiDate = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return getText(value);
  return date.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export default function DeliveryTruckPrint() {
  const { truckLoadId } = useParams<{ truckLoadId: string }>();
  const navigate = useNavigate();
  const [truck, setTruck] = useState<DeliveryTruckPrintHeader | null>(null);
  const [items, setItems] = useState<DeliveryTruckPrintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);

  const changePreviewZoom = (amount: number) => {
    setPreviewZoom((current) => Math.min(1.5, Math.max(0.5, Number((current + amount).toFixed(2)))));
  };

  const fitPreviewToScreen = () => {
    const availableWidth = document.documentElement.clientWidth - 56;
    setPreviewZoom(Math.min(1, Math.max(0.5, Number((availableWidth / 1123).toFixed(2)))));
  };

  useEffect(() => {
    if (!truckLoadId) return;

    const fetchPrintData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await AxiosInstance.get<DeliveryTruckPrintResponse>(`/delivery-trucks/${truckLoadId}/print`);
        setTruck(response.data?.data?.truck || null);
        setItems(Array.isArray(response.data?.data?.items) ? response.data.data.items : []);
      } catch (requestError) {
        console.error("fetch delivery truck print error:", requestError);
        setError("ไม่สามารถโหลดข้อมูลใบรถกระจายสำหรับพิมพ์ได้");
      } finally {
        setLoading(false);
      }
    };

    void fetchPrintData();
  }, [truckLoadId]);

  return (
    <div className="min-h-[calc(100vh-61px)] bg-slate-100 px-2 py-3 text-black">
      <style>{`
        #delivery-truck-print-area, #delivery-truck-print-area * { color: #000 !important; border-color: #000 !important; }
        #delivery-truck-print-area .delivery-truck-print-logo {
          display: block !important;
          width: 40mm !important;
          max-width: 40mm !important;
          height: auto !important;
          max-height: none !important;
          object-fit: contain !important;
          object-position: left top !important;
        }
        @media print {
          @page { size: A4 landscape; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          body * { visibility: hidden !important; }
          #delivery-truck-print-area, #delivery-truck-print-area * { visibility: visible !important; }
          .delivery-truck-print-preview { zoom: 1 !important; }
          #delivery-truck-print-area { position: fixed; top: 0; left: 0; width: 297mm !important; min-height: 210mm !important; margin: 0 !important; padding: 12mm !important; box-sizing: border-box !important; box-shadow: none !important; zoom: 1 !important; }
          #delivery-truck-print-area .delivery-truck-print-header { display: grid !important; visibility: visible !important; }
          #delivery-truck-print-area .delivery-truck-print-logo { display: block !important; visibility: visible !important; }
          .delivery-truck-print-row, .delivery-truck-print-footer { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      <div className="mx-auto mb-3 flex max-w-[297mm] items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} /> กลับ
        </button>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => changePreviewZoom(-0.1)}
            disabled={previewZoom <= 0.5}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 disabled:opacity-40"
            title="ซูมออก"
          >
            <ZoomOut size={16} />
          </button>
          <span className="min-w-[52px] text-center text-xs font-medium text-slate-600">{Math.round(previewZoom * 100)}%</span>
          <button
            type="button"
            onClick={() => changePreviewZoom(0.1)}
            disabled={previewZoom >= 1.5}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 disabled:opacity-40"
            title="ซูมเข้า"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            onClick={fitPreviewToScreen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700"
            title="พอดีกับหน้าจอ"
          >
            <Maximize2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => setPreviewZoom(1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700"
            title="ขนาดจริง"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!truck || loading || !items.length}
            className="ml-1 inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {error && <div className="mx-auto max-w-[297mm] rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="delivery-truck-print-preview mx-auto w-fit max-w-none" style={{ zoom: previewZoom } as CSSProperties}>
        <main id="delivery-truck-print-area" className="min-h-[210mm] w-[297mm] bg-white px-[7mm] pb-[7mm] pt-[8mm] font-sans shadow-sm">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-500">กำลังโหลดข้อมูล...</div>
          ) : truck ? (
            <>
              <header className="delivery-truck-print-header grid grid-cols-[1fr_58mm] items-start gap-[5mm] border-b border-black pb-[3mm] text-[11px] leading-[1.4]">
                <div className="-mt-3">
                  <img src="/tms/logo.jpg" alt="Trantech" className="delivery-truck-print-logo" />
                  <div className="mt-[3mm] text-[11px] leading-[1.4]">
                    <div className="font-bold">บริษัท ทรานเทค แมนเนจเม้นท์ กรุ๊ป จำกัด</div>
                    <div>เลขที่ 19/13 หมู่2 ตำบลคลองข่อย อำเภอปากเกร็ด จังหวัดนนทบุรี 11120</div>
                    <div>เลขประจำตัวผู้เสียภาษีอากร 0105560067074</div>
                  </div>
                </div>
                <div className="justify-self-end space-y-[1.2mm] text-right">
                  <div>
                    เอกสารใบรถกระจาย เลขที่: <strong>{getText(truck.truck_code)}</strong>
                  </div>
                  <div>วันที่ {formatShortDateTime(truck.create_date)}</div>
                  <div>
                    สายรถ: <strong>{[truck.route_code, truck.route_name].filter(Boolean).join(" - ") || "-"}</strong>
                  </div>
                  <div>
                    เวลาปิดบรรทุก: <strong>{formatShortDateTime(truck.close_datetime)}</strong>
                  </div>
                </div>
              </header>

              <section className="mt-[5mm] flex justify-between text-[12px] leading-[1.5]">
                <div>
                  พนักงานขับรถ <strong>{getText(truck.driver_name) || "-"}</strong>
                </div>
                <div className="text-right">
                  ทะเบียนรถ <strong>{[truck.license_plate, truck.license_province].filter(Boolean).join(" ") || "-"}</strong>
                </div>
              </section>

              <table className="mt-[2mm] w-full table-fixed border-collapse text-[10px] leading-[1.35]">
                <colgroup>
                  <col className="w-[6%]" />
                  <col className="w-[15%]" />
                  <col className="w-[13%]" />
                  <col className="w-[14%]" />
                  <col className="w-[20%]" />
                  <col className="w-[6%]" />
                  <col className="w-[6%]" />
                  <col className="w-[6%]" />
                  <col className="w-[4%]" />
                  <col className="w-[6%]" />
                  <col className="w-[4%]" />
                </colgroup>
                <thead>
                  <tr className="align-middle text-center font-normal">
                    <th className="border border-black px-[0.8mm] py-[1.5mm]">วันที่ส่ง</th>
                    <th className="border border-black px-[0.8mm] py-[1.5mm]">เจ้าของงาน</th>
                    <th className="border border-black px-[0.8mm] py-[1.5mm]">เลขที่บิล</th>
                    <th className="border border-black px-[0.8mm] py-[1.5mm]">ชื่อผู้รับ</th>

                    <th className="border border-black px-[0.8mm] py-[1.5mm]">ที่อยู่</th>
                    <th className="border border-black px-[0.8mm] py-[1.5mm]">ตำบล</th>
                    <th className="border border-black px-[0.8mm] py-[1.5mm]">อำเภอ</th>
                    <th className="border border-black px-[0.8mm] py-[1.5mm]">จังหวัด</th>
                    <th className="border border-black px-[0.8mm] py-[1.5mm]">รหัส ปณ.</th>
                    <th className="border border-black px-[0.8mm] py-[1.5mm]">เบอร์โทร</th>
                    <th className="border border-black px-[0.8mm] py-[1.5mm]">จำนวน</th>
                  </tr>
                </thead>
                <tbody className="text-[10px]">
                  {items.map((item, index) => (
                    <tr key={item.id || `${item.receive_code}-${index}`} className="delivery-truck-print-row align-top">
                      <td className="break-words whitespace-normal border border-black px-[0.8mm] py-[1.2mm] text-center">
                        {formatThaiDate(item.delivery_date)}
                      </td>
                      <td className="break-words whitespace-normal border border-black px-[0.8mm] py-[1.2mm]">{getText(item.customer_name)}</td>
                      <td className="break-words whitespace-normal border border-black px-[0.8mm] py-[1.2mm]">{getText(item.receive_code)}</td>
                      <td className="break-words whitespace-normal border border-black px-[0.8mm] py-[1.2mm]">{getText(item.recipient_name)}</td>
                      <td className="break-words whitespace-normal border border-black px-[0.8mm] py-[1.2mm]">{getText(item.address)}</td>
                      <td className="break-words whitespace-normal border border-black px-[0.8mm] py-[1.2mm]">{getText(item.subdistrict_name)}</td>
                      <td className="break-words whitespace-normal border border-black px-[0.8mm] py-[1.2mm]">{getText(item.district_name)}</td>
                      <td className="break-words whitespace-normal border border-black px-[0.8mm] py-[1.2mm]">{getText(item.province_name)}</td>
                      <td className="break-words whitespace-normal border border-black px-[0.8mm] py-[1.2mm] text-center">
                        {getText(item.zip_code)}
                      </td>
                      <td className="break-words whitespace-normal border border-black px-[0.8mm] py-[1.2mm] text-center">
                        {getText(item.recipient_tel)}
                      </td>

                      <td className="whitespace-nowrap border border-black px-[0.8mm] py-[1.2mm] text-center">{getText(item.qty)}</td>
                    </tr>
                  ))}
                  {!items.length && (
                    <tr>
                      <td colSpan={11} className="h-[22mm] border border-black text-center text-slate-500">
                        ไม่มีรายการพัสดุ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <footer className="delivery-truck-print-footer mt-[5mm] pt-[3mm] text-[11px] leading-[1.5]">
                <div className="grid grid-cols-2 gap-[8mm] px-[65mm] text-center font-bold">
                  <div className="border border-black py-[1mm]">รวมบิลทั้งสิ้น {items.length.toLocaleString("th-TH")} บิล</div>
                  <div className="border border-black py-[1mm]">
                    จำนวนสินค้า {items.reduce((total, item) => total + Number(item.qty || 0), 0).toLocaleString("th-TH")} กล่อง
                  </div>
                </div>
                <div className="mt-[9mm] font-bold">พนักงานขับรถได้ทำการตรวจสอบสินค้าตามเอกสารชุดนี้แล้ว</div>
                <div className="mt-[6mm] grid grid-cols-2 gap-x-[15mm] gap-y-[6mm] whitespace-nowrap">
                  <div className="flex items-end gap-x-[3mm]">
                    <span>พนักงานขับรถ ลงชื่อ</span>
                    <span className="inline-block flex-1 border-b border-black">&nbsp;</span>
                  </div>
                  <div className="flex items-end gap-x-[3mm]">
                    <span>พนักงานปล่อยรถ ลงชื่อ</span>
                    <span className="inline-block flex-1 border-b border-black">&nbsp;</span>
                  </div>
                  <div className="flex items-end gap-x-[3mm]">
                    <span>พนักงานคลังสินค้า ลงชื่อ</span>
                    <span className="inline-block flex-1 border-b border-black">&nbsp;</span>
                  </div>
                  <div className="flex items-end gap-x-[3mm]">
                    <span>วันที่</span>
                    <span className="inline-block w-[25mm] border-b border-black">&nbsp;</span>
                    <span className="ml-[3mm]">เวลา</span>
                    <span className="inline-block w-[25mm] border-b border-black">&nbsp;</span>
                  </div>
                </div>
              </footer>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
