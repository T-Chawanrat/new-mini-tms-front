import React, { useEffect, useRef, useState } from "react";
import AxiosInstance from "../../utils/AxiosInstance";

export type ZipAddressRow = {
  id: number;
  warehouse_id: number | null;

  subdistrict_id: number;
  subdistrict_name: string;

  district_id: number;
  district_name: string;

  province_id: number;
  province_name: string;

  zip_code: string;
};

type AddressSearchDropdownProps = {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onSelect: (row: ZipAddressRow) => void;
};

const AddressSearchDropdown: React.FC<AddressSearchDropdownProps> = ({
  value = "",
  placeholder = "ค้นหาตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์",
  onChange,
  onSelect,
}) => {
  const [keyword, setKeyword] = useState(value);
  const [addressOptions, setAddressOptions] = useState<ZipAddressRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setKeyword(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);

      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const searchAddress = async (searchText: string) => {
    const text = searchText.trim();

    if (!text || text.length < 2) {
      setAddressOptions([]);
      setIsOpen(false);
      return;
    }

    try {
      setLoading(true);
      setIsOpen(true);

      const res = await AxiosInstance.get("/address-search", {
        params: { keyword: text },
      });

      setAddressOptions(res.data.data || []);
    } catch (err) {
      console.error("SEARCH ADDRESS ERROR:", err);
      setAddressOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;

    setKeyword(text);
    setIsOpen(true);
    onChange?.(text);

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      searchAddress(text);
    }, 250);
  };

  const handleSelect = (row: ZipAddressRow) => {
    const label = `${row.subdistrict_name} • ${row.district_name} • ${row.province_name} • ${row.zip_code}`;

    setKeyword(label);
    setAddressOptions([]);
    setIsOpen(false);

    onSelect(row);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <input
        type="text"
        value={keyword}
        placeholder={placeholder}
        onChange={handleInputChange}
        onFocus={() => {
          setIsOpen(true);

          if (keyword.trim().length >= 2) {
            searchAddress(keyword);
          }
        }}
        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm bg-white outline-none shadow-none focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
      />

      {isOpen && (
        <div
          className="
            absolute left-0 right-0 mt-1
            bg-white
            border border-gray-300 rounded-md
            shadow-lg text-sm
            max-h-40 overflow-y-auto z-50
            w-full
          "
        >
          {loading && (
            <div className="px-3 py-2 text-gray-500">กำลังค้นหาที่อยู่...</div>
          )}

          {!loading && addressOptions.length === 0 && keyword.length >= 2 && (
            <div className="px-3 py-2 text-gray-400">ไม่พบข้อมูลที่อยู่</div>
          )}

          {!loading &&
            addressOptions.map((row) => (
              <div
                key={row.id}
                className="px-3 py-2  cursor-pointer"
                onMouseDown={() => handleSelect(row)}
              >
                {row.subdistrict_name} • {row.district_name} •{" "}
                {row.province_name} • {row.zip_code}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default AddressSearchDropdown;
