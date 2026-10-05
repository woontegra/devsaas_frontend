/**
 * Backend trial sabitlerinin FE mirror'ı — runtime'da /demo/config veya /admin/trial-config ile senkronlanır.
 * Hardcode fallback yalnızca config yüklenene kadar.
 */
export type TrialConfig = {
  durationDays: number;
  initialCredits: number;
};

let cached: TrialConfig | null = null;

export function getCachedTrialConfig(): TrialConfig {
  return cached ?? { durationDays: 7, initialCredits: 10 };
}

export function setCachedTrialConfig(cfg: TrialConfig): void {
  cached = cfg;
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function addMonthsIso(iso: string, months: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  const day = Number(m[3]);
  const target = new Date(Date.UTC(year, monthIndex + months, 1, 12, 0, 0));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

export function addYearsIso(iso: string, years: number): string {
  return addMonthsIso(iso, years * 12);
}

export const NEW_USER_PLAN_OPTIONS = [
  { value: "monthly", label: "Aylık" },
  { value: "yearly", label: "Yıllık" },
  { value: "credit", label: "Kredi" },
] as const;

export function planLabelNew(plan: string): string {
  return NEW_USER_PLAN_OPTIONS.find((p) => p.value === plan)?.label ?? plan;
}

export function computeSubscriptionEndDate(params: {
  startsAt: string;
  plan: string;
  isTrial: boolean;
  trialDurationDays?: number;
}): string | null {
  const start = params.startsAt?.trim();
  if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) return null;
  if (params.isTrial) {
    const days = params.trialDurationDays ?? getCachedTrialConfig().durationDays;
    return addDaysIso(start, days);
  }
  if (params.plan === "monthly") return addMonthsIso(start, 1);
  if (params.plan === "yearly") return addYearsIso(start, 1);
  if (params.plan === "credit") return null;
  return null;
}

/** @deprecated use getCachedTrialConfig().durationDays */
export const TRIAL_DURATION_DAYS = 7;
