import React, { useState, useEffect, useRef } from "react";
import { ChevronDownIcon } from "lucide-react";
import AxiosInstance from "../../utils/AxiosInstance";

export interface Warehouse {
  id: number;
  name: string;
}

interface WarehouseDropdownProps {
  value?: string;
  onChange: (warehouse: Warehouse | null, inputText?: string) => void;
  className?: string;
}

const WarehouseDropdown: React.FC<WarehouseDropdownProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>(value || "");
  const [filteredWarehouses, setFilteredWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(
    null
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await AxiosInstance.get("/warehouses");

        // backend ใหม่ส่ง array ตรง ๆ: [{ id, name }]
        const data: Warehouse[] = response.data || [];

        setWarehouses(data);
        setFilteredWarehouses(data);
      } catch (error) {
        console.error("Error fetching warehouses:", error);
        setWarehouses([]);
        setFilteredWarehouses([]);
      }
    };

    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const results = warehouses.filter((warehouse) =>
        warehouse.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setFilteredWarehouses(results);
    } else {
      setFilteredWarehouses(warehouses);
    }
  }, [searchTerm, warehouses]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);

        if (!searchTerm && selectedWarehouseId) {
          const selectedWarehouse = warehouses.find(
            (warehouse) => warehouse.id === selectedWarehouseId
          );

          if (selectedWarehouse) {
            setSearchTerm(selectedWarehouse.name);
          }
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchTerm, selectedWarehouseId, warehouses]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    setSearchTerm(inputValue);
    setSelectedWarehouseId(null);
    setIsDropdownOpen(true);

    if (inputValue === "") {
      onChange(null, "");
      return;
    }

    onChange(null, inputValue);
  };

  const handleSelectChange = (warehouse: Warehouse) => {
    setSelectedWarehouseId(warehouse.id);
    setSearchTerm(warehouse.name);
    setIsDropdownOpen(false);

    onChange(warehouse, warehouse.name);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);

    if (!isDropdownOpen) {
      setFilteredWarehouses(warehouses);
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <div
        className="flex items-center w-full border border-slate-300 rounded-lg px-2.5 py-1.5
        text-sm cursor-text bg-white shadow-inner
        focus-within:ring-1 focus-within:ring-blue-400 focus-within:border-blue-400"
        onClick={() => setIsDropdownOpen(true)}
      >
        <input
          type="text"
          placeholder="ค้นหาคลังสินค้า"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsDropdownOpen(true)}
          className="flex-grow bg-transparent focus:outline-none text-xs sm:text-sm placeholder-slate-400"
        />

        <button
          type="button"
          onClick={toggleDropdown}
          className="focus:outline-none"
        >
          <ChevronDownIcon className="h-4 w-4 text-slate-400 ml-1" />
        </button>
      </div>

      {isDropdownOpen && (
        <ul
          className="absolute z-20 bg-white border border-slate-200 rounded-xl mt-1 w-full
          max-h-52 overflow-y-auto shadow-lg text-xs sm:text-sm"
        >
          {filteredWarehouses.length > 0 ? (
            filteredWarehouses.map((warehouse) => (
              <li
                key={warehouse.id}
                className={`px-3 py-1.5 cursor-pointer truncate hover:bg-blue-50 ${
                  warehouse.id === selectedWarehouseId
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-slate-700"
                }`}
                onClick={() => handleSelectChange(warehouse)}
              >
                {warehouse.name}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-slate-400 text-xs sm:text-sm">
              ไม่พบข้อมูล
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default WarehouseDropdown;