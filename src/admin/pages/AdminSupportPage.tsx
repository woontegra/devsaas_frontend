import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminCard, AdminPageHeader } from "../components";
import { formatAdminDateTime } from "../format";
import { fetchAdminSupportTickets, type AdminSupportListItem } from "../adminApi";
import { CATEGORY_LABEL, STATUS_LABEL, type SupportCategoryName, type SupportStatusName } from "../../support/supportApi";
import { toApiClientError } from "../../services/api";

const CATEGORIES = Object.keys(CATEGORY_LABEL) as SupportCategoryName[];
const STATUSES = Object.keys(STATUS_LABEL) as SupportStatusName[];

export function AdminSupportPage() {
  const [items, setItems] = useState<AdminSupportListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = (next?: { q?: string; status?: string; category?: string }) => {
    void fetchAdminSupportTickets({
      q: next?.q ?? q,
      status: next?.status ?? status,
      category: next?.category ?? category,
    })
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
      })
      .catch((e) => setError(toApiClientError(e).message));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <AdminPageHeader title="Destek Talepleri" description={`${total} kayıt`} />
      {error ? <p className="mb-3 text-[13px] text-red-700">{error}</p> : null}
      <AdminCard title="Filtre" flush>
        <form
          className="flex flex-wrap gap-2 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const next = {
              q: String(data.get("q") ?? ""),
              status: String(data.get("status") ?? ""),
              category: String(data.get("category") ?? ""),
            };
            setQ(next.q);
            setStatus(next.status);
            setCategory(next.category);
            load(next);
          }}
        >
          <input name="q" defaultValue={q} placeholder="No, konu, kullanıcı" className="admin-input min-w-[180px]" />
          <select name="status" defaultValue={status} className="admin-input">
            <option value="">Tüm durumlar</option>
            {STATUSES.map((id) => (
              <option key={id} value={id}>
                {STATUS_LABEL[id]}
              </option>
            ))}
          </select>
          <select name="category" defaultValue={category} className="admin-input">
            <option value="">Tüm kategoriler</option>
            {CATEGORIES.map((id) => (
              <option key={id} value={id}>
                {CATEGORY_LABEL[id]}
              </option>
            ))}
          </select>
          <button type="submit" className="admin-btn admin-btn-secondary">
            Ara
          </button>
        </form>
      </AdminCard>
      <div className="admin-table-wrap mt-3">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Talep No</th>
              <th>Kullanıcı</th>
              <th>Kategori</th>
              <th>Konu</th>
              <th>Durum</th>
              <th>Oluşturma</th>
              <th>Son Hareket</th>
              <th>Yeni</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8}>Kayıt yok</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.publicNumber}>
                  <td>
                    <Link to={`/admin/support/${item.publicNumber}`}>{item.publicNumber}</Link>
                  </td>
                  <td>
                    {item.userName ?? "—"}
                    <div>{item.userEmail}</div>
                  </td>
                  <td>{item.categoryLabel}</td>
                  <td>{item.subject}</td>
                  <td>{STATUS_LABEL[item.status]}</td>
                  <td>{formatAdminDateTime(item.createdAt)}</td>
                  <td>{formatAdminDateTime(item.lastActivityAt)}</td>
                  <td>{item.awaitingStaff ? "Yeni cevap" : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
