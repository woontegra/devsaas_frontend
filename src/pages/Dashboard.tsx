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
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="app-workspace flex h-14 sm:h-[60px] items-center justify-between gap-3">
          <h1 className="text-[16px] sm:text-[17px] font-semibold text-blue-900 tracking-tight truncate">
            Aktüerya Platformu
          </h1>

          {/* Desktop: email + çıkış */}
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-[13px] font-normal text-slate-500 truncate max-w-[220px]">
              {user.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="btn-ghost min-h-[40px] px-3"
            >
              Çıkış
            </button>
          </div>

          {/* Mobile: profil menüsü */}
          <div className="sm:hidden">
            <UserMenu email={user.email} initial={initial} onLogout={handleLogout} />
          </div>
        </div>
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
          className="h-9 w-9 rounded-full bg-blue-900 text-white text-[13px] font-medium flex items-center justify-center hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/30"
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
