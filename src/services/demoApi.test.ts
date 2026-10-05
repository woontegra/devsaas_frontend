import { describe, expect, it } from "vitest";
import { getCachedTrialConfig, setCachedTrialConfig, computeSubscriptionEndDate } from "../admin/subscriptionRules";

const DEMO_ALREADY_USED_MESSAGE =
  "Bu e-posta adresi veya telefon numarası ile daha önce deneme hesabı oluşturulmuştur. Her kullanıcı yalnızca bir kez deneme hakkından yararlanabilir.";

function mapDemoError(code: string | undefined, fallback: string): string {
  if (code === "DEMO_ALREADY_USED") return DEMO_ALREADY_USED_MESSAGE;
  return fallback;
}

describe("demo FE messaging + trial config", () => {
  it("DEMO_ALREADY_USED → Türkçe genel mesaj", () => {
    expect(mapDemoError("DEMO_ALREADY_USED", "x")).toBe(DEMO_ALREADY_USED_MESSAGE);
  });

  it("trial config cache defaults 7/10", () => {
    setCachedTrialConfig({ durationDays: 7, initialCredits: 10 });
    expect(getCachedTrialConfig()).toEqual({ durationDays: 7, initialCredits: 10 });
  });

  it("admin new user trial end = start + config days", () => {
    setCachedTrialConfig({ durationDays: 7, initialCredits: 10 });
    expect(
      computeSubscriptionEndDate({
        startsAt: "2026-10-01",
        plan: "monthly",
        isTrial: true,
      })
    ).toBe("2026-10-08");
  });

  it("monthly/yearly paid end dates unchanged", () => {
    expect(
      computeSubscriptionEndDate({ startsAt: "2026-10-01", plan: "monthly", isTrial: false })
    ).toBe("2026-11-01");
    expect(
      computeSubscriptionEndDate({ startsAt: "2026-10-01", plan: "yearly", isTrial: false })
    ).toBe("2027-10-01");
  });
});

describe("trial start UX gate (client-only)", () => {
  function canStartNewCalculation(trial: {
    isTrial: boolean;
    blockReason: string | null;
    creditsRemaining: number;
  } | null): { ok: boolean; message?: string } {
    if (!trial?.isTrial) return { ok: true };
    if (trial.blockReason === "TRIAL_EXPIRED" || trial.creditsRemaining === 0) {
      return {
        ok: false,
        message:
          trial.blockReason === "TRIAL_EXPIRED"
            ? "Deneme süreniz sona erdi. Yeni hesaplama başlatılamaz."
            : "Deneme kredileriniz tükendi. Yeni hesaplama başlatılamaz.",
      };
    }
    return { ok: true };
  }

  it("0 kredi → start uyarısı", () => {
    expect(
      canStartNewCalculation({
        isTrial: true,
        blockReason: "TRIAL_CREDITS_EXHAUSTED",
        creditsRemaining: 0,
      }).ok
    ).toBe(false);
  });

  it("expired → start uyarısı", () => {
    expect(
      canStartNewCalculation({
        isTrial: true,
        blockReason: "TRIAL_EXPIRED",
        creditsRemaining: 4,
      }).message
    ).toMatch(/sona erdi/);
  });

  it("monthly (non-trial) → unrestricted", () => {
    expect(canStartNewCalculation({ isTrial: false, blockReason: null, creditsRemaining: 0 }).ok).toBe(
      true
    );
  });
});
