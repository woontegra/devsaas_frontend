import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { clearPricingSurveySessionFlags } from "../components/PricingSurveyHost";
import { ActuarialPage } from "../modules/actuarial/ActuarialPage";
import { clearAllDrafts } from "../modules/actuarial/draftStorage";
import type { TrialInfo } from "../modules/actuarial/types/savedCalculation";
import { fetchAuthMe } from "../services/api";
import { subscribeTrialUpdate } from "../services/trialEvents";
import {
  logoutWithSessionClose,
  startSessionTelemetry,
  stopSessionTelemetry,
} from "../services/sessionTelemetry";
import { ToastProvider } from "../ui/toast";
import { AppHeader } from "./AppHeader";
import { CriticalBanner } from "../notifications/CriticalBanner";

export function AppLayout() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [trial, setTrial] = useState<TrialInfo | null>(null);
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
      startSessionTelemetry();
      fetchAuthMe()
        .then((me) => {
          setIsAdmin(Boolean(me.capabilities?.isAdmin));
          setTrial(me.trial ?? null);
        })
        .catch(() => {
          setIsAdmin(false);
          setTrial(null);
        });
    } catch {
      navigate("/login", { replace: true });
    }
    return () => {
      stopSessionTelemetry();
    };
  }, [navigate]);

  useEffect(() => subscribeTrialUpdate((next) => setTrial(next)), []);

  const handleLogout = () => {
    clearPricingSurveySessionFlags();
    void logoutWithSessionClose().finally(() => {
      clearAllDrafts();
      navigate("/login", { replace: true });
    });
  };

  if (!user) return null;

  const showActuarial = location.pathname === "/dashboard";

  return (
    <ToastProvider>
      <div className="user-app-shell bg-app-light min-h-screen">
        <AppHeader email={user.email} onLogout={handleLogout} isAdmin={isAdmin} trial={trial} />
        {showActuarial ? <CriticalBanner /> : null}
        <div className={showActuarial ? undefined : "hidden"} aria-hidden={!showActuarial}>
          <ActuarialPage />
        </div>
        <Outlet />
      </div>
    </ToastProvider>
  );
}
