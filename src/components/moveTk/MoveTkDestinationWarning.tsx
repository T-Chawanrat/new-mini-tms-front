import type { MoveTkProduct, MoveTkTruck } from "./types";

type Props = {
  product: MoveTkProduct;
  targetTruck: MoveTkTruck | undefined;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function MoveTkDestinationWarning({ product, targetTruck, onCancel, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
        <h3 className="text-base font-bold text-amber-700">แจ้งเตือนปลายทางไม่ตรงกัน</h3>
        <p className="mt-2 text-sm text-slate-700">ของชิ้นนี้ปลายทางไม่ใช่ DC ของใบปิดบรรทุกที่เลือก ยืนยันจะย้ายใช่หรือไม่</p>
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <div>SN: {product.serial_no}</div>
          <div>ปลายทางของพัสดุ: {product.to_warehouse_name || product.to_warehouse_id || "-"}</div>
          <div>DC ของใบปลายทาง: {targetTruck?.to_warehouse_name || targetTruck?.to_warehouse_id || "-"}</div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50">ไม่</button>
          <button type="button" onClick={onConfirm} className="h-9 rounded-md bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700">ใช่</button>
        </div>
      </div>
    </div>
  );
}
