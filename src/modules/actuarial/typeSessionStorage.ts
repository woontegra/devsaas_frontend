import {
  createEmptyDraft,
  type CalculationDraft,
  type CalculationType,
} from "./types/calculationDraft";
import type { TrafficDeathSupportPeriodsResponse } from "./types/trafficDeathSupportPeriods";
import type { ReviewFlowPhase } from "./types/calculationReviewSummary";
import type { TrafficInjuryCalculationResult } from "./types/trafficInjuryResult";
import type { TrafficDeathCalculationResult } from "./types/trafficDeathResult";
import { getWizardSteps, resolveWizardStepId } from "./wizard/configs";
import {
  normalizeTrafficDeathCalculationResult,
  normalizeTrafficDeathSupportSnapshot,
} from "./results/capTrafficDeathToDeceasedLifeEnd";

const SESSION_KEYS: Record<import("./types/calculationDraft").CalculationType, string> = {
  TRAFFIC_INJURY: "actuarial-session-traffic-injury-v1",
  /** v3: inclusive deceased life-end (07.02.2031 dönem sonu) — exclusive 06.02 snapshot’larını düşür */
  TRAFFIC_DEATH: "actuarial-session-traffic-death-v3",
  WORK_INJURY: "actuarial-session-work-injury-v1",
  WORK_DEATH: "actuarial-session-work-death-v1",
};

/** Session/saved sonuçlarının inclusive life-end ile uyumlu olduğunu işaretler */
export const TRAFFIC_DEATH_LIFE_END_EPOCH = "actuarial30-inclusive-v1";

export interface TypeSessionSnapshot {
  stepId: string;
  runInputHash: string | null;
  reviewFlowPhase: ReviewFlowPhase;
  calculationSaved: boolean;
  runResult: TrafficInjuryCalculationResult | null;
  /** Kalıcı kayıt id — TRAFFIC_INJURY / TRAFFIC_DEATH */
  currentSavedCalculationId?: string | null;
  savedDisplayName?: string | null;
  trafficDeathResultSnapshot?: TrafficDeathSupportPeriodsResponse | null;
  trafficDeathRunResult?: TrafficDeathCalculationResult | null;
  /** actuarial30 epoch — yoksa cached death result güvenilmez */
  trafficDeathLifeEndEpoch?: string | null;
}

export function typeSessionStorageKeyFor(type: import("./types/calculationDraft").CalculationType): string {
  return SESSION_KEYS[type];
}

export function defaultTypeSession(type: import("./types/calculationDraft").CalculationType): TypeSessionSnapshot {
  const steps = getWizardSteps(type);
  return {
    stepId: resolveWizardStepId(type, steps[0]?.id ?? "parties"),
    runInputHash: null,
    reviewFlowPhase: "idle",
    calculationSaved: false,
    runResult: null,
    currentSavedCalculationId: null,
    savedDisplayName: null,
    trafficDeathResultSnapshot: null,
    trafficDeathRunResult: null,
    trafficDeathLifeEndEpoch: null,
  };
}

function parseReviewFlowPhase(value: unknown): ReviewFlowPhase {
  if (value === "inputReview" || value === "result") return value;
  return "idle";
}

export function loadTypeSession(type: import("./types/calculationDraft").CalculationType): TypeSessionSnapshot {
  const defaults = defaultTypeSession(type);
  try {
    const raw = sessionStorage.getItem(SESSION_KEYS[type]);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<TypeSessionSnapshot>;
    const base: TypeSessionSnapshot = {
      stepId: resolveWizardStepId(
        type,
        typeof parsed.stepId === "string" ? parsed.stepId : defaults.stepId
      ),
      runInputHash: typeof parsed.runInputHash === "string" ? parsed.runInputHash : null,
      reviewFlowPhase: parseReviewFlowPhase(parsed.reviewFlowPhase),
      calculationSaved: parsed.calculationSaved === true,
      runResult:
        type === "TRAFFIC_INJURY" && parsed.runResult && typeof parsed.runResult === "object"
          ? (parsed.runResult as TrafficInjuryCalculationResult)
          : null,
    };
    if (type === "TRAFFIC_DEATH" || type === "TRAFFIC_INJURY") {
      base.currentSavedCalculationId =
        typeof parsed.currentSavedCalculationId === "string"
          ? parsed.currentSavedCalculationId
          : null;
      base.savedDisplayName =
        typeof parsed.savedDisplayName === "string" ? parsed.savedDisplayName : null;
    }
    if (type === "TRAFFIC_DEATH") {
      const epochOk = parsed.trafficDeathLifeEndEpoch === TRAFFIC_DEATH_LIFE_END_EPOCH;
      base.trafficDeathLifeEndEpoch = epochOk ? TRAFFIC_DEATH_LIFE_END_EPOCH : null;
      if (!epochOk) {
        // Eski calendar-era (ör. 06.02.2031) session sonuçlarını UI’ya basma
        base.trafficDeathRunResult = null;
        base.trafficDeathResultSnapshot = null;
        if (base.reviewFlowPhase === "result") {
          base.reviewFlowPhase = "idle";
        }
      } else {
        const rawSnap =
          parsed.trafficDeathResultSnapshot && typeof parsed.trafficDeathResultSnapshot === "object"
            ? (parsed.trafficDeathResultSnapshot as TrafficDeathSupportPeriodsResponse)
            : null;
        const rawRun =
          parsed.trafficDeathRunResult &&
          typeof parsed.trafficDeathRunResult === "object" &&
          (parsed.trafficDeathRunResult as TrafficDeathCalculationResult).calculationType ===
            "TRAFFIC_DEATH"
            ? (parsed.trafficDeathRunResult as TrafficDeathCalculationResult)
            : null;
        const cappedRun = rawRun ? normalizeTrafficDeathCalculationResult(rawRun) : null;
        base.trafficDeathRunResult = cappedRun;
        base.trafficDeathResultSnapshot = cappedRun
          ? {
              shareRatioPeriods: cappedRun.shareRatioPeriods,
              personLives: cappedRun.personLives,
              columnKeys: cappedRun.columnKeys,
              periods: cappedRun.supportPeriods,
              valid: true,
            }
          : rawSnap
            ? {
                ...rawSnap,
                ...normalizeTrafficDeathSupportSnapshot({
                  shareRatioPeriods: rawSnap.shareRatioPeriods,
                  personLives: rawSnap.personLives,
                  periods: rawSnap.periods,
                  columnKeys: rawSnap.columnKeys,
                  valid: rawSnap.valid,
                }),
              }
            : null;
      }
    }
    return base;
  } catch {
    return defaults;
  }
}

export function saveTypeSession(
  type: import("./types/calculationDraft").CalculationType,
  snapshot: TypeSessionSnapshot
): void {
  try {
    const payload: TypeSessionSnapshot = {
      stepId: snapshot.stepId,
      runInputHash: snapshot.runInputHash,
      reviewFlowPhase: snapshot.reviewFlowPhase,
      calculationSaved: snapshot.calculationSaved,
      runResult: type === "TRAFFIC_INJURY" ? snapshot.runResult : null,
    };
    if (type === "TRAFFIC_DEATH" || type === "TRAFFIC_INJURY") {
      payload.currentSavedCalculationId = snapshot.currentSavedCalculationId ?? null;
      payload.savedDisplayName = snapshot.savedDisplayName ?? null;
    }
    if (type === "TRAFFIC_DEATH") {
      payload.trafficDeathResultSnapshot = snapshot.trafficDeathResultSnapshot ?? null;
      payload.trafficDeathRunResult = snapshot.trafficDeathRunResult ?? null;
      payload.trafficDeathLifeEndEpoch =
        snapshot.trafficDeathRunResult || snapshot.trafficDeathResultSnapshot
          ? TRAFFIC_DEATH_LIFE_END_EPOCH
          : null;
    }
    sessionStorage.setItem(SESSION_KEYS[type], JSON.stringify(payload));
  } catch {
    // ignore quota / privacy mode
  }
}

const CLEAN_DRAFT_FP_PREFIX = "actuarial-clean-draft-fp-";

export function draftFingerprint(draft: CalculationDraft): string {
  return JSON.stringify(draft);
}

/** Temiz kabul edilen girdi parmak izi. Kayıt veya boş taslak bunu yazar; düzenleme yazmaz. */
export function loadCleanDraftFingerprint(type: CalculationType): string | null {
  try {
    return sessionStorage.getItem(CLEAN_DRAFT_FP_PREFIX + type);
  } catch {
    return null;
  }
}

export function saveCleanDraftFingerprint(type: CalculationType, fingerprint: string): void {
  try {
    sessionStorage.setItem(CLEAN_DRAFT_FP_PREFIX + type, fingerprint);
  } catch {
    // ignore quota
  }
}

export function calculationHasUnsavedChanges(
  draft: CalculationDraft,
  cleanFingerprint: string | null
): boolean {
  const current = draftFingerprint(draft);
  if (!cleanFingerprint) {
    return current !== draftFingerprint(createEmptyDraft(draft.calculationType));
  }
  return current !== cleanFingerprint;
}

export function clearTypeSession(type: import("./types/calculationDraft").CalculationType): void {
  try {
    sessionStorage.removeItem(SESSION_KEYS[type]);
    sessionStorage.removeItem(CLEAN_DRAFT_FP_PREFIX + type);
  } catch {
    // ignore
  }
}

export function clearAllTypeSessions(): void {
  (Object.keys(SESSION_KEYS) as import("./types/calculationDraft").CalculationType[]).forEach(
    clearTypeSession
  );
}
