import { useCallback, useEffect, useMemo, useRef, useState, createContext, useContext, type ReactNode } from "react";
import type { ToastInput, ToastItem, ToastKind } from "./types";
import "./toast.css";

interface ToastApi {
  push: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  error: (title: string, description?: string, dedupeKey?: string) => string;
  warning: (title: string, description?: string, dedupeKey?: string) => string;
  success: (title: string, description?: string, dedupeKey?: string) => string;
  info: (title: string, description?: string, dedupeKey?: string) => string;
}

const ToastContext = createContext<ToastApi | null>(null);

let seq = 0;
function nextId() {
  seq += 1;
  return `toast-${Date.now()}-${seq}`;
}

function kindIcon(kind: ToastKind) {
  if (kind === "success") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === "warning") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === "info") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 8h.01M11 12h1v4h1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v5m0 3h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) {
      window.clearTimeout(t);
      timers.current.delete(id);
    }
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = nextId();
      const item: ToastItem = {
        ...input,
        id,
        createdAt: Date.now(),
        durationMs: input.durationMs ?? 4500,
      };

      setItems((prev) => {
        let next = prev;
        if (input.dedupeKey) {
          const dup = prev.find((p) => p.dedupeKey === input.dedupeKey && p.kind === input.kind);
          if (dup) {
            const oldTimer = timers.current.get(dup.id);
            if (oldTimer) {
              window.clearTimeout(oldTimer);
              timers.current.delete(dup.id);
            }
            next = prev.filter((p) => p.id !== dup.id);
          }
        }
        return [...next, item].slice(-4);
      });

      if (item.durationMs && item.durationMs > 0) {
        const handle = window.setTimeout(() => dismiss(id), item.durationMs);
        timers.current.set(id, handle);
      }
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      push,
      dismiss,
      error: (title, description, dedupeKey) =>
        push({ kind: "error", title, description, dedupeKey: dedupeKey ?? `error:${title}:${description ?? ""}` }),
      warning: (title, description, dedupeKey) =>
        push({ kind: "warning", title, description, dedupeKey: dedupeKey ?? `warning:${title}:${description ?? ""}` }),
      success: (title, description, dedupeKey) =>
        push({ kind: "success", title, description, dedupeKey: dedupeKey ?? `success:${title}` }),
      info: (title, description, dedupeKey) =>
        push({ kind: "info", title, description, dedupeKey: dedupeKey ?? `info:${title}` }),
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="aktuerya-toast-viewport" aria-live="polite" aria-relevant="additions text">
        {items.map((item) => (
          <div
            key={item.id}
            className={`aktuerya-toast aktuerya-toast--${item.kind}`}
            role={item.kind === "error" || item.kind === "warning" ? "alert" : "status"}
          >
            <span className="aktuerya-toast-icon" aria-hidden>
              {kindIcon(item.kind)}
            </span>
            <div className="aktuerya-toast-body">
              <p className="aktuerya-toast-title">{item.title}</p>
              {item.description ? <p className="aktuerya-toast-desc">{item.description}</p> : null}
            </div>
            <button
              type="button"
              className="aktuerya-toast-close"
              aria-label="Bildirimi kapat"
              onClick={() => dismiss(item.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
