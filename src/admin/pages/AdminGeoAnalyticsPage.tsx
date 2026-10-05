import { useEffect, useState } from "react";

import { fetchAdminGeoAnalytics } from "../adminApi";

import { AdminCard, AdminIcon, AdminPageHeader, ICONS, KpiCard } from "../components";



export function AdminGeoAnalyticsPage() {

  const [preset, setPreset] = useState("30d");

  const [data, setData] = useState<{

    countries: Array<{ label: string; sessions: number; users: number; calculations: number }>;

    cities: Array<{ label: string; sessions: number; users: number; calculations: number }>;

  } | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);



  useEffect(() => {

    setLoading(true);

    fetchAdminGeoAnalytics({ preset })

      .then((r) => setData(r as typeof data))

      .catch((e) => setError(e?.message ?? "Yüklenemedi"))

      .finally(() => setLoading(false));

  }, [preset]);



  const presetSelect = (

    <select className="admin-select" value={preset} onChange={(e) => setPreset(e.target.value)}>

      <option value="7d">7 gün</option>

      <option value="30d">30 gün</option>

      <option value="90d">90 gün</option>

    </select>

  );



  if (loading) {

    return (

      <div className="admin-page">

        <AdminPageHeader

          title="Coğrafi Kullanım"

          description="IP tabanlı yaklaşık ülke/şehir dağılımı. Konum izni istenmez."

          actions={presetSelect}

        />

        <div className="admin-loading">Coğrafi analitik yükleniyor…</div>

      </div>

    );

  }

  if (error) {

    return (

      <div className="admin-page">

        <AdminPageHeader title="Coğrafi Kullanım" actions={presetSelect} />

        <div className="admin-error">{error}</div>

      </div>

    );

  }

  if (!data) {

    return (

      <div className="admin-page">

        <AdminPageHeader title="Coğrafi Kullanım" actions={presetSelect} />

        <div className="admin-empty">Veri yok.</div>

      </div>

    );

  }



  const cityMax = Math.max(1, ...data.cities.map((c) => c.sessions));



  return (

    <div className="admin-page">

      <AdminPageHeader

        title="Coğrafi Kullanım"

        description="IP tabanlı yaklaşık ülke/şehir dağılımı. Konum izni istenmez."

        actions={presetSelect}

      />



      <div className="admin-kpi-grid">

        <KpiCard label="Ülke sayısı" value={data.countries.length} tone="cyan" icon={<AdminIcon path={ICONS.map} />} />

        <KpiCard label="Şehir sayısı" value={data.cities.length} tone="blue" icon={<AdminIcon path={ICONS.map} />} />

        <KpiCard

          label="Bilinmeyen şehir"

          value={data.cities.find((c) => c.label === "Bilinmiyor")?.sessions ?? 0}

          hint="Geo provider yoksa normal"

          tone="orange"

          icon={<AdminIcon path={ICONS.map} />}

        />

        <KpiCard

          label="Toplam oturum (şehir)"

          value={data.cities.reduce((s, c) => s + c.sessions, 0)}

          tone="teal"

          icon={<AdminIcon path={ICONS.login} />}

        />

      </div>



      <div className="admin-chart-row">

        <AdminCard title="Ülke dağılımı">

          {!data.countries.length ? (

            <div className="admin-empty">Henüz coğrafi veri yok.</div>

          ) : (

            data.countries.map((row) => (

              <div key={row.label} className="admin-bar-row">

                <div className="admin-bar-label">{row.label}</div>

                <div className="admin-bar-track">

                  <div

                    className="admin-bar-fill"

                    style={{ width: `${(row.sessions / Math.max(1, data.countries[0]?.sessions ?? 1)) * 100}%` }}

                  />

                </div>

                <div className="admin-bar-count">

                  {row.sessions} oturum · {row.users} kullanıcı

                </div>

              </div>

            ))

          )}

        </AdminCard>

        <AdminCard title="Şehir dağılımı" flush>

          {!data.cities.length ? (

            <div className="admin-empty">Henüz şehir verisi yok.</div>

          ) : (

            <div className="admin-table-wrap">

              <table className="admin-table">

                <thead>

                  <tr>

                    <th>Şehir</th>

                    <th>Oturum</th>

                    <th>Kullanıcı</th>

                    <th>Hesaplama</th>

                  </tr>

                </thead>

                <tbody>

                  {data.cities.map((row) => (

                    <tr key={row.label}>

                      <td>

                        {row.label}

                        <div className="admin-bar-track" style={{ marginTop: 4, maxWidth: 160 }}>

                          <div className="admin-bar-fill" style={{ width: `${(row.sessions / cityMax) * 100}%` }} />

                        </div>

                      </td>

                      <td>{row.sessions}</td>

                      <td>{row.users}</td>

                      <td>{row.calculations}</td>

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

