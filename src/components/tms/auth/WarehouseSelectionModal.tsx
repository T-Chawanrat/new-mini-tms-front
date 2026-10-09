export type WarehouseOption = {
  warehouse_id: number;
  warehouse_name: string;
};

type WarehouseSelectionModalProps = {
  isOpen: boolean;
  warehouses: WarehouseOption[];
  loading: boolean;
  error: string;
  onSelect: (warehouse: WarehouseOption) => void;
  onCancel: () => void;
};

export default function WarehouseSelectionModal({
  isOpen,
  warehouses,
  loading,
  error,
  onSelect,
  onCancel,
}: WarehouseSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="warehouse-selection-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <div className="animate-scaleIn flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 id="warehouse-selection-title" className="text-xl font-semibold text-slate-900">
            กรุณาเลือกศูนย์กระจายสินค้า
          </h2>
          <p className="mt-1 text-sm text-slate-500">เลือก Warehouse ที่ต้องการใช้งานสำหรับ Login ครั้งนี้</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {warehouses.map((warehouse) => (
              <button
                key={warehouse.warehouse_id}
                type="button"
                disabled={loading}
                onClick={() => onSelect(warehouse)}
                className="min-h-12 rounded-md border border-sky-500 bg-white px-4 py-3 text-sm font-medium text-sky-700 transition hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {warehouse.warehouse_name}
              </button>
            ))}
          </div>

          {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-10 rounded-md bg-red-600 px-6 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
