import { ArrowLeft, Maximize2, Printer, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import JsBarcode from "jsbarcode";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AxiosInstance from "../utils/AxiosInstance";

type ReceivePrintItem = {
  receive_business_id?: number | null;
  receive_code?: string | null;
  reference_no?: string | null;
  receive_date?: string | null;
  delivery_date?: string | null;
  serial_id?: string | number | null;
  serial_no?: string | null;
  package_name?: string | null;
  package_detail_name?: string | null;
  package_qty?: string | number | null;
  unit_cost?: string | number | null;
  line_total_cost?: string | number | null;
  cost?: string | number | null;
  cod?: string | number | null;
  q?: string | number | null;
  weight?: string | number | null;
  shipper_name?: string | null;
  recipient_name?: string | null;
  address?: string | null;
  subdistrict_name?: string | null;
  district_name?: string | null;
  province_name?: string | null;
  zip_code?: string | null;
  tel?: string | null;
  to_warehouse_name?: string | null;
  payment_type_id?: number | null;
  payment_type_name?: string | null;
  shipper_address?: string | null;
  shipper_subdistrict_name?: string | null;
  shipper_district_name?: string | null;
  shipper_province_name?: string | null;
  shipper_zip_code?: string | null;
  shipper_tel?: string | null;
  remark?: string | null;
};

type ReceivePrintHeader = Omit<
  ReceivePrintItem,
  "serial_id" | "serial_no" | "package_name" | "package_detail_name" | "cost" | "cod" | "q" | "weight"
> & {
  customer_name?: string | null;
  from_warehouse_name?: string | null;
  total_qty?: string | number | null;
  total_cost?: string | number | null;
  total_cod?: string | number | null;
};

type ReceivePrintResponse = { data?: { header?: ReceivePrintHeader; items?: ReceivePrintItem[] } };

const getText = (value: unknown) => String(value ?? "").trim();
const toNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const formatThaiDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? getText(value) : date.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatMoney = (value: unknown) => {
  if (value === undefined || value === null || value === "") return "";
  return toNumber(value).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getAddress = (item: ReceivePrintItem) =>
  [
    item.address,
    item.subdistrict_name && `ต.${item.subdistrict_name}`,
    item.district_name && `อ.${item.district_name}`,
    item.province_name && `จ.${item.province_name}`,
    item.zip_code,
  ]
    .filter(Boolean)
    .join(" ");

const getShipperAddress = (header: ReceivePrintHeader) =>
  [
    header.shipper_address,
    header.shipper_subdistrict_name && `ต.${header.shipper_subdistrict_name}`,
    header.shipper_district_name && `อ.${header.shipper_district_name}`,
    header.shipper_province_name && `จ.${header.shipper_province_name}`,
    header.shipper_zip_code,
  ]
    .filter(Boolean)
    .join(" ");

export default function ReceiveReportPrint() {
  const { receiveBusinessId } = useParams<{ receiveBusinessId: string }>();
  const navigate = useNavigate();
  const [header, setHeader] = useState<ReceivePrintHeader | null>(null);
  const [items, setItems] = useState<ReceivePrintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewZoom, setPreviewZoom] = useState(1.25);
  const barcodeRefs = useRef<Array<HTMLCanvasElement | null>>([]);

  useEffect(() => {
    if (!receiveBusinessId) return;

    const loadPrintData = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await AxiosInstance.get<ReceivePrintResponse>(`/receive-report/print/${receiveBusinessId}`);
        setHeader(response.data?.data?.header || null);
        setItems(Array.isArray(response.data?.data?.items) ? response.data.data.items : []);
      } catch (requestError) {
        console.error("load receive report print error:", requestError);
        setError("ไม่สามารถโหลดข้อมูลบิลส่งของได้");
      } finally {
        setLoading(false);
      }
    };

    void loadPrintData();
  }, [receiveBusinessId]);

  useEffect(() => {
    const receiveCode = getText(header?.receive_code);

    if (loading || !receiveCode) return;

    const renderBarcode = window.requestAnimationFrame(() => {
      barcodeRefs.current.filter(Boolean).forEach((canvas) => {
        JsBarcode(canvas!, receiveCode, {
          format: "CODE128",
          displayValue: false,
          width: 1.15,
          height: 38,
          margin: 0,
        });
      });
    });

    return () => window.cancelAnimationFrame(renderBarcode);
  }, [header?.receive_code, items.length, loading]);

  const totalCod = useMemo(() => toNumber(header?.total_cod), [header]);
  const totalCost = useMemo(() => toNumber(header?.total_cost), [header]);
  const itemPages = useMemo(() => {
    const pageSize = 10;
    const pages: ReceivePrintItem[][] = [];

    for (let index = 0; index < Math.max(items.length, 1); index += pageSize) {
      pages.push(items.slice(index, index + pageSize));
    }

    return pages;
  }, [items]);

  const changeZoom = (amount: number) => setPreviewZoom((current) => Math.min(1.5, Math.max(0.5, Number((current + amount).toFixed(2)))));
  const fitPreview = () => setPreviewZoom(Math.min(1, Math.max(0.5, Number(((document.documentElement.clientWidth - 36) / 794).toFixed(2)))));
  const printReport = async () => {
    const printImages = Array.from(document.querySelectorAll<HTMLImageElement>(".receive-report-print-area img"));
    await Promise.all(
      printImages
        .filter((image) => !image.complete)
        .map(
          (image) =>
            new Promise<void>((resolve) => {
              image.addEventListener("load", () => resolve(), { once: true });
              image.addEventListener("error", () => resolve(), { once: true });
            }),
        ),
    );
    await document.fonts?.ready;
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())));
    window.print();
  };

  return (
    <div className="receive-report-print-screen min-h-[calc(100vh-61px)] bg-slate-100 px-2 py-3 text-slate-900">
      <style>{`
        @media print {
          @page { size: A5 landscape; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          body * { visibility: hidden !important; }
          .receive-report-print-area, .receive-report-print-area * { visibility: visible !important; }
          .receive-report-print-screen { min-height: 0 !important; height: auto !important; margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .receive-report-print-preview { display: block !important; zoom: 1 !important; }
          div:has(> .receive-report-print-screen) { padding: 0 !important; }
          div:has(> div > .receive-report-print-screen) { margin-left: 0 !important; overflow: visible !important; }
          div:has(> div > .receive-report-print-screen) > header { display: none !important; }
          div:has(> div > div > .receive-report-print-screen) { display: block !important; min-height: 0 !important; }
          .receive-report-print-area { display: flex !important; flex-direction: column !important; width: 210mm !important; height: 148mm !important; min-height: 148mm !important; margin: 0 !important; padding: 5mm !important; box-sizing: border-box !important; box-shadow: none !important; overflow: hidden !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .receive-report-print-area > header { display: grid !important; visibility: visible !important; }
          .receive-report-print-area .receive-report-print-logo { display: block !important; visibility: visible !important; }
          .receive-report-print-area { break-after: auto; page-break-after: auto; }
          .receive-report-print-area + .receive-report-print-area { break-before: page; page-break-before: always; }
          .receive-report-print-row { height: 6mm !important; break-inside: avoid; page-break-inside: avoid; }
          .receive-report-print-table { padding-bottom: 0 !important; }
          .receive-report-print-footer { margin-bottom: 0 !important; }
          .receive-report-print-footer, .receive-report-print-bottom { flex-shrink: 0 !important; }
          .receive-report-print-bottom { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      <div
        className="mx-auto mb-3 flex items-center justify-between gap-3 print:hidden"
        style={{ width: `${210 * previewZoom}mm` }}
      >
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
            onClick={() => changeZoom(-0.1)}
            disabled={previewZoom <= 0.5}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 disabled:opacity-40"
            title="ซูมออก"
          >
            <ZoomOut size={16} />
          </button>
          <span className="min-w-[52px] text-center text-xs font-medium text-slate-600">{Math.round(previewZoom * 100)}%</span>
          <button
            type="button"
            onClick={() => changeZoom(0.1)}
            disabled={previewZoom >= 1.5}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 disabled:opacity-40"
            title="ซูมเข้า"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            onClick={fitPreview}
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
            onClick={() => void printReport()}
            disabled={loading || !items.length}
            className="ml-1 inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      {error && <div className="mx-auto mb-3 max-w-[210mm] rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      <div className="receive-report-print-preview mx-auto flex w-fit max-w-none flex-col gap-[4mm]" style={{ zoom: previewZoom } as CSSProperties}>
        {loading ? (
          <div className="w-[210mm] bg-white py-20 text-center text-sm text-slate-500">กำลังโหลดข้อมูล...</div>
        ) : header ? (
          itemPages.map((pageItems, pageIndex) => {
            const itemColumns = [pageItems.slice(0, 5), pageItems.slice(5, 10)];
            const isLastPage = pageIndex === itemPages.length - 1;

            return (
              <main
                key={pageIndex}
                className={`receive-report-print-area flex h-[148mm] w-[210mm] flex-col overflow-hidden bg-white p-[5mm] font-sans text-slate-950 antialiased shadow-sm ${isLastPage ? "receive-report-print-last-page" : ""}`}
              >
              <header className="grid grid-cols-[1fr_60mm] items-start gap-[4mm]">
                <div>
                  <img src="/tms/logo.jpg" alt="Trantech" className="receive-report-print-logo h-auto w-[28mm] object-contain object-left-top" />
                  <div className="mt-[1mm] text-[9px] font-medium leading-[1.4]">
                    <div className="text-[9.5px] font-bold">บริษัท ทรานเทค แมนเนจเม้นท์ กรุ๊ป จำกัด</div>
                    <div>เลขที่ 19/13 หมู่ 2 ตำบลคลองข่อย อำเภอปากเกร็ด จังหวัดนนทบุรี 11120</div>
                    <div>โทรศัพท์ 065-005-2555 &nbsp; E-mail: callcenter@trantech.co.th</div>
                    <div>เลขประจำตัวผู้เสียภาษีอากร 0105560067074 &nbsp; www.trantech.co.th</div>
                  </div>
                </div>
                <div className="w-full self-end text-right">
                  <div className="flex items-baseline justify-end gap-[2mm] whitespace-nowrap">
                    <span className="inline-block -translate-y-[3mm] text-[13px] font-bold leading-none">ใบขนส่งสินค้า DELIVERY NOTE</span>
                  </div>
                  <canvas
                    ref={(canvas) => {
                      barcodeRefs.current[pageIndex] = canvas;
                    }}
                    className="mt-[1mm] block h-[10mm] w-full [image-rendering:pixelated]"
                    aria-label={`Barcode ${getText(header.receive_code)}`}
                  />
                  <div className="w-full text-center text-[11px] font-bold tracking-[0.08em] leading-none">{getText(header.receive_code)}</div>
                </div>
              </header>

              <section className="mt-[3mm] grid grid-cols-2 gap-[2mm] text-[9px] font-medium leading-[1.5]">
                  <div className="rounded-[2mm] border border-blue-200 p-[2mm]">
                    <div className="mb-[1mm] text-[10px] font-bold text-blue-800">FROM &nbsp; ผู้ส่ง: {getText(header.shipper_name)}</div>
                  <div>ที่อยู่: {getShipperAddress(header)}</div>
                  <div>โทร: {getText(header.shipper_tel)}</div>
                </div>
                <div className="rounded-[2mm] border border-blue-200 p-[2mm]">
                  <div className="mb-[1mm] text-[10px] font-bold text-blue-800">TO &nbsp; ผู้รับ: {getText(header.recipient_name)}</div>
                  <div>ที่อยู่: {getAddress(header)}</div>
                  <div>โทร: {getText(header.tel)}</div>
                </div>
              </section>

              <section className="mt-[3mm] grid grid-cols-5 overflow-hidden rounded-[2mm] border border-blue-200 text-[8px] font-medium">
                {[
                  ["เลขที่อ้างอิง", getText(header.reference_no) || "-"],
                  ["วันที่บิล", formatThaiDate(header.receive_date)],
                  ["กำหนดส่ง", formatThaiDate(header.delivery_date)],
                  ["การชำระเงิน", getText(header.payment_type_name)],
                  ["COD ค่าสินค้า", formatMoney(totalCod)],
                ].map(([label, value]) => (
                  <div key={String(label)} className="border-r border-blue-200 px-[2mm] pb-[2.5mm] pt-[1.5mm] last:border-r-0">
                    <div className="font-bold text-blue-800">{label}</div>
                    <div className="mt-[1mm] text-[10px] leading-[1.2]">{value}</div>
                  </div>
                ))}
              </section>

              <section className="receive-report-print-table mt-[3mm] grid grid-cols-2 gap-[2mm]">
                {itemColumns.map((columnItems, columnIndex) => (
                  <table key={columnIndex} className="w-full table-fixed border-collapse text-[9.5px] font-medium leading-[1.35]">
                    <thead className="bg-blue-700 font-semibold text-white">
                      <tr>
                        <th className="w-[8%] border border-blue-700 px-[.6mm] py-[1.3mm]">#</th>
                        <th className="w-[48%] border border-blue-700 px-[.6mm] py-[1.3mm] text-left">รายการสินค้า</th>
                        <th className="w-[10%] border border-blue-700 px-[.6mm] py-[1.3mm]">จำนวน</th>
                        <th className="w-[17%] border border-blue-700 px-[.6mm] py-[1.3mm] text-right">ราคา</th>
                        <th className="w-[17%] border border-blue-700 px-[.6mm] py-[1.3mm] text-right">รวม</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 5 }, (_, rowIndex) => {
                        const item = columnItems[rowIndex];
                        const index = columnIndex * 5 + rowIndex;
                        return (
                          <tr
                            key={String(item?.serial_id || item?.serial_no || `empty-${index}`)}
                            className="receive-report-print-row h-[7mm] even:bg-blue-50/60"
                          >
                            <td className="border border-blue-100 px-[.6mm] py-[1mm] text-center">{item ? pageIndex * 10 + index + 1 : ""}</td>
                            <td className="border border-blue-100 px-[.6mm] py-[1mm] break-words">
                              {item ? getText(item.package_name || item.package_detail_name) : ""}
                            </td>
                            <td className="border border-blue-100 px-[.6mm] py-[1mm] text-center">{item ? toNumber(item.package_qty).toLocaleString("th-TH") : ""}</td>
                            <td className="border border-blue-100 px-[.6mm] py-[1mm] text-right">{item ? formatMoney(item.unit_cost ?? item.cost) : ""}</td>
                            <td className="border border-blue-100 px-[.6mm] py-[1mm] text-right">{item ? formatMoney(item.line_total_cost) : ""}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ))}
              </section>

              <footer className="receive-report-print-footer mt-[3mm] grid grid-cols-[20%_20%_45%_15%] overflow-hidden rounded-[2mm] border border-blue-200 text-[8px] font-semibold leading-[1.35]">
                {[
                  ["DC ต้นทาง", getText(header.from_warehouse_name)],
                  ["DC ปลายทาง", getText(header.to_warehouse_name)],
                  ["เงื่อนไขการจัดส่ง", getText(header.remark) || "-"],
                  ["รวมราคาทั้งสิ้น", formatMoney(totalCost)],
                ].map(([label, value]) => (
                  <div key={label} className="border-r border-blue-200 px-[2mm] pb-[2.5mm] pt-[1.5mm] last:border-r-0 last:text-right">
                    <div className="font-bold text-blue-800">{label}</div>
                    <div className="mt-[1mm] text-[9.5px] leading-[1.2] text-slate-950">{value}</div>
                  </div>
                ))}
              </footer>

              <section className="receive-report-print-bottom mt-[3mm] grid grid-cols-[1fr_80mm] gap-[2mm]">
                <div className="rounded-[2mm] border border-blue-200 px-[2.5mm] py-[1.5mm] text-[8px] font-medium leading-[1.45]">
                  <div className="mb-[.5mm] text-[9px] font-bold text-blue-800">เงื่อนไข</div>
                  <ul className="list-disc space-y-0 pl-[4mm]">
                    <li>ผู้ขนส่งจ่ายตามจริงของราคาสินค้า แต่ไม่เกิน 3,000 บาทต่อใบรับ-ส่งสินค้าและพัสดุภัณฑ์ที่ไม่ได้ทำประกันภัยการส่งสินค้า</li>
                    <li>การลงชื่อรับ-ส่งสินค้าทุกครั้ง ถือว่าผู้รับ-ส่งสินค้ายอมรับเงื่อนไขการรับ-ส่งสินค้าและพัสดุภัณฑ์</li>
                    <li>
                      ผู้ส่งสินค้าต้องไม่ส่งสินค้าที่ผิดกฎหมาย หรือเป็นสิ่งของต้องห้าม เป็นอันตรายในการขนส่งที่ก่อให้เกิดผลเสียหายต่อผู้ขนส่ง
                      <br />
                      และบุคคลที่สาม ผู้ส่งสินค้าต้องยอมรับค่าเสียหายทั้งหมด
                    </li>
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-[5mm] rounded-[2mm] border border-blue-200 px-[2mm] pb-[1mm] pt-[1.5mm] text-[8.5px] font-medium">
                  <div className="flex h-full flex-col text-center">
                    ผู้รับสินค้า
                    <div className="mt-[5mm] border-b border-dotted border-slate-500" />
                    <div className="mt-[.5mm]">วันที่ / เวลา</div>
                    <div className="mt-auto border-b border-dotted border-slate-500" />
                  </div>
                  <div className="flex h-full flex-col text-center">
                    ผู้รับเงิน
                    <div className="mt-[5mm] border-b border-dotted border-slate-500" />
                    <div className="mt-[.5mm]">วันที่ / เวลา</div>
                    <div className="mt-auto border-b border-dotted border-slate-500" />
                  </div>
                </div>
              </section>
              </main>
            );
          })
        ) : (
          <div className="w-[210mm] bg-white py-20 text-center text-sm text-slate-500">ไม่พบข้อมูลบิลส่งของ</div>
        )}
      </div>
    </div>
  );
}
