import { useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";

type DatePickerVariant = "default" | "compact";

type DatePickerProps = {
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  variant?: DatePickerVariant;
};

const getDatePickerSx = (variant: DatePickerVariant) => {
  const isCompact = variant === "compact";

  return {
    width: "100%",

    "& .MuiInputBase-root, & .MuiOutlinedInput-root": {
      height: isCompact ? "36px" : "42px",
      minHeight: isCompact ? "36px" : "42px",
      borderRadius: isCompact ? "8px !important" : "12px !important",
      backgroundColor: "#fff",
      fontSize: isCompact ? "13px" : "14px",
      color: "#334155",
      overflow: "hidden",
      cursor: "pointer",
      boxSizing: "border-box",
    },

    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#e2e8f0 !important",
      borderWidth: "1px !important",
      borderRadius: isCompact ? "8px !important" : "12px !important",
    },

    "& fieldset": {
      borderColor: "#e2e8f0 !important",
      borderRadius: isCompact ? "8px !important" : "12px !important",
    },

    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#cbd5e1 !important",
    },

    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#3b82f6 !important",
      borderWidth: "1px !important",
    },

    "& .MuiOutlinedInput-root.Mui-focused": {
      boxShadow: isCompact ? "0 0 0 2px rgba(59, 130, 246, 0.10)" : "0 0 0 3px rgba(59, 130, 246, 0.12)",
    },

    "& .MuiInputBase-input": {
      height: isCompact ? "36px" : "42px",
      minHeight: isCompact ? "36px" : "42px",
      boxSizing: "border-box",
      padding: isCompact ? "0 10px" : "9px 14px",
      fontSize: isCompact ? "13px" : "14px",
      lineHeight: isCompact ? "36px" : "normal",
      color: "#334155",
      cursor: "pointer",
    },

    "& .MuiInputBase-input::placeholder": {
      color: "#94a3b8",
      opacity: 1,
    },

    "& .MuiInputAdornment-root": {
      height: isCompact ? "36px" : "42px",
      maxHeight: isCompact ? "36px" : "42px",
    },

    "& .MuiIconButton-root": {
      width: isCompact ? "28px" : "32px",
      height: isCompact ? "28px" : "32px",
      color: "#64748b",
      padding: isCompact ? "4px" : "6px",
      marginRight: isCompact ? "2px" : "4px",
    },

    "& .MuiSvgIcon-root": {
      fontSize: isCompact ? "18px" : "20px",
    },
  };
};

export default function DatePicker({
  value,
  onChange,
  placeholder = "เลือกวันที่",
  disabled = false,
  required = false,
  variant = "default",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <MuiDatePicker
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={value ? dayjs(value) : null}
      onChange={(date: Dayjs | null) => {
        onChange(date ? date.format("YYYY-MM-DD") : "");
        setOpen(false);
      }}
      format="YYYY-MM-DD"
      disabled={disabled}
      slotProps={{
        textField: {
          fullWidth: true,
          size: "small",
          required,
          onClick: () => {
            if (!disabled) setOpen((prev) => !prev);
          },
          slotProps: {
            htmlInput: {
              placeholder,
              readOnly: true,
            },
          },
          sx: getDatePickerSx(variant),
        },
        openPickerButton: {
          onClick: (e) => {
            e.stopPropagation();
            if (!disabled) setOpen((prev) => !prev);
          },
        },
      }}
    />
  );
}