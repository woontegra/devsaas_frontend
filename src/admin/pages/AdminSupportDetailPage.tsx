import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AdminCard, AdminPageHeader } from "../components";
import { formatAdminDateTime } from "../format";
import {
  emitAdminSupportSeen,
  fetchAdminSupportTicket,
  replyAdminSupportTicket,
  setAdminSupportStatus,
  type AdminSupportDetail,
} from "../adminApi";
import { STATUS_LABEL, downloadSupportFile, type SupportStatusName } from "../../support/supportApi";
import { toApiClientError } from "../../services/api";

const STATUSES = Object.keys(STATUS_LABEL) as SupportStatusName[];

export function AdminSupportDetailPage() {
  const { number = "" } = useParams();
  const [item, setItem] = useState<AdminSupportDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchAdminSupportTicket(number)
      .then((next) => {
        setItem(next);
        emitAdminSupportSeen();
      })
      .catch((e) => setError(toApiClientError(e).message));
  }, [number]);

  const saveStatus = async (status: string) => {
    setBusy(true);
    setError(null);
    try {
      setItem(await setAdminSupportStatus(number, status));
    } catch (e) {
      setError(toApiClientError(e).message);
    } finally {
      setBusy(false);
    }
  };

  const send = async (formEl: HTMLFormElement) => {
    const message = String(new FormData(formEl).get("message") ?? "").trim();
    if (!message) {
      setError("Mesaj zorunludur.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setItem(await replyAdminSupportTicket(number, message));
      emitAdminSupportSeen();
      formEl.reset();
    } catch (e) {
      setError(toApiClientError(e).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title={item ? `${item.publicNumber} · ${item.subject}` : "Destek Talebi"}
        description={item ? `${item.userName ?? "—"} · ${item.userEmail}` : undefined}
        actions={
          <Link to="/admin/support" className="admin-btn admin-btn-secondary">
            Liste
          </Link>
        }
      />
      {error ? <p className="mb-3 text-[13px] text-red-700">{error}</p> : null}
      {!item ? null : (
        <>
          <AdminCard title="Durum">
            <div className="flex flex-wrap items-center gap-2">
              <span>{item.categoryLabel}</span>
              <select
                className="admin-input"
                value={item.status}
                disabled={busy}
                onChange={(e) => void saveStatus(e.target.value)}
              >
                {STATUSES.map((id) => (
                  <option key={id} value={id}>
                    {STATUS_LABEL[id]}
                  </option>
                ))}
              </select>
              {item.awaitingStaff ? <span>Yeni cevap</span> : null}
            </div>
          </AdminCard>
          <AdminCard title="Konuşma">
            {item.messages.map((message) => (
              <article key={message.id} className="border-b py-2 last:border-b-0">
                <p className="text-[12px]">
                  {message.authorRole === "STAFF" ? "Destek" : "Kullanıcı"} · {formatAdminDateTime(message.createdAt)}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[13px]">{message.body}</p>
                {message.attachments.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    className="mt-1 text-[12px] underline"
                    onClick={() => void downloadSupportFile(file.id, file.fileName)}
                  >
                    {file.fileName}
                  </button>
                ))}
              </article>
            ))}
            {item.status === "CLOSED" ? (
              <p className="mt-3 text-[13px]">Kapalı talebe cevap için önce durumu yeniden açın.</p>
            ) : (
              <form
                className="mt-3 grid gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(e.currentTarget);
                }}
              >
                <textarea name="message" rows={4} className="admin-textarea" placeholder="Yanıt" />
                <button type="submit" disabled={busy} className="admin-btn admin-btn-primary w-fit">
                  Yanıtla
                </button>
              </form>
            )}
          </AdminCard>
        </>
      )}
    </div>
  );
}
