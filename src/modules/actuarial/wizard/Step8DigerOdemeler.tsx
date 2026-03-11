import { formTypography } from "../../../styles/formTypography";
import type { TrafficInjuryFormData } from "../types/trafficInjuryFormTypes";

export interface Step8DigerOdemelerProps {
  formData: TrafficInjuryFormData;
  onCalculate: () => void;
  loading?: boolean;
}

export function Step8DigerOdemeler({
  formData: _formData,
  onCalculate,
  loading = false,
}: Step8DigerOdemelerProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-800 dark:text-ds-text mb-2">
          Diğer Ödemeler
        </h3>
        <p className={formTypography.label}>
          Bu bölüm daha sonra doldurulacaktır.
        </p>
      </div>

      <div className="pt-6 flex justify-center">
        <button
          type="button"
          onClick={onCalculate}
          disabled={loading}
          className="px-8 py-3.5 text-[15px] font-semibold text-white bg-app-primary hover:bg-app-accent rounded-lg transition-colors min-w-[200px] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Hesaplanıyor…" : "Hesapla"}
        </button>
      </div>
    </div>
  );
}
