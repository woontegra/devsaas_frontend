import type { ComponentType } from "react";
import type { CalculationDraft, CalculationType, DraftSection } from "../../types/calculationDraft";
import type { TrafficDeathSupportPeriodsResponse } from "../../types/trafficDeathSupportPeriods";

export interface WizardStepConfig {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  sectionKey: DraftSection;
  optional?: boolean;
  Component: ComponentType<StepProps>;
}

export interface StepProps {
  draft: CalculationDraft;
  onChange: (draft: CalculationDraft) => void;
  fieldErrors: { field: string; message: string; code?: string }[];
  validationFieldHighlight?: boolean;
  trafficDeathSupportResult?: TrafficDeathSupportPeriodsResponse | null;
  onTrafficDeathSupportResult?: (result: TrafficDeathSupportPeriodsResponse) => void;
}

export type WizardConfigMap = Record<CalculationType, WizardStepConfig[]>;

export function errorFor(fieldErrors: StepProps["fieldErrors"], field: string): string | undefined {
  return fieldErrors.find((e) => e.field === field || e.field.startsWith(`${field}.`))?.message;
}
