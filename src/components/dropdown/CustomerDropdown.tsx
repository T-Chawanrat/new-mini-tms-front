// import React, { useState, useEffect, useRef } from "react";
// import { ChevronDownIcon } from "lucide-react";
// import AxiosInstance from "../../utils/AxiosInstance";

// export interface Customer {
//   customer_id: number;
//   customer_name: string;
// }

// interface CustomerDropdownProps {
//   onChange: (customer: Customer | null, inputText?: string) => void;
// }

// const CustomerDropdown: React.FC<CustomerDropdownProps> = ({ onChange }) => {
//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [searchTerm, setSearchTerm] = useState<string>("");
//   const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
//   const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
//     null,
//   );
//   const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const fetchCustomers = async () => {
//       try {
//         const response = await AxiosInstance.get("/customers");
//         const data = response.data.data || [];
//         setCustomers(data);
//         setFilteredCustomers(data);
//       } catch (error) {
//         console.error("Error fetching customers:", error);
//       }
//     };

//     fetchCustomers();
//   }, []);

//   useEffect(() => {
//     if (searchTerm) {
//       const results = customers.filter((customer) =>
//         customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()),
//       );
//       setFilteredCustomers(results);
//     } else {
//       setFilteredCustomers(customers);
//     }
//   }, [searchTerm, customers]);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(event.target as Node)
//       ) {
//         setIsDropdownOpen(false);

//         if (!searchTerm && selectedCustomerId) {
//           const selectedCustomer = customers.find(
//             (customer) => customer.customer_id === selectedCustomerId,
//           );
//           if (selectedCustomer) {
//             setSearchTerm(selectedCustomer.customer_name);
//           }
//         }
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [searchTerm, selectedCustomerId, customers]);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     setSearchTerm(value);
//     setIsDropdownOpen(true);

//     onChange(null, value);
//   };

//   const handleSelectChange = (customerId: number, customerName: string) => {
//     setSelectedCustomerId(customerId);
//     setSearchTerm(customerName);
//     setIsDropdownOpen(false);

//     onChange(
//       { customer_id: customerId, customer_name: customerName },
//       customerName,
//     );
//   };

//   return (
//     <div className="relative w-full" ref={dropdownRef}>
//       {/* <label className="block text-sm font-medium mb-1">
//     ชื่อลูกค้า (CUSTOMER_NAME)
//   </label> */}

//       {/* ช่องค้นหา / แสดงลูกค้า */}
//       <div
//         className="flex items-center w-full border border-slate-300 rounded-lg px-2.5 py-1.5
//                text-sm cursor-text bg-white shadow-inner
//                focus-within:ring-1 focus-within:ring-blue-400 focus-within:border-blue-400"
//         onClick={() => setIsDropdownOpen(true)}
//       >
//         <input
//           type="text"
//           placeholder="ค้นหาลูกค้า"
//           value={searchTerm}
//           onChange={handleInputChange}
//           onFocus={() => setIsDropdownOpen(true)}
//           className="flex-grow bg-transparent focus:outline-none text-xs sm:text-sm placeholder-slate-400"
//         />
//         <ChevronDownIcon className="h-4 w-4 text-slate-400 ml-1" />
//       </div>

//       {isDropdownOpen && (
//         <ul
//           className="absolute z-20 bg-white border border-slate-200 rounded-xl mt-1 w-full
//                  max-h-52 overflow-y-auto shadow-lg text-xs sm:text-sm"
//         >
//           {filteredCustomers.length > 0 ? (
//             filteredCustomers.map((customer) => (
//               <li
//                 key={customer.customer_id}
//                 className={`px-3 py-1.5 cursor-pointer truncate
//                        hover:bg-blue-50
//                        ${
//                          customer.customer_id === selectedCustomerId
//                            ? "bg-blue-50 text-blue-700 font-medium"
//                            : "text-slate-700"
//                        }`}
//                 onClick={() =>
//                   handleSelectChange(
//                     customer.customer_id,
//                     customer.customer_name,
//                   )
//                 }
//               >
//                 {customer.customer_name}
//               </li>
//             ))
//           ) : (
//             <li className="px-3 py-2 text-slate-400 text-xs sm:text-sm">
//               ไม่พบข้อมูล
//             </li>
//           )}
//         </ul>
//       )}
//     </div>
//   );
// };

// export default CustomerDropdown;

import React, { useState, useEffect, useRef } from "react";
import { ChevronDownIcon } from "lucide-react";
import AxiosInstance from "../../utils/AxiosInstance";

export interface Customer {
  id: number;
  name: string;
}

interface CustomerDropdownProps {
  value?: string;
  onChange: (customer: Customer | null, inputText?: string) => void;
}

const CustomerDropdown: React.FC<CustomerDropdownProps> = ({
  value,
  onChange,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>(value || "");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await AxiosInstance.get("/customers");

        // backend ใหม่ส่ง array ตรง ๆ: [{ id, name }]
        const data: Customer[] = response.data || [];

        setCustomers(data);
        setFilteredCustomers(data);
      } catch (error) {
        console.error("Error fetching customers:", error);
        setCustomers([]);
        setFilteredCustomers([]);
      }
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const results = customers.filter((customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredCustomers(results);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);

        if (!searchTerm && selectedCustomerId) {
          const selectedCustomer = customers.find(
            (customer) => customer.id === selectedCustomerId,
          );

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
      <ul
  className="absolute z-20 bg-white border border-slate-200 rounded-xl mt-1 w-100 max-h-52 overflow-y-auto shadow-lg text-xs sm:text-sm"
>
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <li
                key={customer.id}
                className={`px-3 py-1.5 cursor-pointer truncate hover:bg-blue-50 ${
                  customer.id === selectedCustomerId
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-slate-700"
                }`}
                onClick={() => handleSelectChange(customer)}
              >
                {customer.name}
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

export default CustomerDropdown;
