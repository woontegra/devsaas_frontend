import type { CalculationDraft, CalculationType } from "./calculationDraft";
import type { TrafficInjuryCalculationResult } from "./trafficInjuryResult";
import type { TrafficDeathSupportPeriodsResponse } from "./trafficDeathSupportPeriods";

export interface UserCapabilities {
  canSaveCalculation: boolean;
  plan: string | null;
  subscriptionActive: boolean;
  subscriptionExpiresAt: string | null;
}

export interface AuthMeResponse {
  user: { id: string; email: string | null };
  capabilities: UserCapabilities;
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
