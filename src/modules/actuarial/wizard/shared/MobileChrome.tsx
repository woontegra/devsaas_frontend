import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** ESC / dışarı tık ile kapanan kompakt menü */
export function DropdownMenu({
  trigger,
  children,
  align = "right",
  labelledBy,
}: {
  trigger: (props: {
    open: boolean;
    setOpen: (v: boolean) => void;
    buttonProps: {
      "aria-expanded": boolean;
      "aria-haspopup": "menu";
      "aria-controls": string;
      onClick: () => void;
    };
    buttonRef: React.RefCallback<HTMLButtonElement>;
  }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  labelledBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || buttonRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  const setButtonRef = (node: HTMLButtonElement | null) => {
    buttonRef.current = node;
  };

  return (
    <div className="relative inline-flex">
      {trigger({
        open,
        setOpen,
        buttonProps: {
          "aria-expanded": open,
          "aria-haspopup": "menu",
          "aria-controls": menuId,
          onClick: () => setOpen((v) => !v),
        },
        buttonRef: setButtonRef,
      })}
      {open && (
        <div
          ref={panelRef}
          id={menuId}
          role="menu"
          aria-labelledby={labelledBy}
          className={`absolute top-full z-50 mt-1.5 min-w-[200px] rounded-[11px] border border-[#D9E5E3] bg-white py-1 shadow-[0_6px_20px_rgba(15,95,99,0.1)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`w-full text-left px-3.5 py-2.5 text-[13px] font-medium min-h-[44px] ${
        danger ? "text-red-600 hover:bg-red-50" : "text-[#22313F] hover:bg-[#EAF4F3]/60"
      }`}
    >
      {children}
    </button>
  );
}

/** Bottom sheet — body scroll kilidi + ESC */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 border-0 cursor-default"
        aria-label="Kapat"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 max-h-[85vh] rounded-t-[16px] bg-white shadow-[0_-8px_32px_rgba(15,23,42,0.12)] flex flex-col outline-none pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex justify-center pt-2.5" aria-hidden>
          <span className="w-10 h-1 rounded-full bg-slate-200" />
        </div>
        <div className="flex items-center justify-between px-4 pb-2">
          <h2 id={titleId} className="text-[15px] font-medium text-slate-800">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[10px] text-slate-500 hover:bg-slate-50 text-[13px] font-medium"
          >
            Kapat
          </button>
        </div>
        <div className="overflow-y-auto px-3 py-1 flex-1 border-t border-slate-100">{children}</div>
      </div>
    </div>
  );
}
