import { uiText } from "../../../config/uiText";
import type { CalculationType } from "../types/caseFormTypes";

const t = uiText.calculationType;
const labels: Record<CalculationType, string> = {
  TRAFFIC_DEATH: t.trafficDeath,
  TRAFFIC_INJURY: t.trafficInjury,
  WORK_DEATH: t.workDeath,
  WORK_INJURY: t.workInjury,
};

const types: CalculationType[] = [
  "TRAFFIC_DEATH",
  "TRAFFIC_INJURY",
  "WORK_DEATH",
  "WORK_INJURY",
];

export interface Step0CalculationTypeProps {
  value: CalculationType;
  onChange: (type: CalculationType) => void;
}

export function Step0CalculationType({ value, onChange }: Step0CalculationTypeProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
        {t.title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {types.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`text-left px-3 py-2.5 rounded-lg border text-[13px] font-light transition-colors ${
              value === type
                ? "border-app-primary bg-app-primary/5 text-app-primary"
                : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {labels[type]}
          </button>
        ))}
      </div>
    </div>
  );
}
