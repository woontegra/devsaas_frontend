import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchAuthMe } from "../services/api";
import type { AuthMeResponse } from "../modules/actuarial/types/savedCalculation";

const TABS = [
  { to: "/account/profile", label: "Profilim" },
  { to: "/account/license", label: "Lisansım" },
  { to: "/account/security", label: "Şifre" },
  { to: "/account/settings", label: "Ayarlar" },
] as const;

export function AccountLayout() {
  const navigate = useNavigate();
  const [me, setMe] = useState<AuthMeResponse | null>(null);

  useEffect(() => {
    void fetchAuthMe()
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  const name = me?.user?.name?.trim() || null;
  const email = me?.user?.email ?? "";
  const initial = (name?.[0] || email[0] || "U").toUpperCase();
  const trial = me?.trial;
  const statusBadge =
    trial?.isTrial && trial.blockReason === "TRIAL_EXPIRED"
      ? "Süresi doldu"
      : trial?.isTrial && trial.blockReason === "TRIAL_CREDITS_EXHAUSTED"
        ? "Kredi tükendi"
        : trial?.isTrial
          ? "Demo"
          : me?.capabilities?.subscriptionActive
            ? "Aktif"
            : "Pasif";

  return (
    <div className="user-app-shell min-h-[calc(100vh-58px)] bg-[var(--color-bg)] pb-8">
      <div className="app-workspace dashboard-workspace py-3 sm:py-4">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="mb-2 text-[13px] font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] min-h-[36px]"
        >
          ← Ana sayfa
        </button>

        <h1 className="ui-page-title text-[var(--color-text)]">Hesabım</h1>
        <p className="ui-page-subtitle mt-1 text-[var(--color-muted)]">
          Hesap bilgilerinizi, lisansınızı ve uygulama tercihlerinizi buradan yönetebilirsiniz.
        </p>

        <div className="account-surface mt-4 flex flex-wrap items-center gap-3 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3 shadow-[var(--shadow-xs)]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[14px] font-semibold text-[var(--color-primary)]">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-[var(--color-text)]">
              {name || "Kullanıcı"}
            </p>
            <p className="truncate text-[12.5px] text-[var(--color-muted)]">{email}</p>
          </div>
          <span className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-primary-soft)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--color-primary)]">
            {statusBadge}
          </span>
        </div>

        <nav
          className="mt-4 flex flex-wrap gap-1 border-b border-[var(--color-border)]"
          aria-label="Hesap bölümleri"
        >
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `min-h-[40px] px-3 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
                  isActive
                    ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                    : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4">
          <Outlet context={{ me, setMe }} />
        </div>
      </div>
    </div>
  );
}
