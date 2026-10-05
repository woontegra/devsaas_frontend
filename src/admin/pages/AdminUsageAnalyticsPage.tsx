import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { fetchAdminUsageAnalytics } from "../adminApi";

import { displayName, formatAdminDateTime } from "../format";

import { AdminCard, AdminIcon, AdminPageHeader, ICONS, KpiCard, SparkChart } from "../components";



const PRESET_OPTIONS = (

  <>

    <option value="today">Bugün</option>

    <option value="7d">7 gün</option>

    <option value="30d">30 gün</option>

    <option value="90d">90 gün</option>

  </>

);



export function AdminUsageAnalyticsPage() {

  const [preset, setPreset] = useState("7d");

  const [data, setData] = useState<Awaited<ReturnType<typeof fetchAdminUsageAnalytics>> | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);



  useEffect(() => {

    setLoading(true);

    fetchAdminUsageAnalytics({ preset })

      .then(setData)

      .catch((e) => setError(e?.message ?? "Yüklenemedi"))

      .finally(() => setLoading(false));

  }, [preset]);



  const distMax = useMemo(() => {

    if (!data) return 1;

    const all = [...(data as { distributions: { device: Array<{ count: number }> } }).distributions.device];

    return Math.max(1, ...all.map((x) => x.count));

  }, [data]);



  const presetSelect = (

    <select className="admin-select" value={preset} onChange={(e) => setPreset(e.target.value)}>

      {PRESET_OPTIONS}

    </select>

  );



  if (loading) {

    return (

      <div className="admin-page">

        <AdminPageHeader

          title="Kullanım Analitiği"

          description="Aktif kullanıcı, oturum ve cihaz dağılımlarını izleyin."

          actions={presetSelect}

        />

        <div className="admin-loading">Kullanım analitiği yükleniyor…</div>

      </div>

    );

  }

  if (error) {

    return (

      <div className="admin-page">

        <AdminPageHeader title="Kullanım Analitiği" actions={presetSelect} />

        <div className="admin-error">{error}</div>

      </div>

    );

  }

  if (!data) {

    return (

      <div className="admin-page">

        <AdminPageHeader title="Kullanım Analitiği" actions={presetSelect} />

        <div className="admin-empty">Veri yok.</div>

      </div>

    );

  }



  const d = data as {

    kpis: Record<string, number | string | null>;

    series: {

      activeUsersByDay: Array<{ date: string; count: number }>;

      sessionsByDay: Array<{ date: string; count: number }>;

      hourDistribution: Array<{ hour: number; count: number }>;

    };

    distributions: {

      device: Array<{ label: string; count: number }>;

      browser: Array<{ label: string; count: number }>;

      os: Array<{ label: string; count: number }>;

    };

    topUsers: Array<{

      id: string;

      name: string | null;

      email: string;

      sessions: number;

      activeLabel: string;

      lastLoginAt: string;

      calculations: number;

      city: string;

    }>;

  };



  return (

    <div className="admin-page">

      <AdminPageHeader

        title="Kullanım Analitiği"

        description="Aktif kullanıcı, oturum ve cihaz dağılımlarını izleyin."

        actions={presetSelect}

      />



      <div className="admin-kpi-grid">

        <KpiCard

          label="Aktif Kullanıcı"

          value={d.kpis.activeUsers as number}

          tone="green"

          icon={<AdminIcon path={ICONS.users} />}

        />

        <KpiCard

          label="Toplam Oturum"

          value={d.kpis.totalSessions as number}

          tone="blue"

          icon={<AdminIcon path={ICONS.login} />}

        />

        <KpiCard

          label="Ort. Aktif Süre"

          value={String(d.kpis.averageActiveLabel)}

          tone="teal"

          icon={<AdminIcon path={ICONS.clock} />}

        />

        <KpiCard

          label="Toplam Aktif Süre"

          value={String(d.kpis.totalActiveLabel)}

          tone="navy"

          icon={<AdminIcon path={ICONS.clock} />}

        />

      </div>

      <div className="admin-kpi-grid is-secondary">

        <KpiCard

          label="Yeni Kullanıcı"

          value={d.kpis.newUsers as number}

          tone="cyan"

          icon={<AdminIcon path={ICONS.user} />}

        />

        <KpiCard

          label="Geri Dönen"

          value={d.kpis.returningUsers as number}

          tone="purple"

          icon={<AdminIcon path={ICONS.activity} />}

        />

        <KpiCard

          label="Hesaplama Yapan"

          value={d.kpis.usersWithCalculation as number}

          tone="blue"

          icon={<AdminIcon path={ICONS.calc} />}

        />

        <KpiCard

          label="Hesapsız Çıkan"

          value={d.kpis.usersWithoutCalculation as number}

          tone="orange"

          icon={<AdminIcon path={ICONS.pause} />}

        />

      </div>



      <div className="admin-chart-row">

        <AdminCard title="Günlük aktif kullanıcı">

          <SparkChart data={d.series.activeUsersByDay} />

        </AdminCard>

        <AdminCard title="Günlük oturum">

          <SparkChart data={d.series.sessionsByDay} />

        </AdminCard>

      </div>



      <div className="admin-chart-row">

        {(["device", "browser", "os"] as const).map((key) => (

          <AdminCard

            key={key}

            title={key === "device" ? "Cihaz" : key === "browser" ? "Tarayıcı" : "İşletim Sistemi"}

          >

            {d.distributions[key].length === 0 ? (

              <div className="admin-empty">Veri yok</div>

            ) : (

              d.distributions[key].map((row) => (

                <div key={row.label} className="admin-bar-row">

                  <div className="admin-bar-label">{row.label}</div>

                  <div className="admin-bar-track">

                    <div

                      className="admin-bar-fill"

                      style={{ width: `${(row.count / Math.max(distMax, row.count)) * 100}%` }}

                    />

                  </div>

                  <div className="admin-bar-count">{row.count}</div>

                </div>

              ))

            )}

          </AdminCard>

        ))}

      </div>



      <AdminCard title="En aktif kullanıcılar" flush>

        {!d.topUsers.length ? (

          <div className="admin-empty">Henüz oturum verisi yok.</div>

        ) : (

          <div className="admin-table-wrap">

            <table className="admin-table">

              <thead>

                <tr>

                  <th>Kullanıcı</th>

                  <th>Oturum</th>

                  <th>Aktif Süre</th>

                  <th>Son Giriş</th>

                  <th>Hesaplama</th>

                  <th>Şehir</th>

                </tr>

              </thead>

              <tbody>

                {d.topUsers.map((u) => (

                  <tr key={u.id}>

                    <td>

                      <Link to={`/admin/users/${u.id}`}>{displayName(u.name)}</Link>

                      <div className="admin-muted" style={{ fontSize: 11.5 }}>

                        {u.email}

                      </div>

                    </td>

                    <td>{u.sessions}</td>

                    <td>{u.activeLabel}</td>

                    <td>{formatAdminDateTime(u.lastLoginAt)}</td>

                    <td>{u.calculations}</td>

                    <td>{u.city}</td>

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

