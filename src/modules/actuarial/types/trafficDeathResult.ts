/** Backend trafficDeath/types.ts ile uyumlu — yalnızca görüntüleme */

export interface TrafficDeathResolvedIncome {
  incomeMode: string;
  monthlyNetAtEvent: number;
  monthlyNetAtCalculation: number;
  dailyNetAtCalculation: number;
  coefficient: number;
  eventDateMinWage: number | null;
}

export interface TrafficDeathProcessedClaimantRow {
  startDate: string;
  endDate: string;
  dayCount: number;
  monthlyNetIncome: number;
  dailyNetIncome: number;
  periodIncome: number;
  claimantId: string;
  claimantName: string;
  claimantStatus: "PLAINTIFF" | "OUT_OF_CASE" | "SYNTHETIC" | null;
  relationLabel: string;
  shareFraction: string;
  sharePercentage: number;
  supportRate: number;
  periodDamage: number;
  periodKind: "processed_support";
}

export interface TrafficDeathFutureClaimantRow {
  startDate: string;
  endDate: string;
  dayCount: number;
  monthlyNetIncome: number;
  dailyNetIncome: number;
  kn: number;
  discountFactor: number;
  increasedIncome: number;
  discountedIncome: number;
  claimantId: string;
  claimantName: string;
  claimantStatus: "PLAINTIFF" | "OUT_OF_CASE" | "SYNTHETIC" | null;
  relationLabel: string;
  shareFraction: string;
  sharePercentage: number;
  periodDamage: number;
  periodKind: "future_support";
  periodIndex: number;
}

export interface TrafficDeathClaimantLoss {
  claimantId: string;
  claimantName: string;
  relationLabel: string;
  claimantStatus: "PLAINTIFF" | "OUT_OF_CASE" | "SYNTHETIC" | null;
  processedLoss: number;
  futureLoss: number;
  totalLoss: number;
  deceasedFaultRate?: number;
  lossAfterDeceasedFault?: number;
  marriageProbabilityRate?: number;
  marriageProbabilityApplied?: boolean;
  lossAfterMarriageProbability?: number;
  updatedZmtsPaymentAmount?: number;
  updatedCascoPaymentAmount?: number;
  lossAfterInsurancePayments?: number;
  zmtsPaymentDetails?: TrafficDeathPaymentDetail[];
  cascoPaymentDetails?: TrafficDeathPaymentDetail[];
}

export interface TrafficDeathGarameResponsibilityShareRow {
  claimantId: string;
  claimantName: string;
  relationLabel: string;
  claimantStatus: "PLAINTIFF" | "OUT_OF_CASE" | "SYNTHETIC" | null;
  remainingLoss: number;
  garameRatio: number;
  personLimit: number;
  responsibilityShare: number;
}

export interface TrafficDeathGarameResponsibilityGroup {
  totalRemainingLoss: number;
  personLimit: number;
  shares: TrafficDeathGarameResponsibilityShareRow[];
}

export interface TrafficDeathGarameResponsibilityShares {
  zmts: TrafficDeathGarameResponsibilityGroup | null;
  casco: TrafficDeathGarameResponsibilityGroup | null;
}

export interface TrafficDeathInterestSegment {
  startDate: string;
  endDate: string;
  annualRatePercent: number;
  calendarDayCount: number;
  interestAmount: number;
}

export interface TrafficDeathPaymentDetail {
  principal: number;
  paymentDate: string;
  calculationDate: string;
  legalInterestAmount: number;
  updatedAmount: number;
  interestSegments?: TrafficDeathInterestSegment[];
}

export interface TrafficDeathExpenseTotals {
  preDeathTreatment: number;
  funeralCost: number;
  transportCost: number;
  otherExpenses: number;
  total: number;
  grossPreDeathTreatment?: number;
  grossFuneralCost?: number;
  grossOtherExpenses?: number;
  grossTotal?: number;
}

export interface TrafficDeathMarriageProbability {
  applied: boolean;
  status: string;
  spouseClaimantId: string | null;
  spouseName: string | null;
  spouseGender: "female" | "male" | null;
  spouseBirthDate: string | null;
  calculationDate: string | null;
  spouseAgeAtCalculationDate: number | null;
  spouseAgeYmd: { years: number; months: number; days: number } | null;
  spouseAgeRangeKey: string | null;
  spouseAgeRangeLabel: string | null;
  baseMarriageProbabilityRate: number;
  under18ChildCount: number;
  suggestedUnder18ChildCount: number;
  childReductionRate: number;
  finalMarriageProbabilityRate: number;
  infoMessage: string | null;
}

export interface TrafficDeathCalculationResult {
  calculationType: "TRAFFIC_DEATH";
  resolvedIncome: TrafficDeathResolvedIncome;
  dailyNetIncome: number;
  personLives: unknown[];
  shareRatioPeriods: Array<{
    startDate: string;
    endDate: string;
    label?: string;
    periodType?: "PAST" | "FUTURE";
    shares: Record<string, string>;
    percentages?: Record<string, string>;
  }>;
  columnKeys: Array<{ key: string; header: string; subLabel?: string; synthetic?: boolean }>;
  supportPeriods: unknown[];
  processedPeriods: TrafficDeathProcessedClaimantRow[];
  futurePeriods: TrafficDeathFutureClaimantRow[];
  claimantLosses: TrafficDeathClaimantLoss[];
  processedTotal: number;
  futureTotal: number;
  totalSupportLoss: number;
  deceasedFaultRate: number;
  faultDeductionAmount: number;
  totalAfterFault: number;
  totalAfterMarriageProbability?: number;
  updatedZmtsPaymentTotal?: number;
  updatedCascoPaymentTotal?: number;
  totalAfterClaimantInsurance?: number;
  marriageProbability?: TrafficDeathMarriageProbability;
  deathExpenses: TrafficDeathExpenseTotals;
  priorPaymentsTotal: number;
  priorPaymentsApplied: boolean;
  psdTotal?: number;
  psdDeductibleAfterFault?: number;
  totalAfterCapitalValue?: number;
  insuranceDeductions?: {
    zmts: { principalTotal: number; interestTotal: number; deductionTotal: number };
    casco: { principalTotal: number; interestTotal: number; deductionTotal: number };
  };
  garameResponsibilityShares?: TrafficDeathGarameResponsibilityShares;
  educationExpenseDeduction?: {
    status: "READY" | "NO_END_DATE" | "INVALID_RANGE" | "NO_PARENTS" | "NO_MIN_WAGE";
    startDate: string | null;
    endDate: string | null;
    calculationDate: string | null;
    shareRate: number;
    father: { claimantId: string; claimantName: string; relation: "father" | "mother" } | null;
    mother: { claimantId: string; claimantName: string; relation: "father" | "mother" } | null;
    pastPeriods: Array<{
      startDate: string;
      endDate: string;
      netMinWage: number;
      dailyWage: number;
      dayCount: number;
      periodExpense: number;
      shareRate: number;
      fatherRearingExpense: number;
      motherRearingExpense: number;
    }>;
    futurePeriods: Array<{
      startDate: string;
      endDate: string;
      dayCount: number;
      netMinWage: number;
      dailyWage: number;
      kn: number;
      discountFactor: number;
      increasedExpense: number;
      discountedExpense: number;
      shareRate: number;
      fatherRearingExpense: number;
      motherRearingExpense: number;
      periodIndex: number;
    }>;
    futureBaseNetMinWage: number | null;
    fatherPastTotal: number;
    fatherFutureTotal: number;
    fatherTotal: number;
    motherPastTotal: number;
    motherFutureTotal: number;
    motherTotal: number;
    pastPeriodExpenseTotal: number;
    futurePeriodExpenseTotal: number;
    periodExpenseTotal: number;
  };
  finalCompensation: number;
  warnings: string[];
}

export function isTrafficDeathCalculationResult(
  value: unknown
): value is TrafficDeathCalculationResult {
  return (
    !!value &&
    typeof value === "object" &&
    (value as TrafficDeathCalculationResult).calculationType === "TRAFFIC_DEATH" &&
    Array.isArray((value as TrafficDeathCalculationResult).claimantLosses)
  );
}
