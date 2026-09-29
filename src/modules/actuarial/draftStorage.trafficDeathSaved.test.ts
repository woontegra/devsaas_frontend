import { describe, it, expect } from "vitest";
import { hydrateTrafficDeathDraft } from "./draftStorage";
import { CALCULATION_SCHEMA_VERSION } from "./types/calculationDraft";

describe("hydrateTrafficDeathDraft", () => {
  it("restores beneficiaries remarriage and family info", () => {
    const hydrated = hydrateTrafficDeathDraft({
      schemaVersion: CALCULATION_SCHEMA_VERSION,
      calculationType: "TRAFFIC_DEATH",
      deceased: {
        birthDate: "1946-02-20",
        deathDate: "2024-04-15",
        gender: "male",
        fullName: "Ahmet",
      },
      deceasedFamilyInfo: {
        maritalStatus: "MARRIED",
        militaryStatus: "COMPLETED",
        militaryServiceStartDate: "1966-01-01",
        militaryServiceDurationMonths: 12,
        educationStatus: "primary",
        hasChildren: true,
        childrenCount: 1,
        children: [],
      },
      beneficiaries: [
        {
          id: "sp",
          fullName: "Eş",
          relation: "spouse",
          birthDate: "1950-05-15",
          gender: "female",
          remarried: true,
          remarriageDate: "2025-01-01",
        },
      ],
      marriageProbabilityDeduction: { under18ChildCount: 2, note: "eş notu" },
      educationExpenseDeduction: { notes: "eğitim notu" },
    });

    expect(hydrated.deceased.fullName).toBe("Ahmet");
    expect(hydrated.deceasedFamilyInfo.militaryServiceDurationMonths).toBe(12);
    expect(hydrated.deceasedFamilyInfo.educationStatus).toBe("primary");
    expect(hydrated.beneficiaries[0]?.remarried).toBe(true);
    expect(hydrated.beneficiaries[0]?.remarriageDate).toBe("2025-01-01");
    expect(hydrated.marriageProbabilityDeduction).toEqual({ under18ChildCount: 2, note: "eş notu" });
    expect(hydrated.educationExpenseDeduction).toEqual({ notes: "eğitim notu" });
    expect(hydrated.sosyalYardimOdenekleri).toEqual([]);
    expect(hydrated.capitalValueDocuments).toEqual([]);
    expect(hydrated.zmtsPayments).toEqual([]);
    expect(hydrated.cascoPayments).toEqual([]);

    const legacy = hydrateTrafficDeathDraft({
      schemaVersion: CALCULATION_SCHEMA_VERSION,
      calculationType: "TRAFFIC_DEATH",
      marriageProbabilityDeduction: { ready: false },
      educationExpenseDeduction: { ready: false },
    });
    expect(legacy.marriageProbabilityDeduction).toEqual({ under18ChildCount: 0, note: "" });
    expect(legacy.educationExpenseDeduction).toEqual({ notes: "" });
    expect(legacy.capitalValueDocuments).toEqual([]);
    expect(legacy.priorPayments).toEqual([]);

    const withCards = hydrateTrafficDeathDraft({
      schemaVersion: CALCULATION_SCHEMA_VERSION,
      calculationType: "TRAFFIC_DEATH",
      sosyalYardimOdenekleri: [{ id: "s1", amount: 10, notes: "yardım" }],
      capitalValueDocuments: [{ id: "p1", amount: 20 }],
      zmtsPayments: [{ id: "z1", paymentDate: "2023-01-01", paymentAmount: 30, liabilityLimit: 0, claimantId: "sp", claimantName: "Eş", claimantRelation: "spouse", garameEnabled: true, deathGarameRows: [{ claimantId: "ayse", claimantStatus: "OUT_OF_CASE", paymentDate: "2023-03-01", paymentAmount: 12, liabilityLimit: 3, accidentLimit: 4 }] }],
      cascoPayments: [{ id: "k1", paymentDate: "2023-02-01", paymentAmount: 40, liabilityLimit: 0, claimantId: "ali", claimantName: "Ali", claimantRelation: "child", garameEnabled: true, deathGarameRows: [{ claimantId: "mehmet", claimantStatus: "OUT_OF_CASE", paymentDate: "2023-04-01", paymentAmount: 8, liabilityLimit: 1, accidentLimit: 2 }] }],
      priorPayments: [{ id: "old", amount: 5 }],
    });
    expect(withCards.sosyalYardimOdenekleri?.[0]?.amount).toBe(10);
    expect(withCards.capitalValueDocuments?.[0]?.amount).toBe(20);
    expect(withCards.zmtsPayments?.[0]?.paymentAmount).toBe(30);
    expect(withCards.zmtsPayments?.[0]?.claimantId).toBe("sp");
    expect(withCards.zmtsPayments?.[0]?.claimantName).toBe("Eş");
    expect(withCards.zmtsPayments?.[0]?.garameEnabled).toBe(true);
    expect(withCards.zmtsPayments?.[0]?.deathGarameRows?.[0]?.claimantId).toBe("ayse");
    expect(withCards.zmtsPayments?.[0]?.deathGarameRows?.[0]?.paymentAmount).toBe(12);
    expect(withCards.zmtsPayments?.[0]?.deathGarameRows?.[0]?.accidentLimit).toBe(4);
    expect(withCards.cascoPayments?.[0]?.paymentAmount).toBe(40);
    expect(withCards.cascoPayments?.[0]?.claimantId).toBe("ali");
    expect(withCards.cascoPayments?.[0]?.claimantName).toBe("Ali");
    expect(withCards.cascoPayments?.[0]?.garameEnabled).toBe(true);
    expect(withCards.cascoPayments?.[0]?.deathGarameRows?.[0]?.claimantId).toBe("mehmet");
    expect(withCards.cascoPayments?.[0]?.deathGarameRows?.[0]?.paymentAmount).toBe(8);
    expect(withCards.cascoPayments?.[0]?.deathGarameRows?.[0]?.accidentLimit).toBe(2);
    expect(withCards.priorPayments[0]?.amount).toBe(5);
  });
});
