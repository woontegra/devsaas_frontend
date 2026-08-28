import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ActuarialPage } from "../modules/actuarial/ActuarialPage";
import { clearAllDrafts } from "../modules/actuarial/draftStorage";
import { DropdownMenu, MenuItem } from "../modules/actuarial/wizard/shared/MobileChrome";

export function Dashboard() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      navigate("/login", { replace: true });
      return;
    }
    try {
      setUser(JSON.parse(raw) as { id: string; email: string });
    } catch {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    clearAllDrafts();
    navigate("/login", { replace: true });
  };

  if (!user) return null;

  const initial = (user.email.trim()[0] ?? "U").toUpperCase();

  return (
    <>
      <header className="bg-white sticky top-0 z-30 shadow-[0_1px_0_rgba(15,95,99,0.06)]">
        <div className="app-workspace flex h-14 sm:h-[58px] items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#EAF4F3] text-[#0F5F63] ring-1 ring-[#0F5F63]/10"
              aria-hidden
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M4 19V5M4 19h16M8 15v-4M12 15V9M16 15v-2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-[15px] sm:text-[16px] font-semibold text-[#22313F] tracking-[-0.02em] truncate">
              Aktüerya Platformu
            </h1>
          </div>

          {/* Desktop: email + çıkış */}
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-[12.5px] font-normal text-[#6B7280] truncate max-w-[220px]">
              {user.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[36px] px-3 rounded-[9px] text-[13px] font-medium text-[#6B7280] hover:text-[#22313F] hover:bg-[#EAF4F3]/50 transition-colors duration-200"
            >
              Çıkış
            </button>
          </div>

          {/* Mobile: profil menüsü */}
          <div className="sm:hidden">
            <UserMenu email={user.email} initial={initial} onLogout={handleLogout} />
          </div>
        </div>
        <div className="h-[2px] bg-gradient-to-r from-[#0F5F63] via-[#0F5F63] to-[#0B474A]" aria-hidden />
      </header>
      <ActuarialPage />
    </>
  );
}

function UserMenu({
  email,
  initial,
  onLogout,
}: {
  email: string;
  initial: string;
  onLogout: () => void;
}) {
  const labelId = useId();
  return (
    <DropdownMenu
      labelledBy={labelId}
      trigger={({ buttonProps, buttonRef }) => (
        <button
          {...buttonProps}
          ref={buttonRef}
          id={labelId}
          type="button"
          className="h-9 w-9 rounded-full bg-[#0F5F63] text-white text-[13px] font-medium flex items-center justify-center hover:bg-[#0B474A] focus:outline-none focus:ring-2 focus:ring-[#0F5F63]/30 transition-colors duration-200"
          aria-label="Kullanıcı menüsü"
        >
          {initial}
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="px-3.5 py-2.5 border-b border-slate-100">
            <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-slate-400">Hesap</p>
            <p className="text-[13px] font-normal text-slate-700 break-all mt-0.5">{email}</p>
          </div>
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
  );
}
