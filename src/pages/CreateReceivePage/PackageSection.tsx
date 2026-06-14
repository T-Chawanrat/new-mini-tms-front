import { type PackageRow, money } from "./createReceiveConfig";

type PackageSectionProps = {
  packageRows: PackageRow[];
  totalPrice: number;
  packageTotal: (row: PackageRow) => number;
  onAdd: () => void;
  onDelete: (index: number) => void;
  disabled?: boolean;
};

const displayValue = (value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
};

const safeNumber = (value?: string | number | null) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const safeQty = (value?: string | number | null) => {
  const numberValue = safeNumber(value);
  return numberValue > 0 ? numberValue : 1;
};

const actionButtonClass = (disabled: boolean) =>
  `rounded px-2.5 py-1 text-[11px] font-semibold ${
    disabled ? "cursor-not-allowed bg-slate-300 text-slate-500" : "bg-blue-600 text-white hover:bg-blue-700"
  }`;

export default function PackageSection({ packageRows, totalPrice, packageTotal, onAdd, onDelete, disabled = false }: PackageSectionProps) {
  return (
    <div className="mt-2 border border-slate-200">
      <div className="flex items-center justify-end border-b border-slate-200 px-2 py-1.5">
        <button type="button" onClick={onAdd} disabled={disabled} className={actionButtonClass(disabled)}>
          เพิ่มรายการ +
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] table-fixed border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-50 text-left text-[11px] text-slate-600">
              <th className="w-14 border-b border-slate-200 px-2 py-1 text-center">ลำดับ</th>

              <th className="w-64 border-b border-slate-200 px-2 py-1">ชื่อสินค้า</th>

              <th className="w-52 border-b border-slate-200 px-2 py-1">Barcode / SN</th>

              <th className="w-30 border-b border-slate-200 px-2 py-1 text-center">กxยxส, Q</th>

              <th className="w-22 border-b border-slate-200 px-2 py-1 text-center">น้ำหนัก</th>

              <th className="w-20 border-b border-slate-200 px-2 py-1 text-center">จำนวน</th>

              <th className="w-24 border-b border-slate-200 px-2 py-1 text-center">ราคา/หน่วย</th>

              <th className="w-24 border-b border-slate-200 px-2 py-1 text-right">ราคา</th>

              <th className="w-20 border-b border-slate-200 px-2 py-1 text-center">จัดการ</th>
            </tr>
          </thead>

          <tbody>
            {!packageRows.length && (
              <tr>
                <td colSpan={9} className="h-36 border-b border-slate-200 text-center text-xs text-slate-400">
                  ยังไม่มีรายการสินค้า
                </td>
              </tr>
            )}

            {packageRows.map((row, index) => {
              const rowTotal = packageTotal(row);
              const qty = safeQty(row.qty);
              const barcodeText = row.barcode || `SN Auto x ${qty}`;

              const rowKey = `${row.package_id || row.package_code || row.package_name || "package"}-${
                row.package_detail_id || row.package_size_name || "size"
              }-${row.barcode || "auto"}-${index}`;

              return (
                <tr key={rowKey} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                  <td className="border-b border-slate-200 px-2 py-1 text-center align-middle">{index + 1}</td>

                  <td className="border-b border-slate-200 px-2 py-1 align-middle">
                    <div className="truncate font-medium text-slate-800">{displayValue(row.package_name)}</div>
                    <div className="truncate text-[10px] text-slate-500">{displayValue(row.package_size_name)}</div>
                  </td>

                  <td className="border-b border-slate-200 px-2 py-1 align-middle">
                    <span className="block truncate font-medium text-slate-700">{barcodeText}</span>
                  </td>

                  <td className="border-b border-slate-200 px-2 py-1 text-center align-middle whitespace-nowrap">
                    {`${displayValue(row.width)}x${displayValue(row.length)}x${displayValue(row.height)}, ${displayValue(row.q)}`}
                  </td>

                  <td className="border-b border-slate-200 px-2 py-1 text-center align-middle">{displayValue(row.weight)}</td>

                  <td className="border-b border-slate-200 px-2 py-1 text-center align-middle">{qty}</td>

                  <td className="border-b border-slate-200 px-2 py-1 text-center align-middle tabular-nums">{money(safeNumber(row.unit_price))}</td>

                  <td className="border-b border-slate-200 px-2 py-1 text-right align-middle font-semibold tabular-nums">{money(rowTotal)}</td>

                  <td className="border-b border-slate-200 px-2 py-1 align-middle">
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => onDelete(index)}
                        className="rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] text-white hover:bg-red-600"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr>
              <td colSpan={7} className="px-2 py-2 text-right text-sm font-semibold text-slate-800">
                รวม:
              </td>

              <td className="px-2 py-2 text-right text-base font-bold text-slate-900 tabular-nums">{money(totalPrice)}</td>

              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
