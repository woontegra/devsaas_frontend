import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { SALES_CHECKOUT_CONFIG } from "../config/salesCheckout";

export function SalesInfoModal({
  open,
  onClose,
  title = SALES_CHECKOUT_CONFIG.infoTitle,
  message = SALES_CHECKOUT_CONFIG.infoMessage,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}) {
  const titleId = useId();
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0F1E30]/45 p-4"
      onClick={onClose}
    >
      <div
        className="account-surface w-full max-w-[420px] rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="m-0 text-[16px] font-semibold text-[var(--color-text)]">
          {title}
        </h2>
        <p className="mt-2.5 text-[13.5px] leading-relaxed text-[var(--color-muted)]">{message}</p>
        <div className="mt-4 flex justify-end">
          <button type="button" className="btn-primary min-h-[36px] px-4" onClick={onClose}>
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
}

/** CTA: satış kapalıysa bilgi modalı; açıkysa checkout */
export function useSalesCta() {
  const [open, setOpen] = useState(false);
  const trigger = () => {
    if (SALES_CHECKOUT_CONFIG.enabled && SALES_CHECKOUT_CONFIG.checkoutUrl) {
      window.location.href = SALES_CHECKOUT_CONFIG.checkoutUrl;
      return;
    }
    setOpen(true);
  };
  return {
    trigger,
    modal: <SalesInfoModal open={open} onClose={() => setOpen(false)} />,
  };
}

export function PasswordVisibilityToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[6px] px-2 py-1 text-[12px] font-medium text-[var(--color-muted)] hover:bg-[var(--color-primary-soft)]"
      aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
    >
      {visible ? "Gizle" : "Göster"}
    </button>
  );
}

export function AccountCard({
  title,
  children,
  actions,
  padded = true,
}: {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  padded?: boolean;
}) {
  return (
    <section className="account-surface rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-2.5">
          {title ? (
            <h2 className="m-0 text-[14px] font-semibold text-[var(--color-text)]">{title}</h2>
          ) : (
            <span />
          )}
          {actions}
        </div>
      )}
      <div className={padded ? "px-4 py-4" : undefined}>{children}</div>
    </section>
  );
}

export function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);
  return ref;
}
