import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { formatNotifyTime } from "../notifications/notificationApi";
import { toApiClientError } from "../services/api";
import {
  CATEGORY_LABEL,
  createMyTicket,
  downloadSupportFile,
  emitUserSupportSeen,
  fetchMyTicket,
  fetchMyTickets,
  fileToPayload,
  replyMyTicket,
  type SupportCategoryName,
  type SupportListItem,
  type SupportTicketDetail,
} from "../support/supportApi";
import { SUPPORT_BADGE_LABEL, SUPPORT_FILTERS, filterSupportTickets, type SupportListFilter } from "../support/supportList";

const CATEGORIES = Object.keys(CATEGORY_LABEL) as SupportCategoryName[];

export function SupportPage() {
  const navigate = useNavigate();
  const { number = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const creating = params.get("new") === "1";
  const [items, setItems] = useState<SupportListItem[]>([]);
  const [detail, setDetail] = useState<SupportTicketDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [replying, setReplying] = useState(false);
  const [filter, setFilter] = useState<SupportListFilter>("all");
  const [query, setQuery] = useState("");

  const load = () => {
    void fetchMyTickets(50)
      .then((data) => setItems(data.items))
      .catch((e) => setError(toApiClientError(e).message));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!number) {
      setDetail(null);
      setDetailError(null);
      return;
    }
    let cancelled = false;
    setDetailError(null);
    void fetchMyTicket(number)
      .then((ticket) => {
        if (cancelled) return;
        setDetail(ticket);
        setItems((prev) =>
          prev.map((row) =>
            row.publicNumber === ticket.publicNumber
              ? { ...row, awaitingUser: false, status: ticket.status, lastActivityAt: ticket.lastActivityAt }
              : row
          )
        );
        emitUserSupportSeen();
      })
      .catch((e) => {
        if (!cancelled) {
          setDetail(null);
          setDetailError(toApiClientError(e).message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [number]);

  useEffect(() => {
    if (!creating) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setParams({});
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [creating, setParams]);

  const openComposer = () => setParams({ new: "1" });

  const submit = async (formEl: HTMLFormElement) => {
    const data = new FormData(formEl);
    const category = String(data.get("category") ?? "") as SupportCategoryName;
    const subject = String(data.get("subject") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const file = data.get("file");
    if (!subject || !message) {
      setFormError("Konu ve mesaj zorunludur.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const attachment = file instanceof File && file.size > 0 ? await fileToPayload(file) : null;
      const item = await createMyTicket({ category, subject, message, attachment });
      emitUserSupportSeen();
      setParams({});
      load();
      navigate(`/support/${item.publicNumber}`);
    } catch (e) {
      setFormError(e instanceof Error && e.message.includes("512") ? e.message : toApiClientError(e).message);
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async (formEl: HTMLFormElement) => {
    if (!detail) return;
    const data = new FormData(formEl);
    const message = String(data.get("message") ?? "").trim();
    const file = data.get("file");
    if (!message) {
      setDetailError("Mesaj zorunludur.");
      return;
    }
    setReplying(true);
    setDetailError(null);
    try {
      const attachment = file instanceof File && file.size > 0 ? await fileToPayload(file) : null;
      const next = await replyMyTicket(detail.publicNumber, { message, attachment });
      setDetail(next);
      setItems((prev) =>
        prev.map((row) =>
          row.publicNumber === next.publicNumber
            ? { ...row, awaitingUser: false, status: next.status, lastActivityAt: next.lastActivityAt, subject: next.subject }
            : row
        )
      );
      emitUserSupportSeen();
      formEl.reset();
    } catch (e) {
      setDetailError(e instanceof Error && e.message.includes("512") ? e.message : toApiClientError(e).message);
    } finally {
      setReplying(false);
    }
  };

  const visible = filterSupportTickets(items, filter, query);
  const files = detail?.messages.flatMap((message) => message.attachments) ?? [];

  return (
    <div className="app-workspace dashboard-workspace support-page">
      <div className="support-desk">
        <header className="support-desk-head">
          <div>
            <h1>Destek Taleplerim</h1>
            <p>Sorularınızı ve destek taleplerinizi buradan takip edebilirsiniz.</p>
          </div>
          <button type="button" className="support-desk-new" onClick={openComposer}>
            + Yeni Destek Talebi
          </button>
        </header>

        <div className="support-desk-tools">
          <div className="support-desk-filters" role="tablist" aria-label="Talep durumu">
            {SUPPORT_FILTERS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={filter === entry.id}
                className={filter === entry.id ? "is-active" : undefined}
                onClick={() => setFilter(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>
          <label className="support-desk-search">
            <span className="sr-only">Talep ara</span>
            <input
              type="search"
              value={query}
              placeholder="Talep no veya konu ara"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        {error ? <p className="support-desk-error">{error}</p> : null}

        <div className={number ? "support-board has-selection" : "support-board"}>
          <section className="support-col support-col-list" aria-label="Talepler">
            {items.length === 0 ? (
              <div className="support-desk-empty">
                <p>Henüz destek talebiniz yok.</p>
                <button type="button" className="support-desk-new" onClick={openComposer}>
                  Yeni Destek Talebi
                </button>
              </div>
            ) : visible.length === 0 ? (
              <p className="support-desk-empty">Bu filtreye uygun talep yok.</p>
            ) : (
              visible.map((item) => (
                <button
                  key={item.publicNumber}
                  type="button"
                  className={[
                    "support-row",
                    item.publicNumber === number ? "is-selected" : "",
                    item.awaitingUser ? "is-unread" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => navigate(`/support/${item.publicNumber}`)}
                >
                  <span className="support-row-no">{item.publicNumber}</span>
                  <span className="support-row-subject">{item.subject}</span>
                  <span className="support-row-meta">
                    {item.categoryLabel} · {formatNotifyTime(item.lastActivityAt)}
                  </span>
                  <span className="support-row-badges">
                    {item.awaitingUser ? <span className="support-badge support-badge-new">Yeni yanıt</span> : null}
                    <span className={`support-badge support-badge-${item.status.toLowerCase()}`}>
                      {SUPPORT_BADGE_LABEL[item.status]}
                    </span>
                  </span>
                </button>
              ))
            )}
          </section>

          <section className="support-col support-col-thread" aria-label="Konuşma">
            {!number ? (
              <p className="support-thread-empty">Görüntülemek için bir destek talebi seçin.</p>
            ) : !detail ? (
              <p className="support-thread-empty">{detailError ?? "Talep yükleniyor…"}</p>
            ) : (
              <>
                <header className="support-thread-head">
                  <button type="button" className="support-back" onClick={() => navigate("/support")}>
                    ← Talepler
                  </button>
                  <div>
                    <p className="support-row-no">{detail.publicNumber}</p>
                    <h2>{detail.subject}</h2>
                  </div>
                  <span className={`support-badge support-badge-${detail.status.toLowerCase()}`}>
                    {SUPPORT_BADGE_LABEL[detail.status]}
                  </span>
                </header>
                <div className="support-thread-log">
                  {detail.messages.map((message) => (
                    <article key={message.id} className={message.authorRole === "STAFF" ? "is-staff" : "is-user"}>
                      <p className="support-msg-meta">
                        {message.authorRole === "STAFF" ? "Destek" : "Siz"} · {formatNotifyTime(message.createdAt)}
                      </p>
                      <p className="support-msg-body">{message.body}</p>
                      {message.attachments.length > 0 ? (
                        <div className="support-msg-files">
                          {message.attachments.map((file) => (
                            <button
                              key={file.id}
                              type="button"
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
                {detailError ? <p className="support-desk-error">{detailError}</p> : null}
                {detail.closed ? (
                  <p className="support-closed">{detail.closedMessage}</p>
                ) : (
                  <form
                    className="support-reply"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void sendReply(event.currentTarget);
                    }}
                  >
                    <textarea name="message" rows={3} maxLength={8000} placeholder="Yanıtınız" />
                    <div className="support-reply-actions">
                      <label>
                        Dosya seç
                        <input name="file" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" />
                      </label>
                      <button type="submit" className="support-desk-new" disabled={replying}>
                        {replying ? "Gönderiliyor" : "Yanıtla"}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </section>

          <aside className="support-col support-col-meta" aria-label="Talep bilgileri">
            {!detail ? (
              <p className="support-meta-empty">Talep bilgisi için listeden bir kayıt seçin.</p>
            ) : (
              <>
                <h2>Talep bilgileri</h2>
                <dl>
                  <div>
                    <dt>Talep numarası</dt>
                    <dd>{detail.publicNumber}</dd>
                  </div>
                  <div>
                    <dt>Durum</dt>
                    <dd>{SUPPORT_BADGE_LABEL[detail.status]}</dd>
                  </div>
                  <div>
                    <dt>Kategori</dt>
                    <dd>{detail.categoryLabel}</dd>
                  </div>
                  <div>
                    <dt>Oluşturulma</dt>
                    <dd>{formatNotifyTime(detail.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Son hareket</dt>
                    <dd>{formatNotifyTime(detail.lastActivityAt)}</dd>
                  </div>
                </dl>
                <h3>Ek dosyalar</h3>
                {files.length === 0 ? (
                  <p className="support-meta-empty">Dosya yok.</p>
                ) : (
                  <ul className="support-file-list">
                    {files.map((file) => (
                      <li key={file.id}>
                        <button type="button" onClick={() => void downloadSupportFile(file.id, file.fileName)}>
                          {file.fileName}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </aside>
        </div>
      </div>

      {creating ? (
        <div className="support-drawer-root">
          <button type="button" className="support-drawer-backdrop" aria-label="Kapat" onClick={() => setParams({})} />
          <aside className="support-drawer" role="dialog" aria-modal="true" aria-labelledby="support-drawer-title">
            <header className="support-drawer-head">
              <h2 id="support-drawer-title">Yeni Destek Talebi</h2>
              <button type="button" onClick={() => setParams({})}>
                Kapat
              </button>
            </header>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void submit(event.currentTarget);
              }}
            >
              <p className="support-drawer-note">
                Hesaplama sonucuna ilişkin destek taleplerinde lütfen ilgili dosya adını ve karşılaştırdığınız sonucu belirtiniz.
              </p>
              {formError ? <p className="support-desk-error">{formError}</p> : null}
              <label>
                Kategori
                <select name="category">
                  {CATEGORIES.map((id) => (
                    <option key={id} value={id}>
                      {CATEGORY_LABEL[id]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Konu
                <input name="subject" maxLength={160} />
              </label>
              <label>
                Mesaj
                <textarea name="message" rows={6} maxLength={8000} />
              </label>
              <label>
                Ekran görüntüsü veya dosya (isteğe bağlı, PNG/JPEG/WEBP/PDF, en fazla 512 KB)
                <input name="file" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" />
              </label>
              <button type="submit" className="support-desk-new" disabled={busy}>
                {busy ? "Gönderiliyor" : "Talebi Gönder"}
              </button>
            </form>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
