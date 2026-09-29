import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, requestPasswordReset } from "../services/api";
import wordmark from "../assets/brand/logo-horizontal.png";

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [view, setView] = useState<"login" | "forgot">("login");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    login({ email, password })
      .then((res) => {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        navigate("/dashboard", { replace: true });
      })
      .catch((err) => {
        setError(err.response?.data?.error ?? "İşlem başarısız");
      })
      .finally(() => setLoading(false));
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!isEmail(email)) {
      setError("Geçerli bir e-posta adresi girin.");
      return;
    }
    setLoading(true);
    requestPasswordReset(email.trim())
      .then((res) => setInfo(res.message))
      .catch((err) => {
        const data = err.response?.data as { message?: string; error?: string } | undefined;
        setError(data?.message || data?.error || "İstek başarısız");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6">
      <div className="relative w-full max-w-[400px] animate-fade-in">
        <div className="rounded-[14px] border border-brand-border bg-white p-6 md:p-8 shadow-app-md">
          <div className="flex flex-col items-center mb-7">
            <img
              src={wordmark}
              alt="Aktüerya"
              width={240}
              height={67}
              className="mb-4 h-auto w-[240px] max-w-full object-contain"
            />
            <h1 className="text-[22px] font-semibold text-brand-text tracking-[-0.02em]">
              {view === "forgot" ? "Şifrenizi Sıfırlayın" : "Giriş"}
            </h1>
            <p className="text-[13px] text-brand-muted mt-1 text-center">
              {view === "forgot"
                ? "Hesabınıza kayıtlı e-posta adresini girin. Şifre sıfırlama bağlantısını size gönderelim."
                : "Aktüerya Platformu"}
            </p>
          </div>
          {view === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="login-email" className="text-[13px] font-semibold text-brand-text">
                  E-posta
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="ui-input"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="login-password" className="text-[13px] font-semibold text-brand-text">
                  Şifre
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="ui-input"
                />
              </div>
              {error && <p className="text-[12.5px] text-red-600">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full min-h-[42px] px-4 disabled:opacity-50">
                {loading ? "Bekleyin…" : "Giriş Yap"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="reset-email" className="text-[13px] font-semibold text-brand-text">
                  E-posta
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="ui-input"
                />
              </div>
              {error && <p className="text-[12.5px] text-red-600">{error}</p>}
              {info && <p className="text-[12.5px] text-brand-text">{info}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full min-h-[42px] px-4 disabled:opacity-50">
                {loading ? "Bekleyin…" : "Şifre Sıfırlama Bağlantısı Gönder"}
              </button>
            </form>
          )}
          <button
            type="button"
            onClick={() => {
              setView((current) => (current === "login" ? "forgot" : "login"));
              setError(null);
              setInfo(null);
            }}
            className="mt-5 text-[13px] text-brand-muted hover:text-brand-primary transition-colors duration-200 w-full text-center font-medium"
          >
            {view === "forgot" ? "Giriş ekranına dön" : "Şifremi unuttum"}
          </button>
        </div>
      </div>
    </div>
  );
}
