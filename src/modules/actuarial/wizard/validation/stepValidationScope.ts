import type { CalculationType } from "../../types/calculationDraft";
import type { ValidationIssue } from "../../types/calculationDraft";

/**
 * Maps wizard step id → backend field prefixes / missingSection keys.
 * Derived from backend validate*Draft section tables — not a second rule engine.
 */
export interface StepValidationScope {
  stepId: string;
  /** Field path prefixes belonging to this step */
  prefixes: string[];
  /** missingSections keys that block leaving this step */
  missingKeys: string[];
}

const SCOPES: Record<CalculationType, Record<string, StepValidationScope>> = {
  TRAFFIC_DEATH: {
    deceased: {
      stepId: "deceased",
      prefixes: [
        "deceased",
        "person",
        "common",
        "incomePeriods",
        "employmentStatus",
        "accidentIncome",
        "nonWorkingSelectedIncome",
      ],
      missingKeys: ["deceased"],
    },
    beneficiaries: {
      stepId: "beneficiaries",
      prefixes: ["beneficiaries"],
      missingKeys: ["beneficiaries"],
    },
    supportRelations: {
      stepId: "supportRelations",
      prefixes: ["supportRelations"],
      missingKeys: [],
    },
    liability: {
      stepId: "liability",
      prefixes: ["liability", "deceasedFaultRate", "responsibleParties", "externalFaultRate"],
      missingKeys: ["liability"],
    },
    marriageProbabilityDeduction: {
      stepId: "marriageProbabilityDeduction",
      prefixes: ["marriageProbabilityDeduction"],
      missingKeys: [],
    },
    educationExpenseDeduction: {
      stepId: "educationExpenseDeduction",
      prefixes: ["educationExpenseDeduction"],
      missingKeys: [],
    },
    deathExpenses: {
      stepId: "deathExpenses",
      prefixes: ["deathExpenses"],
      missingKeys: [],
    },
    priorPayments: {
      stepId: "priorPayments",
      prefixes: [
        "priorPayments",
        "capitalValueDocuments",
        "sosyalYardimOdenekleri",
        "zmtsPayments",
        "cascoPayments",
      ],
      missingKeys: [],
    },
  },
  TRAFFIC_INJURY: {
    parties: {
      stepId: "parties",
      prefixes: ["parties"],
      missingKeys: ["parties"],
    },
    calculationInfo: {
      stepId: "calculationInfo",
      prefixes: [
        "common",
        "liability",
        "disability",
        "temporaryIncapacityPeriods",
        "accidentIncome",
        "hospitalExpenses",
        "travelExpenses",
        "caregiverExpenses",
      ],
      missingKeys: ["calculationInfo"],
    },
    lifeExpectancy: {
      stepId: "lifeExpectancy",
      prefixes: [
        "passivePhaseAge",
        "capitalValueDocuments",
        "sosyalYardimOdenekleri",
        "zmtsPayments",
        "cascoPayments",
      ],
      missingKeys: ["lifeExpectancy"],
    },
  },
  WORK_INJURY: {
    caseEvent: {
      stepId: "caseEvent",
      // Employment is edited on the same screen (CaseAndWork)
      prefixes: ["common", "employment"],
      missingKeys: ["caseEvent", "employment"],
    },
    employee: {
      stepId: "employee",
      prefixes: ["employee", "person"],
      missingKeys: ["employee"],
    },
    income: {
      stepId: "income",
      prefixes: ["incomePeriods"],
      missingKeys: ["income"],
    },
    liability: {
      stepId: "liability",
      prefixes: ["liability"],
      missingKeys: ["liability"],
    },
    disability: {
      stepId: "disability",
      prefixes: ["disability", "temporaryIncapacityPeriods"],
      missingKeys: ["disability"],
    },
    sgkIncome: {
      stepId: "sgkIncome",
      prefixes: ["sgkIncome"],
      missingKeys: [],
    },
    capitalValueDocuments: {
      stepId: "capitalValueDocuments",
      prefixes: ["capitalValueDocuments"],
      missingKeys: [],
    },
    careAndExpenses: {
      stepId: "careAndExpenses",
      prefixes: ["careAndExpenses"],
      missingKeys: [],
    },
    priorPayments: {
      stepId: "priorPayments",
      prefixes: ["priorPayments"],
      missingKeys: [],
    },
  },
  WORK_DEATH: {
    caseEvent: {
      stepId: "caseEvent",
      prefixes: ["common", "employment"],
      missingKeys: ["caseEvent", "employment"],
    },
    deceasedEmployee: {
      stepId: "deceasedEmployee",
      prefixes: ["deceasedEmployee", "person"],
      missingKeys: ["deceasedEmployee"],
    },
    income: {
      stepId: "income",
      prefixes: ["incomePeriods"],
      missingKeys: ["income"],
    },
    beneficiaries: {
      stepId: "beneficiaries",
      prefixes: ["beneficiaries"],
      missingKeys: ["beneficiaries"],
    },
    supportRelations: {
      stepId: "supportRelations",
      prefixes: ["supportRelations"],
      missingKeys: [],
    },
    liability: {
      stepId: "liability",
      prefixes: ["liability"],
      missingKeys: ["liability"],
    },
    sgkDeathIncomes: {
      stepId: "sgkDeathIncomes",
      prefixes: ["sgkDeathIncomes"],
      missingKeys: [],
    },
    capitalValueDocuments: {
      stepId: "capitalValueDocuments",
      prefixes: ["capitalValueDocuments"],
      missingKeys: [],
    },
    expenses: {
      stepId: "expenses",
      prefixes: ["expenses", "priorPayments"],
      missingKeys: [],
    },
  },
};

export function getStepValidationScope(
  calculationType: CalculationType,
  stepId: string
): StepValidationScope | null {
  if (stepId === "review") return null;
  return SCOPES[calculationType]?.[stepId] ?? null;
}

function fieldMatchesPrefix(field: string, prefix: string): boolean {
  return field === prefix || field.startsWith(`${prefix}.`) || field.startsWith(`${prefix}[`);
}

export function filterErrorsForStep(
  errors: ValidationIssue[],
  scope: StepValidationScope | null
): ValidationIssue[] {
  if (!scope) return errors;
  return errors.filter((e) => scope.prefixes.some((p) => fieldMatchesPrefix(e.field, p)));
}

export function isStepBlockedByValidation(
  errors: ValidationIssue[],
  missingSections: string[],
  scope: StepValidationScope | null
): { blocked: boolean; stepErrors: ValidationIssue[] } {
  if (!scope) return { blocked: false, stepErrors: [] };
  const stepErrors = filterErrorsForStep(errors, scope);
  const missingHit = scope.missingKeys.some((k) => missingSections.includes(k));
  return { blocked: stepErrors.length > 0 || missingHit, stepErrors };
}

/** Map a missingSections entry to the wizard step that owns it. */
export function resolveStepIdForMissingSection(
  calculationType: CalculationType,
  missingSection: string
): string | null {
  const map = SCOPES[calculationType];
  if (!map) return null;
  if (map[missingSection]) return missingSection;
  for (const scope of Object.values(map)) {
    if (scope.missingKeys.includes(missingSection)) return scope.stepId;
  }
  return null;
}
