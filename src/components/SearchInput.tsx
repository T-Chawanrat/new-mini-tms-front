import React from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "ค้นหา ...",
}) => {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value.trim())}
      className="border border-gray-300 rounded-lg px-3 py-1 h-9 w-full lg:w-60 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
    />
  );
};

export default SearchInput;
