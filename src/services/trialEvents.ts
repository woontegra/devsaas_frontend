import type { TrialInfo } from "../modules/actuarial/types/savedCalculation";

export const TRIAL_UPDATE_EVENT = "aktuerya:trial-update";

export function publishTrialUpdate(trial: TrialInfo | null): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TRIAL_UPDATE_EVENT, { detail: trial }));
}

export function subscribeTrialUpdate(handler: (trial: TrialInfo | null) => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const listener = (ev: Event) => {
    const detail = (ev as CustomEvent<TrialInfo | null>).detail ?? null;
    handler(detail);
  };
  window.addEventListener(TRIAL_UPDATE_EVENT, listener);
  return () => window.removeEventListener(TRIAL_UPDATE_EVENT, listener);
}
