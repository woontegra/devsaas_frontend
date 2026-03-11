import { uiText } from "../../config/uiText";
import type { ActuarialResultPayload } from "../../services/api";

const t = uiText.result;
const fmt = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 2 });

interface WorkInjuryBreakdownProps {
  result: ActuarialResultPayload;
}

/**
 * İş kazası yaralanma sonucu: Geçici, Sürekli, Bakıcı, Toplam.
 */
export function WorkInjuryBreakdown({ result }: WorkInjuryBreakdownProps) {
  const totalComp = result.totalCompensation ?? result.presentCapitalValue;
  const temp = result.temporaryDisabilityAmount ?? 0;
  const perm = result.permanentDisabilityAmount ?? 0;
  const care = result.caregiverCostAmount ?? 0;

  const rows = [
    { label: t.temporaryDisabilityLabel, value: temp },
    { label: t.permanentDisabilityLabel, value: perm },
    { label: t.caregiverCostLabel, value: care },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-3 py-2.5 border-b border-gray-100">
        <h3 className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
          İş Kazası Yaralanma — Kalemler
        </h3>
      </div>
      <div className="divide-y divide-gray-50">
        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="flex justify-between items-center px-3 py-2"
          >
            <span className="text-[12px] font-[300] text-gray-600">{label}</span>
            <span className="text-[13px] font-[300] text-gray-900 tabular-nums">
              {fmt(value)} ₺
            </span>
          </div>
        ))}
        <div className="flex justify-between items-center px-3 py-2.5 bg-gray-50/80">
          <span className="text-[12px] font-medium text-gray-800">
            {t.totalCompensationLabel}
          </span>
          <span className="text-[15px] font-[500] text-app-primary tabular-nums">
            {fmt(totalComp)} ₺
          </span>
        </div>
      </div>
    </div>
  );
}
