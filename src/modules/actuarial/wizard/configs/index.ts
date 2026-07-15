import type { CalculationType } from "../../types/calculationDraft";
import type { WizardStepConfig } from "../shared/wizardTypes";
import { trafficInjurySteps } from "./trafficInjuryConfig.tsx";
import { trafficDeathSteps } from "./trafficDeathConfig.tsx";
import { workInjurySteps } from "./workInjuryConfig.tsx";
import { workDeathSteps } from "./workDeathConfig.tsx";

export function getWizardSteps(type: CalculationType): WizardStepConfig[] {
  switch (type) {
    case "TRAFFIC_INJURY":
      return trafficInjurySteps;
    case "TRAFFIC_DEATH":
      return trafficDeathSteps;
    case "WORK_INJURY":
      return workInjurySteps;
    case "WORK_DEATH":
      return workDeathSteps;
  }
}
