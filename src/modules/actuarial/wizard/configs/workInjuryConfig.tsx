import type { WizardStepConfig, StepProps } from "../shared/wizardTypes";
import {
  CareExpensesStep,
  CapitalValueDocsStep,
  DisabilityStep,
  EmploymentStep,
  IncomePeriodsStep,
  LiabilityStep,
  PriorPaymentsStep,
  SgkIncomeStep,
  TemporaryIncapacityStep,
} from "../shared/CommonSteps";
import { WorkAccidentCaseStep } from "../shared/CaseSteps";
import { EmployeeStep } from "../shared/PersonSteps";

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

function DisabilityAndTemp(props: StepProps) {
  return (
    <div className="space-y-6">
      <DisabilityStep {...props} />
      <TemporaryIncapacityStep {...props} />
    </div>
  );
}

export const workInjurySteps: WizardStepConfig[] = [
  {
    id: "caseEvent",
    title: "Dosya ve İş Kazası",
    shortTitle: "Dosya",
    description: "Olay, iş yeri ve bildirim",
    sectionKey: "caseEvent",
    Component: CaseAndWork,
  },
  {
    id: "employee",
    title: "İşçi ve Çalışma Bilgileri",
    shortTitle: "İşçi",
    description: "İşçi kimliği",
    sectionKey: "employee",
    Component: EmployeeStep,
  },
  {
    id: "income",
    title: "Ücret ve Kazanç",
    shortTitle: "Ücret",
    description: "Gelir dönemleri",
    sectionKey: "income",
    Component: IncomePeriodsStep,
  },
  {
    id: "liability",
    title: "Kusur ve Kaçınılmazlık",
    shortTitle: "Kusur",
    description: "İşveren ve kaçınılmazlık",
    sectionKey: "liability",
    Component: LiabilityWork,
  },
  {
    id: "disability",
    title: "Maluliyet ve İş Göremezlik",
    shortTitle: "Maluliyet",
    description: "Oran ve dönemler",
    sectionKey: "disability",
    Component: DisabilityAndTemp,
  },
  {
    id: "sgkIncome",
    title: "SGK Gelirleri",
    shortTitle: "SGK",
    description: "Belge verileri",
    sectionKey: "sgkIncome",
    optional: true,
    Component: SgkIncomeStep,
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
    id: "careAndExpenses",
    title: "Bakıcı, Tedavi ve Diğer Giderler",
    shortTitle: "Giderler",
    description: "Giderler",
    sectionKey: "careAndExpenses",
    optional: true,
    Component: CareExpensesStep,
  },
  {
    id: "priorPayments",
    title: "Önceki Ödemeler",
    shortTitle: "Ödemeler",
    description: "Mahsup kayıtları",
    sectionKey: "priorPayments",
    optional: true,
    Component: PriorPaymentsStep,
  },
];
