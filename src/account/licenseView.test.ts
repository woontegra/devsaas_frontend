import { describe, expect, it } from "vitest";
import type { AuthMeResponse, TrialInfo, UserCapabilities } from "../modules/actuarial/types/savedCalculation";
import { buildLicenseView, daysRemainingUntil, paidLicenseTone, periodRemainingPercent } from "./licenseView";

const NOW = new Date("2026-10-04T12:00:00.000Z");

function atDays(days: number): string {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function caps(partial: Partial<UserCapabilities> = {}): UserCapabilities {
  return {
    canSaveCalculation: true,
    plan: "yearly",
    subscriptionActive: true,
    subscriptionExpiresAt: atDays(200),
    subscriptionStartsAt: atDays(-165),
    isTrial: false,
    isAdmin: false,
    ...partial,
  };
}

function trial(partial: Partial<TrialInfo> = {}): TrialInfo {
  return {
    isTrial: true,
    active: true,
    blockReason: null,
    startsAt: atDays(-2),
    expiresAt: atDays(5),
    daysRemaining: 5,
    creditsRemaining: 6,
    creditsInitial: 10,
    creditsUsed: 4,
    durationDays: 7,
    ...partial,
  };
}

function me(partial: Partial<AuthMeResponse> = {}): AuthMeResponse {
  return {
    user: { id: "u1", email: "ada@example.com", creditBalance: 6, trialCreditsGranted: 10 },
    capabilities: caps(),
    trial: null,
    ...partial,
  };
}

describe("license remaining days match backend ceil", () => {
  it("returns 0 when the instant has passed and never a negative", () => {
    expect(daysRemainingUntil(new Date(NOW.getTime() - 1).toISOString(), NOW)).toBe(0);
    expect(daysRemainingUntil(NOW.toISOString(), NOW)).toBe(0);
  });

  it("does not use local calendar dates", () => {
    const now = new Date("2026-10-04T22:00:00.000Z");
    const expires = new Date("2026-10-05T01:00:00.000Z");
    expect(daysRemainingUntil(expires.toISOString(), now)).toBe(1);
  });
});

describe("paid license tones", () => {
  it("stays calm above 30 days", () => {
    const view = buildLicenseView(me({ capabilities: caps({ subscriptionExpiresAt: atDays(154), subscriptionStartsAt: atDays(-211) }) }), NOW);
    expect(view?.kind).toBe("paid");
    if (view?.kind !== "paid") return;
    expect(view.daysLeft).toBe(154);
    expect(view.tone).toBe("calm");
    expect(view.notice).toBeNull();
    expect(view.usageRight).toBe("Sınırsız hesaplama");
    expect(view.timePercent).not.toBeNull();
  });

  it.each([
    [30, "soon"],
    [7, "urgent"],
    [3, "critical"],
    [1, "critical"],
  ] as const)("%i gün → %s", (days, tone) => {
    const view = buildLicenseView(
      me({ capabilities: caps({ subscriptionExpiresAt: atDays(days), subscriptionStartsAt: atDays(days - 365) }) }),
      NOW
    );
    expect(view?.kind).toBe("paid");
    if (view?.kind !== "paid") return;
    expect(view.tone).toBe(tone);
    expect(view.daysLeft).toBe(days);
    expect(view.notice).toContain(`${days} gün`);
  });

  it("shows ended copy when the subscription is over", () => {
    const view = buildLicenseView(
      me({
        capabilities: caps({
          subscriptionActive: false,
          subscriptionExpiresAt: atDays(-1),
          subscriptionStartsAt: atDays(-366),
        }),
      }),
      NOW
    );
    expect(view?.kind).toBe("paid");
    if (view?.kind !== "paid") return;
    expect(view.tone).toBe("ended");
    expect(view.daysLeft).toBe(0);
    expect(view.notice).toBe("Aboneliğiniz sona erdi.");
    expect(view.timePercent).toBe(0);
    expect(paidLicenseTone(0, true)).toBe("ended");
  });

  it("does not invent a progress percent without a start date", () => {
    expect(periodRemainingPercent(null, atDays(10), NOW)).toBeNull();
  });
});

describe("demo license", () => {
  it("shows remaining and used credits from the API", () => {
    const view = buildLicenseView(me({ trial: trial(), capabilities: caps({ isTrial: true, plan: null }) }), NOW);
    expect(view?.kind).toBe("demo");
    if (view?.kind !== "demo") return;
    expect(view.creditsRemaining).toBe(6);
    expect(view.creditsUsed).toBe(4);
    expect(view.creditsInitial).toBe(10);
    expect(view.creditPercent).toBe(60);
    expect(view.tone).toBe("calm");
    expect(view.daysLeft).toBe(5);
  });

  it.each([3, 1] as const)("%i kredi → kritik uyarı", (credits) => {
    const view = buildLicenseView(
      me({
        trial: trial({ creditsRemaining: credits, creditsUsed: 10 - credits, daysRemaining: 5, blockReason: null }),
        capabilities: caps({ isTrial: true }),
      }),
      NOW
    );
    expect(view?.kind).toBe("demo");
    if (view?.kind !== "demo") return;
    expect(view.tone).toBe("critical");
    expect(view.notice).toBe("Demonuz bitmek üzere");
  });

  it("ends the demo at 0 credits", () => {
    const view = buildLicenseView(
      me({
        trial: trial({
          creditsRemaining: 0,
          creditsUsed: 10,
          active: false,
          blockReason: "TRIAL_CREDITS_EXHAUSTED",
          daysRemaining: 4,
        }),
        capabilities: caps({ isTrial: true }),
      }),
      NOW
    );
    expect(view?.kind).toBe("demo");
    if (view?.kind !== "demo") return;
    expect(view.tone).toBe("ended");
    expect(view.notice).toBe("Demo kullanım hakkınız sona erdi.");
  });

  it("time and credits are both visible; expiry wins over leftover credits", () => {
    const view = buildLicenseView(
      me({
        trial: trial({
          daysRemaining: 0,
          expiresAt: atDays(-1),
          creditsRemaining: 8,
          creditsUsed: 2,
          active: false,
          blockReason: "TRIAL_EXPIRED",
        }),
        capabilities: caps({ isTrial: true }),
      }),
      NOW
    );
    expect(view?.kind).toBe("demo");
    if (view?.kind !== "demo") return;
    expect(view.timeEnded).toBe(true);
    expect(view.creditsRemaining).toBe(8);
    expect(view.tone).toBe("ended");
  });

  it("warns when 3 days remain even if credits are high", () => {
    const view = buildLicenseView(
      me({
        trial: trial({ daysRemaining: 3, creditsRemaining: 9, creditsUsed: 1 }),
        capabilities: caps({ isTrial: true }),
      }),
      NOW
    );
    expect(view?.kind).toBe("demo");
    if (view?.kind !== "demo") return;
    expect(view.tone).toBe("critical");
    expect(view.daysLeft).toBe(3);
    expect(view.creditsRemaining).toBe(9);
  });
});

describe("admin access is not shown as a customer plan", () => {
  it("does not label the forced admin plan as a paid package", () => {
    const view = buildLicenseView(
      me({
        capabilities: caps({
          isAdmin: true,
          plan: "admin",
          subscriptionActive: true,
          subscriptionExpiresAt: atDays(-2),
          subscriptionStartsAt: atDays(-30),
        }),
        trial: trial({ isTrial: false, active: false, daysRemaining: 0, creditsRemaining: 0, creditsInitial: 0, creditsUsed: 0 }),
      }),
      NOW
    );
    expect(view?.kind).toBe("admin");
    if (view?.kind !== "admin") return;
    expect(view.expired).toBe(true);
    expect(view.notice).toContain("yönetici");
  });
});
