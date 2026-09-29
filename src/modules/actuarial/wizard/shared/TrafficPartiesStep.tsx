import type {
  CalculationDraft,
  DefendantParty,
  DefendantType,
  PlaintiffGender,
  TrafficInjuryDraft,
} from "../../types/calculationDraft";
import { newId } from "../../types/calculationDraft";
import {
  FormField,
  FormSection,
  TextInput,
} from "./FormPrimitives";
import type { StepProps } from "./wizardTypes";
import { errorFor } from "./wizardTypes";
import {
  DefendantTypeToggleList,
  TRAFFIC_INSURER_OPTIONS,
  TRAFFIC_RESPONSIBLE_OPTIONS,
} from "./DefendantTypeToggleList";

const DEFENDANT_OPTIONS = [...TRAFFIC_RESPONSIBLE_OPTIONS, ...TRAFFIC_INSURER_OPTIONS];

function isIndividual(type: DefendantType): boolean {
  return type === "INDIVIDUAL_DRIVER" || type === "INDIVIDUAL_VEHICLE_OWNER";
}

function emptyDefendant(type: DefendantType): DefendantParty {
  if (isIndividual(type)) {
    return { id: newId(), type, firstName: "", lastName: "" };
  }
  return { id: newId(), type, organizationName: "" };
}

function asTraffic(draft: CalculationDraft): TrafficInjuryDraft | null {
  return draft.calculationType === "TRAFFIC_INJURY" ? draft : null;
}

export function TrafficPartiesStep({ draft, onChange, fieldErrors }: StepProps) {
  const ti = asTraffic(draft);
  if (!ti) return null;

  const plaintiff = ti.parties.plaintiff;
  const defendants = ti.parties.defendants;

  const setPlaintiff = (patch: Partial<typeof plaintiff>) => {
    onChange({
      ...ti,
      parties: { ...ti.parties, plaintiff: { ...plaintiff, ...patch } },
    });
  };

  const setDefendants = (next: DefendantParty[]) => {
    onChange({
      ...ti,
      parties: { ...ti.parties, defendants: next },
    });
  };

  const typesPresent = new Set(defendants.map((d) => d.type));

  const toggleType = (type: DefendantType) => {
    if (typesPresent.has(type)) {
      setDefendants(defendants.filter((d) => d.type !== type));
    } else {
      setDefendants([...defendants, emptyDefendant(type)]);
    }
  };

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <FormSection
        title="Davacı"
        description="Zarar gören / davacı kimlik bilgilerini girin."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-4 gap-y-3.5">
          <FormField
            label="Ad"
            required
            error={errorFor(fieldErrors, "parties.plaintiff.firstName")}
          >
            <TextInput
              value={plaintiff.firstName}
              onChange={(e) => setPlaintiff({ firstName: e.target.value })}
              autoComplete="given-name"
            />
          </FormField>
          <FormField
            label="Soyad"
            required
            error={errorFor(fieldErrors, "parties.plaintiff.lastName")}
          >
            <TextInput
              value={plaintiff.lastName}
              onChange={(e) => setPlaintiff({ lastName: e.target.value })}
              autoComplete="family-name"
            />
          </FormField>
          <FormField
            label="Doğum tarihi"
            required
            error={errorFor(fieldErrors, "parties.plaintiff.birthDate")}
          >
            <TextInput
              type="date"
              value={plaintiff.birthDate}
              onChange={(e) => setPlaintiff({ birthDate: e.target.value })}
            />
          </FormField>
          <FormField
            label="Cinsiyet"
            required
            error={errorFor(fieldErrors, "parties.plaintiff.gender")}
          >
            <div className="flex gap-2 min-h-[46px] items-center">
              {(
                [
                  { value: "FEMALE" as const, label: "Kadın" },
                  { value: "MALE" as const, label: "Erkek" },
                ] as const
              ).map((opt) => {
                const active = plaintiff.gender === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPlaintiff({ gender: opt.value as PlaintiffGender })}
                    className={`flex-1 min-h-[42px] rounded-[10px] border text-[13px] font-medium transition-colors ${
                      active
                        ? "border-blue-800 bg-blue-50 text-blue-900"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                    aria-pressed={active}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Davalı / Davalılar"
        description="Dosyada yer alan davalı veya davalı türlerini seçin."
      >
        {errorFor(fieldErrors, "parties.defendants") && (
          <p className="text-[13px] text-red-600">{errorFor(fieldErrors, "parties.defendants")}</p>
        )}

        <DefendantTypeToggleList
          options={DEFENDANT_OPTIONS}
          selectedTypes={typesPresent}
          onToggle={toggleType}
        />
      </FormSection>
    </div>
  );
}
