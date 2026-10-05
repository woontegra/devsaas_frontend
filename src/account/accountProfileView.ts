import type { AuthMeResponse } from "../modules/actuarial/types/savedCalculation";
import { planLabel } from "./licenseView";

export type AccountFact = { label: string; value: string };

function formatTrDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("tr-TR");
}

export function accountStatusLabel(status: string | null | undefined): string {
  if (status === "ACTIVE") return "Aktif";
  if (status === "PASSIVE") return "Pasif";
  if (status === "SUSPENDED") return "Askıda";
  return status?.trim() || "—";
}

export function accountRoleLabel(role: string | null | undefined): string {
  if (role === "ADMIN") return "Yönetici";
  if (role === "USER") return "Kullanıcı";
  return role?.trim() || "—";
}

function pushDate(facts: AccountFact[], label: string, iso: string | null | undefined) {
  const value = formatTrDate(iso);
  if (value) facts.push({ label, value });
}

/** Yalnızca /auth/me içinde gelen alanlar. Tarih veya son giriş üretilmez. */
export function accountFacts(me: AuthMeResponse | null): AccountFact[] {
  if (!me) return [];
  const facts: AccountFact[] = [
    { label: "Hesap durumu", value: accountStatusLabel(me.user.status) },
    { label: "Rol", value: accountRoleLabel(me.user.role) },
  ];
  const trial = me.trial;
  const caps = me.capabilities;

  if (trial?.isTrial) {
    const membership =
      trial.blockReason === "TRIAL_EXPIRED"
        ? "Süresi doldu"
        : trial.blockReason === "TRIAL_CREDITS_EXHAUSTED"
          ? "Kredi tükendi"
          : trial.active
            ? "Aktif"
            : "Pasif";
    facts.push({ label: "Plan", value: "Deneme sürümü" });
    facts.push({ label: "Üyelik", value: membership });
    pushDate(facts, "Başlangıç", trial.startsAt);
    pushDate(facts, "Bitiş", trial.expiresAt);
    facts.push({ label: "Kalan kredi", value: String(trial.creditsRemaining) });
    if (trial.creditsInitial > 0) {
      facts.push({ label: "Kullanılan kredi", value: `${trial.creditsUsed} / ${trial.creditsInitial}` });
    }
  } else if (caps?.isAdmin && (caps.plan ?? "").toLowerCase() === "admin") {
    facts.push({ label: "Plan", value: "Yönetici erişimi" });
    facts.push({ label: "Üyelik", value: "Yönetici" });
    pushDate(facts, "Başlangıç", caps.subscriptionStartsAt);
    pushDate(facts, "Bitiş", caps.subscriptionExpiresAt);
  } else {
    const planKey = (caps?.plan ?? "").trim();
    facts.push({ label: "Plan", value: planKey ? planLabel(planKey) : "—" });
    facts.push({ label: "Üyelik", value: caps?.subscriptionActive ? "Aktif" : "Pasif" });
    pushDate(facts, "Başlangıç", caps?.subscriptionStartsAt);
    pushDate(facts, "Bitiş", caps?.subscriptionExpiresAt);
    if (planKey.toLowerCase() === "credit" && typeof me.user.creditBalance === "number") {
      facts.push({ label: "Kredi bakiyesi", value: String(me.user.creditBalance) });
    }
  }

  if (typeof caps?.canSaveCalculation === "boolean") {
    facts.push({ label: "Hesaplama kaydı", value: caps.canSaveCalculation ? "Açık" : "Kapalı" });
  }
  return facts;
}
