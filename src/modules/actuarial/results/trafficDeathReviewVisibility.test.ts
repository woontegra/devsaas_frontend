import { describe, expect, it } from "vitest";
import {
  capDatedPeriodsByDeceasedLifeEnd,
  isStaleExclusiveDeceasedLifeEndResult,
} from "./capTrafficDeathToDeceasedLifeEnd";
import {
  monetarySectionFromEngineResult,
  reviewAfterTrafficDeathSupport,
  trafficDeathReportActionsVisible,
} from "./trafficDeathReviewVisibility";

const LIFE_END = "2031-02-07";

const engineResult = {
  calculationType: "TRAFFIC_DEATH" as const,
  dailyNetIncome: 333.33,
  resolvedIncome: { monthlyNetAtCalculation: 10000 },
  personLives: [
    {
      personId: "deceased",
      role: "DECEASED",
      probableLifeEndDate: LIFE_END,
    },
  ],
  shareRatioPeriods: [{ startDate: "2026-09-03", endDate: "2031-02-06", shares: {} }],
  futurePeriods: [{ endDate: "2031-02-06", periodDamage: 800 }],
  supportPeriods: [{ endDate: "2031-02-06" }],
  processedPeriods: [{ endDate: "2024-01-01", periodDamage: 100 }],
  claimantLosses: [{ claimantId: "sp", totalLoss: 900, lossAfterDeceasedFault: 900 }],
  garameResponsibilityShares: { zmts: { shares: [{ claimantId: "sp" }] }, casco: null },
  marriageProbability: { applied: true, finalMarriageProbabilityRate: 12 },
  deathExpenses: { preDeathTreatment: 0, funeralCost: 500 },
};

describe("Kontrol ve Ödeme aynı motor sonucunu gösterir", () => {
  it("destek cevabı geçerli run sonucunu silmez ve ikinci run istemez", () => {
    const kept = reviewAfterTrafficDeathSupport(engineResult);
    expect(kept.runResult).toBe(engineResult);
    expect(kept.requestAnotherRun).toBe(false);
    expect(reviewAfterTrafficDeathSupport(null)).toEqual({
      runResult: null,
      requestAnotherRun: false,
    });
  });

  it("exclusive-stale bayrağı parasal bölümü yok etmez", () => {
    expect(
      isStaleExclusiveDeceasedLifeEndResult({
        personLives: engineResult.personLives,
        shareRatioPeriods: engineResult.shareRatioPeriods,
        futurePeriods: engineResult.futurePeriods,
        supportPeriods: engineResult.supportPeriods,
      })
    ).toBe(true);
    const shown = monetarySectionFromEngineResult(engineResult, true);
    expect(shown).toBe(engineResult);
    expect(shown?.dailyNetIncome).toBe(333.33);
    expect(shown?.claimantLosses).toHaveLength(1);
    expect(shown?.processedPeriods).toHaveLength(1);
    expect(shown?.futurePeriods).toHaveLength(1);
    expect(shown?.garameResponsibilityShares?.zmts?.shares).toHaveLength(1);
    expect(monetarySectionFromEngineResult(null, true)).toBeNull();
  });

  it("ADMIN, ücretli USER ve kredili DEMO aynı sonucu ve Word/PDF görünürlüğünü alır", () => {
    const audiences = ["ADMIN", "PAID_USER", "DEMO_USER"] as const;
    const views = audiences.map((audience) => {
      const afterSupport = reviewAfterTrafficDeathSupport(engineResult);
      return {
        audience,
        requestAnotherRun: afterSupport.requestAnotherRun,
        dailyNetIncome: monetarySectionFromEngineResult(afterSupport.runResult, true)?.dailyNetIncome,
        claimantCount: monetarySectionFromEngineResult(afterSupport.runResult, true)?.claimantLosses.length,
        wordPdf: trafficDeathReportActionsVisible({
          reviewFlowPhase: "result",
          calculationType: "TRAFFIC_DEATH",
          runResult: afterSupport.runResult,
          hasReportHandler: true,
        }),
      };
    });
    expect(new Set(views.map((v) => JSON.stringify({ ...v, audience: "" }))).size).toBe(1);
    expect(views.every((v) => v.requestAnotherRun === false)).toBe(true);
    expect(views.every((v) => v.wordPdf)).toBe(true);
    expect(views.every((v) => v.dailyNetIncome === 333.33)).toBe(true);
  });

  it("sonuç yokken Word/PDF açılmaz", () => {
    expect(
      trafficDeathReportActionsVisible({
        reviewFlowPhase: "result",
        calculationType: "TRAFFIC_DEATH",
        runResult: null,
        hasReportHandler: true,
      })
    ).toBe(false);
  });

  it("ömür sonundan sonra başlayan dönem düşer, bitiş ömür sonuna kısalır", () => {
    const capped = capDatedPeriodsByDeceasedLifeEnd(
      [
        { startDate: "2026-09-03", endDate: "2033-05-19" },
        { startDate: "2031-02-08", endDate: "2035-02-20" },
        { startDate: LIFE_END, endDate: "2033-05-19" },
      ],
      LIFE_END
    );
    expect(capped).toEqual([
      { startDate: "2026-09-03", endDate: LIFE_END },
      { startDate: LIFE_END, endDate: LIFE_END },
    ]);
  });
});
