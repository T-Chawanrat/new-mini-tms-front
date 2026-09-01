import { type RefObject } from "react";

type ScanInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onScan: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  tone?: "blue" | "amber";
};

const toneClasses = {
  blue: "focus:border-blue-500 focus:ring-blue-100",
  amber: "focus:border-amber-500 focus:ring-amber-100",
};

export default function ScanInput({
  label,
  value,
  onChange,
  onScan,
  placeholder = "ยิง Serial No",
  disabled = false,
  inputRef,
  tone = "blue",
}: ScanInputProps) {
  return (
    <div className="min-w-0">
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          onScan(event.currentTarget.value);
        }}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className={`h-9 w-full rounded-md border border-slate-300 bg-white px-3 font-mono text-sm outline-none transition focus:ring-2 disabled:border-slate-200 disabled:bg-slate-100 ${toneClasses[tone]}`}
      />
    </div>
  );
}
