import { describe, expect, it } from "vitest";
import {
  demoEndReasonLabel,
  demoStatusLabel,
  resolveDemoEndReason,
  validateExtendForm,
} from "./demoAdminActions";
import { computeSubscriptionEndDate, setCachedTrialConfig } from "./subscriptionRules";

describe("demo admin UI helpers", () => {
  it("aktif / sona erdi etiketleri", () => {
    expect(
      demoStatusLabel(
        resolveDemoEndReason({
          isTrial: true,
          expiresAt: "2026-10-08T12:00:00.000Z",
          creditBalance: 4,
          now: new Date("2026-10-05T12:00:00.000Z"),
        })
      )
    ).toBe("Aktif Demo");
    expect(
      demoEndReasonLabel(
        resolveDemoEndReason({
          isTrial: true,
          expiresAt: "2026-10-08T12:00:00.000Z",
          creditBalance: 0,
          now: new Date("2026-10-10T12:00:00.000Z"),
        })
      )
    ).toBe("Demo süresi ve kredileri sona erdi.");
  });

  it("extend form reject 0/0", () => {
    expect(validateExtendForm(0, 0)).toMatch(/0 olamaz/);
    expect(validateExtendForm(7, 5)).toBeNull();
  });

  it("paid convert end dates", () => {
    setCachedTrialConfig({ durationDays: 7, initialCredits: 10 });
    expect(
      computeSubscriptionEndDate({ startsAt: "2026-10-01", plan: "monthly", isTrial: false })
    ).toBe("2026-11-01");
    expect(
      computeSubscriptionEndDate({ startsAt: "2026-10-01", plan: "yearly", isTrial: false })
    ).toBe("2027-10-01");
  });

  it("trial actions only for isTrial (UI gate)", () => {
    const showTrialActions = (isTrial: boolean) => isTrial;
    expect(showTrialActions(true)).toBe(true);
    expect(showTrialActions(false)).toBe(false);
  });
});
