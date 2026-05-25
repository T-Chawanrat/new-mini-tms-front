import { useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";

type DatePickerProps = {
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
};

export default function DatePicker({
  value,
  onChange,
  placeholder = "เลือกวันที่",
  disabled = false,
  required = false,
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
          sx: {
            width: "100%",

            "& .MuiInputBase-root": {
              height: "42px",
              borderRadius: "12px !important",
              backgroundColor: "#fff",
              fontSize: "14px",
              color: "#334155",
              overflow: "hidden",
              cursor: "pointer",
            },

            "& .MuiOutlinedInput-root": {
              height: "42px",
              borderRadius: "12px !important",
              backgroundColor: "#fff",
              fontSize: "14px",
              color: "#334155",
              overflow: "hidden",
              cursor: "pointer",
            },

            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#e2e8f0 !important",
              borderWidth: "1px !important",
              borderRadius: "12px !important",
            },

            "& fieldset": {
              borderColor: "#e2e8f0 !important",
              borderRadius: "12px !important",
            },

            "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#cbd5e1 !important",
            },

            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#3b82f6 !important",
              borderWidth: "1px !important",
            },

            "& .MuiOutlinedInput-root.Mui-focused": {
              boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.12)",
            },

            "& .MuiInputBase-input": {
              padding: "9px 14px",
              fontSize: "14px",
              color: "#334155",
              cursor: "pointer",
            },

            "& .MuiInputBase-input::placeholder": {
              color: "#94a3b8",
              opacity: 1,
            },

            "& .MuiIconButton-root": {
              color: "#64748b",
              padding: "6px",
              marginRight: "4px",
            },

            "& .MuiSvgIcon-root": {
              fontSize: "20px",
            },
          },
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