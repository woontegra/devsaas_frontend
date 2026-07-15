import { Input } from "../../../../components/ui/Input";
import { Button } from "../../../../components/ui/Button";
import type { CalculationDraftInput, DateRange, ExpenseItem, PriorPayment } from "../../types/calculationDraft";
import { isDeathType, isInjuryType, newId } from "../../types/calculationDraft";

interface Props {
  draft: CalculationDraftInput;
  onChange: (draft: CalculationDraftInput) => void;
}

export function DraftStepDisabilityExpenses({ draft, onChange }: Props) {
  const injury = isInjuryType(draft.calculationType);
  const death = isDeathType(draft.calculationType);
  const disability = draft.disability ?? {};
  const temp = disability.temporaryDisabilityPeriods ?? [];
  const expenses = draft.expenses ?? [];
  const priors = draft.priorPayments ?? [];
  const beneficiaries = draft.beneficiaries ?? [];

  if (death) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Hak sahipleri</h3>
          <p className="text-sm text-gray-500 mt-1">
            Ölüm hesaplarında en az bir hak sahibi gereklidir. Destek tutarı bu aşamada hesaplanmaz.
          </p>
          <p className="text-xs text-amber-700 mt-2">Geliştirme aşamasında — temel alanlar.</p>
        </div>
        {beneficiaries.map((b, index) => (
          <section key={b.id} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Ad *"
                value={b.name}
                onChange={(e) => {
                  const next = beneficiaries.map((x, i) =>
                    i === index ? { ...x, name: e.target.value } : x
                  );
                  onChange({ ...draft, beneficiaries: next });
                }}
              />
              <Input
                label="Doğum tarihi *"
                type="date"
                value={b.birthDate}
                onChange={(e) => {
                  const next = beneficiaries.map((x, i) =>
                    i === index ? { ...x, birthDate: e.target.value } : x
                  );
                  onChange({ ...draft, beneficiaries: next });
                }}
              />
              <Input
                label="Pay oranı"
                type="number"
                min={0}
                value={String(b.shareRatio)}
                onChange={(e) => {
                  const next = beneficiaries.map((x, i) =>
                    i === index ? { ...x, shareRatio: Number(e.target.value) || 0 } : x
                  );
                  onChange({ ...draft, beneficiaries: next });
                }}
              />
              <Input
                label="Yakınlık"
                value={b.relationship}
                onChange={(e) => {
                  const next = beneficiaries.map((x, i) =>
                    i === index ? { ...x, relationship: e.target.value } : x
                  );
                  onChange({ ...draft, beneficiaries: next });
                }}
              />
            </div>
            <button
              type="button"
              className="text-xs text-red-600"
              onClick={() =>
                onChange({
                  ...draft,
                  beneficiaries: beneficiaries.filter((_, i) => i !== index),
                })
              }
            >
              Sil
            </button>
          </section>
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            onChange({
              ...draft,
              beneficiaries: [
                ...beneficiaries,
                {
                  id: newId(),
                  name: "",
                  birthDate: "",
                  gender: "male",
                  relationship: "child",
                  shareRatio: 0,
                },
              ],
            })
          }
        >
          Hak sahibi ekle
        </Button>
      </div>
    );
  }

  if (!injury) return null;

  const updateTemp = (index: number, patch: Partial<DateRange>) => {
    const next = temp.map((r, i) => (i === index ? { ...r, ...patch } : r));
    onChange({
      ...draft,
      disability: { ...disability, temporaryDisabilityPeriods: next },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Maluliyet, giderler ve ödemeler</h3>
        <p className="text-sm text-gray-500 mt-1">
          Maluliyet ve gider verileri kaydedilir; peşin sermaye veya tazminat bu aşamada hesaplanmaz.
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Maluliyet</h4>
        <Input
          label="Sürekli maluliyet oranı (%) *"
          type="number"
          min={0}
          max={100}
          value={
            disability.permanentDisabilityRate == null
              ? ""
              : String(disability.permanentDisabilityRate)
          }
          onChange={(e) =>
            onChange({
              ...draft,
              disability: {
                ...disability,
                permanentDisabilityRate:
                  e.target.value === "" ? undefined : Number(e.target.value),
              },
            })
          }
        />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={Boolean(disability.caregiverNeeded)}
            onChange={(e) =>
              onChange({
                ...draft,
                disability: { ...disability, caregiverNeeded: e.target.checked },
              })
            }
          />
          Bakıcı ihtiyacı var
        </label>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Geçici iş göremezlik dönemleri
          </h4>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              onChange({
                ...draft,
                disability: {
                  ...disability,
                  temporaryDisabilityPeriods: [...temp, { startDate: "", endDate: "" }],
                },
              })
            }
          >
            Dönem ekle
          </Button>
        </div>
        {temp.map((r, index) => (
          <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <Input
              label="Başlangıç"
              type="date"
              value={r.startDate}
              onChange={(e) => updateTemp(index, { startDate: e.target.value })}
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label="Bitiş"
                  type="date"
                  value={r.endDate}
                  onChange={(e) => updateTemp(index, { endDate: e.target.value })}
                />
              </div>
              <button
                type="button"
                className="text-xs text-red-600 h-10"
                onClick={() =>
                  onChange({
                    ...draft,
                    disability: {
                      ...disability,
                      temporaryDisabilityPeriods: temp.filter((_, i) => i !== index),
                    },
                  })
                }
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Diğer giderler</h4>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const item: ExpenseItem = {
                id: newId(),
                name: "",
                amount: 0,
                category: "other",
              };
              onChange({ ...draft, expenses: [...expenses, item] });
            }}
          >
            Gider ekle
          </Button>
        </div>
        {expenses.map((e, index) => (
          <div key={e.id} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Gider adı"
              value={e.name}
              onChange={(ev) => {
                const next = expenses.map((x, i) =>
                  i === index ? { ...x, name: ev.target.value } : x
                );
                onChange({ ...draft, expenses: next });
              }}
            />
            <Input
              label="Tutar"
              type="number"
              min={0}
              value={e.amount === 0 ? "" : String(e.amount)}
              onChange={(ev) => {
                const next = expenses.map((x, i) =>
                  i === index ? { ...x, amount: Number(ev.target.value) || 0 } : x
                );
                onChange({ ...draft, expenses: next });
              }}
            />
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Önceki ödemeler</h4>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const item: PriorPayment = { id: newId(), amount: 0, label: "" };
              onChange({ ...draft, priorPayments: [...priors, item] });
            }}
          >
            Ödeme ekle
          </Button>
        </div>
        {priors.map((p, index) => (
          <div key={p.id} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Açıklama"
              value={p.label ?? ""}
              onChange={(ev) => {
                const next = priors.map((x, i) =>
                  i === index ? { ...x, label: ev.target.value } : x
                );
                onChange({ ...draft, priorPayments: next });
              }}
            />
            <Input
              label="Tutar"
              type="number"
              min={0}
              value={p.amount === 0 ? "" : String(p.amount)}
              onChange={(ev) => {
                const next = priors.map((x, i) =>
                  i === index ? { ...x, amount: Number(ev.target.value) || 0 } : x
                );
                onChange({ ...draft, priorPayments: next });
              }}
            />
          </div>
        ))}
      </section>
    </div>
  );
}
