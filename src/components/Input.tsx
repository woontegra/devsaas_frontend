import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className = "", ...rest }: InputProps) {
  const inputId = id ?? label.replace(/\s/g, "-").toLowerCase();
  return (
    <div className="w-full">
      <label htmlFor={inputId} className="block text-base font-medium text-slate-700 mb-1">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full min-h-[44px] px-3 py-2 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
          error ? "border-red-500" : "border-slate-300"
        } ${className}`}
        {...rest}
      />
      {error ? <p className="mt-1 text-base text-red-600">{error}</p> : null}
    </div>
  );
}
