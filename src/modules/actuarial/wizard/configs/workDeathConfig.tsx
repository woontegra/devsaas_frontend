import type { WizardStepConfig, StepProps } from "../shared/wizardTypes";
import {
  BeneficiariesStep,
  CapitalValueDocsStep,
  EmploymentStep,
  GenericExpensesStep,
  IncomePeriodsStep,
  LiabilityStep,
  PriorPaymentsStep,
  SgkDeathIncomeStep,
  SupportRelationsStep,
} from "../shared/CommonSteps";
import { WorkAccidentCaseStep } from "../shared/CaseSteps";
import { DeceasedEmployeeStep } from "../shared/PersonSteps";

function LiabilityWork(props: StepProps) {
  return <LiabilityStep {...props} showInevitability />;
}

function CaseAndWork(props: StepProps) {
  return (
    <div className="space-y-6">
      <WorkAccidentCaseStep {...props} />
      <EmploymentStep {...props} />
    </div>
  );
}

function ExpensesAndPrior(props: StepProps) {
  return (
    <div className="space-y-6">
      <GenericExpensesStep {...props} />
      <PriorPaymentsStep {...props} />
    </div>
  );
}

export const workDeathSteps: WizardStepConfig[] = [
  {
    id: "caseEvent",
    title: "Dosya ve İş Kazası",
    shortTitle: "Dosya",
    description: "Olay, iş yeri ve bildirim",
    sectionKey: "caseEvent",
    Component: CaseAndWork,
  },
  {
    id: "deceasedEmployee",
    title: "Müteveffa İşçi",
    shortTitle: "Müteveffa",
    description: "Kimlik bilgileri",
    sectionKey: "deceasedEmployee",
    Component: DeceasedEmployeeStep,
  },
  {
    id: "income",
    title: "Çalışma ve Ücret",
    shortTitle: "Ücret",
    description: "Gelir dönemleri",
    sectionKey: "income",
    Component: IncomePeriodsStep,
  },
  {
    id: "beneficiaries",
    title: "Hak Sahipleri",
    shortTitle: "Hak sahipleri",
    description: "Hak sahipleri listesi",
    sectionKey: "beneficiaries",
    Component: BeneficiariesStep,
  },
  {
    id: "supportRelations",
    title: "Destek İlişkileri",
    shortTitle: "Destek",
    description: "Destek girdileri",
    sectionKey: "supportRelations",
    optional: true,
    Component: SupportRelationsStep,
  },
  {
    id: "liability",
    title: "Kusur ve Kaçınılmazlık",
    shortTitle: "Kusur",
    description: "Sorumluluk",
    sectionKey: "liability",
    Component: LiabilityWork,
  },
  {
    id: "sgkDeathIncomes",
    title: "SGK Ölüm Gelirleri",
    shortTitle: "SGK",
    description: "Belge verileri",
    sectionKey: "sgkDeathIncomes",
    optional: true,
    Component: SgkDeathIncomeStep,
  },
  {
    id: "capitalValueDocuments",
    title: "Peşin Sermaye Değeri Bilgileri",
    shortTitle: "PSD belge",
    description: "Belge girişi — hesap yok",
    sectionKey: "capitalValueDocuments",
    optional: true,
    Component: CapitalValueDocsStep,
  },
  {
    id: "expenses",
    title: "Giderler ve Önceki Ödemeler",
    shortTitle: "Giderler",
    description: "Gider ve ödemeler",
    sectionKey: "expenses",
    optional: true,
    Component: ExpensesAndPrior,
  },
];
