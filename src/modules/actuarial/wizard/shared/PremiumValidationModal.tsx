import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type PremiumValidationSeverity = "error" | "warning";

export interface PremiumValidationModalProps {
  open?: boolean;
  title: string;
  description: string;
  severity?: PremiumValidationSeverity;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  children?: ReactNode;
}

const EXIT_MS = 140;

function AlertIcon({ severity }: { severity: PremiumValidationSeverity }) {
  const isError = severity === "error";
  return (
    <span
      className={`premium-validation-icon premium-validation-stagger-icon shrink-0 flex h-12 w-12 items-center justify-center rounded-full border ${
        isError
          ? "premium-validation-icon--error"
          : "premium-validation-icon--warning"
      }`}
      aria-hidden
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      </svg>
    </span>
  );
}

export function PremiumValidationModal({
  open = true,
  title,
  description,
  severity = "error",
  confirmLabel = "Tamam",
  cancelLabel,
  confirmDisabled = false,
  onConfirm,
  onCancel,
  children,
}: PremiumValidationModalProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [exiting, setExiting] = useState(false);
  const [visible, setVisible] = useState(open);

  const runExit = useCallback(
    (action: () => void) => {
      if (exiting) return;
      setExiting(true);
      window.setTimeout(() => {
        setVisible(false);
        setExiting(false);
        action();
      }, EXIT_MS);
    },
    [exiting]
  );

  const handleConfirm = useCallback(() => {
    if (confirmDisabled) return;
    runExit(onConfirm);
  }, [confirmDisabled, onConfirm, runExit]);

  const handleCancel = useCallback(() => {
    runExit(onCancel ?? onConfirm);
  }, [onCancel, onConfirm, runExit]);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setExiting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!visible || exiting) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancel();
      }
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    panel?.addEventListener("keydown", onTab);
    const focusTimer = window.setTimeout(() => {
      if (confirmDisabled && cancelLabel) {
        const cancelBtn = panel?.querySelector<HTMLButtonElement>("[data-premium-cancel]");
        cancelBtn?.focus();
      } else {
        confirmRef.current?.focus();
      }
    }, 60);

    return () => {
      document.removeEventListener("keydown", onKey);
      panel?.removeEventListener("keydown", onTab);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [visible, exiting, handleCancel, cancelLabel, confirmDisabled]);

  if (!visible) return null;

  const isError = severity === "error";
  const hasCancel = Boolean(cancelLabel);

  return (
    <div className="premium-validation-root fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        className={`premium-validation-backdrop absolute inset-0 border-0 ${
          exiting ? "premium-validation-backdrop--exit" : ""
        }`}
        aria-label="Kapat"
        onClick={handleCancel}
      />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={`premium-validation-panel relative flex w-full flex-col overflow-hidden ${
          exiting ? "premium-validation-panel--exit" : ""
        } ${isError ? "premium-validation-panel--error" : "premium-validation-panel--warning"}`}
      >
        <div
          className={`premium-validation-accent ${
            isError ? "premium-validation-accent--error" : "premium-validation-accent--warning"
          }`}
          aria-hidden
        />

        <div className="premium-validation-body px-5 pt-5 pb-5 sm:px-6 sm:pt-6 sm:pb-6">
          <div className="flex items-start gap-4">
            <AlertIcon severity={severity} />
            <div className="min-w-0 flex-1 pt-0.5">
              <h2
                id={titleId}
                className={`premium-validation-stagger-title text-[17px] font-semibold leading-[1.35] tracking-[-0.01em] ${
                  isError ? "text-[#7F1D1D]" : "text-amber-900"
                }`}
              >
                {title}
              </h2>
              <p
                id={descId}
                className={`premium-validation-stagger-desc mt-1.5 text-[13px] font-normal leading-[1.55] ${
                  isError ? "text-[#B45353]" : "text-amber-800/90"
                }`}
              >
                {description}
              </p>
              {children ? (
                <div className="premium-validation-stagger-children mt-4">{children}</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="premium-validation-footer premium-validation-stagger-footer">
          <div
            className={`flex w-full gap-2.5 ${
              hasCancel ? "flex-col-reverse sm:flex-row sm:justify-end" : "justify-end"
            }`}
          >
            {hasCancel && (
              <button
                type="button"
                data-premium-cancel
                onClick={handleCancel}
                className="premium-validation-btn-secondary w-full sm:w-auto sm:min-w-[100px]"
              >
                {cancelLabel}
              </button>
            )}
            <button
              ref={confirmRef}
              type="button"
              disabled={confirmDisabled}
              onClick={handleConfirm}
              className="premium-validation-btn-primary w-full sm:w-auto"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
