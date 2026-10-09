import type { MoveTkProduct, MoveTkTruck } from "./types";

type Props = {
  rows: MoveTkProduct[];
  loading?: boolean;
  moved?: boolean;
  destinationTruck?: MoveTkTruck | null;
  emptyText: string;
};

export default function MoveTkProductTable({ rows, loading = false, moved = false, destinationTruck = null, emptyText }: Props) {
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full table-fixed border-collapse text-xs">
        <thead className="sticky top-0 z-10 bg-slate-100 text-slate-600">
          <tr>
            <th className="w-[45%] border-b border-slate-200 px-3 py-2 text-left">SERIAL NO</th>
            <th className="w-[20%] border-b border-slate-200 px-3 py-2 text-left">ประเภทรถ</th>
            <th className="w-[35%] border-b border-slate-200 px-3 py-2 text-left">ทะเบียนรถ</th>
          </tr>
        </thead>
        <tbody>
          {!rows.length ? (
            <tr>
              <td colSpan={3} className="px-3 py-10 text-center text-sm text-slate-500">
                {loading ? "กำลังโหลดรายการ..." : emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const truck = moved && destinationTruck ? destinationTruck : row;

              return (
              <tr key={row.product_truck_id} className={index % 2 === 0 ? "bg-white hover:bg-blue-50/50" : "bg-slate-50/70 hover:bg-blue-50/50"}>
                <td className="border-b border-slate-100 px-3 py-2 align-top">
                  <span
                    className={`inline-block max-w-full break-all whitespace-normal rounded-lg border px-2.5 py-1 font-mono text-sm font-semibold leading-5 ${moved ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-600"}`}
                  >
                    {row.serial_no}
                  </span>
                </td>
                <td className="border-b border-slate-100 px-3 py-2">{truck.driver_type === "CONTRACTOR" ? "รถเสริม" : "รถปกติ"}</td>
                <td className="border-b border-slate-100 px-3 py-2">
                  <span
                    className="block truncate font-medium text-slate-700"
                    title={[truck.license_plate, truck.license_province].filter(Boolean).join(" - ") || "-"}
                  >
                    {[truck.license_plate, truck.license_province].filter(Boolean).join(" - ") || "-"}
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
