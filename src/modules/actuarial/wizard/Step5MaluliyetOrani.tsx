import { Input } from "../../../components/ui/Input";
import { formTypography } from "../../../styles/formTypography";
import type {
  TrafficInjuryFormData,
  DateRangeRow,
} from "../types/trafficInjuryFormTypes";

export interface Step5MaluliyetOraniProps {
  formData: TrafficInjuryFormData;
  onChange: (data: Partial<TrafficInjuryFormData>) => void;
}

const emptyDateRange = (): DateRangeRow => ({ startDate: "", endDate: "" });

function DateRangeList({
  label,
  addLabel,
  rows,
  onRowsChange,
}: {
  label: string;
  addLabel: string;
  rows: DateRangeRow[];
  onRowsChange: (fn: (prev: DateRangeRow[]) => DateRangeRow[]) => void;
}) {
  const add = () => onRowsChange((prev) => [...prev, emptyDateRange()]);
  const remove = (index: number) =>
    onRowsChange((prev) => prev.filter((_, i) => i !== index));
  const update = (index: number, patch: Partial<DateRangeRow>) =>
    onRowsChange((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );

  return (
    <div className="col-span-2 mt-6 first:mt-0">
      <div className="flex items-center justify-between mb-3">
        <span className={formTypography.label}>{label}</span>
        <button
          type="button"
          onClick={add}
          className="text-[13px] font-medium text-app-primary hover:text-app-accent"
        >
          {addLabel}
        </button>
      </div>
      <div className="space-y-4">
        {rows.map((row, index) => (
          <div
            key={index}
            className="grid grid-cols-2 gap-x-4 gap-y-2 items-end pb-4 border-b border-gray-100 last:border-0"
          >
            <Input
              label="Başlangıç Tarihi"
              type="date"
              value={row.startDate}
              onChange={(e) => update(index, { startDate: e.target.value })}
            />
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label="Bitiş Tarihi"
                  type="date"
                  value={row.endDate}
                  onChange={(e) => update(index, { endDate: e.target.value })}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
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
  );
}

export function Step5MaluliyetOrani({ formData, onChange }: Step5MaluliyetOraniProps) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-6">
      <div className="col-span-2">
        <Input
          label="Maluliyet Oranı (%)"
          type="number"
          min={0}
          max={100}
          value={formData.maluliyetOrani === 0 ? "" : String(formData.maluliyetOrani)}
          onChange={(e) =>
            onChange({ maluliyetOrani: Number(e.target.value) || 0 })
          }
        />
      </div>

      <DateRangeList
        label="Maluliyet Dönemi"
        addLabel="Maluliyet Dönemi Ekle"
        rows={formData.disabilityPeriods ?? []}
        onRowsChange={(fn) =>
          onChange({ disabilityPeriods: fn(formData.disabilityPeriods ?? []) })
        }
      />
      <DateRangeList
        label="Tedavi Dönemi"
        addLabel="Tedavi Dönemi Ekle"
        rows={formData.treatmentPeriods ?? []}
        onRowsChange={(fn) =>
          onChange({ treatmentPeriods: fn(formData.treatmentPeriods ?? []) })
        }
      />
      <DateRangeList
        label="Bakıcılı Dönem"
        addLabel="Bakıcılı Dönem Ekle"
        rows={formData.caregiverPeriods ?? []}
        onRowsChange={(fn) =>
          onChange({ caregiverPeriods: fn(formData.caregiverPeriods ?? []) })
        }
      />
    </div>
  );
}
