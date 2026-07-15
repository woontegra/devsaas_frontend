import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import type { CalculationDraftInput, CalculationType } from "../../types/calculationDraft";
import { CALCULATION_TYPE_LABELS, createEmptyDraft } from "../../types/calculationDraft";

const TYPES: CalculationType[] = [
  "TRAFFIC_INJURY",
  "TRAFFIC_DEATH",
  "WORK_INJURY",
  "WORK_DEATH",
];

interface Props {
  draft: CalculationDraftInput;
  onChange: (draft: CalculationDraftInput) => void;
}

export function DraftStepType({ draft, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Hesap türü</h3>
        <p className="text-sm text-gray-500 mt-1">
          Bu aşamada yalnızca veri girişi ve doğrulama yapılır. Parasal sonuç üretilmez.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TYPES.map((type) => {
          const selected = draft.calculationType === type;
          const mature = type === "TRAFFIC_INJURY";
          return (
            <button
              key={type}
              type="button"
              onClick={() => {
                const next = createEmptyDraft(type);
                next.incident.calculationDate = draft.incident.calculationDate || next.incident.calculationDate;
                onChange(next);
              }}
              className={`text-left rounded-lg border px-4 py-3 transition-colors ${
                selected
                  ? "border-app-primary bg-app-primary/5 ring-1 ring-app-primary/30"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <span className="block text-sm font-medium text-gray-900">
                {CALCULATION_TYPE_LABELS[type]}
              </span>
              <span className="block text-xs text-gray-500 mt-1">
                {mature
                  ? "Veri formu aktif — hesap sonucu sonraki aşamada"
                  : "Geliştirme aşamasında — temel alanlar doldurulabilir"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DraftStepPersonIncident({ draft, onChange }: Props) {
  const p = draft.primaryPerson;
  const inc = draft.incident;
  const caseInfo = draft.caseInfo ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Kişi ve olay bilgileri</h3>
        <p className="text-sm text-gray-500 mt-1">Zorunlu alanlar * ile işaretlidir.</p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Kişi</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Doğum tarihi *"
            type="date"
            value={p.birthDate}
            onChange={(e) =>
              onChange({ ...draft, primaryPerson: { ...p, birthDate: e.target.value } })
            }
          />
          <Select
            label="Cinsiyet *"
            value={p.gender}
            onChange={(e) =>
              onChange({
                ...draft,
                primaryPerson: { ...p, gender: e.target.value as "male" | "female" },
              })
            }
            options={[
              { value: "male", label: "Erkek" },
              { value: "female", label: "Kadın" },
            ]}
          />
          <Input
            label="Meslek"
            value={p.occupation ?? ""}
            onChange={(e) =>
              onChange({ ...draft, primaryPerson: { ...p, occupation: e.target.value } })
            }
          />
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Olay</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Olay tarihi *"
            type="date"
            value={inc.eventDate}
            onChange={(e) =>
              onChange({ ...draft, incident: { ...inc, eventDate: e.target.value } })
            }
          />
          <Input
            label="Hesap tarihi *"
            type="date"
            value={inc.calculationDate}
            onChange={(e) =>
              onChange({ ...draft, incident: { ...inc, calculationDate: e.target.value } })
            }
          />
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Dosya (isteğe bağlı)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Mahkeme"
            value={caseInfo.courtName ?? ""}
            onChange={(e) =>
              onChange({ ...draft, caseInfo: { ...caseInfo, courtName: e.target.value } })
            }
          />
          <Input
            label="Esas no"
            value={caseInfo.caseNumber ?? ""}
            onChange={(e) =>
              onChange({ ...draft, caseInfo: { ...caseInfo, caseNumber: e.target.value } })
            }
          />
        </div>
      </section>
    </div>
  );
}
