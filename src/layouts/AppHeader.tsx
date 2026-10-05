import { useId } from "react";
import { useNavigate } from "react-router-dom";
import { DropdownMenu, MenuItem } from "../modules/actuarial/wizard/shared/MobileChrome";
import type { TrialInfo } from "../modules/actuarial/types/savedCalculation";
import emblem from "../assets/brand/emblem.png";
import { ThemeToggleButton } from "./ThemeToggleButton";
import { NotificationBell } from "../notifications/NotificationBell";
import { SupportMenu } from "../support/SupportMenu";

export function AppHeader({
  email,
  onLogout,
  isAdmin = false,
  trial = null,
}: {
  email: string;
  onLogout: () => void;
  isAdmin?: boolean;
  trial?: TrialInfo | null;
}) {
  const navigate = useNavigate();
  const initial = (email.trim()[0] ?? "U").toUpperCase();
  const labelId = useId();

  const showTrialChip = Boolean(trial?.isTrial);
  const lowCredits = showTrialChip && (trial?.creditsRemaining ?? 0) <= 3;
  const blocked =
    trial?.isTrial &&
    (trial.blockReason === "TRIAL_EXPIRED" || trial.blockReason === "TRIAL_CREDITS_EXHAUSTED");

  const blockMessage =
    trial?.blockReason === "TRIAL_EXPIRED"
      ? "Deneme süreniz sona erdi."
      : trial?.blockReason === "TRIAL_CREDITS_EXHAUSTED"
        ? "Deneme kredileriniz tükendi."
        : null;

  return (
    <header className="app-topbar-dark">
      <div className="app-workspace flex h-[58px] items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3 min-w-0 text-left"
        >
          <div className="app-topbar-shield" aria-hidden>
            <img src={emblem} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
          </div>
          <span className="app-topbar-brand-text truncate">Aktüerya Platformu</span>
        </button>

        <div className="header-actions flex items-center gap-1.5 sm:gap-2 min-w-0">
          {showTrialChip ? (
            <span
              className={`hidden md:inline-flex items-center min-h-[32px] rounded-[8px] border px-2.5 text-[11.5px] font-medium tracking-[-0.01em] whitespace-nowrap ${
                lowCredits
                  ? "border-amber-400/40 bg-amber-500/15 text-amber-100"
                  : "border-white/15 bg-white/[0.08] text-white/90"
              }`}
              title="Deneme hesabı"
            >
              Deneme · {trial!.daysRemaining} gün · {trial!.creditsRemaining}/{trial!.creditsInitial}{" "}
              kredi
            </span>
          ) : null}

          <ThemeToggleButton />
          <NotificationBell />
          <SupportMenu />

          <DropdownMenu
            labelledBy={labelId}
            trigger={({ buttonProps, buttonRef }) => (
              <button
                {...buttonProps}
                ref={buttonRef}
                id={labelId}
                type="button"
                className="inline-flex items-center gap-2 min-h-[36px] rounded-[8px] border border-white/15 bg-white/[0.08] px-2 sm:px-2.5 text-white hover:bg-white/[0.12] transition-colors"
                aria-label="Kullanıcı menüsü"
              >
                <span className="h-7 w-7 rounded-full bg-white/12 text-white text-[12.5px] font-semibold flex items-center justify-center border border-white/15 tracking-[-0.01em]">
                  {initial}
                </span>
                <span className="hidden sm:inline max-w-[160px] lg:max-w-[200px] truncate text-[12.5px] font-medium text-white/85 tracking-[-0.01em]">
                  {email}
                </span>
                <svg
                  className="hidden sm:block shrink-0 opacity-80"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          >
            {(close) => (
              <>
                <div className="px-3.5 py-2.5 border-b border-brand-border">
                  <p className="text-[10px] font-medium uppercase tracking-[0.04em] text-brand-muted">
                    Hesap
                  </p>
                  <p className="text-[13px] font-medium text-brand-text break-all mt-0.5">{email}</p>
                  {showTrialChip ? (
                    <p
                      className={`text-[12px] mt-1 ${lowCredits ? "text-amber-700" : "text-brand-muted"}`}
                    >
                      Deneme · {trial!.daysRemaining} gün · {trial!.creditsRemaining}/
                      {trial!.creditsInitial} kredi
                    </p>
                  ) : null}
                </div>
                <MenuItem
                  onClick={() => {
                    close();
                    navigate("/kayitli-hesaplamalar");
                  }}
                >
                  Kayıtlı Hesaplamalar
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    close();
                    navigate("/account/profile");
                  }}
                >
                  Profilim
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    close();
                    navigate("/account/license");
                  }}
                >
                  Lisansım
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    close();
                    navigate("/account/settings");
                  }}
                >
                  Ayarlar
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    close();
                    navigate("/account/security");
                  }}
                >
                  Şifre Değiştir
                </MenuItem>
                {isAdmin ? (
                  <MenuItem
                    onClick={() => {
                      close();
                      navigate("/admin");
                    }}
                  >
                    Yönetim Paneli
                  </MenuItem>
                ) : null}
                <MenuItem
                  danger
                  onClick={() => {
                    close();
                    onLogout();
                  }}
                >
                  Çıkış
                </MenuItem>
              </>
            )}
          </DropdownMenu>
        </div>
      </div>

      {blocked && blockMessage ? (
        <div className="border-t border-white/10 bg-white/[0.06]">
          <div className="app-workspace flex flex-wrap items-center justify-between gap-2 py-2 text-[12.5px] text-white/85">
            <span>{blockMessage}</span>
            <button
              type="button"
              className="min-h-[32px] rounded-[8px] border border-white/20 bg-white/10 px-3 text-[12px] font-medium text-white hover:bg-white/15 transition-colors"
              onClick={() => navigate("/account/license")}
            >
              Paketleri İncele
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
