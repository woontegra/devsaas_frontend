import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { fetchAdminSessionAnalytics } from "../adminApi";

import { displayName, formatAdminDateTime } from "../format";

import { AdminCard, AdminPageHeader, AdminToolbar } from "../components";



const PRESET_OPTIONS = (

  <>

    <option value="today">Bugün</option>

    <option value="7d">7 gün</option>

    <option value="30d">30 gün</option>

    <option value="90d">90 gün</option>

  </>

);



export function AdminSessionsAnalyticsPage() {

  const [preset, setPreset] = useState("30d");

  const [activeOnly, setActiveOnly] = useState(false);

  const [page, setPage] = useState(1);

  const [data, setData] = useState<{

    total: number;

    page: number;

    pageSize: number;

    items: Array<Record<string, unknown>>;

  } | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);



  useEffect(() => {

    setLoading(true);

    fetchAdminSessionAnalytics({ preset, page, pageSize: 20, activeOnly })

      .then((r) => setData(r as typeof data))

      .catch((e) => setError(e?.message ?? "Yüklenemedi"))

      .finally(() => setLoading(false));

  }, [preset, page, activeOnly]);



  const maxPage = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const from = data && data.total === 0 ? 0 : data ? (data.page - 1) * data.pageSize + 1 : 0;

  const to = data ? Math.min(data.page * data.pageSize, data.total) : 0;



  return (

    <div className="admin-page">

      <AdminPageHeader

        title="Oturum Analitiği"

        description="Oturum süreleri, bitiş nedeni ve cihaz bilgileri."

      />



      <AdminToolbar>

        <select

          className="admin-select"

          value={preset}

          onChange={(e) => {

            setPreset(e.target.value);

            setPage(1);

          }}

        >

          {PRESET_OPTIONS}

        </select>

        <label className="admin-muted" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>

          <input

            type="checkbox"

            checked={activeOnly}

            onChange={(e) => {

              setActiveOnly(e.target.checked);

              setPage(1);

            }}

          />

          Yalnız aktif

        </label>

      </AdminToolbar>



      <AdminCard title="Oturumlar" subtitle={data ? `${data.total} kayıt` : undefined} flush>

        {loading ? <div className="admin-loading">Oturum analitiği yükleniyor…</div> : null}

        {error ? <div className="admin-error">{error}</div> : null}

        {!loading && !error && data && !data.items.length ? (

          <div className="admin-empty">Henüz oturum verisi bulunmuyor.</div>

        ) : null}

        {!loading && !error && data && data.items.length > 0 ? (

          <>

            <div className="admin-table-wrap">

              <table className="admin-table">

                <thead>

                  <tr>

                    <th>Kullanıcı</th>

                    <th>Başlangıç</th>

                    <th>Bitiş</th>

                    <th>Aktif Süre</th>

                    <th>Durum</th>

                    <th>Bitiş Nedeni</th>

                    <th>Şehir</th>

                    <th>Ülke</th>

                    <th>Cihaz</th>

                    <th>Browser</th>

                    <th>OS</th>

                  </tr>

                </thead>

                <tbody>

                  {data.items.map((s) => (

                    <tr key={String(s.id)}>

                      <td>

                        <Link to={`/admin/users/${s.userId}`}>{displayName(s.userName as string | null)}</Link>

                        <div className="admin-muted" style={{ fontSize: 11.5 }}>

                          {String(s.userEmail)}

                        </div>

                      </td>

                      <td>{formatAdminDateTime(s.startedAt as string)}</td>

                      <td>{s.endedAt ? formatAdminDateTime(s.endedAt as string) : "—"}</td>

                      <td>{String(s.durationLabel)}</td>

                      <td>

                        {s.active ? (

                          <span className="admin-badge admin-badge-active">Aktif</span>

                        ) : (

                          <span className="admin-badge admin-badge-passive">Kapalı</span>

                        )}

                      </td>

                      <td>{(s.endReason as string) || "—"}</td>

                      <td>{String(s.city)}</td>

                      <td>{String(s.country)}</td>

                      <td>{String(s.clientType)}</td>

                      <td>{String(s.browser)}</td>

                      <td>{String(s.os)}</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            <div className="admin-pagination">

              <span className="admin-muted" style={{ fontSize: 12.5 }}>

                {from}–{to} / {data.total} oturum

              </span>

              <div style={{ display: "flex", gap: 8 }}>

                <button

                  type="button"

                  className="admin-btn admin-btn-secondary admin-btn-sm"

                  disabled={page <= 1}

                  onClick={() => setPage((p) => p - 1)}

                >

                  Önceki

                </button>

                <button

                  type="button"

                  className="admin-btn admin-btn-secondary admin-btn-sm"

                  disabled={page >= maxPage}

                  onClick={() => setPage((p) => p + 1)}

                >

                  Sonraki

                </button>

              </div>

            </div>

          </>

        ) : null}

      </AdminCard>

    </div>

  );

}

