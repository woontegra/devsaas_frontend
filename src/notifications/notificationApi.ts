import { api } from "../services/api";

export type NotificationTypeName = "UPDATE" | "ANNOUNCEMENT" | "IMPORTANT";
export type NotificationAudienceName = "ALL" | "TRIAL" | "PAID";

export type UserNotification = {
  id: string;
  title: string;
  summary: string;
  content: string;
  type: NotificationTypeName;
  audience: NotificationAudienceName;
  version: string | null;
  isCritical: boolean;
  publishedAt: string;
  linkPath?: string | null;
  read: boolean;
};

export function notificationTarget(path: string | null | undefined): string | null {
  if (!path || !/^\/support\/AKT-\d+$/i.test(path)) return null;
  return path;
}

export const TYPE_LABEL: Record<NotificationTypeName, string> = {
  UPDATE: "Güncelleme",
  ANNOUNCEMENT: "Duyuru",
  IMPORTANT: "Önemli",
};

/** /notifications aynı zamanda SPA sayfası; Vite proxy ile çakışmasın. */
function notificationUrl(path: string): string {
  const configured = import.meta.env.VITE_API_URL;
  if (typeof configured === "string" && configured.length > 0) {
    return `${configured.replace(/\/$/, "")}${path}`;
  }
  if (import.meta.env.DEV) return `http://localhost:3000${path}`;
  return path;
}

const listeners = new Set<() => void>();

export function emitNotificationsChanged() {
  listeners.forEach((fn) => fn());
}

export function onNotificationsChanged(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>(notificationUrl("/notifications/unread-count"));
  return typeof data?.count === "number" ? data.count : 0;
}

export async function fetchNotifications(params: {
  filter?: string;
  page?: number;
  pageSize?: number;
}) {
  const { data } = await api.get<{
    items?: UserNotification[];
    total?: number;
    page?: number;
    pageSize?: number;
    unreadCount?: number;
  }>(notificationUrl("/notifications"), { params });
  const body = data && typeof data === "object" ? data : {};
  return {
    items: Array.isArray(body.items) ? body.items : [],
    total: typeof body.total === "number" ? body.total : 0,
    page: typeof body.page === "number" ? body.page : params.page ?? 1,
    pageSize: typeof body.pageSize === "number" ? body.pageSize : params.pageSize ?? 20,
    unreadCount: typeof body.unreadCount === "number" ? body.unreadCount : 0,
  };
}

export async function fetchCriticalBanners(): Promise<UserNotification[]> {
  const { data } = await api.get<{ items?: UserNotification[] }>(notificationUrl("/notifications/critical"));
  return Array.isArray(data?.items) ? data.items : [];
}

export async function markNotificationRead(id: string, opened = false) {
  await api.post(notificationUrl(`/notifications/${id}/read`), { open: opened });
  emitNotificationsChanged();
}

export async function markAllNotificationsRead() {
  await api.post(notificationUrl("/notifications/read-all"));
  emitNotificationsChanged();
}

export async function dismissNotification(id: string) {
  await api.post(notificationUrl(`/notifications/${id}/dismiss`));
  emitNotificationsChanged();
}

export function formatNotifyTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function unreadBadgeLabel(count: number): string {
  if (count <= 0) return "";
  return count > 9 ? "9+" : String(count);
}
