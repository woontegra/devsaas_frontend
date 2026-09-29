import { describe, expect, it } from "vitest";
import { hydrateTrafficDeathDraft } from "./draftStorage";
import { CALCULATION_SCHEMA_VERSION } from "./types/calculationDraft";
import { extractTrafficDeathShareRatioPeriods } from "./types/trafficDeathShareRatios";
import { isUsableTrafficDeathPayResult } from "./types/trafficDeathSupportPeriods";

const periods = [
  {
    startDate: "2024-04-15",
    endDate: "2025-01-01",
    shares: { deceased: "2/6", sp: "2/6", mo: "1/6", fa: "1/6" },
    percentages: { deceased: "%33", sp: "%33", mo: "%17", fa: "%17" },
  },
];

describe("TRAFFIC_DEATH pay table restore", () => {
  it("restored result snapshot keeps share periods visible", () => {
    const draft = hydrateTrafficDeathDraft({
      schemaVersion: CALCULATION_SCHEMA_VERSION,
      calculationType: "TRAFFIC_DEATH",
      deceased: {
        birthDate: "1946-02-20",
        deathDate: "2024-04-15",
        gender: "male",
        fullName: "Ahmet",
      },
      beneficiaries: [
        {
          id: "sp",
          fullName: "Ayşe",
          relation: "spouse",
          birthDate: "1950-05-15",
          gender: "female",
          claimantStatus: "PLAINTIFF",
        },
      ],
    });
    const snapshot = {
      shareRatioPeriods: periods,
      personLives: [{ key: "deceased" }],
      columnKeys: [{ key: "deceased", header: "MÜTEVEFFA" }],
      periods: [{ startDate: "2024-04-15", endDate: "2025-01-01" }],
    };

    expect(draft.deceased.fullName).toBe("Ahmet");
    expect(isUsableTrafficDeathPayResult(snapshot)).toBe(true);
    expect(extractTrafficDeathShareRatioPeriods(snapshot)).toEqual(periods);
    expect(extractTrafficDeathShareRatioPeriods(snapshot).length).toBeGreaterThan(0);
  });

  it("null result snapshot is not usable and requires motor fallback", () => {
    expect(isUsableTrafficDeathPayResult(null)).toBe(false);
    expect(isUsableTrafficDeathPayResult({ shareRatioPeriods: [] })).toBe(false);
    expect(extractTrafficDeathShareRatioPeriods({ shareRatioPeriods: [] })).toEqual([]);
  });
});
