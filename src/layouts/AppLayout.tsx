import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ActuarialPage } from "../modules/actuarial/ActuarialPage";
import { clearAllDrafts } from "../modules/actuarial/draftStorage";
import { AppHeader } from "./AppHeader";

export function AppLayout() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  const showActuarial = location.pathname === "/dashboard";

  return (
    <div className="bg-app-light min-h-screen">
      <AppHeader email={user.email} onLogout={handleLogout} />
      {/* Wizard/dashboard state kalır; diğer route'larda gizlenir */}
      <div className={showActuarial ? undefined : "hidden"} aria-hidden={!showActuarial}>
        <ActuarialPage />
      </div>
      <Outlet />
    </div>
  );
}
