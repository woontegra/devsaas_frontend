import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { confirmPasswordReset } from "../services/api";
import wordmark from "../assets/brand/logo-horizontal.png";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    setLoading(true);
    confirmPasswordReset(token, password)
      .then(() => {
        setDone(true);
        window.setTimeout(() => navigate("/login", { replace: true }), 1200);
      })
      .catch((err) => {
        const data = err.response?.data as { message?: string; error?: string } | undefined;
        setError(data?.message || data?.error || "Şifre güncellenemedi.");
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
            <h1 className="text-[22px] font-semibold text-brand-text tracking-[-0.02em]">Şifrenizi Sıfırlayın</h1>
          </div>
          {done ? (
            <p className="text-center text-[13px] text-brand-text">Şifreniz güncellendi.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="new-password" className="text-[13px] font-semibold text-brand-text">
                  Yeni Şifre
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="ui-input"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="confirm-password" className="text-[13px] font-semibold text-brand-text">
                  Yeni Şifre Tekrar
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="ui-input"
                />
              </div>
              {error && <p className="text-[12.5px] text-red-600">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full min-h-[42px] px-4 disabled:opacity-50">
                {loading ? "Bekleyin…" : "Şifreyi Güncelle"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
