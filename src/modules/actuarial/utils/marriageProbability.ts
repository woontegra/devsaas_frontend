import { calendarAgeAtEvent, completedCalendarAgeYears, type CalendarAgeYmd } from "./calendarAge";

export const MARRIAGE_CHILD_COUNT_MAX = 20;
export const MARRIAGE_CHILD_RATE_POINTS = 5;

export const MARRIAGE_PROBABILITY_BANDS = [
  { key: "17-20", minAge: 17, maxAge: 20, female: 52, male: 92, label: "17-20 yaş arası" },
  { key: "21-25", minAge: 21, maxAge: 25, female: 40, male: 71, label: "21-25 yaş arası" },
  { key: "26-30", minAge: 26, maxAge: 30, female: 27, male: 48, label: "26-30 yaş arası" },
  { key: "31-35", minAge: 31, maxAge: 35, female: 17, male: 30, label: "31-35 yaş arası" },
  { key: "36-40", minAge: 36, maxAge: 40, female: 9, male: 16, label: "36-40 yaş arası" },
  { key: "41-50", minAge: 41, maxAge: 50, female: 2, male: 4, label: "41-50 yaş arası" },
  { key: "51-55", minAge: 51, maxAge: 55, female: 1, male: 2, label: "51-55 yaş arası" },
] as const;

export type MarriageProbabilityGender = "female" | "male";
export type MarriageProbabilityStatus =
  | "APPLIED"
  | "NO_SPOUSE"
  | "MISSING_GENDER"
  | "MISSING_BIRTH_DATE"
  | "MISSING_CALCULATION_DATE"
  | "AGE_OUT_OF_RANGE";

export interface MarriageProbabilityPreview {
  applied: boolean;
  status: MarriageProbabilityStatus;
  spouseClaimantId: string | null;
  spouseName: string | null;
  spouseGender: MarriageProbabilityGender | null;
  spouseBirthDate: string | null;
  calculationDate: string | null;
  spouseAgeAtCalculationDate: number | null;
  spouseAgeYmd: CalendarAgeYmd | null;
  spouseAgeRangeKey: string | null;
  spouseAgeRangeLabel: string | null;
  baseMarriageProbabilityRate: number;
  under18ChildCount: number;
  suggestedUnder18ChildCount: number;
  childReductionRate: number;
  finalMarriageProbabilityRate: number;
  infoMessage: string | null;
}

export function coerceUnder18ChildCount(value: unknown): number {
  const n = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : 0;
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(MARRIAGE_CHILD_COUNT_MAX, Math.floor(n));
}

export function finalMarriageProbabilityRate(baseRate: number, under18ChildCount: number): {
  childReductionRate: number;
  finalMarriageProbabilityRate: number;
} {
  const count = coerceUnder18ChildCount(under18ChildCount);
  const nominal = count * MARRIAGE_CHILD_RATE_POINTS;
  const finalRate = Math.max(0, baseRate - nominal);
  return {
    childReductionRate: baseRate - finalRate,
    finalMarriageProbabilityRate: finalRate,
  };
}

function isGender(value: unknown): value is MarriageProbabilityGender {
  return value === "female" || value === "male";
}

export function resolveMarriageProbabilityPreview(draft: {
  common?: { calculationDate?: string | null };
  beneficiaries?: Array<{
    id: string;
    fullName?: string | null;
    relation?: string | null;
    birthDate?: string | null;
    gender?: string | null;
  }>;
  marriageProbabilityDeduction?: { under18ChildCount?: number | null };
}): MarriageProbabilityPreview {
  const calculationDate = draft.common?.calculationDate?.trim() || null;
  const under18ChildCount = coerceUnder18ChildCount(draft.marriageProbabilityDeduction?.under18ChildCount);
  let suggested = 0;
  if (calculationDate) {
    for (const beneficiary of draft.beneficiaries ?? []) {
      if (beneficiary.relation !== "child") continue;
      const age = completedCalendarAgeYears(beneficiary.birthDate ?? "", calculationDate);
      if (age != null && age < 18) suggested += 1;
    }
  }
  suggested = Math.min(MARRIAGE_CHILD_COUNT_MAX, suggested);
  const spouse = (draft.beneficiaries ?? []).find((b) => b.relation === "spouse") ?? null;
  const empty = {
    spouseClaimantId: spouse?.id ?? null,
    spouseName: spouse?.fullName?.trim() || null,
    spouseGender: isGender(spouse?.gender) ? spouse.gender : null,
    spouseBirthDate: spouse?.birthDate?.trim() || null,
    calculationDate,
    spouseAgeAtCalculationDate: null as number | null,
    spouseAgeYmd: null as CalendarAgeYmd | null,
    spouseAgeRangeKey: null as string | null,
    spouseAgeRangeLabel: null as string | null,
    baseMarriageProbabilityRate: 0,
    under18ChildCount,
    suggestedUnder18ChildCount: suggested,
    childReductionRate: 0,
    finalMarriageProbabilityRate: 0,
  };

  if (!spouse) {
    return {
      ...empty,
      applied: false,
      status: "NO_SPOUSE",
      infoMessage: "Hak sahipleri arasında eş bulunmadığı için evlenme ihtimali indirimi uygulanmayacaktır.",
    };
  }
  if (!calculationDate) {
    return {
      ...empty,
      applied: false,
      status: "MISSING_CALCULATION_DATE",
      infoMessage: "Hesap tarihi girilmeden eşin yaşı ve evlenme ihtimali oranı belirlenemez.",
    };
  }
  if (!spouse.birthDate?.trim()) {
    return {
      ...empty,
      applied: false,
      status: "MISSING_BIRTH_DATE",
      infoMessage: "Eşin doğum tarihi hak sahipleri adımında tamamlanmalıdır.",
    };
  }
  if (!isGender(spouse.gender)) {
    return {
      ...empty,
      applied: false,
      status: "MISSING_GENDER",
      infoMessage: "Eşin cinsiyeti hak sahipleri adımında seçilmelidir.",
    };
  }
  const ageYears = completedCalendarAgeYears(spouse.birthDate, calculationDate);
  const ageYmd = calendarAgeAtEvent(spouse.birthDate, calculationDate);
  if (ageYears == null) {
    return {
      ...empty,
      applied: false,
      status: "MISSING_BIRTH_DATE",
      infoMessage: "Eşin doğum tarihi hak sahipleri adımında tamamlanmalıdır.",
    };
  }
  const band = MARRIAGE_PROBABILITY_BANDS.find((row) => ageYears >= row.minAge && ageYears <= row.maxAge) ?? null;
  if (!band) {
    return {
      ...empty,
      applied: false,
      status: "AGE_OUT_OF_RANGE",
      spouseAgeAtCalculationDate: ageYears,
      spouseAgeYmd: ageYmd,
      infoMessage: "Bu yaş aralığı için evlenme ihtimali indirimi uygulanmamaktadır.",
    };
  }
  const base = spouse.gender === "female" ? band.female : band.male;
  const rated = finalMarriageProbabilityRate(base, under18ChildCount);
  return {
    ...empty,
    applied: true,
    status: "APPLIED",
    spouseAgeAtCalculationDate: ageYears,
    spouseAgeYmd: ageYmd,
    spouseAgeRangeKey: band.key,
    spouseAgeRangeLabel: band.label,
    baseMarriageProbabilityRate: base,
    childReductionRate: rated.childReductionRate,
    finalMarriageProbabilityRate: rated.finalMarriageProbabilityRate,
    infoMessage: null,
  };
}

export function coerceMarriageProbabilityDeduction(raw: unknown): {
  under18ChildCount: number;
  note: string;
} {
  const obj = raw && typeof raw === "object" ? (raw as { under18ChildCount?: unknown; note?: unknown }) : {};
  const note = typeof obj.note === "string" ? obj.note : "";
  return { under18ChildCount: coerceUnder18ChildCount(obj.under18ChildCount), note };
}

export function coerceEducationExpenseDeduction(raw: unknown): { notes: string } {
  const obj = raw && typeof raw === "object" ? (raw as { notes?: unknown }) : {};
  return { notes: typeof obj.notes === "string" ? obj.notes : "" };
}

export function genderLabel(gender: string | null | undefined): string {
  if (gender === "female") return "Kadın";
  if (gender === "male") return "Erkek";
  return "—";
}

export function formatCompletedAge(years: number | null, ymd: CalendarAgeYmd | null): string {
  if (years == null) return "—";
  if (!ymd) return `${years} yaş`;
  return `${years} yaş (${ymd.years} yıl ${ymd.months} ay ${ymd.days} gün)`;
}
