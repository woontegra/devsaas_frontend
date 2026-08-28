import { uiText } from "../../../config/uiText";
import type { ActuarialResultPayload } from "../../../services/api";

const t = uiText.result;
import { formatTRY } from "./shared/FormPrimitives";
const fmt = formatTRY;

interface Step5ResultProps {
  result: ActuarialResultPayload | null;
  loading?: boolean;
}

export function Step5Result({ result, loading }: Step5ResultProps) {
  if (loading) {
    return (
      <div className="py-8 text-center text-gray-500">
        <p className="text-sm">{uiText.wizard.calculating}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="py-8 text-center">
        <p className="text-[13px] text-gray-400">{t.runCalculation}</p>
      </div>
    );
  }

  const { breakdown, presentCapitalValue } = result;

  return (
    <div className="space-y-4">
      <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
        {t.title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">
            {t.pastPeriodValue}
          </p>
          <p className="text-base font-semibold text-gray-900 tabular-nums">
            —
          </p>
        </div>
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">
            {t.futureActivePeriod}
          </p>
          <p className="text-base font-semibold text-gray-900 tabular-nums">
            {fmt(breakdown.activePeriodPV)}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">
            {t.futurePassivePeriod}
          </p>
          <p className="text-base font-semibold text-gray-900 tabular-nums">
            {fmt(breakdown.passivePeriodPV)}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
          <p className="text-[10px] font-medium text-blue-600 uppercase tracking-wider mb-0.5">
            {t.totalPSD}
          </p>
          <p className="text-lg font-bold text-blue-900 tabular-nums">
            {fmt(presentCapitalValue)}
          </p>
        </div>
      </div>
    </div>
  );
}
