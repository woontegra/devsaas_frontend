import type { ReactNode } from "react";

export function SegmentedChoice<T extends string>({
  value,
  options,
  onChange,
  allowDeselect = true,
  columns = 2,
}: {
  value: T | null;
  options: { id: T; label: string }[];
  onChange: (next: T | null) => void;
  allowDeselect?: boolean;
  columns?: 2 | 3;
}) {
  const gridClass =
    columns === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2";

  return (
    <div className={`grid ${gridClass} gap-2`}>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(active && allowDeselect ? null : opt.id)}
            className={`flex items-center gap-2.5 rounded-[10px] border px-3.5 py-3 text-left transition-all min-h-[48px] ${
              active
                ? "border-[#243746] bg-[#EEF2F4]/90 ring-1 ring-[#243746]/15"
                : "border-[#DCE3E8] bg-white hover:border-slate-300"
            }`}
          >
            <span
              className={`shrink-0 h-[18px] w-[18px] rounded-[4px] border-2 flex items-center justify-center ${
                active ? "border-[#243746] bg-[#243746]" : "border-slate-300 bg-white"
              }`}
            >
              {active && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path
                    d="M2.5 6.2 5 8.7 9.5 3.8"
                    stroke="white"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span
              className={`text-[14px] font-medium ${active ? "text-[#1F2933]" : "text-slate-600"}`}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function FieldBlock({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-[13px] font-medium text-[#1F2933] mb-2">{label}</p>
      {children}
      {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
    </div>
  );
}

export function SectionDivider() {
  return <div className="my-5 border-t border-[#DCE3E8]" aria-hidden />;
}

export const CHILD_EDUCATION_OPTIONS = [
  { value: "preschool", label: "Okul öncesi" },
  { value: "primary", label: "İlkokul" },
  { value: "middle", label: "Ortaokul" },
  { value: "high", label: "Lise" },
  { value: "university", label: "Üniversite" },
  { value: "postgraduate", label: "Lisansüstü" },
  { value: "graduate", label: "Mezun" },
  { value: "not_in_education", label: "Öğrenim görmüyor" },
  { value: "other", label: "Diğer (özel bakıma muhtaç)" },
] as const;
