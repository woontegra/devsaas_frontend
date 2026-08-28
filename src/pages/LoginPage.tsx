import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../services/api";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fn = isRegister ? register : login;
    fn({ email, password })
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6">
      <div className="relative w-full max-w-[400px] animate-fade-in">
        <div className="rounded-[12px] border border-[#D9E5E3] bg-white p-6 md:p-8 shadow-[0_4px_16px_rgba(15,95,99,0.08)]">
          <div className="flex flex-col items-center mb-6">
            <div className="w-10 h-10 rounded-[10px] bg-[#EAF4F3] flex items-center justify-center mb-3 ring-1 ring-[#0F5F63]/10">
              <span className="text-[#0F5F63] font-semibold text-[15px]">A</span>
            </div>
            <h1 className="text-[20px] font-semibold text-[#22313F] tracking-[-0.02em]">
              {isRegister ? "Hesap Oluştur" : "Giriş"}
            </h1>
            <p className="text-[12.5px] text-[#6B7280] mt-1">Aktüerya Platformu</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="login-email" className="text-[12.5px] font-medium text-[#22313F]">
                E-posta
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full min-h-[40px] rounded-[10px] border border-[#D9E5E3] bg-white px-3 text-[13px] text-[#22313F] focus:outline-none focus:ring-2 focus:ring-[#0F5F63]/15 focus:border-[#0F5F63]/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="login-password" className="text-[12.5px] font-medium text-[#22313F]">
                Şifre
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isRegister ? 8 : undefined}
                autoComplete={isRegister ? "new-password" : "current-password"}
                className="w-full min-h-[40px] rounded-[10px] border border-[#D9E5E3] bg-white px-3 text-[13px] text-[#22313F] focus:outline-none focus:ring-2 focus:ring-[#0F5F63]/15 focus:border-[#0F5F63]/50"
              />
            </div>
            {error && <p className="text-[12.5px] text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full min-h-[40px] px-4 disabled:opacity-50"
            >
              {loading ? "Bekleyin…" : isRegister ? "Kayıt Ol" : "Giriş Yap"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => {
              setIsRegister((v) => !v);
              setError(null);
            }}
            className="mt-5 text-[12.5px] text-[#6B7280] hover:text-[#0F5F63] transition-colors duration-200 w-full text-center"
          >
            {isRegister ? "Hesabınız var mı? Giriş yapın" : "Hesap oluşturun"}
          </button>
        </div>
      </div>
    </div>
  );
}
