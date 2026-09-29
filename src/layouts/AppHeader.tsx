import { useId } from "react";
import { useNavigate } from "react-router-dom";
import { DropdownMenu, MenuItem } from "../modules/actuarial/wizard/shared/MobileChrome";
import emblem from "../assets/brand/emblem.png";

export function AppHeader({
  email,
  onLogout,
}: {
  email: string;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const initial = (email.trim()[0] ?? "U").toUpperCase();
  const labelId = useId();

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

        <DropdownMenu
          labelledBy={labelId}
          trigger={({ buttonProps, buttonRef }) => (
            <button
              {...buttonProps}
              ref={buttonRef}
              id={labelId}
              type="button"
              className="inline-flex items-center gap-2 min-h-[40px] rounded-[10px] border border-white/20 bg-white/10 px-2 sm:px-3 text-white hover:bg-white/15 transition-colors"
              aria-label="Kullanıcı menüsü"
            >
              <span className="h-8 w-8 rounded-full bg-white/15 text-white text-[13px] font-semibold flex items-center justify-center border border-white/20">
                {initial}
              </span>
              <span className="hidden sm:inline max-w-[200px] truncate text-[12.5px] font-medium text-white/90">
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
                <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-brand-muted">
                  Hesap
                </p>
                <p className="text-[13px] font-medium text-brand-text break-all mt-0.5">{email}</p>
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
                  navigate("/profil");
                }}
              >
                Profil / Hesap
              </MenuItem>
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
    </header>
  );
}
