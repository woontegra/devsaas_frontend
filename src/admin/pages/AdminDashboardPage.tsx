import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdminDashboardSummary, type AdminDashboardSummary } from "../adminApi";
import { calcTypeLabel, displayName, eventLabel, formatAdminDateTime, planLabel } from "../format";
import {
  AdminCard,
  AdminIcon,
  AdminPageHeader,
  ICONS,
  KpiCard,
  SparkChart,
  StatusBadge,
} from "../components";

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchAdminDashboardSummary()
      .then((res) => {
        setData(res);
        setUpdatedAt(new Date());
        setError(null);
      })
      .catch((e) => setError(e?.message ?? "Özet yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) return <div className="admin-loading">Kontrol merkezi yükleniyor…</div>;
  if (error && !data) return <div className="admin-error">{error}</div>;
  if (!data) return <div className="admin-empty">Veri bulunamadı.</div>;

  const typeTotal = data.calculations.byType.reduce((s, x) => s + x.count, 0) || 1;

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Kontrol Merkezi"
        description="Platformdaki kullanıcı, kullanım, hesaplama ve abonelik hareketlerini tek ekrandan izleyin."
        actions={
          <>
            <span className="admin-muted" style={{ fontSize: 12.5 }}>
              {updatedAt ? `Son güncelleme: ${formatAdminDateTime(updatedAt.toISOString())}` : null}
            </span>
            <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={load} disabled={loading}>
              Yenile
            </button>
          </>
        }
      />

      <div className="admin-kpi-grid">
        <KpiCard
          label="Toplam Kullanıcı"
          value={data.users.total}
          hint="Kayıtlı hesaplar"
          tone="cyan"
          icon={<AdminIcon path={ICONS.users} />}
        />
        <KpiCard
          label="Bugün Aktif"
          value={data.users.activeToday ?? data.sessions.loginsToday}
          hint="Bugün oturum açan"
          tone="green"
          icon={<AdminIcon path={ICONS.activity} />}
        />
        <KpiCard
          label="Şu Anda Aktif"
          value={data.sessions.activeNow}
          hint="Son 15 dk heartbeat"
          tone="blue"
          icon={<AdminIcon path={ICONS.pulse} />}
        />
        <KpiCard
          label="Ücretli"
          value={data.users.paid}
          hint="Aktif ücretli plan"
          tone="teal"
          icon={<AdminIcon path={ICONS.money} />}
        />
      </div>

      <div className="admin-kpi-grid is-secondary">
        <KpiCard label="Trial" value={data.users.trial} hint="Deneme hesapları" tone="orange" icon={<AdminIcon path={ICONS.trial} />} />
        <KpiCard
          label="Bugün Hesaplama"
          value={data.calculations.createdToday}
          tone="blue"
          icon={<AdminIcon path={ICONS.calc} />}
        />
        <KpiCard
          label="Son 7 Gün Hesaplama"
          value={data.calculations.createdLast7Days ?? 0}
          tone="navy"
          icon={<AdminIcon path={ICONS.chart} />}
        />
        <KpiCard
          label="Tamamlanan"
          value={data.calculations.completed}
          tone="green"
          icon={<AdminIcon path={ICONS.check} />}
        />
        <KpiCard
          label="Rapor"
          value={data.calculations.reportsToday ?? 0}
          hint="Bugün"
          tone="purple"
          icon={<AdminIcon path={ICONS.report} />}
        />
        <KpiCard
          label="Ort. Aktif Süre"
          value={data.sessions.averageActiveLabel}
          tone="teal"
          icon={<AdminIcon path={ICONS.clock} />}
        />
      </div>

      {data.sessions.trackingSince ? (
        <p className="admin-session-note">
          Session takibi {formatAdminDateTime(data.sessions.trackingSince)} itibarıyla
        </p>
      ) : (
        <p className="admin-session-note">Henüz oturum kaydı bulunmuyor.</p>
      )}

      {data.charts ? (
        <div className="admin-grid-2-1">
          <AdminCard title="7 günlük aktif kullanıcı">
            <SparkChart data={data.charts.activeUsersLast7Days} />
          </AdminCard>
          <AdminCard title="Hesap Türü Dağılımı">
            {data.calculations.byType.every((x) => x.count === 0) ? (
              <div className="admin-empty">Henüz hesaplama kaydı bulunmuyor.</div>
            ) : (
              data.calculations.byType.map((row) => (
                <div key={row.calculationType} className="admin-bar-row">
                  <div className="admin-bar-label">{calcTypeLabel(row.calculationType)}</div>
                  <div className="admin-bar-track">
                    <div className="admin-bar-fill" style={{ width: `${Math.max(0, (row.count / typeTotal) * 100)}%` }} />
                  </div>
                  <div className="admin-bar-count">{row.count}</div>
                </div>
              ))
            )}
          </AdminCard>
        </div>
      ) : null}

      <div className="admin-grid-2">
        {data.charts ? (
          <AdminCard title="7 günlük hesaplama">
            <SparkChart data={data.charts.calculationsLast7Days} />
          </AdminCard>
        ) : null}
        <AdminCard title="Şehir Dağılımı">
          {!data.charts?.cities?.length ? (
            <div className="admin-empty">Henüz coğrafi veri yok.</div>
          ) : (
            data.charts.cities.map((row) => {
              const max = Math.max(1, ...data.charts!.cities.map((c) => c.count));
              return (
                <div key={row.label} className="admin-bar-row">
                  <div className="admin-bar-label">{row.label}</div>
                  <div className="admin-bar-track">
                    <div className="admin-bar-fill" style={{ width: `${(row.count / max) * 100}%` }} />
                  </div>
                  <div className="admin-bar-count">{row.count}</div>
                </div>
              );
            })
          )}
        </AdminCard>
      </div>

      <div className="admin-grid-2">
        <AdminCard title="Son Aktiviteler" flush>
          {data.recentActivities.length === 0 ? (
            <div className="admin-empty">Henüz aktivite kaydı bulunmuyor.</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Kullanıcı</th>
                    <th>Olay</th>
                    <th>Zaman</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentActivities.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="admin-cell-primary">{displayName(a.userName)}</div>
                        <div className="admin-cell-secondary">{a.userEmail ?? "—"}</div>
                      </td>
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

        <AdminCard title="Son Kullanıcılar" flush>
          {data.recentUsers.length === 0 ? (
            <div className="admin-empty">Henüz kullanıcı bulunmuyor.</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ad Soyad</th>
                    <th>E-posta</th>
                    <th>Plan</th>
                    <th>Durum</th>
                    <th>Kayıt</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.recentUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="admin-cell-primary">{displayName(u.name)}</td>
                      <td>{u.email}</td>
                      <td>{planLabel(u.plan)}</td>
                      <td>
                        <StatusBadge status={u.status} />
                      </td>
                      <td>{formatAdminDateTime(u.createdAt)}</td>
                      <td>
                        <Link to={`/admin/users/${u.id}`} className="admin-btn admin-btn-ghost admin-btn-sm">
                          Detay
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
