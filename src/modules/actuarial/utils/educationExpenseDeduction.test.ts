import { describe, expect, it } from "vitest";
import { resolveEducationExpensePreview } from "./educationExpenseDeduction";
import type { TrafficDeathDraft } from "../types/calculationDraft";

describe("resolveEducationExpensePreview", () => {
  it("mirrors backend money for 2016 full year", () => {
    const draft = {
      calculationType: "TRAFFIC_DEATH",
      common: { eventDate: "2015-12-04", calculationDate: "2026-09-28" },
      beneficiaries: [
        { id: "f", fullName: "Kadir Tutkun", relation: "father", claimantStatus: "OUT_OF_CASE" },
        { id: "m", fullName: "Kadriye Tutkun", relation: "mother", claimantStatus: "OUT_OF_CASE" },
      ],
      educationExpenseDeduction: { notes: "", educationEndDate: "2019-08-31" },
    } as TrafficDeathDraft;
    const preview = resolveEducationExpensePreview(draft);
    expect(preview.status).toBe("READY");
    expect(preview.futurePeriods).toHaveLength(0);
    expect(preview.pastPeriods[1]?.periodExpense).toBe(15613.2);
    expect(preview.pastPeriods[1]?.fatherRearingExpense).toBe(780.66);
    expect(preview.fatherTotal).toBe(preview.motherTotal);
  });

  it("splits past at calculationDate and builds KN future to education end", () => {
    const draft = {
      calculationType: "TRAFFIC_DEATH",
      common: { eventDate: "2021-02-19", calculationDate: "2026-09-30" },
      beneficiaries: [
        { id: "f", fullName: "Baba", relation: "father", claimantStatus: "PLAINTIFF" },
        { id: "m", fullName: "Anne", relation: "mother", claimantStatus: "PLAINTIFF" },
      ],
      educationExpenseDeduction: { notes: "", educationEndDate: "2039-06-15" },
    } as TrafficDeathDraft;
    const preview = resolveEducationExpensePreview(draft);
    expect(preview.status).toBe("READY");
    const lastPast = preview.pastPeriods[preview.pastPeriods.length - 1]!;
    expect(lastPast.endDate).toBe("2026-09-30");
    expect(preview.futurePeriods[0]?.startDate).toBe("2026-10-01");
    expect(preview.futurePeriods[preview.futurePeriods.length - 1]?.endDate).toBe("2039-06-15");
    expect(preview.fatherTotal).toBe(preview.fatherPastTotal + preview.fatherFutureTotal);
  });
});
