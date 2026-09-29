import { useEffect, useState } from "react";

export function SaveFileNameModal({
  open,
  initialName = "",
  title = "Dosyayı Kaydet",
  confirmLabel = "Kaydet",
  onConfirm,
  onClose,
  saving = false,
  error = null,
}: {
  open: boolean;
  initialName?: string;
  title?: string;
  confirmLabel?: string;
  onConfirm: (displayName: string) => void;
  onClose: () => void;
  saving?: boolean;
  error?: string | null;
}) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className="w-full max-w-md rounded-[12px] border border-[#DCE3E8] bg-white p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-file-title"
      >
        <h3 id="save-file-title" className="text-[16px] font-semibold text-[#1F2933]">
          {title}
        </h3>
        <p className="mt-1 text-[13px] text-[#66727F]">
          Dosyanız kalıcı olarak kaydedilecek. Dosya adı zorunludur.
        </p>
        <label className="mt-4 block text-[13px] font-medium text-[#1F2933]">
          Dosya Adı
          <input
            type="text"
            className="mt-1.5 w-full rounded-[10px] border border-[#DCE3E8] px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#243746]/20"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn. Ahmet Yılmaz Trafik Kazası"
            autoFocus
          />
        </label>
        {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondary min-h-[40px] px-4" onClick={onClose} disabled={saving}>
            İptal
          </button>
          <button
            type="button"
            className="btn-primary min-h-[40px] px-4 disabled:opacity-50"
            disabled={saving || !name.trim()}
            onClick={() => onConfirm(name.trim())}
          >
            {saving ? "Kaydediliyor…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
