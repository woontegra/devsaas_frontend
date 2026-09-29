import { describe, expect, it } from "vitest";
import type { TrafficDeathCalculationResult } from "../types/trafficDeathResult";
import {
  capDatedPeriodsByDeceasedLifeEnd,
  normalizeTrafficDeathCalculationResult,
  resolveDeceasedProbableLifeEndDate,
} from "./capTrafficDeathToDeceasedLifeEnd";
import { buildTrafficDeathSharePrinciples } from "./buildTrafficDeathSharePrinciples";
import { CALCULATION_SCHEMA_VERSION } from "../types/calculationDraft";
import type { TrafficDeathDraft } from "../types/calculationDraft";

const CAP = "2031-02-06";

function staleResult(): TrafficDeathCalculationResult {
  return {
    calculationType: "TRAFFIC_DEATH",
    resolvedIncome: {
      incomeMode: "fixed",
      monthlyNetAtEvent: 10000,
      monthlyNetAtCalculation: 10000,
      dailyNetAtCalculation: 333.33,
      coefficient: 1,
      eventDateMinWage: null,
    },
    dailyNetIncome: 333.33,
    personLives: [
      {
        personId: "deceased",
        role: "DECEASED",
        birthDate: "1970-01-01",
        gender: "male",
        remainingLifetime: { years: 6, months: 0, days: 0, decimalYears: 6 },
        probableLifeEndDate: CAP,
      },
      {
        personId: "c1",
        role: "CHILD",
        birthDate: "2011-05-20",
        gender: "female",
        remainingLifetime: { years: 10, months: 0, days: 0, decimalYears: 10 },
        probableLifeEndDate: "2040-01-01",
        supportEndDate: "2033-05-20",
        effectiveSupportEndDate: "2033-05-20",
      },
      {
        personId: "sp",
        role: "SPOUSE",
        birthDate: "1975-01-01",
        gender: "female",
        remainingLifetime: { years: 20, months: 0, days: 0, decimalYears: 20 },
        probableLifeEndDate: "2035-02-20",
        supportEndDate: "2035-02-20",
        effectiveSupportEndDate: "2035-02-20",
      },
    ],
    shareRatioPeriods: [
      {
        startDate: "2026-09-03",
        endDate: "2031-02-05",
        periodType: "FUTURE",
        shares: { deceased: "2/6", sp: "2/6", c1: "1/6" },
        percentages: { deceased: "%33", sp: "%33", c1: "%17" },
      },
      {
        startDate: "2031-02-06",
        endDate: "2033-05-19",
        periodType: "FUTURE",
        shares: { deceased: "2/5", sp: "2/5", c1: "1/5" },
        percentages: { deceased: "%40", sp: "%40", c1: "%20" },
      },
      {
        startDate: "2033-05-20",
        endDate: "2035-02-20",
        periodType: "FUTURE",
        shares: { deceased: "2/4", sp: "2/4" },
        percentages: { deceased: "%50", sp: "%50" },
      },
      {
        startDate: "2035-02-21",
        endDate: "2035-02-21",
        periodType: "FUTURE",
        shares: { deceased: "2/2" },
        percentages: { deceased: "%100" },
      },
    ],
    columnKeys: [],
    supportPeriods: [
      { startDate: "2026-09-03", endDate: "2031-02-05" },
      { startDate: "2031-02-06", endDate: "2033-05-19" },
      { startDate: "2033-05-20", endDate: "2035-02-20" },
    ],
    processedPeriods: [],
    futurePeriods: [
      {
        startDate: "2026-09-03",
        endDate: "2031-02-05",
        dayCount: 1000,
        monthlyNetIncome: 10000,
        dailyNetIncome: 333.33,
        kn: 1,
        discountFactor: 1,
        increasedIncome: 10000,
        discountedIncome: 10000,
        claimantId: "sp",
        claimantName: "Eş",
        claimantStatus: "PLAINTIFF",
        relationLabel: "Eş",
        shareFraction: "2/6",
        sharePercentage: 33.33,
        periodDamage: 1000,
        periodKind: "future_support",
        periodIndex: 0,
      },
      {
        startDate: "2031-02-06",
        endDate: "2033-05-19",
        dayCount: 800,
        monthlyNetIncome: 10000,
        dailyNetIncome: 333.33,
        kn: 1,
        discountFactor: 1,
        increasedIncome: 10000,
        discountedIncome: 10000,
        claimantId: "sp",
        claimantName: "Eş",
        claimantStatus: "PLAINTIFF",
        relationLabel: "Eş",
        shareFraction: "2/5",
        sharePercentage: 40,
        periodDamage: 800,
        periodKind: "future_support",
        periodIndex: 1,
      },
      {
        startDate: "2033-05-20",
        endDate: "2035-02-20",
        dayCount: 600,
        monthlyNetIncome: 10000,
        dailyNetIncome: 333.33,
        kn: 1,
        discountFactor: 1,
        increasedIncome: 10000,
        discountedIncome: 10000,
        claimantId: "sp",
        claimantName: "Eş",
        claimantStatus: "PLAINTIFF",
        relationLabel: "Eş",
        shareFraction: "2/4",
        sharePercentage: 50,
        periodDamage: 600,
        periodKind: "future_support",
        periodIndex: 2,
      },
    ],
    claimantLosses: [
      {
        claimantId: "sp",
        claimantName: "Eş",
        relationLabel: "Eş",
        claimantStatus: "PLAINTIFF",
        processedLoss: 0,
        futureLoss: 2400,
        totalLoss: 2400,
      },
    ],
    processedTotal: 0,
    futureTotal: 2400,
    totalSupportLoss: 2400,
    deceasedFaultRate: 0,
    faultDeductionAmount: 0,
    totalAfterFault: 2400,
    deathExpenses: {
      preDeathTreatment: 0,
      funeralCost: 0,
      transportCost: 0,
      otherExpenses: 0,
      total: 0,
    },
    priorPaymentsTotal: 0,
    priorPaymentsApplied: false,
    finalCompensation: 2400,
    warnings: [],
  };
}

describe("capTrafficDeathToDeceasedLifeEnd", () => {
  it("restores an old snapshot by applying deceased fault once per claimant", () => {
    const legacy = staleResult();
    legacy.personLives = [];
    legacy.deceasedFaultRate = 35;
    legacy.claimantLosses = [
      {
        claimantId: "a",
        claimantName: "Yüksel Ergin",
        relationLabel: "Eş",
        claimantStatus: "PLAINTIFF",
        processedLoss: 200_000,
        futureLoss: 500_000,
        totalLoss: 700_000,
      },
      {
        claimantId: "b",
        claimantName: "Ebru Aydın",
        relationLabel: "Çocuk",
        claimantStatus: "PLAINTIFF",
        processedLoss: 100_000,
        futureLoss: 300_000,
        totalLoss: 400_000,
      },
    ];
    legacy.totalSupportLoss = 1_100_000;
    legacy.totalAfterFault = 715_000;
    legacy.faultDeductionAmount = 385_000;
    legacy.finalCompensation = 715_000;
    const restored = normalizeTrafficDeathCalculationResult(legacy);
    expect(restored.claimantLosses.map((c) => c.lossAfterDeceasedFault)).toEqual([455_000, 260_000]);
    expect(restored.totalAfterFault).toBe(715_000);
    expect(restored.finalCompensation).toBe(715_000);
  });

  it("resolveDeceasedProbableLifeEndDate reads DECEASED life", () => {
    expect(resolveDeceasedProbableLifeEndDate(staleResult().personLives)).toBe(CAP);
  });

  it("drops periods that start after deceased life end and clamps endDate", () => {
    const capped = capDatedPeriodsByDeceasedLifeEnd(
      [
        { startDate: "2026-09-03", endDate: "2033-05-19" },
        { startDate: "2031-02-07", endDate: "2035-02-20" },
        { startDate: CAP, endDate: "2033-05-19" },
      ],
      CAP
    );
    expect(capped).toEqual([
      { startDate: "2026-09-03", endDate: CAP },
      { startDate: CAP, endDate: CAP },
    ]);
  });

  it("normalize removes all post-cap share / future / support rows from stale snapshot", () => {
    const normalized = normalizeTrafficDeathCalculationResult(staleResult());

    const maxEnd = (rows: Array<{ endDate: string }>) =>
      rows.reduce((m, r) => (r.endDate > m ? r.endDate : m), "0000-01-01");

    expect(maxEnd(normalized.shareRatioPeriods) <= CAP).toBe(true);
    expect(normalized.shareRatioPeriods.every((p) => p.startDate <= CAP)).toBe(true);
    expect(normalized.shareRatioPeriods.some((p) => p.endDate > CAP)).toBe(false);
    expect(normalized.shareRatioPeriods.some((p) => p.startDate > CAP)).toBe(false);
    expect(normalized.shareRatioPeriods.some((p) => p.startDate.startsWith("2033"))).toBe(false);
    expect(normalized.shareRatioPeriods.some((p) => p.startDate.startsWith("2035"))).toBe(false);

    expect(maxEnd(normalized.futurePeriods) <= CAP).toBe(true);
    expect(normalized.futurePeriods.every((p) => p.startDate <= CAP)).toBe(true);

    const support = normalized.supportPeriods as Array<{ startDate: string; endDate: string }>;
    expect(maxEnd(support) <= CAP).toBe(true);

    const child = (
      normalized.personLives as Array<{
        personId: string;
        effectiveSupportEndDate?: string | null;
      }>
    ).find((p) => p.personId === "c1");
    expect(child?.effectiveSupportEndDate).toBe(CAP);
  });

  it("share principles dönem geçişleri has no events after deceased life end", () => {
    const draft: TrafficDeathDraft = {
      schemaVersion: CALCULATION_SCHEMA_VERSION,
      calculationType: "TRAFFIC_DEATH",
      common: { eventDate: "2024-04-15", calculationDate: "2026-04-10" },
      deceased: {
        birthDate: "1970-01-01",
        deathDate: "2024-04-15",
        gender: "male",
        fullName: "Müteveffa",
      },
      employmentStatus: "WORKING",
      deceasedFamilyInfo: {
        maritalStatus: "MARRIED",
        militaryStatus: null,
        educationStatus: "graduate",
        hasChildren: true,
        childrenCount: 1,
        children: [],
      },
      accidentIncome: { incomeMode: "fixed", fixedAmount: 10000, averageSources: [] },
      nonWorkingSelectedIncome: null,
      incomePeriods: [],
      beneficiaries: [
        {
          id: "sp",
          fullName: "Eş",
          relation: "spouse",
          birthDate: "1975-01-01",
          gender: "female",
          claimantStatus: "PLAINTIFF",
        },
        {
          id: "c1",
          fullName: "Çocuk",
          relation: "child",
          birthDate: "2011-05-20",
          gender: "female",
          claimantStatus: "PLAINTIFF",
        },
      ],
      supportRelations: [],
      liability: { injuredFaultRatio: 0, parties: [] },
      deathExpenses: { otherExpenses: [] },
      priorPayments: [],
      insurance: {},
    };

    const normalized = normalizeTrafficDeathCalculationResult(staleResult());
    const content = buildTrafficDeathSharePrinciples({
      draft,
      shareRatioPeriods: normalized.shareRatioPeriods,
      personLives: normalized.personLives as never,
      deceasedProbableLifeEndDate: CAP,
    });

    expect(content).not.toBeNull();
    expect(content!.periodNotes.every((n) => n.startDate <= CAP)).toBe(true);
    expect(content!.periodNotes.some((n) => n.startDate.startsWith("2033"))).toBe(false);
    expect(content!.periodNotes.some((n) => n.rangeLabel.includes("2035"))).toBe(false);
    expect(
      content!.paragraphs.some((p) => p.includes("06.02.2031") && p.includes("sona ermiştir"))
    ).toBe(true);
  });
});
