import type { CalculationDraft, CalculationValidateResponse } from "../types/calculationDraft";
import { CALCULATION_TYPE_LABELS } from "../types/calculationDraft";
import { getWizardSteps } from "./configs";
import { FormSection, InfoAlert, WarningAlert } from "./shared/FormPrimitives";

export function ReviewControlStep({
  draft,
  validation,
  validating,
  onValidate,
  onGoToStep,
}: {
  draft: CalculationDraft;
  validation: CalculationValidateResponse | null;
  validating: boolean;
  onValidate: () => void;
  onGoToStep: (stepId: string) => void;
}) {
  const steps = getWizardSteps(draft.calculationType);

  return (
    <div className="space-y-4">
      <FormSection
        title="Kontrol ve ödeme"
        description="Girilen verilerin özeti. Parasal sonuç, formül veya rapor ön izlemesi yoktur."
      >
        <InfoAlert>
          Verileriniz sunucuda doğrulanır. Aktüeryal hesap ancak ödeme veya kredi hakkı doğrulandıktan
          sonra çalıştırılacaktır.
        </InfoAlert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-3">
          {steps.map((s) => {
            const done = validation?.completedSections.includes(s.sectionKey);
            const missing = validation?.missingSections.includes(s.sectionKey);
            const hasErr = validation?.errors.some(
              (e) => e.field === s.sectionKey || e.field.startsWith(`${s.sectionKey}`)
            );
            let status = "Bekliyor";
            let cls = "border-slate-200 bg-slate-50 text-slate-600";
            if (done) {
              status = "Tamamlandı";
              cls = "border-emerald-100 bg-emerald-50/80 text-emerald-800";
            } else if (missing || hasErr) {
              status = "Eksik";
              cls = "border-amber-100 bg-amber-50/70 text-amber-900";
            }
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onGoToStep(s.id)}
                className={`text-left rounded-[12px] border px-3.5 py-2.5 min-h-[52px] ${cls}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium">{s.title}</span>
                  <span className="text-[11px] font-medium">{status}</span>
                </div>
                <p className="text-[12px] font-normal mt-0.5 opacity-80">{s.description}</p>
              </button>
            );
          })}
        </div>

        {validation?.valid && (
          <div className="mt-3 rounded-[12px] border border-emerald-100 bg-emerald-50/80 p-3.5">
            <p className="text-[13px] font-medium text-emerald-900">Verileriniz hesaplama için hazır.</p>
            <ul className="mt-1.5 space-y-0.5">
              {validation.completedSections.map((s) => (
                <li key={s} className="text-[13px] font-normal text-emerald-800">
                  {s} tamamlandı
                </li>
              ))}
            </ul>
          </div>
        )}

        {validation && !validation.valid && (
          <div className="mt-3 rounded-[12px] border border-red-100 bg-red-50 p-3.5 space-y-1">
            <p className="text-[13px] font-medium text-red-900">{validation.message}</p>
            {validation.errors.map((e, i) => (
              <p key={i} className="text-[13px] font-normal text-red-800">
                {e.message}
              </p>
            ))}
          </div>
        )}

        {validation && validation.warnings.length > 0 && (
          <div className="mt-3">
            <WarningAlert>{validation.warnings.map((w) => w.message).join(" · ")}</WarningAlert>
          </div>
        )}

        <button
          type="button"
          onClick={onValidate}
          disabled={validating}
          className="btn-primary mt-4 min-h-[44px] px-5"
        >
          {validating ? "Kontrol ediliyor…" : "Verileri Kontrol Et"}
        </button>

        <div className="mt-4 rounded-[12px] border border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="text-[13px] font-medium text-slate-800">Ödeme Yap ve Hesapla</p>
          <p className="text-[13px] font-normal text-slate-500 mt-1">
            Ödeme sistemi sonraki aşamada bağlanacaktır.
          </p>
          <button
            type="button"
            disabled
            className="mt-3 min-h-[42px] px-4 rounded-[10px] bg-slate-200 text-slate-500 text-[13px] font-medium cursor-not-allowed"
          >
            Ödeme Yap ve Hesapla
          </button>
        </div>

        <p className="text-[12px] font-normal text-slate-400 mt-3">
          {CALCULATION_TYPE_LABELS[draft.calculationType]} · schemaVersion {draft.schemaVersion}
        </p>
      </FormSection>
    </div>
  );
}
