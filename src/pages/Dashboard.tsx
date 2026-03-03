import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ActuarialPage } from "../modules/actuarial/ActuarialPage";

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
    navigate("/login", { replace: true });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-base font-semibold text-slate-800">Actuarial SaaS</h1>
          <div className="flex items-center gap-2">
            <span className="text-base text-slate-600 truncate max-w-[140px]">{user.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[44px] px-3 py-2 text-base text-slate-600 hover:text-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <ActuarialPage />
    </div>
  );
}
