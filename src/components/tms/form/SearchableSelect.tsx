import React, { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "lucide-react";

export type SearchableOption = { value: string; label: string };

type SearchableSelectProps = {
  value: string;
  options: SearchableOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  options,
  onChange,
  placeholder = "เลือกข้อมูล",
  className = "",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      <div
        className="flex h-11 w-full cursor-text items-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"
        onClick={() => setIsDropdownOpen(true)}
      >
        <input
          type="text"
          value={isDropdownOpen ? searchTerm : selectedOption?.label || ""}
          placeholder={placeholder}
          onChange={handleInputChange}
          onFocus={() => setIsDropdownOpen(true)}
          className="min-w-0 flex-1 border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
        <ChevronDownIcon
          className={`ml-1 h-4 w-4 shrink-0 text-slate-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isDropdownOpen && (
        <ul className="absolute left-0 z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg">
          {filteredOptions.length ? (
            filteredOptions.map((option) => (
              <li
                key={option.value}
                className={`cursor-pointer truncate px-3 py-2 text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 ${option.value === value ? "bg-blue-50 font-medium text-blue-700" : ""}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(option)}
                title={option.label}
              >
                {option.label}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-slate-400">ไม่พบข้อมูล</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableSelect;
