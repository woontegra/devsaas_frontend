import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function ProfilePage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    try {
      const user = JSON.parse(raw) as { email?: string };
      setEmail(user.email ?? "");
    } catch {
      setEmail("");
    }
  }, []);

  return (
    <div className="min-h-[calc(100vh-58px)] bg-[#F5F7FA] pb-5">
      <div className="app-workspace dashboard-workspace py-3 sm:py-4">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="mb-2 text-[13px] font-medium text-[#66727F] hover:text-[#243746] min-h-[36px]"
        >
          ← Geri
        </button>
        <h1 className="ui-page-title">Profil / Hesap</h1>
        <p className="ui-page-subtitle mt-1">Hesap bilgileriniz</p>

        <div className="ui-panel-mock mt-4 max-w-xl">
          <div className="ui-panel-mock-body space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-brand-muted">
                E-posta
              </p>
              <p className="mt-1 text-[14px] font-medium text-brand-text break-all">
                {email || "—"}
              </p>
            </div>
            <p className="text-[12.5px] text-brand-muted">
              Hesap ayarları ve abonelik yönetimi bu ekranda genişletilecektir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
