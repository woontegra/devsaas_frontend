import { useCallback, useEffect, useRef } from "react";

const DEFAULT_INTERVAL_MS = 15_000;

type Stop = () => void;

export type LiveRefreshOptions = {
  refresh: () => Promise<unknown> | unknown;
  intervalMs?: number;
  scheduleInterval?: (fn: () => void, ms: number) => Stop;
  subscribeVisibility?: (fn: () => void) => Stop;
  subscribeFocus?: (fn: () => void) => Stop;
};

/** Polls unread counts. Overlapping kicks collapse into the in-flight call plus one follow-up. */
export function createLiveRefresh(options: LiveRefreshOptions): { kick: () => void; stop: Stop } {
  let busy = false;
  let pending = false;
  let stopped = false;

  const kick = () => {
    if (stopped) return;
    if (busy) {
      pending = true;
      return;
    }
    busy = true;
    void Promise.resolve(options.refresh()).finally(() => {
      busy = false;
      if (stopped) return;
      if (pending) {
        pending = false;
        kick();
      }
    });
  };

  const schedule = options.scheduleInterval ?? ((fn, ms) => {
    const id = window.setInterval(fn, ms);
    return () => window.clearInterval(id);
  });
  const onVisibility = options.subscribeVisibility ?? ((fn) => {
    const listener = () => {
      if (document.visibilityState === "visible") fn();
    };
    document.addEventListener("visibilitychange", listener);
    return () => document.removeEventListener("visibilitychange", listener);
  });
  const onFocus = options.subscribeFocus ?? ((fn) => {
    window.addEventListener("focus", fn);
    return () => window.removeEventListener("focus", fn);
  });

  kick();
  const stopInterval = schedule(kick, options.intervalMs ?? DEFAULT_INTERVAL_MS);
  const stopVisibility = onVisibility(kick);
  const stopFocus = onFocus(kick);

  return {
    kick,
    stop() {
      stopped = true;
      pending = false;
      stopInterval();
      stopVisibility();
      stopFocus();
    },
  };
}

export function useLiveRefresh(refresh: () => Promise<unknown> | unknown, intervalMs = DEFAULT_INTERVAL_MS): () => void {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const kickRef = useRef<() => void>(() => {});

  useEffect(() => {
    const handle = createLiveRefresh({
      refresh: () => refreshRef.current(),
      intervalMs,
    });
    kickRef.current = handle.kick;
    return () => {
      kickRef.current = () => {};
      handle.stop();
    };
  }, [intervalMs]);

  return useCallback(() => {
    kickRef.current();
  }, []);
}
