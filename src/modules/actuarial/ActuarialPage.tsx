import { useCallback, useEffect, useRef, useState } from "react";
import { CalculationTypeSelect } from "./CalculationTypeSelect";
import { ActuarialWizard } from "./wizard/ActuarialWizard";
import {
  createEmptyDraft,
  type CalculationDraft,
  type CalculationType,
  type CalculationValidateResponse,
  type ValidationIssue,
} from "./types/calculationDraft";
import {
  clearDraftForType,
  clearLegacyDraft,
  detectLegacyDraft,
  loadDraftForType,
  saveDraftToSession,
  type DraftSaveStatus,
} from "./draftStorage";
import { toApiClientError, validateCalculationDraft } from "../../services/api";
import { getWizardSteps } from "./wizard/configs";

export type { DraftSaveStatus } from "./draftStorage";

/**
 * Ana çalışma alanı — tür seçimi + türe özel wizard.
 * Parasal sonuç yok. Legacy /calculate çağrılmaz.
 */
export function ActuarialPage() {
  const [phase, setPhase] = useState<"select" | "wizard">("select");
  const [draft, setDraft] = useState<CalculationDraft | null>(null);
  const [stepId, setStepId] = useState("parties");
  const [validation, setValidation] = useState<CalculationValidateResponse | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ValidationIssue[]>([]);
  const [validating, setValidating] = useState(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [draftSaveStatus, setDraftSaveStatus] = useState<DraftSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [legacyNotice, setLegacyNotice] = useState(() => detectLegacyDraft());
  const skipNextAutoSave = useRef(false);

  /* Debounced sessionStorage taslağı */
  useEffect(() => {
    if (!draft) return;
    if (skipNextAutoSave.current) {
      skipNextAutoSave.current = false;
      return;
    }
    setDraftSaveStatus("saving");
    const timer = window.setTimeout(() => {
      try {
        saveDraftToSession(draft);
        const t = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
        setLastSavedAt(t);
        setDraftSaveStatus("saved");
      } catch {
        setDraftSaveStatus("error");
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [draft]);

  const startType = useCallback((type: CalculationType) => {
    const loaded = loadDraftForType(type);
    skipNextAutoSave.current = true;
    if (loaded.ok) {
      setDraft(loaded.draft);
      setDraftSaveStatus("saved");
    } else {
      if (loaded.reason === "incompatible") {
        setApiMessage(loaded.message);
      }
      setDraft(createEmptyDraft(type));
      setDraftSaveStatus("idle");
    }
    const steps = getWizardSteps(type);
    setStepId(steps[0]?.id ?? "parties");
    setValidation(null);
    setFieldErrors([]);
    setPhase("wizard");
  }, []);

  const handleDraftChange = useCallback((next: CalculationDraft) => {
    setDraft(next);
    setValidation(null);
    setFieldErrors([]);
  }, []);

  const handleValidate = useCallback(() => {
    if (!draft) return;
    setValidating(true);
    setApiMessage(null);
    setStepId("review");
    validateCalculationDraft(draft)
      .then((res) => {
        setValidation(res);
        setFieldErrors(res.errors ?? []);
        if (!res.valid) setApiMessage("Eksik veya hatalı alanlar var.");
      })
      .catch((err: unknown) => {
        const mapped = toApiClientError(err);
        setApiMessage(mapped.message);
        if (mapped.validation) {
          setValidation(mapped.validation);
          setFieldErrors(mapped.validation.errors ?? []);
        }
      })
      .finally(() => setValidating(false));
  }, [draft]);

  const handleSaveDraft = useCallback(() => {
    if (!draft) return;
    try {
      saveDraftToSession(draft);
      const t = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
      setLastSavedAt(t);
      setDraftSaveStatus("saved");
    } catch {
      setDraftSaveStatus("error");
    }
  }, [draft]);

  const handleClearDraft = useCallback(() => {
    if (!draft) return;
    if (!window.confirm("Taslak temizlensin mi?")) return;
    clearDraftForType(draft.calculationType);
    skipNextAutoSave.current = true;
    setDraft(createEmptyDraft(draft.calculationType));
    setDraftSaveStatus("idle");
    setLastSavedAt(null);
    setValidation(null);
    setFieldErrors([]);
    setStepId(getWizardSteps(draft.calculationType)[0]?.id ?? "parties");
  }, [draft]);

  const handleChangeTypeRequest = useCallback(() => {
    if (
      !window.confirm(
        "Hesap türünü değiştirirseniz mevcut türe özel girdiğiniz bilgiler temizlenecektir. Devam etmek istiyor musunuz?"
      )
    ) {
      return;
    }
    if (draft) clearDraftForType(draft.calculationType);
    setDraft(null);
    setValidation(null);
    setFieldErrors([]);
    setDraftSaveStatus("idle");
    setPhase("select");
  }, [draft]);

  const handleNewFile = useCallback(() => {
    if (draft) {
      if (
        !window.confirm(
          "Yeni dosya başlatılsın mı? Mevcut türe ait oturum taslağı silinmez; seçim ekranına dönülür."
        )
      ) {
        return;
      }
    }
    setDraft(null);
    setValidation(null);
    setFieldErrors([]);
    setDraftSaveStatus("idle");
    setPhase("select");
  }, [draft]);

  const handleClearLegacy = useCallback(() => {
    clearLegacyDraft();
    setLegacyNotice(false);
  }, []);

  return (
    <div className="bg-slate-100 pb-3">
      <div className="app-workspace py-3 sm:py-5">
        {legacyNotice && (
          <div className="mb-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-[12px] border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] font-normal text-amber-950">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 mt-0.5"
                aria-hidden
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                </svg>
              </span>
              <p className="leading-snug">
                Eski taslak yeni form yapısıyla uyumlu değil. Yeni bir taslak başlatmanız gerekiyor.
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 self-stretch sm:self-center min-h-[40px] px-3 rounded-[10px] border border-amber-300 bg-white text-[13px] font-medium text-amber-900 hover:bg-amber-100"
              onClick={handleClearLegacy}
            >
              Eski taslağı temizle
            </button>
          </div>
        )}

        {apiMessage && (
          <div className="mb-3 rounded-[12px] border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] font-normal text-amber-900">
            {apiMessage}
          </div>
        )}

        {phase === "select" || !draft ? (
          <CalculationTypeSelect onSelect={startType} />
        ) : (
          <ActuarialWizard
            draft={draft}
            onDraftChange={handleDraftChange}
            stepId={stepId}
            onStepChange={setStepId}
            validation={validation}
            fieldErrors={fieldErrors}
            validating={validating}
            onValidate={handleValidate}
            onSaveDraft={handleSaveDraft}
            onClearDraft={handleClearDraft}
            draftSaveStatus={draftSaveStatus}
            lastSavedAt={lastSavedAt}
            onChangeTypeRequest={handleChangeTypeRequest}
            onNewFile={handleNewFile}
          />
        )}
      </div>
    </div>
  );
}
