import { useEffect, useState } from "react";

import { fetchAdminCalculationAnalytics } from "../adminApi";

import { calcTypeLabel } from "../format";

import { AdminCard, AdminIcon, AdminPageHeader, ICONS, KpiCard, SparkChart } from "../components";



const PRESET_OPTIONS = (

  <>

    <option value="today">Bugün</option>

    <option value="7d">7 gün</option>

    <option value="30d">30 gün</option>

    <option value="90d">90 gün</option>

  </>

);



export function AdminCalculationAnalyticsPage() {

  const [preset, setPreset] = useState("30d");

  const [data, setData] = useState<Record<string, unknown> | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);



  useEffect(() => {

    setLoading(true);

    fetchAdminCalculationAnalytics({ preset })

      .then((r) => setData(r as Record<string, unknown>))

      .catch((e) => setError(e?.message ?? "Yüklenemedi"))

      .finally(() => setLoading(false));

  }, [preset]);



  const presetSelect = (

    <select className="admin-select" value={preset} onChange={(e) => setPreset(e.target.value)}>

      {PRESET_OPTIONS}

    </select>

  );



  if (loading) {

    return (

      <div className="admin-page">

        <AdminPageHeader

          title="Hesaplama Analitiği"

          description="Dört hesap türünde oluşturma, tamamlama ve adım davranışları."

          actions={presetSelect}

        />

        <div className="admin-loading">Hesaplama analitiği yükleniyor…</div>

      </div>

    );

  }

  if (error) {

    return (

      <div className="admin-page">

        <AdminPageHeader title="Hesaplama Analitiği" actions={presetSelect} />

        <div className="admin-error">{error}</div>

      </div>

    );

  }

  if (!data) {

    return (

      <div className="admin-page">

        <AdminPageHeader title="Hesaplama Analitiği" actions={presetSelect} />

        <div className="admin-empty">Veri yok.</div>

      </div>

    );

  }



  const totals = data.totals as Record<string, number>;

  const byType = data.byType as Array<{

    calculationType: string;

    created: number;

    completed: number;

    draft: number;

    uniqueUsers: number;

    completionRate: number;

  }>;

  const trend = data.trendByDay as Array<{ date: string; count: number }>;

  const steps = data.steps as {

    mostOpened: Array<{ key: string; count: number }>;

    mostValidationFailed: Array<{ key: string; count: number }>;

  };



  return (

    <div className="admin-page">

      <AdminPageHeader

        title="Hesaplama Analitiği"

        description="Dört hesap türünde oluşturma, tamamlama ve adım davranışları."

        actions={presetSelect}

      />



      <div className="admin-kpi-grid">

        <KpiCard label="Oluşturulan" value={totals.created ?? 0} tone="cyan" icon={<AdminIcon path={ICONS.calc} />} />

        <KpiCard label="Tamamlanan" value={totals.completed ?? 0} tone="green" icon={<AdminIcon path={ICONS.check} />} />

        <KpiCard label="Taslak" value={totals.draft ?? 0} tone="orange" icon={<AdminIcon path={ICONS.report} />} />

        <KpiCard

          label="Tamamlanma %"

          value={`${totals.completionRate ?? 0}%`}

          tone="blue"

          icon={<AdminIcon path={ICONS.chart} />}

        />

      </div>

      <div className="admin-kpi-grid is-secondary">

        <KpiCard label="Silinen" value={totals.deleted ?? 0} tone="red" icon={<AdminIcon path={ICONS.pause} />} />

        <KpiCard label="Rapor" value={totals.reports ?? 0} tone="purple" icon={<AdminIcon path={ICONS.report} />} />

        <KpiCard

          label="Benzersiz Kullanıcı"

          value={totals.uniqueUsers ?? 0}

          tone="teal"

          icon={<AdminIcon path={ICONS.users} />}

        />

      </div>



      <div className="admin-chart-row">

        <AdminCard title="Tür dağılımı">

          {byType.map((row) => (

            <div key={row.calculationType} className="admin-bar-row">

              <div className="admin-bar-label">{calcTypeLabel(row.calculationType)}</div>

              <div className="admin-bar-track">

                <div

                  className="admin-bar-fill"

                  style={{

                    width: `${Math.max(0, (row.created / Math.max(1, totals.created ?? 1)) * 100)}%`,

                  }}

                />

              </div>

              <div className="admin-bar-count">

                {row.created} · %{row.completionRate}

              </div>

            </div>

          ))}

        </AdminCard>

        <AdminCard title="Günlük trend">

          <SparkChart data={trend} />

        </AdminCard>

      </div>



      <div className="admin-chart-row">

        <AdminCard title="En çok açılan adımlar">

          {!steps.mostOpened.length ? (

            <div className="admin-empty">Henüz adım event’i yok.</div>

          ) : (

            steps.mostOpened.map((s) => (

              <div key={s.key} className="admin-bar-row">

                <div className="admin-bar-label">{s.key}</div>

                <div className="admin-bar-count">{s.count}</div>

              </div>

            ))

          )}

        </AdminCard>

        <AdminCard title="Validation hatalı adımlar">

          {!steps.mostValidationFailed.length ? (

            <div className="admin-empty">Henüz validation event’i yok.</div>

          ) : (

            steps.mostValidationFailed.map((s) => (

              <div key={s.key} className="admin-bar-row">

                <div className="admin-bar-label">{s.key}</div>

                <div className="admin-bar-count">{s.count}</div>

              </div>

            ))

          )}

        </AdminCard>

      </div>

    </div>

  );

}

