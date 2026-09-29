/**
 * Frontend CalculationDraft — backend ile birebir uyumlu (schemaVersion: 2).
 */

export const CALCULATION_SCHEMA_VERSION = 2 as const;

export type CalculationType =
  | "TRAFFIC_INJURY"
  | "TRAFFIC_DEATH"
  | "WORK_INJURY"
  | "WORK_DEATH";

export type Gender = "male" | "female";
export type IncomeAmountKind = "gross" | "net";
export type IncomeSourceType =
  | "min_wage"
  | "payroll"
  | "comparable"
  | "chamber"
  | "witness"
  | "other"
  | "sgk"
  | "wage";

export type RelationType =
  | "spouse"
  | "child"
  | "mother"
  | "father"
  | "sibling"
  | "other";

export type LiablePartyType =
  | "plaintiff"
  | "defendant"
  | "employer"
  | "subcontractor"
  | "third_party"
  | "other";

export interface CommonCaseInfo {
  internalFileName?: string;
  courtName?: string;
  caseNumber?: string;
  eventDate: string;
  calculationDate: string;
  eventDescription?: string;
  /** Trafik hesapları */
  insuranceCompany?: string;
  policyNumber?: string;
  coverageNotes?: string;
  /** İş kazası hesapları */
  eventLocation?: string;
  workplaceName?: string;
  workplaceRegistryNo?: string;
  accidentNotificationDate?: string;
  fileNote?: string;
}

export interface IncomePeriod {
  id: string;
  startDate: string;
  endDate?: string;
  amount: number;
  amountKind: IncomeAmountKind;
  sourceType: IncomeSourceType;
  documentSource?: string;
  label?: string;
}

export interface LiableParty {
  id: string;
  partyType: LiablePartyType;
  name: string;
  faultRatio: number;
}

export interface LiabilityBlock {
  injuredFaultRatio: number;
  parties: LiableParty[];
  /** Trafik: dava dışı kusur (hesap indirimine dahil edilmez) */
  externalFaultRatio?: number;
  inevitabilityRatio?: number;
}

export interface PersonBase {
  fullName?: string;
  birthDate: string;
  gender: Gender;
  occupation?: string;
  employmentStatus?: string;
  retirementStatus?: string;
  insuranceStatus?: string;
  notes?: string;
}

export interface InjuredPerson extends PersonBase {
  workStatus?: string;
}

export type PlaintiffGender = "FEMALE" | "MALE" | "";

export type DefendantType =
  | "INDIVIDUAL_DRIVER"
  | "INDIVIDUAL_VEHICLE_OWNER"
  | "CORPORATE_VEHICLE_OWNER"
  | "COMPULSORY_TRAFFIC_INSURER"
  | "CASCO_INSURER";

export interface PlaintiffInfo {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: PlaintiffGender;
}

export interface DefendantParty {
  id: string;
  type: DefendantType;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
}

/** TRAFFIC_DEATH kusur sorumluları — TRAFFIC_INJURY davalı tiplerinin alt kümesi */
export type TrafficDeathResponsibleType =
  | "INDIVIDUAL_DRIVER"
  | "INDIVIDUAL_VEHICLE_OWNER"
  | "CORPORATE_VEHICLE_OWNER";

export interface TrafficDeathResponsibleParty {
  id: string;
  type: TrafficDeathResponsibleType;
  faultRatio: number;
}

export interface TrafficInjuryParties {
  plaintiff: PlaintiffInfo;
  defendants: DefendantParty[];
}

export interface DeceasedPerson extends PersonBase {
  deathDate: string;
  maritalStatus?: string;
}

export interface EmployeePerson extends PersonBase {
  jobAtEvent?: string;
}

export interface DeceasedEmployee extends PersonBase {
  deathDate: string;
  jobAtEvent?: string;
}

export interface EmploymentInfo {
  employerName?: string;
  subEmployerName?: string;
  hireDate?: string;
  leaveDate?: string;
  jobAtEvent?: string;
  insuranceStatus?: string;
}

export interface DisabilityBlock {
  permanentDisabilityRate?: number;
  disabilityStartDate?: string;
  reportDate?: string;
  reportBasis?: string;
  earningCapacityLoss?: boolean;
  notes?: string;
  caregiverNeeded?: boolean;
}

export interface TemporaryIncapacityPeriod {
  id: string;
  startDate: string;
  endDate: string;
  dayCount?: number;
  rate?: number;
  notes?: string;
}

export type AverageIncomeKind = "min_wage" | "tuik" | "union" | "witness" | "other";

export interface AverageIncomeSource {
  id: string;
  kind: AverageIncomeKind;
  label?: string;
  amountKind: IncomeAmountKind;
  amount: number;
  /** Net karşılık — net seçilmişse = amount; brüt seçilmişse otomatik hesaplanır */
  netAmount?: number;
}

export type IncomeMode = "minWage" | "fixed" | "average";

export interface AccidentIncomeBlock {
  incomeMode: IncomeMode;
  fixedAmount: number | null;
  /** @deprecated — incomeMode kullanılıyor. Eski taslak uyumluluğu için korunuyor. */
  useAverage?: boolean;
  averageSources: AverageIncomeSource[];
  /** Modaldan "Uygula" ile hesaplanan ortalama net gelir */
  averageNetResult?: number;
}

export interface CaregiverExpenseRow {
  id: string;
  startDate: string;
  endDate: string;
  amount: number;
}

export interface ExpenseItem {
  id: string;
  name: string;
  category?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  amount: number;
  monthlyAmount?: number;
  notes?: string;
}

export interface PriorPayment {
  id: string;
  payer?: string;
  paymentType?: string;
  date?: string;
  amount: number;
  notes?: string;
}

export interface InsuranceInfo {
  company?: string;
  policyNumber?: string;
  coverageNotes?: string;
}

export type BeneficiaryClaimantStatus = "PLAINTIFF" | "OUT_OF_CASE";

export interface Beneficiary {
  id: string;
  fullName: string;
  relation: RelationType;
  birthDate: string;
  gender: Gender;
  claimantStatus?: BeneficiaryClaimantStatus;
  educationStatus?: string;
  workStatus?: string;
  dependencyStatus?: string;
  claimsSupport?: boolean;
  remarried?: boolean;
  remarriageDate?: string | null;
  notes?: string;
}

export interface SupportRelation {
  id: string;
  beneficiaryId: string;
  startDate?: string;
  endDate?: string;
  actualSupport?: boolean;
  supportShareInput?: number;
  educationOngoing?: boolean;
  remarriageAssessment?: string;
  specialNotes?: string;
}

export interface DeathExpenseBlock {
  preDeathTreatment?: number;
  preDeathIncomeLossNotes?: string;
  funeralCost?: number;
  transportCost?: number;
  otherExpenses: ExpenseItem[];
}

export interface SgkIncomeRecord {
  id: string;
  incomeKind?: string;
  startDate?: string;
  monthlyAmount?: number;
  paidPeriodNotes?: string;
  recourseNotes?: string;
  documentNotes?: string;
}

export interface SgkDeathIncomeRecord {
  id: string;
  beneficiaryId?: string;
  incomeKind?: string;
  startDate?: string;
  monthlyAmount?: number;
  bindingRatio?: number;
  documentDate?: string;
  documentNotes?: string;
}

export interface CapitalValueDocument {
  id: string;
  personLabel?: string;
  beneficiaryId?: string;
  amount?: number;
  documentDate?: string;
  documentNumber?: string;
  recourseIndicated?: boolean;
  notes?: string;
}

/**
 * TRAFFIC_DEATH ZMTS garame satırı. İlişki claimantId üzerindedir.
 * Mevcut mahsup tutarını değiştirmez.
 */
export interface DeathZmtsGarameRow {
  claimantId: string;
  claimantName?: string;
  claimantStatus?: "PLAINTIFF" | "OUT_OF_CASE";
  claimantRelation?: string;
  paymentDate?: string;
  paymentAmount?: number;
  liabilityLimit?: number;
  accidentLimit?: number;
}

/** Garame satırının bağlandığı dosya içi kişi kaydı */
export type InsuranceGarameSubjectRef = "plaintiff";

/**
 * Garame dağılımı — tek yaralı/hak sahibi satırı.
 *
 * Kullanıcı girdisi: subjectRef veya externalPersonLabel (ikisi birlikte değil).
 * Kişi adı, maluliyet ve kusur subjectRef üzerinden dosyadan okunur; ayrıca saklanmaz.
 *
 * Motor çıktıları (claimAmount … payableAfterPersonLimit): tazminat/garame motoru doldurur.
 */
export interface InsuranceGarameEntry {
  id: string;
  /** Dosyadaki kişi kaydına referans — maluliyet/kusur/ad buradan çözülür */
  subjectRef?: InsuranceGarameSubjectRef;
  /** Dosya dışı kaza mağduru tanımı — yalnızca subjectRef yokken; motor için asgari manuel tanım */
  externalPersonLabel?: string;
  /** Hesaplanan zarar / talep tutarı — motor çıktısı */
  claimAmount?: number;
  /** Garameye esas tutar — motor çıktısı */
  garameBasisAmount?: number;
  /** Garame oranı (0–1) — motor: garameBasisAmount / toplam garameye esas */
  garameRatio?: number;
  /** Kaza başı limitten düşen pay — motor çıktısı */
  accidentLimitShare?: number;
  /** Kişi başı limit sonrası ödenebilir tutar — motor çıktısı */
  payableAfterPersonLimit?: number;
}

export interface InsurancePaymentRecord {
  id: string;
  paymentDate: string;
  paymentAmount: number;
  /** Kişi başı limit (TL) */
  liabilityLimit: number;
  /** Kaza başı limit (TL) */
  accidentLimit?: number;
  /** parties.defendants[].id — ilgili sigorta davalısına referans (ZMTS/Kasko) */
  defendantId?: string;
  /** Garame dağılım satırları — ZMTS/Kasko birbirinden bağımsız */
  garameEntries?: InsuranceGarameEntry[];
  /** Garame hesabı bu ödeme kaydı için uygulanacak mı (varsayılan: kapalı) */
  garameEnabled?: boolean;
  /** TRAFFIC_DEATH ZMTS: ödemenin yapıldığı davacı. Eski kayıtlarda yoktur. */
  claimantId?: string;
  claimantName?: string;
  claimantRelation?: string;
  deathGarameRows?: DeathZmtsGarameRow[];
}

export interface CareExpensesBlock {
  temporaryCaregiver?: boolean;
  permanentCaregiver?: boolean;
  careStartDate?: string;
  careEndDate?: string;
  monthlyCareCost?: number;
  treatmentCost?: number;
  hospitalCost?: number;
  prosthesisCost?: number;
  otherExpenses: ExpenseItem[];
}

interface DraftBase {
  schemaVersion: typeof CALCULATION_SCHEMA_VERSION | number;
  common: CommonCaseInfo;
}

export interface TrafficInjuryDraft extends DraftBase {
  calculationType: "TRAFFIC_INJURY";
  parties: TrafficInjuryParties;
  liability: LiabilityBlock;
  disability: DisabilityBlock;
  temporaryIncapacityPeriods: TemporaryIncapacityPeriod[];
  /** Dönemler arası boşlukları kesintisiz geçici İG olarak hesapla */
  temporaryIncapacityIgnoreGaps?: boolean;
  accidentIncome: AccidentIncomeBlock;
  hospitalExpenses: ExpenseItem[];
  travelExpenses: ExpenseItem[];
  caregiverExpenses: CaregiverExpenseRow[];
  /** Pasif devre başlangıç yaşı (varsayılan 60) */
  passivePhaseAge?: number;
  /** İşlemiş dönem başlangıcı (varsayılan: common.eventDate) */
  processedPeriodStartDate?: string;
  /** İşlemiş dönem bitişi (varsayılan: common.calculationDate) */
  processedPeriodEndDate?: string;
  /** Peşin sermaye değeri belgeleri */
  capitalValueDocuments: CapitalValueDocument[];
  /** Sosyal yardım ödeneği belgeleri. PSD listesinden bağımsızdır. Eski kayıtlarda yoktur. */
  sosyalYardimOdenekleri?: CapitalValueDocument[];
  /** ZMTS ödemeleri */
  zmtsPayments: InsurancePaymentRecord[];
  /** Kasko ödemeleri */
  cascoPayments: InsurancePaymentRecord[];
}

export type DeceasedEmploymentStatus = "WORKING" | "NOT_WORKING" | null;

export type DeceasedMaritalStatus = "MARRIED" | "SINGLE" | "DIVORCED";

export type DeceasedMilitaryStatus = "COMPLETED" | "NOT_COMPLETED";

export type DeceasedChildEducationLevel =
  | "preschool"
  | "primary"
  | "middle"
  | "high"
  | "university"
  | "postgraduate"
  | "graduate"
  | "not_in_education"
  | "other";

export interface DeceasedChildRecord {
  id: string;
  gender: Gender;
  educationLevel: DeceasedChildEducationLevel | null;
  educationOther?: string;
}

export interface DeceasedFamilyInfo {
  maritalStatus: DeceasedMaritalStatus | null;
  militaryStatus: DeceasedMilitaryStatus | null;
  militaryServiceStartDate?: string | null;
  militaryServiceDurationMonths?: 6 | 12 | null;
  educationStatus: DeceasedChildEducationLevel | null;
  educationOtherDescription?: string;
  hasChildren: boolean | null;
  childrenCount: number;
  children: DeceasedChildRecord[];
}

/** Kullanıcı girdisi. Oran ve tutar motor tarafından türetilir. */
export interface MarriageProbabilityDeductionState {
  under18ChildCount: number;
  note?: string;
}

/** Eğitim gideri indirimi henüz parasal hesaba girmez. Not kaydı tutulur. */
export interface EducationExpenseDeductionState {
  notes: string;
}

export function emptyMarriageProbabilityDeduction(): MarriageProbabilityDeductionState {
  return { under18ChildCount: 0, note: "" };
}

export function emptyEducationExpenseDeduction(): EducationExpenseDeductionState {
  return { notes: "" };
}

export interface TrafficDeathDraft extends DraftBase {
  calculationType: "TRAFFIC_DEATH";
  employmentStatus: DeceasedEmploymentStatus;
  deceased: DeceasedPerson;
  deceasedFamilyInfo: DeceasedFamilyInfo;
  accidentIncome: AccidentIncomeBlock;
  nonWorkingSelectedIncome: number | null;
  incomePeriods: IncomePeriod[];
  beneficiaries: Beneficiary[];
  supportRelations: SupportRelation[];
  liability: LiabilityBlock;
  deceasedFaultRate: number;
  responsibleParties: TrafficDeathResponsibleParty[];
  externalFaultRate: number;
  /** @deprecated Eski davacı-bazlı kusur; restore'da yok sayılır */
  claimantFaultRates?: Record<string, number>;
  deathExpenses: DeathExpenseBlock;
  priorPayments: PriorPayment[];
  insurance: InsuranceInfo;
  /** Sosyal yardım ödeneği. Hesaba dahil değildir. Eski kayıtlarda yoktur. */
  sosyalYardimOdenekleri?: CapitalValueDocument[];
  /** Peşin sermaye değeri. Eski kayıtlarda yoktur. */
  capitalValueDocuments?: CapitalValueDocument[];
  zmtsPayments?: InsurancePaymentRecord[];
  cascoPayments?: InsurancePaymentRecord[];
  marriageProbabilityDeduction?: MarriageProbabilityDeductionState;
  educationExpenseDeduction?: EducationExpenseDeductionState;
}

export interface WorkInjuryDraft extends DraftBase {
  calculationType: "WORK_INJURY";
  employee: EmployeePerson;
  employment: EmploymentInfo;
  incomePeriods: IncomePeriod[];
  liability: LiabilityBlock;
  disability: DisabilityBlock;
  temporaryIncapacityPeriods: TemporaryIncapacityPeriod[];
  sgkIncome: SgkIncomeRecord[];
  capitalValueDocuments: CapitalValueDocument[];
  careAndExpenses: CareExpensesBlock;
  priorPayments: PriorPayment[];
}

export interface WorkDeathDraft extends DraftBase {
  calculationType: "WORK_DEATH";
  deceasedEmployee: DeceasedEmployee;
  employment: EmploymentInfo;
  incomePeriods: IncomePeriod[];
  beneficiaries: Beneficiary[];
  supportRelations: SupportRelation[];
  liability: LiabilityBlock;
  sgkDeathIncomes: SgkDeathIncomeRecord[];
  capitalValueDocuments: CapitalValueDocument[];
  expenses: ExpenseItem[];
  priorPayments: PriorPayment[];
}

export type CalculationDraft =
  | TrafficInjuryDraft
  | TrafficDeathDraft
  | WorkInjuryDraft
  | WorkDeathDraft;

export type CalculationDraftInput = CalculationDraft;

export type DraftSection = string;

export interface ValidationIssue {
  field: string;
  code: string;
  message: string;
}

export interface CalculationValidateResponse {
  valid: boolean;
  schemaVersion: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  completedSections: DraftSection[];
  missingSections: DraftSection[];
  message: string;
}

export const CALCULATION_TYPE_LABELS: Record<CalculationType, string> = {
  TRAFFIC_INJURY: "Trafik Kazası Yaralanma",
  TRAFFIC_DEATH: "Trafik Kazası Ölüm",
  WORK_INJURY: "İş Kazası Yaralanma",
  WORK_DEATH: "İş Kazası Ölüm",
};

export const CALCULATION_TYPE_DESCRIPTIONS: Record<CalculationType, string> = {
  TRAFFIC_INJURY:
    "Taraf bilgileri, kaza tarihi, kusur, hastane raporları, maluliyet, gelir ve masraf girişleri.",
  TRAFFIC_DEATH:
    "Destekten yoksun kalma, hak sahipleri, destek ilişkileri, kusur ve önceki ödemelere ilişkin veri girişi.",
  WORK_INJURY:
    "İşçi ücretleri, kusur, kaçınılmazlık, maluliyet, SGK gelirleri ve peşin sermaye değerine ilişkin veri girişi.",
  WORK_DEATH:
    "Hak sahipleri, destek ilişkileri, işveren sorumluluğu, SGK ölüm gelirleri ve peşin sermaye değerine ilişkin veri girişi.",
};

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function newId(): string {
  return crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyCommon(): CommonCaseInfo {
  return { eventDate: "", calculationDate: todayIso() };
}

function emptyLiability(work = false): LiabilityBlock {
  return {
    injuredFaultRatio: 0,
    parties: [],
    externalFaultRatio: 0,
    ...(work ? { inevitabilityRatio: 0 } : {}),
  };
}

export function createEmptyDraft(type: CalculationType): CalculationDraft {
  switch (type) {
    case "TRAFFIC_INJURY":
      return {
        schemaVersion: CALCULATION_SCHEMA_VERSION,
        calculationType: "TRAFFIC_INJURY",
        common: emptyCommon(),
        parties: {
          plaintiff: { firstName: "", lastName: "", birthDate: "", gender: "" },
          defendants: [],
        },
        liability: emptyLiability(),
        disability: {},
        temporaryIncapacityPeriods: [],
        temporaryIncapacityIgnoreGaps: false,
        accidentIncome: { incomeMode: "minWage", fixedAmount: null, averageSources: [] },
        hospitalExpenses: [],
        travelExpenses: [],
        caregiverExpenses: [],
        capitalValueDocuments: [],
        sosyalYardimOdenekleri: [],
        zmtsPayments: [],
        cascoPayments: [],
      };
    case "TRAFFIC_DEATH":
      return {
        schemaVersion: CALCULATION_SCHEMA_VERSION,
        calculationType: "TRAFFIC_DEATH",
        employmentStatus: null,
        common: emptyCommon(),
        deceased: { birthDate: "", deathDate: "", gender: "male" },
        deceasedFamilyInfo: {
          maritalStatus: null,
          militaryStatus: null,
          educationStatus: null,
          educationOtherDescription: "",
          hasChildren: null,
          childrenCount: 0,
          children: [],
        },
        accidentIncome: { incomeMode: "minWage", fixedAmount: null, averageSources: [] },
        nonWorkingSelectedIncome: null,
        incomePeriods: [],
        beneficiaries: [],
        supportRelations: [],
        liability: emptyLiability(),
        deceasedFaultRate: 0,
        responsibleParties: [],
        externalFaultRate: 0,
        deathExpenses: { otherExpenses: [] },
        priorPayments: [],
        insurance: {},
        sosyalYardimOdenekleri: [],
        capitalValueDocuments: [],
        zmtsPayments: [],
        cascoPayments: [],
        marriageProbabilityDeduction: emptyMarriageProbabilityDeduction(),
        educationExpenseDeduction: emptyEducationExpenseDeduction(),
      };
    case "WORK_INJURY":
      return {
        schemaVersion: CALCULATION_SCHEMA_VERSION,
        calculationType: "WORK_INJURY",
        common: emptyCommon(),
        employee: { birthDate: "", gender: "male" },
        employment: {},
        incomePeriods: [],
        liability: emptyLiability(true),
        disability: {},
        temporaryIncapacityPeriods: [],
        sgkIncome: [],
        capitalValueDocuments: [],
        careAndExpenses: { otherExpenses: [] },
        priorPayments: [],
      };
    case "WORK_DEATH":
      return {
        schemaVersion: CALCULATION_SCHEMA_VERSION,
        calculationType: "WORK_DEATH",
        common: emptyCommon(),
        deceasedEmployee: { birthDate: "", deathDate: "", gender: "male" },
        employment: {},
        incomePeriods: [],
        beneficiaries: [],
        supportRelations: [],
        liability: emptyLiability(true),
        sgkDeathIncomes: [],
        capitalValueDocuments: [],
        expenses: [],
        priorPayments: [],
      };
  }
}

export function isDeathType(t: CalculationType): boolean {
  return t === "TRAFFIC_DEATH" || t === "WORK_DEATH";
}

export function isWorkType(t: CalculationType): boolean {
  return t === "WORK_INJURY" || t === "WORK_DEATH";
}
