import { describe, expect, it, vi } from "vitest";
import { createLiveRefresh } from "./liveRefresh";

function harness(refresh: () => Promise<unknown> | unknown) {
  let intervalFn: (() => void) | null = null;
  let visFn: (() => void) | null = null;
  let focusFn: (() => void) | null = null;
  let intervalMs = 0;
  const handle = createLiveRefresh({
    refresh,
    intervalMs: 15_000,
    scheduleInterval(fn, ms) {
      intervalFn = fn;
      intervalMs = ms;
      return () => {
        intervalFn = null;
      };
    },
    subscribeVisibility(fn) {
      visFn = fn;
      return () => {
        visFn = null;
      };
    },
    subscribeFocus(fn) {
      focusFn = fn;
      return () => {
        focusFn = null;
      };
    },
  });
  return {
    handle,
    get intervalMs() {
      return intervalMs;
    },
    interval() {
      intervalFn?.();
    },
    visible() {
      visFn?.();
    },
    focus() {
      focusFn?.();
    },
  };
}

async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("support badge live refresh", () => {
  it("refreshes immediately and then every 15 seconds", async () => {
    const refresh = vi.fn(async () => {});
    const live = harness(refresh);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(live.intervalMs).toBe(15_000);
    await flush();
    live.interval();
    await flush();
    expect(refresh).toHaveBeenCalledTimes(2);
    live.handle.stop();
    live.interval();
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("refreshes on focus and when the tab becomes visible", async () => {
    const refresh = vi.fn(async () => {});
    const live = harness(refresh);
    await flush();
    live.focus();
    await flush();
    live.visible();
    await flush();
    expect(refresh).toHaveBeenCalledTimes(3);
  });

  it("collapses overlapping kicks into one follow-up", async () => {
    let release: () => void = () => {};
    const refresh = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        })
    );
    const live = harness(refresh);
    expect(refresh).toHaveBeenCalledTimes(1);
    live.interval();
    live.focus();
    live.visible();
    expect(refresh).toHaveBeenCalledTimes(1);
    release();
    await flush();
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});
