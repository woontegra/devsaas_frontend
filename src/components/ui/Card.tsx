import type { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "solid" | "light";
}

export function Card({ variant = "light", className = "", children, ...rest }: CardProps) {
  const base =
    "rounded-card overflow-hidden transition-all duration-200 " +
    "bg-white border border-app-border shadow-app-card hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] " +
    "dark:border-ds-border dark:shadow-card-shadow dark:hover:shadow-soft-glow";
  const variants = {
    light: "",
    glass: "dark:bg-ds-glass dark:backdrop-blur-lg",
    solid: "dark:bg-ds-card",
  };
  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </div>
  );
}
