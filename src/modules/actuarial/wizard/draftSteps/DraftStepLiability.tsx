import { Input } from "../../../../components/ui/Input";
import { Button } from "../../../../components/ui/Button";
import type { CalculationDraftInput, DefendantFault } from "../../types/calculationDraft";

interface Props {
  draft: CalculationDraftInput;
  onChange: (draft: CalculationDraftInput) => void;
}

export function DraftStepLiability({ draft, onChange }: Props) {
  const liability = draft.liability;
  const defendants = liability.defendants ?? [];

  const updateDefendant = (index: number, patch: Partial<DefendantFault>) => {
    const next = defendants.map((d, i) => (i === index ? { ...d, ...patch } : d));
    onChange({ ...draft, liability: { ...liability, defendants: next } });
  };

  const defendantSum = defendants.reduce((s, d) => s + (Number(d.faultRatio) || 0), 0);
  const total = (Number(liability.plaintiffFaultRatio) || 0) + defendantSum;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Kusur bilgileri</h3>
        <p className="text-sm text-gray-500 mt-1">
          Davacı ve davalı oranları ayrı tutulur. Toplam otomatik düzeltilmez.
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <Input
          label="Davacı kusur oranı (%) *"
          type="number"
          min={0}
          max={100}
          value={String(liability.plaintiffFaultRatio)}
          onChange={(e) =>
            onChange({
              ...draft,
              liability: { ...liability, plaintiffFaultRatio: Number(e.target.value) || 0 },
            })
          }
        />
        <p className="text-xs text-gray-500">
          Mevcut toplam (davacı + davalılar): %{total.toFixed(2)}
          {Math.abs(total - 100) > 0.01 ? " — 100 beklenir (uyarı olarak kontrol edilir)" : ""}
        </p>
      </section>

      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Davalılar</h4>
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            onChange({
              ...draft,
              liability: {
                ...liability,
                defendants: [...defendants, { name: "", faultRatio: 0 }],
              },
            })
          }
        >
          Davalı ekle
        </Button>
      </div>

      {defendants.map((d, index) => (
        <section key={index} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Davalı adı"
              value={d.name}
              onChange={(e) => updateDefendant(index, { name: e.target.value })}
            />
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label="Kusur oranı (%)"
                  type="number"
                  min={0}
                  max={100}
                  value={String(d.faultRatio)}
                  onChange={(e) =>
                    updateDefendant(index, { faultRatio: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <button
                type="button"
                className="text-xs text-red-600 h-10 px-2"
                onClick={() =>
                  onChange({
                    ...draft,
                    liability: {
                      ...liability,
                      defendants: defendants.filter((_, i) => i !== index),
                    },
                  })
                }
              >
                Sil
              </button>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
