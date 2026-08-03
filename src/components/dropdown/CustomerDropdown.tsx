import React, { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import AxiosInstance from "../../utils/AxiosInstance";

export interface Customer {
  id: number;
  name: string;
  code: string;
}

interface CustomerDropdownProps {
  value?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  onChange: (
    customer: Customer | null,
    inputText?: string,
  ) => void;
}

const CustomerDropdown: React.FC<CustomerDropdownProps> = ({
  value,
  disabled = false,
  className = "",
  placeholder = "ค้นหา Customer",
  onChange,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>(
    value || "",
  );
  const [selectedCustomerId, setSelectedCustomerId] =
    useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] =
    useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const latestSearchRef = useRef("");

  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  const fetchCustomers = async (keyword = "") => {
    try {
      const currentKeyword = keyword.trim();

      latestSearchRef.current = currentKeyword;
      setLoading(true);

      const response = await AxiosInstance.get("/customers", {
        params: currentKeyword
          ? { search: currentKeyword }
          : {},
      });

      if (latestSearchRef.current !== currentKeyword) {
        return;
      }

      const data: Customer[] = Array.isArray(response.data)
        ? response.data
        : [];

      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCustomers();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchCustomers(searchTerm.trim());
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const inputValue = event.target.value;

    setSearchTerm(inputValue);
    setSelectedCustomerId(null);
    setIsDropdownOpen(true);

    onChange(null, inputValue);
  };

  const handleSelectChange = (customer: Customer) => {
    const label = customer.code
      ? `${customer.code} - ${customer.name}`
      : customer.name;

    setSelectedCustomerId(customer.id);
    setSearchTerm(label);
    setIsDropdownOpen(false);

    onChange(customer, label);
  };

  return (
    <div
      ref={dropdownRef}
      className={`relative w-full ${className}`}
    >
      <div
        className={`flex h-9 w-full items-center rounded-md border border-slate-300 px-2.5 text-sm text-slate-700 outline-none transition ${
          disabled
            ? "cursor-not-allowed bg-slate-100 opacity-70"
            : "cursor-text bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
        }`}
        onClick={() => {
          if (!disabled) {
            setIsDropdownOpen(true);
          }
        }}
      >
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          disabled={disabled}
          onChange={handleInputChange}
          onFocus={() => {
            if (!disabled) {
              setIsDropdownOpen(true);
            }
          }}
          className="min-w-0 flex-1 border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
        />

        <ChevronDownIcon
          className={`ml-1 h-4 w-4 shrink-0 text-slate-600 transition-transform ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isDropdownOpen && !disabled && (
        <ul className="absolute left-0 z-30 mt-1 max-h-56 w-full min-w-[420px] overflow-y-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg">
          {loading && (
            <li className="px-3 py-2 text-slate-400">
              กำลังโหลด...
            </li>
          )}

          {!loading && customers.length > 0 ? (
            customers.map((customer) => (
              <li
                key={customer.id}
                className={`cursor-pointer truncate px-3 py-2 transition hover:bg-blue-50 ${
                  customer.id === selectedCustomerId
                    ? "bg-blue-50 font-medium text-blue-700"
                    : "text-slate-700"
                }`}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() =>
                  handleSelectChange(customer)
                }
                title={`${customer.code || ""} ${
                  customer.name || ""
                }`}
              >
                {customer.code
                  ? `${customer.code} - ${customer.name}`
                  : customer.name}
              </li>
            ))
          ) : !loading ? (
            <li className="px-3 py-2 text-slate-400">
              ไม่พบข้อมูล
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
};

export default CustomerDropdown;

