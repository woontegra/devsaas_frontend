import type { SelectHTMLAttributes } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({
  label,
  error,
  options,
  id,
  className = "",
  ...rest
}: SelectProps) {
  const selectId = id ?? label.replace(/\s/g, "-").toLowerCase();
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor={selectId}
        className="text-[11px] font-normal text-gray-500 dark:text-ds-muted tracking-wide"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={`h-9 w-full px-2.5 text-[13px] font-[300] rounded-md border border-gray-200 dark:border-ds-border transition-all duration-200
          bg-white text-gray-800
          focus:outline-none focus:ring-1.5 focus:ring-blue-400 focus:border-transparent
          dark:bg-ds-input dark:border-ds-border dark:text-ds-text dark:focus:ring-blue-500/50 dark:focus:border-transparent
          ${error ? "border-red-500 dark:border-red-500/60" : ""} ${className}`}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-[12px] text-red-500 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
