import type { CalculationDraft, CalculationValidateResponse } from "../types/calculationDraft";
import { CALCULATION_TYPE_LABELS } from "../types/calculationDraft";
import type { TrafficInjuryCalculationResult } from "../types/trafficInjuryResult";
import type {
  CalculationReviewSummaryResponse,
  ReviewFlowPhase,
} from "../types/calculationReviewSummary";
import { TrafficInjuryResultView } from "../results/TrafficInjuryResultView";
import { InputReviewSummary } from "../results/InputReviewSummary";
import { getWizardSteps } from "./configs";
import { FormSection, InfoAlert, WarningAlert } from "./shared/FormPrimitives";

export function ReviewControlStep({
  draft,
  validation,
  validating,
  running,
  runResult,
  runError,
  reporting,
  reportError,
  reviewSummary,
  reviewSummaryLoading,
  reviewSummaryError,
  reviewFlowPhase,
  onValidate,
  onConfirmAndRun,
  onDownloadWordReport,
  onGoToStep,
}: {
  draft: CalculationDraft;
  validation: CalculationValidateResponse | null;
  validating: boolean;
  running: boolean;
  runResult: TrafficInjuryCalculationResult | null;
  runError: string | null;
  reporting: boolean;
  reportError: string | null;
  reviewSummary: CalculationReviewSummaryResponse | null;
  reviewSummaryLoading: boolean;
  reviewSummaryError: string | null;
  reviewFlowPhase: ReviewFlowPhase;
  onValidate: () => void;
  onConfirmAndRun: () => void;
  onDownloadWordReport: () => void;
  onGoToStep: (stepId: string) => void;
}) {
  const steps = getWizardSteps(draft.calculationType);
  const showInputReview = reviewFlowPhase === "inputReview" && reviewSummary != null;
  const showResult = reviewFlowPhase === "result" && runResult != null;
  const canConfirm =
    draft.calculationType === "TRAFFIC_INJURY" &&
    showInputReview &&
    !running &&
    !validating &&
    !reviewSummaryLoading;

  return (
    <div className="space-y-3">
      <FormSection title="Kontrol ve Ödeme">
        <InfoAlert>
          Önce verilerinizi kontrol edin; ardından girdi özetini onaylayarak hesaplamaya geçin.
          Parasal sonuç yalnızca onay sonrası gösterilir.
        </InfoAlert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2.5">
          {steps.map((s) => {
            const done = validation?.completedSections.includes(s.sectionKey);
            const missing = validation?.missingSections.includes(s.sectionKey);
            const hasErr = validation?.errors.some(
              (e) => e.field === s.sectionKey || e.field.startsWith(`${s.sectionKey}`)
            );
            let status = "Bekliyor";
            let cls = "border-[#D9E5E3] bg-[#F4F7F7] text-[#22313F]";
            if (done) {
              status = "Tamam";
              cls = "border-emerald-200 bg-emerald-50/70 text-emerald-800";
            } else if (missing || hasErr) {
              status = "Eksik";
              cls = "border-amber-200 bg-amber-50/60 text-amber-900";
            }
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onGoToStep(s.id)}
                className={`text-left rounded-[10px] border px-3 py-2 min-h-[48px] hover:-translate-y-px transition-transform duration-200 ${cls}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium">{s.title}</span>
                  <span className="text-[11px] font-medium">{status}</span>
                </div>
              </button>
            );
          })}
        </div>

        {validation?.valid && !showInputReview && (
          <div className="mt-2.5 rounded-[10px] border border-emerald-200 bg-emerald-50/70 p-3">
            <p className="text-[13px] font-medium text-emerald-900">Veriler doğrulandı.</p>
          </div>
        )}

        {validation && !validation.valid && (
          <div className="mt-2.5 rounded-[10px] border border-red-200 bg-red-50 p-3 space-y-1">
            <p className="text-[13px] font-medium text-red-900">{validation.message}</p>
            {validation.errors.map((e, i) => (
              <p key={i} className="text-[12.5px] font-normal text-red-800">
                {e.message}
              </p>
            ))}
          </div>
        )}

        {validation && validation.warnings.length > 0 && (
          <div className="mt-2.5">
            <WarningAlert>{validation.warnings.map((w) => w.message).join(" · ")}</WarningAlert>
          </div>
        )}

        {reviewSummaryError && (
          <div className="mt-2.5 rounded-[10px] border border-red-200 bg-red-50 p-3">
            <p className="text-[13px] font-normal text-red-800">{reviewSummaryError}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          <button
            type="button"
            onClick={onValidate}
            disabled={validating || running || reviewSummaryLoading}
            className="btn-primary min-h-[36px] px-4"
          >
            {validating ? "Kontrol…" : "Verileri Kontrol Et"}
          </button>
        </div>

        {reviewSummaryLoading && (
          <p className="text-[12.5px] text-[#6B7280] mt-2">Hesap girdi özeti hazırlanıyor…</p>
        )}

        {runError && (
          <div className="mt-2.5 rounded-[10px] border border-red-200 bg-red-50 p-3">
            <p className="text-[13px] font-normal text-red-800">{runError}</p>
          </div>
        )}

        {draft.calculationType !== "TRAFFIC_INJURY" && (
          <div className="mt-3 rounded-[10px] border border-dashed border-[#D9E5E3] bg-[#F4F7F7] p-3">
            <p className="text-[13px] font-medium text-[#22313F]">Hesap motoru</p>
            <p className="text-[12px] font-normal text-[#6B7280] mt-0.5">
              Bu hesap türü için motor henüz bağlanmadı.
            </p>
          </div>
        )}

        <p className="text-[11.5px] font-normal text-[#6B7280] mt-2">
          {CALCULATION_TYPE_LABELS[draft.calculationType]} · v{draft.schemaVersion}
        </p>
      </FormSection>

      {showInputReview && reviewSummary && (
        <>
          <InputReviewSummary data={reviewSummary} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onGoToStep(steps[0]?.id ?? "parties")}
              className="btn-secondary min-h-[36px] px-4"
            >
              Bilgileri Düzenle
            </button>
            <button
              type="button"
              onClick={onConfirmAndRun}
              disabled={!canConfirm}
              className="btn-primary min-h-[36px] px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {running ? "Hesaplanıyor…" : "Onayla ve Hesaplamaya Geç"}
            </button>
          </div>
        </>
      )}

      {showResult && draft.calculationType === "TRAFFIC_INJURY" && runResult && (
        <TrafficInjuryResultView
          draft={draft}
          result={runResult}
          onDownloadWordReport={onDownloadWordReport}
          reporting={reporting}
          reportError={reportError}
        />
      )}
    </div>
  );
}
