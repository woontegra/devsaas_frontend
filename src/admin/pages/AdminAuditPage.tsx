import { useEffect, useState } from "react";

import { fetchAdminAudit } from "../adminApi";

import { formatAdminDateTime } from "../format";

import { AdminCard, AdminPageHeader, AdminToolbar, MetaSummary } from "../components";



const ACTION_OPTIONS = (

  <>

    <option value="">Tüm işlemler</option>

    <option value="USER_CREATED">USER_CREATED</option>

    <option value="USER_UPDATED">USER_UPDATED</option>

    <option value="USER_DEACTIVATED">USER_DEACTIVATED</option>

    <option value="SUBSCRIPTION_CHANGED">SUBSCRIPTION_CHANGED</option>

    <option value="ADMIN_NOTE_UPDATED">ADMIN_NOTE_UPDATED</option>

    <option value="PRICING_SURVEY_SETTING_UPDATED">PRICING_SURVEY_SETTING_UPDATED</option>

  </>

);



export function AdminAuditPage() {

  const [page, setPage] = useState(1);

  const [action, setAction] = useState("");

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

    fetchAdminAudit({ page, pageSize: 30, action: action || undefined })

      .then((r) => setData(r as typeof data))

      .catch((e) => setError(e?.message ?? "Yüklenemedi"))

      .finally(() => setLoading(false));

  }, [page, action]);



  const maxPage = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;



  return (

    <div className="admin-page">

      <AdminPageHeader title="Admin İşlemleri" description="Audit kayıtları — parola/token/snapshot gösterilmez." />



      <AdminToolbar>

        <select

          className="admin-select"

          value={action}

          onChange={(e) => {

            setAction(e.target.value);

            setPage(1);

          }}

        >

          {ACTION_OPTIONS}

        </select>

      </AdminToolbar>



      <AdminCard title="Audit kayıtları" subtitle={data ? `${data.total} kayıt` : undefined} flush>

        {loading ? <div className="admin-loading">Admin işlemleri yükleniyor…</div> : null}

        {error ? <div className="admin-error">{error}</div> : null}

        {!loading && !error && data && !data.items.length ? (

          <div className="admin-empty">Henüz audit kaydı yok.</div>

        ) : null}

        {!loading && !error && data && data.items.length > 0 ? (

          <>

            <div className="admin-table-wrap">

              <table className="admin-table">

                <thead>

                  <tr>

                    <th>Tarih</th>

                    <th>Admin</th>

                    <th>İşlem</th>

                    <th>Hedef</th>

                    <th>Özet</th>

                  </tr>

                </thead>

                <tbody>

                  {data.items.map((row) => (

                    <tr key={String(row.id)}>

                      <td>{formatAdminDateTime(row.occurredAt as string)}</td>

                      <td>{String(row.adminEmail)}</td>

                      <td>{String(row.action)}</td>

                      <td>

                        {String(row.targetType)}

                        {row.targetId ? (

                          <div className="admin-muted" style={{ fontSize: 11 }}>

                            {String(row.targetId)}

                          </div>

                        ) : null}

                      </td>

                      <td>

                        <MetaSummary data={row.metadataSummary as Record<string, unknown> | null | undefined} />

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            <div className="admin-pagination">

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

          </>

        ) : null}

      </AdminCard>

    </div>

  );

}

