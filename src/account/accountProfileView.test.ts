import { describe, expect, it } from "vitest";
import type { AuthMeResponse } from "../modules/actuarial/types/savedCalculation";
import { accountFacts } from "./accountProfileView";

function me(partial: Partial<AuthMeResponse> & Pick<AuthMeResponse, "user" | "capabilities">): AuthMeResponse {
  return partial as AuthMeResponse;
}

describe("accountFacts", () => {
  it("uses paid plan, dates and save right without inventing credits", () => {
    const facts = accountFacts(
      me({
        user: { id: "u", email: "a@b.c", status: "ACTIVE", role: "USER", creditBalance: 0 },
        capabilities: {
          canSaveCalculation: true,
          plan: "monthly",
          subscriptionActive: true,
          subscriptionStartsAt: "2026-10-01T00:00:00.000Z",
          subscriptionExpiresAt: "2026-11-01T00:00:00.000Z",
        },
      })
    );
    const labels = facts.map((f) => f.label);
    expect(facts.find((f) => f.label === "Plan")?.value).toBe("Aylık Paket");
    expect(facts.find((f) => f.label === "Üyelik")?.value).toBe("Aktif");
    expect(labels).toContain("Başlangıç");
    expect(labels).toContain("Bitiş");
    expect(labels).not.toContain("Kredi bakiyesi");
    expect(labels).not.toContain("Son giriş");
    expect(facts.find((f) => f.label === "Hesaplama kaydı")?.value).toBe("Açık");
  });

  it("shows demo credits and does not add a missing end date", () => {
    const facts = accountFacts(
      me({
        user: { id: "u", email: "a@b.c", status: "ACTIVE", role: "USER" },
        capabilities: {
          canSaveCalculation: false,
          plan: null,
          subscriptionActive: true,
          subscriptionExpiresAt: null,
          isTrial: true,
        },
        trial: {
          isTrial: true,
          active: true,
          blockReason: null,
          startsAt: "2026-10-01T00:00:00.000Z",
          expiresAt: null,
          daysRemaining: 7,
          creditsRemaining: 6,
          creditsInitial: 10,
          creditsUsed: 4,
          durationDays: 7,
        },
      })
    );
    expect(facts.find((f) => f.label === "Plan")?.value).toBe("Deneme sürümü");
    expect(facts.find((f) => f.label === "Kalan kredi")?.value).toBe("6");
    expect(facts.find((f) => f.label === "Kullanılan kredi")?.value).toBe("4 / 10");
    expect(facts.find((f) => f.label === "Bitiş")).toBeUndefined();
  });

  it("does not present an admin account as a customer package", () => {
    const facts = accountFacts(
      me({
        user: { id: "u", email: "a@b.c", status: "ACTIVE", role: "ADMIN" },
        capabilities: {
          canSaveCalculation: true,
          plan: "admin",
          subscriptionActive: true,
          subscriptionExpiresAt: null,
          isAdmin: true,
        },
      })
    );
    expect(facts.find((f) => f.label === "Plan")?.value).toBe("Yönetici erişimi");
    expect(facts.find((f) => f.label === "Rol")?.value).toBe("Yönetici");
    expect(facts.find((f) => f.label === "Başlangıç")).toBeUndefined();
  });
});
