export function UnsavedChangesSheet({
  open,
  saving,
  error,
  onExit,
  onSave,
  onDismiss,
}: {
  open: boolean;
  saving?: boolean;
  error?: string | null;
  onExit: () => void;
  onSave: () => void;
  onDismiss: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <button type="button" className="absolute inset-0" aria-label="Kapat" onClick={onDismiss} />
      <div
        className="relative w-full max-w-md rounded-[12px] border border-[#DCE3E8] bg-white px-5 pt-5 pb-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-changes-title"
      >
        <h3 id="unsaved-changes-title" className="text-[16px] font-semibold text-[#1F2933]">
          Kaydedilmemiş bilgiler
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-[#1F2933]">
          Kaydedilmemiş bilgileriniz var. Kaydetmek istiyor musunuz?
        </p>
        {error ? <p className="mt-2 text-[13px] text-red-600">{error}</p> : null}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            className="btn-secondary min-h-[44px] flex-1"
            onClick={onExit}
            disabled={saving}
          >
            Çık
          </button>
          <button
            type="button"
            className="btn-primary min-h-[44px] flex-1 disabled:opacity-50"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
