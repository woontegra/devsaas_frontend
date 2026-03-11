/**
 * Aktüerya dava formu tipleri (wizard state).
 * Backend ActuarialCaseInput ile uyumlu.
 */

export type Gender = "male" | "female";

/** Bilirkişi hesap türleri */
export const CalculationType = {
  TRAFFIC_DEATH: "TRAFFIC_DEATH",
  TRAFFIC_INJURY: "TRAFFIC_INJURY",
  WORK_DEATH: "WORK_DEATH",
  WORK_INJURY: "WORK_INJURY",
} as const;
export type CalculationType = (typeof CalculationType)[keyof typeof CalculationType];

export type AccidentType = "work" | "traffic" | "support_loss" | "disability";
export type MaritalStatus = "single" | "married" | "divorced" | "widowed";
export type EducationLevel = "primary" | "high_school" | "university" | "other";
export type IncomeType = "min_wage" | "comparable_wage" | "sgk_income";
export type LifeTable = "TRH2010" | "CSO1980" | "PMF1931";
export type SupportRelationship = "spouse" | "child" | "mother" | "father";
export type ChildEducation = "primary" | "high_school" | "university";
export type InterestType = "legal" | "advance";

export interface PersonalInfo {
  birthDate: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  educationLevel: EducationLevel;
  occupation: string;
  eventDate: string;
  calculationDate: string;
}

export interface AccidentInfo {
  accidentType: AccidentType;
  plaintiffFaultRatio: number;
  defendantFaultRatio: number;
}

export interface IncomeInfo {
  grossSalary: number;
  netSalary: number;
  incomeType: IncomeType;
  incomeStartDate: string;
  incomeIncreaseRate: number;
}

export interface ActuarialParams {
  lifeTable: LifeTable;
  activePeriodAge: number;
  passivePeriodAge: number;
  increaseRate: number;
  discountRate: number;
  progressiveRant: boolean;
  maluliyetOrani: number;
  sgkGeliri: number;
  /** SGK aylık gelir; verilirse TRH2010 ile PSD hesaplanır */
  monthlySgkIncome: number;
  /** Geçici iş göremezlik başlangıç (YYYY-MM-DD) */
  temporaryDisabilityStartDate: string;
  /** Geçici iş göremezlik bitiş (YYYY-MM-DD) */
  temporaryDisabilityEndDate: string;
  /** Aylık bakıcı gideri */
  monthlyCareCost: number;
  /** Pasif dönem manuel override: emeklilik yaşı (örn. 60, 65); verilirse motor bu yaşı kullanır */
  retirementAgeOverride?: number;
}

export interface SupportPerson {
  id: string;
  name: string;
  birthDate: string;
  gender: Gender;
  shareRatio: number;
  supportDurationYears?: number;
  relationship: SupportRelationship;
}

export interface MarriageProbability {
  marriageProbability: number;
}

export interface MilitaryParams {
  militaryAge: number;
  militaryDurationMonths: number;
}

export interface EducationParams {
  childEducationLevel: ChildEducation;
}

export interface UpbringingParams {
  upbringingCost: number;
  childRearingCost: number;
}

export interface InterestParams {
  interestStartDate: string;
  interestType: InterestType;
}

export interface PastPeriodParams {
  pastPeriodStartDate: string;
  pastPeriodEndDate: string;
}

export interface ActuarialCaseFormState {
  calculationType: CalculationType;
  personal: PersonalInfo;
  accident: AccidentInfo;
  income: IncomeInfo;
  actuarial: ActuarialParams;
  supports: SupportPerson[];
  marriageProbability?: MarriageProbability;
  military?: MilitaryParams;
  education?: EducationParams;
  upbringing?: UpbringingParams;
  interest?: InterestParams;
  pastPeriod?: PastPeriodParams;
}

export const defaultPersonal: PersonalInfo = {
  birthDate: "",
  gender: "male",
  maritalStatus: "single",
  educationLevel: "other",
  occupation: "",
  eventDate: "",
  calculationDate: new Date().toISOString().slice(0, 10),
};

export const defaultAccident: AccidentInfo = {
  accidentType: "traffic",
  plaintiffFaultRatio: 0,
  defendantFaultRatio: 100,
};

export const defaultIncome: IncomeInfo = {
  grossSalary: 0,
  netSalary: 0,
  incomeType: "comparable_wage",
  incomeStartDate: "",
  incomeIncreaseRate: 0.03,
};

export const defaultActuarial: ActuarialParams = {
  lifeTable: "TRH2010",
  activePeriodAge: 65,
  passivePeriodAge: 0,
  increaseRate: 0.03,
  discountRate: 0.10,
  progressiveRant: true,
  maluliyetOrani: 100,
  sgkGeliri: 0,
  monthlySgkIncome: 0,
  temporaryDisabilityStartDate: "",
  temporaryDisabilityEndDate: "",
  monthlyCareCost: 0,
};

export const defaultCaseFormState: ActuarialCaseFormState = {
  calculationType: "TRAFFIC_DEATH",
  personal: defaultPersonal,
  accident: defaultAccident,
  income: defaultIncome,
  actuarial: defaultActuarial,
  supports: [],
};
