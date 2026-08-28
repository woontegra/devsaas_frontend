import {
  CALCULATION_SCHEMA_VERSION,
  createEmptyDraft,
  type CalculationDraft,
  type CalculationType,
  type PlaintiffGender,
  type TrafficInjuryDraft,
  type InsuranceGarameEntry,
  type InsurancePaymentRecord,
  newId,
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
  const existing = raw.accidentIncome as
    | (TrafficInjuryDraft["accidentIncome"] & { useAverage?: boolean })
    | undefined;

  if (existing && typeof existing === "object" && Array.isArray(existing.averageSources)) {
    let mode = existing.incomeMode;
    if (!mode) {
      mode = existing.useAverage ? "average" : (existing.fixedAmount != null ? "fixed" : "minWage");
    }
    return {
      incomeMode: mode,
      fixedAmount: existing.fixedAmount ?? null,
      averageSources: existing.averageSources,
      ...(existing.averageNetResult != null ? { averageNetResult: existing.averageNetResult } : {}),
    };
  }

  const periods = Array.isArray(raw.incomePeriods) ? raw.incomePeriods : [];
  const first = periods[0] as { amount?: number } | undefined;
  const hasAmount = typeof first?.amount === "number" && first.amount > 0;
  return {
    incomeMode: hasAmount ? "fixed" : "minWage",
    fixedAmount: hasAmount ? (first!.amount ?? null) : null,
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

function coerceGarameEntry(raw: unknown): InsuranceGarameEntry {
  if (!raw || typeof raw !== "object") {
    return { id: newId(), subjectRef: "plaintiff" };
  }
  const r = raw as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
  const legacyLabel =
    typeof r.personLabel === "string" && r.personLabel.trim() ? r.personLabel.trim() : undefined;
  const externalPersonLabel =
    typeof r.externalPersonLabel === "string" && r.externalPersonLabel.trim()
      ? r.externalPersonLabel.trim()
      : legacyLabel;
  const subjectRef = r.subjectRef === "plaintiff" ? "plaintiff" : undefined;

  return {
    id: typeof r.id === "string" ? r.id : newId(),
    subjectRef: subjectRef ?? (externalPersonLabel ? undefined : "plaintiff"),
    externalPersonLabel: subjectRef ? undefined : externalPersonLabel,
    claimAmount: num(r.claimAmount),
    garameBasisAmount: num(r.garameBasisAmount),
    garameRatio: num(r.garameRatio),
    accidentLimitShare: num(r.accidentLimitShare),
    payableAfterPersonLimit: num(r.payableAfterPersonLimit),
  };
}

function findDefendantId(
  defendants: TrafficInjuryDraft["parties"]["defendants"],
  type: "COMPULSORY_TRAFFIC_INSURER" | "CASCO_INSURER"
): string | undefined {
  const matches = defendants.filter((d) => d.type === type);
  return matches.length === 1 ? matches[0]!.id : undefined;
}

function coerceInsurancePaymentRecord(
  raw: unknown,
  defendants: TrafficInjuryDraft["parties"]["defendants"],
  insurerType: "COMPULSORY_TRAFFIC_INSURER" | "CASCO_INSURER"
): InsurancePaymentRecord {
  if (!raw || typeof raw !== "object") {
    return {
      id: newId(),
      paymentDate: "",
      paymentAmount: 0,
      liabilityLimit: 0,
      accidentLimit: 0,
      defendantId: findDefendantId(defendants, insurerType),
      garameEntries: [],
      garameEnabled: false,
    };
  }
  const r = raw as Record<string, unknown>;
  const defendantId =
    typeof r.defendantId === "string" && r.defendantId.trim()
      ? r.defendantId.trim()
      : findDefendantId(defendants, insurerType);
  return {
    id: typeof r.id === "string" ? r.id : newId(),
    paymentDate: typeof r.paymentDate === "string" ? r.paymentDate : "",
    paymentAmount: typeof r.paymentAmount === "number" ? r.paymentAmount : 0,
    liabilityLimit: typeof r.liabilityLimit === "number" ? r.liabilityLimit : 0,
    accidentLimit: typeof r.accidentLimit === "number" ? r.accidentLimit : 0,
    ...(defendantId ? { defendantId } : {}),
    garameEntries: Array.isArray(r.garameEntries)
      ? r.garameEntries.map(coerceGarameEntry)
      : [],
    garameEnabled: r.garameEnabled === true,
  };
}

function coerceInsurancePayments(
  raw: unknown,
  defendants: TrafficInjuryDraft["parties"]["defendants"],
  insurerType: "COMPULSORY_TRAFFIC_INSURER" | "CASCO_INSURER"
): InsurancePaymentRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => coerceInsurancePaymentRecord(row, defendants, insurerType));
}

function ensureDefendantIds(
  defendants: TrafficInjuryDraft["parties"]["defendants"]
): TrafficInjuryDraft["parties"]["defendants"] {
  return defendants.map((d) => (d.id ? d : { ...d, id: newId() }));
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

  const partiesRaw = (raw.parties as TrafficInjuryDraft["parties"]) ?? base.parties;
  const parties: TrafficInjuryDraft["parties"] = {
    ...partiesRaw,
    defendants: ensureDefendantIds(partiesRaw.defendants ?? []),
  };

  return {
    ...base,
    common: (raw.common as TrafficInjuryDraft["common"]) ?? base.common,
    parties,
    liability: (raw.liability as TrafficInjuryDraft["liability"]) ?? base.liability,
    disability: (raw.disability as TrafficInjuryDraft["disability"]) ?? {},
    temporaryIncapacityPeriods: Array.isArray(raw.temporaryIncapacityPeriods)
      ? (raw.temporaryIncapacityPeriods as TrafficInjuryDraft["temporaryIncapacityPeriods"])
      : [],
    accidentIncome: coerceAccidentIncome(raw),
    hospitalExpenses,
    travelExpenses,
    caregiverExpenses,
    capitalValueDocuments: Array.isArray(raw.capitalValueDocuments)
      ? (raw.capitalValueDocuments as TrafficInjuryDraft["capitalValueDocuments"])
      : [],
    zmtsPayments: coerceInsurancePayments(
      raw.zmtsPayments,
      parties.defendants,
      "COMPULSORY_TRAFFIC_INSURER"
    ),
    cascoPayments: coerceInsurancePayments(raw.cascoPayments, parties.defendants, "CASCO_INSURER"),
    ...(typeof raw.passivePhaseAge === "number" ? { passivePhaseAge: raw.passivePhaseAge } : {}),
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
