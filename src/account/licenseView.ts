import type { AuthMeResponse } from "../modules/actuarial/types/savedCalculation";

export type LicenseTone = "calm" | "soon" | "urgent" | "critical" | "ended";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Backend trialDaysRemaining ile aynı: süre dolmuşsa 0, aksi halde yukarı yuvarlanmış tam gün. */
export function daysRemainingUntil(expiresAt: string | null | undefined, now: Date): number {
  if (!expiresAt) return 0;
  const end = new Date(expiresAt).getTime();
  if (!Number.isFinite(end)) return 0;
  const ms = end - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / DAY_MS);
}

/** Kalan süre / toplam dönem. Başlangıç veya bitiş yoksa null; uydurma yapılmaz. */
export function periodRemainingPercent(
  startsAt: string | null | undefined,
  expiresAt: string | null | undefined,
  now: Date
): number | null {
  if (!startsAt || !expiresAt) return null;
  const start = new Date(startsAt).getTime();
  const end = new Date(expiresAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  const nowMs = now.getTime();
  if (nowMs >= end) return 0;
  if (nowMs <= start) return 100;
  return Math.max(0, Math.min(100, ((end - nowMs) / (end - start)) * 100));
}

export function paidLicenseTone(daysLeft: number, expired: boolean): LicenseTone {
  if (expired || daysLeft <= 0) return "ended";
  if (daysLeft <= 3) return "critical";
  if (daysLeft <= 7) return "urgent";
  if (daysLeft <= 30) return "soon";
  return "calm";
}

export function demoLicenseTone(params: {
  daysLeft: number;
  timeEnded: boolean;
  creditsRemaining: number;
}): LicenseTone {
  if (params.timeEnded || params.creditsRemaining <= 0) return "ended";
  if (params.daysLeft > 0 && params.daysLeft <= 3) return "critical";
  if (params.creditsRemaining <= 3) return "critical";
  return "calm";
}

const PLAN_LABEL: Record<string, string> = {
  monthly: "Aylık Paket",
  yearly: "Yıllık Paket",
  pro: "Profesyonel",
  credit: "Kredi Paketi",
  starter: "Başlangıç",
  single: "Tekli",
  free: "Ücretsiz",
};

export function planLabel(plan: string | null | undefined): string {
  const key = (plan ?? "").toLowerCase();
  if (!key) return "Paket";
  return PLAN_LABEL[key] ?? plan ?? "Paket";
}

export type LicenseView =
  | {
      kind: "demo";
      tone: LicenseTone;
      statusLabel: string;
      daysLeft: number;
      timeEnded: boolean;
      startsAt: string | null;
      expiresAt: string | null;
      timePercent: number | null;
      creditsRemaining: number;
      creditsInitial: number;
      creditsUsed: number;
      creditPercent: number | null;
      notice: string | null;
      detail: string | null;
      cta: string;
    }
  | {
      kind: "paid";
      tone: LicenseTone;
      plan: string;
      statusLabel: string;
      startsAt: string | null;
      expiresAt: string | null;
      daysLeft: number;
      expired: boolean;
      timePercent: number | null;
      usageRight: string;
      notice: string | null;
      cta: string;
    }
  | {
      kind: "admin";
      tone: LicenseTone;
      statusLabel: string;
      startsAt: string | null;
      expiresAt: string | null;
      daysLeft: number;
      expired: boolean;
      timePercent: number | null;
      notice: string | null;
    };

function paidNotice(tone: LicenseTone, daysLeft: number): string | null {
  if (tone === "ended") return "Aboneliğiniz sona erdi.";
  if (tone === "calm") return null;
  const dayText = daysLeft === 1 ? "1 gün" : `${daysLeft} gün`;
  return `Aboneliğinizin sona ermesine ${dayText} kaldı. Kesintisiz kullanmaya devam etmek için aboneliğinizi yenileyin.`;
}

export function buildLicenseView(me: AuthMeResponse | null, now: Date): LicenseView | null {
  if (!me) return null;
  const trial = me.trial;
  const caps = me.capabilities;
  const isDemo = Boolean(trial?.isTrial);

  if (isDemo && trial) {
    const expiresAt = trial.expiresAt;
    const startsAt = trial.startsAt;
    const timeEnded = trial.blockReason === "TRIAL_EXPIRED" || (expiresAt != null && new Date(expiresAt).getTime() <= now.getTime());
    const creditsRemaining = Math.max(0, trial.creditsRemaining);
    const creditsInitial = Math.max(0, trial.creditsInitial);
    const creditsUsed = Math.max(0, trial.creditsUsed);
    const daysLeft = timeEnded ? 0 : trial.daysRemaining;
    const tone = demoLicenseTone({ daysLeft, timeEnded, creditsRemaining });
    const creditPercent =
      creditsInitial > 0 ? Math.max(0, Math.min(100, (creditsRemaining / creditsInitial) * 100)) : null;
    const ended = tone === "ended";
    return {
      kind: "demo",
      tone,
      statusLabel: ended ? "Sona erdi" : "Aktif",
      daysLeft,
      timeEnded,
      startsAt,
      expiresAt,
      timePercent: periodRemainingPercent(startsAt, expiresAt, now),
      creditsRemaining,
      creditsInitial,
      creditsUsed,
      creditPercent,
      notice: ended ? "Demo kullanım hakkınız sona erdi." : tone === "critical" ? "Demonuz bitmek üzere" : null,
      detail:
        ended
          ? null
          : tone === "critical"
            ? "Kesintisiz hesaplama yapmaya devam etmek için Profesyonel sürüme geçebilirsiniz."
            : null,
      cta: "Profesyonel Sürüme Geç",
    };
  }

  if (caps?.isAdmin && (caps.plan ?? "").toLowerCase() === "admin") {
    const startsAt = caps.subscriptionStartsAt ?? null;
    const expiresAt = caps.subscriptionExpiresAt ?? null;
    const expired = expiresAt != null && new Date(expiresAt).getTime() <= now.getTime();
    const daysLeft = expired ? 0 : daysRemainingUntil(expiresAt, now);
    const tone = expiresAt ? paidLicenseTone(daysLeft, expired) : "calm";
    return {
      kind: "admin",
      tone: expiresAt && expired ? "ended" : tone === "ended" ? "calm" : tone,
      statusLabel: !expiresAt ? "Yönetici erişimi" : expired ? "Süresi doldu" : "Aktif",
      startsAt,
      expiresAt,
      daysLeft,
      expired,
      timePercent: periodRemainingPercent(startsAt, expiresAt, now),
      notice: expiresAt && expired ? "Kayıtlı abonelik süresi sona erdi. Hesap yönetici erişimiyle açıktır." : null,
    };
  }

  const startsAt = caps?.subscriptionStartsAt ?? null;
  const expiresAt = caps?.subscriptionExpiresAt ?? null;
  const expired = !caps?.subscriptionActive || (expiresAt != null && new Date(expiresAt).getTime() <= now.getTime());
  const daysLeft = expired ? 0 : daysRemainingUntil(expiresAt, now);
  const tone = paidLicenseTone(daysLeft, expired);
  const planKey = (caps?.plan ?? "").toLowerCase();
  const unlimited = planKey === "monthly" || planKey === "yearly" || planKey === "pro";
  const usageRight = unlimited
    ? "Sınırsız hesaplama"
    : planKey === "credit"
      ? `${Math.max(0, me.user.creditBalance ?? 0)} kredi`
      : "—";

  return {
    kind: "paid",
    tone,
    plan: planLabel(caps?.plan),
    statusLabel: expired ? "Süresi doldu" : "Aktif",
    startsAt,
    expiresAt,
    daysLeft,
    expired,
    timePercent: periodRemainingPercent(startsAt, expiresAt, now),
    usageRight,
    notice: paidNotice(tone, daysLeft),
    cta: "Aboneliği Yenile",
  };
}
