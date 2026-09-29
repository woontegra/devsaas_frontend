import { describe, it, expect } from "vitest";
import { CALCULATION_SCHEMA_VERSION } from "../types/calculationDraft";
import type { TrafficDeathDraft } from "../types/calculationDraft";
import {
  coerceDeceasedFamilyInfo,
  countChildrenByGender,
  emptyDeceasedFamilyInfo,
  patchDeceasedFamilyInfo,
  patchDeceasedGender,
  syncDeceasedChildrenArray,
} from "./deceasedFamilyUtils";

function baseDraft(): TrafficDeathDraft {
  return {
    schemaVersion: CALCULATION_SCHEMA_VERSION,
    calculationType: "TRAFFIC_DEATH",
    common: { eventDate: "", calculationDate: "" },
    deceased: { birthDate: "", deathDate: "", gender: "male" },
    deceasedFamilyInfo: emptyDeceasedFamilyInfo(),
    employmentStatus: null,
    accidentIncome: { incomeMode: "minWage", fixedAmount: null, averageSources: [] },
    nonWorkingSelectedIncome: null,
    incomePeriods: [],
    beneficiaries: [],
    supportRelations: [],
    liability: { injuredFaultRatio: 0, parties: [] },
    deceasedFaultRate: 0,
    responsibleParties: [],
    externalFaultRate: 0,
    deathExpenses: { otherExpenses: [] },
    priorPayments: [],
    insurance: {},
  };
}

describe("deceasedFamilyUtils", () => {
  it("syncs child rows to total count", () => {
    const rows = syncDeceasedChildrenArray(3, []);
    expect(rows).toHaveLength(3);
    expect(rows[0]?.id).toBeTruthy();
  });

  it("counts gender from child rows", () => {
    const rows = syncDeceasedChildrenArray(3, []);
    rows[0]!.gender = "female";
    rows[1]!.gender = "female";
    expect(countChildrenByGender(rows)).toEqual({ female: 2, male: 1 });
  });

  it("clears children when hasChildren false", () => {
    const draft = patchDeceasedFamilyInfo(
      {
        ...baseDraft(),
        deceasedFamilyInfo: {
          ...emptyDeceasedFamilyInfo(),
          hasChildren: true,
          childrenCount: 2,
          children: syncDeceasedChildrenArray(2, []),
        },
      },
      { hasChildren: false }
    );
    expect(draft.deceasedFamilyInfo.hasChildren).toBe(false);
    expect(draft.deceasedFamilyInfo.children).toHaveLength(0);
    expect(draft.deceasedFamilyInfo.childrenCount).toBe(0);
  });

  it("clears military status when gender becomes female", () => {
    const draft = patchDeceasedGender(
      {
        ...baseDraft(),
        deceasedFamilyInfo: {
          ...emptyDeceasedFamilyInfo(),
          militaryStatus: "COMPLETED",
        },
      },
      "female"
    );
    expect(draft.deceased.gender).toBe("female");
    expect(draft.deceasedFamilyInfo.militaryStatus).toBeNull();
  });

  it("coerces legacy drafts without family info", () => {
    expect(coerceDeceasedFamilyInfo(undefined)).toEqual(emptyDeceasedFamilyInfo());
  });

  it("preserves education status and other description", () => {
    const coerced = coerceDeceasedFamilyInfo({
      educationStatus: "other",
      educationOtherDescription: "Özel bakım",
    });
    expect(coerced.educationStatus).toBe("other");
    expect(coerced.educationOtherDescription).toBe("Özel bakım");
  });
});
