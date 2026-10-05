export type ToastKind = "error" | "warning" | "success" | "info";

export interface ToastInput {
  kind: ToastKind;
  title: string;
  description?: string;
  /** Ms; default 4500. Use 0 to require manual dismiss. */
  durationMs?: number;
  /** Deduplicate key — same key replaces the prior toast instead of stacking. */
  dedupeKey?: string;
}

export interface ToastItem extends ToastInput {
  id: string;
  createdAt: number;
}
