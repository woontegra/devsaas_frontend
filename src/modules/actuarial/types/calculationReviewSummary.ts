/** POST /calculations/review-summary yanıtı — backend buildReviewSummary ile uyumlu */

export interface ReviewSummaryInsurancePayment {
  paymentDate: string | null;
  paymentAmount: number;
  liabilityLimit: number;
  accidentLimit: number | null;
  garameEnabled: boolean;
  garameEntryCount: number;
}

export interface ReviewSummaryTemporaryPeriod {
  startDate: string | null;
  endDate: string | null;
}

export interface ReviewSummaryPsdRow {
  amount: number | null;
  personLabel: string | null;
}

export interface TrafficInjuryReviewSummary {
  calculationType: "TRAFFIC_INJURY";
  plaintiffName: string;
  birthDate: string | null;
  gender: string | null;
  eventDate: string | null;
  calculationDate: string | null;
  processedPeriodStartDate: string | null;
  processedPeriodEndDate: string | null;
  temporaryIncapacityPeriods: ReviewSummaryTemporaryPeriod[];
  temporaryIncapacityIgnoreGaps: boolean;
  temporaryIncapacityGapIgnoredNote: string | null;
  permanentDisabilityRate: number | null;
  disabilityStartDate: string | null;
  injuredFaultRatio: number;
  defendantFaultRatios: Array<{ name: string; faultRatio: number }>;
  externalFaultRatio: number;
  incomeMode: string;
  fixedAmount: number | null;
  averageNetResult: number | null;
  passivePhaseAge: number | null;
  psdDocuments: ReviewSummaryPsdRow[];
  zmtsPayments: ReviewSummaryInsurancePayment[];
  cascoPayments: ReviewSummaryInsurancePayment[];
}

export interface TrafficDeathReviewSummary {
  calculationType: "TRAFFIC_DEATH";
  deceasedName: string;
  eventDate: string | null;
  calculationDate: string | null;
  employmentStatus: "WORKING" | "NOT_WORKING" | null;
  employmentStatusLabel: string;
  incomeMode: string | null;
  effectiveNetIncome: number | null;
  referenceMinWageAtEvent: number | null;
  nonWorkingSelectedIncome: number | null;
  plaintiffBeneficiaryCount: number;
  outOfCaseBeneficiaryCount: number;
}

export interface CalculationReviewSummaryResponse {
  inputHash: string;
  calculationHashVersion: number;
  summary:
    | TrafficInjuryReviewSummary
    | TrafficDeathReviewSummary
    | { calculationType: string; message: string };
}

export type ReviewFlowPhase = "idle" | "inputReview" | "result";
