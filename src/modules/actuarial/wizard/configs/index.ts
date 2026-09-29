import type { CalculationType } from "../../types/calculationDraft";
import type { WizardStepConfig } from "../shared/wizardTypes";
import { trafficInjurySteps } from "./trafficInjuryConfig.tsx";
import { trafficDeathSteps } from "./trafficDeathConfig.tsx";
import { workInjurySteps } from "./workInjuryConfig.tsx";
import { workDeathSteps } from "./workDeathConfig.tsx";

/** Eski TRAFFIC_DEATH sihirbaz adımları (caseEvent kaldırılmadan önce). */
const TRAFFIC_DEATH_LEGACY_STEP_IDS = [
  "caseEvent",
  "deceased",
  "income",
  "beneficiaries",
  "supportRelations",
  "liability",
  "deathExpenses",
  "priorPayments",
  "review",
] as const;

/**
 * İki indirim adımı eklenmeden önceki TRAFFIC_DEATH sırası.
 * 1 tabanlı gösterim, Kontrol ve Ödeme dahil: 5 gider, 6 ödeme, 7 kontrol.
 */
const TRAFFIC_DEATH_BEFORE_DEDUCTION_STEP_IDS = [
  "deceased",
  "beneficiaries",
  "supportRelations",
  "liability",
  "deathExpenses",
  "priorPayments",
  "review",
] as const;

export function getWizardSteps(type: CalculationType): WizardStepConfig[] {
  switch (type) {
    case "TRAFFIC_INJURY":
      return trafficInjurySteps;
    case "TRAFFIC_DEATH":
      return trafficDeathSteps;
    case "WORK_INJURY":
      return workInjurySteps;
    case "WORK_DEATH":
      return workDeathSteps;
  }
}

/** Eski/kaldırılmış adım kimliklerini güncel sihirbaz adımına eşler. */
export function resolveWizardStepId(type: CalculationType, stepId: string): string {
  const steps = getWizardSteps(type);
  const validIds = new Set([...steps.map((s) => s.id), "review"]);

  if (type === "TRAFFIC_DEATH" && (stepId === "caseEvent" || stepId === "income")) {
    return "deceased";
  }
  if (type === "TRAFFIC_DEATH" && /^\d+$/.test(stepId)) {
    const mapped = TRAFFIC_DEATH_BEFORE_DEDUCTION_STEP_IDS[Number(stepId) - 1];
    if (mapped) return mapped;
  }
  if (validIds.has(stepId)) {
    return stepId;
  }
  return steps[0]?.id ?? stepId;
}

/**
 * Eski TRAFFIC_DEATH adım indeksini (0 tabanlı, review dahil) güncel stepId'ye çevirir.
 * Örn. eski indeks 1 (Müteveffa) → "deceased", eski indeks 0 (Dosya ve Olay) → "deceased".
 */
export function resolveTrafficDeathLegacyStepIndex(legacyIndex: number): string {
  const legacyId = TRAFFIC_DEATH_LEGACY_STEP_IDS[legacyIndex];
  if (!legacyId) {
    return trafficDeathSteps[0]?.id ?? "deceased";
  }
  return resolveWizardStepId("TRAFFIC_DEATH", legacyId);
}

/** Eski 7 adımlı (1 tabanlı) TRAFFIC_DEATH indeksini aynı sayfaya taşır. 5→gider, 6→ödeme, 7→kontrol. */
export function resolveTrafficDeathBeforeDeductionStepIndex(oneBasedIndex: number): string {
  const id = TRAFFIC_DEATH_BEFORE_DEDUCTION_STEP_IDS[oneBasedIndex - 1];
  if (!id) return trafficDeathSteps[0]?.id ?? "deceased";
  return resolveWizardStepId("TRAFFIC_DEATH", id);
}
