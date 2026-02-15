import { ChevronDown } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

interface Option {
  label: string;
  value: string;
}

interface DropdownProps {
  options: Option[];
  value: string;
  error?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  error,
  placeholder,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-left transition-all duration-200 focus:ring-2 focus:ring-gray-100 focus:outline-none ${
          error
            ? "border-red-500 ring-2 ring-red-100"
            : "border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100"
        }`}
      >
        <span
          className={
            selected ? "text-sm text-gray-800" : "text-sm text-gray-400"
          }
        >
          {selected ? selected.label : placeholder}
        </span>

        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="animate-in fade-in zoom-in-95 absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl duration-150">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`cursor-pointer px-4 py-2.5 text-sm transition-all duration-150 ${
                value === option.value
                  ? "bg-gray-100 font-medium text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              } `}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
      {error && (
        <p className="mt-1 text-xs font-medium text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Dropdown;
