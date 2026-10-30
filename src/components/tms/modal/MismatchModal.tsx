import { useEffect, useRef, type ReactNode } from "react";

type MismatchModalProps = {
  open: boolean;
  saving?: boolean;
  title: string;
  description: string;
  children: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function MismatchModal({
  open,
  saving = false,
  title,
  description,
  children,
  confirmLabel = "ใช่",
  onConfirm,
  onCancel,
}: MismatchModalProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open || saving) return;

    cancelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        confirmRef.current?.focus();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        cancelRef.current?.focus();
      }

      if (event.key === "Tab") event.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, saving]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
        <h3 className="text-base font-bold text-amber-700">{title}</h3>
        <p className="mt-2 text-sm text-slate-700">{description}</p>
        {children}
        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
          >
            {confirmLabel}
          </button>
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-9 rounded-md bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700 focus:ring-2 focus:ring-amber-200 disabled:bg-slate-300"
          >
            ไม่
          </button>
        </div>
      </div>
    </div>
  );
}
