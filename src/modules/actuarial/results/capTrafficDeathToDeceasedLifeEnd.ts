import type { TrafficDeathCalculationResult } from "../types/trafficDeathResult";
import type { TrafficDeathShareRatioPeriod } from "../types/trafficDeathShareRatios";
import type { TrafficDeathPersonLife } from "../types/trafficDeathSupportPeriods";
import { coercePersonLives } from "../types/trafficDeathSupportPeriods";

function compareIso(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function minIso(a: string, b: string): string {
  return compareIso(a, b) <= 0 ? a : b;
}

/** personLives / result içinden müteveffa muhtemel ömür sonu */
export function resolveDeceasedProbableLifeEndDate(personLives: unknown): string | null {
  const lives = coercePersonLives(personLives);
  const deceased = lives.find((p) => p.role === "DECEASED" || p.personId === "deceased");
  return deceased?.probableLifeEndDate ?? null;
}

export function maxDatedPeriodEnd(
  periods: Array<{ endDate: string }> | null | undefined
): string | null {
  if (!periods?.length) return null;
  let max = periods[0]!.endDate;
  for (const p of periods) {
    if (compareIso(p.endDate, max) > 0) max = p.endDate;
  }
  return max;
}

/**
 * Eski exclusive boundary snapshot’ı:
 * personLives.probableLifeEndDate = 07.02.2031 ama period’lar 06.02.2031’de bitiyor.
 */
export function isStaleExclusiveDeceasedLifeEndResult(params: {
  personLives?: unknown;
  shareRatioPeriods?: Array<{ endDate: string }> | null;
  futurePeriods?: Array<{ endDate: string }> | null;
  supportPeriods?: Array<{ endDate: string }> | null;
}): boolean {
  const lifeEnd = resolveDeceasedProbableLifeEndDate(params.personLives);
  if (!lifeEnd) return false;
  const ends = [
    maxDatedPeriodEnd(params.shareRatioPeriods),
    maxDatedPeriodEnd(params.futurePeriods),
    maxDatedPeriodEnd(
      Array.isArray(params.supportPeriods)
        ? (params.supportPeriods as Array<{ endDate: string }>)
        : null
    ),
  ].filter((d): d is string => Boolean(d));
  if (ends.length === 0) return false;
  return ends.some((end) => compareIso(end, lifeEnd) < 0);
}

/**
 * TRAFFIC_DEATH absolute hard stop:
 * startDate > cap → drop
 * endDate > cap → clamp to cap (ömür sonu günü dahil kalabilir)
 */
export function capDatedPeriodsByDeceasedLifeEnd<
  T extends { startDate: string; endDate: string },
>(periods: T[], deceasedProbableLifeEndDate: string | null | undefined): T[] {
  if (!deceasedProbableLifeEndDate) return periods;
  const cap = deceasedProbableLifeEndDate;
  const out: T[] = [];
  for (const period of periods) {
    if (compareIso(period.startDate, cap) > 0) continue;
    const endDate =
      compareIso(period.endDate, cap) > 0 ? cap : period.endDate;
    if (compareIso(period.startDate, endDate) > 0) continue;
    out.push({ ...period, endDate });
  }
  return out;
}

export function capShareRatioPeriodsByDeceasedLifeEnd(
  periods: TrafficDeathShareRatioPeriod[],
  deceasedProbableLifeEndDate: string | null | undefined
): TrafficDeathShareRatioPeriod[] {
  return capDatedPeriodsByDeceasedLifeEnd(periods, deceasedProbableLifeEndDate);
}

export function capPersonLivesEffectiveSupportEnd(
  personLives: TrafficDeathPersonLife[],
  deceasedProbableLifeEndDate: string | null | undefined
): TrafficDeathPersonLife[] {
  if (!deceasedProbableLifeEndDate) return personLives;
  return personLives.map((life) => {
    if (life.role === "DECEASED" || life.personId === "deceased") return life;
    if (!life.effectiveSupportEndDate) return life;
    return {
      ...life,
      effectiveSupportEndDate: minIso(
        life.effectiveSupportEndDate,
        deceasedProbableLifeEndDate
      ),
    };
  });
}

function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function finalAfterDeathMahsup(
  result: TrafficDeathCalculationResult,
  supportAfterMarriage: number
): number {
  const expenseTotal = result.deathExpenses?.total ?? 0;
  const usesCards =
    result.insuranceDeductions != null || typeof result.psdDeductibleAfterFault === "number";
  if (
    typeof result.totalAfterClaimantInsurance === "number" &&
    ((result.updatedZmtsPaymentTotal ?? 0) > 0 ||
      (result.updatedCascoPaymentTotal ?? 0) > 0 ||
      typeof result.psdDeductibleAfterFault === "number")
  ) {
    const afterPsd = Math.max(
      0,
      roundMoney(result.totalAfterClaimantInsurance - (result.psdDeductibleAfterFault ?? 0))
    );
    return roundMoney(afterPsd + expenseTotal);
  }
  if (!usesCards) {
    const prior = result.priorPaymentsApplied ? result.priorPaymentsTotal : 0;
    return roundMoney(supportAfterMarriage + expenseTotal - prior);
  }
  const afterPsd = Math.max(0, roundMoney(supportAfterMarriage - (result.psdDeductibleAfterFault ?? 0)));
  const insurance =
    (result.insuranceDeductions?.zmts?.deductionTotal ?? 0) +
    (result.insuranceDeductions?.casco?.deductionTotal ?? 0);
  return roundMoney(Math.max(0, afterPsd + expenseTotal - insurance));
}

function withInsuranceRemainder(
  rows: TrafficDeathCalculationResult["claimantLosses"]
): TrafficDeathCalculationResult["claimantLosses"] {
  return rows.map((c) => {
    if (
      typeof c.updatedZmtsPaymentAmount !== "number" &&
      typeof c.updatedCascoPaymentAmount !== "number"
    ) {
      return c;
    }
    const afterMarriage = c.lossAfterMarriageProbability ?? c.lossAfterDeceasedFault ?? 0;
    const updatedZmtsPaymentAmount = c.updatedZmtsPaymentAmount ?? 0;
    const updatedCascoPaymentAmount = c.updatedCascoPaymentAmount ?? 0;
    return {
      ...c,
      updatedZmtsPaymentAmount,
      updatedCascoPaymentAmount,
      lossAfterInsurancePayments: roundMoney(
        Math.max(0, afterMarriage - updatedZmtsPaymentAmount - updatedCascoPaymentAmount)
      ),
    };
  });
}

function stampInsuranceTotals(
  result: TrafficDeathCalculationResult,
  claimantLosses: TrafficDeathCalculationResult["claimantLosses"],
  totalAfterMarriageProbability: number
): TrafficDeathCalculationResult {
  const rows = withInsuranceRemainder(claimantLosses);
  const hasInsurance = rows.some(
    (c) => typeof c.updatedZmtsPaymentAmount === "number" || typeof c.updatedCascoPaymentAmount === "number"
  );
  const next: TrafficDeathCalculationResult = {
    ...result,
    claimantLosses: rows,
    totalAfterMarriageProbability,
    ...(hasInsurance
      ? {
          updatedZmtsPaymentTotal: roundMoney(rows.reduce((s, c) => s + (c.updatedZmtsPaymentAmount ?? 0), 0)),
          updatedCascoPaymentTotal: roundMoney(rows.reduce((s, c) => s + (c.updatedCascoPaymentAmount ?? 0), 0)),
          totalAfterClaimantInsurance: roundMoney(
            rows.reduce((s, c) => s + (c.lossAfterInsurancePayments ?? c.lossAfterMarriageProbability ?? 0), 0)
          ),
        }
      : {}),
  };
  return {
    ...next,
    finalCompensation: finalAfterDeathMahsup(next, totalAfterMarriageProbability),
  };
}

function applyStoredMarriageColumn(
  result: TrafficDeathCalculationResult
): TrafficDeathCalculationResult {
  const complete =
    result.claimantLosses.every((c) => typeof c.lossAfterMarriageProbability === "number") &&
    typeof result.totalAfterMarriageProbability === "number";
  if (complete) return result;

  const summary = result.marriageProbability;
  if (!summary?.applied) {
    const claimantLosses = result.claimantLosses.map((c) => ({
      ...c,
      marriageProbabilityApplied: false,
      marriageProbabilityRate: 0,
      lossAfterMarriageProbability: c.lossAfterDeceasedFault ?? c.totalLoss,
    }));
    return stampInsuranceTotals(
      result,
      claimantLosses,
      roundMoney(claimantLosses.reduce((s, c) => s + (c.lossAfterMarriageProbability ?? 0), 0))
    );
  }

  const rate = summary.finalMarriageProbabilityRate;
  const claimantLosses = result.claimantLosses.map((c) => {
    const afterFault = c.lossAfterDeceasedFault ?? 0;
    const applies = summary.spouseClaimantId != null && c.claimantId === summary.spouseClaimantId;
    return {
      ...c,
      marriageProbabilityApplied: applies,
      marriageProbabilityRate: applies ? rate : 0,
      lossAfterMarriageProbability: applies ? roundMoney(afterFault * (1 - rate / 100)) : afterFault,
    };
  });
  return stampInsuranceTotals(
    result,
    claimantLosses,
    roundMoney(claimantLosses.reduce((s, c) => s + (c.lossAfterMarriageProbability ?? 0), 0))
  );
}

function stampMissingClaimantFault(
  result: TrafficDeathCalculationResult
): TrafficDeathCalculationResult {
  const rate = Math.max(0, Math.min(100, result.deceasedFaultRate ?? 0));
  if (result.claimantLosses.every((c) => typeof c.lossAfterDeceasedFault === "number")) {
    return applyStoredMarriageColumn(result);
  }
  const claimantLosses = result.claimantLosses.map((c) => {
    if (typeof c.lossAfterDeceasedFault === "number") return c;
    return {
      ...c,
      deceasedFaultRate: rate,
      lossAfterDeceasedFault: roundMoney(c.totalLoss * (1 - rate / 100)),
    };
  });
  const totalAfterFault = roundMoney(
    claimantLosses.reduce((s, c) => s + (c.lossAfterDeceasedFault ?? 0), 0)
  );
  return applyStoredMarriageColumn({
    ...result,
    claimantLosses,
    totalAfterFault,
    faultDeductionAmount: roundMoney(result.totalSupportLoss - totalAfterFault),
    finalCompensation: finalAfterDeathMahsup(result, totalAfterFault),
  });
}

/**
 * Eski snapshot / session result’ını deceased life end ile normalize eder.
 * Display + restore hard guard.
 */
export function normalizeTrafficDeathCalculationResult(
  result: TrafficDeathCalculationResult
): TrafficDeathCalculationResult {
  const cap = resolveDeceasedProbableLifeEndDate(result.personLives);
  if (!cap) return stampMissingClaimantFault(result);

  const shareRatioPeriods = capShareRatioPeriodsByDeceasedLifeEnd(
    result.shareRatioPeriods,
    cap
  );
  const processedPeriods = capDatedPeriodsByDeceasedLifeEnd(
    result.processedPeriods,
    cap
  );
  const futurePeriods = capDatedPeriodsByDeceasedLifeEnd(result.futurePeriods, cap);
  const supportPeriods = Array.isArray(result.supportPeriods)
    ? capDatedPeriodsByDeceasedLifeEnd(
        result.supportPeriods as Array<{ startDate: string; endDate: string }>,
        cap
      )
    : result.supportPeriods;

  const processedTotal = roundMoney(
    processedPeriods.reduce((s, r) => s + (r.periodDamage || 0), 0)
  );
  const futureTotal = roundMoney(
    futurePeriods.reduce((s, r) => s + (r.periodDamage || 0), 0)
  );

  const lossMap = new Map<
    string,
    {
      claimantId: string;
      claimantName: string;
      relationLabel: string;
      claimantStatus: (typeof processedPeriods)[number]["claimantStatus"];
      processedLoss: number;
      futureLoss: number;
    }
  >();

  const ensure = (row: {
    claimantId: string;
    claimantName: string;
    relationLabel: string;
    claimantStatus: (typeof processedPeriods)[number]["claimantStatus"];
  }) => {
    let entry = lossMap.get(row.claimantId);
    if (!entry) {
      entry = {
        claimantId: row.claimantId,
        claimantName: row.claimantName,
        relationLabel: row.relationLabel,
        claimantStatus: row.claimantStatus,
        processedLoss: 0,
        futureLoss: 0,
      };
      lossMap.set(row.claimantId, entry);
    }
    return entry;
  };

  for (const row of processedPeriods) {
    ensure(row).processedLoss = roundMoney(ensure(row).processedLoss + row.periodDamage);
  }
  for (const row of futurePeriods) {
    ensure(row).futureLoss = roundMoney(ensure(row).futureLoss + row.periodDamage);
  }

  const faultRate = Math.max(0, Math.min(100, result.deceasedFaultRate ?? 0));
  const storedById = new Map(result.claimantLosses.map((c) => [c.claimantId, c]));
  const claimantLosses = [...lossMap.values()].map((e) => {
    const totalLoss = roundMoney(e.processedLoss + e.futureLoss);
    const stored = storedById.get(e.claimantId);
    return {
      claimantId: e.claimantId,
      claimantName: e.claimantName,
      relationLabel: e.relationLabel,
      claimantStatus: e.claimantStatus,
      processedLoss: e.processedLoss,
      futureLoss: e.futureLoss,
      totalLoss,
      deceasedFaultRate: faultRate,
      lossAfterDeceasedFault: roundMoney(totalLoss * (1 - faultRate / 100)),
      ...(typeof stored?.updatedZmtsPaymentAmount === "number"
        ? { updatedZmtsPaymentAmount: stored.updatedZmtsPaymentAmount }
        : {}),
      ...(typeof stored?.updatedCascoPaymentAmount === "number"
        ? { updatedCascoPaymentAmount: stored.updatedCascoPaymentAmount }
        : {}),
      ...(Array.isArray(stored?.zmtsPaymentDetails) ? { zmtsPaymentDetails: stored.zmtsPaymentDetails } : {}),
      ...(Array.isArray(stored?.cascoPaymentDetails) ? { cascoPaymentDetails: stored.cascoPaymentDetails } : {}),
    };
  });

  const totalSupportLoss = roundMoney(processedTotal + futureTotal);
  const totalAfterFault = roundMoney(
    claimantLosses.reduce((s, c) => s + (c.lossAfterDeceasedFault ?? 0), 0)
  );
  const faultDeductionAmount = roundMoney(totalSupportLoss - totalAfterFault);
  const finalCompensation = finalAfterDeathMahsup(result, totalAfterFault);

  const withMarriage = applyStoredMarriageColumn({
    ...result,
    shareRatioPeriods,
    supportPeriods,
    processedPeriods,
    futurePeriods,
    claimantLosses,
    processedTotal,
    futureTotal,
    totalSupportLoss,
    faultDeductionAmount,
    totalAfterFault,
    finalCompensation,
    personLives: Array.isArray(result.personLives)
      ? capPersonLivesEffectiveSupportEnd(coercePersonLives(result.personLives), cap)
      : result.personLives,
  });
  return withMarriage;
}

export function normalizeTrafficDeathSupportSnapshot(params: {
  shareRatioPeriods?: TrafficDeathShareRatioPeriod[];
  personLives?: unknown;
  periods?: unknown;
  columnKeys?: unknown;
  valid?: boolean;
}): {
  shareRatioPeriods: TrafficDeathShareRatioPeriod[];
  personLives: unknown[] | undefined;
  periods: unknown[] | undefined;
  columnKeys:
    | Array<{ key: string; header: string; subLabel?: string; synthetic?: boolean }>
    | undefined;
  valid?: boolean;
} {
  const cap = resolveDeceasedProbableLifeEndDate(params.personLives);
  const shareRatioPeriods = capShareRatioPeriodsByDeceasedLifeEnd(
    params.shareRatioPeriods ?? [],
    cap
  );
  const personLives = cap
    ? capPersonLivesEffectiveSupportEnd(coercePersonLives(params.personLives), cap)
    : Array.isArray(params.personLives)
      ? params.personLives
      : undefined;
  const periods = Array.isArray(params.periods)
    ? capDatedPeriodsByDeceasedLifeEnd(
        params.periods as Array<{ startDate: string; endDate: string }>,
        cap
      )
    : undefined;
  const columnKeys = Array.isArray(params.columnKeys)
    ? (params.columnKeys as Array<{
        key: string;
        header: string;
        subLabel?: string;
        synthetic?: boolean;
      }>)
    : undefined;
  return {
    shareRatioPeriods,
    personLives,
    periods,
    columnKeys,
    valid: params.valid,
  };
}
