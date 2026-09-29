import { describe, expect, it } from "vitest";
import { CALCULATION_SCHEMA_VERSION } from "../types/calculationDraft";
import type { TrafficDeathDraft } from "../types/calculationDraft";
import type { TrafficDeathPersonLife } from "../types/trafficDeathSupportPeriods";
import type { TrafficDeathShareRatioPeriod } from "../types/trafficDeathShareRatios";
import { buildTrafficDeathSharePrinciples } from "./buildTrafficDeathSharePrinciples";

function baseDraft(over: Partial<TrafficDeathDraft> = {}): TrafficDeathDraft {
  return {
    schemaVersion: CALCULATION_SCHEMA_VERSION,
    calculationType: "TRAFFIC_DEATH",
    common: { eventDate: "2024-04-15", calculationDate: "2024-09-02" },
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
        fullName: "Yüksel Ergin",
        relation: "spouse",
        birthDate: "1975-01-01",
        gender: "female",
        claimantStatus: "PLAINTIFF",
      },
      {
        id: "c1",
        fullName: "Ebru Aydın",
        relation: "child",
        birthDate: "2011-05-20",
        gender: "female",
        claimantStatus: "PLAINTIFF",
      },
      {
        id: "mo",
        fullName: "Özgür Ergin",
        relation: "mother",
        birthDate: "1948-01-01",
        gender: "female",
        claimantStatus: "OUT_OF_CASE",
      },
      {
        id: "fa",
        fullName: "Ahmet Aydın",
        relation: "father",
        birthDate: "1945-01-01",
        gender: "male",
        claimantStatus: "OUT_OF_CASE",
      },
    ],
    supportRelations: [],
    liability: { injuredFaultRatio: 0, parties: [] },
    deathExpenses: { otherExpenses: [] },
    priorPayments: [],
    insurance: {},
    ...over,
  };
}

function life(
  over: Partial<TrafficDeathPersonLife> & Pick<TrafficDeathPersonLife, "personId" | "role">
): TrafficDeathPersonLife {
  return {
    birthDate: "1970-01-01",
    gender: "female",
    remainingLifetime: { years: 20, months: 0, days: 0, decimalYears: 20 },
    probableLifeEndDate: "2045-01-01",
    ...over,
  };
}

describe("buildTrafficDeathSharePrinciples", () => {
  it("isimleri dinamik üretir; baba/anne çıkışını ve dönem tarihlerini açıklar", () => {
    const draft = baseDraft();
    const lives: TrafficDeathPersonLife[] = [
      life({
        personId: "sp",
        role: "SPOUSE",
        effectiveSupportEndDate: "2040-01-01",
      }),
      life({
        personId: "c1",
        role: "CHILD",
        gender: "female",
        birthDate: "2011-05-20",
        supportEndDate: "2033-05-20",
        effectiveSupportEndDate: "2033-05-20",
      }),
      life({
        personId: "mo",
        role: "MOTHER",
        effectiveSupportEndDate: "2026-04-10",
        supportEndDate: "2026-04-10",
      }),
      life({
        personId: "fa",
        role: "FATHER",
        gender: "male",
        effectiveSupportEndDate: "2024-10-15",
        supportEndDate: "2024-10-15",
      }),
    ];

    const periods: TrafficDeathShareRatioPeriod[] = [
      {
        startDate: "2024-04-15",
        endDate: "2024-10-14",
        periodType: "PAST",
        shares: { deceased: "2/7", sp: "2/7", c1: "1/7", mo: "1/7", fa: "1/7" },
        percentages: {},
      },
      {
        startDate: "2024-10-15",
        endDate: "2026-04-09",
        periodType: "PAST",
        shares: { deceased: "2/6", sp: "2/6", c1: "1/6", mo: "(1+1)/6" },
        percentages: {},
      },
      {
        startDate: "2026-04-10",
        endDate: "2026-09-02",
        periodType: "PAST",
        shares: { deceased: "2/5", sp: "2/5", c1: "1/5" },
        percentages: {},
      },
      {
        startDate: "2026-09-03",
        endDate: "2033-05-19",
        periodType: "FUTURE",
        shares: { deceased: "2/5", sp: "2/5", c1: "1/5" },
        percentages: {},
      },
    ];

    const content = buildTrafficDeathSharePrinciples({
      draft,
      shareRatioPeriods: periods,
      personLives: lives,
    });

    expect(content).not.toBeNull();
    expect(content!.intro).toContain("Yargıtay 17. Hukuk Dairesinin");
    expect(content!.paragraphs.some((p) => p.includes("Yüksel Ergin"))).toBe(true);
    expect(content!.paragraphs.some((p) => p.includes("Ebru Aydın"))).toBe(true);
    expect(content!.paragraphs.some((p) => p.includes("Özgür Ergin"))).toBe(true);
    expect(content!.paragraphs.some((p) => p.includes("Ahmet Aydın"))).toBe(true);
    expect(content!.paragraphs.some((p) => p.includes("Baba Ahmet Aydın"))).toBe(true);
    expect(content!.paragraphs.some((p) => p.includes("%25"))).toBe(true);
    expect(content!.paragraphs.some((p) => p.includes("22 yaş") || p.includes("22 yaşına"))).toBe(true);

    expect(content!.periodNotes).toHaveLength(4);
    expect(content!.periodNotes[0]!.rangeLabel).toBe("15.04.2024 – 14.10.2024");
    expect(content!.periodNotes[0]!.text).toMatch(/Başlangıç dönemi/i);
    expect(content!.periodNotes[1]!.text).toMatch(/baba/i);
    expect(content!.periodNotes[2]!.text).toMatch(/anne/i);
  });

  it("yeniden evlilik yoksa remarriage paragrafı üretmez", () => {
    const content = buildTrafficDeathSharePrinciples({
      draft: baseDraft(),
      shareRatioPeriods: [
        {
          startDate: "2024-04-15",
          endDate: "2025-01-01",
          shares: { deceased: "2/7", sp: "2/7" },
        },
      ],
      personLives: [],
    });
    expect(content!.paragraphs.some((p) => /yeniden evlen/i.test(p))).toBe(false);
  });

  it("askerlik etiketli dönem varsa askerlik paragrafı üretir", () => {
    const content = buildTrafficDeathSharePrinciples({
      draft: baseDraft({
        deceasedFamilyInfo: {
          maritalStatus: "SINGLE",
          militaryStatus: "NOT_COMPLETED",
          militaryServiceStartDate: "2024-06-01",
          militaryServiceDurationMonths: 12,
          educationStatus: "graduate",
          hasChildren: false,
          childrenCount: 0,
          children: [],
        },
        beneficiaries: [],
      }),
      shareRatioPeriods: [
        {
          startDate: "2024-06-01",
          endDate: "2025-05-26",
          label: "Askerlik Dönemi",
          shares: {},
        },
      ],
      personLives: [],
    });
    expect(content!.paragraphs.some((p) => /Askerlik süresince/i.test(p))).toBe(true);
    expect(content!.periodNotes[0]!.text).toMatch(/Askerlik/i);
  });
});
