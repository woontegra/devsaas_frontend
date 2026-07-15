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

const DEFENDANT_OPTIONS: {
  type: DefendantType;
  title: string;
  description: string;
}[] = [
  {
    type: "INDIVIDUAL_DRIVER",
    title: "Gerçek Kişi Şoför",
    description: "Kazaya karışan aracı kullanan kişi",
  },
  {
    type: "INDIVIDUAL_VEHICLE_OWNER",
    title: "Gerçek Kişi Araç sahibi",
    description: "Aracın gerçek kişi maliki",
  },
  {
    type: "CORPORATE_VEHICLE_OWNER",
    title: "Tüzel Kişi Araç sahibi",
    description: "Aracın şirket veya kurum adına kayıtlı maliki",
  },
  {
    type: "COMPULSORY_TRAFFIC_INSURER",
    title: "Sigorta şirketi (ZMTS)",
    description: "Zorunlu mali sorumluluk sigortacısı",
  },
  {
    type: "CASCO_INSURER",
    title: "Sigorta şirketi (Kasko Şirketi)",
    description: "Kasko poliçesini düzenleyen sigorta şirketi",
  },
];

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

        <div className="grid grid-cols-1 gap-2.5">
          {DEFENDANT_OPTIONS.map((opt) => {
            const selected = typesPresent.has(opt.type);
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => toggleType(opt.type)}
                className={`w-full rounded-[12px] border px-3.5 py-3 text-left flex items-center justify-between gap-4 min-h-[52px] transition-colors ${
                  selected
                    ? "border-blue-800/70 bg-blue-50/50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
                aria-pressed={selected}
              >
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-slate-800">{opt.title}</span>
                  <span className="block text-[12px] font-normal text-slate-500 mt-0.5">
                    {opt.description}
                  </span>
                </span>
                <span
                  className={`h-5 w-5 shrink-0 rounded-[6px] border flex items-center justify-center text-[11px] ${
                    selected
                      ? "border-blue-800 bg-blue-800 text-white"
                      : "border-slate-300 bg-white text-transparent"
                  }`}
                  aria-hidden
                >
                  ✓
                </span>
              </button>
            );
          })}
        </div>
      </FormSection>
    </div>
  );
}
