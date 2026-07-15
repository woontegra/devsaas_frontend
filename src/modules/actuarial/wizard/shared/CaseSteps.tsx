import type { CalculationDraft, CommonCaseInfo } from "../../types/calculationDraft";
import {
  FormField,
  FormGrid,
  FormSection,
  TextInput,
  TextTextarea,
} from "../shared/FormPrimitives";
import type { StepProps } from "../shared/wizardTypes";
import { errorFor } from "../shared/wizardTypes";

function updateCommon(draft: CalculationDraft, patch: Partial<CommonCaseInfo>): CalculationDraft {
  return { ...draft, common: { ...draft.common, ...patch } };
}

/** Trafik kazası — dosya/olay (+ ölümde opsiyonel sigorta şirketi alanı) */
export function TrafficCaseStep({ draft, onChange, fieldErrors }: StepProps) {
  const c = draft.common;
  const isInjury = draft.calculationType === "TRAFFIC_INJURY";
  return (
    <FormSection
      title="Dosya ve olay bilgileri"
      description={
        isInjury
          ? "Mahkeme dosyası, olay tarihi, poliçe ve teminat bilgilerini girin. Sigorta şirketi taraf bilgilerindeki davalı kayıtlarından gelir."
          : "Mahkeme dosyası, olay tarihi ve trafik sigorta bilgilerini girin. Sigorta alanları bilgilendirme amaçlıdır."
      }
    >
      <FormGrid>
        <FormField label="Dahili dosya adı">
          <TextInput
            value={c.internalFileName ?? ""}
            onChange={(e) => onChange(updateCommon(draft, { internalFileName: e.target.value }))}
          />
        </FormField>
        <FormField label="Mahkeme">
          <TextInput
            value={c.courtName ?? ""}
            onChange={(e) => onChange(updateCommon(draft, { courtName: e.target.value }))}
          />
        </FormField>
        <FormField label="Esas numarası">
          <TextInput
            value={c.caseNumber ?? ""}
            onChange={(e) => onChange(updateCommon(draft, { caseNumber: e.target.value }))}
          />
        </FormField>
        <FormField label="Olay tarihi" required error={errorFor(fieldErrors, "common.eventDate")}>
          <TextInput
            type="date"
            value={c.eventDate}
            onChange={(e) => onChange(updateCommon(draft, { eventDate: e.target.value }))}
          />
        </FormField>
        <FormField label="Hesap tarihi" required error={errorFor(fieldErrors, "common.calculationDate")}>
          <TextInput
            type="date"
            value={c.calculationDate}
            onChange={(e) => onChange(updateCommon(draft, { calculationDate: e.target.value }))}
          />
        </FormField>
        {!isInjury && (
          <FormField label="Sigorta şirketi">
            <TextInput
              value={c.insuranceCompany ?? ""}
              onChange={(e) => onChange(updateCommon(draft, { insuranceCompany: e.target.value }))}
            />
          </FormField>
        )}
        <FormField label="Poliçe numarası">
          <TextInput
            value={c.policyNumber ?? ""}
            onChange={(e) => onChange(updateCommon(draft, { policyNumber: e.target.value }))}
          />
        </FormField>
      </FormGrid>
      <FormField label="Olay açıklaması">
        <TextTextarea
          value={c.eventDescription ?? ""}
          onChange={(e) => onChange(updateCommon(draft, { eventDescription: e.target.value }))}
        />
      </FormField>
      <FormField label="Teminat bilgisi">
        <TextTextarea
          value={c.coverageNotes ?? ""}
          onChange={(e) => onChange(updateCommon(draft, { coverageNotes: e.target.value }))}
        />
      </FormField>
    </FormSection>
  );
}

/** İş kazası — sigorta/poliçe/teminat YOK */
export function WorkAccidentCaseStep({ draft, onChange, fieldErrors }: StepProps) {
  const c = draft.common;
  return (
    <FormSection
      title="Dosya ve iş kazası bilgileri"
      description="Mahkeme dosyası, olay tarihi, iş yeri ve iş kazası bildirim bilgilerini girin."
    >
      <FormGrid>
        <FormField label="Dahili dosya adı">
          <TextInput
            value={c.internalFileName ?? ""}
            onChange={(e) => onChange(updateCommon(draft, { internalFileName: e.target.value }))}
          />
        </FormField>
        <FormField label="Mahkeme">
          <TextInput
            value={c.courtName ?? ""}
            onChange={(e) => onChange(updateCommon(draft, { courtName: e.target.value }))}
          />
        </FormField>
        <FormField label="Esas numarası">
          <TextInput
            value={c.caseNumber ?? ""}
            onChange={(e) => onChange(updateCommon(draft, { caseNumber: e.target.value }))}
          />
        </FormField>
        <FormField label="Olay tarihi" required error={errorFor(fieldErrors, "common.eventDate")}>
          <TextInput
            type="date"
            value={c.eventDate}
            onChange={(e) => onChange(updateCommon(draft, { eventDate: e.target.value }))}
          />
        </FormField>
        <FormField label="Hesap tarihi" required error={errorFor(fieldErrors, "common.calculationDate")}>
          <TextInput
            type="date"
            value={c.calculationDate}
            onChange={(e) => onChange(updateCommon(draft, { calculationDate: e.target.value }))}
          />
        </FormField>
        <FormField label="Olay yeri">
          <TextInput
            value={c.eventLocation ?? ""}
            onChange={(e) => onChange(updateCommon(draft, { eventLocation: e.target.value }))}
          />
        </FormField>
        <FormField label="İş yeri adı">
          <TextInput
            value={c.workplaceName ?? ""}
            onChange={(e) => onChange(updateCommon(draft, { workplaceName: e.target.value }))}
          />
        </FormField>
        <FormField label="İş yeri sicil numarası">
          <TextInput
            value={c.workplaceRegistryNo ?? ""}
            onChange={(e) => onChange(updateCommon(draft, { workplaceRegistryNo: e.target.value }))}
          />
        </FormField>
        <FormField label="İş kazası bildirim tarihi">
          <TextInput
            type="date"
            value={c.accidentNotificationDate ?? ""}
            onChange={(e) =>
              onChange(updateCommon(draft, { accidentNotificationDate: e.target.value }))
            }
          />
        </FormField>
      </FormGrid>
      <FormField label="Olay açıklaması">
        <TextTextarea
          value={c.eventDescription ?? ""}
          onChange={(e) => onChange(updateCommon(draft, { eventDescription: e.target.value }))}
        />
      </FormField>
      <FormField label="Dosya notu">
        <TextTextarea
          value={c.fileNote ?? ""}
          onChange={(e) => onChange(updateCommon(draft, { fileNote: e.target.value }))}
        />
      </FormField>
    </FormSection>
  );
}
