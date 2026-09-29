import type {
  TrafficDeathFutureClaimantRow,
  TrafficDeathProcessedClaimantRow,
} from "../types/trafficDeathResult";

export interface ProcessedPeriodPlaintiffColumn {
  claimantId: string;
  claimantName: string;
  relationLabel: string;
  /** Örn. "Yüksel Ergin (Eş / Davacı)" */
  header: string;
}

export interface ProcessedPeriodPlaintiffCell {
  shareFraction: string;
  sharePercentage: number;
  periodDamage: number;
}

export interface GroupedProcessedPeriodRow {
  startDate: string;
  endDate: string;
  dayCount: number;
  monthlyNetIncome: number;
  dailyNetIncome: number;
  periodIncome: number;
  byClaimantId: Record<string, ProcessedPeriodPlaintiffCell>;
}

export interface GroupedProcessedPeriodTable {
  columns: ProcessedPeriodPlaintiffColumn[];
  periods: GroupedProcessedPeriodRow[];
  /** Davacı bazlı destek tazminatı toplamı (yalnız PLAINTIFF satırları) */
  plaintiffTotals: Record<string, number>;
}

export interface GroupedFuturePeriodRow {
  startDate: string;
  endDate: string;
  dayCount: number;
  kn: number;
  discountFactor: number;
  dailyNetIncome: number;
  discountedIncome: number;
  byClaimantId: Record<string, ProcessedPeriodPlaintiffCell>;
}

export interface GroupedFuturePeriodTable {
  columns: ProcessedPeriodPlaintiffColumn[];
  periods: GroupedFuturePeriodRow[];
  plaintiffTotals: Record<string, number>;
}

function processedPeriodKey(row: TrafficDeathProcessedClaimantRow): string {
  return [
    row.startDate,
    row.endDate,
    String(row.dayCount),
    String(row.monthlyNetIncome),
    String(row.dailyNetIncome),
    String(row.periodIncome),
  ].join("|");
}

function futurePeriodKey(row: TrafficDeathFutureClaimantRow): string {
  return [
    row.startDate,
    row.endDate,
    String(row.dayCount),
    String(row.kn),
    String(row.discountFactor),
    String(row.dailyNetIncome),
    String(row.discountedIncome),
  ].join("|");
}

function plaintiffHeader(name: string, relationLabel: string): string {
  const parts = [relationLabel?.trim(), "Davacı"].filter(Boolean);
  return parts.length > 0 ? `${name} (${parts.join(" / ")})` : `${name} (Davacı)`;
}

function isPlaintiffStatus(
  status: "PLAINTIFF" | "OUT_OF_CASE" | "SYNTHETIC" | null
): boolean {
  return status === "PLAINTIFF";
}

/**
 * Hak sahibi bazlı işlemiş dönem satırlarını dönem bazlı + davacı kolonlarına dönüştürür.
 * OUT_OF_CASE satırları kolon/satır olarak görünmez; yalnızca PLAINTIFF hücreleri map edilir.
 */
export function groupProcessedPeriodsForPlaintiffTable(
  rows: TrafficDeathProcessedClaimantRow[]
): GroupedProcessedPeriodTable {
  const columnOrder: ProcessedPeriodPlaintiffColumn[] = [];
  const columnSeen = new Set<string>();
  const plaintiffTotals: Record<string, number> = {};

  for (const row of rows) {
    if (!isPlaintiffStatus(row.claimantStatus)) continue;
    if (!columnSeen.has(row.claimantId)) {
      columnSeen.add(row.claimantId);
      const name = row.claimantName?.trim() || row.claimantId;
      columnOrder.push({
        claimantId: row.claimantId,
        claimantName: name,
        relationLabel: row.relationLabel ?? "",
        header: plaintiffHeader(name, row.relationLabel ?? ""),
      });
      plaintiffTotals[row.claimantId] = 0;
    }
  }

  const periodMap = new Map<string, GroupedProcessedPeriodRow>();
  const periodOrder: string[] = [];

  for (const row of rows) {
    const key = processedPeriodKey(row);
    let period = periodMap.get(key);
    if (!period) {
      period = {
        startDate: row.startDate,
        endDate: row.endDate,
        dayCount: row.dayCount,
        monthlyNetIncome: row.monthlyNetIncome,
        dailyNetIncome: row.dailyNetIncome,
        periodIncome: row.periodIncome,
        byClaimantId: {},
      };
      periodMap.set(key, period);
      periodOrder.push(key);
    }

    if (!isPlaintiffStatus(row.claimantStatus)) continue;

    period.byClaimantId[row.claimantId] = {
      shareFraction: row.shareFraction,
      sharePercentage: row.sharePercentage,
      periodDamage: row.periodDamage,
    };
    plaintiffTotals[row.claimantId] =
      (plaintiffTotals[row.claimantId] ?? 0) + row.periodDamage;
  }

  return {
    columns: columnOrder,
    periods: periodOrder.map((k) => periodMap.get(k)!),
    plaintiffTotals,
  };
}

/**
 * Hak sahibi bazlı işleyecek dönem satırlarını dönem bazlı + davacı kolonlarına dönüştürür.
 */
export function groupFuturePeriodsForPlaintiffTable(
  rows: TrafficDeathFutureClaimantRow[]
): GroupedFuturePeriodTable {
  const columnOrder: ProcessedPeriodPlaintiffColumn[] = [];
  const columnSeen = new Set<string>();
  const plaintiffTotals: Record<string, number> = {};

  for (const row of rows) {
    if (!isPlaintiffStatus(row.claimantStatus)) continue;
    if (!columnSeen.has(row.claimantId)) {
      columnSeen.add(row.claimantId);
      const name = row.claimantName?.trim() || row.claimantId;
      columnOrder.push({
        claimantId: row.claimantId,
        claimantName: name,
        relationLabel: row.relationLabel ?? "",
        header: plaintiffHeader(name, row.relationLabel ?? ""),
      });
      plaintiffTotals[row.claimantId] = 0;
    }
  }

  const periodMap = new Map<string, GroupedFuturePeriodRow>();
  const periodOrder: string[] = [];

  for (const row of rows) {
    const key = futurePeriodKey(row);
    let period = periodMap.get(key);
    if (!period) {
      period = {
        startDate: row.startDate,
        endDate: row.endDate,
        dayCount: row.dayCount,
        kn: row.kn,
        discountFactor: row.discountFactor,
        dailyNetIncome: row.dailyNetIncome,
        discountedIncome: row.discountedIncome,
        byClaimantId: {},
      };
      periodMap.set(key, period);
      periodOrder.push(key);
    }

    if (!isPlaintiffStatus(row.claimantStatus)) continue;

    period.byClaimantId[row.claimantId] = {
      shareFraction: row.shareFraction,
      sharePercentage: row.sharePercentage,
      periodDamage: row.periodDamage,
    };
    plaintiffTotals[row.claimantId] =
      (plaintiffTotals[row.claimantId] ?? 0) + row.periodDamage;
  }

  return {
    columns: columnOrder,
    periods: periodOrder.map((k) => periodMap.get(k)!),
    plaintiffTotals,
  };
}

/** Pay oranı hücresi: `2/7 (%29)` / `(1+1)/7 (%25)` */
export function formatShareFractionWithPercent(
  fraction: string | null | undefined,
  percentage: number | null | undefined
): string {
  const frac = fraction?.trim() || "—";
  if (percentage == null || !Number.isFinite(percentage)) {
    return frac === "—" ? "—" : frac;
  }
  const pct = Number.isInteger(percentage)
    ? `%${percentage}`
    : `%${percentage.toLocaleString("tr-TR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}`;
  return `${frac} (${pct})`;
}
