import { useEffect, useState } from "react";
import {
  dismissNotification,
  fetchCriticalBanners,
  formatNotifyTime,
  onNotificationsChanged,
  type UserNotification,
} from "./notificationApi";

export function CriticalBanner() {
  const [items, setItems] = useState<UserNotification[]>([]);

  const load = () => {
    void fetchCriticalBanners()
      .then(setItems)
      .catch(() => setItems([]));
  };

  useEffect(() => {
    load();
    return onNotificationsChanged(load);
  }, []);

  const item = items[0];
  if (!item) return null;

  return (
    <div className="app-workspace">
      <div className="notify-banner" role="status">
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold">Önemli</p>
          <p className="mt-0.5 text-[13px] leading-snug">{item.summary}</p>
          <p className="mt-1 text-[11.5px] text-[var(--color-muted)]">{formatNotifyTime(item.publishedAt)}</p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-[8px] px-2 py-1 text-[12px] text-[var(--color-muted)] hover:text-[var(--color-text)]"
          onClick={() => {
            setItems((prev) => prev.filter((row) => row.id !== item.id));
            void dismissNotification(item.id);
          }}
        >
          Kapat
        </button>
      </div>
    </div>
  );
}
