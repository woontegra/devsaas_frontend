import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { fetchAdminSubscriptions } from "../adminApi";

import {

  displayName,

  formatAdminDateTime,

  formatRemaining,

  planLabel,

  PLAN_OPTIONS,

} from "../format";

import {

  ActiveSubBadge,

  AdminCard,

  AdminIcon,

  AdminPageHeader,

  AdminToolbar,

  ICONS,

  KpiCard,

  TrialBadge,

} from "../components";



type SubRow = {

  id: string;

  userId: string;

  userName: string | null;

  userEmail: string;

  plan: string;

  isTrial: boolean;

  startsAt: string;

  expiresAt: string;

  active: boolean;

  remainingMs: number;

};



type SubKpis = {

  total: number;

  monthly: number;

  yearly: number;

  trial: number;

  credit: number;

};



export function AdminSubscriptionsPage() {

  const [items, setItems] = useState<SubRow[]>([]);

  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);

  const [pageSize] = useState(20);

  const [plan, setPlan] = useState("ALL");

  const [trial, setTrial] = useState("ALL");

  const [active, setActive] = useState("ALL");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [kpis, setKpis] = useState<SubKpis>({ total: 0, monthly: 0, yearly: 0, trial: 0, credit: 0 });



  useEffect(() => {

    Promise.all([

      fetchAdminSubscriptions({ page: 1, pageSize: 1 }),

      fetchAdminSubscriptions({ page: 1, pageSize: 1, plan: "monthly" }),

      fetchAdminSubscriptions({ page: 1, pageSize: 1, plan: "yearly" }),

      fetchAdminSubscriptions({ page: 1, pageSize: 1, isTrial: true }),

      fetchAdminSubscriptions({ page: 1, pageSize: 1, plan: "credit" }),

    ])

      .then(([all, monthly, yearly, trialRes, credit]) => {

        setKpis({

          total: all.total,

          monthly: monthly.total,

          yearly: yearly.total,

          trial: trialRes.total,

          credit: credit.total,

        });

      })

      .catch(() => {

        /* KPI soft-fail */

      });

  }, []);



  useEffect(() => {

    setLoading(true);

    fetchAdminSubscriptions({

      page,

      pageSize,

      plan: plan === "ALL" ? undefined : plan,

      isTrial: trial === "ALL" ? undefined : trial === "true",

      active: active === "ALL" ? undefined : active === "true",

    })

      .then((res) => {

        setItems(res.items);

        setTotal(res.total);

      })

      .catch((e) => setError(e?.message ?? "Abonelikler yüklenemedi"))

      .finally(() => setLoading(false));

  }, [page, pageSize, plan, trial, active]);



  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;

  const to = Math.min(page * pageSize, total);

  const maxPage = Math.max(1, Math.ceil(total / pageSize));



  return (

    <div className="admin-page">

      <AdminPageHeader

        title="Abonelikler"

        description="Kullanıcı abonelik durumlarını toplu olarak görüntüleyin ve yönetin."

      />



      <div className="admin-kpi-grid is-5">

        <KpiCard label="Toplam Abonelik" value={kpis.total} tone="cyan" icon={<AdminIcon path={ICONS.users} />} />

        <KpiCard label="Aylık" value={kpis.monthly} tone="blue" icon={<AdminIcon path={ICONS.money} />} />

        <KpiCard label="Yıllık" value={kpis.yearly} tone="teal" icon={<AdminIcon path={ICONS.money} />} />

        <KpiCard label="Trial" value={kpis.trial} tone="orange" icon={<AdminIcon path={ICONS.trial} />} />

        <KpiCard label="Credit" value={kpis.credit} tone="purple" icon={<AdminIcon path={ICONS.money} />} />

      </div>



      <AdminToolbar>

        <select

          className="admin-select"

          value={plan}

          onChange={(e) => {

            setPlan(e.target.value);

            setPage(1);

          }}

        >

          <option value="ALL">Plan: Tümü</option>

          {PLAN_OPTIONS.map((p) => (

            <option key={p.value} value={p.value}>

              {p.label}

            </option>

          ))}

        </select>

        <select

          className="admin-select"

          value={trial}

          onChange={(e) => {

            setTrial(e.target.value);

            setPage(1);

          }}

        >

          <option value="ALL">Trial: Tümü</option>

          <option value="true">Deneme</option>

          <option value="false">Ücretli</option>

        </select>

        <select

          className="admin-select"

          value={active}

          onChange={(e) => {

            setActive(e.target.value);

            setPage(1);

          }}

        >

          <option value="ALL">Durum: Tümü</option>

          <option value="true">Aktif</option>

          <option value="false">Süresi dolmuş</option>

        </select>

      </AdminToolbar>



      <AdminCard title="Abonelik Listesi" subtitle={`${total} kayıt`} flush>

        {loading ? <div className="admin-loading">Abonelikler yükleniyor…</div> : null}

        {error ? <div className="admin-error">{error}</div> : null}

        {!loading && !error && items.length === 0 ? (

          <div className="admin-empty">Henüz abonelik kaydı bulunmuyor.</div>

        ) : null}

        {!loading && !error && items.length > 0 ? (

          <>

            <div className="admin-table-wrap">

              <table className="admin-table">

                <thead>

                  <tr>

                    <th>Kullanıcı</th>

                    <th>E-posta</th>

                    <th>Plan</th>

                    <th>Trial</th>

                    <th>Başlangıç</th>

                    <th>Bitiş</th>

                    <th>Kalan Süre</th>

                    <th>Durum</th>

                    <th>İşlem</th>

                  </tr>

                </thead>

                <tbody>

                  {items.map((row) => (

                    <tr key={row.id}>

                      <td title={formatAdminDateTime(row.expiresAt)}>{displayName(row.userName)}</td>

                      <td>{row.userEmail}</td>

                      <td>{planLabel(row.plan)}</td>

                      <td>

                        <TrialBadge isTrial={row.isTrial} />

                      </td>

                      <td>{formatAdminDateTime(row.startsAt)}</td>

                      <td title={row.expiresAt}>{formatAdminDateTime(row.expiresAt)}</td>

                      <td title={formatAdminDateTime(row.expiresAt)}>{formatRemaining(row.remainingMs)}</td>

                      <td>

                        <ActiveSubBadge active={row.active} />

                      </td>

                      <td>

                        <Link className="admin-btn admin-btn-ghost admin-btn-sm" to={`/admin/users/${row.userId}?sub=1`}>

                          Yönet

                        </Link>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            <div className="admin-pagination">

              <span>

                {from}–{to} / {total} abonelik

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

