import React from "react";

type ZipAddressRow = {
  id: number;
  tambon_id: number;
  tambon_name_th: string;
  ampur_id: number;
  ampur_name_th: string;
  province_id: number;
  province_name_th: string;
  zip_code: string;
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
};

type AddressDropdownProps = {
  addressOptions: ZipAddressRow[];
  loading: boolean;
  onSelect: (row: ZipAddressRow) => void;
};

const AddressDropdown: React.FC<AddressDropdownProps> = ({
  addressOptions,
  loading,
  onSelect,
}) => {
  return (
    <div
      className="
        absolute left-0 right-0 mt-1
        bg-white 
        border border-gray-300 rounded-md
        shadow-lg text-sm
        max-h-30 overflow-y-auto z-20
        w-full
      "
    >
      {loading && (
        <div className="px-3 py-2 text-gray-500">กำลังค้นหาที่อยู่...</div>
      )}

      {!loading &&
        addressOptions.map((row, idx) => (
          <div
            key={idx}
            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => onSelect(row)}
          >
            {row.tambon_name_th} • {row.ampur_name_th} • {row.province_name_th}{" "}
            • {row.zip_code}
          </div>
        ))}
    </div>
  );
};

export default AddressDropdown;
