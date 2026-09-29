import { describe, expect, it } from "vitest";
import type {
  TrafficDeathFutureClaimantRow,
  TrafficDeathProcessedClaimantRow,
} from "../types/trafficDeathResult";
import {
  formatShareFractionWithPercent,
  groupFuturePeriodsForPlaintiffTable,
  groupProcessedPeriodsForPlaintiffTable,
} from "./groupProcessedPeriodsForPlaintiffTable";

function row(
  over: Partial<TrafficDeathProcessedClaimantRow> &
    Pick<
      TrafficDeathProcessedClaimantRow,
      "claimantId" | "claimantName" | "claimantStatus" | "shareFraction" | "sharePercentage" | "periodDamage"
    >
): TrafficDeathProcessedClaimantRow {
  return {
    startDate: "2024-04-15",
    endDate: "2024-10-14",
    dayCount: 180,
    monthlyNetIncome: 17002.2,
    dailyNetIncome: 566.74,
    periodIncome: 102013.2,
    relationLabel: "Eş",
    supportRate: over.sharePercentage,
    periodKind: "processed_support",
    ...over,
  };
}

describe("groupProcessedPeriodsForPlaintiffTable", () => {
  it("aynı dönemi tek satırda birleştirir; yalnız PLAINTIFF kolonları açar", () => {
    const rows: TrafficDeathProcessedClaimantRow[] = [
      row({
        claimantId: "sp",
        claimantName: "Yüksel Ergin",
        relationLabel: "Eş",
        claimantStatus: "PLAINTIFF",
        shareFraction: "2/7",
        sharePercentage: 29,
        periodDamage: 1000,
      }),
      row({
        claimantId: "mo",
        claimantName: "Fatma",
        relationLabel: "Anne",
        claimantStatus: "OUT_OF_CASE",
        shareFraction: "1/7",
        sharePercentage: 14,
        periodDamage: 500,
      }),
      row({
        claimantId: "c1",
        claimantName: "Ebru Aydın",
        relationLabel: "Çocuk",
        claimantStatus: "PLAINTIFF",
        shareFraction: "1/7",
        sharePercentage: 14,
        periodDamage: 400,
      }),
      row({
        startDate: "2024-10-15",
        endDate: "2024-12-31",
        dayCount: 76,
        monthlyNetIncome: 20000,
        dailyNetIncome: 666.67,
        periodIncome: 50666.92,
        claimantId: "sp",
        claimantName: "Yüksel Ergin",
        relationLabel: "Eş",
        claimantStatus: "PLAINTIFF",
        shareFraction: "2/5",
        sharePercentage: 40,
        periodDamage: 800,
      }),
    ];

    const grouped = groupProcessedPeriodsForPlaintiffTable(rows);

    expect(grouped.columns).toHaveLength(2);
    expect(grouped.columns[0]!.header).toBe("Yüksel Ergin (Eş / Davacı)");
    expect(grouped.columns[1]!.header).toBe("Ebru Aydın (Çocuk / Davacı)");
    expect(grouped.periods).toHaveLength(2);

    const first = grouped.periods[0]!;
    expect(first.startDate).toBe("2024-04-15");
    expect(first.byClaimantId.sp?.periodDamage).toBe(1000);
    expect(first.byClaimantId.c1?.periodDamage).toBe(400);
    expect(first.byClaimantId.mo).toBeUndefined();

    expect(grouped.plaintiffTotals.sp).toBe(1800);
    expect(grouped.plaintiffTotals.c1).toBe(400);
  });

  it("formatShareFractionWithPercent kesir + yüzde birleştirir", () => {
    expect(formatShareFractionWithPercent("2/7", 29)).toBe("2/7 (%29)");
    expect(formatShareFractionWithPercent("(1+1)/7", 25)).toBe("(1+1)/7 (%25)");
    expect(formatShareFractionWithPercent("1/7", 14.5)).toBe("1/7 (%14,5)");
  });
});

describe("groupFuturePeriodsForPlaintiffTable", () => {
  it("aynı KN dönemini tek satırda birleştirir; yalnız PLAINTIFF kolonları açar", () => {
    const rows: TrafficDeathFutureClaimantRow[] = [
      {
        startDate: "2026-09-03",
        endDate: "2026-12-31",
        dayCount: 118,
        monthlyNetIncome: 28075.5,
        dailyNetIncome: 935.85,
        kn: 1.1,
        discountFactor: 0.9090909,
        increasedIncome: 121473.33,
        discountedIncome: 110430.3,
        claimantId: "sp",
        claimantName: "Yüksel Ergin",
        claimantStatus: "PLAINTIFF",
        relationLabel: "Eş",
        shareFraction: "2/5",
        sharePercentage: 40,
        periodDamage: 44172.12,
        periodKind: "future_support",
        periodIndex: 0,
      },
      {
        startDate: "2026-09-03",
        endDate: "2026-12-31",
        dayCount: 118,
        monthlyNetIncome: 28075.5,
        dailyNetIncome: 935.85,
        kn: 1.1,
        discountFactor: 0.9090909,
        increasedIncome: 121473.33,
        discountedIncome: 110430.3,
        claimantId: "c1",
        claimantName: "Ebru Aydın",
        claimantStatus: "PLAINTIFF",
        relationLabel: "Çocuk",
        shareFraction: "1/5",
        sharePercentage: 20,
        periodDamage: 22086.06,
        periodKind: "future_support",
        periodIndex: 0,
      },
      {
        startDate: "2026-09-03",
        endDate: "2026-12-31",
        dayCount: 118,
        monthlyNetIncome: 28075.5,
        dailyNetIncome: 935.85,
        kn: 1.1,
        discountFactor: 0.9090909,
        increasedIncome: 121473.33,
        discountedIncome: 110430.3,
        claimantId: "mo",
        claimantName: "Özgür Ergin",
        claimantStatus: "OUT_OF_CASE",
        relationLabel: "Anne",
        shareFraction: "1/5",
        sharePercentage: 20,
        periodDamage: 22086.06,
        periodKind: "future_support",
        periodIndex: 0,
      },
    ];

    const grouped = groupFuturePeriodsForPlaintiffTable(rows);
    expect(grouped.columns).toHaveLength(2);
    expect(grouped.periods).toHaveLength(1);
    expect(grouped.periods[0]!.byClaimantId.sp?.periodDamage).toBe(44172.12);
    expect(grouped.periods[0]!.byClaimantId.c1?.periodDamage).toBe(22086.06);
    expect(grouped.periods[0]!.byClaimantId.mo).toBeUndefined();
    expect(grouped.plaintiffTotals.sp).toBe(44172.12);
    expect(grouped.plaintiffTotals.c1).toBe(22086.06);
  });
});
