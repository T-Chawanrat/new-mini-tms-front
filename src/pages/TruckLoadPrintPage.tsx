import { ArrowLeft, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AxiosInstance from "../utils/AxiosInstance";

type TruckPrintHeader = {
  truck_load_id: number;
  truck_code: string;
  create_date: string | null;
  driver_name: string | null;
  employee_code: string | null;
  license_plate: string | null;
  license_province: string | null;
  warehouse_name: string | null;
  to_warehouse_name: string | null;
  is_close: string | null;
  close_datetime: string | null;
  is_go: string | null;
  go_datetime: string | null;

  // เตรียมไว้สำหรับ backend ชุดใหม่
  receiver_name?: string | null;
  closed_by_name?: string | null;
  route_name?: string | null;
  vehicle_type_name?: string | null;
  receive_completed_datetime?: string | null;
};

type TruckPrintItem = {
  id: number;
  serial_id: string;
  serial_no: string;
  create_date: string | null;
  cost: number | string | null;
  receive_code: string | null;
  customer_name: string | null;
  to_warehouse_name: string | null;
  recipient_name: string | null;
  tel: string | null;
  address: string | null;
  subdistrict_name: string | null;
  district_name: string | null;
  province_name: string | null;
  zip_code: string | null;
  weight: number | string | null;
  qty: number | string | null;

  // เตรียมไว้สำหรับ backend ชุดใหม่
  owner_name?: string | null;
  customer_code?: string | null;
  reference_no?: string | null;
  product_name?: string | null;
};

type TruckPrintResponse = {
  data?: {
    truck: TruckPrintHeader;
    items: TruckPrintItem[];
  };
};

const getText = (value: unknown) => String(value ?? "").trim();

const formatShortDateTime = (value: string | null | undefined) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return getText(value);

  const dateText = date.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const timeText = date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${dateText} ${timeText} น.`;
};

export default function TruckLoadPrintPage() {
  const { truckLoadId } = useParams<{ truckLoadId: string }>();
  const navigate = useNavigate();
  const [truck, setTruck] = useState<TruckPrintHeader | null>(null);
  const [items, setItems] = useState<TruckPrintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrintData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await AxiosInstance.get<TruckPrintResponse>(`/truck-loads/${truckLoadId}/print`);

        const printData = response.data?.data;
        setTruck(printData?.truck || null);
        setItems(Array.isArray(printData?.items) ? printData.items : []);
      } catch (err) {
        console.error("fetch truck print error:", err);
        setError("ไม่สามารถโหลดข้อมูลใบปิดบรรทุกสำหรับพิมพ์ได้");
      } finally {
        setLoading(false);
      }
    };

    if (truckLoadId) void fetchPrintData();
  }, [truckLoadId]);

  return (
    <div className="min-h-[calc(100vh-61px)] bg-slate-100 px-2 py-3 text-black">
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          body * {
            visibility: hidden !important;
          }

          #truck-print-area,
          #truck-print-area * {
            visibility: visible !important;
          }

          #truck-print-area {
            position: absolute;
            inset: 0;
            width: 287mm !important;
            min-height: 200mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            box-shadow: none !important;
          }

          .truck-print-row,
          .truck-print-footer {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="mx-auto mb-3 flex max-w-[297mm] items-center justify-between print:hidden">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} /> กลับ
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          disabled={!truck || loading}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
        >
          <Printer size={16} /> Print
        </button>
      </div>

      {error && <div className="mx-auto max-w-[297mm] rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <main id="truck-print-area" className="mx-auto min-h-[210mm] w-full max-w-[297mm] bg-white p-[7mm] font-sans shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-500">กำลังโหลดข้อมูล...</div>
        ) : truck ? (
          <>
            <header className="grid grid-cols-[52mm_1fr_72mm] items-start gap-[5mm] text-[10px] leading-[1.35]">
              <div>
                <img src="/tms/logo.jpg" alt="Trantech" className="h-[26mm] w-[42mm] object-contain object-left-top" />
              </div>

              <div className="pt-[2mm]">
                <div className="font-bold">บริษัท ทรานเทค แมนเนจเม้นท์ กรุ๊ป จำกัด</div>
                <div>เลขที่ 19/13 หมู่2 ตำบลคลองข่อย อำเภอปากเกร็ด จังหวัดนนทบุรี 11120</div>
                <div>เลขประจำตัวผู้เสียภาษีอากร 0105560067074</div>
              </div>

              <div className="space-y-[1.2mm] pt-[1mm] text-right">
                <div>
                  เอกสารใบปิดบรรทุก เลขที่: <strong>{getText(truck.truck_code)}</strong>
                </div>

                <div>วันที่ {formatShortDateTime(truck.create_date)}</div>

                <div className="pt-[2mm]">
                  <div>
                    ต้นทาง: <strong>{getText(truck.warehouse_name)}</strong>
                  </div>

                  <div>
                    ปลายทาง: <strong>{getText(truck.to_warehouse_name)}</strong>
                  </div>

                  <div>เวลาปิดบรรทุก: {formatShortDateTime(truck.close_datetime)}</div>
                </div>
              </div>
            </header>

            <section className="mt-[5mm] grid grid-cols-[1fr_1fr] gap-x-[15mm] text-[10px] leading-[1.5]">
              <div>
                <div>
                  พนักงานปิดบรรทุก <strong>{getText(truck.closed_by_name)}</strong>
                </div>
              </div>

              <div>
                <div>
                  ทะเบียนรถ <strong>{[truck.license_plate, truck.license_province].filter(Boolean).join(" ") || "-"}</strong>
                </div>

                <div>{getText(truck.vehicle_type_name || truck.route_name)}</div>
              </div>
            </section>

            <table className="mt-[3mm] w-full table-auto border-collapse text-[8.5px] leading-[1.25]">
              <thead>
                <tr className="align-middle text-center font-normal">
                  <th className="whitespace-nowrap border border-black px-[1mm] py-[2mm]">เจ้าของงาน</th>
                  <th className="whitespace-nowrap border border-black px-[1mm] py-[2mm]">รหัสลูกค้า</th>
                  <th className="whitespace-nowrap border border-black px-[1mm] py-[2mm]">ชื่อลูกค้า</th>
                  <th className="whitespace-nowrap border border-black px-[1mm] py-[2mm]">ใบเลขที่ขนส่ง</th>
                  <th className="whitespace-nowrap border border-black px-[1mm] py-[2mm]">Reference</th>
                  <th className="whitespace-nowrap border border-black px-[1mm] py-[2mm]">ชื่อสินค้า</th>
                  <th className="whitespace-nowrap border border-black px-[1mm] py-[2mm]">จำนวน</th>
                  <th className="whitespace-nowrap border border-black px-[1mm] py-[2mm]">ที่อยู่</th>
                  <th className="whitespace-nowrap border border-black px-[1mm] py-[2mm]">ตำบล</th>
                  <th className="whitespace-nowrap border border-black px-[1mm] py-[2mm]">อำเภอ</th>
                  <th className="whitespace-nowrap border border-black px-[1mm] py-[2mm]">จังหวัด</th>
                  <th className="whitespace-nowrap border border-black px-[1mm] py-[2mm]">รหัสไปรษณีย์</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id || `${item.serial_no}-${index}`} className="truck-print-row align-top">
                    <td className="border border-black px-[1mm] py-[1.4mm]">{getText(item.customer_name)}</td>

                    <td className="whitespace-nowrap border border-black px-[1mm] py-[1.4mm]">{getText(item.customer_code)}</td>

                    <td className="border border-black px-[1mm] py-[1.4mm]">{getText(item.recipient_name)}</td>

                    <td className="whitespace-nowrap border border-black px-[1mm] py-[1.4mm]">{getText(item.receive_code)}</td>

                    <td className="whitespace-nowrap border border-black px-[1mm] py-[1.4mm]">{getText(item.reference_no || item.serial_no)}</td>

                    <td className="border border-black px-[1mm] py-[1.4mm]">{getText(item.product_name)}</td>

                    <td className="whitespace-nowrap border border-black px-[1mm] py-[1.4mm] text-center">1</td>

                    <td className="border border-black px-[1mm] py-[1.4mm]">{getText(item.address)}</td>

                    <td className="whitespace-nowrap border border-black px-[1mm] py-[1.4mm]">{getText(item.subdistrict_name)}</td>

                    <td className="whitespace-nowrap border border-black px-[1mm] py-[1.4mm]">{getText(item.district_name)}</td>

                    <td className="whitespace-nowrap border border-black px-[1mm] py-[1.4mm]">{getText(item.province_name)}</td>

                    <td className="whitespace-nowrap border border-black px-[1mm] py-[1.4mm] text-center">{getText(item.zip_code)}</td>
                  </tr>
                ))}

                {!items.length && (
                  <tr>
                    <td colSpan={12} className="h-[22mm] border border-black px-3 py-8 text-center text-slate-500">
                      ไม่มีรายการพัสดุ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <footer className="truck-print-footer mt-[5mm] border-t border-black pt-[3mm] text-[10px] leading-[1.5]">
              <div className="grid grid-cols-2 gap-[10mm] px-[45mm] text-center font-bold">
                <div className="border border-black py-[1mm]">รวมบิลทั้งสิ้น {items.length.toLocaleString("th-TH")} บิล</div>
                <div className="border border-black py-[1mm]">จำนวนสินค้า {items.length.toLocaleString("th-TH")} กล่อง</div>
              </div>

              <div className="mt-[5mm] font-bold">พนักงานขับรถได้ทำการตรวจสอบสินค้าตามเอกสารชุดนี้แล้ว</div>

              <div className="mt-[6mm] space-y-[5mm] whitespace-nowrap">
                <div className="grid grid-cols-[auto_35mm_auto_35mm] items-end justify-start gap-x-[3mm]">
                  <span>พนักงานขับรถ ลงชื่อ</span>
                  <span className="inline-block w-[35mm] border-b border-black">&nbsp;</span>

                  <span>พนักงานปล่อยรถ ลงชื่อ</span>
                  <span className="inline-block w-[35mm] border-b border-black">&nbsp;</span>
                </div>

                <div className="grid grid-cols-[auto_35mm_auto_25mm_auto_25mm] items-end justify-start gap-x-[3mm]">
                  <span>พนักงานคลังสินค้าปลายทาง ลงชื่อ</span>
                  <span className="inline-block w-[35mm] border-b border-black">&nbsp;</span>

                  <span>วันที่</span>
                  <span className="inline-block w-[25mm] border-b border-black">&nbsp;</span>

                  <span>เวลา</span>
                  <span className="inline-block w-[25mm] border-b border-black">&nbsp;</span>
                </div>
              </div>
            </footer>
          </>
        ) : null}
      </main>
    </div>
  );
}
