import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({
  label,
  error,
  id,
  type = "text",
  className = "",
  placeholder,
  ...rest
}: InputProps) {
  const inputId = id ?? label.replace(/\s/g, "-").toLowerCase();
  const isDate = type === "date";

  const baseInputClass =
    "w-full rounded-md border border-gray-200 dark:border-ds-border px-2.5 text-[13px] min-w-0 " +
    "bg-white dark:bg-ds-input text-gray-800 dark:text-ds-text font-[300] " +
    "focus:outline-none focus:ring-1.5 focus:ring-blue-400 focus:border-transparent transition " +
    (error ? "border-red-500 focus:ring-red-500/50 dark:border-red-500/60 " : "");

  const heightClass = isDate ? "h-9" : "h-9";
  const dateExtraClass = isDate ? " appearance-none" : "";
  const inputClassName = `${baseInputClass} ${heightClass}${dateExtraClass} ${className}`.trim();

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor={inputId}
        className="text-[11px] font-normal text-gray-500 dark:text-ds-muted tracking-wide"
      >
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        className={inputClassName}
        placeholder={isDate ? undefined : placeholder}
        {...rest}
      />
      {error ? (
        <p className="mt-1 text-[12px] text-red-500 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
