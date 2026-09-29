import { describe, it, expect } from "vitest";
import { createEmptyDraft } from "../types/calculationDraft";

describe("TRAFFIC_DEATH draft defaults", () => {
  it("employmentStatus başlangıçta null; gelir alanları ayrı tutulur", () => {
    const injury = createEmptyDraft("TRAFFIC_INJURY");
    const death = createEmptyDraft("TRAFFIC_DEATH");
    if (death.calculationType !== "TRAFFIC_DEATH") throw new Error("expected death draft");
    expect(death.employmentStatus).toBeNull();
    expect(death.nonWorkingSelectedIncome).toBeNull();
    expect(death.deceasedFamilyInfo.hasChildren).toBeNull();
    expect(death.deceasedFamilyInfo.children).toEqual([]);
    expect(death.accidentIncome.incomeMode).toBe("minWage");
    if (injury.calculationType !== "TRAFFIC_INJURY") throw new Error("expected injury draft");
    expect(injury.accidentIncome.incomeMode).toBe("minWage");
    expect("employmentStatus" in injury).toBe(false);
  });
});
