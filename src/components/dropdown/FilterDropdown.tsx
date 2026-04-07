import React, { useState, useEffect, useRef } from "react";
import { ChevronDownIcon } from "lucide-react";

interface FilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "ค้นหา",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [filtered, setFiltered] = useState<string[]>(options);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    setFiltered(
      term
        ? options.filter((o) => o.toLowerCase().includes(term))
        : options
    );
  }, [searchTerm, options]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSearchTerm(v);
    onChange(v);
    setIsOpen(true);
  };

  const handleSelect = (val: string) => {
    setSearchTerm(val);
    onChange(val);
    setIsOpen(false);
  };

  return (
<div className="relative w-full" ref={ref}>
  {/* Input area */}
  <div
    className="flex items-center w-full border border-slate-300 rounded-lg px-2.5 py-1.5 
               text-sm cursor-text bg-white shadow-inner
               focus-within:ring-1 focus-within:ring-blue-400 focus-within:border-blue-400"
    onClick={() => setIsOpen(true)}
  >
    <input
      type="text"
      placeholder={placeholder}
      value={searchTerm}
      onChange={handleInputChange}
      onFocus={() => setIsOpen(true)}
      className="flex-grow bg-transparent focus:outline-none text-xs sm:text-sm placeholder-slate-400"
    />
    <ChevronDownIcon className="h-4 w-4 text-slate-400 ml-1" />
  </div>

  {/* Dropdown list */}
  {isOpen && (
    <ul
      className="absolute z-20 bg-white border border-slate-200 rounded-xl mt-1 w-full 
                 max-h-52 overflow-y-auto shadow-lg text-xs sm:text-sm"
    >
      {filtered.length > 0 ? (
        filtered.map((item) => (
          <li
            key={item}
            className="px-3 py-1.5 cursor-pointer truncate text-slate-700 
                       hover:bg-blue-50 hover:text-blue-700"
            onClick={() => handleSelect(item)}
          >
            {item}
          </li>
        ))
      ) : (
        <li className="px-3 py-2 text-slate-400 text-xs sm:text-sm">ไม่พบข้อมูล</li>
      )}
    </ul>
  )}
</div>

  );
};
