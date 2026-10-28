import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon } from "lucide-react";

export type SearchableOption = { value: string; label: string };

type SearchableSelectProps = {
  value: string;
  options: SearchableOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  controlClassName?: string;
  compact?: boolean;
  disabled?: boolean;
  portal?: boolean;
};

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  options,
  onChange,
  placeholder = "เลือกข้อมูล",
  className = "",
  controlClassName = "",
  compact = false,
  disabled = false,
  portal = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [position, setPosition] = useState<React.CSSProperties>({});
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && !listRef.current?.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!portal || !isDropdownOpen) return;
    const updatePosition = () => {
      const rect = dropdownRef.current?.getBoundingClientRect();
      if (!rect) return;
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const opensUp = spaceBelow < 160 && spaceAbove > spaceBelow;
      setPosition({ position: "fixed", left: rect.left, width: rect.width, top: opensUp ? undefined : rect.bottom + 4, bottom: opensUp ? window.innerHeight - rect.top + 4 : undefined, maxHeight: Math.min(224, Math.max(0, opensUp ? spaceAbove : spaceBelow)), zIndex: 110 });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => { window.removeEventListener("resize", updatePosition); window.removeEventListener("scroll", updatePosition, true); };
  }, [portal, isDropdownOpen]);

  const keyword = searchTerm.trim().toLowerCase();
  const filteredOptions = keyword
    ? options.filter((option) => option.label.toLowerCase().includes(keyword))
    : options;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setIsDropdownOpen(true);
  };

  const handleSelect = (option: SearchableOption) => {
    onChange(option.value);
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  const dropdown = isDropdownOpen && !disabled && (
    <ul ref={listRef} style={portal ? position : undefined} className={`${portal ? "" : "absolute left-0 z-30 mt-1 max-h-56 w-full"} overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg`}>
      {filteredOptions.length ? filteredOptions.map((option) => (
        <li key={option.value} className={`cursor-pointer truncate px-3 py-2 text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 ${option.value === value ? "bg-blue-50 font-medium text-blue-700" : ""}`} onMouseDown={(event) => event.preventDefault()} onClick={() => handleSelect(option)} title={option.label}>{option.label}</li>
      )) : <li className="px-3 py-2 text-slate-400">ไม่พบข้อมูล</li>}
    </ul>
  );

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      <div
        className={`flex w-full cursor-text items-center border bg-white text-sm text-slate-700 outline-none transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 ${
          compact ? "h-9 rounded-md border-slate-300 px-2.5" : "h-11 rounded-lg border-slate-200 px-3"
        } ${controlClassName}`}
        onClick={() => { if (!disabled) setIsDropdownOpen(true); }}
      >
        <input
          type="text"
          disabled={disabled}
          value={isDropdownOpen ? searchTerm : selectedOption?.label || ""}
          placeholder={placeholder}
          onChange={handleInputChange}
          onFocus={() => { if (!disabled) setIsDropdownOpen(true); }}
          className="min-w-0 flex-1 border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
        <ChevronDownIcon
          className={`ml-1 h-4 w-4 shrink-0 text-slate-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
        />
      </div>

      {portal && dropdown ? createPortal(dropdown, document.body) : dropdown}
    </div>
  );
};

export default SearchableSelect;
