import { Input } from "../../../components/ui/Input";
import { formTypography } from "../../../styles/formTypography";
import type { TrafficInjuryFormData, DefendantRow } from "../types/trafficInjuryFormTypes";

export interface Step4KusurTablosuProps {
  formData: TrafficInjuryFormData;
  onChange: (data: Partial<TrafficInjuryFormData>) => void;
}

function emptyDefendant(): DefendantRow {
  return { name: "", faultRate: 0 };
}

export function Step4KusurTablosu({ formData, onChange }: Step4KusurTablosuProps) {
  const defendants = formData.defendants ?? [];
  const updateDefendants = (fn: (prev: DefendantRow[]) => DefendantRow[]) => {
    onChange({ defendants: fn(defendants) });
  };

  const addDefendant = () => updateDefendants((prev) => [...prev, emptyDefendant()]);
  const removeDefendant = (index: number) =>
    updateDefendants((prev) => prev.filter((_, i) => i !== index));
  const updateDefendant = (index: number, patch: Partial<DefendantRow>) =>
    updateDefendants((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-6">
      <div className="col-span-2">
        <Input
          label="Davacı Kusur Oranı (%)"
          type="number"
          min={0}
          max={100}
          value={formData.plaintiffFaultRate === 0 ? "" : String(formData.plaintiffFaultRate)}
          onChange={(e) =>
            onChange({ plaintiffFaultRate: Number(e.target.value) || 0 })
          }
        />
      </div>

      <div className="col-span-2 mt-6">
        <div className="flex items-center justify-between mb-3">
          <span className={formTypography.label}>Davalılar</span>
          <button
            type="button"
            onClick={addDefendant}
            className="text-[13px] font-medium text-app-primary hover:text-app-accent"
          >
            Davalı Ekle
          </button>
        </div>
        <div className="space-y-4">
          {defendants.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-2 gap-x-4 gap-y-2 items-end pb-4 border-b border-gray-100 last:border-0"
            >
              <Input
                label="Davalı Adı"
                type="text"
                value={row.name}
                onChange={(e) => updateDefendant(index, { name: e.target.value })}
              />
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    label="Kusur Oranı (%)"
                    type="number"
                    min={0}
                    max={100}
                    value={row.faultRate === 0 ? "" : String(row.faultRate)}
                    onChange={(e) =>
                      updateDefendant(index, {
                        faultRate: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeDefendant(index)}
                  className="shrink-0 h-9 px-2 text-[12px] text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Sil"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
