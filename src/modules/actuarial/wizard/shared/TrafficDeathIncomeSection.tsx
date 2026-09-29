import type { TrafficDeathDraft } from "../../types/calculationDraft";
import { FormField, FormSection, CurrencyInput } from "./FormPrimitives";
import type { StepProps } from "./wizardTypes";
import { errorFor } from "./wizardTypes";
import { AccidentIncomeSection, ReadonlyEventMinWage } from "./accidentIncomeUi";

export function TrafficDeathIncomeSection({ draft, onChange, fieldErrors }: StepProps) {
  if (draft.calculationType !== "TRAFFIC_DEATH") return null;
  const td = draft as TrafficDeathDraft;
  const eventDate = td.common.eventDate;

  return (
    <FormSection
      title="Çalışma ve Gelir"
      description="Çalışma durumu müteveffa bilgileri bölümünden seçilir; gelir bilgilerini buradan girin."
    >
      {td.employmentStatus == null && (
        <p className="text-[13px] text-[#66727F]">
          Gelir bilgilerini girmek için önce müteveffa bilgileri bölümünden çalışma durumunu seçin.
        </p>
      )}

      {td.employmentStatus === "WORKING" && (
        <AccidentIncomeSection
          income={td.accidentIncome ?? { incomeMode: "minWage", fixedAmount: null, averageSources: [] }}
          eventDate={eventDate}
          fieldErrors={fieldErrors}
          onChange={(accidentIncome) => onChange({ ...td, accidentIncome })}
        />
      )}

      {td.employmentStatus === "NOT_WORKING" && (
        <div className="space-y-4">
          <ReadonlyEventMinWage eventDate={eventDate} label="Kaza Tarihindeki Net Asgari Ücret" />
          <FormField label="Esas Alınacak Gelir" required error={errorFor(fieldErrors, "nonWorkingSelectedIncome")}>
            <CurrencyInput
              value={td.nonWorkingSelectedIncome ?? 0}
              onChange={(v) =>
                onChange({
                  ...td,
                  nonWorkingSelectedIncome: v === 0 ? null : v,
                })
              }
            />
          </FormField>
        </div>
      )}
    </FormSection>
  );
}
