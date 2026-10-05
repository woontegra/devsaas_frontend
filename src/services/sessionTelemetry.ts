/**
 * Client-side session telemetry: heartbeat + idle detection.
 * UI bileşeni yok; AppLayout içinden başlatılır.
 */

import { api } from "../services/api";

const HEARTBEAT_MS = 60_000;
const IDLE_MS = 5 * 60_000;

let timer: ReturnType<typeof setInterval> | null = null;
let lastActivityAt = Date.now();
let started = false;
let generation = 0;

function markActivity(): void {
  lastActivityAt = Date.now();
}

function onVisibility(): void {
  if (document.visibilityState === "visible") markActivity();
}

async function sendHeartbeat(gen: number): Promise<void> {
  if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
  if (Date.now() - lastActivityAt > IDLE_MS) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    await api.post("/auth/session/heartbeat", {});
  } catch (err) {
    if (gen !== generation) return;
    const status =
      err && typeof err === "object" && "response" in err
        ? (err as { response?: { status?: number } }).response?.status
        : undefined;
    if (status === 409) {
      localStorage.removeItem("sessionId");
      stopSessionTelemetry();
    }
  }
}

export function startSessionTelemetry(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  generation += 1;
  const gen = generation;
  lastActivityAt = Date.now();

  window.addEventListener("mousemove", markActivity, { passive: true });
  window.addEventListener("keydown", markActivity, { passive: true });
  window.addEventListener("click", markActivity, { passive: true });
  window.addEventListener("scroll", markActivity, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);

  void sendHeartbeat(gen);
  timer = setInterval(() => {
    void sendHeartbeat(gen);
  }, HEARTBEAT_MS);
}

export function stopSessionTelemetry(): void {
  if (!started || typeof window === "undefined") return;
  started = false;
  generation += 1;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  window.removeEventListener("mousemove", markActivity);
  window.removeEventListener("keydown", markActivity);
  window.removeEventListener("click", markActivity);
  window.removeEventListener("scroll", markActivity);
  document.removeEventListener("visibilitychange", onVisibility);
}

export async function logoutWithSessionClose(): Promise<void> {
  const sessionId = localStorage.getItem("sessionId");
  try {
    await api.post("/auth/logout", sessionId ? { sessionId } : {});
  } catch {
    // best-effort
  } finally {
    stopSessionTelemetry();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("sessionId");
  }
}
