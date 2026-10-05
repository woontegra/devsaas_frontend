import type { ReactNode } from "react";

export type KpiTone = "cyan" | "green" | "blue" | "teal" | "orange" | "purple" | "red" | "navy";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "admin-badge-active",
    PASSIVE: "admin-badge-passive",
    SUSPENDED: "admin-badge-suspended",
  };
  const label: Record<string, string> = {
    ACTIVE: "Aktif",
    PASSIVE: "Pasif",
    SUSPENDED: "Askıda",
  };
  return <span className={`admin-badge ${map[status] ?? "admin-badge-passive"}`}>{label[status] ?? status}</span>;
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`admin-badge ${role === "ADMIN" ? "admin-badge-admin" : "admin-badge-user"}`}>
      {role === "ADMIN" ? "Admin" : "Kullanıcı"}
    </span>
  );
}

export function TrialBadge({ isTrial }: { isTrial: boolean }) {
  return (
    <span className={`admin-badge ${isTrial ? "admin-badge-trial" : "admin-badge-paid"}`}>
      {isTrial ? "Deneme" : "Ücretli"}
    </span>
  );
}

export function ActiveSubBadge({ active }: { active: boolean }) {
  return (
    <span className={`admin-badge ${active ? "admin-badge-active" : "admin-badge-expired"}`}>
      {active ? "Aktif" : "Süresi dolmuş"}
    </span>
  );
}

export function AdminPageHeader({
  title,
  description,
  actions,
  card = true,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  card?: boolean;
}) {
  return (
    <div className={`admin-page-header${card ? " is-card" : ""} admin-page-header-row`}>
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="admin-page-header-actions">{actions}</div> : null}
    </div>
  );
}

export function AdminCard({
  title,
  subtitle,
  actions,
  children,
  flush,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  flush?: boolean;
}) {
  return (
    <section className="admin-card">
      {title || actions ? (
        <div className="admin-card-header">
          <div>
            {title ? <div className="admin-card-title">{title}</div> : null}
            {subtitle ? <div className="admin-card-subtitle">{subtitle}</div> : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className={`admin-card-body${flush ? " is-flush" : ""}`}>{children}</div>
    </section>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: KpiTone;
}) {
  return (
    <div className="admin-kpi-card">
      {icon ? <div className={`admin-kpi-icon is-${tone}`}>{icon}</div> : null}
      <div style={{ minWidth: 0 }}>
        <div className="admin-kpi-label">{label}</div>
        <div className="admin-kpi-value">{value}</div>
        {hint ? <div className="admin-kpi-hint">{hint}</div> : null}
      </div>
    </div>
  );
}

export function AdminToolbar({ children }: { children: ReactNode }) {
  return <div className="admin-toolbar">{children}</div>;
}

export function AdminEmptyState({ children }: { children: ReactNode }) {
  return <div className="admin-empty">{children}</div>;
}

export function AdminTabs({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="admin-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          className={`admin-tab${value === t.id ? " is-active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function AdminActionBar({ children }: { children: ReactNode }) {
  return <div className="admin-action-bar">{children}</div>;
}

export function SparkChart({
  data,
  showLabels = true,
}: {
  data: Array<{ date: string; count: number }>;
  showLabels?: boolean;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="admin-spark">
      {data.map((d) => {
        const day = d.date.slice(8);
        return (
          <div key={d.date} className="admin-spark-col" title={`${d.date}: ${d.count}`}>
            <div
              className={`admin-spark-bar${d.count === max ? " is-peak" : ""}`}
              style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
            />
            {showLabels ? <div className="admin-spark-label">{day}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

export function MetaSummary({ data }: { data: Record<string, unknown> | null | undefined }) {
  if (!data || Object.keys(data).length === 0) {
    return <span className="admin-muted">—</span>;
  }
  return (
    <div className="admin-meta-chips">
      {Object.entries(data).map(([k, v]) => (
        <span key={k} className="admin-meta-chip">
          <strong>{k}</strong> {String(v ?? "—")}
        </span>
      ))}
    </div>
  );
}

export function Modal({
  title,
  children,
  footer,
  onClose,
  large,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  large?: boolean;
}) {
  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`admin-modal${large ? " admin-modal-lg" : ""}`}
        role="dialog"
        aria-modal
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-header">{title}</div>
        <div className="admin-modal-body">{children}</div>
        {footer ? <div className="admin-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

/** Simple SVG icons for KPI cards */
export function AdminIcon({
  path,
  size = 17,
}: {
  path: string;
  size?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const ICONS = {
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  pulse: "M22 12h-4l-3 9L9 3l-3 9H2",
  check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3",
  calc: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2",
  report: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  clock: "M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  money: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  trial: "M12 8v4l3 3M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
  login: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
  map: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  chart: "M3 3v18h18M7 14l4-4 4 4 5-6",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  pause: "M6 4h4v16H6zM14 4h4v16h-4z",
} as const;
