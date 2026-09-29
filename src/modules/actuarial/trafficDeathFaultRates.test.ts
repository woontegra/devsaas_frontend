import { describe, expect, it, beforeEach, vi } from "vitest";
import { hydrateTrafficDeathDraft, loadDraftForType, saveDraftToSession } from "./draftStorage";
import { CALCULATION_SCHEMA_VERSION } from "./types/calculationDraft";
import {
  coerceResponsibleParties,
  trafficDeathFaultPartyLabels,
  toggleTrafficDeathResponsible,
  trafficDeathFaultSum,
  TRAFFIC_DEATH_RESPONSIBLE_TYPES,
} from "./utils/trafficDeathFaultRates";

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  });
});

describe("TRAFFIC_DEATH fault parties (müteveffa + sorumlular)", () => {
  const beneficiaries = [
    {
      id: "c1",
      fullName: "Yüksel Ergin",
      relation: "spouse",
      birthDate: "1975-01-01",
      gender: "female",
      claimantStatus: "PLAINTIFF",
    },
    {
      id: "c2",
      fullName: "Ebru Aydın",
      relation: "child",
      birthDate: "2000-05-20",
      gender: "female",
      claimantStatus: "PLAINTIFF",
    },
    {
      id: "c3",
      fullName: "Fatma",
      relation: "mother",
      birthDate: "1950-01-01",
      gender: "female",
      claimantStatus: "PLAINTIFF",
    },
    {
      id: "c4",
      fullName: "Mehmet",
      relation: "father",
      birthDate: "1948-01-01",
      gender: "male",
      claimantStatus: "PLAINTIFF",
    },
  ];

  it("1) eş/çocuk/anne/baba are not fault parties", () => {
    const parties = [
      { id: "d1", type: "INDIVIDUAL_DRIVER" as const, faultRatio: 60 },
    ];
    const labels = trafficDeathFaultPartyLabels(parties);
    expect(labels).not.toContain("Yüksel Ergin");
    expect(labels).not.toContain("Ebru Aydın");
    expect(labels).not.toContain("Fatma");
    expect(labels).not.toContain("Mehmet");
    expect(labels.some((l) => /eş|çocuk|anne|baba/i.test(l))).toBe(false);
  });

  it("1) first fault label is Müteveffa, not the deceased name", () => {
    expect(trafficDeathFaultPartyLabels([])[0]).toBe("Müteveffa");
    expect(trafficDeathFaultPartyLabels([])).not.toContain("Tanyol Ergin");
  });

  it("2) müteveffa is the first fault party", () => {
    expect(trafficDeathFaultPartyLabels([])[0]).toBe("Müteveffa");
  });

  it("3-5) three responsible types can be added", () => {
    let parties = toggleTrafficDeathResponsible([], "INDIVIDUAL_DRIVER", () => "d1");
    parties = toggleTrafficDeathResponsible(parties, "INDIVIDUAL_VEHICLE_OWNER", () => "o1");
    parties = toggleTrafficDeathResponsible(parties, "CORPORATE_VEHICLE_OWNER", () => "c1");
    expect(parties.map((p) => p.type)).toEqual([...TRAFFIC_DEATH_RESPONSIBLE_TYPES]);
    expect(coerceResponsibleParties(parties)).toHaveLength(3);
  });

  it("5) deselecting a sorumlu removes its rate from the total", () => {
    const withDriver = toggleTrafficDeathResponsible(
      [{ id: "d1", type: "INDIVIDUAL_DRIVER", faultRatio: 60 }],
      "INDIVIDUAL_DRIVER",
      () => "d1"
    );
    expect(withDriver).toEqual([]);
    expect(trafficDeathFaultSum(20, withDriver, 0)).toBe(20);
    expect(trafficDeathFaultSum(20, [{ id: "d1", type: "INDIVIDUAL_DRIVER", faultRatio: 60 }], 0)).toBe(
      80
    );
  });

  it("6) sum of müteveffa + sorumlular + dava dışı is 100", () => {
    expect(
      trafficDeathFaultSum(
        20,
        [
          { id: "d1", type: "INDIVIDUAL_DRIVER", faultRatio: 60 },
          { id: "o1", type: "INDIVIDUAL_VEHICLE_OWNER", faultRatio: 20 },
        ],
        0
      )
    ).toBe(100);
  });

  it("7) SavedCalculation snapshot hydrate restores sorumlular and rates", () => {
    const hydrated = hydrateTrafficDeathDraft({
      schemaVersion: CALCULATION_SCHEMA_VERSION,
      calculationType: "TRAFFIC_DEATH",
      deceased: { birthDate: "1970-01-01", deathDate: "2020-06-01", gender: "male", fullName: "Tanyol Ergin" },
      beneficiaries,
      deceasedFaultRate: 20,
      responsibleParties: [
        { id: "d1", type: "INDIVIDUAL_DRIVER", faultRatio: 60 },
        { id: "o1", type: "INDIVIDUAL_VEHICLE_OWNER", faultRatio: 20 },
      ],
      externalFaultRate: 0,
    });
    expect(hydrated.deceasedFaultRate).toBe(20);
    expect(hydrated.responsibleParties).toEqual([
      { id: "d1", type: "INDIVIDUAL_DRIVER", faultRatio: 60 },
      { id: "o1", type: "INDIVIDUAL_VEHICLE_OWNER", faultRatio: 20 },
    ]);
    expect(hydrated.externalFaultRate).toBe(0);
    saveDraftToSession(hydrated);
    const loaded = loadDraftForType("TRAFFIC_DEATH");
    expect(loaded.ok).toBe(true);
    if (!loaded.ok || loaded.draft.calculationType !== "TRAFFIC_DEATH") return;
    expect(loaded.draft.deceasedFaultRate).toBe(20);
    expect(loaded.draft.responsibleParties).toEqual([
      { id: "d1", type: "INDIVIDUAL_DRIVER", faultRatio: 60 },
      { id: "o1", type: "INDIVIDUAL_VEHICLE_OWNER", faultRatio: 20 },
    ]);
  });

  it("8) old claimantFaultRates are ignored and do not become beneficiary fault parties", () => {
    const hydrated = hydrateTrafficDeathDraft({
      schemaVersion: CALCULATION_SCHEMA_VERSION,
      calculationType: "TRAFFIC_DEATH",
      deceased: { birthDate: "1970-01-01", deathDate: "2020-06-01", gender: "male", fullName: "Tanyol Ergin" },
      beneficiaries,
      claimantFaultRates: { c1: 35, c2: 45, c3: 10, c4: 10 },
      externalFaultRate: 20,
    });
    expect(hydrated.claimantFaultRates).toBeUndefined();
    expect(hydrated.responsibleParties).toEqual([]);
    expect(hydrated.deceasedFaultRate).toBe(0);
    expect(hydrated.externalFaultRate).toBe(20);
    const labels = trafficDeathFaultPartyLabels(hydrated.responsibleParties);
    expect(labels).toEqual(["Müteveffa"]);
  });
});
