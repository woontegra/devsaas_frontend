import type { HTMLAttributes } from "react";

export interface SectionTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3";
}

export function SectionTitle({ as: Tag = "h2", className = "", children, ...rest }: SectionTitleProps) {
  return (
    <Tag
      className={`text-[15px] md:text-base font-semibold text-app-primary dark:text-ds-text ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
