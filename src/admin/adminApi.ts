/** Admin API client — yalnızca /admin/* okuma/yazma; testlerde mocklanır */

import { api, toApiClientError } from "../services/api";

/** SPA /admin ile Vite proxy çakışmasın diye local'de backend origin kullan */
function adminUrl(path: string): string {
  const configured = import.meta.env.VITE_API_URL;
  if (typeof configured === "string" && configured.length > 0) {
    return `${configured.replace(/\/$/, "")}${path}`;
  }
  if (import.meta.env.DEV) {
    return `http://localhost:3000${path}`;
  }
  return path;
}
export type AdminUserListItem = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  plan: string | null;
  isTrial: boolean;
  subscriptionStartsAt: string | null;
  subscriptionExpiresAt: string | null;
  createdAt: string;
  firstLoginAt: string | null;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  savedCalculationCount: number;
  creditBalance?: number;
  trialCreditsGranted?: number | null;
};

export type AdminDashboardSummary = {
  users: {
    total: number;
    activeAccounts: number;
    trial: number;
    paid: number;
    activeToday?: number;
  };
  calculations: {
    total: number;
    draft: number;
    completed: number;
    createdToday: number;
    createdLast7Days?: number;
    reportsToday?: number;
    byType: Array<{ calculationType: string; count: number }>;
  };
  sessions: {
    loginsToday: number;
    sessionsToday: number;
    activeNow: number;
    averageActiveSeconds: number;
    averageActiveLabel: string;
    trackingSince: string | null;
    idleTimeoutMs: number;
  };
  charts?: {
    activeUsersLast7Days: Array<{ date: string; count: number }>;
    calculationsLast7Days: Array<{ date: string; count: number }>;
    cities: Array<{ label: string; count: number }>;
  };
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    status: string;
    plan: string | null;
    isTrial: boolean;
    createdAt: string;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    occurredAt: string;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    calculationType: string | null;
  }>;
};

export type AdminUserDetail = AdminUserListItem & {
  phone?: string | null;
  adminNote: string | null;
  updatedAt: string;
  trialCreditsGranted?: number;
  trialCreditsUsed?: number;
  sessionCount: number;
  subscriptions: Array<{
    id: string;
    plan: string;
    startsAt: string;
    expiresAt: string;
    isTrial: boolean;
    createdAt: string;
    updatedAt: string;
    active: boolean;
  }>;
  sessionStats: {
    totalSessions: number;
    totalActiveSeconds: number;
    totalActiveLabel: string;
    averageActiveSeconds: number;
    averageActiveLabel: string;
  };
  calculationStats: {
    total: number;
    draft: number;
    completed: number;
  };
  sessions: Array<{
    id: string;
    startedAt: string;
    lastSeenAt: string;
    endedAt: string | null;
    effectiveEndedAt: string | null;
    endReason: string | null;
    durationSeconds: number;
    durationLabel: string;
    browser: string | null;
    os: string | null;
    clientType: string;
    location: string | null;
  }>;
  activities: Array<{
    id: string;
    type: string;
    occurredAt: string;
    calculationType: string | null;
  }>;
  calculations: Array<{
    id: string;
    title: string | null;
    displayName: string | null;
    calculationType: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    lastOpenedAt: string | null;
  }>;
};

function unwrap<T>(p: Promise<{ data: T }>): Promise<T> {
  return p.then((r) => r.data).catch((err) => {
    throw toApiClientError(err);
  });
}

export function fetchAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  return unwrap(api.get<AdminDashboardSummary>(adminUrl("/admin/dashboard/summary")));
}

export function fetchAdminUsers(params: Record<string, string | number | boolean | undefined>) {
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "" || v === "ALL") continue;
    query[k] = String(v);
  }
  return unwrap(
    api.get<{
      total: number;
      page: number;
      pageSize: number;
      items: AdminUserListItem[];
    }>(adminUrl("/admin/users"), { params: query })
  );
}

export function fetchAdminUser(id: string): Promise<{ item: AdminUserDetail }> {
  return unwrap(api.get<{ item: AdminUserDetail }>(adminUrl(`/admin/users/${id}`)));
}

export function createAdminUser(body: Record<string, unknown>): Promise<{ item: AdminUserDetail }> {
  return unwrap(api.post<{ item: AdminUserDetail }>(adminUrl("/admin/users"), body));
}

export function patchAdminUser(
  id: string,
  body: Record<string, unknown>
): Promise<{ item: AdminUserDetail }> {
  return unwrap(api.patch<{ item: AdminUserDetail }>(adminUrl(`/admin/users/${id}`), body));
}

export function deactivateAdminUser(id: string): Promise<{ item: AdminUserDetail }> {
  return unwrap(api.post<{ item: AdminUserDetail }>(adminUrl(`/admin/users/${id}/deactivate`)));
}

export function patchAdminSubscription(
  id: string,
  body: Record<string, unknown>
): Promise<{ item: AdminUserDetail }> {
  return unwrap(api.patch<{ item: AdminUserDetail }>(adminUrl(`/admin/users/${id}/subscription`), body));
}

export function fetchAdminSubscriptions(params: Record<string, string | number | boolean | undefined>) {
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "" || v === "ALL") continue;
    query[k] = String(v);
  }
  return unwrap(
    api.get<{
      total: number;
      page: number;
      pageSize: number;
      items: Array<{
        id: string;
        userId: string;
        userName: string | null;
        userEmail: string;
        userStatus: string;
        plan: string;
        isTrial: boolean;
        startsAt: string;
        expiresAt: string;
        active: boolean;
        remainingMs: number;
      }>;
    }>(adminUrl("/admin/subscriptions"), { params: query })
  );
}

function adminQuery(params: Record<string, string | number | boolean | undefined>) {
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "" || v === "ALL") continue;
    query[k] = String(v);
  }
  return query;
}

export function fetchAdminUsageAnalytics(params: Record<string, string | undefined>) {
  return unwrap(api.get(adminUrl("/admin/analytics/usage"), { params: adminQuery(params) }));
}

export function fetchAdminCalculationAnalytics(params: Record<string, string | undefined>) {
  return unwrap(api.get(adminUrl("/admin/analytics/calculations"), { params: adminQuery(params) }));
}

export function fetchAdminSessionAnalytics(params: Record<string, string | number | boolean | undefined>) {
  return unwrap(api.get(adminUrl("/admin/analytics/sessions"), { params: adminQuery(params) }));
}

export function fetchAdminGeoAnalytics(params: Record<string, string | undefined>) {
  return unwrap(api.get(adminUrl("/admin/analytics/geo"), { params: adminQuery(params) }));
}

export function fetchAdminAudit(params: Record<string, string | number | undefined>) {
  return unwrap(api.get(adminUrl("/admin/audit"), { params: adminQuery(params) }));
}

export function fetchAdminPricingSurvey() {
  return unwrap(api.get(adminUrl("/admin/pricing-survey")));
}

export function patchAdminPricingSurveySetting(body: { enabled?: boolean; audience?: string }) {
  return unwrap(api.patch(adminUrl("/admin/settings/pricing-survey"), body));
}

export type AdminSalesText = { title: string; text: string };
export type AdminSalesShot = { id: string; caption: string; alt: string; url: string };
export type AdminSalesSections = {
  modules: boolean;
  features: boolean;
  gallery: boolean;
  audience: boolean;
  reasons: boolean;
  demo: boolean;
  faq: boolean;
  mobile: boolean;
  closing: boolean;
};
export type AdminSalesPage = {
  heroTitle: string;
  heroHeadline: string;
  heroLead: string;
  logoUrl: string;
  heroImageUrl: string;
  gallery: AdminSalesShot[];
  modules: AdminSalesText[];
  features: AdminSalesText[];
  sections: AdminSalesSections;
  mobileTitle: string;
  mobileText: string;
  googlePlayKicker: string;
  googlePlayLabel: string;
  googlePlayUrl: string;
  appStoreKicker: string;
  appStoreLabel: string;
  appStoreUrl: string;
};
export type AdminSalesSetting = {
  monthlyPriceTl: number;
  yearlyPriceTl: number;
  demoDurationDays: number;
  demoCredits: number;
  demoRequestsEnabled: boolean;
  purchaseEnabled: boolean;
  page: AdminSalesPage;
};

export function salesAssetUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return adminUrl(url);
}

export function fetchAdminSalesSetting(): Promise<{ setting: AdminSalesSetting }> {
  return unwrap(api.get(adminUrl("/admin/settings/sales")));
}

export function patchAdminSalesSetting(body: AdminSalesSetting): Promise<{ setting: AdminSalesSetting }> {
  return unwrap(api.patch(adminUrl("/admin/settings/sales"), body));
}

export function uploadAdminSalesMedia(body: {
  fileName: string;
  mimeType: string;
  dataBase64: string;
}): Promise<{ id: string; url: string }> {
  return unwrap(api.post(adminUrl("/admin/sales-media"), body));
}

export type AdminDemoRequestItem = {
  id: string;
  name: string | null;
  email: string;
  phone: string;
  createdAt: string;
  userId: string | null;
  isTrial: boolean;
  trialCreditsGranted: number | null;
  creditBalance: number | null;
  expiresAt: string | null;
};

export function fetchAdminDemoRequests(): Promise<{ items: AdminDemoRequestItem[] }> {
  return unwrap(api.get(adminUrl("/admin/demo-requests")));
}

export function fetchAdminTrialConfig(): Promise<{ durationDays: number; initialCredits: number }> {
  return unwrap(api.get(adminUrl("/admin/trial-config")));
}

export function adjustAdminUserCredits(
  id: string,
  delta: number
): Promise<{ item: AdminUserDetail }> {
  return unwrap(api.post<{ item: AdminUserDetail }>(adminUrl(`/admin/users/${id}/credits`), { delta }));
}

export function extendAdminTrial(
  id: string,
  body: { addedDays: number; addedCredits: number }
): Promise<{ item: AdminUserDetail }> {
  return unwrap(api.post<{ item: AdminUserDetail }>(adminUrl(`/admin/users/${id}/trial/extend`), body));
}

export function convertAdminTrialToPaid(
  id: string,
  body: { plan: "monthly" | "yearly"; startsAt?: string }
): Promise<{ item: AdminUserDetail }> {
  return unwrap(api.post<{ item: AdminUserDetail }>(adminUrl(`/admin/users/${id}/trial/convert`), body));
}

export type AdminNotificationItem = {
  id: string;
  title: string;
  summary: string;
  content: string;
  type: "UPDATE" | "ANNOUNCEMENT" | "IMPORTANT";
  audience: "ALL" | "TRIAL" | "PAID";
  version: string | null;
  isCritical: boolean;
  status: "DRAFT" | "PUBLISHED" | "INACTIVE";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function fetchAdminNotifications(params: { page?: number; status?: string }) {
  return unwrap(
    api.get<{ total: number; page: number; pageSize: number; items: AdminNotificationItem[] }>(
      adminUrl("/admin/notifications"),
      { params: adminQuery(params) }
    )
  );
}

export function createAdminNotification(body: Record<string, unknown>) {
  return unwrap(api.post<{ item: AdminNotificationItem }>(adminUrl("/admin/notifications"), body));
}

export function updateAdminNotification(id: string, body: Record<string, unknown>) {
  return unwrap(api.patch<{ item: AdminNotificationItem }>(adminUrl(`/admin/notifications/${id}`), body));
}

export function publishAdminNotification(id: string) {
  return unwrap(api.post<{ item: AdminNotificationItem }>(adminUrl(`/admin/notifications/${id}/publish`)));
}

export function deactivateAdminNotification(id: string) {
  return unwrap(api.post<{ item: AdminNotificationItem }>(adminUrl(`/admin/notifications/${id}/deactivate`)));
}

export type AdminSupportListItem = {
  publicNumber: string;
  userName: string | null;
  userEmail: string;
  category: "CALCULATION" | "TECHNICAL" | "LICENSE" | "SUGGESTION" | "OTHER";
  categoryLabel: string;
  subject: string;
  status: "OPEN" | "IN_REVIEW" | "WAITING_FOR_USER" | "ANSWERED" | "RESOLVED" | "CLOSED";
  awaitingStaff: boolean;
  createdAt: string;
  lastActivityAt: string;
};

export type AdminSupportDetail = AdminSupportListItem & {
  messages: Array<{
    id: string;
    authorRole: "USER" | "STAFF";
    body: string;
    createdAt: string;
    attachments: Array<{ id: string; fileName: string; mimeType: string; sizeBytes: number }>;
  }>;
};

export function fetchAdminSupportUnreadCount() {
  return unwrap(api.get<{ count: number }>(adminUrl("/admin/support/unread-count"))).then((data) =>
    typeof data.count === "number" ? data.count : 0
  );
}

const supportSeenListeners = new Set<() => void>();

export function emitAdminSupportSeen() {
  supportSeenListeners.forEach((fn) => fn());
}

export function onAdminSupportSeen(fn: () => void) {
  supportSeenListeners.add(fn);
  return () => {
    supportSeenListeners.delete(fn);
  };
}

export function formatSupportUnreadBadge(count: number): string {
  if (!Number.isFinite(count) || count <= 0) return "";
  if (count > 99) return "99+";
  return String(Math.floor(count));
}

export function fetchAdminSupportTickets(params: { q?: string; status?: string; category?: string; page?: number }) {
  return unwrap(
    api.get<{ total: number; page: number; pageSize: number; items: AdminSupportListItem[] }>(
      adminUrl("/admin/support/tickets"),
      { params: adminQuery(params) }
    )
  );
}

export function fetchAdminSupportTicket(publicNumber: string) {
  return unwrap(
    api.get<{ item: AdminSupportDetail }>(adminUrl(`/admin/support/tickets/${encodeURIComponent(publicNumber)}`))
  ).then((data) => data.item);
}

export function replyAdminSupportTicket(publicNumber: string, message: string) {
  return unwrap(
    api.post<{ item: AdminSupportDetail }>(
      adminUrl(`/admin/support/tickets/${encodeURIComponent(publicNumber)}/messages`),
      { message }
    )
  ).then((data) => data.item);
}

export function setAdminSupportStatus(publicNumber: string, status: string) {
  return unwrap(
    api.patch<{ item: AdminSupportDetail }>(
      adminUrl(`/admin/support/tickets/${encodeURIComponent(publicNumber)}/status`),
      { status }
    )
  ).then((data) => data.item);
}
