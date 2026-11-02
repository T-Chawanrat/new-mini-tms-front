import { useState } from "react";
import { Menu, MenuItem } from "@mui/material";
import { Check, ChevronDownIcon } from "lucide-react";

type SelectProps = {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export default function Select({ value, options, onChange, placeholder = "เลือกข้อมูล", disabled = false, className = "", "aria-label": ariaLabel }: SelectProps) {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const selected = options.find((option) => option.value === value);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={Boolean(anchor)}
        onClick={(event) => setAnchor(event.currentTarget)}
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 ${className}`}
      >
        <span className={`min-w-0 truncate ${selected ? "text-slate-900" : "text-slate-400"}`}>{selected?.label || placeholder}</span>
        <ChevronDownIcon size={16} className={`shrink-0 text-slate-500 transition-transform ${anchor ? "rotate-180" : ""}`} />
      </button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              width: anchor?.offsetWidth,
              maxHeight: 224,
              borderRadius: "0.5rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 15px -3px rgb(15 23 42 / 0.1)",
            },
          },
          list: { role: "listbox", sx: { py: 0.5 } },
        }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === value}
            role="option"
            aria-selected={option.value === value}
            onClick={() => {
              onChange(option.value);
              setAnchor(null);
            }}
            sx={{
              minHeight: 40,
              px: 1.5,
              gap: 1,
              fontFamily: "inherit",
              fontSize: "0.875rem",
              color: "#0f172a",
              "&:hover": { backgroundColor: "#eff6ff", color: "#1d4ed8" },
              "&.Mui-selected": { backgroundColor: "#eff6ff", color: "#1d4ed8" },
            }}
          >
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
            {option.value === value && <Check size={16} />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
