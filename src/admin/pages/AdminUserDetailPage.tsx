import { Link, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../ui/toast";
import {
  adjustAdminUserCredits,
  convertAdminTrialToPaid,
  deactivateAdminUser,
  extendAdminTrial,
  fetchAdminUser,
  patchAdminSubscription,
  patchAdminUser,
  type AdminUserDetail,
} from "../adminApi";
import {
  calcTypeLabel,
  displayName,
  eventLabel,
  formatAdminDate,
  formatAdminDateTime,
  planLabel,
  PLAN_OPTIONS,
} from "../format";
import {
  AdminCard,
  AdminTabs,
  Modal,
  RoleBadge,
  StatusBadge,
  TrialBadge,
} from "../components";
import {
  daysRemainingLabel,
  demoEndReasonLabel,
  demoStatusLabel,
  resolveDemoEndReason,
  validateExtendForm,
} from "../demoAdminActions";
import { computeSubscriptionEndDate } from "../subscriptionRules";

type TabId = "general" | "subscription" | "calculations" | "sessions" | "activity" | "note";

function todayLocalIsoDate(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function AdminUserDetailPage() {
  const { id = "" } = useParams();
  const [search, setSearch] = useSearchParams();
  const toast = useToast();
  const [item, setItem] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<TabId>("general");
  const [creditDraft, setCreditDraft] = useState("0");
  const [extendOpen, setExtendOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [extendDays, setExtendDays] = useState("7");
  const [extendCredits, setExtendCredits] = useState("5");
  const [convertPlan, setConvertPlan] = useState<"monthly" | "yearly">("monthly");
  const [convertStartsAt, setConvertStartsAt] = useState(todayLocalIsoDate);

  const showEdit = search.get("edit") === "1";
  const showSub = search.get("sub") === "1";

  const load = () => {
    if (!id) return;
    setLoading(true);
    fetchAdminUser(id)
      .then((res) => {
        setItem(res.item);
        setCreditDraft(String(res.item.creditBalance ?? 0));
      })
      .catch((e) => setError(e?.message ?? "Kullanıcı yüklenemedi"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (showEdit || showSub) setTab(showSub ? "subscription" : "general");
  }, [showEdit, showSub]);

  const sub = item?.subscriptions?.[0] ?? null;

  const editInitial = useMemo(
    () => ({
      name: item?.name ?? "",
      email: item?.email ?? "",
      role: item?.role ?? "USER",
      status: item?.status ?? "ACTIVE",
      adminNote: item?.adminNote ?? "",
    }),
    [item]
  );

  const initials = useMemo(() => {
    const n = item?.name?.trim();
    if (n) {
      const parts = n.split(/\s+/).filter(Boolean);
      return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "A";
    }
    return (item?.email?.[0] ?? "A").toUpperCase();
  }, [item]);

  const convertExpiresAt = useMemo(
    () =>
      computeSubscriptionEndDate({
        startsAt: convertStartsAt,
        plan: convertPlan,
        isTrial: false,
      }),
    [convertStartsAt, convertPlan]
  );

  const extendAndSave = (days: number) => {
    if (!item || !sub) {
      setSearch({ sub: "1" });
      return;
    }
    const base = new Date(sub.expiresAt);
    const from = Number.isNaN(base.getTime()) ? new Date() : base;
    const next = new Date(Math.max(from.getTime(), Date.now()));
    next.setUTCDate(next.getUTCDate() + days);
    setBusy(true);
    patchAdminSubscription(item.id, {
      plan: sub.plan,
      isTrial: sub.isTrial,
      startsAt: sub.startsAt,
      expiresAt: next.toISOString(),
    })
      .then((res) => {
        setItem(res.item);
        toast.success(`Abonelik +${days === 365 ? "1 yıl" : `${days} gün`} uzatıldı.`);
      })
      .catch((e) => toast.error("İşlem gerçekleştirilemedi.", e?.message))
      .finally(() => setBusy(false));
  };

  if (loading) return <div className="admin-loading">Kullanıcı detayı yükleniyor…</div>;
  if (error) return <div className="admin-error">{error}</div>;
  if (!item) return <div className="admin-empty">Kullanıcı bulunamadı.</div>;

  const lastSession = item.sessions?.[0];
  const trialInitial =
    item.trialCreditsGranted ??
    (sub?.isTrial ? Math.max(item.creditBalance ?? 0, 10) : 0);
  const trialUsed = item.trialCreditsUsed ?? Math.max(0, trialInitial - (item.creditBalance ?? 0));
  const trialRemaining = item.creditBalance ?? 0;
  const trialProgress =
    trialInitial > 0 ? Math.min(100, Math.round((trialUsed / trialInitial) * 100)) : 0;
  const demoReason = resolveDemoEndReason({
    isTrial: Boolean(sub?.isTrial),
    expiresAt: sub?.expiresAt,
    creditBalance: trialRemaining,
  });
  const demoEndedLabel = demoEndReasonLabel(demoReason);
  const isPaidUnlimited =
    Boolean(sub) && !sub!.isTrial && (sub!.plan === "monthly" || sub!.plan === "yearly");

  const addTrialCredits = (delta: number) => {
    setBusy(true);
    adjustAdminUserCredits(item.id, delta)
      .then((res) => {
        setItem(res.item);
        setCreditDraft(String(res.item.creditBalance ?? 0));
        toast.success(`+${delta} kredi eklendi.`);
      })
      .catch((e) => toast.error("İşlem gerçekleştirilemedi.", e?.message))
      .finally(() => setBusy(false));
  };

  const submitExtend = () => {
    const days = Math.floor(Number(extendDays));
    const credits = Math.floor(Number(extendCredits));
    const err = validateExtendForm(days, credits);
    if (err) {
      toast.error(err);
      return;
    }
    setBusy(true);
    extendAdminTrial(item.id, { addedDays: days, addedCredits: credits })
      .then((res) => {
        setItem(res.item);
        setCreditDraft(String(res.item.creditBalance ?? 0));
        setExtendOpen(false);
        toast.success(`Demo uzatıldı (+${days} gün, +${credits} kredi).`);
      })
      .catch((e) => toast.error("Demo uzatılamadı.", e?.message))
      .finally(() => setBusy(false));
  };

  const submitConvert = () => {
    setBusy(true);
    convertAdminTrialToPaid(item.id, { plan: convertPlan, startsAt: convertStartsAt })
      .then((res) => {
        setItem(res.item);
        setCreditDraft(String(res.item.creditBalance ?? 0));
        setConvertOpen(false);
        toast.success(
          convertPlan === "yearly"
            ? "Kullanıcı yıllık pakete başarıyla geçirildi."
            : "Kullanıcı aylık pakete başarıyla geçirildi."
        );
      })
      .catch((e) => toast.error("Dönüşüm yapılamadı.", e?.message))
      .finally(() => setBusy(false));
  };

  return (
    <div className="admin-page">
      <Link to="/admin/users" className="admin-back-link">
        ← Kullanıcı listesi
      </Link>

      <div className="admin-user-hero">
        <div className="admin-user-hero-main">
          <div className="admin-avatar" aria-hidden>
            {initials}
          </div>
          <div>
            <h1>{displayName(item.name)}</h1>
            <div className="admin-user-hero-email">{item.email}</div>
            <div className="admin-badge-row" style={{ marginTop: 10 }}>
              <StatusBadge status={item.status} />
              <RoleBadge role={item.role} />
              {sub ? <TrialBadge isTrial={sub.isTrial} /> : null}
              <span className="admin-badge admin-badge-user">{planLabel(sub?.plan ?? item.plan)}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setSearch({ edit: "1" })}>
            Düzenle
          </button>
        </div>
      </div>

      <div className="admin-summary-grid">
        <div className="admin-summary-card">
          <div className="admin-summary-card-label">Abonelik</div>
          <div className="admin-summary-card-value">{planLabel(sub?.plan ?? item.plan)}</div>
          <div className="admin-summary-card-meta">
            {sub ? (sub.isTrial ? "Deneme" : "Ücretli") : "Plan yok"}
            {typeof item.creditBalance === "number" && (sub?.plan === "credit" || item.plan === "credit")
              ? ` · ${item.creditBalance} kredi`
              : ""}
          </div>
        </div>
        <div className="admin-summary-card">
          <div className="admin-summary-card-label">Lisans / Erişim</div>
          <div className="admin-summary-card-value">{item.status === "ACTIVE" ? "Aktif" : item.status === "PASSIVE" ? "Pasif" : "Askıda"}</div>
          <div className="admin-summary-card-meta">
            Bitiş: {sub?.expiresAt ? formatAdminDateTime(sub.expiresAt) : "—"}
          </div>
        </div>
        <div className="admin-summary-card">
          <div className="admin-summary-card-label">Kullanım</div>
          <div className="admin-summary-card-value">{item.calculationStats?.total ?? 0} hesaplama</div>
          <div className="admin-summary-card-meta">
            Tamamlanan: {item.calculationStats?.completed ?? 0} · Taslak: {item.calculationStats?.draft ?? 0}
          </div>
        </div>
        <div className="admin-summary-card">
          <div className="admin-summary-card-label">Giriş</div>
          <div className="admin-summary-card-value">{item.sessionStats?.totalSessions ?? 0} oturum</div>
          <div className="admin-summary-card-meta">
            Son: {item.lastLoginAt ? formatAdminDateTime(item.lastLoginAt) : "Veri yok"}
          </div>
        </div>
      </div>

      <div className="admin-quick-actions">
        {sub?.isTrial ? (
          <>
            <button
              type="button"
              className="admin-btn admin-btn-teal admin-btn-sm"
              disabled={busy}
              onClick={() => {
                setExtendDays("7");
                setExtendCredits("5");
                setExtendOpen(true);
              }}
            >
              Demo Uzat
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-teal admin-btn-sm"
              disabled={busy}
              onClick={() => {
                setConvertPlan("monthly");
                setConvertStartsAt(todayLocalIsoDate());
                setConvertOpen(true);
              }}
            >
              Profesyonele Çevir
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              disabled={busy}
              onClick={() => addTrialCredits(5)}
            >
              +5 Kredi
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              disabled={busy}
              onClick={() => addTrialCredits(10)}
            >
              +10 Kredi
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              disabled={busy || !sub}
              onClick={() => extendAndSave(7)}
            >
              +7 Gün
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              disabled={busy || !sub}
              onClick={() => extendAndSave(30)}
            >
              +30 Gün
            </button>
          </>
        ) : (
          <>
            <button type="button" className="admin-btn admin-btn-teal admin-btn-sm" disabled={busy || !sub} onClick={() => extendAndSave(7)}>
              +7 Gün
            </button>
            <button type="button" className="admin-btn admin-btn-teal admin-btn-sm" disabled={busy || !sub} onClick={() => extendAndSave(30)}>
              +30 Gün
            </button>
            <button type="button" className="admin-btn admin-btn-teal admin-btn-sm" disabled={busy || !sub} onClick={() => extendAndSave(365)}>
              +1 Yıl
            </button>
          </>
        )}
        <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => { setTab("subscription"); setSearch({ sub: "1" }); }}>
          Aboneliği Yönet
        </button>
        <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setTab("note")}>
          Admin Notu
        </button>
        {(sub?.plan === "credit" || item.plan === "credit") && (
          <button
            type="button"
            className="admin-btn admin-btn-secondary admin-btn-sm"
            disabled={busy}
            onClick={() => {
              const bal = Math.max(0, Math.floor(Number(creditDraft) || 0));
              setBusy(true);
              patchAdminUser(item.id, { creditBalance: bal })
                .then((res) => {
                  setItem(res.item);
                  toast.success("Kredi bakiyesi güncellendi.");
                })
                .catch((e) => toast.error("İşlem gerçekleştirilemedi.", e?.message))
                .finally(() => setBusy(false));
            }}
          >
            Kredi Kaydet
          </button>
        )}
        <button type="button" className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => setConfirmDeactivate(true)}>
          Pasife Al
        </button>
      </div>

      {sub?.isTrial ? (
        <div style={{ marginTop: 12 }}>
          <AdminCard title="Demo Kullanımı">
            <div className="admin-badge-row" style={{ marginBottom: 12 }}>
              <span className="admin-badge admin-badge-user">{demoStatusLabel(demoReason)}</span>
            </div>
            {demoEndedLabel ? (
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--admin-danger, #b91c1c)" }}>
                {demoEndedLabel}
              </p>
            ) : null}
            <div className="admin-dl-grid" style={{ marginBottom: 12 }}>
              <div className="admin-dl-item">
                <label>Başlangıç</label>
                <div>{formatAdminDate(sub.startsAt)}</div>
              </div>
              <div className="admin-dl-item">
                <label>Bitiş</label>
                <div>{formatAdminDate(sub.expiresAt)}</div>
              </div>
              <div className="admin-dl-item">
                <label>Kullanılan</label>
                <div>
                  {trialUsed} / {trialInitial}
                </div>
              </div>
              <div className="admin-dl-item">
                <label>Kalan Kredi</label>
                <div>{trialRemaining}</div>
              </div>
              <div className="admin-dl-item">
                <label>Kalan Süre</label>
                <div>{daysRemainingLabel(sub.expiresAt)}</div>
              </div>
              <div className="admin-dl-item">
                <label>Başlangıç Kredisi</label>
                <div>{trialInitial}</div>
              </div>
            </div>
            <p className="admin-muted" style={{ fontSize: 12.5, marginBottom: 8 }}>
              {trialUsed} / {trialInitial} kullanıldı · Kalan: {trialRemaining}
            </p>
            <div
              role="progressbar"
              aria-valuenow={trialProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{
                height: 8,
                borderRadius: 999,
                background: "var(--admin-border, #e2e8f0)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${trialProgress}%`,
                  height: "100%",
                  background: "var(--admin-teal, #0d9488)",
                  transition: "width 0.2s ease",
                }}
              />
            </div>
          </AdminCard>
        </div>
      ) : null}

      {isPaidUnlimited ? (
        <div style={{ marginTop: 12 }}>
          <AdminCard title="Abonelik">
            <div className="admin-dl-grid">
              <div className="admin-dl-item">
                <label>Paket</label>
                <div>{sub!.plan === "yearly" ? "Yıllık" : "Aylık"}</div>
              </div>
              <div className="admin-dl-item">
                <label>Durum</label>
                <div>{sub!.active ? "Aktif" : "Süresi doldu"}</div>
              </div>
              <div className="admin-dl-item">
                <label>Başlangıç</label>
                <div>{formatAdminDate(sub!.startsAt)}</div>
              </div>
              <div className="admin-dl-item">
                <label>Bitiş</label>
                <div>{formatAdminDate(sub!.expiresAt)}</div>
              </div>
              <div className="admin-dl-item">
                <label>Hesaplama</label>
                <div>Sınırsız hesaplama</div>
              </div>
            </div>
          </AdminCard>
        </div>
      ) : null}

      {(sub?.plan === "credit" || item.plan === "credit") && (
        <div className="admin-toolbar" style={{ marginTop: -6 }}>
          <label className="admin-muted" style={{ fontSize: 12.5 }}>
            Kredi bakiyesi
          </label>
          <input
            className="admin-input"
            style={{ width: 120 }}
            type="number"
            min={0}
            value={creditDraft}
            onChange={(e) => setCreditDraft(e.target.value)}
          />
        </div>
      )}

      <AdminTabs
        value={tab}
        onChange={(id) => setTab(id as TabId)}
        tabs={[
          { id: "general", label: "Genel" },
          { id: "subscription", label: "Abonelik" },
          { id: "calculations", label: "Hesaplamalar" },
          { id: "sessions", label: "Oturumlar" },
          { id: "activity", label: "Aktivite" },
          { id: "note", label: "Admin Notu" },
        ]}
      />

      {tab === "general" ? (
        <AdminCard title="Genel Bilgiler">
          <div className="admin-dl-grid">
            <div className="admin-dl-item">
              <label>Ad Soyad</label>
              <div>{displayName(item.name)}</div>
            </div>
            <div className="admin-dl-item">
              <label>E-posta</label>
              <div>{item.email}</div>
            </div>
            <div className="admin-dl-item">
              <label>Telefon</label>
              <div>{item.phone || "—"}</div>
            </div>
            <div className="admin-dl-item">
              <label>Rol</label>
              <div>
                <RoleBadge role={item.role} />
              </div>
            </div>
            <div className="admin-dl-item">
              <label>Durum</label>
              <div>
                <StatusBadge status={item.status} />
              </div>
            </div>
            <div className="admin-dl-item">
              <label>Plan</label>
              <div>{planLabel(sub?.plan ?? item.plan)}</div>
            </div>
            <div className="admin-dl-item">
              <label>Trial</label>
              <div>{sub ? (sub.isTrial ? "Deneme" : "Ücretli") : "—"}</div>
            </div>
            <div className="admin-dl-item">
              <label>Kayıt Tarihi</label>
              <div>{formatAdminDateTime(item.createdAt)}</div>
            </div>
            <div className="admin-dl-item">
              <label>İlk Giriş</label>
              <div>{item.firstLoginAt ? formatAdminDateTime(item.firstLoginAt) : "Veri yok"}</div>
            </div>
            <div className="admin-dl-item">
              <label>Son Giriş</label>
              <div>{item.lastLoginAt ? formatAdminDateTime(item.lastLoginAt) : "Veri yok"}</div>
            </div>
            <div className="admin-dl-item">
              <label>Son Aktivite</label>
              <div>{item.lastSeenAt ? formatAdminDateTime(item.lastSeenAt) : "Veri yok"}</div>
            </div>
            <div className="admin-dl-item">
              <label>Son Şehir</label>
              <div>{lastSession?.location ?? "Henüz kullanılamıyor"}</div>
            </div>
            <div className="admin-dl-item">
              <label>Cihaz</label>
              <div>
                {[lastSession?.browser, lastSession?.os, lastSession?.clientType].filter(Boolean).join(" · ") || "—"}
              </div>
            </div>
          </div>
        </AdminCard>
      ) : null}

      {tab === "subscription" ? (
        <AdminCard title="Abonelik Bilgileri">
          <div className="admin-dl-grid">
            <div className="admin-dl-item">
              <label>Plan</label>
              <div>{planLabel(sub?.plan ?? item.plan)}</div>
            </div>
            <div className="admin-dl-item">
              <label>Trial</label>
              <div>{sub ? <TrialBadge isTrial={sub.isTrial} /> : "—"}</div>
            </div>
            <div className="admin-dl-item">
              <label>Başlangıç</label>
              <div>{sub?.startsAt ? formatAdminDateTime(sub.startsAt) : "—"}</div>
            </div>
            <div className="admin-dl-item">
              <label>Bitiş</label>
              <div>{sub?.expiresAt ? formatAdminDateTime(sub.expiresAt) : "—"}</div>
            </div>
            <div className="admin-dl-item">
              <label>Kredi bakiyesi</label>
              <div>{item.creditBalance ?? 0}</div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button type="button" className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => setSearch({ sub: "1" })}>
              Aboneliği düzenle
            </button>
          </div>
        </AdminCard>
      ) : null}

      {tab === "calculations" ? (
        <AdminCard title="Hesaplamalar" flush>
          {!item.calculations?.length ? (
            <div className="admin-empty">Henüz hesaplama kaydı bulunmuyor.</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Dosya / Başlık</th>
                    <th>Hesap Türü</th>
                    <th>Durum</th>
                    <th>Oluşturma</th>
                    <th>Son Güncelleme</th>
                    <th>Son Açılma</th>
                  </tr>
                </thead>
                <tbody>
                  {item.calculations.map((c) => (
                    <tr key={c.id}>
                      <td className="admin-cell-primary">{c.displayName || c.title || "—"}</td>
                      <td>{calcTypeLabel(c.calculationType)}</td>
                      <td>{c.status === "DRAFT" ? "Taslak" : c.status === "COMPLETED" ? "Tamamlandı" : c.status}</td>
                      <td>{formatAdminDateTime(c.createdAt)}</td>
                      <td>{formatAdminDateTime(c.updatedAt)}</td>
                      <td>{c.lastOpenedAt ? formatAdminDateTime(c.lastOpenedAt) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
      ) : null}

      {tab === "sessions" ? (
        <AdminCard
          title="Oturumlar"
          subtitle={`Toplam aktif süre: ${item.sessionStats?.totalActiveLabel ?? "—"} · Ort: ${item.sessionStats?.averageActiveLabel ?? "—"}`}
          flush
        >
          {!item.sessions?.length ? (
            <div className="admin-empty">Henüz oturum verisi bulunmuyor.</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Başlangıç</th>
                    <th>Son Aktivite</th>
                    <th>Bitiş</th>
                    <th>Süre</th>
                    <th>Tarayıcı</th>
                    <th>OS</th>
                    <th>İstemci</th>
                    <th>Konum</th>
                  </tr>
                </thead>
                <tbody>
                  {item.sessions.map((s) => (
                    <tr key={s.id}>
                      <td>{formatAdminDateTime(s.startedAt)}</td>
                      <td>{formatAdminDateTime(s.lastSeenAt)}</td>
                      <td>{s.endedAt ? formatAdminDateTime(s.endedAt) : "—"}</td>
                      <td>{s.durationLabel}</td>
                      <td>{s.browser ?? "—"}</td>
                      <td>{s.os ?? "—"}</td>
                      <td>{s.clientType}</td>
                      <td>{s.location ?? "Henüz kullanılamıyor"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
      ) : null}

      {tab === "activity" ? (
        <AdminCard title="Aktivite" flush>
          {!item.activities?.length ? (
            <div className="admin-empty">Henüz aktivite kaydı bulunmuyor.</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Olay</th>
                    <th>Zaman</th>
                  </tr>
                </thead>
                <tbody>
                  {item.activities.map((a) => (
                    <tr key={a.id}>
                      <td>
                        {eventLabel(a.type)}
                        {a.calculationType ? (
                          <div className="admin-cell-secondary">{calcTypeLabel(a.calculationType)}</div>
                        ) : null}
                      </td>
                      <td>{formatAdminDateTime(a.occurredAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
      ) : null}

      {tab === "note" ? (
        <AdminCard title="Admin Notu">
          <p className="admin-muted" style={{ marginTop: 0, fontSize: 12.5 }}>
            Bu not yalnızca admin panelinde görünür.
          </p>
          <AdminNoteEditor
            initial={item.adminNote ?? ""}
            busy={busy}
            onSave={(adminNote) => {
              setBusy(true);
              patchAdminUser(item.id, { adminNote })
                .then((res) => {
                  setItem(res.item);
                  toast.success("Kullanıcı güncellendi.");
                })
                .catch((e) => toast.error("İşlem gerçekleştirilemedi.", e?.message))
                .finally(() => setBusy(false));
            }}
          />
        </AdminCard>
      ) : null}

      {showEdit ? (
        <EditUserModal
          initial={editInitial}
          busy={busy}
          onClose={() => setSearch({})}
          onSave={(body) => {
            setBusy(true);
            patchAdminUser(item.id, body)
              .then((res) => {
                setItem(res.item);
                toast.success("Kullanıcı güncellendi.");
                setSearch({});
              })
              .catch((e) => toast.error("İşlem gerçekleştirilemedi.", e?.message))
              .finally(() => setBusy(false));
          }}
        />
      ) : null}

      {showSub ? (
        <SubscriptionModal
          sub={sub}
          busy={busy}
          onClose={() => setSearch({})}
          onSave={(body) => {
            setBusy(true);
            patchAdminSubscription(item.id, body)
              .then((res) => {
                setItem(res.item);
                toast.success("Abonelik güncellendi.");
                setSearch({});
              })
              .catch((e) => toast.error("İşlem gerçekleştirilemedi.", e?.message))
              .finally(() => setBusy(false));
          }}
        />
      ) : null}

      {confirmDeactivate ? (
        <Modal
          title="Kullanıcıyı pasife al"
          onClose={() => setConfirmDeactivate(false)}
          footer={
            <>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setConfirmDeactivate(false)}>
                Vazgeç
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  deactivateAdminUser(item.id)
                    .then((res) => {
                      setItem(res.item);
                      toast.success("Kullanıcı pasife alındı.");
                      setConfirmDeactivate(false);
                    })
                    .catch((e) => toast.error("İşlem gerçekleştirilemedi.", e?.message))
                    .finally(() => setBusy(false));
                }}
              >
                Pasife al
              </button>
            </>
          }
        >
          <p style={{ margin: 0, fontSize: 13.5, color: "#5f6f81", lineHeight: 1.5 }}>
            Bu kullanıcı pasife alınacak. Kullanıcı Aktüerya&apos;ya erişemeyecek. Devam etmek istiyor musunuz?
          </p>
        </Modal>
      ) : null}

      {extendOpen ? (
        <Modal
          title="Demo Uzatma"
          onClose={() => !busy && setExtendOpen(false)}
          footer={
            <>
              <button type="button" className="admin-btn admin-btn-secondary" disabled={busy} onClick={() => setExtendOpen(false)}>
                Vazgeç
              </button>
              <button type="button" className="admin-btn admin-btn-teal" disabled={busy} onClick={submitExtend}>
                Demo&apos;yu Uzat
              </button>
            </>
          }
        >
          <div className="admin-form-grid" style={{ gap: 12 }}>
            <div className="admin-field">
              <label htmlFor="extend-days">Ek süre (gün)</label>
              <input
                id="extend-days"
                className="admin-input"
                type="number"
                min={0}
                step={1}
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
              />
            </div>
            <div className="admin-field">
              <label htmlFor="extend-credits">Ek kredi</label>
              <input
                id="extend-credits"
                className="admin-input"
                type="number"
                min={0}
                step={1}
                value={extendCredits}
                onChange={(e) => setExtendCredits(e.target.value)}
              />
            </div>
            <p className="admin-muted" style={{ fontSize: 12.5, margin: 0 }}>
              Varsayılan: 7 gün + 5 kredi. Süresi bitmiş demoda ek süre bugünden itibaren hesaplanır.
            </p>
          </div>
        </Modal>
      ) : null}

      {convertOpen && sub?.isTrial ? (
        <Modal
          title="Profesyonele Çevir"
          onClose={() => !busy && setConvertOpen(false)}
          footer={
            <>
              <button type="button" className="admin-btn admin-btn-secondary" disabled={busy} onClick={() => setConvertOpen(false)}>
                Vazgeç
              </button>
              <button type="button" className="admin-btn admin-btn-teal" disabled={busy} onClick={submitConvert}>
                Profesyonele Çevir
              </button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
              <legend style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Paket</legend>
              <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <input
                  type="radio"
                  name="convert-plan"
                  checked={convertPlan === "monthly"}
                  onChange={() => setConvertPlan("monthly")}
                />
                Aylık
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="radio"
                  name="convert-plan"
                  checked={convertPlan === "yearly"}
                  onChange={() => setConvertPlan("yearly")}
                />
                Yıllık
              </label>
            </fieldset>
            <div className="admin-field">
              <label htmlFor="convert-starts">Başlangıç Tarihi</label>
              <input
                id="convert-starts"
                className="admin-input"
                type="date"
                value={convertStartsAt}
                onChange={(e) => setConvertStartsAt(e.target.value)}
              />
            </div>
            <div className="admin-field">
              <label>Bitiş Tarihi</label>
              <div>{convertExpiresAt ? formatAdminDate(`${convertExpiresAt}T12:00:00.000Z`) : "—"}</div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                fontSize: 12.5,
                padding: 12,
                borderRadius: 8,
                background: "var(--admin-surface-2, #f8fafc)",
              }}
            >
              <div>
                <div className="admin-muted" style={{ marginBottom: 4 }}>
                  Mevcut
                </div>
                <div>Demo</div>
                <div>Kalan {trialRemaining} kredi</div>
                <div>Demo bitiş: {formatAdminDate(sub.expiresAt)}</div>
              </div>
              <div>
                <div className="admin-muted" style={{ marginBottom: 4 }}>
                  Yeni
                </div>
                <div>{convertPlan === "yearly" ? "Yıllık" : "Aylık"} Profesyonel Kullanım</div>
                <div>
                  {formatAdminDate(`${convertStartsAt}T12:00:00.000Z`)}
                  {" – "}
                  {convertExpiresAt ? formatAdminDate(`${convertExpiresAt}T12:00:00.000Z`) : "—"}
                </div>
                <div>Sınırsız hesaplama</div>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function AdminNoteEditor({
  initial,
  onSave,
  busy,
}: {
  initial: string;
  onSave: (note: string) => void;
  busy: boolean;
}) {
  const [value, setValue] = useState(initial);
  useEffect(() => setValue(initial), [initial]);
  return (
    <div>
      <textarea className="admin-textarea" value={value} onChange={(e) => setValue(e.target.value)} />
      <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="admin-btn admin-btn-primary admin-btn-sm"
          disabled={busy || value === initial}
          onClick={() => onSave(value)}
        >
          Notu kaydet
        </button>
      </div>
    </div>
  );
}

function EditUserModal({
  initial,
  onSave,
  onClose,
  busy,
}: {
  initial: { name: string; email: string; role: string; status: string; adminNote: string };
  onSave: (body: Record<string, unknown>) => void;
  onClose: () => void;
  busy: boolean;
}) {
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [role, setRole] = useState(initial.role);
  const [status, setStatus] = useState(initial.status);
  const [adminNote, setAdminNote] = useState(initial.adminNote);
  return (
    <Modal
      title="Kullanıcıyı düzenle"
      onClose={onClose}
      large
      footer={
        <>
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
            Vazgeç
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            disabled={busy}
            onClick={() => onSave({ name, email, role, status, adminNote })}
          >
            Kaydet
          </button>
        </>
      }
    >
      <div className="admin-form-grid is-wide">
        <div className="admin-field">
          <label>Ad Soyad</label>
          <input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="admin-field">
          <label>E-posta</label>
          <input className="admin-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
        </div>
        <div className="admin-field">
          <label>Rol</label>
          <select className="admin-select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="USER">Kullanıcı</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div className="admin-field">
          <label>Durum</label>
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ACTIVE">Aktif</option>
            <option value="PASSIVE">Pasif</option>
            <option value="SUSPENDED">Askıya alınmış</option>
          </select>
        </div>
        <div className="admin-field full">
          <label>Admin Notu</label>
          <textarea className="admin-textarea" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

function SubscriptionModal({
  sub,
  onSave,
  onClose,
  busy,
}: {
  sub: AdminUserDetail["subscriptions"][number] | null;
  onSave: (body: Record<string, unknown>) => void;
  onClose: () => void;
  busy: boolean;
}) {
  const [plan, setPlan] = useState(sub?.plan ?? "monthly");
  const [isTrial, setIsTrial] = useState(Boolean(sub?.isTrial));
  const [startsAt, setStartsAt] = useState(sub?.startsAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [expiresAt, setExpiresAt] = useState(
    sub?.expiresAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  );

  const extend = (days: number) => {
    const base = new Date(`${expiresAt}T12:00:00.000Z`);
    const from = Number.isNaN(base.getTime()) ? new Date() : base;
    const next = new Date(Math.max(from.getTime(), Date.now()));
    next.setUTCDate(next.getUTCDate() + days);
    setExpiresAt(next.toISOString().slice(0, 10));
  };

  return (
    <Modal
      title="Aboneliği yönet"
      onClose={onClose}
      large
      footer={
        <>
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
            Vazgeç
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            disabled={busy}
            onClick={() =>
              onSave({
                plan,
                isTrial,
                startsAt: `${startsAt}T00:00:00.000Z`,
                expiresAt: `${expiresAt}T23:59:59.000Z`,
              })
            }
          >
            Kaydet
          </button>
        </>
      }
    >
      <div className="admin-form-grid is-wide">
        <div className="admin-field">
          <label>Plan</label>
          <select className="admin-select" value={plan} onChange={(e) => setPlan(e.target.value)}>
            {PLAN_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-field">
          <label>Trial</label>
          <select className="admin-select" value={isTrial ? "1" : "0"} onChange={(e) => setIsTrial(e.target.value === "1")}>
            <option value="0">Ücretli</option>
            <option value="1">Deneme</option>
          </select>
        </div>
        <div className="admin-field">
          <label>Başlangıç</label>
          <input type="date" className="admin-input" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>
        <div className="admin-field">
          <label>Bitiş</label>
          <input type="date" className="admin-input" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => extend(7)}>
          +7 Gün
        </button>
        <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => extend(30)}>
          +30 Gün
        </button>
        <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => extend(365)}>
          +1 Yıl
        </button>
      </div>
    </Modal>
  );
}
