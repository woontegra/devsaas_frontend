import { describe, expect, it } from "vitest";
import { coercePersonLives } from "./types/trafficDeathSupportPeriods";
import { calendarAgeYmd, formatDateIso } from "./utils/formatDisplay";
import { trafficDeathFaultSum } from "./utils/trafficDeathFaultRates";
import {
  isStaleExclusiveDeceasedLifeEndResult,
  normalizeTrafficDeathCalculationResult,
  resolveDeceasedProbableLifeEndDate,
} from "./results/capTrafficDeathToDeceasedLifeEnd";
import type { TrafficDeathCalculationResult } from "./types/trafficDeathResult";

describe("TRAFFIC_DEATH review result data", () => {
  it("coerces personLives from motor snapshot without inventing money", () => {
    const lives = coercePersonLives([
      {
        personId: "deceased",
        role: "DECEASED",
        birthDate: "1970-01-01",
        gender: "male",
        remainingLifetime: { years: 12, months: 3, days: 4, decimalYears: 12.26 },
        probableLifeEndDate: "2036-04-15",
      },
      {
        personId: "sp",
        role: "SPOUSE",
        birthDate: "1975-05-15",
        gender: "female",
        remainingLifetime: { years: 20, months: 0, days: 0, decimalYears: 20 },
        probableLifeEndDate: "2044-04-15",
        supportEndDate: "2044-04-15",
        effectiveSupportEndDate: "2028-01-01",
      },
      { garbage: true },
    ]);
    expect(lives).toHaveLength(2);
    expect(lives[0]?.role).toBe("DECEASED");
    expect(lives[1]?.effectiveSupportEndDate).toBe("2028-01-01");
    expect(JSON.stringify(lives)).not.toMatch(/100000|tazminat/i);
  });

  it("calendar age at death is derived from birth and death dates", () => {
    expect(calendarAgeYmd("1970-01-01", "2020-06-01")).toEqual({
      years: 50,
      months: 5,
      days: 0,
    });
  });

  it("unselected sorumlular are not in fault sum", () => {
    expect(trafficDeathFaultSum(20, [{ id: "d1", type: "INDIVIDUAL_DRIVER", faultRatio: 80 }], 0)).toBe(100);
    expect(trafficDeathFaultSum(20, [], 0)).toBe(20);
  });

  it("Hesap Özeti SSoT: personLives deceased.probableLifeEndDate = 07.02.2031 (no frontend recompute)", () => {
    const lives = coercePersonLives([
      {
        personId: "deceased",
        role: "DECEASED",
        birthDate: "1946-02-20",
        gender: "male",
        remainingLifetime: { years: 6, months: 9, days: 22, decimalYears: 6.8 },
        probableLifeEndDate: "2031-02-07",
      },
    ]);
    const end = resolveDeceasedProbableLifeEndDate(lives);
    expect(end).toBe("2031-02-07");
    expect(formatDateIso(end)).toBe("07.02.2031");
    expect(formatDateIso(end)).not.toBe("06.02.2031");
  });

  it("Hesap Özeti: stale monetary 06.02.2031 loses to live support 07.02.2031", () => {
    const staleMonetaryLives = coercePersonLives([
      {
        personId: "deceased",
        role: "DECEASED",
        birthDate: "1946-02-20",
        gender: "male",
        remainingLifetime: { years: 6, months: 9, days: 22, decimalYears: 6.81 },
        probableLifeEndDate: "2031-02-06",
      },
    ]);
    const liveSupportLives = coercePersonLives([
      {
        personId: "deceased",
        role: "DECEASED",
        birthDate: "1946-02-20",
        gender: "male",
        remainingLifetime: { years: 6, months: 9, days: 22, decimalYears: 6.81 },
        probableLifeEndDate: "2031-02-07",
      },
    ]);
    const monetaryEnd = resolveDeceasedProbableLifeEndDate(staleMonetaryLives);
    const supportEnd = resolveDeceasedProbableLifeEndDate(liveSupportLives);
    const preferred =
      monetaryEnd && supportEnd && monetaryEnd !== supportEnd
        ? supportEnd
        : monetaryEnd || supportEnd;
    expect(preferred).toBe("2031-02-07");
    expect(formatDateIso(preferred)).toBe("07.02.2031");
  });

  it("detects stale exclusive boundary when periods end day before life end", () => {
    expect(
      isStaleExclusiveDeceasedLifeEndResult({
        personLives: [
          {
            personId: "deceased",
            role: "DECEASED",
            birthDate: "1946-02-20",
            gender: "male",
            remainingLifetime: { years: 6, months: 9, days: 22, decimalYears: 6.81 },
            probableLifeEndDate: "2031-02-07",
          },
        ],
        shareRatioPeriods: [{ startDate: "2026-09-03", endDate: "2031-02-06", shares: {} }],
        futurePeriods: [{ endDate: "2031-02-06" }],
      })
    ).toBe(true);

    expect(
      isStaleExclusiveDeceasedLifeEndResult({
        personLives: [
          {
            personId: "deceased",
            role: "DECEASED",
            birthDate: "1946-02-20",
            gender: "male",
            remainingLifetime: { years: 6, months: 9, days: 22, decimalYears: 6.81 },
            probableLifeEndDate: "2031-02-07",
          },
        ],
        shareRatioPeriods: [{ startDate: "2026-09-03", endDate: "2031-02-07", shares: {} }],
        futurePeriods: [{ endDate: "2031-02-07" }],
      })
    ).toBe(false);
  });

  it("normalize keeps backend actuarial30 life end; does not invent calendar 06.02.2031", () => {
    const result = {
      calculationType: "TRAFFIC_DEATH",
      resolvedIncome: {
        incomeMode: "fixed",
        monthlyNetAtEvent: 1,
        monthlyNetAtCalculation: 1,
        dailyNetAtCalculation: 1,
        coefficient: 1,
        eventDateMinWage: null,
      },
      dailyNetIncome: 1,
      personLives: [
        {
          personId: "deceased",
          role: "DECEASED",
          birthDate: "1946-02-20",
          gender: "male",
          remainingLifetime: { years: 6, months: 9, days: 22, decimalYears: 6.8 },
          probableLifeEndDate: "2031-02-07",
        },
      ],
      shareRatioPeriods: [
        {
          startDate: "2026-09-03",
          endDate: "2031-02-07",
          shares: { deceased: "2/4" },
        },
      ],
      columnKeys: [],
      supportPeriods: [{ startDate: "2026-09-03", endDate: "2031-02-07" }],
      processedPeriods: [],
      futurePeriods: [],
      claimantLosses: [],
      processedTotal: 0,
      futureTotal: 0,
      totalSupportLoss: 0,
      deceasedFaultRate: 0,
      faultDeductionAmount: 0,
      totalAfterFault: 0,
      deathExpenses: {
        preDeathTreatment: 0,
        funeralCost: 0,
        transportCost: 0,
        otherExpenses: 0,
        total: 0,
      },
      priorPaymentsTotal: 0,
      priorPaymentsApplied: false,
      finalCompensation: 0,
      warnings: [],
    } as TrafficDeathCalculationResult;

    const normalized = normalizeTrafficDeathCalculationResult(result);
    expect(resolveDeceasedProbableLifeEndDate(normalized.personLives)).toBe("2031-02-07");
    expect(JSON.stringify(normalized)).not.toContain("2031-02-06");
  });
});
