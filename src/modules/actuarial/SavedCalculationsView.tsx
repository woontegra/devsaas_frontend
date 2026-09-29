import { useCallback, useEffect, useState } from "react";
import { deleteSavedCalculation, listSavedCalculations } from "../../services/api";
import type { CalculationType } from "./types/calculationDraft";
import { CALCULATION_TYPE_LABELS } from "./types/calculationDraft";
import type { SavedCalculationListItem } from "./types/savedCalculation";

function formatDisplayDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}.${m[2]}.${m[1]}`;
  const d = new Date(iso);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("tr-TR");
  }
  return iso;
}

function statusLabel(status: string): string {
  if (status === "DRAFT") return "Taslak";
  if (status === "COMPLETED") return "Tamamlandı";
  return status;
}

function fileNameFor(item: SavedCalculationListItem): string {
  if (item.calculationType === "TRAFFIC_DEATH") {
    return item.displayName?.trim() || item.title?.trim() || "—";
  }
  return item.title?.trim() || item.displayName?.trim() || "—";
}

function subjectNameFor(item: SavedCalculationListItem): string {
  if (item.subjectName?.trim()) return item.subjectName.trim();
  if (item.calculationType === "TRAFFIC_INJURY") {
    return item.displayName?.trim() || "—";
  }
  return "—";
}

function typeLabel(item: SavedCalculationListItem): string {
  const type = item.calculationType as CalculationType;
  return CALCULATION_TYPE_LABELS[type] ?? item.calculationType;
}

export function SavedCalculationsView({
  onOpen,
  onBack,
  savedListVersion = 0,
}: {
  onOpen: (id: string) => void;
  onBack: () => void;
  savedListVersion?: number;
}) {
  const [items, setItems] = useState<SavedCalculationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    listSavedCalculations()
      .then((res) => setItems(res.items))
      .catch(() => {
        setItems([]);
        setError("Kayıtlı dosyalar yüklenemedi.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, savedListVersion]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu kayıtlı dosya silinsin mi?")) return;
    try {
      await deleteSavedCalculation(id);
      refresh();
    } catch {
      setError("Dosya silinemedi.");
    }
  };

  return (
    <div className="w-full pb-6">
      <header className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-2 text-[13px] font-medium text-[#66727F] hover:text-[#243746] min-h-[36px]"
          >
            ← Geri
          </button>
          <h1 className="ui-page-title">Kayıtlı Hesaplamalar</h1>
          <p className="ui-page-subtitle mt-1">Kalıcı olarak kaydedilmiş dosyalarınız</p>
        </div>
      </header>

      {error && (
        <div className="mb-3 accent-warning-surface px-3.5 py-2.5 text-[13px]">{error}</div>
      )}

      <div className="ui-panel-mock">
        {loading ? (
          <p className="ui-caption text-center py-10">Kayıtlar yükleniyor…</p>
        ) : items.length === 0 ? (
          <div className="ui-empty-state-mock py-12">
            <p className="ui-empty-title">Henüz kayıtlı dosya yok</p>
            <p className="ui-empty-desc mt-1">
              Tamamlanan veya kaydedilen hesaplamalar burada listelenir.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#DCE3E8] bg-[#F5F7FA]">
                  <th className="px-3 py-2.5 font-medium text-[#66727F]">Dosya adı</th>
                  <th className="px-3 py-2.5 font-medium text-[#66727F]">Hesap türü</th>
                  <th className="px-3 py-2.5 font-medium text-[#66727F]">Kişi</th>
                  <th className="px-3 py-2.5 font-medium text-[#66727F]">Olay tarihi</th>
                  <th className="px-3 py-2.5 font-medium text-[#66727F]">Son güncelleme</th>
                  <th className="px-3 py-2.5 font-medium text-[#66727F]">Durum</th>
                  <th className="px-3 py-2.5 font-medium text-[#66727F] text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-[#DCE3E8]/80 hover:bg-[#F8FAFB]">
                    <td className="px-3 py-2.5 font-medium text-[#1F2933]">{fileNameFor(item)}</td>
                    <td className="px-3 py-2.5 text-[#1F2933]">{typeLabel(item)}</td>
                    <td className="px-3 py-2.5 text-[#1F2933]">{subjectNameFor(item)}</td>
                    <td className="px-3 py-2.5 text-[#1F2933] tabular-nums">
                      {formatDisplayDate(item.eventDate)}
                    </td>
                    <td className="px-3 py-2.5 text-[#1F2933] tabular-nums">
                      {formatDisplayDate(item.updatedAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11.5px] font-medium ${
                          item.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-900 border border-amber-200"
                        }`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onOpen(item.id)}
                          className="btn-secondary min-h-[34px] px-3 text-[12.5px]"
                        >
                          Aç
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(item.id)}
                          className="min-h-[34px] px-3 text-[12.5px] font-medium text-red-600 hover:text-red-700"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
