import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const unitMaps = {
  frequency: {
    Hz: 1,
    kHz: 1e3,
    MHz: 1e6,
    GHz: 1e9,
    THz: 1e12,
  },
  power: {
    mW: 1e-3,
    W: 1,
    kW: 1e3,
  },
  time: {
    ns: 1e-9,
    µs: 1e-6,
    ms: 1e-3,
    s: 1,
  },
} as const;

type UnitCategory = keyof typeof unitMaps;
type UnitOf<T extends UnitCategory> = Extract<
  keyof (typeof unitMaps)[T],
  string
>;

interface PhysicalInput<T extends UnitCategory> {
  value: number | null;
  unit: UnitOf<T>;
}

interface InputProps<T extends UnitCategory> {
  type?: string;
  value: PhysicalInput<T>;
  onChange: (value: PhysicalInput<T>) => void;
  placeholder?: string;
  disabled?: boolean;
  unitType: T;
  error?: string;
  minValue?: number;
  maxValue?: number;
}

function Input<T extends UnitCategory>({
  type = "number",
  value,
  onChange,
  disabled,
  placeholder,
  error,
  unitType,
  minValue,
  maxValue,
}: InputProps<T>) {
  const units = unitMaps[unitType];

  const unitKeys = Object.keys(units) as UnitOf<T>[];

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleValueChange = (val: string) => {
    if (val === "") {
      onChange({ ...value, value: null });
      return;
    }

    const numeric = Number(val);
    if (isNaN(numeric)) return;

    onChange({ ...value, value: numeric });
  };

  const handleUnitChange = (unit: UnitOf<T>) => {
    setOpen(false);
    onChange({
      ...value,
      unit,
    });
  };

  return (
    <div className="w-full">
      <div
        className={`relative flex items-stretch rounded-xl border bg-white transition-all duration-200 ${
          error
            ? "border-red-500 ring-2 ring-red-100"
            : "border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100"
        }`}
      >
        <input
          type={type}
          value={value.value ?? ""}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder={placeholder}
          min={minValue}
          max={maxValue}
          disabled={disabled}
          className={`flex-1 rounded-l-xl px-4 py-3 text-sm focus:outline-none ${
            error ? "text-red-600 placeholder-red-300" : "text-gray-800"
          }`}
        />

        <div ref={dropdownRef} className="relative border-l border-gray-200">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex h-full items-center justify-center gap-1 rounded-r-xl px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {value.unit}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {open && (
            <div className="absolute top-full z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {unitKeys.map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => handleUnitChange(unit)}
                  className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
                    value.unit === unit
                      ? "bg-gray-100 font-medium text-indigo-600"
                      : ""
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {error && (
        <p className="mt-1 text-xs font-medium text-red-500">{error}</p>
      )}
    </div>
  );
}

interface NumberInputProps {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  error?: string;
  min?: number;
  max?: number;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  placeholder,
  error,
  min,
  max,
}) => (
  <div
    className={`relative flex items-stretch rounded-xl border bg-white transition-all duration-200 ${
      error
        ? "border-red-500 ring-2 ring-red-100"
        : "border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100"
    }`}
  >
    <input
      type="number"
      value={value ?? ""}
      placeholder={placeholder}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className={`flex-1 rounded-l-xl px-4 py-3 text-sm focus:outline-none ${
        error ? "text-red-600 placeholder-red-300" : "text-gray-800"
      }`}
    />
    {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
  </div>
);

export default Input;
