import type { CalculationDraft, CalculationValidateResponse, TrafficDeathDraft } from "../types/calculationDraft";
import { CALCULATION_TYPE_LABELS } from "../types/calculationDraft";
import type { TrafficInjuryCalculationResult } from "../types/trafficInjuryResult";
import type {
  CalculationReviewSummaryResponse,
  ReviewFlowPhase,
} from "../types/calculationReviewSummary";
import { TrafficInjuryResultView } from "../results/TrafficInjuryResultView";
import { TrafficDeathResultView } from "../results/TrafficDeathResultView";
import { InputReviewSummary } from "../results/InputReviewSummary";
import type { TrafficDeathSupportPeriodsResponse } from "../types/trafficDeathSupportPeriods";
import type { TrafficDeathCalculationResult } from "../types/trafficDeathResult";
import { getWizardSteps } from "./configs";
import { FormSection, InfoAlert, WarningAlert } from "./shared/FormPrimitives";
import { trafficDeathReportActionsVisible } from "../results/trafficDeathReviewVisibility";

export function ReviewControlStep({
  draft,
  validation,
  validating,
  running,
  runResult,
  runError,
  reviewSummary,
  reviewSummaryLoading,
  reviewSummaryError,
  reviewFlowPhase,
  trafficDeathSupportResult = null,
  trafficDeathRunResult = null,
  onValidate,
  onConfirmAndRun,
  onGoToStep,
  saveCalculationError = null,
  calculationSaved = false,
  reportError = null,
  onTrafficDeathReport,
  trafficDeathReporting = null,
}: {
  draft: CalculationDraft;
  validation: CalculationValidateResponse | null;
  validating: boolean;
  running: boolean;
  runResult: TrafficInjuryCalculationResult | null;
  runError: string | null;
  reviewSummary: CalculationReviewSummaryResponse | null;
  reviewSummaryLoading: boolean;
  reviewSummaryError: string | null;
  reviewFlowPhase: ReviewFlowPhase;
  trafficDeathSupportResult?: TrafficDeathSupportPeriodsResponse | null;
  trafficDeathRunResult?: TrafficDeathCalculationResult | null;
  onValidate: () => void;
  onConfirmAndRun: () => void;
  onGoToStep: (stepId: string) => void;
  reportError?: string | null;
  savingCalculation?: boolean;
  saveCalculationError?: string | null;
  calculationSaved?: boolean;
  onTrafficDeathReport?: (format: "docx" | "pdf") => void;
  trafficDeathReporting?: "docx" | "pdf" | null;
}) {
  const steps = getWizardSteps(draft.calculationType);
  const showInputReview = reviewFlowPhase === "inputReview" && reviewSummary != null;
  const showInjuryResult =
    reviewFlowPhase === "result" && draft.calculationType === "TRAFFIC_INJURY" && runResult != null;
  const showDeathResult = reviewFlowPhase === "result" && draft.calculationType === "TRAFFIC_DEATH";
  const canConfirm =
    (draft.calculationType === "TRAFFIC_INJURY" || draft.calculationType === "TRAFFIC_DEATH") &&
    showInputReview &&
    !running &&
    !validating &&
    !reviewSummaryLoading;

  return (
    <div className="space-y-3">
      <FormSection title={draft.calculationType === "TRAFFIC_INJURY" ? undefined : "Kontrol ve Ödeme"}>
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
            let cls = "border-[#DCE3E8] bg-[#F5F7FA] text-[#1F2933]";
            if (done) {
              status = "Tamam";
              cls = "border-emerald-200 bg-emerald-50/70 text-emerald-800";
            } else if (missing || hasErr) {
              status = "Eksik";
              cls = "border-brand-accent/25 bg-brand-accent-soft/80 text-[#8B4A12]";
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
          <p className="text-[12.5px] text-[#66727F] mt-2">Hesap girdi özeti hazırlanıyor…</p>
        )}

        {runError && (
          <div className="mt-2.5 rounded-[10px] border border-red-200 bg-red-50 p-3">
            <p className="text-[13px] font-normal text-red-800">{runError}</p>
          </div>
        )}

        {draft.calculationType !== "TRAFFIC_INJURY" && draft.calculationType !== "TRAFFIC_DEATH" && (
          <div className="mt-3 rounded-[10px] border border-dashed border-[#DCE3E8] bg-[#F5F7FA] p-3">
            <p className="text-[13px] font-medium text-[#1F2933]">Hesap motoru</p>
            <p className="text-[12px] font-normal text-[#66727F] mt-0.5">
              Bu hesap türü için motor henüz bağlanmadı.
            </p>
          </div>
        )}

        <p className="text-[11.5px] font-normal text-[#66727F] mt-2">
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

      {trafficDeathReportActionsVisible({
        reviewFlowPhase,
        calculationType: draft.calculationType,
        runResult: trafficDeathRunResult,
        hasReportHandler: Boolean(onTrafficDeathReport),
      }) && (
        <div className="rounded-[10px] border border-[#DCE3E8] bg-white px-3 py-2.5 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-medium text-[#1F2933] mr-auto">Bilirkişi hesap raporu</span>
            <button
              type="button"
              onClick={() => onTrafficDeathReport?.("docx")}
              disabled={trafficDeathReporting != null}
              className="btn-secondary min-h-[36px] px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {trafficDeathReporting === "docx" ? "Hazırlanıyor…" : "Word İndir"}
            </button>
            <button
              type="button"
              onClick={() => onTrafficDeathReport?.("pdf")}
              disabled={trafficDeathReporting != null}
              className="btn-primary min-h-[36px] px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {trafficDeathReporting === "pdf" ? "Hazırlanıyor…" : "PDF İndir"}
            </button>
          </div>
          {reportError && (
            <p className="text-[13px] text-red-800">{reportError}</p>
          )}
        </div>
      )}

      {showDeathResult && draft.calculationType === "TRAFFIC_DEATH" && (
        <TrafficDeathResultView
          draft={draft as TrafficDeathDraft}
          supportResult={trafficDeathSupportResult}
          monetaryResult={trafficDeathRunResult}
        />
      )}

      {showInjuryResult && draft.calculationType === "TRAFFIC_INJURY" && runResult && (
        <>
          {(saveCalculationError || calculationSaved || reportError) && (
            <div className="space-y-2">
              {saveCalculationError && (
                <div className="rounded-[10px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-800">
                  {saveCalculationError}
                </div>
              )}
              {calculationSaved && !saveCalculationError && (
                <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[13px] text-emerald-800">
                  Hesap kalıcı olarak kaydedildi. Son Çalışmalar bölümünden açabilirsiniz.
                </div>
              )}
              {reportError && (
                <div className="rounded-[10px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-800">
                  {reportError}
                </div>
              )}
            </div>
          )}
          <TrafficInjuryResultView draft={draft} result={runResult} />
        </>
      )}
    </div>
  );
}
