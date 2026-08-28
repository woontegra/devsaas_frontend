import { useState, useCallback, useEffect } from "react";
import { CurrencyInput } from "./shared/FormPrimitives";
import { formTypography } from "../../../styles/formTypography";
import type { EmsalUcretRow } from "../types/trafficInjuryFormTypes";

export interface EmsalUcretModalProps {
  open: boolean;
  onClose: () => void;
  /** Mevcut liste (modal açıldığında doldurulur) */
  initialList: EmsalUcretRow[];
  /** Uygula: ortalama ve güncel liste (isim + tutar) döner */
  onApply: (average: number, list: EmsalUcretRow[]) => void;
}

const inputClass =
  formTypography.input +
  " " +
  formTypography.inputHeight +
  " rounded-md border border-gray-200 dark:border-ds-border px-2.5 bg-white dark:bg-ds-input text-gray-800 dark:text-ds-text min-w-0";

export function EmsalUcretModal({
  open,
  onClose,
  initialList,
  onApply,
}: EmsalUcretModalProps) {
  const [rows, setRows] = useState<{ name: string; amount: string }[]>([]);

  useEffect(() => {
    if (open) {
      setRows(
        initialList.length > 0
          ? initialList.map((r) => ({
              name: r.name ?? "",
              amount: r.amount > 0 ? String(r.amount) : "",
            }))
          : [{ name: "", amount: "" }]
      );
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- sync only when modal opens

  const setRowAt = useCallback(
    (index: number, field: "name" | "amount", value: string) => {
      setRows((prev) => {
        const next = [...prev];
        next[index] = { ...next[index]!, [field]: value };
        return next;
      });
    },
    []
  );

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, { name: "", amount: "" }]);
  }, []);

  const removeAt = useCallback((index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleApply = useCallback(() => {
    const list: EmsalUcretRow[] = rows
      .map((r) => {
        const amount = parseFloat(r.amount.replace(/\s/g, "").replace(",", "."));
        if (Number.isNaN(amount) || amount <= 0) return null;
        return { name: r.name.trim() || "", amount };
      })
      .filter((r): r is EmsalUcretRow => r !== null);
    if (list.length === 0) {
      onApply(0, []);
    } else {
      const sum = list.reduce((a, b) => a + b.amount, 0);
      const average = Math.round((sum / list.length) * 100) / 100;
      onApply(average, list);
    }
    onClose();
  }, [rows, onApply, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="emsal-ucret-title"
    >
      <div
        className="bg-white dark:bg-ds-bg rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-ds-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 dark:border-ds-border">
          <h2
            id="emsal-ucret-title"
            className="text-[15px] font-semibold text-gray-800 dark:text-ds-text"
          >
            Emsal Ücret Girişi
          </h2>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div className="flex flex-col gap-3">
            {rows.map((row, index) => (
              <div key={index} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => setRowAt(index, "name", e.target.value)}
                    className={inputClass + " flex-1"}
                    placeholder="İsim (örn. Maaş, Prim)"
                    aria-label={`Ücret ${index + 1} ismi`}
                  />
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAt(index)}
                      className="shrink-0 h-9 px-2 text-[12px] text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      Sil
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className={formTypography.label + " w-16 shrink-0"}>
                    Tutar
                  </label>
                  <CurrencyInput
                    value={Number(row.amount) || 0}
                    onChange={(v) => setRowAt(index, "amount", String(v))}
                    className={inputClass + " flex-1"}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addRow}
            className="mt-4 w-full h-9 rounded-md border border-dashed border-gray-300 dark:border-ds-border text-[13px] text-gray-600 dark:text-ds-muted hover:bg-gray-50 dark:hover:bg-ds-input transition"
          >
            + Yeni Ücret Ekle
          </button>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-ds-border flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-gray-700 dark:text-ds-text bg-gray-100 dark:bg-ds-input hover:bg-gray-200 dark:hover:bg-ds-border rounded-lg transition"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 text-[13px] font-medium text-white bg-app-primary hover:bg-app-accent rounded-lg transition"
          >
            Uygula
          </button>
        </div>
      </div>
    </div>
  );
}
