import { useEffect, useState } from "react";

import { useToast } from "../../ui/toast";

import { fetchAdminPricingSurvey, patchAdminPricingSurveySetting } from "../adminApi";

import { displayName, formatAdminDateTime } from "../format";

import { AdminCard, AdminIcon, AdminPageHeader, ICONS, KpiCard } from "../components";

function StatRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="admin-bar-row">
      <div className="admin-bar-label">{label}</div>
      <div className="admin-bar-count">{value ?? "—"}</div>
    </div>
  );
}

export function AdminPricingSurveyPage() {
  const toast = useToast();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = () => {
    setLoading(true);
    fetchAdminPricingSurvey()
      .then((r) => setData(r as Record<string, unknown>))
      .catch((e) => setError(e?.message ?? "Yüklenemedi"))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);
  const patchSetting = (body: Record<string, unknown>, successMsg: string) => {
    setBusy(true);
    patchAdminPricingSurveySetting(body)
      .then(() => {
        toast.success(successMsg);
        load();
      })
      .catch((err) => toast.error("İşlem gerçekleştirilemedi.", err?.message))
      .finally(() => setBusy(false));
  };
  if (loading && !data) {
    return (
      <div className="admin-page">
        <AdminPageHeader title="Fiyat Anketi" description="Test/trial kullanıcı fiyat önerileri." />
        <div className="admin-loading">Fiyat anketi yükleniyor…</div>
      </div>
    );
  }
  if (error && !data) {
    return (
      <div className="admin-page">
        <AdminPageHeader title="Fiyat Anketi" />
        <div className="admin-error">{error}</div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="admin-page">
        <AdminPageHeader title="Fiyat Anketi" />
        <div className="admin-empty">Veri yok.</div>
      </div>
    );
  }
  const setting = data.setting as { enabled: boolean; audience: string };
  const monthly = data.monthly as Record<string, number | null>;
  const yearly = data.yearly as Record<string, number | null>;
  const intent = data.purchaseIntent as Record<string, number>;
  const items = data.items as Array<Record<string, unknown>>;
  const intentTotal = (intent.YES ?? 0) + (intent.MAYBE ?? 0) + (intent.NO ?? 0);
  const intentMax = Math.max(1, intent.YES ?? 0, intent.MAYBE ?? 0, intent.NO ?? 0);
  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Fiyat Anketi"
        description="Geçici fiyat araştırması. Satışta kapatılabilir; mevcut cevaplar silinmez."
        actions={
          <>
            <select
              className="admin-select"
              value={setting.audience}
              disabled={busy}
              onChange={(e) => patchSetting({ audience: e.target.value }, "Anket ayarı güncellendi.")}
            >
              <option value="TRIAL">Hedef: Trial</option>
              <option value="ALL_NON_PAID">Hedef: Ücretsiz / trial</option>
              <option value="ALL">Hedef: Tüm kullanıcılar</option>
            </select>
            <div className="admin-tabs" role="group" aria-label="Anket durumu">
              <button
                type="button"
                className={`admin-tab${setting.enabled ? " is-active" : ""}`}
                disabled={busy || setting.enabled}
                onClick={() => patchSetting({ enabled: true }, "Anket açıldı.")}
              >
                Açık
              </button>
              <button
                type="button"
                className={`admin-tab${!setting.enabled ? " is-active" : ""}`}
                disabled={busy || !setting.enabled}
                onClick={() => patchSetting({ enabled: false }, "Anket kapatıldı.")}
              >
                Kapalı
              </button>
            </div>
          </>
        }
      />
      <div className="admin-kpi-grid">
        <KpiCard label="Gösterim" value={data.shown as number} tone="cyan" icon={<AdminIcon path={ICONS.chart} />} />
        <KpiCard label="Cevap" value={data.answered as number} tone="blue" icon={<AdminIcon path={ICONS.check} />} />
        <KpiCard
          label="Cevap Oranı"
          value={data.responseRate == null ? "—" : `${data.responseRate}%`}
          tone="teal"
          icon={<AdminIcon path={ICONS.activity} />}
        />
        <KpiCard
          label="Satın Alma Niyeti"
          value={intent.YES ?? 0}
          hint={`Evet · ${intentTotal} toplam (E/B/H)`}
          tone="green"
          icon={<AdminIcon path={ICONS.money} />}
        />
      </div>
      <div className="admin-chart-row">
        <AdminCard title="Aktüerya aylık fiyat önerileri (TL)">
          <StatRow label="Ortalama" value={monthly.average} />
          <StatRow label="Medyan" value={monthly.median} />
          <StatRow label="Min" value={monthly.min} />
          <StatRow label="Max" value={monthly.max} />
        </AdminCard>
        <AdminCard title="Aktüerya yıllık fiyat önerileri (TL)">
          <StatRow label="Ortalama" value={yearly.average} />
          <StatRow label="Medyan" value={yearly.median} />
          <StatRow label="Min" value={yearly.min} />
          <StatRow label="Max" value={yearly.max} />
        </AdminCard>
      </div>
      <AdminCard title="Satın alma niyeti dağılımı">
        {intentTotal === 0 ? (
          <div className="admin-empty">Henüz niyet cevabı yok.</div>
        ) : (
          (["YES", "MAYBE", "NO"] as const).map((key) => {
            const count = intent[key] ?? 0;
            const label = key === "YES" ? "Evet" : key === "MAYBE" ? "Belki" : "Hayır";
            return (
              <div key={key} className="admin-bar-row">
                <div className="admin-bar-label">{label}</div>
                <div className="admin-bar-track">
                  <div className="admin-bar-fill" style={{ width: `${(count / intentMax) * 100}%` }} />
                </div>
                <div className="admin-bar-count">{count}</div>
              </div>
            );
          })
        )}
      </AdminCard>
      <AdminCard title="Cevaplar" flush>
        {!items.length ? (
          <div className="admin-empty">Henüz cevap yok.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Kullanıcı</th>
                  <th>Aktüerya Aylık Fiyat Önerisi</th>
                  <th>Aktüerya Yıllık Fiyat Önerisi</th>
                  <th>Satın Alma Niyeti</th>
                  <th>Cevap Tarihi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={String(row.id)}>
                    <td>
                      {displayName(row.userName as string | null)}
                      <div className="admin-muted" style={{ fontSize: 11.5 }}>
                        {String(row.userEmail)}
                      </div>
                    </td>
                    <td>{String(row.monthlyPriceSuggested)} TL</td>
                    <td>{String(row.yearlyPriceSuggested)} TL</td>
                    <td>
                      {row.purchaseIntent === "YES"
                        ? "Evet"
                        : row.purchaseIntent === "MAYBE"
                          ? "Belki"
                          : row.purchaseIntent === "NO"
                            ? "Hayır"
                            : String(row.purchaseIntent)}
                    </td>
                    <td>{formatAdminDateTime(row.submittedAt as string)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
