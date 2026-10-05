import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TYPE_LABEL,
  fetchNotifications,
  formatNotifyTime,
  markAllNotificationsRead,
  markNotificationRead,
  notificationTarget,
  type NotificationTypeName,
  type UserNotification,
} from "../notifications/notificationApi";

const FILTERS: Array<{ id: string; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "unread", label: "Okunmamış" },
  { id: "UPDATE", label: "Güncellemeler" },
  { id: "ANNOUNCEMENT", label: "Duyurular" },
];

export function NotificationsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<UserNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const pageSize = 15;

  const load = (nextPage = page, nextFilter = filter) => {
    void fetchNotifications({
      filter: nextFilter === "all" ? undefined : nextFilter,
      page: nextPage,
      pageSize,
    }).then((data) => {
      setItems(data.items);
      setTotal(data.total);
      setUnread(data.unreadCount);
    });
  };

  useEffect(() => {
    load(page, filter);
  }, [page, filter]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="app-workspace dashboard-workspace py-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--color-text)]">Bildirimler</h1>
          <p className="mt-1 text-[13px] text-[var(--color-muted)]">
            {unread > 0 ? `${unread} okunmamış` : "Okunmamış bildirim yok"}
          </p>
        </div>
        <button
          type="button"
          className="min-h-[36px] rounded-[8px] border border-[var(--color-border)] px-3 text-[12.5px] font-medium text-[var(--color-primary)]"
          onClick={() => void markAllNotificationsRead().then(() => load())}
        >
          Tümünü okundu işaretle
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`min-h-[34px] rounded-full border px-3 text-[12.5px] ${
              filter === f.id
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                : "border-[var(--color-border)] text-[var(--color-muted)]"
            }`}
            onClick={() => {
              setPage(1);
              setFilter(f.id);
              setOpenId(null);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]">
        {items.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] text-[var(--color-muted)]">Bu filtrede bildirim yok.</p>
        ) : (
          items.map((item) => {
            const open = openId === item.id;
            return (
              <article key={item.id} className={`notify-card border-b border-[var(--color-border)] last:border-b-0 ${item.read ? "" : "is-unread"}`}>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-4 py-3 text-left"
                  onClick={() => {
                    const target = notificationTarget(item.linkPath);
                    if (!item.read) {
                      void markNotificationRead(item.id, true).then(() => {
                        setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, read: true } : row)));
                        setUnread((n) => Math.max(0, n - 1));
                      });
                    }
                    if (target) {
                      navigate(target);
                      return;
                    }
                    setOpenId(open ? null : item.id);
                  }}
                >
                  <span className="mt-0.5 text-[12px] font-semibold text-[var(--color-primary)]">
                    {TYPE_LABEL[item.type as NotificationTypeName]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold text-[var(--color-text)]">{item.title}</span>
                    <span className="mt-0.5 block text-[12.5px] text-[var(--color-muted)]">{item.summary}</span>
                    <span className="mt-1 block text-[11.5px] text-[var(--color-muted)]">
                      {formatNotifyTime(item.publishedAt)}
                      {item.version ? ` · v${item.version}` : ""} · {item.read ? "Okundu" : "Okunmadı"}
                    </span>
                  </span>
                </button>
                {open ? (
                  <p className="whitespace-pre-wrap px-4 pb-3 text-[13px] leading-relaxed text-[var(--color-text)]">{item.content}</p>
                ) : null}
              </article>
            );
          })
        )}
      </div>

      {pages > 1 ? (
        <div className="mt-3 flex items-center justify-end gap-2 text-[12.5px]">
          <button type="button" disabled={page <= 1} className="min-h-[32px] px-2 disabled:opacity-40" onClick={() => setPage((p) => p - 1)}>
            Önceki
          </button>
          <span className="text-[var(--color-muted)]">
            {page} / {pages}
          </span>
          <button type="button" disabled={page >= pages} className="min-h-[32px] px-2 disabled:opacity-40" onClick={() => setPage((p) => p + 1)}>
            Sonraki
          </button>
        </div>
      ) : null}
    </div>
  );
}
