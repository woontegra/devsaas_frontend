/** Backend trafficInjury/types.ts ile uyumlu — yalnızca görüntüleme */

export type TrafficInjuryPeriodKind =
  | "temporary_incapacity"
  | "processed_permanent"
  | "future_permanent";

export type FuturePeriodPhase = "ACTIVE" | "PASSIVE";

export interface TrafficInjuryPeriodRow {
  startDate: string;
  endDate: string;
  dayCount: number;
  monthlyNetIncome: number;
  dailyNetIncome: number;
  kn?: number;
  discountFactor?: number;
  increasedIncome?: number;
  discountedIncome?: number;
  disabilityRate: number;
  periodDamage: number;
  periodKind: TrafficInjuryPeriodKind;
  phase?: FuturePeriodPhase;
}

export interface ResolvedIncomeInfo {
  incomeMode: string;
  monthlyNetAtEvent: number;
  monthlyNetAtCalculation: number;
  dailyNetAtCalculation: number;
  coefficient: number;
  eventDateMinWage: number | null;
}

export interface LifeExpectancyInfo {
  completedAgeYears: number | null;
  ageAtAccident: { years: number; months: number; days: number } | null;
  decimalLifeExpectancy: number | null;
  lifeExpectancyYmd: { year: number; month: number; day: number };
  probableLifeEndDate: string | null;
  passivePhaseStartDate: string | null;
}

export interface LegalInterestSegment {
  startDate: string;
  endDate: string;
  annualRatePercent: number;
  calendarDayCount: number;
  interestAmount: number;
}

export interface InsuranceInterestDeductionRow {
  paymentDate: string;
  calculationDate: string;
  principalAmount: number;
  calendarDayCount: number;
  interestSegments: LegalInterestSegment[];
  interestAmount: number;
  principalPlusInterest: number;
}

export interface InsuranceDeductionGroup {
  rows: InsuranceInterestDeductionRow[];
  principalTotal: number;
  interestTotal: number;
  deductionTotal: number;
}

export interface InsuranceDeductions {
  zmts: InsuranceDeductionGroup;
  casco: InsuranceDeductionGroup;
}

export interface TrafficInjuryCalculationResult {
  resolvedIncome: ResolvedIncomeInfo;
  dailyNetIncome: number;
  processedPeriods: TrafficInjuryPeriodRow[];
  temporaryIncapacityPeriods: TrafficInjuryPeriodRow[];
  futurePeriods: TrafficInjuryPeriodRow[];
  temporaryIncapacityTotal: number;
  processedPermanentTotal: number;
  futurePermanentTotal: number;
  totalDamageBeforeFault: number;
  injuredFaultRate: number;
  faultDeductionAmount: number;
  totalAfterFault: number;
  psdTotal: number;
  psdDeductibleAfterFault: number;
  totalAfterPSD: number;
  lifeExpectancy: LifeExpectancyInfo;
  permanentDisabilityRate: number;
  probableLifeEndDate: string | null;
  passivePhaseStartDate: string | null;
  finalCompensationBeforeInsurance: number;
  insuranceDeductions: InsuranceDeductions;
  finalCompensationAfterInsurance: number;
  insuranceClaimContext: {
    claimAmountBeforeGarame: number;
    claimAmountAfterInsurance: number;
    totalDamageBeforeFault: number;
    totalAfterFault: number;
    totalAfterPSD: number;
    injuredFaultRate: number;
    garameInterestContext: Array<{
      paymentId: string;
      kind: "zmts" | "casco";
      principalPlusInterest: number;
    }>;
  };
  temporaryIncapacityGapIgnored?: boolean;
  temporaryIncapacityEffectiveRange?: { startDate: string; endDate: string } | null;
  warnings: string[];
}

export interface CalculationRunResponse {
  valid: boolean;
  warnings: { code: string; message: string }[];
  result: TrafficInjuryCalculationResult | import("./trafficDeathResult").TrafficDeathCalculationResult;
  access?: {
    code: string;
    inputHash: string | null;
    calculationHashVersion: number;
  };
  calculationId?: string;
  trial?: import("./savedCalculation").TrialInfo | null;
  trialCreditConsumed?: boolean;
}
