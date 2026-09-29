import type { WizardStepConfig, StepProps } from "../shared/wizardTypes";
import { DeathExpensesStep } from "../shared/CommonSteps";
import { DeceasedStep } from "../shared/PersonSteps";
import { TrafficDeductionCards } from "../shared/TrafficLifeExpectancyStep";
import { newId } from "../../types/calculationDraft";
import { deathZmtsGaramePeople, deathZmtsPlaintiffOptions } from "../../utils/deathZmtsClaimants";
import { EducationExpenseStep, MarriageProbabilityStep } from "../shared/TrafficDeathDeductionSteps";
import { TrafficDeathBeneficiariesStep } from "../shared/TrafficDeathBeneficiariesStep";
import { TrafficDeathIncomeSection } from "../shared/TrafficDeathIncomeSection";
import { TrafficDeathLiabilityStep } from "../shared/TrafficDeathLiabilityStep";
import { TrafficDeathShareRatiosStep } from "../shared/TrafficDeathShareRatiosStep";

function DeceasedAndIncomeStep(props: StepProps) {
  return (
    <div className="space-y-5">
      <DeceasedStep {...props} />
      <TrafficDeathIncomeSection {...props} />
    </div>
  );
}

function LiabilityTraffic(props: StepProps) {
  return <TrafficDeathLiabilityStep {...props} />;
}

function emptyInsurancePayment() {
  return {
    id: newId(),
    paymentDate: "",
    paymentAmount: 0,
    liabilityLimit: 0,
    accidentLimit: 0,
    garameEntries: [],
    garameEnabled: false,
  };
}

function InsuranceAndPrior({ draft, onChange }: StepProps) {
  if (draft.calculationType !== "TRAFFIC_DEATH") return null;
  const deceasedName = draft.deceased.fullName?.trim() || "Müteveffa";
  return (
    <div className="space-y-6">
      <TrafficDeductionCards
        sosyal={draft.sosyalYardimOdenekleri ?? []}
        documents={draft.capitalValueDocuments ?? []}
        zmts={draft.zmtsPayments ?? []}
        casco={draft.cascoPayments ?? []}
        onChangeSosyal={(sosyalYardimOdenekleri) => onChange({ ...draft, sosyalYardimOdenekleri })}
        onChangeDocuments={(capitalValueDocuments) => onChange({ ...draft, capitalValueDocuments })}
        onChangeZmts={(zmtsPayments) => onChange({ ...draft, zmtsPayments })}
        onChangeCasco={(cascoPayments) => onChange({ ...draft, cascoPayments })}
        newZmts={emptyInsurancePayment}
        newCasco={emptyInsurancePayment}
        garameSubject={{
          plaintiffName: deceasedName,
          faultRate: draft.deceasedFaultRate,
        }}
        zmtsClaimants={deathZmtsPlaintiffOptions(draft.beneficiaries)}
        cascoClaimants={deathZmtsPlaintiffOptions(draft.beneficiaries)}
        garamePeople={deathZmtsGaramePeople(draft.beneficiaries)}
      />
    </div>
  );
}

export const trafficDeathSteps: WizardStepConfig[] = [
  {
    id: "deceased",
    title: "Müteveffa Bilgileri",
    shortTitle: "Müteveffa",
    description: "Kimlik, ölüm ve çalışma/gelir bilgileri",
    sectionKey: "deceased",
    Component: DeceasedAndIncomeStep,
  },
  {
    id: "beneficiaries",
    title: "Hak Sahipleri",
    shortTitle: "Hak sahipleri",
    description: "Destekten yoksun kalanlar",
    sectionKey: "beneficiaries",
    Component: TrafficDeathBeneficiariesStep,
  },
  {
    id: "supportRelations",
    title: "Pay Oranları",
    shortTitle: "Pay oranları",
    description: "Hak sahiplerine ait pay oranları",
    sectionKey: "supportRelations",
    optional: true,
    Component: TrafficDeathShareRatiosStep,
  },
  {
    id: "liability",
    title: "Kusur ve Sorumluluk",
    shortTitle: "Kusur",
    description: "Sorumluluk oranları",
    sectionKey: "liability",
    Component: LiabilityTraffic,
  },
  {
    id: "marriageProbabilityDeduction",
    title: "Evlenme İhtimali İndirimi",
    shortTitle: "Evlenme",
    description: "Eşin evlenme ihtimali ve 18 yaş altı çocuk indirimi",
    sectionKey: "marriageProbabilityDeduction",
    optional: true,
    Component: MarriageProbabilityStep,
  },
  {
    id: "educationExpenseDeduction",
    title: "Eğitim Gideri İndirimi",
    shortTitle: "Eğitim",
    description: "Eğitim gideri notu; oran henüz hesaplanmaz",
    sectionKey: "educationExpenseDeduction",
    optional: true,
    Component: EducationExpenseStep,
  },
  {
    id: "deathExpenses",
    title: "Ölüm Öncesi ve Cenaze Giderleri",
    shortTitle: "Giderler",
    description: "Tedavi ve cenaze",
    sectionKey: "deathExpenses",
    optional: true,
    Component: DeathExpensesStep,
  },
  {
    id: "priorPayments",
    title: "Sigorta ve Önceki Ödemeler",
    shortTitle: "Ödemeler",
    description: "Sigorta ve ödemeler",
    sectionKey: "priorPayments",
    optional: true,
    Component: InsuranceAndPrior,
  },
];
