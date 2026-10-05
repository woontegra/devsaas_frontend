import { NET_MIN_WAGE_PERIODS } from "../../../data/netMinWage";
import { actuarialDays360Inclusive } from "./actuarialDayCount360";
import { addDaysIso } from "../wizard/shared/tempIncapacityPeriodUtils";
import type { TrafficDeathDraft } from "../types/calculationDraft";

export const EDUCATION_REARING_SHARE_RATE = 0.05;
const WAGE_INCREASE_RATE = 1.1;

export type EducationExpenseCalcStatus =
  | "READY"
  | "NO_END_DATE"
  | "INVALID_RANGE"
  | "NO_PARENTS"
  | "NO_MIN_WAGE";

export interface EducationExpenseParent {
  claimantId: string;
  claimantName: string;
  relation: "father" | "mother";
}

export interface EducationExpensePastPeriod {
  startDate: string;
  endDate: string;
  netMinWage: number;
  dailyWage: number;
  dayCount: number;
  periodExpense: number;
  shareRate: number;
  fatherRearingExpense: number;
  motherRearingExpense: number;
}

export interface EducationExpenseFuturePeriod {
  startDate: string;
  endDate: string;
  dayCount: number;
  netMinWage: number;
  dailyWage: number;
  kn: number;
  discountFactor: number;
  increasedExpense: number;
  discountedExpense: number;
  shareRate: number;
  fatherRearingExpense: number;
  motherRearingExpense: number;
  periodIndex: number;
}

export interface EducationExpensePreview {
  status: EducationExpenseCalcStatus;
  startDate: string | null;
  endDate: string | null;
  calculationDate: string | null;
  shareRate: number;
  father: EducationExpenseParent | null;
  mother: EducationExpenseParent | null;
  pastPeriods: EducationExpensePastPeriod[];
  futurePeriods: EducationExpenseFuturePeriod[];
  futureBaseNetMinWage: number | null;
  fatherPastTotal: number;
  fatherFutureTotal: number;
  fatherTotal: number;
  motherPastTotal: number;
  motherFutureTotal: number;
  motherTotal: number;
  pastPeriodExpenseTotal: number;
  futurePeriodExpenseTotal: number;
  periodExpenseTotal: number;
}

function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function dailyFromMonthly(monthlyNet: number): number {
  return roundMoney(monthlyNet / 30);
}

function maxIso(a: string, b: string): string {
  return a >= b ? a : b;
}

function minIso(a: string, b: string): string {
  return a <= b ? a : b;
}

function knRawForPeriod(periodIndex: number): number {
  return Math.pow(WAGE_INCREASE_RATE, periodIndex);
}

function discountRawForKn(knRaw: number): number {
  return 1 / knRaw;
}

function getNetMinWageForDate(dateStr: string): number | null {
  for (const p of NET_MIN_WAGE_PERIODS) {
    if (dateStr >= p.startDate && dateStr <= p.endDate) return p.netAmount;
  }
  return null;
}

/** buildFuturePeriods ile aynı: calcDate+1 … endDate, takvim yılı + periodIndex. */
function buildEducationFutureSegments(
  calculationDate: string,
  educationEndDate: string
): Array<{ startDate: string; endDate: string; periodIndex: number }> {
  const futureStart = addDaysIso(calculationDate, 1);
  if (futureStart > educationEndDate) return [];
  const firstFutureYear = parseInt(futureStart.slice(0, 4), 10);
  const segments: Array<{ startDate: string; endDate: string; periodIndex: number }> = [];
  let cursor = futureStart;
  while (cursor <= educationEndDate) {
    const year = cursor.slice(0, 4);
    const yearEnd = minIso(`${year}-12-31`, educationEndDate);
    const segmentYear = parseInt(year, 10);
    const periodIndex = segmentYear - firstFutureYear + 1;
    segments.push({ startDate: cursor, endDate: yearEnd, periodIndex });
    if (yearEnd >= educationEndDate) break;
    cursor = addDaysIso(yearEnd, 1);
  }
  return segments;
}

function findParent(
  draft: TrafficDeathDraft,
  relation: "father" | "mother"
): EducationExpenseParent | null {
  const ben = draft.beneficiaries.find((b) => b.relation === relation);
  if (!ben) return null;
  const name = ben.fullName?.trim() || (relation === "father" ? "Baba" : "Anne");
  return { claimantId: ben.id, claimantName: name, relation };
}

function emptyResult(
  status: EducationExpenseCalcStatus,
  startDate: string | null,
  endDate: string | null,
  calculationDate: string | null,
  father: EducationExpenseParent | null,
  mother: EducationExpenseParent | null
): EducationExpensePreview {
  return {
    status,
    startDate,
    endDate,
    calculationDate,
    shareRate: EDUCATION_REARING_SHARE_RATE,
    father,
    mother,
    pastPeriods: [],
    futurePeriods: [],
    futureBaseNetMinWage: null,
    fatherPastTotal: 0,
    fatherFutureTotal: 0,
    fatherTotal: 0,
    motherPastTotal: 0,
    motherFutureTotal: 0,
    motherTotal: 0,
    pastPeriodExpenseTotal: 0,
    futurePeriodExpenseTotal: 0,
    periodExpenseTotal: 0,
  };
}

/** Wizard canlı önizleme — backend educationExpenseDeduction ile aynı kurallar. */
export function resolveEducationExpensePreview(draft: TrafficDeathDraft): EducationExpensePreview {
  const educationEndDate = draft.educationExpenseDeduction?.educationEndDate?.trim() || "";
  const startDate = draft.common.eventDate?.trim() || "";
  const calculationDate = draft.common.calculationDate?.trim() || "";
  const father = findParent(draft, "father");
  const mother = findParent(draft, "mother");

  if (!educationEndDate) {
    return emptyResult("NO_END_DATE", startDate || null, null, calculationDate || null, father, mother);
  }
  if (!startDate || !calculationDate || educationEndDate < startDate || startDate > calculationDate) {
    return emptyResult(
      "INVALID_RANGE",
      startDate || null,
      educationEndDate,
      calculationDate || null,
      father,
      mother
    );
  }
  if (!father && !mother) {
    return emptyResult("NO_PARENTS", startDate, educationEndDate, calculationDate, null, null);
  }

  const pastEndDate = minIso(calculationDate, educationEndDate);
  const needsPast = startDate <= pastEndDate;
  const needsFuture = educationEndDate > calculationDate;

  if (needsPast && getNetMinWageForDate(startDate) == null) {
    return emptyResult("NO_MIN_WAGE", startDate, educationEndDate, calculationDate, father, mother);
  }

  let futureBaseNetMinWage: number | null = null;
  if (needsFuture) {
    futureBaseNetMinWage = getNetMinWageForDate(calculationDate);
    if (futureBaseNetMinWage == null) {
      return emptyResult("NO_MIN_WAGE", startDate, educationEndDate, calculationDate, father, mother);
    }
  }

  const pastPeriods: EducationExpensePastPeriod[] = [];
  if (needsPast) {
    for (const p of NET_MIN_WAGE_PERIODS) {
      const segStart = maxIso(startDate, p.startDate);
      const segEnd = minIso(pastEndDate, p.endDate);
      if (segStart > segEnd) continue;
      const dayCount = actuarialDays360Inclusive(segStart, segEnd);
      const dailyWage = dailyFromMonthly(p.netAmount);
      const periodExpense = roundMoney(dailyWage * dayCount);
      const rearingShare = roundMoney(periodExpense * EDUCATION_REARING_SHARE_RATE);
      pastPeriods.push({
        startDate: segStart,
        endDate: segEnd,
        netMinWage: p.netAmount,
        dailyWage,
        dayCount,
        periodExpense,
        shareRate: EDUCATION_REARING_SHARE_RATE,
        fatherRearingExpense: father ? rearingShare : 0,
        motherRearingExpense: mother ? rearingShare : 0,
      });
    }
    if (pastPeriods.length === 0) {
      return emptyResult("NO_MIN_WAGE", startDate, educationEndDate, calculationDate, father, mother);
    }
  }

  const futurePeriods: EducationExpenseFuturePeriod[] = [];
  if (needsFuture && futureBaseNetMinWage != null) {
    const dailyWage = dailyFromMonthly(futureBaseNetMinWage);
    for (const seg of buildEducationFutureSegments(calculationDate, educationEndDate)) {
      const dayCount = actuarialDays360Inclusive(seg.startDate, seg.endDate);
      if (dayCount <= 0) continue;
      const kn = knRawForPeriod(seg.periodIndex);
      const discountFactor = discountRawForKn(kn);
      const increasedExpense = roundMoney(dailyWage * dayCount * kn);
      const discountedExpense = roundMoney(increasedExpense / kn);
      const rearingShare = roundMoney(discountedExpense * EDUCATION_REARING_SHARE_RATE);
      futurePeriods.push({
        startDate: seg.startDate,
        endDate: seg.endDate,
        dayCount,
        netMinWage: futureBaseNetMinWage,
        dailyWage,
        kn,
        discountFactor,
        increasedExpense,
        discountedExpense,
        shareRate: EDUCATION_REARING_SHARE_RATE,
        fatherRearingExpense: father ? rearingShare : 0,
        motherRearingExpense: mother ? rearingShare : 0,
        periodIndex: seg.periodIndex,
      });
    }
  }

  if (pastPeriods.length === 0 && futurePeriods.length === 0) {
    return emptyResult("NO_MIN_WAGE", startDate, educationEndDate, calculationDate, father, mother);
  }

  const fatherPastTotal = roundMoney(pastPeriods.reduce((s, p) => s + p.fatherRearingExpense, 0));
  const motherPastTotal = roundMoney(pastPeriods.reduce((s, p) => s + p.motherRearingExpense, 0));
  const fatherFutureTotal = roundMoney(futurePeriods.reduce((s, p) => s + p.fatherRearingExpense, 0));
  const motherFutureTotal = roundMoney(futurePeriods.reduce((s, p) => s + p.motherRearingExpense, 0));
  const pastPeriodExpenseTotal = roundMoney(pastPeriods.reduce((s, p) => s + p.periodExpense, 0));
  const futurePeriodExpenseTotal = roundMoney(
    futurePeriods.reduce((s, p) => s + p.discountedExpense, 0)
  );

  return {
    status: "READY",
    startDate,
    endDate: educationEndDate,
    calculationDate,
    shareRate: EDUCATION_REARING_SHARE_RATE,
    father,
    mother,
    pastPeriods,
    futurePeriods,
    futureBaseNetMinWage,
    fatherPastTotal,
    fatherFutureTotal,
    fatherTotal: roundMoney(fatherPastTotal + fatherFutureTotal),
    motherPastTotal,
    motherFutureTotal,
    motherTotal: roundMoney(motherPastTotal + motherFutureTotal),
    pastPeriodExpenseTotal,
    futurePeriodExpenseTotal,
    periodExpenseTotal: roundMoney(pastPeriodExpenseTotal + futurePeriodExpenseTotal),
  };
}
