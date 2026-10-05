/**
 * Admin demo uzatma / dönüşüm — FE saf kurallar (test + UI özeti).
 */

export type DemoEndReason =
  | "ACTIVE"
  | "EXPIRED"
  | "CREDITS_EXHAUSTED"
  | "EXPIRED_AND_CREDITS_EXHAUSTED";

export function resolveDemoEndReason(params: {
  isTrial: boolean;
  expiresAt: string | null | undefined;
  creditBalance: number;
  now?: Date;
}): DemoEndReason | null {
  if (!params.isTrial) return null;
  const now = params.now ?? new Date();
  const exp = params.expiresAt ? new Date(params.expiresAt) : null;
  const timeOk = exp != null && !Number.isNaN(exp.getTime()) && exp.getTime() > now.getTime();
  const creditsOk = params.creditBalance > 0;
  if (timeOk && creditsOk) return "ACTIVE";
  if (!timeOk && !creditsOk) return "EXPIRED_AND_CREDITS_EXHAUSTED";
  if (!timeOk) return "EXPIRED";
  return "CREDITS_EXHAUSTED";
}

export function demoEndReasonLabel(reason: DemoEndReason | null): string | null {
  switch (reason) {
    case "EXPIRED":
      return "Demo süresi sona erdi.";
    case "CREDITS_EXHAUSTED":
      return "Demo kredileri tükendi.";
    case "EXPIRED_AND_CREDITS_EXHAUSTED":
      return "Demo süresi ve kredileri sona erdi.";
    default:
      return null;
  }
}

export function demoStatusLabel(reason: DemoEndReason | null): string {
  return reason === "ACTIVE" ? "Aktif Demo" : "Demo Sona Erdi";
}

export function daysRemainingLabel(expiresAt: string | null | undefined, now: Date = new Date()): string {
  if (!expiresAt) return "—";
  const exp = new Date(expiresAt);
  if (Number.isNaN(exp.getTime())) return "—";
  const days = Math.max(0, Math.ceil((exp.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
  return `${days} gün`;
}

export function validateExtendForm(addedDays: number, addedCredits: number): string | null {
  if (!Number.isFinite(addedDays) || addedDays < 0 || !Number.isInteger(addedDays)) {
    return "Ek süre 0 veya pozitif tam sayı olmalı.";
  }
  if (!Number.isFinite(addedCredits) || addedCredits < 0 || !Number.isInteger(addedCredits)) {
    return "Ek kredi 0 veya pozitif tam sayı olmalı.";
  }
  if (addedDays === 0 && addedCredits === 0) {
    return "Ek süre ve ek kredi aynı anda 0 olamaz.";
  }
  return null;
}
