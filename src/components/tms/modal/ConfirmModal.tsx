import Modal from "@mui/material/Modal";
import { X } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  description?: ReactNode;
  loading?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  loadingLabel?: string;
  danger?: boolean;
  success?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmModal({ open, title, description, loading = false, confirmLabel = "ยืนยัน", cancelLabel = "ยกเลิก", loadingLabel = "กำลังบันทึก...", danger = false, success = false, closeOnBackdrop = true, closeOnEscape = true, onClose, onConfirm }: Props) {
  return (
    <Modal open={open} onClose={(_, reason) => { if (!loading && (closeOnBackdrop || reason !== "backdropClick") && (closeOnEscape || reason !== "escapeKeyDown")) onClose(); }} aria-labelledby="confirm-modal-title" aria-describedby={description ? "confirm-modal-description" : undefined} className="flex items-center justify-center p-4">
      <div className="font-thai w-full max-w-sm animate-scaleIn rounded-2xl bg-white shadow-xl outline-none">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id="confirm-modal-title" className="text-lg font-semibold text-slate-800">{title}</h2>
          <button type="button" disabled={loading} onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50" aria-label="ปิด"><X size={20} /></button>
        </div>
        {description && <div id="confirm-modal-description" className="px-5 py-4 text-sm text-slate-600">{description}</div>}
        <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4">
          <button type="button" disabled={loading} onClick={onClose} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-60">{cancelLabel}</button>
          <button type="button" disabled={loading} onClick={onConfirm} className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${danger ? "bg-red-600 hover:bg-red-700" : success ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"}`}>{loading ? loadingLabel : confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}
