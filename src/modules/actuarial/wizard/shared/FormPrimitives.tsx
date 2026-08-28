import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";

/* ─── Design tokens (petrol / teal) ─────────────────────────────── */
export const DS = {
  primary: "#0F5F63",
  primaryDark: "#0B474A",
  primarySoft: "#EAF4F3",
  bg: "#F4F7F7",
  surface: "#FFFFFF",
  border: "#D9E5E3",
  text: "#22313F",
  muted: "#6B7280",
} as const;

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="w-full rounded-[11px] border border-[#D9E5E3] bg-white p-3.5 sm:p-4 shadow-[0_1px_4px_rgba(15,95,99,0.05)]">
      <div className="mb-3 pb-2.5 border-b border-[#D9E5E3] flex items-center gap-2">
        <span className="h-3.5 w-[3px] rounded-full bg-[#0F5F63] shrink-0" aria-hidden />
        <div className="min-w-0">
          <h3 className="text-[15px] font-medium text-[#22313F] tracking-[-0.01em] leading-snug">{title}</h3>
          {description && (
            <p className="mt-0.5 text-[12.5px] font-normal text-[#6B7280] leading-snug line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2.5">{children}</div>;
}

export function FormField({
  label,
  required,
  error,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-[12.5px] font-medium text-[#22313F]">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11.5px] font-normal text-[#6B7280]">{hint}</p>}
      {error && <p className="text-[11.5px] font-normal text-red-600">{error}</p>}
    </div>
  );
}

const inputCls =
  "w-full min-h-[40px] rounded-[10px] border border-[#D9E5E3] bg-white px-3 text-[13px] font-normal text-[#22313F] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F5F63]/15 focus:border-[#0F5F63]/50 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#F4F7F7]";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputCls} {...props} />;
}

export function TextSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={inputCls} {...props} />;
}

export function TextTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputCls} min-h-[88px] py-2.5`} {...props} />;
}

export function formatTRY(value: number): string {
  return value.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseTurkishCurrency(raw: string): number {
  let s = raw.trim();
  if (!s) return 0;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    const parts = s.split(",");
    if (parts.length === 2 && parts[1]!.length <= 2) {
      s = s.replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  }

  const n = parseFloat(s);
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function toDisplayStr(value: number): string {
  if (value === 0) return "";
  return formatTRY(value);
}

export function CurrencyInput({
  value,
  onChange,
  allowNegative = false,
  showPrefix = true,
  disabled,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  allowNegative?: boolean;
  showPrefix?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = useCallback(() => {
    setEditing(true);
    setEditText(value === 0 ? "" : formatTRY(value));
  }, [value]);

  const handleBlur = useCallback(() => {
    setEditing(false);
    const parsed = parseTurkishCurrency(editText);
    const final = allowNegative ? parsed : Math.max(0, parsed);
    onChange(final);
    setEditText("");
  }, [editText, onChange, allowNegative]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditText(e.target.value);
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text");
      const parsed = parseTurkishCurrency(pasted);
      const final = allowNegative ? parsed : Math.max(0, parsed);
      onChange(final);
      setEditing(false);
      setEditText("");
      inputRef.current?.blur();
    },
    [onChange, allowNegative]
  );

  const baseCls = className ?? inputCls;

  return (
    <div className="relative">
      {showPrefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#6B7280] pointer-events-none select-none">
          ₺
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        className={`${baseCls} text-right tabular-nums ${showPrefix ? "pl-7" : ""}`}
        disabled={disabled}
        placeholder="0,00"
        value={editing ? editText : toDisplayStr(value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        onPaste={handlePaste}
      />
    </div>
  );
}

export function DeleteIconButton({
  onClick,
  title = "Sil",
  className = "",
}: {
  onClick: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={`flex items-center justify-center h-8 w-8 rounded-[8px] border border-red-200/80 bg-red-50/80 text-red-500 hover:bg-red-100 hover:text-red-700 hover:border-red-300 transition-colors duration-200 shrink-0 ${className}`}
      onClick={onClick}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
    </button>
  );
}

export function InfoAlert({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[10px] border border-[#D9E5E3] bg-[#EAF4F3]/70 px-3.5 py-2.5 text-[12.5px] font-normal text-[#0B474A] leading-snug">
      {children}
    </div>
  );
}

export function WarningAlert({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[10px] border border-amber-200/80 bg-amber-50/80 px-3.5 py-2.5 text-[12.5px] font-normal text-amber-950 leading-snug">
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-[11px] border border-dashed border-[#D9E5E3] bg-[#F4F7F7] px-4 py-6 text-center">
      <p className="text-[13px] font-normal text-[#6B7280] mb-2.5">{title}</p>
      <button type="button" onClick={onAction} className="btn-primary inline-flex items-center justify-center min-h-[36px] px-4">
        {actionLabel}
      </button>
    </div>
  );
}

export function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="btn-secondary inline-flex items-center min-h-[36px] px-3.5 text-[12.5px]">
      + {label}
    </button>
  );
}

export function SummaryCard({
  title,
  children,
  variant = "default",
}: {
  title: string;
  children: ReactNode;
  variant?: "default" | "info";
}) {
  const base =
    variant === "info"
      ? "rounded-[11px] border border-[#D9E5E3] bg-[#EAF4F3]/50 p-3.5"
      : "rounded-[11px] border border-[#D9E5E3] bg-white p-3.5 shadow-[0_1px_3px_rgba(15,95,99,0.04)]";
  return (
    <div className={base}>
      <h4
        className={`text-[11px] font-medium uppercase tracking-[0.04em] mb-2 ${
          variant === "info" ? "text-[#0F5F63]" : "text-[#6B7280]"
        }`}
      >
        {title}
      </h4>
      <div
        className={`space-y-1 text-[12.5px] font-normal leading-snug ${
          variant === "info" ? "text-[#0B474A]" : "text-[#22313F]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function ProgressBar({ value, thin }: { value: number; thin?: boolean }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`${thin ? "h-1" : "h-1.5"} rounded-full bg-[#EAF4F3] overflow-hidden`}>
      <div className="h-full rounded-full bg-[#0F5F63] transition-all duration-200" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StepHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-[20px] font-semibold text-[#22313F] tracking-[-0.02em]">{title}</h2>
      {description && <p className="mt-1 text-[12.5px] font-normal text-[#6B7280] leading-snug">{description}</p>}
    </div>
  );
}

/** Tablo sarmalayıcı — cetvel ekranları için ortak stil */
export function DataTableWrap({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto rounded-[10px] border border-[#D9E5E3] ${className}`}>
      {children}
    </div>
  );
}

export const dataTableCls = {
  table: "w-full min-w-[480px] border-collapse text-[12.5px]",
  th: "bg-[#F4F7F7] border-b border-[#D9E5E3] px-2.5 py-2 text-left text-[11.5px] font-medium text-[#6B7280] uppercase tracking-wide whitespace-nowrap",
  td: "border-b border-[#D9E5E3]/80 px-2.5 py-2 text-[#22313F] align-middle",
  trHover: "hover:bg-[#EAF4F3]/35 transition-colors duration-150",
} as const;
