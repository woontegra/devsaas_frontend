import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { fetchAuthMe } from "../services/api";
import { useLiveRefresh } from "../support/liveRefresh";
import { fetchAdminSupportUnreadCount, formatSupportUnreadBadge, onAdminSupportSeen } from "./adminApi";
import { logoutWithSessionClose } from "../services/sessionTelemetry";
import { ToastProvider } from "../ui/toast";
import "./admin.css";

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const NAV = [
  {
    section: "Kontrol Merkezi",
    items: [{ to: "/admin", end: true, label: "Genel Bakış", d: "M3 12l9-9 9 9M5 10v10h14V10" }],
  },
  {
    section: "Kullanıcı Yönetimi",
    items: [
      {
        to: "/admin/users",
        end: false,
        label: "Kullanıcılar",
        d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
        match: (path: string) => path.startsWith("/admin/users") && path !== "/admin/users/new",
      },
      {
        to: "/admin/users/new",
        end: true,
        label: "Yeni Kullanıcı",
        d: "M12 5v14M5 12h14",
        match: (path: string) => path === "/admin/users/new",
      },
      {
        to: "/admin/demo-requests",
        end: false,
        label: "Demo Talepleri",
        d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
      },
    ],
  },
  {
    section: "Abonelik",
    items: [
      { to: "/admin/subscriptions", end: false, label: "Abonelikler", d: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
      {
        to: "/admin/sales-settings",
        end: false,
        label: "Satış Sayfası Yönetimi",
        d: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
      },
    ],
  },
  {
    section: "Analitik",
    items: [
      { to: "/admin/analytics/usage", end: false, label: "Kullanım Analitiği", d: "M3 3v18h18M7 14l4-4 4 4 5-6" },
      {
        to: "/admin/analytics/calculations",
        end: false,
        label: "Hesaplama Analitiği",
        d: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2",
      },
      { to: "/admin/analytics/sessions", end: false, label: "Oturum Analitiği", d: "M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" },
      {
        to: "/admin/analytics/geo",
        end: false,
        label: "Coğrafi Kullanım",
        d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
      },
    ],
  },
  {
    section: "Araştırma",
    items: [
      {
        to: "/admin/pricing-survey",
        end: false,
        label: "Fiyat Anketi",
        d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
      },
    ],
  },
  {
    section: "Sistem",
    items: [
      { to: "/admin/support", end: false, label: "Destek Talepleri", d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
      { to: "/admin/notifications", end: false, label: "Bildirimler", d: "M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.73 21a2 2 0 01-3.46 0" },
      { to: "/admin/audit", end: false, label: "Admin İşlemleri", d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
    ],
  },
] as const;

function pageTitle(pathname: string): string {
  if (pathname === "/admin") return "Kontrol Merkezi";
  if (pathname === "/admin/users/new") return "Yeni Kullanıcı";
  if (pathname.startsWith("/admin/demo-requests")) return "Demo Talepleri";
  if (pathname.startsWith("/admin/users/")) return "Kullanıcı Detayı";
  if (pathname.startsWith("/admin/users")) return "Kullanıcı Yönetimi";
  if (pathname.startsWith("/admin/subscriptions")) return "Abonelikler";
  if (pathname.startsWith("/admin/sales-settings")) return "Satış Sayfası Yönetimi";
  if (pathname.startsWith("/admin/analytics/usage")) return "Kullanım Analitiği";
  if (pathname.startsWith("/admin/analytics/calculations")) return "Hesaplama Analitiği";
  if (pathname.startsWith("/admin/analytics/sessions")) return "Oturum Analitiği";
  if (pathname.startsWith("/admin/analytics/geo")) return "Coğrafi Kullanım";
  if (pathname.startsWith("/admin/pricing-survey")) return "Fiyat Anketi";
  if (pathname.startsWith("/admin/support")) return "Destek Talepleri";
  if (pathname.startsWith("/admin/notifications")) return "Bildirimler";
  if (pathname.startsWith("/admin/audit")) return "Admin İşlemleri";
  return "Yönetim Paneli";
}

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [supportUnread, setSupportUnread] = useState(0);
  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState(false);
  const title = useMemo(() => pageTitle(location.pathname), [location.pathname]);

  const loadUnread = () =>
    fetchAdminSupportUnreadCount()
      .then((count) => setSupportUnread(count))
      .catch(() => setSupportUnread(0));
  const kickSupportUnread = useLiveRefresh(loadUnread);

  useEffect(() => onAdminSupportSeen(kickSupportUnread), [kickSupportUnread]);

  useEffect(() => {
    let cancelled = false;
    fetchAuthMe()
      .then((me) => {
        if (cancelled) return;
        if (!me.capabilities?.isAdmin) {
          setDenied(true);
          setReady(true);
          return;
        }
        setEmail(me.user.email ?? "");
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          navigate("/login", { replace: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (!ready) {
    return (
      <div className="admin-shell">
        <div className="admin-loading" style={{ width: "100%" }}>
          Yönetim paneli yükleniyor…
        </div>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="admin-shell">
        <div className="admin-content" style={{ margin: "auto" }}>
          <div className="admin-card">
            <div className="admin-card-body admin-error">
              Bu alana erişim yetkiniz yok.
              <div style={{ marginTop: 12 }}>
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => navigate("/dashboard")}>
                  Uygulamaya dön
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <div className="admin-sidebar-brand-mark" aria-hidden>
              A
            </div>
            <div>
              <div className="admin-sidebar-brand-title">AKTÜERYA</div>
              <div className="admin-sidebar-brand-sub">Yönetim Paneli</div>
            </div>
          </div>
          {NAV.map((group) => (
            <div key={group.section} className="admin-nav-section">
              <div className="admin-nav-section-label">{group.section}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={"end" in item ? Boolean(item.end) : false}
                  className={({ isActive }) => {
                    const custom =
                      "match" in item && typeof item.match === "function"
                        ? item.match(location.pathname)
                        : isActive;
                    return `admin-nav-link${custom ? " is-active" : ""}`;
                  }}
                >
                  <Icon d={item.d} />
                  <span className="admin-nav-text">{item.label}</span>
                  {item.to === "/admin/support" && supportUnread > 0 ? (
                    <span className="admin-nav-badge" aria-label={`${supportUnread} görülmemiş destek talebi`}>
                      {formatSupportUnreadBadge(supportUnread)}
                    </span>
                  ) : null}
                </NavLink>
              ))}
            </div>
          ))}
        </aside>

        <div className="admin-main">
          <header className="admin-topbar">
            <div className="admin-topbar-title">{title}</div>
            <div className="admin-topbar-actions">
              <span className="admin-topbar-user" title={email}>
                {email}
              </span>
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                onClick={() => navigate("/dashboard")}
              >
                Uygulamaya dön
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-ghost admin-btn-sm"
                onClick={() => {
                  void logoutWithSessionClose().finally(() => navigate("/login", { replace: true }));
                }}
              >
                Çıkış
              </button>
            </div>
          </header>
          <div className="admin-content">
            <Outlet />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
