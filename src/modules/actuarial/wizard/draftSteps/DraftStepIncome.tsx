import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { Button } from "../../../../components/ui/Button";
import type { CalculationDraftInput, IncomePeriod } from "../../types/calculationDraft";
import { newId } from "../../types/calculationDraft";

interface Props {
  draft: CalculationDraftInput;
  onChange: (draft: CalculationDraftInput) => void;
}

function emptyPeriod(): IncomePeriod {
  return {
    id: newId(),
    startDate: "",
    endDate: "",
    amount: 0,
    amountKind: "net",
    sourceType: "payroll",
  };
}

export function DraftStepIncome({ draft, onChange }: Props) {
  const periods = draft.income.periods ?? [];

  const updatePeriod = (index: number, patch: Partial<IncomePeriod>) => {
    const next = periods.map((p, i) => (i === index ? { ...p, ...patch } : p));
    onChange({ ...draft, income: { ...draft.income, periods: next } });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Gelir bilgileri</h3>
        <p className="text-sm text-gray-500 mt-1">
          Gelir dönemleri girin. Bu aşamada gelir üzerinden tazminat hesaplanmaz.
        </p>
      </div>

      {periods.length === 0 && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
          En az bir gelir dönemi eklenmelidir.
        </p>
      )}

      {periods.map((p, index) => (
        <section key={p.id} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Dönem {index + 1}
            </h4>
            <button
              type="button"
              className="text-xs text-red-600 hover:underline"
              onClick={() =>
                onChange({
                  ...draft,
                  income: { ...draft.income, periods: periods.filter((_, i) => i !== index) },
                })
              }
            >
              Sil
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Başlangıç *"
              type="date"
              value={p.startDate}
              onChange={(e) => updatePeriod(index, { startDate: e.target.value })}
            />
            <Input
              label="Bitiş"
              type="date"
              value={p.endDate ?? ""}
              onChange={(e) => updatePeriod(index, { endDate: e.target.value })}
            />
            <Input
              label="Tutar *"
              type="number"
              min={0}
              value={p.amount === 0 ? "" : String(p.amount)}
              onChange={(e) => updatePeriod(index, { amount: Number(e.target.value) || 0 })}
            />
            <Select
              label="Brüt / Net *"
              value={p.amountKind}
              onChange={(e) =>
                updatePeriod(index, { amountKind: e.target.value as "gross" | "net" })
              }
              options={[
                { value: "net", label: "Net" },
                { value: "gross", label: "Brüt" },
              ]}
            />
            <Select
              label="Kaynak *"
              value={p.sourceType}
              onChange={(e) =>
                updatePeriod(index, {
                  sourceType: e.target.value as IncomePeriod["sourceType"],
                })
              }
              options={[
                { value: "min_wage", label: "Asgari ücret" },
                { value: "payroll", label: "Bordro" },
                { value: "comparable", label: "Emsal" },
                { value: "chamber", label: "Oda" },
                { value: "witness", label: "Tanık" },
                { value: "sgk", label: "SGK" },
                { value: "other", label: "Diğer" },
              ]}
            />
            <Input
              label="Açıklama"
              value={p.label ?? ""}
              onChange={(e) => updatePeriod(index, { label: e.target.value })}
            />
          </div>
        </section>
      ))}

      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          onChange({
            ...draft,
            income: { ...draft.income, periods: [...periods, emptyPeriod()] },
          })
        }
      >
        Gelir dönemi ekle
      </Button>
    </div>
  );
}
