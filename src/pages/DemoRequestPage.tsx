import { useState } from "react";
import { Link } from "react-router-dom";
import { requestDemoAccount, type ApiClientError } from "../services/api";
import wordmark from "../assets/brand/logo-horizontal.png";

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function DemoRequestPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!isEmail(email)) {
      setError("Geçerli bir e-posta adresi girin.");
      return;
    }
    if (!phone.trim()) {
      setError("Telefon numarası zorunludur.");
      return;
    }
    if (password.length < 8) {
      setError("Parola en az 8 karakter olmalı.");
      return;
    }
    setLoading(true);
    requestDemoAccount({
      email: email.trim(),
      phone: phone.trim(),
      password,
      name: name.trim() || undefined,
    })
      .then((res) => setSuccess(res.message))
      .catch((err: ApiClientError) => {
        setError(err.message ?? "İşlem başarısız");
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
            <h1 className="text-[22px] font-semibold text-brand-text tracking-[-0.02em]">Deneme Hesabı</h1>
            <p className="text-[13px] text-brand-muted mt-1 text-center">
              Ücretsiz deneme hesabı oluşturun ve platformu keşfedin.
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <p className="text-[13px] text-brand-text leading-relaxed">{success}</p>
              <Link to="/login" className="btn-primary w-full min-h-[42px] px-4 inline-flex items-center justify-center">
                Giriş Yap
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="demo-name" className="text-[13px] font-semibold text-brand-text">
                  Ad Soyad
                </label>
                <input
                  id="demo-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="ui-input"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="demo-email" className="text-[13px] font-semibold text-brand-text">
                  E-posta *
                </label>
                <input
                  id="demo-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="ui-input"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="demo-phone" className="text-[13px] font-semibold text-brand-text">
                  Telefon *
                </label>
                <input
                  id="demo-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoComplete="tel"
                  placeholder="05XX XXX XX XX"
                  className="ui-input"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="demo-password" className="text-[13px] font-semibold text-brand-text">
                  Parola *
                </label>
                <input
                  id="demo-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="ui-input"
                />
              </div>
              {error && <p className="text-[12.5px] text-red-600">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full min-h-[42px] px-4 disabled:opacity-50">
                {loading ? "Bekleyin…" : "Deneme Hesabı Oluştur"}
              </button>
            </form>
          )}

          <Link
            to="/login"
            className="mt-5 text-[13px] text-brand-muted hover:text-brand-primary transition-colors duration-200 w-full text-center font-medium block"
          >
            Giriş ekranına dön
          </Link>
        </div>
      </div>
    </div>
  );
}
