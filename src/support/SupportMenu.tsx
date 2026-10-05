import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatNotifyTime, unreadBadgeLabel } from "../notifications/notificationApi";
import { useLiveRefresh } from "./liveRefresh";
import { STATUS_LABEL, fetchMyTickets, onUserSupportChanged, type SupportListItem } from "./supportApi";

export function SupportMenu() {
  const navigate = useNavigate();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<SupportListItem[]>([]);

  const refresh = () =>
    fetchMyTickets(5)
      .then((data) => {
        setItems(data.items);
        setCount(data.unreadCount);
      })
      .catch(() => {
        setItems([]);
        setCount(0);
      });

  const kick = useLiveRefresh(refresh);

  useEffect(() => onUserSupportChanged(kick), [kick]);

  useEffect(() => {
    if (!open) return;
    kick();
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

  const list = Array.isArray(items) ? items : [];
  const badge = unreadBadgeLabel(count);
  const label = count > 0 ? `Destek, ${count} okunmamış yanıt` : "Destek";

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="header-notify-btn"
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {badge ? <span className="header-notify-badge">{badge}</span> : null}
      </button>
      {open ? (
        <div id={panelId} className="notify-panel" role="dialog" aria-label="Destek talepleri">
          <div className="notify-panel-head flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-3 py-2.5">
            <p className="text-[13.5px] font-semibold">Destek</p>
            <button
              type="button"
              className="text-[12px] font-medium text-[var(--color-primary)]"
              onClick={() => {
                setOpen(false);
                navigate("/support?new=1");
              }}
            >
              Yeni Destek Talebi
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {list.length === 0 ? (
              <p className="px-3 py-8 text-center text-[13px] text-[var(--color-muted)]">Destek talebi yok</p>
            ) : (
              list.map((item) => (
                <button
                  key={item.publicNumber}
                  type="button"
                  className="notify-row flex w-full flex-col gap-0.5 border-b border-[var(--color-border)] px-3 py-2.5 text-left"
                  onClick={() => {
                    setOpen(false);
                    navigate(`/support/${item.publicNumber}`);
                  }}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold text-[var(--color-primary)]">{item.publicNumber}</span>
                    <span className="text-[11px] text-[var(--color-muted)]">{STATUS_LABEL[item.status]}</span>
                  </span>
                  <span className="truncate text-[13px] font-medium">{item.subject}</span>
                  <span className="text-[11px] text-[var(--color-muted)]">{formatNotifyTime(item.lastActivityAt)}</span>
                </button>
              ))
            )}
          </div>
          <button
            type="button"
            className="border-t border-[var(--color-border)] px-3 py-2.5 text-left text-[12.5px] font-medium text-[var(--color-primary)]"
            onClick={() => {
              setOpen(false);
              navigate("/support");
            }}
          >
            Tüm Taleplerim
          </button>
        </div>
      ) : null}
    </div>
  );
}
