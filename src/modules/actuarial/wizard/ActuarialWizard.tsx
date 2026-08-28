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
  onSaveDraft: () => void;
  onClearDraft: () => void;
  draftSaveStatus: DraftSaveStatus;
  lastSavedAt: string | null;
  onChangeTypeRequest: () => void;
  onNewFile: () => void;
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
    return (
      <>
        <p>Müteveffa: {draft.deceased.fullName || "—"}</p>
        <p>Hak sahibi: {draft.beneficiaries.length}</p>
        <p>Destek ilişkisi: {draft.supportRelations.length}</p>
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
  onSaveDraft,
  onClearDraft,
  draftSaveStatus,
  lastSavedAt,
  onChangeTypeRequest,
  onNewFile,
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

  const goPrev = () => {
    if (stepIndex > 0) onStepChange(allIds[stepIndex - 1]!);
  };
  const goNext = () => {
    if (stepIndex < allIds.length - 1) onStepChange(allIds[stepIndex + 1]!);
  };

  const StepComponent = current?.Component;

  return (
    <div className="pb-[88px] lg:pb-[80px]">
      {/* ─── Header ───────────────────────────────────────────────── */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[20px] sm:text-[22px] font-semibold text-[#22313F] tracking-[-0.02em] leading-snug line-clamp-2">
            {CALCULATION_TYPE_LABELS[draft.calculationType]}
          </h1>
          <p className="mt-1 text-[12px] font-normal text-[#6B7280]">
            {draftStatusLabel(draftSaveStatus, lastSavedAt)}
          </p>
        </div>

        {/* Mobile: ⋮ menu */}
        <div className="lg:hidden shrink-0">
          <DropdownMenu
            trigger={({ buttonProps, buttonRef }) => (
              <button
                {...buttonProps}
                ref={buttonRef}
                type="button"
                className="min-h-[40px] min-w-[40px] rounded-[10px] border border-[#D9E5E3] bg-white text-[#6B7280] flex items-center justify-center hover:bg-[#EAF4F3]/50"
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
      <div className="lg:hidden mb-3 rounded-[11px] border border-[#D9E5E3] bg-white px-3.5 py-2.5 shadow-[0_1px_3px_rgba(15,95,99,0.04)]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 text-[12.5px] font-normal text-[#22313F] space-y-0.5">
            <p className="truncate">{activeTitle}</p>
            <p className="text-[12px] text-[#6B7280]">
              Eksik {missingTotal || "—"} · Uyarı {warnTotal} · Hata {errTotal}
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 text-[12.5px] font-medium text-[#0F5F63] min-h-[36px] px-2"
            aria-expanded={summaryOpen}
            onClick={() => setSummaryOpen((v) => !v)}
          >
            {summaryOpen ? "Gizle" : "Detayları göster"}
          </button>
        </div>
        {summaryOpen && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
            <SummaryCard title="Dosya özeti">
              <p>Dosya: {draft.common.internalFileName || "—"}</p>
              <p>Olay: {draft.common.eventDate || "—"}</p>
              <p>Hesap: {draft.common.calculationDate || "—"}</p>
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
        <nav className="hidden lg:block lg:sticky lg:top-[4rem] self-start rounded-[11px] border border-[#D9E5E3] bg-white p-2 shadow-[0_1px_4px_rgba(15,95,99,0.05)] max-h-[calc(100vh-6rem)] overflow-y-auto">
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
                    ? "bg-[#0F5F63] text-white border-[#0F5F63]"
                    : "bg-white border-transparent hover:bg-[#EAF4F3]/60 text-[#22313F]"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 h-5 w-5 shrink-0 rounded-full text-[11px] font-medium flex items-center justify-center ${
                      active
                        ? "bg-white/20 text-white"
                        : done
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : missing || errCount
                            ? "bg-amber-50 text-amber-700"
                            : "bg-[#EAF4F3] text-[#6B7280]"
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
                        active ? "text-white/80" : done ? "text-emerald-600" : "text-[#6B7280]"
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
          {!isReview && current && (
            <div className="mb-1 hidden lg:block">
              <h2 className="text-[16px] font-medium text-[#22313F] tracking-[-0.01em]">{current.title}</h2>
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
              reporting={reporting}
              reportError={reportError}
              reviewSummary={reviewSummary}
              reviewSummaryLoading={reviewSummaryLoading}
              reviewSummaryError={reviewSummaryError}
              reviewFlowPhase={reviewFlowPhase}
              onValidate={onValidate}
              onConfirmAndRun={onConfirmAndRun}
              onDownloadWordReport={onDownloadWordReport}
              onGoToStep={onStepChange}
            />
          ) : StepComponent ? (
            <StepComponent
              draft={draft}
              onChange={onDraftChange}
              fieldErrors={fieldErrors.map((e) => ({ field: e.field, message: e.message }))}
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
        </main>

        {/* Right summary */}
        <aside className="wizard-summary-aside lg:sticky lg:top-[4rem] self-start">
          <SummaryCard title="Dosya özeti">
            <p>Tür: {CALCULATION_TYPE_LABELS[draft.calculationType]}</p>
            <p>Dosya: {draft.common.internalFileName || "—"}</p>
            <p>Olay: {draft.common.eventDate || "—"}</p>
            <p>Hesap: {draft.common.calculationDate || "—"}</p>
          </SummaryCard>
          <SummaryCard title="İlerleme">
            <p className="font-medium text-slate-800">
              {stepIndex + 1} / {allIds.length} adım
            </p>
            <p className="text-slate-500">%{progressPct} tamamlandı</p>
            <ProgressBar value={progressPct} />
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
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
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#D9E5E3] bg-white lg:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="px-4 pt-2.5 pb-2.5">
          <div className="flex items-center justify-between gap-2 mb-2 text-[13px] font-normal text-slate-500 tabular-nums">
            <span>{stepIndex + 1} / {allIds.length}</span>
            <span>%{progressPct}</span>
          </div>
          <ProgressBar value={progressPct} thin />
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={stepIndex === 0}
              className="btn-secondary min-h-[44px] px-4 shrink-0"
            >
              Geri
            </button>
            {!isReview ? (
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
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#D9E5E3] bg-white hidden lg:block shadow-[0_-2px_10px_rgba(15,95,99,0.05)]">
        <div className="app-workspace wizard-action-bar-inner flex items-center gap-4 py-3">
          <div className="flex flex-wrap gap-2 shrink-0">
            <button type="button" onClick={onSaveDraft} className="btn-secondary min-h-[40px] px-4">
              Taslağı Kaydet
            </button>
            <button type="button" onClick={onClearDraft} className="btn-danger min-h-[40px] px-4">
              Taslağı Temizle
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0 px-1">
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
            {!isReview && (
              <button type="button" onClick={goNext} className="btn-primary min-h-[40px] px-4">
                Sonraki
              </button>
            )}
            <button
              type="button"
              onClick={() => { onStepChange(reviewId); onValidate(); }}
              disabled={validating || reviewSummaryLoading}
              className="btn-primary min-h-[40px] px-4"
            >
              {validating ? "Kontrol…" : "Verileri Kontrol Et"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
