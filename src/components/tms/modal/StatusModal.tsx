type Status = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

type Props = {
  open: boolean;
  current: Status | null;
  loading?: boolean;
  showMaintenance?: boolean;
  onClose: () => void;
  onChange: (status: Status) => void;
};

export default function StatusModal({ open, current, loading = false, showMaintenance = false, onClose, onChange }: Props) {
  if (!open) return null;

  const options: { value: Status; label: string; color: string; selectedColor: string }[] = [
    { value: "ACTIVE", label: "Active", color: "bg-green-100 text-green-600 hover:bg-green-200", selectedColor: "bg-green-50 text-green-300" },
    ...(showMaintenance ? [{ value: "MAINTENANCE" as const, label: "Maintenance", color: "bg-yellow-100 text-yellow-600 hover:bg-yellow-200", selectedColor: "bg-yellow-50 text-yellow-300" }] : []),
    { value: "INACTIVE", label: "Inactive", color: "bg-red-100 text-red-500 hover:bg-red-200", selectedColor: "bg-red-50 text-red-300" },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 font-thai" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="สถานะ" className="w-full max-w-[300px] animate-scaleIn rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <h3 className="mb-4 text-lg font-semibold text-slate-800">สถานะ</h3>
        <div className="flex flex-col gap-3">
          {options.map((option) => (
            <button key={option.value} type="button" disabled={loading || current === option.value} onClick={() => onChange(option.value)} className={`rounded-lg px-4 py-2 ${current === option.value ? `cursor-not-allowed ${option.selectedColor}` : option.color} ${loading ? "opacity-60" : ""}`}>
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
