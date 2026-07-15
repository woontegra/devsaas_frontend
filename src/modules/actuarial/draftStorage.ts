import {
  CALCULATION_SCHEMA_VERSION,
  createEmptyDraft,
  type CalculationDraft,
  type CalculationType,
  type PlaintiffGender,
  type TrafficInjuryDraft,
} from "./types/calculationDraft";

export type DraftSaveStatus = "idle" | "saving" | "saved" | "error";

const KEYS: Record<CalculationType, string> = {
  TRAFFIC_INJURY: "actuarial-draft-traffic-injury-v2",
  TRAFFIC_DEATH: "actuarial-draft-traffic-death-v1",
  WORK_INJURY: "actuarial-draft-work-injury-v1",
  WORK_DEATH: "actuarial-draft-work-death-v1",
};

const TRAFFIC_INJURY_V1_KEY = "actuarial-draft-traffic-injury-v1";
const LEGACY_KEY = "actuarial_draft_v1";

export type DraftLoadResult =
  | { ok: true; draft: CalculationDraft }
  | { ok: false; reason: "missing" | "incompatible"; message: string };

export function storageKeyFor(type: CalculationType): string {
  return KEYS[type];
}

function splitFullName(fullName: string | undefined): { firstName: string; lastName: string } {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

function mapGender(g: unknown): PlaintiffGender {
  if (g === "female" || g === "FEMALE") return "FEMALE";
  if (g === "male" || g === "MALE") return "MALE";
  return "";
}

/** Eski gelir/gider alanlarını yeni Hesaplama Bilgileri modeline yumuşak geçir */
function coerceAccidentIncome(raw: Record<string, unknown>): TrafficInjuryDraft["accidentIncome"] {
  const existing = raw.accidentIncome as TrafficInjuryDraft["accidentIncome"] | undefined;
  if (existing && typeof existing === "object" && Array.isArray(existing.averageSources)) {
    return {
      fixedAmount: existing.fixedAmount ?? null,
      useAverage: Boolean(existing.useAverage),
      averageSources: existing.averageSources,
    };
  }
  const periods = Array.isArray(raw.incomePeriods) ? raw.incomePeriods : [];
  const first = periods[0] as { amount?: number } | undefined;
  return {
    fixedAmount: typeof first?.amount === "number" ? first.amount : null,
    useAverage: false,
    averageSources: [],
  };
}

function coerceExpenseList(raw: unknown): TrafficInjuryDraft["hospitalExpenses"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x) => x && typeof x === "object")
    .map((x) => {
      const row = x as { id?: string; name?: string; amount?: number };
      return {
        id: typeof row.id === "string" ? row.id : `exp-${Math.random().toString(36).slice(2, 8)}`,
        name: typeof row.name === "string" ? row.name : "",
        amount: typeof row.amount === "number" ? row.amount : 0,
      };
    });
}

function coerceCaregivers(raw: unknown): TrafficInjuryDraft["caregiverExpenses"] {
  if (Array.isArray(raw)) {
    return raw
      .filter((x) => x && typeof x === "object")
      .map((x) => {
        const row = x as {
          id?: string;
          startDate?: string;
          endDate?: string;
          amount?: number;
        };
        return {
          id: typeof row.id === "string" ? row.id : `cg-${Math.random().toString(36).slice(2, 8)}`,
          startDate: typeof row.startDate === "string" ? row.startDate : "",
          endDate: typeof row.endDate === "string" ? row.endDate : "",
          amount: typeof row.amount === "number" ? row.amount : 0,
        };
      });
  }
  return [];
}

function normalizeTrafficInjuryShape(raw: Record<string, unknown>): TrafficInjuryDraft {
  const base = createEmptyDraft("TRAFFIC_INJURY") as TrafficInjuryDraft;
  const care = raw.careAndExpenses as
    | {
        otherExpenses?: unknown;
        careStartDate?: string;
        careEndDate?: string;
        monthlyCareCost?: number;
        hospitalCost?: number;
        treatmentCost?: number;
      }
    | undefined;

  let hospitalExpenses = coerceExpenseList(raw.hospitalExpenses);
  let travelExpenses = coerceExpenseList(raw.travelExpenses);
  let caregiverExpenses = coerceCaregivers(raw.caregiverExpenses);

  if (hospitalExpenses.length === 0 && typeof care?.hospitalCost === "number" && care.hospitalCost > 0) {
    hospitalExpenses = [{ id: "migrated-hospital", name: "Hastane", amount: care.hospitalCost }];
  }
  if (hospitalExpenses.length === 0 && typeof care?.treatmentCost === "number" && care.treatmentCost > 0) {
    hospitalExpenses = [{ id: "migrated-treatment", name: "Tedavi", amount: care.treatmentCost }];
  }
  if (
    caregiverExpenses.length === 0 &&
    (care?.careStartDate || care?.careEndDate || typeof care?.monthlyCareCost === "number")
  ) {
    caregiverExpenses = [
      {
        id: "migrated-caregiver",
        startDate: care.careStartDate ?? "",
        endDate: care.careEndDate ?? "",
        amount: typeof care.monthlyCareCost === "number" ? care.monthlyCareCost : 0,
      },
    ];
  }
  if (hospitalExpenses.length === 0 && Array.isArray(care?.otherExpenses)) {
    hospitalExpenses = coerceExpenseList(care.otherExpenses);
  }

  return {
    ...base,
    common: (raw.common as TrafficInjuryDraft["common"]) ?? base.common,
    parties:
      (raw.parties as TrafficInjuryDraft["parties"]) ?? base.parties,
    liability: (raw.liability as TrafficInjuryDraft["liability"]) ?? base.liability,
    disability: (raw.disability as TrafficInjuryDraft["disability"]) ?? {},
    temporaryIncapacityPeriods: Array.isArray(raw.temporaryIncapacityPeriods)
      ? (raw.temporaryIncapacityPeriods as TrafficInjuryDraft["temporaryIncapacityPeriods"])
      : [],
    accidentIncome: coerceAccidentIncome(raw),
    hospitalExpenses,
    travelExpenses,
    caregiverExpenses,
    schemaVersion: CALCULATION_SCHEMA_VERSION,
  };
}

/** v1 injuredPerson → v2 parties (güvenli map; sessiz kayıp yok) */
function migrateTrafficInjuryV1(raw: Record<string, unknown>): DraftLoadResult {
  const injured = raw.injuredPerson as
    | { fullName?: string; birthDate?: string; gender?: string }
    | undefined;
  if (!injured || typeof injured !== "object") {
    return {
      ok: false,
      reason: "incompatible",
      message:
        "Eski trafik yaralanma taslağı yeni taraf bilgileri yapısıyla uyumlu değil. Yeni bir taslak başlatmanız gerekiyor.",
    };
  }

  const { firstName, lastName } = splitFullName(injured.fullName);
  const migrated = normalizeTrafficInjuryShape({
    ...raw,
    parties: {
      plaintiff: {
        firstName,
        lastName,
        birthDate: typeof injured.birthDate === "string" ? injured.birthDate : "",
        gender: mapGender(injured.gender),
      },
      defendants: [],
    },
  });

  return { ok: true, draft: migrated };
}

function isTrafficInjuryV2(parsed: CalculationDraft): parsed is TrafficInjuryDraft {
  return (
    parsed.calculationType === "TRAFFIC_INJURY" &&
    "parties" in parsed &&
    Boolean((parsed as TrafficInjuryDraft).parties?.plaintiff)
  );
}

function normalizeTrafficInjuryParties(draft: TrafficInjuryDraft): TrafficInjuryDraft {
  const parties = draft.parties as TrafficInjuryDraft["parties"] & {
    defendantTypes?: string[];
  };
  const withParties: TrafficInjuryDraft = Array.isArray(parties.defendants)
    ? {
        ...draft,
        parties: {
          plaintiff: parties.plaintiff,
          defendants: parties.defendants,
        },
      }
    : {
        ...draft,
        parties: {
          plaintiff: parties.plaintiff,
          defendants: [],
        },
      };

  return normalizeTrafficInjuryShape(withParties as unknown as Record<string, unknown>);
}

export function loadDraftForType(type: CalculationType): DraftLoadResult {
  try {
    if (type === "TRAFFIC_INJURY") {
      const rawV2 = sessionStorage.getItem(KEYS.TRAFFIC_INJURY);
      if (rawV2) {
        const parsed = JSON.parse(rawV2) as CalculationDraft;
        if (
          parsed &&
          parsed.calculationType === "TRAFFIC_INJURY" &&
          parsed.schemaVersion === CALCULATION_SCHEMA_VERSION &&
          parsed.common &&
          isTrafficInjuryV2(parsed)
        ) {
          return { ok: true, draft: normalizeTrafficInjuryParties(parsed) };
        }
        return {
          ok: false,
          reason: "incompatible",
          message:
            "Eski trafik yaralanma taslağı yeni taraf bilgileri yapısıyla uyumlu değil. Yeni bir taslak başlatmanız gerekiyor.",
        };
      }

      const rawV1 = sessionStorage.getItem(TRAFFIC_INJURY_V1_KEY);
      if (rawV1) {
        const parsed = JSON.parse(rawV1) as Record<string, unknown>;
        const migrated = migrateTrafficInjuryV1(parsed);
        if (migrated.ok) {
          try {
            sessionStorage.setItem(KEYS.TRAFFIC_INJURY, JSON.stringify(migrated.draft));
            sessionStorage.removeItem(TRAFFIC_INJURY_V1_KEY);
          } catch {
            // ignore
          }
        }
        return migrated;
      }

      return { ok: false, reason: "missing", message: "Taslak yok." };
    }

    const raw = sessionStorage.getItem(KEYS[type]);
    if (!raw) return { ok: false, reason: "missing", message: "Taslak yok." };
    const parsed = JSON.parse(raw) as CalculationDraft;
    if (!parsed || parsed.calculationType !== type || !parsed.common) {
      return {
        ok: false,
        reason: "incompatible",
        message:
          "Eski taslak yeni form yapısıyla uyumlu değil. Yeni bir taslak başlatmanız gerekiyor.",
      };
    }
    if (parsed.schemaVersion === 1 || parsed.schemaVersion === CALCULATION_SCHEMA_VERSION) {
      return {
        ok: true,
        draft: { ...parsed, schemaVersion: CALCULATION_SCHEMA_VERSION } as CalculationDraft,
      };
    }
    return {
      ok: false,
      reason: "incompatible",
      message:
        "Eski taslak yeni form yapısıyla uyumlu değil. Yeni bir taslak başlatmanız gerekiyor.",
    };
  } catch {
    return {
      ok: false,
      reason: "incompatible",
      message:
        "Eski taslak yeni form yapısıyla uyumlu değil. Yeni bir taslak başlatmanız gerekiyor.",
    };
  }
}

export function saveDraftToSession(draft: CalculationDraft): void {
  try {
    sessionStorage.setItem(KEYS[draft.calculationType], JSON.stringify(draft));
  } catch {
    // ignore
  }
}

export function clearDraftForType(type: CalculationType): void {
  try {
    sessionStorage.removeItem(KEYS[type]);
    if (type === "TRAFFIC_INJURY") sessionStorage.removeItem(TRAFFIC_INJURY_V1_KEY);
  } catch {
    // ignore
  }
}

export function clearLegacyDraft(): void {
  try {
    sessionStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore
  }
}

export function clearAllDrafts(): void {
  (Object.keys(KEYS) as CalculationType[]).forEach(clearDraftForType);
  clearLegacyDraft();
}

export function detectLegacyDraft(): boolean {
  try {
    return sessionStorage.getItem(LEGACY_KEY) != null;
  } catch {
    return false;
  }
}
