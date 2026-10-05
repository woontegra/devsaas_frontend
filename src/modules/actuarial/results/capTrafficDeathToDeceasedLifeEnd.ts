import type {
  TrafficDeathCalculationResult,
  TrafficDeathGarameResponsibilityGroup,
  TrafficDeathGarameResponsibilityShares,
} from "../types/trafficDeathResult";
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

/** Cap sonrası kalan zarar değişince motorun ürettiği garame paylarını yeniler. */
function rescaleGarameResponsibilityShares(
  existing: TrafficDeathGarameResponsibilityShares | undefined,
  claimantLosses: TrafficDeathCalculationResult["claimantLosses"]
): TrafficDeathGarameResponsibilityShares | undefined {
  if (!existing) return undefined;
  const byId = new Map(claimantLosses.map((c) => [c.claimantId, c]));

  const orderShares = <T extends { claimantId: string }>(shares: T[]): T[] => {
    const shareById = new Map(shares.map((row) => [row.claimantId, row]));
    const ordered: T[] = [];
    for (const claimant of claimantLosses) {
      const row = shareById.get(claimant.claimantId);
      if (!row) continue;
      ordered.push(row);
      shareById.delete(claimant.claimantId);
    }
    for (const row of shareById.values()) ordered.push(row);
    return ordered;
  };

  const rescaleGroup = (
    group: TrafficDeathGarameResponsibilityGroup | null
  ): TrafficDeathGarameResponsibilityGroup | null => {
    if (!group) return null;
    const personLimit = group.personLimit;
    const participants = group.shares.map((row) => {
      const live = byId.get(row.claimantId);
      return {
        ...row,
        remainingLoss: roundMoney(live?.lossAfterInsurancePayments ?? row.remainingLoss),
        claimantName: live?.claimantName ?? row.claimantName,
        relationLabel: live?.relationLabel ?? row.relationLabel,
        claimantStatus: live?.claimantStatus ?? row.claimantStatus,
      };
    });
    const totalRemainingLoss = roundMoney(
      participants.reduce((s, row) => s + row.remainingLoss, 0)
    );
    const rawShares = participants.map((row) => {
      const garameRatio =
        totalRemainingLoss > 0 && Number.isFinite(row.remainingLoss / totalRemainingLoss)
          ? row.remainingLoss / totalRemainingLoss
          : 0;
      const safeRatio = Number.isFinite(garameRatio) ? garameRatio : 0;
      return {
        ...row,
        garameRatio: safeRatio,
        personLimit,
        responsibilityShare: roundMoney(safeRatio * personLimit),
      };
    });
    if (rawShares.length > 0 && totalRemainingLoss > 0 && personLimit > 0) {
      const sum = roundMoney(rawShares.reduce((s, r) => s + r.responsibilityShare, 0));
      const drift = roundMoney(personLimit - sum);
      if (drift !== 0) {
        const last = rawShares.length - 1;
        rawShares[last] = {
          ...rawShares[last]!,
          responsibilityShare: roundMoney(rawShares[last]!.responsibilityShare + drift),
        };
      }
    }
    return { totalRemainingLoss, personLimit, shares: orderShares(rawShares) };
  };

  return {
    zmts: rescaleGroup(existing.zmts),
    casco: rescaleGroup(existing.casco),
  };
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
    garameResponsibilityShares: rescaleGarameResponsibilityShares(
      next.garameResponsibilityShares,
      rows
    ),
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

  // Motor garame kapalıyken dava dışı kişileri claimantLosses'tan çıkarır.
  // Cap yeniden toplarken aynı kuralı koru (yalnız mevcut satır kimlikleri + davacılar).
  const includedClaimantIds = new Set(result.claimantLosses.map((c) => c.claimantId));
  const keepPeriodRow = (row: {
    claimantId: string;
    claimantStatus: (typeof processedPeriods)[number]["claimantStatus"];
  }) =>
    row.claimantStatus !== "OUT_OF_CASE" || includedClaimantIds.has(row.claimantId);

  const billableProcessed = processedPeriods.filter(keepPeriodRow);
  const billableFuture = futurePeriods.filter(keepPeriodRow);

  const processedTotal = roundMoney(
    billableProcessed.reduce((s, r) => s + (r.periodDamage || 0), 0)
  );
  const futureTotal = roundMoney(
    billableFuture.reduce((s, r) => s + (r.periodDamage || 0), 0)
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

  for (const row of billableProcessed) {
    ensure(row).processedLoss = roundMoney(ensure(row).processedLoss + row.periodDamage);
  }
  for (const row of billableFuture) {
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
  return {
    ...withMarriage,
    garameResponsibilityShares: rescaleGarameResponsibilityShares(
      withMarriage.garameResponsibilityShares ?? result.garameResponsibilityShares,
      withMarriage.claimantLosses
    ),
  };
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
