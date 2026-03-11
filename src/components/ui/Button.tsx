import type { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  disabled,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const base =
    "min-h-[38px] px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 " +
    "focus:outline-none focus:ring-1.5 focus:ring-blue-400 focus:ring-offset-2 " +
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none " +
    "hover:transition-all active:scale-[0.99] " +
    "focus:ring-offset-white dark:focus:ring-offset-ds-main";
  const variants = {
    primary:
      "bg-app-primary text-white shadow-app-card hover:bg-app-accent hover:shadow-[0_4px_20px_rgba(37,99,235,0.2)] " +
      "dark:bg-gradient-primary dark:text-white dark:shadow-soft-glow dark:hover:shadow-[0_0_40px_rgba(59,130,246,0.25)] dark:hover:scale-[1.01]",
    secondary:
      "bg-white text-app-primary border border-app-border hover:bg-gray-50 " +
      "dark:bg-ds-card dark:text-ds-text dark:border-ds-border dark:hover:bg-ds-glass",
    outline:
      "border border-app-border bg-transparent text-app-primary hover:bg-gray-50 " +
      "dark:border-ds-border dark:bg-transparent dark:text-ds-text dark:hover:bg-ds-glass",
    ghost:
      "bg-transparent text-gray-600 hover:text-app-primary hover:bg-gray-100 " +
      "dark:text-ds-muted dark:hover:text-ds-text dark:hover:bg-ds-glass",
  };
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
