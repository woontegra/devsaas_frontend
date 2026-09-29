import type {
  TrafficDeathDraft,
  TrafficDeathResponsibleType,
} from "../../types/calculationDraft";
import { newId } from "../../types/calculationDraft";
import {
  toggleTrafficDeathResponsible,
  trafficDeathFaultSum,
} from "../../utils/trafficDeathFaultRates";
import { TrafficDeathFaultRatiosCard } from "./TrafficDeathFaultRatiosCard";
import type { StepProps } from "./wizardTypes";
import { errorFor } from "./wizardTypes";

export function TrafficDeathLiabilityStep({ draft, onChange, fieldErrors }: StepProps) {
  if (draft.calculationType !== "TRAFFIC_DEATH") return null;
  const td = draft as TrafficDeathDraft;
  const deceasedFaultRate = td.deceasedFaultRate ?? 0;
  const parties = td.responsibleParties ?? [];
  const externalFault = td.externalFaultRate ?? 0;
  const totalFault = trafficDeathFaultSum(deceasedFaultRate, parties, externalFault);
  const selectedTypes = new Set(parties.map((p) => p.type));
  const faultByType = Object.fromEntries(parties.map((p) => [p.type, p.faultRatio])) as Partial<
    Record<TrafficDeathResponsibleType, number>
  >;
  const partyErrors = Object.fromEntries(
    parties.map((p) => [p.type, errorFor(fieldErrors, `responsibleParties.${p.id}.faultRatio`)])
  ) as Partial<Record<TrafficDeathResponsibleType, string>>;

  const patch = (next: Partial<TrafficDeathDraft>) => {
    onChange({ ...td, ...next });
  };

  const toggleType = (type: TrafficDeathResponsibleType) => {
    patch({ responsibleParties: toggleTrafficDeathResponsible(parties, type, newId) });
  };

  const setPartyFault = (type: TrafficDeathResponsibleType, faultRatio: number) => {
    patch({
      responsibleParties: parties.map((p) => (p.type === type ? { ...p, faultRatio } : p)),
    });
  };

  return (
    <TrafficDeathFaultRatiosCard
      deceasedFaultRate={deceasedFaultRate}
      onDeceasedFaultChange={(value) => patch({ deceasedFaultRate: value })}
      deceasedError={errorFor(fieldErrors, "deceasedFaultRate")}
      selectedTypes={selectedTypes}
      faultByType={faultByType}
      onToggleType={toggleType}
      onPartyFaultChange={setPartyFault}
      partyErrors={partyErrors}
      externalFault={externalFault}
      onExternalFaultChange={(value) => patch({ externalFaultRate: value })}
      externalError={errorFor(fieldErrors, "externalFaultRate")}
      totalFault={totalFault}
    />
  );
}
