import { useEffect, useState } from "react";
import {
  createAdminNotification,
  deactivateAdminNotification,
  fetchAdminNotifications,
  publishAdminNotification,
  updateAdminNotification,
  type AdminNotificationItem,
} from "../adminApi";
import { AdminCard, AdminPageHeader } from "../components";
import { formatAdminDateTime } from "../format";

const TYPE_LABEL = { UPDATE: "Güncelleme", ANNOUNCEMENT: "Duyuru", IMPORTANT: "Önemli" } as const;
const AUDIENCE_LABEL = { ALL: "Tüm Kullanıcılar", TRIAL: "Demo Kullanıcılar", PAID: "Profesyonel Kullanıcılar" } as const;
const STATUS_LABEL = { DRAFT: "Taslak", PUBLISHED: "Yayında", INACTIVE: "Pasif" } as const;

const EMPTY = {
  title: "",
  summary: "",
  content: "",
  type: "UPDATE",
  audience: "ALL",
  version: "",
  isCritical: false,
  publishedAt: "",
};

export function AdminNotificationsPage() {
  const [items, setItems] = useState<AdminNotificationItem[]>([]);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    void fetchAdminNotifications({ page: 1 })
      .then((data) => setItems(data.items))
      .catch((e) => setError(e?.message ?? "Liste alınamadı"));
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing("new");
    setForm(EMPTY);
    setError(null);
  };

  const openEdit = (item: AdminNotificationItem) => {
    setEditing(item.id);
    setForm({
      title: item.title,
      summary: item.summary,
      content: item.content,
      type: item.type,
      audience: item.audience,
      version: item.version ?? "",
      isCritical: item.isCritical,
      publishedAt: item.publishedAt ? item.publishedAt.slice(0, 16) : "",
    });
  };

  const saveFromForm = async (formEl: HTMLFormElement, publish: boolean) => {
    const data = new FormData(formEl);
    const title = String(data.get("title") ?? "").trim();
    const summary = String(data.get("summary") ?? "").trim();
    const content = String(data.get("content") ?? "").trim();
    const type = String(data.get("type") ?? "");
    const audience = String(data.get("audience") ?? "");
    const version = String(data.get("version") ?? "").trim();
    const publishedRaw = String(data.get("publishedAt") ?? "");
    if (!title || !summary || !content) {
      setError("Başlık, kısa açıklama ve detay zorunludur.");
      return;
    }
    let publishedAt: string | null = null;
    if (publishedRaw) {
      const parsed = new Date(publishedRaw);
      if (Number.isNaN(parsed.getTime())) {
        setError("Yayın tarihi geçersiz.");
        return;
      }
      publishedAt = parsed.toISOString();
    }
    setBusy(true);
    setError(null);
    const body = {
      title,
      summary,
      content,
      type,
      audience,
      version: version || null,
      isCritical: type === "IMPORTANT" && data.get("isCritical") === "on",
      publishedAt,
      publish,
    };
    try {
      if (editing === "new") await createAdminNotification(body);
      else if (editing) await updateAdminNotification(editing, body);
      setEditing(null);
      load();
    } catch (e) {
      const message =
        e && typeof e === "object" && "message" in e && typeof e.message === "string"
          ? e.message
          : "Kaydedilemedi";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Bildirimler"
        description="Sürüm notları ve duyurular. Yayın sonrası silinmez; pasife alınır."
        actions={
          <button type="button" className="admin-btn admin-btn-primary" onClick={openNew}>
            Yeni bildirim
          </button>
        }
      />

      {error ? <p className="admin-error">{error}</p> : null}

      {editing ? (
        <AdminCard title={editing === "new" ? "Yeni bildirim" : "Bildirimi düzenle"}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
              void saveFromForm(e.currentTarget, submitter?.value === "publish");
            }}
          >
          <div className="admin-form-grid">
            <div className="admin-field">
              <label htmlFor="nt-title">Başlık *</label>
              <input id="nt-title" name="title" className="admin-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="admin-field">
              <label htmlFor="nt-summary">Kısa açıklama *</label>
              <input id="nt-summary" name="summary" className="admin-input" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
            </div>
            <div className="admin-field full">
              <label htmlFor="nt-content">Detay *</label>
              <textarea id="nt-content" name="content" className="admin-textarea" rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="admin-field">
              <label htmlFor="nt-type">Tür *</label>
              <select id="nt-type" name="type" className="admin-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="UPDATE">Güncelleme</option>
                <option value="ANNOUNCEMENT">Duyuru</option>
                <option value="IMPORTANT">Önemli</option>
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="nt-audience">Hedef kitle *</label>
              <select id="nt-audience" name="audience" className="admin-select" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                <option value="ALL">Tüm Kullanıcılar</option>
                <option value="TRIAL">Demo Kullanıcılar</option>
                <option value="PAID">Profesyonel Kullanıcılar</option>
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="nt-version">Sürüm</label>
              <input id="nt-version" name="version" className="admin-input" placeholder="1.1.0" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
            </div>
            <div className="admin-field">
              <label htmlFor="nt-published">Yayın tarihi</label>
              <input id="nt-published" name="publishedAt" className="admin-input" type="datetime-local" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} />
            </div>
            {form.type === "IMPORTANT" ? (
              <div className="admin-field">
                <label htmlFor="nt-critical">
                  <input id="nt-critical" name="isCritical" type="checkbox" checked={form.isCritical} onChange={(e) => setForm({ ...form, isCritical: e.target.checked })} /> Kritik bildirim
                </label>
              </div>
            ) : null}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="submit" value="draft" className="admin-btn admin-btn-secondary" disabled={busy}>
              Taslak Kaydet
            </button>
            <button type="submit" value="publish" className="admin-btn admin-btn-primary" disabled={busy}>
              Yayınla
            </button>
            <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setEditing(null)}>
              Vazgeç
            </button>
          </div>
          </form>
        </AdminCard>
      ) : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Başlık</th>
              <th>Tür</th>
              <th>Hedef Kitle</th>
              <th>Sürüm</th>
              <th>Durum</th>
              <th>Yayın Tarihi</th>
              <th>Oluşturulma</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{TYPE_LABEL[item.type]}</td>
                <td>{AUDIENCE_LABEL[item.audience]}</td>
                <td>{item.version ?? "—"}</td>
                <td>{STATUS_LABEL[item.status]}</td>
                <td>{item.publishedAt ? formatAdminDateTime(item.publishedAt) : "—"}</td>
                <td>{formatAdminDateTime(item.createdAt)}</td>
                <td>
                  {item.status !== "INACTIVE" ? (
                    <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => openEdit(item)}>
                      Düzenle
                    </button>
                  ) : null}
                  {item.status === "DRAFT" ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost admin-btn-sm"
                      onClick={() => void publishAdminNotification(item.id).then(load)}
                    >
                      Yayınla
                    </button>
                  ) : null}
                  {item.status === "PUBLISHED" ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost admin-btn-sm"
                      onClick={() => void deactivateAdminNotification(item.id).then(load)}
                    >
                      Pasife al
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
