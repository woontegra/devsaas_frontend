import type { CalculationDraft, CalculationType } from "./calculationDraft";
import type { TrafficInjuryCalculationResult } from "./trafficInjuryResult";
import type { TrafficDeathSupportPeriodsResponse } from "./trafficDeathSupportPeriods";

export interface UserCapabilities {
  canSaveCalculation: boolean;
  plan: string | null;
  subscriptionActive: boolean;
  subscriptionExpiresAt: string | null;
  subscriptionStartsAt?: string | null;
  isTrial?: boolean;
  isAdmin?: boolean;
}

export type TrialBlockReason = "TRIAL_EXPIRED" | "TRIAL_CREDITS_EXHAUSTED" | null;

export interface TrialInfo {
  isTrial: boolean;
  active: boolean;
  blockReason: TrialBlockReason;
  startsAt: string | null;
  expiresAt: string | null;
  daysRemaining: number;
  creditsRemaining: number;
  creditsInitial: number;
  creditsUsed: number;
  durationDays: number;
}

export interface AuthMeResponse {
  user: {
    id: string;
    email: string | null;
    name?: string | null;
    role?: string;
    status?: string;
    creditBalance?: number;
    phoneNormalized?: string | null;
    trialCreditsGranted?: number | null;
  };
  sessionId?: string | null;
  capabilities: UserCapabilities;
  trial?: TrialInfo | null;
  pricingSurvey?: {
    eligible: boolean;
    reason?: string | null;
    enabled: boolean;
    alreadySubmitted: boolean;
    completedCalculationCount: number;
    submittedAt?: string | null;
  } | null;
}

export interface SavedCalculationListItem {
  id: string;
  calculationType: CalculationType | string;
  title: string | null;
  displayName: string | null;
  subjectName?: string | null;
  eventDate: string | null;
  calculationDate: string | null;
  inputHash: string;
  calculationHashVersion: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string | null;
}

export interface SavedCalculationDetail extends SavedCalculationListItem {
  inputSnapshotJson: CalculationDraft;
  resultSnapshotJson: TrafficInjuryCalculationResult | TrafficDeathSupportPeriodsResponse | null;
}
