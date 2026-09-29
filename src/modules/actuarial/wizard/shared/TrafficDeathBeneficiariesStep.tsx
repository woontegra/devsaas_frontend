import type { Beneficiary, BeneficiaryClaimantStatus, TrafficDeathDraft } from "../../types/calculationDraft";
import { newId } from "../../types/calculationDraft";
import { resolveBeneficiaryClaimantStatus } from "../../utils/beneficiaryClaimantStatus";
import {
  AddRowButton,
  DeleteIconButton,
  EmptyState,
  FormField,
  FormSection,
  TextInput,
  TextSelect,
} from "./FormPrimitives";
import type { StepProps } from "./wizardTypes";
import { errorFor } from "./wizardTypes";

function emptyBeneficiary(status: BeneficiaryClaimantStatus): Beneficiary {
  return {
    id: newId(),
    fullName: "",
    relation: status === "PLAINTIFF" ? "spouse" : "child",
    birthDate: "",
    gender: status === "PLAINTIFF" ? "female" : "male",
    claimantStatus: status,
  };
}

function BeneficiaryRowEditor({
  beneficiary,
  globalIndex,
  fieldErrors,
  onChange,
  onRemove,
}: {
  beneficiary: Beneficiary;
  globalIndex: number;
  fieldErrors: StepProps["fieldErrors"];
  onChange: (next: Beneficiary) => void;
  onRemove: () => void;
}) {
  const prefix = `beneficiaries[${globalIndex}]`;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl border border-[#DCE3E8] p-4 bg-white">
      <FormField label="Ad soyad" error={errorFor(fieldErrors, `${prefix}.fullName`)}>
        <TextInput
          value={beneficiary.fullName}
          onChange={(e) => onChange({ ...beneficiary, fullName: e.target.value })}
        />
      </FormField>
      <FormField label="Yakınlık" error={errorFor(fieldErrors, `${prefix}.relation`)}>
        <TextSelect
          value={beneficiary.relation}
          onChange={(e) =>
            onChange({ ...beneficiary, relation: e.target.value as Beneficiary["relation"] })
          }
        >
          <option value="spouse">Eş</option>
          <option value="child">Çocuk</option>
          <option value="mother">Anne</option>
          <option value="father">Baba</option>
          <option value="sibling">Kardeş</option>
          <option value="other">Diğer</option>
        </TextSelect>
      </FormField>
      <FormField label="Doğum tarihi" error={errorFor(fieldErrors, `${prefix}.birthDate`)}>
        <TextInput
          type="date"
          value={beneficiary.birthDate}
          onChange={(e) => onChange({ ...beneficiary, birthDate: e.target.value })}
        />
      </FormField>
      <FormField label="Cinsiyet" error={errorFor(fieldErrors, `${prefix}.gender`)}>
        <TextSelect
          value={beneficiary.gender}
          onChange={(e) =>
            onChange({ ...beneficiary, gender: e.target.value as Beneficiary["gender"] })
          }
        >
          <option value="female">Kadın</option>
          <option value="male">Erkek</option>
        </TextSelect>
      </FormField>

      {beneficiary.relation === "spouse" && (
        <>
          <FormField
            label="Yeniden evlendi mi?"
            error={errorFor(fieldErrors, `${prefix}.remarried`)}
          >
            <TextSelect
              value={
                beneficiary.remarried === true
                  ? "yes"
                  : beneficiary.remarried === false
                    ? "no"
                    : ""
              }
              onChange={(e) => {
                const v = e.target.value;
                if (v === "yes") {
                  onChange({ ...beneficiary, remarried: true });
                } else if (v === "no") {
                  onChange({ ...beneficiary, remarried: false, remarriageDate: null });
                } else {
                  onChange({ ...beneficiary, remarried: undefined, remarriageDate: null });
                }
              }}
            >
              <option value="">Seçiniz</option>
              <option value="no">Hayır</option>
              <option value="yes">Evet</option>
            </TextSelect>
          </FormField>
          {beneficiary.remarried === true && (
            <FormField
              label="Yeniden evlenme tarihi"
              error={errorFor(fieldErrors, `${prefix}.remarriageDate`)}
            >
              <TextInput
                type="date"
                value={beneficiary.remarriageDate ?? ""}
                onChange={(e) => onChange({ ...beneficiary, remarriageDate: e.target.value })}
              />
            </FormField>
          )}
        </>
      )}

      <div className="flex items-end">
        <DeleteIconButton title="Hak sahibini sil" onClick={onRemove} />
      </div>
    </div>
  );
}

function BeneficiaryGroupSection({
  title,
  claimantStatus,
  rows,
  allRows,
  onChangeAll,
  fieldErrors,
}: {
  title: string;
  claimantStatus: BeneficiaryClaimantStatus;
  rows: Beneficiary[];
  allRows: Beneficiary[];
  onChangeAll: (beneficiaries: Beneficiary[]) => void;
  fieldErrors: StepProps["fieldErrors"];
}) {
  const updateRow = (id: string, next: Beneficiary) => {
    onChangeAll(allRows.map((b) => (b.id === id ? next : b)));
  };
  const removeRow = (id: string) => {
    onChangeAll(allRows.filter((b) => b.id !== id));
  };
  const addRow = () => {
    onChangeAll([...allRows, emptyBeneficiary(claimantStatus)]);
  };

  return (
    <FormSection title={title}>
      {rows.length === 0 ? (
        <EmptyState
          title={`Henüz ${title.toLowerCase()} hak sahibi eklenmedi.`}
          actionLabel="Hak Sahibi Ekle"
          onAction={addRow}
        />
      ) : (
        <div className="space-y-3">
          {rows.map((b) => {
            const globalIndex = allRows.findIndex((x) => x.id === b.id);
            return (
              <BeneficiaryRowEditor
                key={b.id}
                beneficiary={b}
                globalIndex={globalIndex}
                fieldErrors={fieldErrors}
                onChange={(next) => updateRow(b.id, next)}
                onRemove={() => removeRow(b.id)}
              />
            );
          })}
          <AddRowButton label="Hak Sahibi Ekle" onClick={addRow} />
        </div>
      )}
    </FormSection>
  );
}

export function TrafficDeathBeneficiariesStep({ draft, onChange, fieldErrors }: StepProps) {
  if (draft.calculationType !== "TRAFFIC_DEATH") return null;
  const td = draft as TrafficDeathDraft;
  const rows = td.beneficiaries;
  const set = (beneficiaries: Beneficiary[]) =>
    onChange({
      ...td,
      beneficiaries,
    });

  const plaintiffs = rows.filter((b) => resolveBeneficiaryClaimantStatus(b) === "PLAINTIFF");
  const outOfCase = rows.filter((b) => resolveBeneficiaryClaimantStatus(b) === "OUT_OF_CASE");

  return (
    <div className="space-y-5">
      {errorFor(fieldErrors, "beneficiaries") && (
        <p className="text-[13px] text-red-600">{errorFor(fieldErrors, "beneficiaries")}</p>
      )}

      <BeneficiaryGroupSection
        title="Davacılar"
        claimantStatus="PLAINTIFF"
        rows={plaintiffs}
        allRows={rows}
        onChangeAll={set}
        fieldErrors={fieldErrors}
      />

      <BeneficiaryGroupSection
        title="Dava Dışı"
        claimantStatus="OUT_OF_CASE"
        rows={outOfCase}
        allRows={rows}
        onChangeAll={set}
        fieldErrors={fieldErrors}
      />
    </div>
  );
}
