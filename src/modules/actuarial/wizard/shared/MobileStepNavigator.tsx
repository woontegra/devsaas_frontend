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
      <div className="rounded-[14px] border border-slate-200/80 bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-slate-500 tabular-nums">
              Adım {stepIndex + 1} / {totalSteps}
            </p>
            <p className="text-[14px] font-medium text-slate-800 truncate mt-0.5">
              {current?.title ?? "—"}
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 inline-flex items-center gap-1 min-h-[44px] px-3 rounded-[10px] border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
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
                className={`w-full flex items-center gap-3 rounded-[12px] px-3 py-3 mb-1 min-h-[52px] text-left transition-colors ${
                  active ? "bg-blue-50 border border-blue-100" : "hover:bg-slate-50 border border-transparent"
                }`}
              >
                <span
                  className={`h-7 w-7 shrink-0 rounded-full text-[12px] font-medium flex items-center justify-center ${
                    active
                      ? "bg-blue-800 text-white"
                      : done
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {done && !active ? "✓" : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[14px] font-medium truncate ${active ? "text-blue-900" : "text-slate-800"}`}>
                    {s.title}
                  </p>
                  <p className="text-[12px] font-normal text-slate-500 mt-0.5">{status}</p>
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
