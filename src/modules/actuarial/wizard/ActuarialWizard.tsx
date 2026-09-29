import { useState } from "react";
import { getWizardSteps } from "./configs";
import { ReviewControlStep } from "./ReviewControlStep";
import { ProgressBar, SummaryCard } from "./shared/FormPrimitives";
import { DropdownMenu, MenuItem } from "./shared/MobileChrome";
import { MobileStepNavigator } from "./shared/MobileStepNavigator";
import type { DraftSaveStatus } from "../draftStorage";
import type {
  CalculationDraft,
  CalculationValidateResponse,
  ValidationIssue,
} from "../types/calculationDraft";
import { CALCULATION_TYPE_LABELS } from "../types/calculationDraft";
import { countBeneficiariesByClaimantStatus } from "../utils/beneficiaryClaimantStatus";
import type { TrafficInjuryCalculationResult } from "../types/trafficInjuryResult";
import type {
  CalculationReviewSummaryResponse,
  ReviewFlowPhase,
} from "../types/calculationReviewSummary";

export interface ActuarialWizardProps {
  draft: CalculationDraft;
  onDraftChange: (d: CalculationDraft) => void;
  stepId: string;
  onStepChange: (id: string) => void;
  validation: CalculationValidateResponse | null;
  fieldErrors: ValidationIssue[];
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
  onSaveCalculation?: () => void;
  canSaveCalculation?: boolean;
  savingCalculation?: boolean;
  saveCalculationError?: string | null;
  calculationSaved?: boolean;
  onSaveFile?: () => void;
  savingFile?: boolean;
  saveFileError?: string | null;
  fileSaved?: boolean;
  currentSavedCalculationId?: string | null;
  savedDisplayName?: string | null;
  onSaveDraft: () => void;
  onClearDraft: () => void;
  draftSaveStatus: DraftSaveStatus;
  lastSavedAt: string | null;
  onChangeTypeRequest: () => void;
  onNewFile: () => void;
  onOpenSavedFiles?: () => void;
  onBeforeStepAdvance?: (fromStepId: string, toStepId: string) => Promise<boolean>;
  validationFieldHighlight?: boolean;
  trafficDeathSupportResult?: import("../types/trafficDeathSupportPeriods").TrafficDeathSupportPeriodsResponse | null;
  trafficDeathRunResult?: import("../types/trafficDeathResult").TrafficDeathCalculationResult | null;
  onTrafficDeathSupportResult?: (
    result: import("../types/trafficDeathSupportPeriods").TrafficDeathSupportPeriodsResponse
  ) => void;
  onTrafficDeathReport?: (format: "docx" | "pdf") => void;
  trafficDeathReporting?: "docx" | "pdf" | null;
}

function FileSummaryLines({ draft }: { draft: CalculationDraft }) {
  if (draft.calculationType === "TRAFFIC_DEATH") {
    return (
      <>
        <p>Müteveffa: {draft.deceased.fullName || "—"}</p>
        <p>Olay: {draft.common.eventDate || "—"}</p>
        <p>Hesap: {draft.common.calculationDate || "—"}</p>
      </>
    );
  }
  return (
    <>
      <p>Dosya: {draft.common.internalFileName || "—"}</p>
      <p>Olay: {draft.common.eventDate || "—"}</p>
      <p>Hesap: {draft.common.calculationDate || "—"}</p>
    </>
  );
}

function TypeSummary({ draft }: { draft: CalculationDraft }) {
  if (draft.calculationType === "TRAFFIC_INJURY") {
    const p = draft.parties.plaintiff;
    const name = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
    const defs = draft.parties.defendants;
    const drivers = defs.filter((d) => d.type === "INDIVIDUAL_DRIVER").length;
    const owners = defs.filter(
      (d) => d.type === "INDIVIDUAL_VEHICLE_OWNER" || d.type === "CORPORATE_VEHICLE_OWNER"
    ).length;
    const insurers = defs.filter(
      (d) => d.type === "COMPULSORY_TRAFFIC_INSURER" || d.type === "CASCO_INSURER"
    ).length;
    return (
      <>
        <p>Davacı: {name || "—"}</p>
        <p>Davalı: {defs.length}</p>
        <p>Şoför: {drivers} · Araç sahibi: {owners}</p>
        <p>Sigorta şirketi: {insurers}</p>
        <p>Kaza tarihi: {draft.common.eventDate || "—"}</p>
        <p>Maluliyet %: {draft.disability.permanentDisabilityRate ?? "—"}</p>
        <p>Geçici İG dönemi: {draft.temporaryIncapacityPeriods.length}</p>
      </>
    );
  }
  if (draft.calculationType === "TRAFFIC_DEATH") {
    const counts = countBeneficiariesByClaimantStatus(draft.beneficiaries);
    return (
      <>
        <p>Müteveffa: {draft.deceased.fullName || "—"}</p>
        <p>Davacılar: {counts.plaintiff}</p>
        <p>Dava dışı: {counts.outOfCase}</p>
        <p>Gelir dönemi: {draft.incomePeriods.length}</p>
        <p>Önceki ödeme: {draft.priorPayments.length}</p>
      </>
    );
  }
  if (draft.calculationType === "WORK_INJURY") {
    return (
      <>
        <p>İşçi: {draft.employee.fullName || "—"}</p>
        <p>İşveren: {draft.employment.employerName || "—"}</p>
        <p>Gelir dönemi: {draft.incomePeriods.length}</p>
        <p>Maluliyet %: {draft.disability.permanentDisabilityRate ?? "—"}</p>
        <p>SGK kaydı: {draft.sgkIncome.length}</p>
        <p>PSD belge: {draft.capitalValueDocuments.length}</p>
      </>
    );
  }
  return (
    <>
      <p>Müteveffa işçi: {draft.deceasedEmployee.fullName || "—"}</p>
      <p>İşveren: {draft.employment.employerName || "—"}</p>
      <p>Hak sahibi: {draft.beneficiaries.length}</p>
      <p>SGK ölüm geliri: {draft.sgkDeathIncomes.length}</p>
      <p>PSD belge: {draft.capitalValueDocuments.length}</p>
    </>
  );
}

function draftStatusLabel(status: DraftSaveStatus, lastSavedAt: string | null): string {
  if (status === "saving") return "Kaydediliyor…";
  if (status === "error") return "Kaydetme hatası";
  if (status === "saved") {
    return lastSavedAt
      ? `Taslak kaydedildi · ${lastSavedAt} (bu cihaz oturumunda)`
      : "Taslak kaydedildi (bu cihaz oturumunda)";
  }
  return lastSavedAt ? `Son kayıt: ${lastSavedAt}` : "Henüz kaydedilmedi";
}

export function ActuarialWizard({
  draft,
  onDraftChange,
  stepId,
  onStepChange,
  validation,
  fieldErrors,
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
  onSaveCalculation,
  canSaveCalculation = false,
  savingCalculation = false,
  saveCalculationError = null,
  calculationSaved = false,
  onSaveFile,
  savingFile = false,
  saveFileError = null,
  fileSaved: _fileSaved = false,
  currentSavedCalculationId = null,
  savedDisplayName = null,
  onSaveDraft,
  onClearDraft,
  draftSaveStatus,
  lastSavedAt,
  onChangeTypeRequest,
  onNewFile,
  onOpenSavedFiles,
  onBeforeStepAdvance,
  validationFieldHighlight = false,
  trafficDeathSupportResult = null,
  trafficDeathRunResult = null,
  onTrafficDeathSupportResult,
  onTrafficDeathReport,
  trafficDeathReporting = null,
}: ActuarialWizardProps) {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const steps = getWizardSteps(draft.calculationType);
  const reviewId = "review";
  const navSteps = [
    ...steps,
    {
      id: reviewId,
      title: "Kontrol ve Ödeme",
      shortTitle: "Kontrol",
      description: "Doğrulama",
      sectionKey: "review",
    },
  ];
  const allIds = navSteps.map((s) => s.id);
  const stepIndex = Math.max(0, allIds.indexOf(stepId));
  const isReview = stepId === reviewId;
  const current = steps.find((s) => s.id === stepId);
  const progressPct = Math.round(((stepIndex + 1) / allIds.length) * 100);
  const errTotal = validation?.errors.length ?? fieldErrors.length;
  const warnTotal = validation?.warnings.length ?? 0;
  const missingTotal = validation?.missingSections.length ?? 0;
  const activeTitle = isReview ? "Kontrol ve Ödeme" : current?.title ?? "—";
  const hideStepPageTitle =
    draft.calculationType === "TRAFFIC_DEATH" || draft.calculationType === "TRAFFIC_INJURY";
  const showResultPhase =
    isReview && reviewFlowPhase === "result" && runResult != null && draft.calculationType === "TRAFFIC_INJURY";
  const showSaveCalculation = showResultPhase && canSaveCalculation && !!onSaveCalculation;
  const showSaveFileButton =
    (draft.calculationType === "TRAFFIC_DEATH" || draft.calculationType === "TRAFFIC_INJURY") &&
    canSaveCalculation &&
    !!onSaveFile;
  const permanentSaveLabel = currentSavedCalculationId
    ? "Değişiklikleri Kaydet"
    : "Dosyayı Kaydet";
  const activeSavedFileLabel =
    currentSavedCalculationId && savedDisplayName
      ? `Kayıtlı dosya: ${savedDisplayName}`
      : null;

  const goPrev = () => {
    if (stepIndex > 0) onStepChange(allIds[stepIndex - 1]!);
  };
  const goNext = async () => {
    if (stepIndex >= allIds.length - 1) return;
    const nextId = allIds[stepIndex + 1]!;
    if (onBeforeStepAdvance) {
      const allowed = await onBeforeStepAdvance(stepId, nextId);
      if (!allowed) return;
    }
    onStepChange(nextId);
  };

  const StepComponent = current?.Component;

  return (
    <div className="pb-[88px] lg:pb-[80px]">
      {/* ─── Header ───────────────────────────────────────────────── */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[20px] sm:text-[22px] font-semibold text-[#1F2933] tracking-[-0.02em] leading-snug line-clamp-2">
            {CALCULATION_TYPE_LABELS[draft.calculationType]}
          </h1>
          <p className="mt-1 text-[12px] font-normal text-[#66727F]">
            {draftStatusLabel(draftSaveStatus, lastSavedAt)}
          </p>
          {activeSavedFileLabel && (
            <p className="mt-1 text-[12px] font-medium text-[#243746]">{activeSavedFileLabel}</p>
          )}
        </div>

        {/* Mobile: ⋮ menu */}
        <div className="lg:hidden shrink-0">
          <DropdownMenu
            trigger={({ buttonProps, buttonRef }) => (
              <button
                {...buttonProps}
                ref={buttonRef}
                type="button"
                className="min-h-[40px] min-w-[40px] rounded-[10px] border border-[#DCE3E8] bg-white text-[#66727F] flex items-center justify-center hover:bg-[#EEF2F4]/50"
                aria-label="İşlemler"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <circle cx="12" cy="5" r="1.75" />
                  <circle cx="12" cy="12" r="1.75" />
                  <circle cx="12" cy="19" r="1.75" />
                </svg>
              </button>
            )}
          >
            {(close) => (
              <>
                <MenuItem onClick={() => { close(); onNewFile(); }}>Yeni dosya</MenuItem>
                {onOpenSavedFiles && (
                  <MenuItem onClick={() => { close(); onOpenSavedFiles(); }}>Kayıtlı Dosyalar</MenuItem>
                )}
                <MenuItem onClick={() => { close(); onChangeTypeRequest(); }}>Hesap türünü değiştir</MenuItem>
                <MenuItem onClick={() => { close(); onSaveDraft(); }}>Taslağı kaydet</MenuItem>
                <MenuItem danger onClick={() => { close(); onClearDraft(); }}>Taslağı temizle</MenuItem>
              </>
            )}
          </DropdownMenu>
        </div>

        {/* Desktop toolbar */}
        <div className="hidden lg:flex flex-wrap gap-2 shrink-0">
          <button type="button" onClick={onNewFile} className="btn-secondary min-h-[40px] px-4">
            Yeni dosya
          </button>
          {onOpenSavedFiles && (
            <button type="button" onClick={onOpenSavedFiles} className="btn-secondary min-h-[40px] px-4">
              Kayıtlı Dosyalar
            </button>
          )}
          <button type="button" onClick={onChangeTypeRequest} className="btn-secondary min-h-[40px] px-4">
            Hesap türünü değiştir
          </button>
          <button type="button" onClick={onClearDraft} className="btn-danger min-h-[40px] px-4">
            Taslağı temizle
          </button>
        </div>
      </div>

      {/* ─── Mobile step navigator ──────────────────────────────── */}
      <MobileStepNavigator
        steps={navSteps.map((s) => ({ id: s.id, title: s.title, sectionKey: s.sectionKey }))}
        stepId={stepId}
        stepIndex={stepIndex}
        totalSteps={allIds.length}
        progressPct={progressPct}
        validation={validation}
        fieldErrors={fieldErrors}
        onStepChange={onStepChange}
      />

      {/* ─── Mobile compact summary ─────────────────────────────── */}
      <div className="lg:hidden mb-3 rounded-[11px] border border-[#DCE3E8] bg-white px-3.5 py-2.5 shadow-[0_1px_3px_rgba(36,55,70,0.04)]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 text-[12.5px] font-normal text-[#1F2933] space-y-0.5">
            <p className="truncate">{activeTitle}</p>
            <p className="text-[12px] text-[#66727F]">
              Eksik {missingTotal || "—"} · Uyarı {warnTotal} · Hata {errTotal}
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 text-[12.5px] font-medium text-[#243746] min-h-[36px] px-2"
            aria-expanded={summaryOpen}
            onClick={() => setSummaryOpen((v) => !v)}
          >
            {summaryOpen ? "Gizle" : "Detayları göster"}
          </button>
        </div>
        {summaryOpen && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
            <SummaryCard title="Dosya özeti">
              <FileSummaryLines draft={draft} />
            </SummaryCard>
            <SummaryCard title="Türe özel özet">
              <TypeSummary draft={draft} />
            </SummaryCard>
            <SummaryCard title="Güvenlik" variant="info">
              <p>Parasal sonuç bu panelde gösterilmez.</p>
            </SummaryCard>
          </div>
        )}
      </div>

      {/* ─── 3-kolon grid ───────────────────────────────────────── */}
      <div className="wizard-desktop-grid">
        {/* Left steps — desktop only */}
        <nav className="hidden lg:block lg:sticky lg:top-[4rem] self-start rounded-[11px] border border-[#DCE3E8] bg-white p-2 shadow-[0_1px_4px_rgba(36,55,70,0.05)] max-h-[calc(100vh-6rem)] overflow-y-auto">
          {navSteps.map((s, i) => {
            const active = s.id === stepId;
            const done = validation?.completedSections.includes(s.sectionKey);
            const missing = validation?.missingSections.includes(s.sectionKey);
            const errCount = fieldErrors.filter(
              (e) => e.field === s.sectionKey || e.field.startsWith(String(s.sectionKey))
            ).length;
            let status = "Bekliyor";
            if (done) status = "Tamam";
            else if (missing || errCount) status = errCount ? `${errCount} eksik` : "Eksik";

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onStepChange(s.id)}
                className={`w-full text-left rounded-[9px] px-2.5 py-2 mb-0.5 border transition-colors duration-200 min-h-[44px] ${
                  active
                    ? "bg-[#243746] text-white border-[#243746]"
                    : "bg-white border-transparent hover:bg-[#EEF2F4]/60 text-[#1F2933]"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 h-5 w-5 shrink-0 rounded-full text-[11px] font-semibold flex items-center justify-center ${
                      active
                        ? "bg-white/20 text-white"
                        : done
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : missing || errCount
                            ? "accent-step-num"
                            : "bg-[#EEF2F4] text-[#66727F]"
                    }`}
                  >
                    {done && !active ? "✓" : i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-[13px] font-medium leading-snug ${active ? "text-white" : ""}`}>
                      {s.title}
                    </p>
                    <p
                      className={`text-[11.5px] font-normal mt-0.5 leading-snug ${
                        active ? "text-white/80" : done ? "text-emerald-600" : "text-[#66727F]"
                      }`}
                    >
                      {status}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Center form */}
        <main className="min-w-0 space-y-4">
          {!isReview && current && !hideStepPageTitle && (
            <div className="mb-1 hidden lg:block">
              <h2 className="text-[16px] font-medium text-[#1F2933] tracking-[-0.01em]">{current.title}</h2>
            </div>
          )}
          {isReview ? (
            <ReviewControlStep
              draft={draft}
              validation={validation}
              validating={validating}
              running={running}
              runResult={runResult}
              runError={runError}
              reportError={reportError}
              reviewSummary={reviewSummary}
              reviewSummaryLoading={reviewSummaryLoading}
              reviewSummaryError={reviewSummaryError}
              reviewFlowPhase={reviewFlowPhase}
              onValidate={onValidate}
              onConfirmAndRun={onConfirmAndRun}
              trafficDeathSupportResult={trafficDeathSupportResult}
              trafficDeathRunResult={trafficDeathRunResult}
              onTrafficDeathReport={onTrafficDeathReport}
              trafficDeathReporting={trafficDeathReporting}
              saveCalculationError={saveCalculationError}
              calculationSaved={calculationSaved}
              onGoToStep={onStepChange}
            />
          ) : StepComponent ? (
            <StepComponent
              draft={draft}
              onChange={onDraftChange}
              fieldErrors={fieldErrors.map((e) => ({ field: e.field, message: e.message, code: e.code }))}
              validationFieldHighlight={validationFieldHighlight}
              trafficDeathSupportResult={trafficDeathSupportResult}
              onTrafficDeathSupportResult={onTrafficDeathSupportResult}
            />
          ) : null}

          {fieldErrors.length > 0 && !isReview && (
            <div className="rounded-[12px] border border-red-200 bg-red-50 p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-red-700 mb-2">Hatalar</p>
              {fieldErrors.slice(0, 8).map((e, i) => (
                <p key={i} className="text-[14px] font-normal text-red-800 leading-relaxed">
                  {e.message}
                </p>
              ))}
            </div>
          )}
          {saveFileError &&
            (draft.calculationType === "TRAFFIC_DEATH" ||
              draft.calculationType === "TRAFFIC_INJURY") && (
            <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 text-[13px] text-red-800">
              {saveFileError}
            </div>
          )}
        </main>

        {/* Right summary */}
        <aside className="wizard-summary-aside lg:sticky lg:top-[4rem] self-start">
          <SummaryCard title="Dosya özeti">
            <p>Tür: {CALCULATION_TYPE_LABELS[draft.calculationType]}</p>
            <FileSummaryLines draft={draft} />
          </SummaryCard>
          <SummaryCard title="İlerleme">
            <p className="font-medium text-slate-800">
              {stepIndex + 1} / {allIds.length} adım
            </p>
            <p className="text-slate-500">%{progressPct} tamamlandı</p>
            <ProgressBar value={progressPct} />
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="accent-badge">
                Eksik: {missingTotal || "—"}
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                Uyarı: {warnTotal}
              </span>
              <span className="inline-flex items-center rounded-full bg-red-50 border border-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                Hata: {errTotal}
              </span>
            </div>
          </SummaryCard>
          <SummaryCard title="Türe özel özet">
            <TypeSummary draft={draft} />
          </SummaryCard>
          <SummaryCard title="Güvenlik" variant="info">
            <p>Parasal sonuç bu panelde gösterilmez.</p>
          </SummaryCard>
        </aside>
      </div>

      {/* ─── Mobile action bar ──────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#DCE3E8] bg-white lg:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="px-4 pt-2.5 pb-2.5">
          <div className="flex items-center justify-between gap-2 mb-2 text-[13px] font-normal text-slate-500 tabular-nums">
            <span>{stepIndex + 1} / {allIds.length}</span>
            <span>%{progressPct}</span>
          </div>
          <ProgressBar value={progressPct} thin />
          <div className="mt-2.5 flex items-center gap-2">
            {showSaveFileButton && (
              <button
                type="button"
                onClick={onSaveFile}
                disabled={savingFile}
                className="btn-secondary min-h-[44px] px-3 shrink-0 text-[13px]"
              >
                {savingFile ? "Kaydediliyor…" : permanentSaveLabel}
              </button>
            )}
            <button
              type="button"
              onClick={goPrev}
              disabled={stepIndex === 0}
              className="btn-secondary min-h-[44px] px-4 shrink-0"
            >
              {showResultPhase ? "Önceki" : "Geri"}
            </button>
            {showResultPhase ? (
              <>
                {showSaveCalculation && (
                  <button
                    type="button"
                    onClick={onSaveCalculation}
                    disabled={savingCalculation || calculationSaved}
                    className="btn-primary min-h-[44px] px-4 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {calculationSaved ? "Kaydedildi" : savingCalculation ? "Kaydediliyor…" : "Hesaplamayı Kaydet"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onDownloadWordReport}
                  disabled={reporting}
                  className={`min-h-[44px] px-4 disabled:opacity-50 disabled:cursor-not-allowed ${
                    showSaveCalculation ? "btn-secondary flex-1" : "btn-primary flex-1"
                  }`}
                >
                  {reporting ? "Rapor…" : "Word Raporu Oluştur"}
                </button>
              </>
            ) : !isReview ? (
              <button
                type="button"
                onClick={goNext}
                className="btn-primary min-h-[44px] px-4 flex-1"
              >
                Sonraki
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { onStepChange(reviewId); onValidate(); }}
                disabled={validating || running || reviewSummaryLoading}
                className="btn-primary min-h-[44px] px-4 flex-1"
              >
                {validating ? "Kontrol…" : "Kontrol"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Desktop action bar ─────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#DCE3E8] bg-white hidden lg:block shadow-[0_-2px_10px_rgba(36,55,70,0.05)]">
        <div className="app-workspace wizard-action-bar-inner flex items-center gap-4 py-3">
          <div className="flex flex-wrap gap-2 shrink-0">
            {showSaveFileButton && (
              <button
                type="button"
                onClick={onSaveFile}
                disabled={savingFile}
                className="btn-secondary min-h-[40px] px-4"
              >
                {savingFile ? "Kaydediliyor…" : permanentSaveLabel}
              </button>
            )}
            <button type="button" onClick={onSaveDraft} className="btn-secondary min-h-[40px] px-4">
              Taslağı Kaydet
            </button>
            <button type="button" onClick={onClearDraft} className="btn-danger min-h-[40px] px-4">
              Taslağı Temizle
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0 px-1">
            {activeSavedFileLabel && (
              <p className="text-[12px] font-medium text-[#243746] truncate max-w-full">
                {activeSavedFileLabel}
              </p>
            )}
            <div className="flex items-center gap-2 text-[14px] font-normal text-slate-600 tabular-nums">
              <span className="font-medium text-slate-800">
                {stepIndex + 1} / {allIds.length} adım
              </span>
              <span className="text-slate-300">·</span>
              <span>%{progressPct} tamamlandı</span>
            </div>
            <div className="w-full max-w-xs">
              <ProgressBar value={progressPct} thin />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end shrink-0">
            <button
              type="button"
              onClick={goPrev}
              disabled={stepIndex === 0}
              className="btn-secondary min-h-[40px] px-4"
            >
              Önceki
            </button>
            {showResultPhase ? (
              <>
                {showSaveCalculation && (
                  <button
                    type="button"
                    onClick={onSaveCalculation}
                    disabled={savingCalculation || calculationSaved}
                    className="btn-primary min-h-[40px] px-5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {calculationSaved ? "Kaydedildi" : savingCalculation ? "Kaydediliyor…" : "Hesaplamayı Kaydet"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onDownloadWordReport}
                  disabled={reporting}
                  className={`min-h-[40px] px-5 disabled:opacity-50 disabled:cursor-not-allowed ${
                    showSaveCalculation ? "btn-secondary" : "btn-primary"
                  }`}
                >
                  {reporting ? "Rapor hazırlanıyor…" : "Word Raporu Oluştur"}
                </button>
              </>
            ) : (
              <>
                {!isReview && (
                  <button type="button" onClick={goNext} className="btn-primary min-h-[40px] px-4">
                    Sonraki
                  </button>
                )}
                {!showResultPhase && (
                  <button
                    type="button"
                    onClick={() => { onStepChange(reviewId); onValidate(); }}
                    disabled={validating || reviewSummaryLoading || running}
                    className="btn-primary min-h-[40px] px-4"
                  >
                    {validating ? "Kontrol…" : "Verileri Kontrol Et"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
