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
    <>
      <header className="bg-white border-b border-app-border sticky top-0 z-30 shadow-app-card">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <h1 className="text-[15px] font-semibold text-app-primary">Aktüerya Platformu</h1>
          <div className="flex items-center gap-3">
            <span className="text-[15px] text-gray-600 truncate max-w-[140px]">{user.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[44px] px-3 py-2 text-[15px] text-gray-600 hover:text-app-primary transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <ActuarialPage />
    </>
  );
}
