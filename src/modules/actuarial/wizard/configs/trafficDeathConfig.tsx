import type { WizardStepConfig, StepProps } from "../shared/wizardTypes";
import {
  BeneficiariesStep,
  DeathExpensesStep,
  IncomePeriodsStep,
  LiabilityStep,
  PriorPaymentsStep,
  SupportRelationsStep,
} from "../shared/CommonSteps";
import { TrafficCaseStep } from "../shared/CaseSteps";
import { DeceasedStep, InsurancePriorStep } from "../shared/PersonSteps";

function LiabilityTraffic(props: StepProps) {
  return <LiabilityStep {...props} showInevitability={false} />;
}

function InsuranceAndPrior(props: StepProps) {
  return (
    <div className="space-y-5">
      <InsurancePriorStep {...props} />
      <PriorPaymentsStep {...props} />
    </div>
  );
}

export const trafficDeathSteps: WizardStepConfig[] = [
  {
    id: "caseEvent",
    title: "Dosya ve Olay",
    shortTitle: "Dosya",
    description: "Mahkeme ve olay",
    sectionKey: "caseEvent",
    Component: TrafficCaseStep,
  },
  {
    id: "deceased",
    title: "Müteveffa Bilgileri",
    shortTitle: "Müteveffa",
    description: "Kimlik ve ölüm bilgileri",
    sectionKey: "deceased",
    Component: DeceasedStep,
  },
  {
    id: "income",
    title: "Çalışma ve Gelir",
    shortTitle: "Gelir",
    description: "Gelir dönemleri",
    sectionKey: "income",
    Component: IncomePeriodsStep,
  },
  {
    id: "beneficiaries",
    title: "Hak Sahipleri",
    shortTitle: "Hak sahipleri",
    description: "Destekten yoksun kalanlar",
    sectionKey: "beneficiaries",
    Component: BeneficiariesStep,
  },
  {
    id: "supportRelations",
    title: "Destek İlişkileri",
    shortTitle: "Destek",
    description: "Destek dönemleri (hesap yok)",
    sectionKey: "supportRelations",
    optional: true,
    Component: SupportRelationsStep,
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
