import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../../ui/toast";
import { deactivateAdminUser, fetchAdminUsers, type AdminUserListItem } from "../adminApi";
import { displayName, formatAdminDateTime, planLabel, PLAN_FILTER_OPTIONS } from "../format";
import {
  AdminCard,
  AdminIcon,
  AdminPageHeader,
  AdminToolbar,
  ICONS,
  KpiCard,
  Modal,
  RoleBadge,
  StatusBadge,
  TrialBadge,
} from "../components";

type KpiCounts = {
  total: number;
  active: number;
  inactive: number;
  trial: number;
  paid: number;
};

export function AdminUsersPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [role, setRole] = useState("ALL");
  const [plan, setPlan] = useState("ALL");
  const [trial, setTrial] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [kpis, setKpis] = useState<KpiCounts>({ total: 0, active: 0, inactive: 0, trial: 0, paid: 0 });
  const menuRef = useRef<HTMLDivElement | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchAdminUsers({
      page,
      pageSize,
      search: search.trim() || undefined,
      status: status === "ALL" ? undefined : status,
      role: role === "ALL" ? undefined : role,
      plan: plan === "ALL" ? undefined : plan,
      isTrial: trial === "ALL" ? undefined : trial === "true",
    })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((e) => setError(e?.message ?? "Liste yüklenemedi"))
      .finally(() => setLoading(false));
  };

  const loadKpis = () => {
    Promise.allSettled([
      fetchAdminUsers({ page: 1, pageSize: 1 }),
      fetchAdminUsers({ page: 1, pageSize: 1, status: "ACTIVE" }),
      fetchAdminUsers({ page: 1, pageSize: 1, status: "PASSIVE" }),
      fetchAdminUsers({ page: 1, pageSize: 1, status: "SUSPENDED" }),
      fetchAdminUsers({ page: 1, pageSize: 1, isTrial: true }),
      fetchAdminUsers({ page: 1, pageSize: 1, isTrial: false }),
    ]).then((results) => {
      const totalOf = (i: number) => {
        const r = results[i];
        if (!r || r.status !== "fulfilled") return 0;
        return r.value.total;
      };
      setKpis({
        total: totalOf(0),
        active: totalOf(1),
        inactive: totalOf(2) + totalOf(3),
        trial: totalOf(4),
        paid: totalOf(5),
      });
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, role, plan, trial]);

  useEffect(() => {
    loadKpis();
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuId(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const maxPage = Math.max(1, Math.ceil(total / pageSize));

  const clearFilters = () => {
    setSearch("");
    setStatus("ALL");
    setRole("ALL");
    setPlan("ALL");
    setTrial("ALL");
    setPage(1);
  };

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Kullanıcı Yönetimi"
        description="Tüm kullanıcıları görüntüleyin ve yönetin."
        actions={
          <Link to="/admin/users/new" className="admin-btn admin-btn-primary">
            + Yeni Kullanıcı
          </Link>
        }
      />

      <div className="admin-kpi-grid is-5">
        <KpiCard label="Toplam" value={kpis.total} tone="cyan" icon={<AdminIcon path={ICONS.users} />} />
        <KpiCard label="Aktif" value={kpis.active} tone="green" icon={<AdminIcon path={ICONS.check} />} />
        <KpiCard label="Askıda / Pasif" value={kpis.inactive} tone="orange" icon={<AdminIcon path={ICONS.pause} />} />
        <KpiCard label="Trial" value={kpis.trial} tone="orange" icon={<AdminIcon path={ICONS.trial} />} />
        <KpiCard label="Ücretli" value={kpis.paid} tone="teal" icon={<AdminIcon path={ICONS.money} />} />
      </div>

      <AdminToolbar>
        <input
          className="admin-input"
          style={{ minWidth: 220, flex: "1 1 220px" }}
          placeholder="Ara: ad veya e-posta"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="admin-select"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="ALL">Durum: Tümü</option>
          <option value="ACTIVE">Aktif</option>
          <option value="PASSIVE">Pasif</option>
          <option value="SUSPENDED">Askıya alınmış</option>
        </select>
        <select
          className="admin-select"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
        >
          <option value="ALL">Rol: Tümü</option>
          <option value="USER">Kullanıcı</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          className="admin-select"
          value={plan}
          onChange={(e) => {
            setPlan(e.target.value);
            setPage(1);
          }}
        >
          <option value="ALL">Plan: Tümü</option>
          {PLAN_FILTER_OPTIONS.map((p) => (
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
        <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={load}>
          Filtreleri uygula
        </button>
        <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={clearFilters}>
          Temizle
        </button>
      </AdminToolbar>

      <AdminCard title="Kullanıcı Listesi" subtitle={`${total} kayıt`} flush>
        {loading ? <div className="admin-loading">Kullanıcılar yükleniyor…</div> : null}
        {error ? <div className="admin-error">{error}</div> : null}
        {!loading && !error && items.length === 0 ? <div className="admin-empty">Henüz kullanıcı bulunmuyor.</div> : null}
        {!loading && !error && items.length > 0 ? (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Kullanıcı</th>
                    <th>E-posta</th>
                    <th>Rol</th>
                    <th>Abonelik</th>
                    <th>Trial</th>
                    <th>Bitiş</th>
                    <th>Son Giriş</th>
                    <th>Hesaplama</th>
                    <th>Durum</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="admin-cell-primary">{displayName(u.name)}</div>
                        <div className="admin-cell-secondary">{planLabel(u.plan)}</div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <RoleBadge role={u.role} />
                      </td>
                      <td>{planLabel(u.plan)}</td>
                      <td>
                        {u.isTrial ? (
                          <div>
                            <TrialBadge isTrial />
                            {typeof u.creditBalance === "number" ? (
                              <div className="admin-cell-secondary">
                                {u.creditBalance}/{u.trialCreditsGranted ?? 10} kredi
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <TrialBadge isTrial={false} />
                        )}
                      </td>
                      <td>{formatAdminDateTime(u.subscriptionExpiresAt)}</td>
                      <td>{formatAdminDateTime(u.lastLoginAt)}</td>
                      <td>{u.savedCalculationCount}</td>
                      <td>
                        <StatusBadge status={u.status} />
                      </td>
                      <td>
                        <div className="admin-actions-menu" ref={menuId === u.id ? menuRef : undefined}>
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            onClick={() => setMenuId(menuId === u.id ? null : u.id)}
                          >
                            ···
                          </button>
                          {menuId === u.id ? (
                            <div className="admin-actions-dropdown">
                              <button type="button" onClick={() => navigate(`/admin/users/${u.id}`)}>
                                Detay
                              </button>
                              <button type="button" onClick={() => navigate(`/admin/users/${u.id}?edit=1`)}>
                                Düzenle
                              </button>
                              <button type="button" onClick={() => navigate(`/admin/users/${u.id}?sub=1`)}>
                                Aboneliği Yönet
                              </button>
                              <button
                                type="button"
                                className="danger"
                                onClick={() => {
                                  setMenuId(null);
                                  setConfirmId(u.id);
                                }}
                              >
                                Pasife Al
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-pagination">
              <span>
                {from}–{to} / {total} kullanıcı
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Önceki
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  disabled={page >= maxPage}
                  onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                >
                  Sonraki
                </button>
              </div>
            </div>
          </>
        ) : null}
      </AdminCard>

      {confirmId ? (
        <Modal
          title="Kullanıcıyı pasife al"
          onClose={() => setConfirmId(null)}
          footer={
            <>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setConfirmId(null)}>
                Vazgeç
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  deactivateAdminUser(confirmId)
                    .then(() => {
                      toast.success("Kullanıcı pasife alındı.");
                      setConfirmId(null);
                      load();
                      loadKpis();
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
            Bu kullanıcı pasife alınacak. Kullanıcı Aktüerya&apos;ya erişemeyecek. Hesaplama kayıtları silinmez. Devam
            etmek istiyor musunuz?
          </p>
        </Modal>
      ) : null}
    </div>
  );
}
