import React, { useState, useEffect, useRef } from "react";
import { ChevronDownIcon } from "lucide-react";
import AxiosInstance from "../../utils/AxiosInstance";

export interface Customer {
  id: number;
  name: string;
  code: string;
}

interface CustomerDropdownProps {
  value?: string;
  onChange: (customer: Customer | null, inputText?: string) => void;
}

const CustomerDropdown: React.FC<CustomerDropdownProps> = ({ value, onChange }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>(value || "");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  const fetchCustomers = async (keyword = "") => {
    try {
      const response = await AxiosInstance.get("/customers", {
        params: keyword ? { search: keyword } : {},
      });

      const data: Customer[] = response.data || [];
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(searchTerm.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);

        if (!searchTerm && selectedCustomerId) {
          const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);

          if (selectedCustomer) {
            setSearchTerm(selectedCustomer.name);
          }
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchTerm, selectedCustomerId, customers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    setSearchTerm(inputValue);
    setSelectedCustomerId(null);
    setIsDropdownOpen(true);

    onChange(null, inputValue);
  };

  const handleSelectChange = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setSearchTerm(customer.name);
    setIsDropdownOpen(false);

    onChange(customer, customer.name);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        className="flex items-center w-full border border-slate-300 rounded-lg px-2.5 py-1.5 
       text-sm cursor-text bg-white
       focus-within:ring-0 focus-within:border-slate-300"
        onClick={() => setIsDropdownOpen(true)}
      >
        <input
          type="text"
          placeholder="ค้นหาลูกค้า"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsDropdownOpen(true)}
          className="flex-grow bg-transparent outline-none ring-0 border-none shadow-none focus:outline-none focus:ring-0 focus:border-none text-xs sm:text-sm placeholder-slate-400"
        />

        <ChevronDownIcon className="h-4 w-4 text-slate-400 ml-1" />
      </div>

      {isDropdownOpen && (
        <ul className="absolute z-20 left-0 bg-white border border-slate-200 rounded-xl mt-1 w-full min-w-[420px] max-h-52 overflow-y-auto shadow-lg text-xs sm:text-sm">
          {customers.length > 0 ? (
            customers.map((customer) => (
              <li
                key={customer.id}
                className={`px-3 py-1.5 cursor-pointer truncate hover:bg-blue-50 ${
                  customer.id === selectedCustomerId ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700"
                }`}
                onClick={() => handleSelectChange(customer)}
              >
                {customer.id} {customer.code} {customer.name}
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

export default CustomerDropdown;