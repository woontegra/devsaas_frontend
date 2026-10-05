import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../ui/toast";
import { createAdminUser, fetchAdminTrialConfig } from "../adminApi";
import { fetchTrialConfig } from "../../services/api";
import { displayName, formatAdminDate } from "../format";
import {
  AdminActionBar,
  AdminCard,
  AdminPageHeader,
  RoleBadge,
  StatusBadge,
  TrialBadge,
} from "../components";
import {
  NEW_USER_PLAN_OPTIONS,
  computeSubscriptionEndDate,
  getCachedTrialConfig,
  planLabelNew,
  setCachedTrialConfig,
} from "../subscriptionRules";

type FieldKey = "name" | "email" | "password" | "plan" | "startsAt" | "expiresAt" | "creditBalance";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function initialsFrom(name: string, email: string): string {
  const n = name.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "A";
  }
  return (email.trim()[0] ?? "A").toUpperCase();
}

export function AdminNewUserPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState("USER");
  const [status, setStatus] = useState("ACTIVE");
  const [plan, setPlan] = useState("monthly");
  const [isTrial, setIsTrial] = useState(false);
  const [creditBalance, setCreditBalance] = useState("0");
  const [startsAt, setStartsAt] = useState(todayIso);
  const [expiresAt, setExpiresAt] = useState(() => computeSubscriptionEndDate({
    startsAt: todayIso(),
    plan: "monthly",
    isTrial: false,
  }) ?? todayIso());
  const [expiresManual, setExpiresManual] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const fieldRefs = useRef<Partial<Record<FieldKey, HTMLElement | null>>>({});
  const [, setTrialConfigTick] = useState(0);

  useEffect(() => {
    fetchAdminTrialConfig()
      .then((cfg) => {
        setCachedTrialConfig(cfg);
        setTrialConfigTick((n) => n + 1);
      })
      .catch(() =>
        fetchTrialConfig()
          .then((cfg) => {
            setCachedTrialConfig(cfg);
            setTrialConfigTick((n) => n + 1);
          })
          .catch(() => undefined)
      );
  }, []);

  const trialConfig = getCachedTrialConfig();

  const autoExpires = useMemo(
    () => computeSubscriptionEndDate({ startsAt, plan, isTrial }),
    [startsAt, plan, isTrial]
  );

  useEffect(() => {
    if (expiresManual) return;
    if (autoExpires) setExpiresAt(autoExpires);
  }, [autoExpires, expiresManual]);

  const applyAutoExpires = () => {
    setExpiresManual(false);
    if (autoExpires) setExpiresAt(autoExpires);
  };

  const onStartsChange = (value: string) => {
    setStartsAt(value);
    setExpiresManual(false);
  };

  const onPlanChange = (value: string) => {
    setPlan(value);
    setExpiresManual(false);
  };

  const onTrialChange = (trial: boolean) => {
    setIsTrial(trial);
    setExpiresManual(false);
  };

  const onExpiresChange = (value: string) => {
    setExpiresAt(value);
    setExpiresManual(true);
  };

  const summaryReady = Boolean(name.trim() || email.trim());

  const validate = (): Partial<Record<FieldKey, string>> => {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!name.trim()) next.name = "Ad Soyad alanı zorunludur.";
    if (!email.trim()) next.email = "E-posta alanı zorunludur.";
    else if (!isValidEmail(email)) next.email = "Geçerli bir e-posta adresi girin.";
    if (!password) next.password = "Parola alanı zorunludur.";
    else if (password.length < 8) next.password = "Parola en az 8 karakter olmalı.";
    if (!plan) next.plan = "Plan seçmelisiniz.";
    if (!startsAt) next.startsAt = "Başlangıç tarihi seçmelisiniz.";
    if (!expiresAt) next.expiresAt = "Bitiş tarihi seçmelisiniz.";
    else if (startsAt && expiresAt < startsAt) next.expiresAt = "Bitiş tarihi başlangıçtan önce olamaz.";
    if (plan === "credit") {
      const bal = Number(creditBalance);
      if (!Number.isFinite(bal) || bal < 0) next.creditBalance = "Kredi bakiyesi 0 veya pozitif olmalı.";
    }
    return next;
  };

  const focusFirstError = (errors: Partial<Record<FieldKey, string>>) => {
    const order: FieldKey[] = ["name", "email", "password", "plan", "startsAt", "expiresAt", "creditBalance"];
    for (const key of order) {
      if (!errors[key]) continue;
      const el = fieldRefs.current[key];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        if ("focus" in el && typeof el.focus === "function") el.focus();
      }
      toast.error(errors[key]!, undefined, `nu-val-${key}`);
      break;
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstError(errors);
      return;
    }

    setBusy(true);
    createAdminUser({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      status,
      plan,
      isTrial,
      creditBalance: plan === "credit" ? Math.max(0, Math.floor(Number(creditBalance) || 0)) : 0,
      startsAt: `${startsAt}T00:00:00.000Z`,
      expiresAt: `${expiresAt}T23:59:59.000Z`,
    })
      .then((res) => {
        toast.success("Kullanıcı oluşturuldu.");
        navigate(`/admin/users/${res.item.id}`, { replace: true });
      })
      .catch((err) => {
        const msg = err?.message ?? "Kullanıcı oluşturulamadı.";
        toast.error("İşlem gerçekleştirilemedi.", msg);
      })
      .finally(() => setBusy(false));
  };

  const clearError = (key: FieldKey) => {
    if (!fieldErrors[key]) return;
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const dateHint = (() => {
    if (isTrial) return `Deneme süresi: başlangıç + ${trialConfig.durationDays} gün.`;
    if (plan === "monthly") return "Ücretli aylık: bitiş = başlangıç + 1 ay.";
    if (plan === "yearly") return "Ücretli yıllık: bitiş = başlangıç + 1 yıl.";
    if (plan === "credit") {
      return "Kredi planında süre bazlı entitlement yok; bitiş tarihi idari erişim penceresidir (manuel).";
    }
    return null;
  })();

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Yeni Kullanıcı"
        description="Admin tarafından yeni Aktüerya hesabı oluşturun."
      />

      <div className="admin-new-user-layout">
        <form className="admin-new-user-form-card" onSubmit={onSubmit} noValidate>
          <AdminCard title="Kullanıcı Bilgileri">
            <div className="admin-form-section">
              <h2>Kişisel Bilgiler</h2>
              <div className="admin-form-grid">
                <div className={`admin-field${fieldErrors.name ? " is-invalid" : ""}`}>
                  <label htmlFor="nu-name">Ad Soyad *</label>
                  <input
                    id="nu-name"
                    className="admin-input"
                    value={name}
                    ref={(el) => {
                      fieldRefs.current.name = el;
                    }}
                    onChange={(e) => {
                      setName(e.target.value);
                      clearError("name");
                    }}
                  />
                  {fieldErrors.name ? <div className="admin-field-error">{fieldErrors.name}</div> : null}
                </div>
                <div className={`admin-field${fieldErrors.email ? " is-invalid" : ""}`}>
                  <label htmlFor="nu-email">E-posta *</label>
                  <input
                    id="nu-email"
                    type="email"
                    className="admin-input"
                    value={email}
                    autoComplete="off"
                    ref={(el) => {
                      fieldRefs.current.email = el;
                    }}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError("email");
                    }}
                  />
                  {fieldErrors.email ? <div className="admin-field-error">{fieldErrors.email}</div> : null}
                </div>
              </div>
            </div>

            <div className="admin-form-section">
              <h2>Hesap</h2>
              <div className="admin-form-grid">
                <div className={`admin-field full${fieldErrors.password ? " is-invalid" : ""}`}>
                  <label htmlFor="nu-password">Parola *</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      id="nu-password"
                      type={showPw ? "text" : "password"}
                      className="admin-input"
                      style={{ flex: 1 }}
                      value={password}
                      autoComplete="new-password"
                      ref={(el) => {
                        fieldRefs.current.password = el;
                      }}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearError("password");
                      }}
                    />
                    <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setShowPw((v) => !v)}>
                      {showPw ? "Gizle" : "Göster"}
                    </button>
                  </div>
                  {fieldErrors.password ? <div className="admin-field-error">{fieldErrors.password}</div> : null}
                </div>
                <div className="admin-field">
                  <label htmlFor="nu-role">Rol *</label>
                  <select id="nu-role" className="admin-select" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="USER">Kullanıcı</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="admin-field">
                  <label htmlFor="nu-status">Durum *</label>
                  <select id="nu-status" className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="ACTIVE">Aktif</option>
                    <option value="PASSIVE">Pasif</option>
                    <option value="SUSPENDED">Askıya alınmış</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="admin-form-section">
              <h2>Abonelik</h2>
              <div className="admin-form-grid">
                <div className={`admin-field${fieldErrors.plan ? " is-invalid" : ""}`}>
                  <label htmlFor="nu-plan">Plan *</label>
                  <select
                    id="nu-plan"
                    className="admin-select"
                    value={plan}
                    ref={(el) => {
                      fieldRefs.current.plan = el;
                    }}
                    onChange={(e) => {
                      onPlanChange(e.target.value);
                      clearError("plan");
                    }}
                  >
                    {NEW_USER_PLAN_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.plan ? <div className="admin-field-error">{fieldErrors.plan}</div> : null}
                </div>
                <div className="admin-field">
                  <label htmlFor="nu-trial">Kullanım Türü *</label>
                  <select
                    id="nu-trial"
                    className="admin-select"
                    value={isTrial ? "1" : "0"}
                    onChange={(e) => onTrialChange(e.target.value === "1")}
                  >
                    <option value="0">Ücretli</option>
                    <option value="1">Deneme</option>
                  </select>
                </div>
                {isTrial ? (
                  <>
                    <div className="admin-field">
                      <label>Demo Süresi</label>
                      <div className="admin-muted" style={{ fontSize: 13.5, paddingTop: 6 }}>
                        {trialConfig.durationDays} gün
                      </div>
                    </div>
                    <div className="admin-field">
                      <label>Başlangıç Kredisi</label>
                      <div className="admin-muted" style={{ fontSize: 13.5, paddingTop: 6 }}>
                        {trialConfig.initialCredits}
                      </div>
                    </div>
                  </>
                ) : null}
                <div className={`admin-field${fieldErrors.startsAt ? " is-invalid" : ""}`}>
                  <label htmlFor="nu-start">Başlangıç Tarihi *</label>
                  <input
                    id="nu-start"
                    type="date"
                    className="admin-input"
                    value={startsAt}
                    ref={(el) => {
                      fieldRefs.current.startsAt = el;
                    }}
                    onChange={(e) => {
                      onStartsChange(e.target.value);
                      clearError("startsAt");
                    }}
                  />
                  {fieldErrors.startsAt ? <div className="admin-field-error">{fieldErrors.startsAt}</div> : null}
                </div>
                <div className={`admin-field${fieldErrors.expiresAt ? " is-invalid" : ""}`}>
                  <label htmlFor="nu-end">Bitiş Tarihi *</label>
                  <input
                    id="nu-end"
                    type="date"
                    className="admin-input"
                    value={expiresAt}
                    ref={(el) => {
                      fieldRefs.current.expiresAt = el;
                    }}
                    onChange={(e) => {
                      onExpiresChange(e.target.value);
                      clearError("expiresAt");
                    }}
                  />
                  {fieldErrors.expiresAt ? <div className="admin-field-error">{fieldErrors.expiresAt}</div> : null}
                </div>
                {plan === "credit" ? (
                  <div className={`admin-field${fieldErrors.creditBalance ? " is-invalid" : ""}`}>
                    <label htmlFor="nu-credit">Kredi Bakiyesi</label>
                    <input
                      id="nu-credit"
                      type="number"
                      min={0}
                      className="admin-input"
                      value={creditBalance}
                      ref={(el) => {
                        fieldRefs.current.creditBalance = el;
                      }}
                      onChange={(e) => {
                        setCreditBalance(e.target.value);
                        clearError("creditBalance");
                      }}
                    />
                    {fieldErrors.creditBalance ? (
                      <div className="admin-field-error">{fieldErrors.creditBalance}</div>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {dateHint ? <div className="admin-new-user-date-hint">{dateHint}</div> : null}
              {expiresManual && autoExpires && expiresAt !== autoExpires ? (
                <div className="admin-new-user-date-hint">
                  <span>Bitiş tarihi otomatik değerden farklı (manuel).</span>
                  <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={applyAutoExpires}>
                    Otomatik tarihe dön
                  </button>
                  <span className="admin-muted">Önerilen: {formatAdminDate(`${autoExpires}T12:00:00.000Z`)}</span>
                </div>
              ) : null}
            </div>

            <AdminActionBar>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => navigate("/admin/users")} disabled={busy}>
                Vazgeç
              </button>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>
                {busy ? "Oluşturuluyor…" : "Kullanıcı Oluştur"}
              </button>
            </AdminActionBar>
          </AdminCard>
        </form>

        <aside className="admin-new-user-summary">
          <AdminCard title="Hesap Özeti">
            {!summaryReady ? (
              <div className="admin-new-user-summary-empty">
                Bilgileri girdikçe oluşturulacak hesap burada özetlenecek.
              </div>
            ) : (
              <>
                <div className="admin-new-user-summary-head">
                  <div className="admin-avatar" aria-hidden>
                    {initialsFrom(name, email)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3>{displayName(name.trim() || null)}</h3>
                    <p>{email.trim() || "E-posta girilmedi"}</p>
                    <div className="admin-badge-row" style={{ marginTop: 8 }}>
                      <StatusBadge status={status} />
                      <RoleBadge role={role} />
                      <TrialBadge isTrial={isTrial} />
                    </div>
                  </div>
                </div>
                <div className="admin-dl-grid" style={{ gridTemplateColumns: "1fr" }}>
                  <div className="admin-dl-item">
                    <label>Rol</label>
                    <div>{role === "ADMIN" ? "Admin" : "Kullanıcı"}</div>
                  </div>
                  <div className="admin-dl-item">
                    <label>Durum</label>
                    <div>{status === "ACTIVE" ? "Aktif" : status === "PASSIVE" ? "Pasif" : "Askıda"}</div>
                  </div>
                  <div className="admin-dl-item">
                    <label>Plan</label>
                    <div>{planLabelNew(plan)}</div>
                  </div>
                  <div className="admin-dl-item">
                    <label>Kullanım</label>
                    <div>{isTrial ? "Deneme" : "Ücretli"}</div>
                  </div>
                  {isTrial ? (
                    <>
                      <div className="admin-dl-item">
                        <label>Demo süresi</label>
                        <div>{trialConfig.durationDays} gün</div>
                      </div>
                      <div className="admin-dl-item">
                        <label>Başlangıç kredisi</label>
                        <div>{trialConfig.initialCredits}</div>
                      </div>
                    </>
                  ) : null}
                  <div className="admin-dl-item">
                    <label>Başlangıç</label>
                    <div>{startsAt ? formatAdminDate(`${startsAt}T12:00:00.000Z`) : "—"}</div>
                  </div>
                  <div className="admin-dl-item">
                    <label>Bitiş</label>
                    <div>{expiresAt ? formatAdminDate(`${expiresAt}T12:00:00.000Z`) : "—"}</div>
                  </div>
                  {plan === "credit" ? (
                    <div className="admin-dl-item">
                      <label>Kredi bakiyesi</label>
                      <div>{Math.max(0, Math.floor(Number(creditBalance) || 0))}</div>
                    </div>
                  ) : null}
                </div>
                <div className="admin-new-user-summary-note">
                  Bu hesap oluşturulduğunda kullanıcı seçilen plan ve erişim tarihleriyle sisteme erişebilir.
                </div>
              </>
            )}
          </AdminCard>
        </aside>
      </div>
    </div>
  );
}
