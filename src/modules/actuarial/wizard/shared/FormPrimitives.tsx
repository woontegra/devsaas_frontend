import type { ReactNode } from "react";

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
    <section className="w-full rounded-[14px] border border-slate-200/90 bg-white p-4 sm:p-6 lg:p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="mb-4 sm:mb-5 pb-3 border-b border-slate-100">
        <h3 className="text-[16px] font-semibold text-slate-800 tracking-tight leading-snug">{title}</h3>
        {description && (
          <p className="mt-1.5 text-[13px] font-normal text-slate-500 leading-relaxed line-clamp-3 sm:line-clamp-none">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-3.5 sm:space-y-4">{children}</div>
    </section>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3.5 sm:gap-y-4">{children}</div>;
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
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className="text-[13px] font-medium text-slate-600">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[12px] font-normal text-slate-400">{hint}</p>}
      {error && <p className="text-[12px] font-normal text-red-600">{error}</p>}
    </div>
  );
}

const inputCls =
  "w-full min-h-[46px] rounded-[9px] border border-slate-200 bg-white px-3.5 text-[14px] font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800/15 focus:border-blue-800/60 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputCls} {...props} />;
}

export function TextSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={inputCls} {...props} />;
}

export function TextTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputCls} min-h-[96px] sm:min-h-[110px] py-3`} {...props} />;
}

export function InfoAlert({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[12px] border border-blue-100 bg-blue-50/80 px-3.5 py-3 text-[13px] font-normal text-blue-950 leading-relaxed">
      {children}
    </div>
  );
}

export function WarningAlert({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[12px] border border-amber-200 bg-amber-50/80 px-3.5 py-3 text-[13px] font-normal text-amber-950 leading-relaxed">
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
    <div className="rounded-[14px] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
      <p className="text-[14px] font-normal text-slate-600 mb-3">{title}</p>
      <button
        type="button"
        onClick={onAction}
        className="btn-primary inline-flex items-center justify-center min-h-[44px] px-4"
      >
        {actionLabel}
      </button>
    </div>
  );
}

export function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="btn-secondary inline-flex items-center min-h-[44px] px-4">
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
      ? "rounded-[14px] border border-blue-100 bg-blue-50/70 p-4"
      : "rounded-[14px] border border-slate-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]";
  return (
    <div className={base}>
      <h4
        className={`text-[11px] font-medium uppercase tracking-[0.05em] mb-2.5 ${
          variant === "info" ? "text-blue-800" : "text-slate-500"
        }`}
      >
        {title}
      </h4>
      <div
        className={`space-y-2 text-[13px] font-normal leading-relaxed ${
          variant === "info" ? "text-blue-950" : "text-slate-600"
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
    <div className={`${thin ? "h-1" : "h-1.5"} rounded-full bg-slate-100 overflow-hidden`}>
      <div className="h-full rounded-full bg-blue-800/80 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StepHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-[19px] sm:text-[20px] font-semibold text-slate-800 tracking-tight">{title}</h2>
      {description && (
        <p className="mt-1.5 text-[13px] font-normal text-slate-500 leading-relaxed">{description}</p>
      )}
    </div>
  );
}
