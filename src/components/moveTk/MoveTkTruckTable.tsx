import { formatThaiNumber } from "../../utils/textSanitizer";
import type { MoveTkTruck } from "./types";

type Props = {
  rows: MoveTkTruck[];
  selectedId: string;
  loading: boolean;
  emptyText: string;
  onSelect: (truck: MoveTkTruck) => void;
};

export default function MoveTkTruckTable({ rows, selectedId, loading, emptyText, onSelect }: Props) {
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full border-collapse text-xs">
        <thead className="sticky top-0 z-10 bg-slate-100 text-slate-600">
          <tr>
            <th className="w-10 border-b border-slate-200 px-2 py-2" />
            <th className="border-b border-slate-200 px-3 py-2 text-left">เลขใบปิดบรรทุก</th>
            <th className="border-b border-slate-200 px-3 py-2 text-left">เส้นทาง</th>
            <th className="border-b border-slate-200 px-3 py-2 text-left">คนขับ / ทะเบียน</th>
            <th className="border-b border-slate-200 px-3 py-2 text-center">จำนวนกล่อง</th>
            <th className="border-b border-slate-200 px-3 py-2 text-center">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {!rows.length ? (
            <tr>
              <td colSpan={6} className="px-3 py-12 text-center text-sm text-slate-500">
                {loading ? "กำลังโหลดรายการ..." : emptyText}
              </td>
            </tr>
          ) : (
            rows.map((truck) => {
              const selected = String(truck.truck_load_id) === selectedId;
              return (
                <tr
                  key={truck.truck_load_id}
                  onClick={() => onSelect(truck)}
                  className={`cursor-pointer border-b border-slate-100 transition ${selected ? "bg-blue-50 hover:bg-blue-50" : "bg-white hover:bg-slate-50"}`}
                >
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${selected ? "border-blue-600" : "border-slate-300"}`}
                    >
                      {selected && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-semibold text-slate-800">{truck.truck_code}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">{truck.driver_type === "CONTRACTOR" ? "รถเสริม" : "รถปกติ"}</div>
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    <div>{truck.warehouse_name || "-"}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">ไป {truck.to_warehouse_name || "-"}</div>
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    <div>{truck.driver_name || "-"}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {[truck.license_plate, truck.license_province].filter(Boolean).join(" ") || "-"}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center font-semibold text-slate-700">{formatThaiNumber(truck.count_box)}</td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${truck.is_close === "Y" ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}
                    >
                      {truck.is_close === "Y" ? "ปิดบรรทุก" : "ยังไม่ปิด"}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
