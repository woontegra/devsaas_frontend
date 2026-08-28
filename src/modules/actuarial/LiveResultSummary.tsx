import { useEffect, useState } from "react";
import type { ActuarialResultPayload } from "../../services/api";

import { formatTRY } from "./wizard/shared/FormPrimitives";
const formatCurrency = formatTRY;

interface LiveResultSummaryProps {
  result: ActuarialResultPayload | null;
}

function useCountUp(value: number, duration = 600, enabled: boolean) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!enabled || value === 0) {
      setDisplay(value);
      return;
    }
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, duration, enabled]);
  return display;
}

function ResultRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-black/[0.08] last:border-b-0">
      <span className="text-[12px] text-gray-600">{label}</span>
      <span className="text-[12px] font-medium text-gray-900 tabular-nums">{value}</span>
    </div>
  );
}

export function LiveResultSummary({ result }: LiveResultSummaryProps) {
  const displayValue = useCountUp(result?.presentCapitalValue ?? 0, 600, !!result);
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    if (result) setFadeKey((k) => k + 1);
  }, [result?.presentCapitalValue]);

  if (!result) {
    return (
      <div className="bg-white rounded-xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] border border-gray-100 p-5 flex flex-col items-center justify-center min-h-[200px] transition-all duration-200">
        <p className="text-[12px] text-gray-400 text-center">Hesaplama yapıldığında sonuç burada görüntülenir</p>
      </div>
    );
  }

  return (
    <div
      key={fadeKey}
      className="bg-white rounded-xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] border border-gray-100 p-4 sm:p-5 transition-all duration-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] md:sticky md:top-20 animate-fade-in"
    >
      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        Toplam Tazminat
      </p>
      <p className="text-xl sm:text-2xl md:text-[26px] font-bold text-app-primary tabular-nums mb-5 leading-tight">
        {formatCurrency(displayValue)}
      </p>
      <div>
        <ResultRow label="Aktif dönem değeri" value={formatCurrency(result.breakdown.activePeriodPV)} />
        <ResultRow label="Pasif dönem değeri" value={formatCurrency(result.breakdown.passivePeriodPV)} />
        <ResultRow label="İndirim faktörü" value={result.discountFactor.toFixed(4)} />
        <ResultRow label="Bugünkü değer" value={formatCurrency(result.presentCapitalValue)} />
      </div>
    </div>
  );
}
