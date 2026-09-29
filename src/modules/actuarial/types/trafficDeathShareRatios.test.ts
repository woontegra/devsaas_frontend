import { describe, it, expect } from "vitest";
import type { TrafficDeathDraft } from "../types/calculationDraft";
import { CALCULATION_SCHEMA_VERSION } from "../types/calculationDraft";
import {
  buildBeneficiaryColumnHeader,
  buildTrafficDeathShareRatioColumns,
} from "../wizard/shared/trafficDeathShareRatioColumns";
import { extractTrafficDeathShareRatioPeriods } from "../types/trafficDeathShareRatios";

function sampleDraft(): TrafficDeathDraft {
  return {
    schemaVersion: CALCULATION_SCHEMA_VERSION,
    calculationType: "TRAFFIC_DEATH",
    common: { eventDate: "2020-06-01", calculationDate: "2024-01-15" },
    deceased: {
      birthDate: "1970-01-01",
      deathDate: "2020-06-01",
      gender: "male",
      fullName: "Ahmet Yılmaz",
    },
    employmentStatus: "WORKING",
    accidentIncome: { incomeMode: "fixed", fixedAmount: 10000, averageSources: [] },
    nonWorkingSelectedIncome: null,
    incomePeriods: [],
    beneficiaries: [
      {
        id: "b-mother",
        fullName: "Fatma",
        relation: "mother",
        birthDate: "1945-01-01",
        gender: "female",
        claimantStatus: "PLAINTIFF",
      },
      {
        id: "b-spouse",
        fullName: "Ayşe",
        relation: "spouse",
        birthDate: "1975-01-01",
        gender: "female",
        claimantStatus: "PLAINTIFF",
      },
      {
        id: "b-child1",
        fullName: "Ali",
        relation: "child",
        birthDate: "2000-01-01",
        gender: "male",
        claimantStatus: "OUT_OF_CASE",
      },
      {
        id: "b-child2",
        fullName: "Zeynep",
        relation: "child",
        birthDate: "2002-01-01",
        gender: "female",
        claimantStatus: "PLAINTIFF",
      },
    ],
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

describe("trafficDeathShareRatioColumns", () => {
  it("builds deceased + beneficiary columns with numbered children", () => {
    const cols = buildTrafficDeathShareRatioColumns(sampleDraft());
    expect(cols.map((c) => c.header)).toEqual([
      "MÜTEVEFFA",
      "ANNE",
      "EŞ",
      "1. ÇOCUK",
      "2. ÇOCUK",
    ]);
    expect(cols[1]?.claimantStatus).toBe("PLAINTIFF");
    expect(cols[3]?.claimantStatus).toBe("OUT_OF_CASE");
  });

  it("numbers child headers sequentially", () => {
    expect(
      buildBeneficiaryColumnHeader(
        { id: "1", fullName: "", relation: "child", birthDate: "", gender: "male" },
        2
      )
    ).toBe("2. ÇOCUK");
  });
});

describe("extractTrafficDeathShareRatioPeriods", () => {
  it("reads periods from shareRatioTable or shareRatioPeriods", () => {
    const periods = [
      {
        startDate: "2020-01-01",
        endDate: "2020-06-01",
        shares: { deceased: "2/6", "b-mother": "1/6" },
      },
    ];
    expect(extractTrafficDeathShareRatioPeriods({ shareRatioPeriods: periods })).toEqual(periods);
    expect(extractTrafficDeathShareRatioPeriods({ shareRatioTable: { periods } })).toEqual(
      periods
    );
    expect(extractTrafficDeathShareRatioPeriods(null)).toEqual([]);
  });
});
