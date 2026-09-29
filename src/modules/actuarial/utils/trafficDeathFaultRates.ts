import type {
  TrafficDeathResponsibleParty,
  TrafficDeathResponsibleType,
} from "../types/calculationDraft";

export const TRAFFIC_DEATH_RESPONSIBLE_TYPES: TrafficDeathResponsibleType[] = [
  "INDIVIDUAL_DRIVER",
  "INDIVIDUAL_VEHICLE_OWNER",
  "CORPORATE_VEHICLE_OWNER",
];

export const TRAFFIC_DEATH_RESPONSIBLE_LABELS: Record<TrafficDeathResponsibleType, string> = {
  INDIVIDUAL_DRIVER: "Gerçek Kişi Şoför",
  INDIVIDUAL_VEHICLE_OWNER: "Gerçek Kişi Araç sahibi",
  CORPORATE_VEHICLE_OWNER: "Tüzel Kişi Araç sahibi",
};

export function isTrafficDeathResponsibleType(value: string): value is TrafficDeathResponsibleType {
  return (TRAFFIC_DEATH_RESPONSIBLE_TYPES as string[]).includes(value);
}

export function coerceResponsibleParties(raw: unknown): TrafficDeathResponsibleParty[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<TrafficDeathResponsibleType>();
  const out: TrafficDeathResponsibleParty[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const item = row as Partial<TrafficDeathResponsibleParty>;
    if (!item.type || !isTrafficDeathResponsibleType(item.type)) continue;
    if (seen.has(item.type)) continue;
    seen.add(item.type);
    const faultRatio = typeof item.faultRatio === "number" && !Number.isNaN(item.faultRatio) ? item.faultRatio : 0;
    out.push({
      id: typeof item.id === "string" && item.id ? item.id : `resp-${item.type}`,
      type: item.type,
      faultRatio,
    });
  }
  return out;
}

export function trafficDeathFaultSum(
  deceasedFaultRate: number | undefined,
  parties: TrafficDeathResponsibleParty[] | undefined,
  externalFaultRate: number | undefined
): number {
  const partyTotal = (parties ?? []).reduce((sum, p) => sum + (Number(p.faultRatio) || 0), 0);
  return (Number(deceasedFaultRate) || 0) + partyTotal + (Number(externalFaultRate) || 0);
}

export function isTrafficDeathFaultSumComplete(sum: number): boolean {
  return Math.abs(sum - 100) <= 0.01;
}

export function trafficDeathFaultPartyLabels(parties: TrafficDeathResponsibleParty[]): string[] {
  const labels = ["Müteveffa"];
  for (const p of parties) {
    labels.push(TRAFFIC_DEATH_RESPONSIBLE_LABELS[p.type]);
  }
  return labels;
}

export function toggleTrafficDeathResponsible(
  parties: TrafficDeathResponsibleParty[],
  type: TrafficDeathResponsibleType,
  idFactory: () => string
): TrafficDeathResponsibleParty[] {
  if (parties.some((p) => p.type === type)) {
    return parties.filter((p) => p.type !== type);
  }
  return [...parties, { id: idFactory(), type, faultRatio: 0 }];
}
