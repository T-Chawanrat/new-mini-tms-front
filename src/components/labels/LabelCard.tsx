import { useEffect, useRef } from "react";

import bwipjs from "bwip-js";
import QRCode from "qrcode";

import type { LabelRow } from "../../types/label";
import { formatDate, getText } from "../../utils/textSanitizer";

type LabelCardProps = {
  item: LabelRow;
};

const getCodAmount = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const normalizedValue = String(value)
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");

  const amount = Number(normalizedValue);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return amount;
};

export default function LabelCard({ item }: LabelCardProps) {
  const barcodeRef = useRef<HTMLCanvasElement | null>(null);
  const qrRef = useRef<HTMLCanvasElement | null>(null);

  const serialNo = getText(item.serial_no, "");

  const serialIndex = Number(item.serial_index) || 0;
  const serialTotal = Number(item.serial_total) || 0;

  const serialSequence = serialIndex > 0 && serialTotal > 0 ? `${serialIndex} OF ${serialTotal}` : "";

  const codAmount = getCodAmount(item.cod);
  const hasCod = codAmount > 0;

  const codText = hasCod
    ? `เก็บเงินค่าสินค้า ${codAmount.toLocaleString("th-TH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} บาท`
    : "ไม่ต้องเก็บเงินค่าสินค้า";

  const addressText = getText(
    [item.address, item.subdistrict_name, item.district_name, item.province_name, item.zip_code]
      .map((part) => getText(part, ""))
      .filter(Boolean)
      .join(" "),
  );

  const remarkText = getText(item.remark, "");

  useEffect(() => {
    const barcodeCanvas = barcodeRef.current;
    const qrCanvas = qrRef.current;

    if (!serialNo) {
      if (barcodeCanvas) {
        barcodeCanvas.getContext("2d")?.clearRect(0, 0, barcodeCanvas.width, barcodeCanvas.height);
      }

      if (qrCanvas) {
        qrCanvas.getContext("2d")?.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
      }

      return;
    }

    if (barcodeCanvas) {
      try {
        bwipjs.toCanvas(barcodeCanvas, {
          bcid: "code128",
          text: serialNo,
          scale: 2,
          height: 11,
          includetext: false,
          paddingwidth: 0,
          paddingheight: 0,
        });
      } catch (error) {
        console.error("generate barcode error:", error);
      }
    }

    let cancelled = false;

    if (qrCanvas) {
      void QRCode.toCanvas(qrCanvas, serialNo, {
        width: 200,
        margin: 0,
        errorCorrectionLevel: "M",
      }).catch((error: unknown) => {
        if (!cancelled) {
          console.error("generate qr code error:", error);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [serialNo]);

  return (
    <article className="shipping-label">
      <section className="label-top">
        <div className="barcode-box">
          <canvas ref={barcodeRef} aria-hidden="true" />

          <div className="barcode-text">{getText(item.serial_no)}</div>
        </div>

        <div className="label-reference">
          <div>
            <span>Ref</span>
            <strong>{getText(item.reference_no)}</strong>
          </div>

          <div>
            <span>DO</span>
            <strong>{getText(item.receive_code)}</strong>
          </div>
        </div>
      </section>

      <section className="label-main">
        <div className="label-information">
          <div className="label-row label-owner-row">
            <span className="label-title">เจ้าของงาน</span>

            <strong>{getText(item.customer_name)}</strong>
          </div>

          <div className="label-row">
            <span className="label-title">ผู้รับ</span>

            <strong>{getText(item.recipient_name)}</strong>
          </div>

          <div className="label-row">
            <span className="label-title">โทร</span>

            <strong>{getText(item.tel)}</strong>
          </div>

          <div className="label-address">
            <span className="label-title">ที่อยู่</span>

            <strong>{addressText}</strong>
          </div>

          {remarkText && (
            <div className="label-remark">
              <span className="label-title">หมายเหตุ</span>

              <strong>{remarkText}</strong>
            </div>
          )}

          <div className={`label-cod ${hasCod ? "label-cod-has-value" : "label-cod-no-value"}`}>{codText}</div>
        </div>

        <div className="label-qr">
          <canvas ref={qrRef} aria-hidden="true" />

          {serialSequence && <strong className="label-qr-sequence">{serialSequence}</strong>}
        </div>
      </section>

      <section className="label-route">
        <div className="label-route-row">
          <span>ผู้ส่ง</span>

          <strong>{getText(item.shipper_name)}</strong>

          <span>โทร</span>

          <strong>{getText(item.shipper_tel)}</strong>
        </div>

        <div className="label-route-grid">
          <div>
            <span>ต้นทาง</span>

            <strong>{getText(item.from_warehouse_name)}</strong>
          </div>

          <div>
            <span>ปลายทาง</span>

            <strong>{getText(item.to_warehouse_name)}</strong>
          </div>
        </div>
      </section>

      <footer className="label-footer">
        <img src="/tms/logotrachtech.png" alt="Trantech Logo" className="label-company-logo" />

        <div className="label-company-content">
          <p className="label-company-name">จัดส่งโดย บริษัท ทรานเทค แมนเนจเม้นส์ กรุ๊ป จำกัด</p>

          <div className="label-footer-bottom">
            <strong className="label-company-tel">โทร 065-005-2555</strong>

            <div className="label-print-date">
              <span>Delivery date</span>

              <strong>{formatDate(item.delivery_date)}</strong>
            </div>
          </div>
        </div>
      </footer>
    </article>
  );
}
