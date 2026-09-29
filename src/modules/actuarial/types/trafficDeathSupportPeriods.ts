import type { TrafficDeathShareRatioPeriod } from "./trafficDeathShareRatios";

export interface TrafficDeathSupportPeriodsResponse {
  valid?: boolean;
  periods?: unknown[];
  shareRatioPeriods?: TrafficDeathShareRatioPeriod[];
  columnKeys?: Array<{ key: string; header: string; subLabel?: string; synthetic?: boolean }>;
  personLives?: unknown[];
  warnings?: Array<{ code: string; message: string }>;
  errors?: string[];
}

export interface TrafficDeathPersonLife {
  personId: string;
  role: string;
  birthDate: string;
  ageAtAccident?: { years: number; months: number; days: number } | null;
  gender: "male" | "female" | "";
  remainingLifetime: {
    years: number;
    months: number;
    days: number;
    decimalYears: number | null;
  };
  probableLifeEndDate: string | null;
  supportEndDate?: string | null;
  effectiveSupportEndDate?: string | null;
  supportActiveAtAnchor?: boolean;
}

export function isUsableTrafficDeathPayResult(
  source: unknown
): source is TrafficDeathSupportPeriodsResponse {
  if (!source || typeof source !== "object") return false;
  const periods = (source as TrafficDeathSupportPeriodsResponse).shareRatioPeriods;
  return Array.isArray(periods) && periods.length > 0;
}

function readAgeAtAccident(raw: unknown): { years: number; months: number; days: number } | null {
  if (!raw || typeof raw !== "object") return null;
  const age = raw as { years?: unknown; months?: unknown; days?: unknown };
  if (
    typeof age.years === "number" &&
    typeof age.months === "number" &&
    typeof age.days === "number" &&
    Number.isFinite(age.years) &&
    Number.isFinite(age.months) &&
    Number.isFinite(age.days)
  ) {
    return { years: age.years, months: age.months, days: age.days };
  }
  return null;
}

export function coercePersonLives(raw: unknown): TrafficDeathPersonLife[] {
  if (!Array.isArray(raw)) return [];
  const out: TrafficDeathPersonLife[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    const personId = typeof item.personId === "string" ? item.personId : "";
    if (!personId) continue;
    const life = item.remainingLifetime && typeof item.remainingLifetime === "object"
      ? (item.remainingLifetime as Record<string, unknown>)
      : {};
    const years = typeof life.years === "number" ? life.years : 0;
    const months = typeof life.months === "number" ? life.months : 0;
    const days = typeof life.days === "number" ? life.days : 0;
    const decimalYears = typeof life.decimalYears === "number" ? life.decimalYears : null;
    out.push({
      personId,
      role: typeof item.role === "string" ? item.role : "",
      birthDate: typeof item.birthDate === "string" ? item.birthDate : "",
      ageAtAccident: readAgeAtAccident(item.ageAtAccident),
      gender: item.gender === "female" || item.gender === "male" ? item.gender : "",
      remainingLifetime: { years, months, days, decimalYears },
      probableLifeEndDate: typeof item.probableLifeEndDate === "string" ? item.probableLifeEndDate : null,
      supportEndDate: typeof item.supportEndDate === "string" ? item.supportEndDate : null,
      effectiveSupportEndDate:
        typeof item.effectiveSupportEndDate === "string" ? item.effectiveSupportEndDate : null,
      supportActiveAtAnchor: typeof item.supportActiveAtAnchor === "boolean" ? item.supportActiveAtAnchor : undefined,
    });
  }
  return out;
}

