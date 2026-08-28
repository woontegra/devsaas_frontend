import { useId, useState } from "react";
import { BottomSheet } from "./MobileChrome";
import { ProgressBar } from "./FormPrimitives";
import type { ValidationIssue, CalculationValidateResponse } from "../../types/calculationDraft";

export type MobileStepItem = {
  id: string;
  title: string;
  sectionKey: string;
};

export function MobileStepNavigator({
  steps,
  stepId,
  stepIndex,
  totalSteps,
  progressPct,
  validation,
  fieldErrors,
  onStepChange,
}: {
  steps: MobileStepItem[];
  stepId: string;
  stepIndex: number;
  totalSteps: number;
  progressPct: number;
  validation: CalculationValidateResponse | null;
  fieldErrors: ValidationIssue[];
  onStepChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = steps.find((s) => s.id === stepId);
  const controlsId = useId();

  return (
    <div className="lg:hidden mb-3">
      <div className="rounded-[11px] border border-[#D9E5E3] bg-white px-3.5 py-2.5 shadow-[0_1px_3px_rgba(15,95,99,0.04)]">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] font-normal text-[#6B7280] tabular-nums">
              {stepIndex + 1} / {totalSteps}
            </p>
            <p className="text-[13px] font-medium text-[#22313F] truncate mt-0.5">
              {current?.title ?? "—"}
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 inline-flex items-center gap-1 min-h-[36px] px-2.5 rounded-[9px] border border-[#D9E5E3] text-[12.5px] font-medium text-[#22313F] hover:bg-[#EAF4F3]/60"
            aria-expanded={open}
            aria-controls={controlsId}
            onClick={() => setOpen(true)}
          >
            Adımlar
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1">
            <ProgressBar value={progressPct} thin />
          </div>
          <span className="text-[12px] text-slate-500 tabular-nums shrink-0">%{progressPct}</span>
        </div>
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Adımlar">
        <div id={controlsId} className="pb-4">
          {steps.map((s, i) => {
            const active = s.id === stepId;
            const done = validation?.completedSections.includes(s.sectionKey);
            const missing = validation?.missingSections.includes(s.sectionKey);
            const errCount = fieldErrors.filter(
              (e) => e.field === s.sectionKey || e.field.startsWith(String(s.sectionKey))
            ).length;
            let status = "Tamamlanmadı";
            if (done) status = "Tamamlandı";
            else if (missing || errCount) status = errCount ? `${errCount} eksik` : "Eksik";
            else if (validation) status = "Kontrol gerekli";

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onStepChange(s.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 rounded-[10px] px-2.5 py-2.5 mb-0.5 min-h-[48px] text-left transition-colors duration-200 ${
                  active ? "bg-[#EAF4F3] border border-[#0F5F63]/25" : "hover:bg-[#F4F7F7] border border-transparent"
                }`}
              >
                <span
                  className={`h-6 w-6 shrink-0 rounded-full text-[12px] font-medium flex items-center justify-center ${
                    active
                      ? "bg-[#0F5F63] text-white"
                      : done
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-[#EAF4F3] text-[#6B7280]"
                  }`}
                >
                  {done && !active ? "✓" : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] font-medium truncate ${active ? "text-[#0B474A]" : "text-[#22313F]"}`}>
                    {s.title}
                  </p>
                  <p className="text-[12px] font-normal text-[#6B7280] mt-0.5">{status}</p>
                </div>
                {(missing || errCount > 0) && !done && (
                  <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" aria-hidden />
                )}
                {done && !active && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
}
