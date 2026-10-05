import { describe, expect, it } from "vitest";
import {
  addDaysIso,
  addMonthsIso,
  addYearsIso,
  computeSubscriptionEndDate,
  setCachedTrialConfig,
} from "./subscriptionRules";

describe("subscriptionRules (trial 7 days from config)", () => {
  it("addMonthsIso clamps Jan 31 + 1 month", () => {
    expect(addMonthsIso("2026-01-31", 1)).toBe("2026-02-28");
  });

  it("paid yearly adds one year", () => {
    expect(computeSubscriptionEndDate({ startsAt: "2026-10-01", plan: "yearly", isTrial: false })).toBe(
      "2027-10-01"
    );
  });

  it("trial uses config durationDays (7)", () => {
    setCachedTrialConfig({ durationDays: 7, initialCredits: 10 });
    expect(computeSubscriptionEndDate({ startsAt: "2026-10-01", plan: "monthly", isTrial: true })).toBe(
      addDaysIso("2026-10-01", 7)
    );
  });

  it("paid monthly adds one month", () => {
    expect(computeSubscriptionEndDate({ startsAt: "2026-09-30", plan: "monthly", isTrial: false })).toBe(
      "2026-10-30"
    );
  });

  it("credit paid has no auto end", () => {
    expect(computeSubscriptionEndDate({ startsAt: "2026-10-01", plan: "credit", isTrial: false })).toBeNull();
  });

  it("addYearsIso", () => {
    expect(addYearsIso("2026-10-01", 1)).toBe("2027-10-01");
  });
});
