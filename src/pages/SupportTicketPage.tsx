import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatNotifyTime } from "../notifications/notificationApi";
import { toApiClientError } from "../services/api";
import {
  STATUS_LABEL,
  downloadSupportFile,
  emitUserSupportSeen,
  fetchMyTicket,
  fileToPayload,
  replyMyTicket,
  type SupportTicketDetail,
} from "../support/supportApi";

export function SupportTicketPage() {
  const { number = "" } = useParams();
  const [item, setItem] = useState<SupportTicketDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    void fetchMyTicket(number)
      .then((ticket) => {
        setItem(ticket);
        emitUserSupportSeen();
      })
      .catch((e) => setError(toApiClientError(e).message));
  };

  useEffect(() => {
    load();
  }, [number]);

  const send = async (formEl: HTMLFormElement) => {
    const data = new FormData(formEl);
    const message = String(data.get("message") ?? "").trim();
    const file = data.get("file");
    if (!message) {
      setError("Mesaj zorunludur.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const attachment = file instanceof File && file.size > 0 ? await fileToPayload(file) : null;
      const next = await replyMyTicket(number, { message, attachment });
      setItem(next);
      emitUserSupportSeen();
      formEl.reset();
    } catch (e) {
      setError(e instanceof Error && e.message.includes("512") ? e.message : toApiClientError(e).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-workspace dashboard-workspace py-4">
      <Link to="/support" className="text-[12.5px] text-[var(--color-muted)]">
        ← Taleplerim
      </Link>
      {error ? <p className="mt-2 text-[13px] text-red-700">{error}</p> : null}
      {!item ? null : (
        <>
          <div className="mt-2 mb-3">
            <p className="text-[12px] font-semibold text-[var(--color-primary)]">{item.publicNumber}</p>
            <h1 className="text-[18px] font-semibold tracking-[-0.02em] text-[var(--color-text)]">{item.subject}</h1>
            <p className="mt-1 text-[12px] text-[var(--color-muted)]">
              {item.categoryLabel} · {STATUS_LABEL[item.status]} · {formatNotifyTime(item.createdAt)}
            </p>
          </div>
          <div className="overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]">
            {item.messages.map((message) => (
              <article key={message.id} className="border-b border-[var(--color-border)] px-3 py-2.5 last:border-b-0">
                <p className="text-[11.5px] text-[var(--color-muted)]">
                  {message.authorRole === "STAFF" ? "Destek" : "Siz"} · {formatNotifyTime(message.createdAt)}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--color-text)]">{message.body}</p>
                {message.attachments.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {message.attachments.map((file) => (
                      <button
                        key={file.id}
                        type="button"
                        className="text-[12px] font-medium text-[var(--color-primary)]"
                        onClick={() => void downloadSupportFile(file.id, file.fileName)}
                      >
                        {file.fileName}
                      </button>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
          {item.closed ? (
            <p className="mt-3 text-[13px] text-[var(--color-muted)]">{item.closedMessage}</p>
          ) : (
            <form
              className="mt-3 grid gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void send(e.currentTarget);
              }}
            >
              <textarea name="message" rows={4} maxLength={8000} placeholder="Yanıtınız" className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-2 text-[13px] text-[var(--color-text)]" />
              <input name="file" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="text-[12px]" />
              <button type="submit" disabled={busy} className="btn-outline w-fit min-h-[32px] px-3 text-[12.5px] disabled:opacity-50">
                {busy ? "Gönderiliyor" : "Yanıtla"}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
