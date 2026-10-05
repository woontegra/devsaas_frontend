import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TYPE_LABEL,
  fetchNotifications,
  fetchUnreadCount,
  formatNotifyTime,
  markAllNotificationsRead,
  markNotificationRead,
  onNotificationsChanged,
  notificationTarget,
  unreadBadgeLabel,
  type UserNotification,
} from "./notificationApi";

export function NotificationBell() {
  const navigate = useNavigate();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<UserNotification[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const refreshCount = () => {
    void fetchUnreadCount()
      .then(setCount)
      .catch(() => setCount(0));
  };

  useEffect(() => {
    refreshCount();
    return onNotificationsChanged(refreshCount);
  }, []);

  useEffect(() => {
    if (!open) return;
    void fetchNotifications({ page: 1, pageSize: 8 })
      .then((data) => {
        setItems(data.items);
        setCount(data.unreadCount);
      })
      .catch(() => setItems([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label =
    count > 0 ? `Bildirimler, ${count} okunmamış bildirim` : "Bildirimler";
  const badge = unreadBadgeLabel(count);
  const list = Array.isArray(items) ? items : [];
  const active = list.find((item) => item.id === activeId) ?? null;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="header-notify-btn"
        aria-label={label}
        title={count > 0 ? `${count} okunmamış bildirim` : "Bildirimler"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" />
        </svg>
        {badge ? <span className="header-notify-badge">{badge}</span> : null}
      </button>

      {open ? (
        <div id={panelId} className="notify-panel" role="dialog" aria-label="Bildirimler">
          <div className="notify-panel-head flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-3 py-2.5">
            <p className="text-[13.5px] font-semibold">Bildirimler</p>
            <button
              type="button"
              className="text-[12px] font-medium text-[var(--color-primary)] disabled:opacity-40"
              disabled={count === 0}
              onClick={() => void markAllNotificationsRead().then(() => fetchNotifications({ page: 1, pageSize: 8 }).then((d) => {
                setItems(d.items);
                setCount(d.unreadCount);
              }))}
            >
              Tümünü okundu işaretle
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {active ? (
              <div className="px-3 py-3">
                <button type="button" className="mb-2 text-[12px] text-[var(--color-muted)]" onClick={() => setActiveId(null)}>
                  ← Liste
                </button>
                <p className="text-[11px] font-medium text-[var(--color-muted)]">{TYPE_LABEL[active.type]}</p>
                <h3 className="mt-1 text-[14px] font-semibold">{active.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--color-text)]">{active.content}</p>
                <p className="mt-2 text-[11.5px] text-[var(--color-muted)]">{formatNotifyTime(active.publishedAt)}</p>
              </div>
            ) : list.length === 0 ? (
              <p className="px-3 py-8 text-center text-[13px] text-[var(--color-muted)]">Bildirim yok</p>
            ) : (
              list.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`notify-row flex w-full gap-2 border-b border-[var(--color-border)] px-3 py-2.5 text-left ${item.read ? "" : "is-unread"}`}
                  onClick={() => {
                    const target = notificationTarget(item.linkPath);
                    if (!item.read) {
                      void markNotificationRead(item.id, true).then(() => {
                        setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, read: true } : row)));
                        setCount((c) => Math.max(0, c - 1));
                      });
                    }
                    if (target) {
                      setOpen(false);
                      navigate(target);
                      return;
                    }
                    setActiveId(item.id);
                  }}
                >
                  <span className="mt-0.5 text-[11px] font-semibold text-[var(--color-primary)]">{TYPE_LABEL[item.type].slice(0, 1)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{item.title}</span>
                    <span className="mt-0.5 block truncate text-[12px] text-[var(--color-muted)]">{item.summary}</span>
                    <span className="mt-1 block text-[11px] text-[var(--color-muted)]">{formatNotifyTime(item.publishedAt)}</span>
                  </span>
                  {!item.read ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" aria-hidden /> : null}
                </button>
              ))
            )}
          </div>
          <button
            type="button"
            className="border-t border-[var(--color-border)] px-3 py-2.5 text-[12.5px] font-medium text-[var(--color-primary)]"
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
          >
            Tüm Bildirimleri Gör
          </button>
        </div>
      ) : null}
    </div>
  );
}
