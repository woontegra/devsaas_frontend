import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";

/* ─── Design tokens ─────────────────────────────────────────────── */
export const DS = {
  primary: "#243746",
  primaryDark: "#192833",
  primarySoft: "#EEF2F4",
  accentOrange: "#D9892B",
  accentOrangeSoft: "#FFF3E3",
  bg: "#F5F7FA",
  surface: "#FFFFFF",
  border: "#DCE3E8",
  text: "#1F2933",
  muted: "#66727F",
} as const;

export function FormSection({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  const showHeader = Boolean(title || description);
  return (
    <section className="ui-form-section">
      {showHeader && (
        <div className="mb-4 pb-3 border-b border-brand-border flex items-start gap-2.5">
          <span className="ui-card-header-mark mt-1" aria-hidden />
          <div className="min-w-0">
            {title && (
              <h3 className="text-[15px] sm:text-[16px] font-semibold text-brand-text tracking-[-0.01em] leading-snug">
                {title}
              </h3>
            )}
            {description && (
              <p
                className={`${title ? "mt-1" : ""} text-[13px] font-normal text-brand-muted leading-snug line-clamp-2`}
              >
                {description}
              </p>
            )}
          </div>
        </div>
      )}
      <div className="space-y-3">{children}</div>
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
  const errorId = error ? `field-err-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined;
  return (
    <div
      className={`flex flex-col gap-1 min-w-0${error ? " field-has-error" : ""}`}
      data-field-error={error ? "true" : undefined}
    >
      <label className="text-[13px] font-semibold text-brand-text">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div
        className="min-w-0"
        {...(error
          ? {
              "aria-invalid": true as const,
              "aria-describedby": errorId,
            }
          : {})}
      >
        {children}
      </div>
      {hint && !error && <p className="text-[11.5px] font-normal text-[#66727F]">{hint}</p>}
      {error && (
        <p id={errorId} className="text-[11.5px] font-normal text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = "ui-input disabled:bg-brand-bg";

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
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#66727F] pointer-events-none select-none">
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
    <div className="rounded-[10px] border border-brand-border bg-brand-primary-soft/80 px-4 py-3 text-[13px] font-normal text-brand-primary-dark leading-snug">
      {children}
    </div>
  );
}

export function WarningAlert({ children }: { children: ReactNode }) {
  return (
    <div className="accent-warning-surface px-3.5 py-2.5 text-[12.5px] font-normal leading-snug">
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
    <div className="ui-empty-state">
      <span className="ui-empty-icon" aria-hidden>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </span>
      <p className="text-[14px] font-semibold text-brand-text">{title}</p>
      <button type="button" onClick={onAction} className="btn-primary mt-4 min-h-[38px] px-5">
        {actionLabel}
      </button>
    </div>
  );
}

export function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-secondary inline-flex items-center gap-1.5 min-h-[36px] px-3.5 text-[12.5px] hover:border-brand-accent/30 accent-focus-ring"
    >
      <span className="accent-icon-wrap h-5 w-5 rounded-[6px] text-[13px] leading-none font-medium">+</span>
      {label}
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
      ? "ui-card p-4 bg-brand-primary-soft/40 border-brand-border"
      : "ui-card p-4";
  return (
    <div className={base}>
      <h4
        className={`text-[11px] font-semibold uppercase tracking-[0.06em] mb-2.5 ${
          variant === "info" ? "text-brand-primary" : "text-brand-muted"
        }`}
      >
        {title}
      </h4>
      <div
        className={`space-y-1 text-[13px] font-normal leading-snug ${
          variant === "info" ? "text-brand-primary-dark" : "text-brand-text"
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
    <div className={`${thin ? "h-1" : "h-1.5"} rounded-full bg-[#EEF2F4] overflow-hidden`}>
      <div className="h-full rounded-full bg-[#243746] transition-all duration-200" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StepHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4 pb-1">
      <h2 className="ui-section-title">{title}</h2>
      {description && <p className="ui-page-subtitle mt-1.5">{description}</p>}
    </div>
  );
}

/** Tablo sarmalayıcı — cetvel ekranları için ortak stil */
export function DataTableWrap({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto rounded-[10px] border border-brand-border shadow-app-xs bg-white ${className}`}>
      {children}
    </div>
  );
}

export const dataTableCls = {
  table: "w-full min-w-[480px] border-collapse text-[13px]",
  th: "bg-brand-bg border-b border-brand-border px-3 py-2.5 text-left text-[11px] font-semibold text-brand-muted uppercase tracking-[0.06em] whitespace-nowrap",
  td: "border-b border-brand-border/70 px-3 py-2.5 text-brand-text align-middle",
  trHover: "hover:bg-brand-primary-soft/50 transition-colors duration-150",
} as const;

/**
 * Sonuç cetveli grid stili — TRAFFIC_INJURY / TRAFFIC_DEATH ortak.
 * Belirgin hücre border’ları, sabit kolon genişliği, üst başlık.
 */
export const resultGridCls = {
  table: "w-full table-fixed border-collapse box-border text-[11px] leading-normal",
  cell: "box-border border border-[#DCE3E8] px-2 py-2 align-middle text-[11px] leading-normal",
  th: "bg-[#F5F7FA] text-center font-medium text-[#66727F] whitespace-normal",
  td: "bg-white font-normal text-[#1F2933] tabular-nums whitespace-nowrap",
  trHover: "hover:bg-[#EEF2F4]/35 transition-colors duration-150",
  phaseTd: "bg-[#E8EEF1] text-center font-semibold text-[#243746]",
  ac: "text-center",
  ar: "text-right",
  al: "text-left",
} as const;

