import { describe, expect, it, vi } from "vitest";
import { publishTrialUpdate, TRIAL_UPDATE_EVENT } from "./trialEvents";
import type { TrialInfo } from "../modules/actuarial/types/savedCalculation";

describe("trial header update event", () => {
  it("K) publishTrialUpdate dispatches without refresh", () => {
    const handler = vi.fn();
    const g = globalThis as typeof globalThis & { window?: Window & typeof globalThis };
    const listeners = new Map<string, EventListener>();
    g.window = {
      addEventListener: (type: string, fn: EventListener) => {
        listeners.set(type, fn);
      },
      removeEventListener: (type: string) => {
        listeners.delete(type);
      },
      dispatchEvent: (ev: Event) => {
        listeners.get(ev.type)?.(ev);
        return true;
      },
    } as unknown as Window & typeof globalThis;

    g.window.addEventListener(TRIAL_UPDATE_EVENT, handler as EventListener);
    const trial: TrialInfo = {
      isTrial: true,
      active: true,
      blockReason: null,
      startsAt: null,
      expiresAt: null,
      daysRemaining: 7,
      creditsRemaining: 9,
      creditsInitial: 10,
      creditsUsed: 1,
      durationDays: 7,
    };
    publishTrialUpdate(trial);
    expect(handler).toHaveBeenCalledTimes(1);
    const ev = handler.mock.calls[0][0] as CustomEvent<TrialInfo>;
    expect(ev.detail.creditsRemaining).toBe(9);
  });
});
