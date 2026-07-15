import type { CalculationDraft, PersonBase } from "../../types/calculationDraft";
import { FormField, FormGrid, FormSection, TextInput, TextSelect, TextTextarea } from "../shared/FormPrimitives";
import type { StepProps } from "../shared/wizardTypes";
import { errorFor } from "../shared/wizardTypes";

function PersonFields({
  person,
  onPatch,
  fieldErrors,
  deathDate,
  onDeathDate,
  showMarital,
}: {
  person: PersonBase;
  onPatch: (p: Partial<PersonBase>) => void;
  fieldErrors: StepProps["fieldErrors"];
  deathDate?: string;
  onDeathDate?: (v: string) => void;
  showMarital?: boolean;
}) {
  return (
    <FormGrid>
      <FormField label="Ad soyad">
        <TextInput value={person.fullName ?? ""} onChange={(e) => onPatch({ fullName: e.target.value })} />
      </FormField>
      <FormField label="Doğum tarihi" required error={errorFor(fieldErrors, "person.birthDate")}>
        <TextInput type="date" value={person.birthDate} onChange={(e) => onPatch({ birthDate: e.target.value })} />
      </FormField>
      {onDeathDate && (
        <FormField label="Ölüm tarihi" required error={errorFor(fieldErrors, "person.deathDate")}>
          <TextInput type="date" value={deathDate ?? ""} onChange={(e) => onDeathDate(e.target.value)} />
        </FormField>
      )}
      <FormField label="Cinsiyet" required>
        <TextSelect
          value={person.gender}
          onChange={(e) => onPatch({ gender: e.target.value as "male" | "female" })}
        >
          <option value="male">Erkek</option>
          <option value="female">Kadın</option>
        </TextSelect>
      </FormField>
      <FormField label="Meslek">
        <TextInput value={person.occupation ?? ""} onChange={(e) => onPatch({ occupation: e.target.value })} />
      </FormField>
      <FormField label="Çalışma durumu">
        <TextInput
          value={person.employmentStatus ?? ""}
          onChange={(e) => onPatch({ employmentStatus: e.target.value })}
        />
      </FormField>
      <FormField label="Emeklilik durumu">
        <TextInput
          value={person.retirementStatus ?? ""}
          onChange={(e) => onPatch({ retirementStatus: e.target.value })}
        />
      </FormField>
      <FormField label="Sigortalılık durumu">
        <TextInput
          value={person.insuranceStatus ?? ""}
          onChange={(e) => onPatch({ insuranceStatus: e.target.value })}
        />
      </FormField>
      {showMarital && "maritalStatus" in person && (
        <FormField label="Medeni durum">
          <TextInput
            value={(person as { maritalStatus?: string }).maritalStatus ?? ""}
            onChange={(e) => onPatch({ ...( { maritalStatus: e.target.value } as Partial<PersonBase>) })}
          />
        </FormField>
      )}
    </FormGrid>
  );
}

/** Trafik yaralanmada taraf bilgileri `TrafficPartiesStep` kullanır — bu adım artık aktif değil. */
export function InjuredPersonStep(_props: StepProps) {
  return null;
}

export function DeceasedStep({ draft, onChange, fieldErrors }: StepProps) {
  if (draft.calculationType !== "TRAFFIC_DEATH") return null;
  const p = draft.deceased;
  return (
    <FormSection title="Müteveffa bilgileri">
      <PersonFields
        person={p}
        fieldErrors={fieldErrors}
        deathDate={p.deathDate}
        onDeathDate={(deathDate) => onChange({ ...draft, deceased: { ...p, deathDate } })}
        showMarital
        onPatch={(patch) => onChange({ ...draft, deceased: { ...p, ...patch } })}
      />
      <FormField label="Açıklama">
        <TextTextarea value={p.notes ?? ""} onChange={(e) => onChange({ ...draft, deceased: { ...p, notes: e.target.value } })} />
      </FormField>
    </FormSection>
  );
}

export function EmployeeStep({ draft, onChange, fieldErrors }: StepProps) {
  if (draft.calculationType !== "WORK_INJURY") return null;
  const p = draft.employee;
  return (
    <FormSection title="İşçi bilgileri">
      <PersonFields
        person={p}
        fieldErrors={fieldErrors}
        onPatch={(patch) => onChange({ ...draft, employee: { ...p, ...patch } })}
      />
      <FormField label="Olay tarihindeki görev">
        <TextInput
          value={p.jobAtEvent ?? ""}
          onChange={(e) => onChange({ ...draft, employee: { ...p, jobAtEvent: e.target.value } })}
        />
      </FormField>
    </FormSection>
  );
}

export function DeceasedEmployeeStep({ draft, onChange, fieldErrors }: StepProps) {
  if (draft.calculationType !== "WORK_DEATH") return null;
  const p = draft.deceasedEmployee;
  return (
    <FormSection title="Müteveffa işçi">
      <PersonFields
        person={p}
        fieldErrors={fieldErrors}
        deathDate={p.deathDate}
        onDeathDate={(deathDate) => onChange({ ...draft, deceasedEmployee: { ...p, deathDate } })}
        onPatch={(patch) => onChange({ ...draft, deceasedEmployee: { ...p, ...patch } })}
      />
      <FormField label="Olay tarihindeki görev">
        <TextInput
          value={p.jobAtEvent ?? ""}
          onChange={(e) => onChange({ ...draft, deceasedEmployee: { ...p, jobAtEvent: e.target.value } })}
        />
      </FormField>
    </FormSection>
  );
}

export function InsurancePriorStep(props: StepProps) {
  const { draft, onChange } = props;
  if (draft.calculationType !== "TRAFFIC_DEATH") {
    return null;
  }
  const ins = draft.insurance;
  return (
    <div className="space-y-5">
      <FormSection title="Sigorta bilgileri">
        <FormGrid>
          <FormField label="Sigorta şirketi">
            <TextInput
              value={ins.company ?? ""}
              onChange={(e) => onChange({ ...draft, insurance: { ...ins, company: e.target.value } } as CalculationDraft)}
            />
          </FormField>
          <FormField label="Poliçe numarası">
            <TextInput
              value={ins.policyNumber ?? ""}
              onChange={(e) =>
                onChange({ ...draft, insurance: { ...ins, policyNumber: e.target.value } } as CalculationDraft)
              }
            />
          </FormField>
        </FormGrid>
        <FormField label="Teminat / açıklama">
          <TextTextarea
            value={ins.coverageNotes ?? ""}
            onChange={(e) =>
              onChange({ ...draft, insurance: { ...ins, coverageNotes: e.target.value } } as CalculationDraft)
            }
          />
        </FormField>
      </FormSection>
    </div>
  );
}
