import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  hydrateTrafficDeathDraft,
  loadDraftForType,
  saveDraftToSession,
  type DraftSaveStatus,
} from "./draftStorage";
import {
  calculationHasUnsavedChanges,
  clearTypeSession,
  defaultTypeSession,
  draftFingerprint,
  loadCleanDraftFingerprint,
  loadTypeSession,
  saveCleanDraftFingerprint,
  saveTypeSession,
  TRAFFIC_DEATH_LIFE_END_EPOCH,
} from "./typeSessionStorage";
import { toApiClientError, validateCalculationDraft, requestCalculationRun, requestCalculationReviewSummary, requestTrafficInjuryWordReport, requestTrafficDeathReport, downloadBlob, formatCalculationAccessError, fetchAuthMe, getSavedCalculation, saveCompletedCalculation, saveNamedCalculation, updateNamedCalculation } from "../../services/api";
import type { TrafficDeathDraft, TrafficInjuryDraft } from "./types/calculationDraft";
import type { TrafficInjuryCalculationResult } from "./types/trafficInjuryResult";
import type { TrafficDeathCalculationResult } from "./types/trafficDeathResult";
import { isTrafficDeathCalculationResult } from "./types/trafficDeathResult";
import type { TrafficDeathSupportPeriodsResponse } from "./types/trafficDeathSupportPeriods";
import type { CalculationReviewSummaryResponse, ReviewFlowPhase } from "./types/calculationReviewSummary";
import { getWizardSteps, resolveWizardStepId } from "./wizard/configs";
import {
  normalizeTrafficDeathCalculationResult,
  normalizeTrafficDeathSupportSnapshot,
  resolveDeceasedProbableLifeEndDate,
  isStaleExclusiveDeceasedLifeEndResult,
} from "./results/capTrafficDeathToDeceasedLifeEnd";
import { SaveFileNameModal } from "./wizard/shared/SaveFileNameModal";
import { UnsavedChangesSheet } from "./wizard/shared/UnsavedChangesSheet";
import { TempDisabilityGapModal } from "./wizard/shared/TempDisabilityGapModal";
import { TempIncapacityStartModal } from "./wizard/shared/TempIncapacityStartModal";
import { TempIncapacityPeriodGapModal } from "./wizard/shared/TempIncapacityPeriodGapModal";
import { TempIncapacityPeriodOverlapModal } from "./wizard/shared/TempIncapacityPeriodOverlapModal";
import { DisabilityStartDateRequiredModal } from "./wizard/shared/DisabilityStartDateRequiredModal";
import { computeEffectiveTemporaryRange, clearIgnoreGapsIfConsecutive } from "./wizard/shared/tempIncapacityPeriodUtils";
import {
  getTempDisabilityContinuityCode,
  TEMP_DISABILITY_GAP,
  type TempDisabilityContinuityCode,
} from "./wizard/shared/tempDisabilityContinuity";
import {
  resolveTrafficValidationModal,
  type TrafficValidationModalKind,
} from "./wizard/shared/tempIncapacityStartValidation";

export type { DraftSaveStatus } from "./draftStorage";

function supportSnapshotFromDeathResult(
  result: TrafficDeathCalculationResult
): TrafficDeathSupportPeriodsResponse {
  return {
    shareRatioPeriods: result.shareRatioPeriods,
    personLives: result.personLives,
    columnKeys: result.columnKeys,
    periods: result.supportPeriods,
    valid: true,
  };
}

function normalizeTrafficDeathSupportResponse(
  source: TrafficDeathSupportPeriodsResponse
): TrafficDeathSupportPeriodsResponse {
  return {
    ...source,
    ...normalizeTrafficDeathSupportSnapshot({
      shareRatioPeriods: source.shareRatioPeriods,
      personLives: source.personLives,
      periods: source.periods,
      columnKeys: source.columnKeys,
      valid: source.valid,
    }),
  };
}

function coerceDeceasedRemaining(personLives: unknown): {
  years: number;
  months: number;
  days: number;
} | null {
  if (!Array.isArray(personLives)) return null;
  const deceased = personLives.find(
    (p) =>
      p &&
      typeof p === "object" &&
      ((p as { role?: string }).role === "DECEASED" ||
        (p as { personId?: string }).personId === "deceased")
  ) as { remainingLifetime?: { years?: number; months?: number; days?: number } } | undefined;
  const rem = deceased?.remainingLifetime;
  if (!rem) return null;
  return {
    years: typeof rem.years === "number" ? rem.years : 0,
    months: typeof rem.months === "number" ? rem.months : 0,
    days: typeof rem.days === "number" ? rem.days : 0,
  };
}

/**
 * Ana çalışma alanı — tür seçimi + türe özel wizard.
 * Parasal sonuç yok. Legacy /calculate çağrılmaz.
 */
export function ActuarialPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [phase, setPhase] = useState<"select" | "wizard">("select");
  const [draft, setDraft] = useState<CalculationDraft | null>(null);
  const [stepId, setStepId] = useState("parties");
  const [validation, setValidation] = useState<CalculationValidateResponse | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ValidationIssue[]>([]);
  const [validating, setValidating] = useState(false);
  const [running, setRunning] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [trafficDeathReporting, setTrafficDeathReporting] = useState<"docx" | "pdf" | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<TrafficInjuryCalculationResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [reviewSummary, setReviewSummary] = useState<CalculationReviewSummaryResponse | null>(null);
  const [reviewSummaryLoading, setReviewSummaryLoading] = useState(false);
  const [reviewSummaryError, setReviewSummaryError] = useState<string | null>(null);
  const [reviewFlowPhase, setReviewFlowPhase] = useState<ReviewFlowPhase>("idle");
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [draftSaveStatus, setDraftSaveStatus] = useState<DraftSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [legacyNotice, setLegacyNotice] = useState(() => detectLegacyDraft());
  const [canSaveCalculation, setCanSaveCalculation] = useState(false);
  const [runInputHash, setRunInputHash] = useState<string | null>(null);
  const [savingCalculation, setSavingCalculation] = useState(false);
  const [saveCalculationError, setSaveCalculationError] = useState<string | null>(null);
  const [calculationSaved, setCalculationSaved] = useState(false);
  const [savedListVersion, setSavedListVersion] = useState(0);
  const [currentSavedCalculationId, setCurrentSavedCalculationId] = useState<string | null>(null);
  const [savedDisplayName, setSavedDisplayName] = useState<string | null>(null);
  const [trafficDeathResultSnapshot, setTrafficDeathResultSnapshot] =
    useState<TrafficDeathSupportPeriodsResponse | null>(null);
  const [trafficDeathRunResult, setTrafficDeathRunResult] =
    useState<TrafficDeathCalculationResult | null>(null);
  const [saveFileModalOpen, setSaveFileModalOpen] = useState(false);
  const [unsavedPromptOpen, setUnsavedPromptOpen] = useState(false);
  const [savingFile, setSavingFile] = useState(false);
  const [saveFileError, setSaveFileError] = useState<string | null>(null);
  const [fileSaved, setFileSaved] = useState(false);
  const [validationModal, setValidationModal] = useState<TrafficValidationModalKind | null>(null);
  const [tempDisabilityModalCode, setTempDisabilityModalCode] =
    useState<TempDisabilityContinuityCode>(TEMP_DISABILITY_GAP);
  const [validationFieldHighlight, setValidationFieldHighlight] = useState(false);
  const skipNextAutoSave = useRef(false);
  const cleanDraftFingerprintRef = useRef<string | null>(null);
  const leaveAfterSaveRef = useRef(false);
  const validationHighlightTimer = useRef<number | null>(null);
  const deathResultRefreshKeyRef = useRef<string | null>(null);

  const handleTrafficDeathSupportResult = useCallback(
    (res: TrafficDeathSupportPeriodsResponse) => {
      const snap = normalizeTrafficDeathSupportResponse(res);
      setTrafficDeathResultSnapshot(snap);
      setTrafficDeathRunResult((prev) => {
        if (!prev) return prev;
        const runEnd = resolveDeceasedProbableLifeEndDate(prev.personLives);
        const snapEnd = resolveDeceasedProbableLifeEndDate(snap.personLives);
        const lifeEndMismatch = Boolean(runEnd && snapEnd && runEnd !== snapEnd);
        const exclusiveStale = isStaleExclusiveDeceasedLifeEndResult({
          personLives: prev.personLives,
          shareRatioPeriods: prev.shareRatioPeriods,
          futurePeriods: prev.futurePeriods,
          supportPeriods: prev.supportPeriods as Array<{ endDate: string }> | undefined,
        });
        if (lifeEndMismatch || exclusiveStale) {
          deathResultRefreshKeyRef.current = null;
          return null;
        }
        return prev;
      });
    },
    []
  );

  /* Stale calendar life-end veya exclusive boundary (period max < lifeEnd) → fresh run */
  useEffect(() => {
    if (!draft || draft.calculationType !== "TRAFFIC_DEATH") return;
    if (reviewFlowPhase !== "result") return;
    const deathDraft = draft as TrafficDeathDraft;
    const runEnd = resolveDeceasedProbableLifeEndDate(trafficDeathRunResult?.personLives);
    const rem = coerceDeceasedRemaining(trafficDeathRunResult?.personLives);
    const looksLikeStaleCalendar =
      runEnd === "2031-02-06" &&
      rem?.years === 6 &&
      rem?.months === 9 &&
      rem?.days === 22;
    const looksLikeExclusiveBoundary =
      trafficDeathRunResult != null &&
      isStaleExclusiveDeceasedLifeEndResult({
        personLives: trafficDeathRunResult.personLives,
        shareRatioPeriods: trafficDeathRunResult.shareRatioPeriods,
        futurePeriods: trafficDeathRunResult.futurePeriods,
        supportPeriods: trafficDeathRunResult.supportPeriods as
          | Array<{ endDate: string }>
          | undefined,
      });
    const clearedAwaitingFresh = trafficDeathRunResult == null && trafficDeathResultSnapshot != null;
    if (!looksLikeStaleCalendar && !looksLikeExclusiveBoundary && !clearedAwaitingFresh) return;
    const key = [
      deathDraft.deceased.birthDate,
      deathDraft.deceased.deathDate,
      deathDraft.deceased.gender,
      deathDraft.common.calculationDate,
      looksLikeExclusiveBoundary
        ? "exclusive"
        : looksLikeStaleCalendar
          ? "stale06"
          : "cleared",
    ].join("|");
    if (deathResultRefreshKeyRef.current === key) return;
    deathResultRefreshKeyRef.current = key;
    let cancelled = false;
    setRunning(true);
    requestCalculationRun(deathDraft)
      .then((res) => {
        if (cancelled) return;
        if (!isTrafficDeathCalculationResult(res.result)) return;
        const fresh = normalizeTrafficDeathCalculationResult(res.result);
        setTrafficDeathRunResult(fresh);
        setTrafficDeathResultSnapshot(supportSnapshotFromDeathResult(fresh));
        setRunInputHash(res.access?.inputHash ?? null);
      })
      .catch(() => {
        if (!cancelled) deathResultRefreshKeyRef.current = null;
      })
      .finally(() => {
        if (!cancelled) setRunning(false);
      });
    return () => {
      cancelled = true;
    };
  }, [draft, reviewFlowPhase, trafficDeathRunResult, trafficDeathResultSnapshot]);

  const resetTransientWizardState = useCallback(() => {
    setValidation(null);
    setFieldErrors([]);
    setValidating(false);
    setRunning(false);
    setReporting(false);
    setReportError(null);
    setRunError(null);
    setReviewSummary(null);
    setReviewSummaryError(null);
    setReviewSummaryLoading(false);
    setSaveCalculationError(null);
    setValidationModal(null);
    setValidationFieldHighlight(false);
    setApiMessage(null);
    setRunResult(null);
    setRunInputHash(null);
    setReviewFlowPhase("idle");
    setCalculationSaved(false);
    setCurrentSavedCalculationId(null);
    setSavedDisplayName(null);
    setTrafficDeathResultSnapshot(null);
    setTrafficDeathRunResult(null);
    setSaveFileError(null);
    setFileSaved(false);
  }, []);

  const applyTypeSession = useCallback((type: CalculationType) => {
    const session = loadTypeSession(type);
    setStepId(session.stepId);
    setRunResult(session.runResult);
    setRunInputHash(session.runInputHash);
    setReviewFlowPhase(session.reviewFlowPhase);
    setCalculationSaved(session.calculationSaved);
    if (type === "TRAFFIC_DEATH") {
      setCurrentSavedCalculationId(session.currentSavedCalculationId ?? null);
      setSavedDisplayName(session.savedDisplayName ?? null);
      const rawRun = session.trafficDeathRunResult ?? null;
      const cappedRun = rawRun ? normalizeTrafficDeathCalculationResult(rawRun) : null;
      const rawSnap = session.trafficDeathResultSnapshot ?? null;
      setTrafficDeathRunResult(cappedRun);
      setTrafficDeathResultSnapshot(
        cappedRun
          ? supportSnapshotFromDeathResult(cappedRun)
          : rawSnap
            ? normalizeTrafficDeathSupportResponse(rawSnap)
            : null
      );
      setFileSaved(Boolean(session.currentSavedCalculationId));
    } else if (type === "TRAFFIC_INJURY") {
      setCurrentSavedCalculationId(session.currentSavedCalculationId ?? null);
      setSavedDisplayName(session.savedDisplayName ?? null);
      setTrafficDeathResultSnapshot(null);
      setTrafficDeathRunResult(null);
      setFileSaved(Boolean(session.currentSavedCalculationId));
    } else {
      setCurrentSavedCalculationId(null);
      setSavedDisplayName(null);
      setTrafficDeathResultSnapshot(null);
      setTrafficDeathRunResult(null);
      setFileSaved(false);
    }
  }, []);

  const triggerValidationFieldHighlight = useCallback(() => {
    setValidationFieldHighlight(true);
    if (validationHighlightTimer.current != null) {
      window.clearTimeout(validationHighlightTimer.current);
    }
    validationHighlightTimer.current = window.setTimeout(() => {
      setValidationFieldHighlight(false);
      validationHighlightTimer.current = null;
    }, 6000);
  }, []);

  const showTrafficValidationModal = useCallback(
    (errors: ValidationIssue[]) => {
      const kind = resolveTrafficValidationModal(errors);
      if (!kind) return;
      if (kind === "temp_disability_continuity") {
        setTempDisabilityModalCode(getTempDisabilityContinuityCode(errors) ?? TEMP_DISABILITY_GAP);
      }
      setValidationModal(kind);
      triggerValidationFieldHighlight();
    },
    [triggerValidationFieldHighlight]
  );

  const closeTrafficValidationModal = useCallback(() => {
    setValidationModal(null);
    triggerValidationFieldHighlight();
  }, [triggerValidationFieldHighlight]);

  useEffect(() => {
    fetchAuthMe()
      .then((res) => setCanSaveCalculation(res.capabilities.canSaveCalculation))
      .catch(() => setCanSaveCalculation(false));
  }, []);

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

  /* Per-type wizard session (step, result, review phase) */
  useEffect(() => {
    if (!draft) return;
    saveTypeSession(draft.calculationType, {
      stepId,
      runInputHash,
      reviewFlowPhase,
      calculationSaved: draft.calculationType === "TRAFFIC_DEATH" ? fileSaved : calculationSaved,
      runResult,
      currentSavedCalculationId:
        draft.calculationType === "TRAFFIC_DEATH" || draft.calculationType === "TRAFFIC_INJURY"
          ? currentSavedCalculationId
          : null,
      savedDisplayName:
        draft.calculationType === "TRAFFIC_DEATH" || draft.calculationType === "TRAFFIC_INJURY"
          ? savedDisplayName
          : null,
      trafficDeathResultSnapshot:
        draft.calculationType === "TRAFFIC_DEATH" ? trafficDeathResultSnapshot : null,
      trafficDeathRunResult: draft.calculationType === "TRAFFIC_DEATH" ? trafficDeathRunResult : null,
    });
  }, [
    draft,
    stepId,
    runInputHash,
    reviewFlowPhase,
    calculationSaved,
    fileSaved,
    runResult,
    currentSavedCalculationId,
    savedDisplayName,
    trafficDeathResultSnapshot,
    trafficDeathRunResult,
  ]);

  const handleStepChange = useCallback(
    (id: string) => {
      if (!draft) {
        setStepId(id);
        return;
      }
      setStepId(resolveWizardStepId(draft.calculationType, id));
    },
    [draft]
  );

  useEffect(() => {
    if (!draft) return;
    const resolved = resolveWizardStepId(draft.calculationType, stepId);
    if (resolved !== stepId) {
      setStepId(resolved);
    }
  }, [draft, stepId]);

  const rememberCleanDraft = useCallback((next: CalculationDraft) => {
    const fp = draftFingerprint(next);
    cleanDraftFingerprintRef.current = fp;
    saveCleanDraftFingerprint(next.calculationType, fp);
  }, []);

  const adoptCleanBaseline = useCallback((next: CalculationDraft) => {
    const stored = loadCleanDraftFingerprint(next.calculationType);
    if (stored) {
      cleanDraftFingerprintRef.current = stored;
      return;
    }
    const session = loadTypeSession(next.calculationType);
    const fp = session.currentSavedCalculationId
      ? draftFingerprint(next)
      : draftFingerprint(createEmptyDraft(next.calculationType));
    cleanDraftFingerprintRef.current = fp;
    saveCleanDraftFingerprint(next.calculationType, fp);
  }, []);

  const abandonCurrentFile = useCallback(() => {
    if (!draft) {
      setPhase("select");
      setUnsavedPromptOpen(false);
      return;
    }
    const type = draft.calculationType;
    skipNextAutoSave.current = true;
    leaveAfterSaveRef.current = false;
    clearDraftForType(type);
    clearTypeSession(type);
    setDraft(null);
    resetTransientWizardState();
    setStepId(defaultTypeSession("TRAFFIC_INJURY").stepId);
    setDraftSaveStatus("idle");
    setLastSavedAt(null);
    setUnsavedPromptOpen(false);
    setSaveFileError(null);
    setPhase("select");
  }, [draft, resetTransientWizardState]);

  const startType = useCallback((type: CalculationType) => {
    const loaded = loadDraftForType(type);
    const next = loaded.ok ? loaded.draft : createEmptyDraft(type);
    skipNextAutoSave.current = true;
    resetTransientWizardState();
    adoptCleanBaseline(next);
    if (loaded.ok) {
      setDraft(loaded.draft);
      setDraftSaveStatus("saved");
    } else {
      if (loaded.reason === "incompatible") {
        setApiMessage(loaded.message);
      }
      setDraft(next);
      setDraftSaveStatus("idle");
    }
    applyTypeSession(type);
    setPhase("wizard");
  }, [adoptCleanBaseline, applyTypeSession, resetTransientWizardState]);

  const handleDraftChange = useCallback((next: CalculationDraft) => {
    const normalized =
      next.calculationType === "TRAFFIC_INJURY"
        ? clearIgnoreGapsIfConsecutive(next as TrafficInjuryDraft)
        : next;
    setDraft(normalized);
    setValidation(null);
    setFieldErrors([]);
    setSaveFileError(null);
    setFileSaved(false);
    if (normalized.calculationType === "TRAFFIC_DEATH") {
      setTrafficDeathResultSnapshot(null);
      setTrafficDeathRunResult(null);
      setReviewFlowPhase("idle");
      setRunError(null);
    } else {
      setRunResult(null);
      setRunError(null);
      setRunInputHash(null);
      setCalculationSaved(false);
      setReviewSummary(null);
      setReviewSummaryError(null);
      setReviewFlowPhase("idle");
    }
  }, []);

  const handleConfirmTempIncapacityIgnoreGaps = useCallback(() => {
    if (!draft || draft.calculationType !== "TRAFFIC_INJURY") return;
    setDraft({ ...draft, temporaryIncapacityIgnoreGaps: true });
    setValidation(null);
    setFieldErrors([]);
    setValidationModal(null);
  }, [draft]);

  const fetchReviewSummary = useCallback((currentDraft: CalculationDraft) => {
    if (
      currentDraft.calculationType !== "TRAFFIC_INJURY" &&
      currentDraft.calculationType !== "TRAFFIC_DEATH"
    ) {
      return;
    }
    setReviewSummaryLoading(true);
    setReviewSummaryError(null);
    setReviewSummary(null);
    setReviewFlowPhase("idle");
    requestCalculationReviewSummary(currentDraft)
      .then((res) => {
        setReviewSummary(res);
        setReviewFlowPhase("inputReview");
      })
      .catch((err: unknown) => {
        const mapped = toApiClientError(err);
        setReviewSummaryError(mapped.message);
        setReviewFlowPhase("idle");
      })
      .finally(() => setReviewSummaryLoading(false));
  }, []);

  const handleValidate = useCallback(() => {
    if (!draft) return;
    setValidating(true);
    setApiMessage(null);
    setReviewSummary(null);
    setReviewSummaryError(null);
    setReviewFlowPhase("idle");
    setRunResult(null);
    setRunError(null);
    validateCalculationDraft(draft)
      .then((res) => {
        setValidation(res);
        setFieldErrors(res.errors ?? []);
        if (!res.valid) {
          if (
            draft.calculationType === "TRAFFIC_INJURY" &&
            resolveTrafficValidationModal(res.errors)
          ) {
            showTrafficValidationModal(res.errors);
            setStepId("calculationInfo");
          } else {
            setStepId("review");
          }
          setApiMessage("Eksik veya hatalı alanlar var.");
          return;
        }
        setStepId("review");
        fetchReviewSummary(draft);
      })
      .catch((err: unknown) => {
        const mapped = toApiClientError(err);
        setApiMessage(mapped.message);
        if (mapped.validation) {
          setValidation(mapped.validation);
          setFieldErrors(mapped.validation.errors ?? []);
          if (
            draft.calculationType === "TRAFFIC_INJURY" &&
            resolveTrafficValidationModal(mapped.validation.errors ?? [])
          ) {
            showTrafficValidationModal(mapped.validation.errors ?? []);
            setStepId("calculationInfo");
          }
        }
      })
      .finally(() => setValidating(false));
  }, [draft, fetchReviewSummary, showTrafficValidationModal]);

  const handleRunCalculation = useCallback(() => {
    if (!draft) return;
    if (draft.calculationType !== "TRAFFIC_INJURY" && draft.calculationType !== "TRAFFIC_DEATH") {
      return;
    }
    setRunning(true);
    setRunError(null);
    setApiMessage(null);
    setStepId("review");
    requestCalculationRun(draft)
      .then((res) => {
        if (draft.calculationType === "TRAFFIC_DEATH") {
          if (!isTrafficDeathCalculationResult(res.result)) {
            setTrafficDeathRunResult(null);
            setRunError("Ölüm hesap sonucu alınamadı.");
            return;
          }
          const capped = normalizeTrafficDeathCalculationResult(res.result);
          setTrafficDeathRunResult(capped);
          setTrafficDeathResultSnapshot(supportSnapshotFromDeathResult(capped));
          setRunResult(null);
        } else {
          setRunResult(res.result as TrafficInjuryCalculationResult);
          setTrafficDeathRunResult(null);
        }
        setRunInputHash(res.access?.inputHash ?? reviewSummary?.inputHash ?? null);
        setReviewFlowPhase("result");
        setCalculationSaved(false);
        setSaveCalculationError(null);
      })
      .catch((err: unknown) => {
        const mapped = toApiClientError(err);
        setRunResult(null);
        setTrafficDeathRunResult(null);
        if (mapped.status === 402) {
          setRunError(formatCalculationAccessError(mapped));
        } else if (mapped.status === 422 && mapped.validation) {
          setValidation(mapped.validation);
          setFieldErrors(mapped.validation.errors ?? []);
          if (
            draft.calculationType === "TRAFFIC_INJURY" &&
            resolveTrafficValidationModal(mapped.validation.errors ?? [])
          ) {
            showTrafficValidationModal(mapped.validation.errors ?? []);
            setStepId("calculationInfo");
            setReviewFlowPhase("idle");
            setRunError(null);
          } else {
            setRunError("Taslak doğrulamadan geçemedi; eksik alanları tamamlayın.");
          }
        } else {
          setRunError(mapped.message);
        }
      })
      .finally(() => setRunning(false));
  }, [draft, reviewSummary, showTrafficValidationModal]);

  /** Onay sonrası run — ileride tek hesap ödeme kapısı buraya eklenir */
  const handleConfirmAndRun = useCallback(() => {
    if (!draft) return;
    if (reviewFlowPhase !== "inputReview" || !reviewSummary) return;
    if (draft.calculationType === "TRAFFIC_DEATH" || draft.calculationType === "TRAFFIC_INJURY") {
      // TODO: PAYMENT_REQUIRED_SINGLE → checkout yönlendirmesi
      handleRunCalculation();
    }
  }, [draft, reviewFlowPhase, reviewSummary, handleRunCalculation]);

  const handleDownloadWordReport = useCallback(() => {
    if (!draft || draft.calculationType !== "TRAFFIC_INJURY" || !runResult) return;
    setReporting(true);
    setReportError(null);
    requestTrafficInjuryWordReport(draft)
      .then((blob) => {
        const iso = draft.common.calculationDate || new Date().toISOString().slice(0, 10);
        const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        const dateLabel = m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
        downloadBlob(blob, `Trafik_Kazasi_Yaralanma_Raporu_${dateLabel}.docx`);
      })
      .catch((err: unknown) => {
        const mapped = toApiClientError(err);
        if (mapped.status === 402) {
          setReportError(formatCalculationAccessError(mapped));
        } else {
          setReportError(mapped.message || "Word raporu oluşturulamadı.");
        }
      })
      .finally(() => setReporting(false));
  }, [draft, runResult]);

  const handleTrafficDeathReport = useCallback(
    (format: "docx" | "pdf") => {
      if (!draft || draft.calculationType !== "TRAFFIC_DEATH" || !trafficDeathRunResult) return;
      setTrafficDeathReporting(format);
      setReportError(null);
      const fallbackName = `Trafik_Kazasi_Destekten_Yoksun_Kalma_Raporu.${format}`;
      requestTrafficDeathReport(draft, format)
        .then(({ blob, filename }) => downloadBlob(blob, filename ?? fallbackName))
        .catch((err: unknown) => {
          const mapped = toApiClientError(err);
          setReportError(
            mapped.status === 402
              ? formatCalculationAccessError(mapped)
              : mapped.message || "Rapor oluşturulamadı."
          );
        })
        .finally(() => setTrafficDeathReporting(null));
    },
    [draft, trafficDeathRunResult]
  );

  const handleSaveCalculation = useCallback(() => {
    if (!draft || draft.calculationType !== "TRAFFIC_INJURY" || !runResult || !runInputHash) return;
    setSavingCalculation(true);
    setSaveCalculationError(null);
    saveCompletedCalculation(draft, runInputHash)
      .then((res) => {
        setCalculationSaved(true);
        setCurrentSavedCalculationId(res.item.id);
        setSavedListVersion((v) => v + 1);
      })
      .catch((err: unknown) => {
        const mapped = toApiClientError(err);
        if (mapped.code === "SAVE_NOT_PERMITTED") {
          setSaveCalculationError(
            mapped.message || "Kalıcı hesap kaydı yalnızca abonelik kullanıcıları içindir."
          );
        } else if (mapped.code === "INPUT_HASH_MISMATCH") {
          setSaveCalculationError(
            "Hesap girdisi değişmiş. Sonucu kaydetmeden önce hesaplamayı yeniden çalıştırın."
          );
        } else {
          setSaveCalculationError(mapped.message);
        }
      })
      .finally(() => setSavingCalculation(false));
  }, [draft, runResult, runInputHash]);

  const performSaveNamedFile = useCallback(
    async (displayName: string): Promise<boolean> => {
      if (
        !draft ||
        (draft.calculationType !== "TRAFFIC_DEATH" && draft.calculationType !== "TRAFFIC_INJURY")
      ) {
        return false;
      }
      setSavingFile(true);
      setSaveFileError(null);
      const isUpdate = Boolean(currentSavedCalculationId);
      try {
        const resultSnapshot =
          draft.calculationType === "TRAFFIC_DEATH"
            ? trafficDeathRunResult ?? trafficDeathResultSnapshot
            : runResult;
        const payload = {
          draft,
          displayName,
          resultSnapshot,
        };
        const res = currentSavedCalculationId
          ? await updateNamedCalculation(currentSavedCalculationId, payload)
          : await saveNamedCalculation(payload);
        setCurrentSavedCalculationId(res.item.id);
        setSavedDisplayName(displayName);
        setFileSaved(true);
        setSavedListVersion((v) => v + 1);
        setSaveFileModalOpen(false);
        rememberCleanDraft(draft);
        const shouldLeave = leaveAfterSaveRef.current;
        leaveAfterSaveRef.current = false;
        if (shouldLeave) abandonCurrentFile();
        setApiMessage(isUpdate ? "Değişiklikler kaydedildi." : "Dosya kaydedildi.");
        return true;
      } catch (err: unknown) {
        const mapped = toApiClientError(err);
        leaveAfterSaveRef.current = false;
        setSaveFileError(mapped.message);
        if (!saveFileModalOpen && isUpdate) {
          setApiMessage(mapped.message);
        }
        return false;
      } finally {
        setSavingFile(false);
      }
    },
    [
      draft,
      currentSavedCalculationId,
      trafficDeathResultSnapshot,
      trafficDeathRunResult,
      runResult,
      saveFileModalOpen,
      rememberCleanDraft,
      abandonCurrentFile,
    ]
  );

  const handleSaveFile = useCallback(() => {
    if (
      !draft ||
      !canSaveCalculation ||
      (draft.calculationType !== "TRAFFIC_DEATH" && draft.calculationType !== "TRAFFIC_INJURY")
    ) {
      return;
    }
    if (currentSavedCalculationId && savedDisplayName) {
      void performSaveNamedFile(savedDisplayName);
      return;
    }
    setSaveFileModalOpen(true);
  }, [draft, canSaveCalculation, currentSavedCalculationId, savedDisplayName, performSaveNamedFile]);

  const openSavedCalculation = useCallback(async (id: string) => {
    try {
      const { item } = await getSavedCalculation(id);
      skipNextAutoSave.current = true;
      resetTransientWizardState();

      if (item.calculationType === "TRAFFIC_DEATH") {
        const snapshot = hydrateTrafficDeathDraft(
          item.inputSnapshotJson as Partial<TrafficDeathDraft>
        );
        const steps = getWizardSteps("TRAFFIC_DEATH");
        const session = loadTypeSession("TRAFFIC_DEATH");
        const restoredStep =
          session.currentSavedCalculationId === item.id
            ? session.stepId
            : steps[0]?.id || "deceased";
        setDraft(snapshot);
        setCurrentSavedCalculationId(item.id);
        setSavedDisplayName(item.displayName ?? item.title ?? null);
        const savedResult = item.resultSnapshotJson;
        const resolvedStep = resolveWizardStepId("TRAFFIC_DEATH", restoredStep);
        setFileSaved(true);
        setStepId(resolvedStep);
        setPhase("wizard");
        saveDraftToSession(snapshot);
        rememberCleanDraft(snapshot);

        const hadCompletedResult = isTrafficDeathCalculationResult(savedResult);
        // Eski snapshot (calendar 06.02.2031) UI’ya basılmaz — yalnız fresh backend
        setTrafficDeathRunResult(null);
        setTrafficDeathResultSnapshot(null);
        setReviewFlowPhase(hadCompletedResult ? "result" : "idle");
        saveTypeSession("TRAFFIC_DEATH", {
          stepId: resolvedStep,
          runInputHash: null,
          reviewFlowPhase: hadCompletedResult ? "result" : "idle",
          calculationSaved: true,
          runResult: null,
          currentSavedCalculationId: item.id,
          savedDisplayName: item.displayName ?? item.title ?? null,
          trafficDeathResultSnapshot: null,
          trafficDeathRunResult: null,
          trafficDeathLifeEndEpoch: null,
        });

        if (hadCompletedResult || (savedResult && typeof savedResult === "object")) {
          setRunning(true);
          try {
            const res = await requestCalculationRun(snapshot);
            if (isTrafficDeathCalculationResult(res.result)) {
              const fresh = normalizeTrafficDeathCalculationResult(res.result);
              setTrafficDeathRunResult(fresh);
              setTrafficDeathResultSnapshot(supportSnapshotFromDeathResult(fresh));
              setReviewFlowPhase("result");
              setRunInputHash(res.access?.inputHash ?? null);
              saveTypeSession("TRAFFIC_DEATH", {
                stepId: resolvedStep,
                runInputHash: res.access?.inputHash ?? null,
                reviewFlowPhase: "result",
                calculationSaved: true,
                runResult: null,
                currentSavedCalculationId: item.id,
                savedDisplayName: item.displayName ?? item.title ?? null,
                trafficDeathResultSnapshot: supportSnapshotFromDeathResult(fresh),
                trafficDeathRunResult: fresh,
                trafficDeathLifeEndEpoch: TRAFFIC_DEATH_LIFE_END_EPOCH,
              });
            } else {
              setReviewFlowPhase("idle");
              setRunError("Ölüm hesap sonucu alınamadı; kaydı yeniden çalıştırın.");
            }
          } catch (err: unknown) {
            setReviewFlowPhase("idle");
            setRunError(toApiClientError(err).message);
          } finally {
            setRunning(false);
          }
        }
        setDraftSaveStatus("saved");
        return;
      }

      if (item.calculationType !== "TRAFFIC_INJURY") {
        setApiMessage("Bu hesap türü henüz desteklenmiyor.");
        return;
      }
      const snapshot = item.inputSnapshotJson as TrafficInjuryDraft;
      if (snapshot?.calculationType !== "TRAFFIC_INJURY") {
        setApiMessage("Kayıtlı hesap türü ile girdi uyumsuz.");
        return;
      }
      const steps = getWizardSteps("TRAFFIC_INJURY");
      const session = loadTypeSession("TRAFFIC_INJURY");
      const sameSavedSession = session.currentSavedCalculationId === item.id;
      const hasCompletedResult =
        item.status === "COMPLETED" && item.resultSnapshotJson != null;

      const injuryDisplayName = item.displayName ?? item.title ?? null;
      setCurrentSavedCalculationId(item.id);
      setSavedDisplayName(injuryDisplayName);
      setFileSaved(true);

      if (hasCompletedResult) {
        setDraft(snapshot);
        setRunResult(item.resultSnapshotJson as TrafficInjuryCalculationResult);
        setRunInputHash(item.inputHash);
        setReviewFlowPhase("result");
        setCalculationSaved(true);
        setStepId("review");
        setPhase("wizard");
        saveDraftToSession(snapshot);
        rememberCleanDraft(snapshot);
        saveTypeSession("TRAFFIC_INJURY", {
          stepId: "review",
          runInputHash: item.inputHash,
          reviewFlowPhase: "result",
          calculationSaved: true,
          runResult: item.resultSnapshotJson as TrafficInjuryCalculationResult,
          currentSavedCalculationId: item.id,
          savedDisplayName: injuryDisplayName,
        });
        setDraftSaveStatus("saved");
        return;
      }

      const restoredStep = sameSavedSession
        ? session.stepId
        : steps[0]?.id || "parties";
      const resolvedStep = resolveWizardStepId("TRAFFIC_INJURY", restoredStep);
      setDraft(snapshot);
      setRunResult(sameSavedSession ? session.runResult : null);
      setRunInputHash(sameSavedSession ? session.runInputHash : item.inputHash);
      setReviewFlowPhase(sameSavedSession ? session.reviewFlowPhase : "idle");
      setCalculationSaved(item.status === "COMPLETED");
      setStepId(resolvedStep);
      setPhase("wizard");
      saveDraftToSession(snapshot);
        rememberCleanDraft(snapshot);
      saveTypeSession("TRAFFIC_INJURY", {
        stepId: resolvedStep,
        runInputHash: sameSavedSession ? session.runInputHash : item.inputHash,
        reviewFlowPhase: sameSavedSession ? session.reviewFlowPhase : "idle",
        calculationSaved: item.status === "COMPLETED",
        runResult: sameSavedSession ? session.runResult : null,
        currentSavedCalculationId: item.id,
        savedDisplayName: injuryDisplayName,
      });
      setDraftSaveStatus("saved");
    } catch (err: unknown) {
      setApiMessage(toApiClientError(err).message);
    }
  }, [resetTransientWizardState]);

  useEffect(() => {
    const openSavedId = (location.state as { openSavedId?: string } | null)?.openSavedId;
    if (!openSavedId) return;
    navigate("/dashboard", { replace: true, state: {} });
    void openSavedCalculation(openSavedId);
  }, [location.state, navigate, openSavedCalculation]);

  useEffect(() => {
    if (location.pathname !== "/dashboard") return;
    setSavedListVersion((v) => v + 1);
  }, [location.pathname]);

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
    const empty = createEmptyDraft(draft.calculationType);
    clearDraftForType(draft.calculationType);
    clearTypeSession(draft.calculationType);
    skipNextAutoSave.current = true;
    rememberCleanDraft(empty);
    setDraft(empty);
    setDraftSaveStatus("idle");
    setLastSavedAt(null);
    resetTransientWizardState();
    applyTypeSession(draft.calculationType);
  }, [applyTypeSession, draft, rememberCleanDraft, resetTransientWizardState]);

  const handleChangeTypeRequest = useCallback(() => {
    if (
      !window.confirm(
        "Hesap türü seçim ekranına dönmek istiyor musunuz? Her modülün taslağı ayrı saklanır; girdiğiniz bilgiler kaybolmaz."
      )
    ) {
      return;
    }
    if (draft) {
      saveTypeSession(draft.calculationType, {
        stepId,
        runInputHash,
        reviewFlowPhase,
        calculationSaved: draft.calculationType === "TRAFFIC_DEATH" ? false : calculationSaved,
        runResult,
        currentSavedCalculationId: null,
        savedDisplayName: null,
        trafficDeathResultSnapshot: draft.calculationType === "TRAFFIC_DEATH" ? null : undefined,
        trafficDeathRunResult: draft.calculationType === "TRAFFIC_DEATH" ? null : undefined,
      });
    }
    setDraft(null);
    resetTransientWizardState();
    setStepId(defaultTypeSession("TRAFFIC_INJURY").stepId);
    setDraftSaveStatus("idle");
    setLastSavedAt(null);
    setPhase("select");
  }, [
    draft,
    stepId,
    runInputHash,
    reviewFlowPhase,
    calculationSaved,
    runResult,
    resetTransientWizardState,
  ]);

  const handleNewFile = useCallback(() => {
    if (!draft) {
      setPhase("select");
      return;
    }
    if (calculationHasUnsavedChanges(draft, cleanDraftFingerprintRef.current)) {
      setSaveFileError(null);
      setUnsavedPromptOpen(true);
      return;
    }
    abandonCurrentFile();
  }, [abandonCurrentFile, draft]);

  const handleUnsavedSave = useCallback(() => {
    if (
      !draft ||
      (draft.calculationType !== "TRAFFIC_DEATH" && draft.calculationType !== "TRAFFIC_INJURY")
    ) {
      setSaveFileError("Bu hesap dosya olarak kaydedilemiyor.");
      return;
    }
    leaveAfterSaveRef.current = true;
    if (currentSavedCalculationId && savedDisplayName) {
      void performSaveNamedFile(savedDisplayName);
      return;
    }
    setUnsavedPromptOpen(false);
    setSaveFileModalOpen(true);
  }, [
    draft,
    currentSavedCalculationId,
    savedDisplayName,
    performSaveNamedFile,
  ]);

  const handleClearLegacy = useCallback(() => {
    clearLegacyDraft();
    setLegacyNotice(false);
  }, []);

  const handleBeforeStepAdvance = useCallback(
    async (fromStepId: string, toStepId: string) => {
      if (!draft || draft.calculationType !== "TRAFFIC_INJURY" || fromStepId !== "calculationInfo") {
        return true;
      }
      const steps = getWizardSteps(draft.calculationType);
      const fromIndex = steps.findIndex((s) => s.id === fromStepId);
      const toIndex = steps.findIndex((s) => s.id === toStepId);
      if (toIndex <= fromIndex) return true;

      try {
        const res = await validateCalculationDraft(draft);
        setValidation(res);
        setFieldErrors(res.errors ?? []);
        if (resolveTrafficValidationModal(res.errors)) {
          showTrafficValidationModal(res.errors);
          return false;
        }
      } catch {
        return true;
      }
      return true;
    },
    [draft, showTrafficValidationModal]
  );

  const persistWizardSession = useCallback(() => {
    if (!draft) return;
    saveTypeSession(draft.calculationType, {
      stepId,
      runInputHash,
      reviewFlowPhase,
      calculationSaved: draft.calculationType === "TRAFFIC_DEATH" ? fileSaved : calculationSaved,
      runResult,
      currentSavedCalculationId:
        draft.calculationType === "TRAFFIC_DEATH" || draft.calculationType === "TRAFFIC_INJURY"
          ? currentSavedCalculationId
          : null,
      savedDisplayName:
        draft.calculationType === "TRAFFIC_DEATH" || draft.calculationType === "TRAFFIC_INJURY"
          ? savedDisplayName
          : null,
      trafficDeathResultSnapshot:
        draft.calculationType === "TRAFFIC_DEATH" ? trafficDeathResultSnapshot : null,
      trafficDeathRunResult: draft.calculationType === "TRAFFIC_DEATH" ? trafficDeathRunResult : null,
    });
  }, [
    draft,
    stepId,
    runInputHash,
    reviewFlowPhase,
    calculationSaved,
    fileSaved,
    runResult,
    currentSavedCalculationId,
    savedDisplayName,
    trafficDeathResultSnapshot,
    trafficDeathRunResult,
  ]);

  const handleOpenSavedFiles = useCallback(() => {
    persistWizardSession();
    navigate("/kayitli-hesaplamalar");
  }, [persistWizardSession, navigate]);

  const isDashboardLayout = phase === "select";

  return (
    <div
      className={
        isDashboardLayout
          ? "min-h-[calc(100vh-0px)] bg-[#F5F7FA] pb-5"
          : "bg-slate-100 pb-3"
      }
    >
      <div className={`app-workspace ${isDashboardLayout ? "dashboard-workspace py-3 sm:py-4" : "py-3 sm:py-5"}`}>
        {legacyNotice && (
          <div className="mb-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 accent-warning-surface px-3.5 py-2.5 text-[13px] font-normal">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <span
                className="accent-icon-wrap h-7 w-7 shrink-0 rounded-full mt-0.5"
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
              className="shrink-0 self-stretch sm:self-center min-h-[40px] px-3 rounded-[10px] border border-brand-accent/30 bg-white text-[13px] font-medium text-[#8B4A12] hover:bg-brand-accent-soft"
              onClick={handleClearLegacy}
            >
              Eski taslağı temizle
            </button>
          </div>
        )}

        {apiMessage && (
          <div className="mb-3 accent-warning-surface px-3.5 py-2.5 text-[13px] font-normal">
            {apiMessage}
          </div>
        )}

        {phase === "select" || !draft ? (
          <CalculationTypeSelect
            onSelect={startType}
            onOpenSaved={openSavedCalculation}
            onViewAllSaved={() => navigate("/kayitli-hesaplamalar")}
            savedListVersion={savedListVersion}
          />
        ) : (
          <>
            {validationModal === "temp_incapacity_period_overlap" && (
              <TempIncapacityPeriodOverlapModal onClose={closeTrafficValidationModal} />
            )}
            {validationModal === "temp_incapacity_period_gap" &&
              draft.calculationType === "TRAFFIC_INJURY" && (
                <TempIncapacityPeriodGapModal
                  effectiveRange={computeEffectiveTemporaryRange(
                    draft.temporaryIncapacityPeriods
                  )}
                  onBack={closeTrafficValidationModal}
                  onConfirm={handleConfirmTempIncapacityIgnoreGaps}
                />
              )}
            {validationModal === "disability_start_date_required" && (
              <DisabilityStartDateRequiredModal onClose={closeTrafficValidationModal} />
            )}
            {validationModal === "temp_incapacity_start" && (
              <TempIncapacityStartModal onClose={closeTrafficValidationModal} />
            )}
            {validationModal === "temp_disability_continuity" && (
              <TempDisabilityGapModal
                errorCode={tempDisabilityModalCode}
                onClose={closeTrafficValidationModal}
              />
            )}
            <ActuarialWizard
            draft={draft}
            onDraftChange={handleDraftChange}
            stepId={stepId}
            onStepChange={handleStepChange}
            validation={validation}
            fieldErrors={fieldErrors}
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
            onValidate={handleValidate}
            onConfirmAndRun={handleConfirmAndRun}
            onDownloadWordReport={handleDownloadWordReport}
            canSaveCalculation={canSaveCalculation}
            onSaveCalculation={handleSaveCalculation}
            onSaveFile={
              draft.calculationType === "TRAFFIC_DEATH" || draft.calculationType === "TRAFFIC_INJURY"
                ? handleSaveFile
                : undefined
            }
            currentSavedCalculationId={currentSavedCalculationId}
            savedDisplayName={savedDisplayName}
            savingFile={savingFile}
            saveFileError={saveFileError}
            fileSaved={fileSaved}
            savingCalculation={savingCalculation}
            saveCalculationError={saveCalculationError}
            calculationSaved={calculationSaved}
            onSaveDraft={handleSaveDraft}
            onClearDraft={handleClearDraft}
            draftSaveStatus={draftSaveStatus}
            lastSavedAt={lastSavedAt}
            onChangeTypeRequest={handleChangeTypeRequest}
            onNewFile={handleNewFile}
            onOpenSavedFiles={handleOpenSavedFiles}
            onBeforeStepAdvance={handleBeforeStepAdvance}
            validationFieldHighlight={validationFieldHighlight}
            trafficDeathSupportResult={trafficDeathResultSnapshot}
            trafficDeathRunResult={trafficDeathRunResult}
            onTrafficDeathReport={handleTrafficDeathReport}
            trafficDeathReporting={trafficDeathReporting}
            onTrafficDeathSupportResult={handleTrafficDeathSupportResult}
          />
          <SaveFileNameModal
            open={saveFileModalOpen}
            initialName={savedDisplayName ?? ""}
            onClose={() => {
              setSaveFileModalOpen(false);
              if (leaveAfterSaveRef.current) {
                leaveAfterSaveRef.current = false;
                setUnsavedPromptOpen(true);
              }
            }}
            onConfirm={(name) => void performSaveNamedFile(name)}
            saving={savingFile}
            error={saveFileError}
          />
          <UnsavedChangesSheet
            open={unsavedPromptOpen}
            saving={savingFile}
            error={saveFileError}
            onExit={abandonCurrentFile}
            onSave={handleUnsavedSave}
            onDismiss={() => {
              leaveAfterSaveRef.current = false;
              setUnsavedPromptOpen(false);
            }}
          />
          </>
        )}
      </div>
    </div>
  );
}
