import type { ActuarialResultPayload } from "../../services/api";

interface CaseMetadataProps {
  result: ActuarialResultPayload | null;
}

function MetaRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-b-0">
      <span className="text-[12px] text-gray-500">{label}</span>
      <span className="text-[12px] font-medium text-gray-800 tabular-nums">{value}</span>
    </div>
  );
}

export function CaseMetadata({ result }: CaseMetadataProps) {
  if (!result) {
    return (
      <div className="bg-white rounded-lg shadow-[0_1px_8px_rgba(0,0,0,0.05)] border border-gray-100 p-4 min-h-[120px]">
        <p className="text-[11px] font-semibold text-app-primary uppercase tracking-wider mb-3">Dava parametreleri</p>
        <p className="text-[12px] text-gray-400">Hesaplanan değerler burada görünür</p>
      </div>
    );
  }

  const d = new Date(result.metadata.calculatedAt);
  const dateStr = d.toLocaleDateString("tr-TR", { dateStyle: "medium" });
  const timeStr = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-white rounded-lg shadow-[0_1px_8px_rgba(0,0,0,0.05)] border border-gray-100 p-4 transition-all duration-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <p className="text-[11px] font-semibold text-app-primary uppercase tracking-wider mb-3">Dava parametreleri</p>
      <div className="space-y-0">
        <MetaRow label="Faiz oranı" value={`${(result.metadata.interestRate * 100).toFixed(2)}%`} />
        <MetaRow label="Ücret artışı" value={`${(result.metadata.wageIncreaseRate * 100).toFixed(2)}%`} />
        <MetaRow label="Maluliyet oranı" value={`${result.metadata.disabilityRate}%`} />
        <MetaRow label="Kaza anında yaş" value={result.ageAtAccident.toFixed(2)} />
        <MetaRow label="Aktif dönem" value={`${result.activePeriodYears} yıl`} />
        <MetaRow label="Pasif dönem" value={`${result.passivePeriodYears} yıl`} />
        <MetaRow label="Hesaplanma" value={`${dateStr} ${timeStr}`} />
      </div>
    </div>
  );
}
