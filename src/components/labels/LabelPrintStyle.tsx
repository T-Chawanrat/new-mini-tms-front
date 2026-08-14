export default function LabelPrintStyle() {
  return (
    <style>
      {`
        .screen-only-label-print-area {
          display: none;
        }

        @media print {
          @page {
            size: 100mm 75mm;
            margin: 0;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          body * {
            visibility: hidden !important;
          }

          #label-print-area,
          #label-print-area * {
            visibility: visible !important;
          }

          #label-print-area {
            display: block !important;
            position: absolute;
            inset: 0 auto auto 0;
            width: 100mm;
          }

          .shipping-label,
          .shipping-label * {
            box-sizing: border-box;
          }

          .shipping-label {
            width: 100mm;
            height: 75mm;
            margin: 0;
            padding: 2mm;

            display: flex;
            flex-direction: column;
            overflow: hidden;

            background: #ffffff;
            color: #000000;
            font-family: Arial, Tahoma, sans-serif;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;

            page-break-after: always;
            break-after: page;
          }

          .shipping-label:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          .label-top {
            flex: 0 0 14mm;
            min-height: 0;
            display: grid;
            grid-template-columns: minmax(0, 1fr) 31mm;
            align-items: center;
            gap: 3mm;
            padding-bottom: 1.4mm;
            border-bottom: 0.4mm solid #000000;
          }

          .barcode-box,
          .label-reference,
          .label-information,
          .label-company-content {
            min-width: 0;
          }

          .barcode-box canvas {
            display: block;
            width: 100%;
            height: 9.5mm;
          }

          .barcode-text {
            margin-top: 0.4mm;
            overflow: hidden;
            font-size: 7.5pt;
            font-weight: 700;
            line-height: 1.05;
            text-align: center;
            white-space: nowrap;
            text-overflow: ellipsis;
          }

          .label-reference {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 1.1mm;
          }

          .label-reference div {
            min-width: 0;
          }

          .label-reference span {
            display: block;
            margin-bottom: 0.2mm;
            color: #444444;
            font-size: 5pt;
            line-height: 1;
          }

          .label-reference strong {
            display: block;
            overflow-wrap: anywhere;
            font-size: 5.8pt;
            line-height: 1.12;
          }

          .label-main {
            flex: 1 1 0;
            min-height: 0;
            display: grid;
            grid-template-columns: minmax(0, 1fr) 22mm;
            align-items: center;
            gap: 2.5mm;
            padding: 1.5mm 0;
          }

          .label-information {
            align-self: stretch;
            min-height: 0;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            transform: translateY(1.5mm);
          }

          .label-row,
          .label-address {
            display: grid;
            grid-template-columns: 13mm minmax(0, 1fr);
            gap: 1.2mm;
            margin-bottom: 0.65mm;
            font-size: 6.5pt;
            line-height: 1.18;
          }

          .label-owner-row {
            margin-bottom: 1.8mm;
          }

          .label-title {
            color: #444444;
            font-size: 6pt;
            font-weight: 400;
            white-space: nowrap;
          }

          .label-row strong,
          .label-address strong {
            min-width: 0;
            overflow-wrap: anywhere;
            word-break: break-word;
          }

          .label-address {
            margin-bottom: 0;
          }

          .label-remark {
            display: grid;
            grid-template-columns: 13mm minmax(0, 1fr);
            gap: 1.2mm;

            margin-top: 0;
            margin-bottom: 1mm;

            font-size: 6.2pt;
            line-height: 1.15;
          }

          .label-remark strong {
            min-width: 0;
            overflow: hidden;
            overflow-wrap: anywhere;
            word-break: break-word;

            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
          }

          .label-cod {
            position: static;
            margin-top: 0;

            padding: 0.9mm 1.4mm;
            border: 0.35mm solid #000000;
            font-size: 7.4pt;
            font-weight: 800;
            line-height: 1.1;
            text-align: center;
            white-space: nowrap;
          }

          .label-bottom {
            margin-top: auto;
          }

          .label-qr {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1mm;
          }

          .label-qr canvas {
            display: block;
            width: 20mm !important;
            height: 20mm !important;
          }

         .label-qr-sequence {
            display: block;
            font-size: 6pt;
            font-weight: 600;
            line-height: 1;
            text-align: center;
            white-space: nowrap;
          }

          .label-route {
            flex: 0 0 11.5mm;
            min-height: 11.5mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 1mm;
            padding: 1mm 0;
            border-top: 0.3mm solid #000000;
            font-size: 6pt;
            line-height: 1.2;
            transform: translateY(3mm);
          }

          .label-route-row {
            display: grid;
            grid-template-columns: 8mm minmax(0, 1fr) 7mm 23mm;
            align-items: center;
            gap: 1.2mm;
            min-width: 0;
          }

          .label-route-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 3mm;
          }

          .label-route-grid > div {
            display: grid;
            grid-template-columns: 11mm minmax(0, 1fr);
            align-items: center;
            gap: 1.2mm;
            min-width: 0;
          }

          .label-route span {
            color: #333333;
            white-space: nowrap;
          }

          .label-route strong {
            min-width: 0;
            overflow: hidden;
            font-size: 5.5pt;
            line-height: 1.2;
            white-space: nowrap;
            text-overflow: ellipsis;
          }

          .label-footer {
            flex: 0 0 9.5mm;
            min-height: 9.5mm;
            display: grid;
            grid-template-columns: 18mm minmax(0, 1fr);
            align-items: center;
            gap: 3mm;
            padding-top: 1mm;
            border-top: 0.3mm solid #000000;
            font-size: 5.8pt;
            line-height: 1.15;
            transform: translateY(2.3mm);
          }

          .label-company-logo {
            display: block;
            width: 17mm;
            height: 7mm;
            object-fit: contain;
          }

          .label-company-content {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 0.65mm;
          }

          .label-company-name {
            margin: 0;
            overflow: hidden;
            font-size: 5pt;
            font-weight: 700;
            line-height: 1.15;
            white-space: nowrap;
            text-overflow: clip;
          }

          .label-footer-bottom {
            min-width: 0;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 2mm;
          }

          .label-company-tel {
            flex-shrink: 0;
            font-size: 5pt;
            font-weight: 700;
            white-space: nowrap;
          }

          .label-print-date {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 1mm;
            white-space: nowrap;
          }

          .label-print-date span {
            color: #444444;
            font-size: 4pt;
          }

          .label-print-date strong {
            font-size: 4pt;
            font-weight: 700;
          }
        }
      `}
    </style>
  );
}
