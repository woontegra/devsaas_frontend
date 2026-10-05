import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdminDemoRequests, type AdminDemoRequestItem } from "../adminApi";
import { displayName, formatAdminDateTime } from "../format";
import { AdminCard, AdminPageHeader, TrialBadge } from "../components";

export function AdminDemoRequestsPage() {
  const [items, setItems] = useState<AdminDemoRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminDemoRequests()
      .then((res) => setItems(res.items))
      .catch((e) => setError(e?.message ?? "Demo talepleri yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Demo Talepleri"
        description="Satış sayfasından gelen talepler. Süre ve kredi, Aktüerya Satış Ayarları kaydındaki güncel değerlerle tanımlanır."
      />
      <AdminCard>
        {loading ? <div className="admin-loading">Demo talepleri yükleniyor…</div> : null}
        {error ? <div className="admin-error">{error}</div> : null}
        {!loading && !error && items.length === 0 ? <div className="admin-empty">Henüz demo talebi yok.</div> : null}
        {!loading && !error && items.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ad Soyad</th>
                  <th>E-posta</th>
                  <th>Telefon</th>
                  <th>Talep</th>
                  <th>Demo</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{displayName(item.name)}</td>
                    <td>{item.email}</td>
                    <td>{item.phone}</td>
                    <td>{formatAdminDateTime(item.createdAt)}</td>
                    <td>
                      <TrialBadge isTrial={item.isTrial} />
                      {item.trialCreditsGranted != null ? (
                        <div className="admin-cell-secondary">
                          {item.creditBalance ?? 0}/{item.trialCreditsGranted} kredi
                        </div>
                      ) : null}
                    </td>
                    <td>
                      {item.userId ? (
                        <Link to={`/admin/users/${item.userId}`} className="admin-btn admin-btn-secondary admin-btn-sm">
                          Demo yönetimi
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </AdminCard>
    </div>
  );
}
