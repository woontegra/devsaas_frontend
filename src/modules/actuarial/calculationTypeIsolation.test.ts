import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAllDrafts,
  loadDraftForType,
  saveDraftToSession,
  storageKeyFor,
} from "./draftStorage";
import {
  clearAllTypeSessions,
  defaultTypeSession,
  loadTypeSession,
  saveTypeSession,
  typeSessionStorageKeyFor,
} from "./typeSessionStorage";
import { createEmptyDraft, type CalculationType } from "./types/calculationDraft";

const TYPES: CalculationType[] = [
  "TRAFFIC_INJURY",
  "TRAFFIC_DEATH",
  "WORK_INJURY",
  "WORK_DEATH",
];

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
  clearAllDrafts();
  clearAllTypeSessions();
});

describe("calculation type isolation", () => {
  it("uses distinct draft storage keys per type", () => {
    const keys = TYPES.map(storageKeyFor);
    expect(new Set(keys).size).toBe(TYPES.length);
    for (const key of keys) {
      expect(key.startsWith("actuarial-draft-")).toBe(true);
    }
  });

  it("uses distinct session storage keys per type", () => {
    const keys = TYPES.map(typeSessionStorageKeyFor);
    expect(new Set(keys).size).toBe(TYPES.length);
    for (const key of keys) {
      expect(key.startsWith("actuarial-session-")).toBe(true);
    }
  });

  it("A: TRAFFIC_INJURY draft does not appear in TRAFFIC_DEATH load", () => {
    const injury = createEmptyDraft("TRAFFIC_INJURY");
    injury.parties.plaintiff.firstName = "Ali";
    injury.common.eventDate = "2022-01-01";
    saveDraftToSession(injury);

    const deathLoad = loadDraftForType("TRAFFIC_DEATH");
    expect(deathLoad.ok).toBe(false);
    if (!deathLoad.ok) expect(deathLoad.reason).toBe("missing");
  });

  it("loads a legacy injury draft without sosyalYardimOdenekleri as an empty list", () => {
    const injury = createEmptyDraft("TRAFFIC_INJURY");
    if (injury.calculationType !== "TRAFFIC_INJURY") throw new Error("expected injury");
    injury.capitalValueDocuments = [{ id: "psd", notes: "PSD kaydı", amount: 1250, documentNumber: "P-1" }];
    const stored = injury as unknown as Record<string, unknown>;
    delete stored.sosyalYardimOdenekleri;
    saveDraftToSession(injury);

    const reloaded = loadDraftForType("TRAFFIC_INJURY");
    expect(reloaded.ok).toBe(true);
    if (reloaded.ok && reloaded.draft.calculationType === "TRAFFIC_INJURY") {
      expect(reloaded.draft.sosyalYardimOdenekleri).toEqual([]);
      expect(reloaded.draft.capitalValueDocuments).toEqual([
        { id: "psd", notes: "PSD kaydı", amount: 1250, documentNumber: "P-1" },
      ]);
    }
  });

  it("keeps sosyal yardım rows independent from PSD rows across save and reload", () => {
    const injury = createEmptyDraft("TRAFFIC_INJURY");
    if (injury.calculationType !== "TRAFFIC_INJURY") throw new Error("expected injury");
    injury.capitalValueDocuments = [{ id: "psd", notes: "Peşin", amount: 10 }];
    injury.sosyalYardimOdenekleri = [
      { id: "s1", notes: "Yardım 1", amount: 20, documentDate: "2024-02-01", documentNumber: "B-1" },
      { id: "s2", notes: "Yardım 2", amount: 30, documentDate: "2024-03-01", documentNumber: "B-2" },
    ];
    saveDraftToSession(injury);

    const reloaded = loadDraftForType("TRAFFIC_INJURY");
    expect(reloaded.ok).toBe(true);
    if (reloaded.ok && reloaded.draft.calculationType === "TRAFFIC_INJURY") {
      expect(reloaded.draft.sosyalYardimOdenekleri).toEqual(injury.sosyalYardimOdenekleri);
      expect(reloaded.draft.capitalValueDocuments).toEqual(injury.capitalValueDocuments);
      expect(reloaded.draft.sosyalYardimOdenekleri).not.toEqual(reloaded.draft.capitalValueDocuments);
    }
  });

  it("B: each type keeps its own draft in storage", () => {
    const injury = createEmptyDraft("TRAFFIC_INJURY");
    injury.parties.plaintiff.firstName = "Ali";
    saveDraftToSession(injury);

    const death = createEmptyDraft("TRAFFIC_DEATH");
    death.deceased.fullName = "Mehmet";
    saveDraftToSession(death);

    const injuryReload = loadDraftForType("TRAFFIC_INJURY");
    const deathReload = loadDraftForType("TRAFFIC_DEATH");
    expect(injuryReload.ok).toBe(true);
    expect(deathReload.ok).toBe(true);
    if (injuryReload.ok && deathReload.ok) {
      expect(injuryReload.draft.parties.plaintiff.firstName).toBe("Ali");
      expect(deathReload.draft.deceased.fullName).toBe("Mehmet");
    }
  });

  it("C: TRAFFIC_INJURY runResult session does not load for TRAFFIC_DEATH", () => {
    saveTypeSession("TRAFFIC_INJURY", {
      stepId: "review",
      runInputHash: "hash-injury",
      reviewFlowPhase: "result",
      calculationSaved: true,
      runResult: { schemaVersion: 1 } as never,
    });

    const deathSession = loadTypeSession("TRAFFIC_DEATH");
    expect(deathSession.runResult).toBeNull();
    expect(deathSession.reviewFlowPhase).toBe("idle");
    expect(deathSession.stepId).toBe(defaultTypeSession("TRAFFIC_DEATH").stepId);
  });

  it("D: step index is scoped per type", () => {
    saveTypeSession("TRAFFIC_INJURY", {
      ...defaultTypeSession("TRAFFIC_INJURY"),
      stepId: "calculationInfo",
    });
    saveTypeSession("TRAFFIC_DEATH", {
      ...defaultTypeSession("TRAFFIC_DEATH"),
      stepId: "deceased",
    });

    expect(loadTypeSession("TRAFFIC_INJURY").stepId).toBe("calculationInfo");
    expect(loadTypeSession("TRAFFIC_DEATH").stepId).toBe("deceased");
  });

  it("draft factories produce type-specific shapes", () => {
    const injury = createEmptyDraft("TRAFFIC_INJURY");
    const death = createEmptyDraft("TRAFFIC_DEATH");
    const workInjury = createEmptyDraft("WORK_INJURY");
    const workDeath = createEmptyDraft("WORK_DEATH");

    expect(injury.calculationType).toBe("TRAFFIC_INJURY");
    expect(death.calculationType).toBe("TRAFFIC_DEATH");
    expect(workInjury.calculationType).toBe("WORK_INJURY");
    expect(workDeath.calculationType).toBe("WORK_DEATH");

    expect("parties" in injury).toBe(true);
    expect("deceased" in death).toBe(true);
    expect("employee" in workInjury).toBe(true);
    expect("deceasedEmployee" in workDeath).toBe(true);
    expect("parties" in death).toBe(false);
    expect("deceased" in injury).toBe(false);
  });

  it("H: no storage key collision between draft and session namespaces", () => {
    const draftKeys = new Set(TYPES.map(storageKeyFor));
    const sessionKeys = new Set(TYPES.map(typeSessionStorageKeyFor));
    for (const key of draftKeys) {
      expect(sessionKeys.has(key)).toBe(false);
    }
  });

  it("F: TRAFFIC_DEATH currentSavedCalculationId is scoped to TRAFFIC_DEATH session", () => {
    saveTypeSession("TRAFFIC_DEATH", {
      ...defaultTypeSession("TRAFFIC_DEATH"),
      currentSavedCalculationId: "saved-death-1",
      savedDisplayName: "Ahmet Dosyası",
    });

    const deathSession = loadTypeSession("TRAFFIC_DEATH");
    const injurySession = loadTypeSession("TRAFFIC_INJURY");

    expect(deathSession.currentSavedCalculationId).toBe("saved-death-1");
    expect(deathSession.savedDisplayName).toBe("Ahmet Dosyası");
    expect(injurySession.currentSavedCalculationId).toBeNull();
    expect(injurySession.savedDisplayName).toBeNull();
  });

  it("F2: TRAFFIC_INJURY currentSavedCalculationId / savedDisplayName are type-scoped", () => {
    saveTypeSession("TRAFFIC_INJURY", {
      ...defaultTypeSession("TRAFFIC_INJURY"),
      currentSavedCalculationId: "saved-injury-1",
      savedDisplayName: "Yaralanma Dosyası",
    });

    const injurySession = loadTypeSession("TRAFFIC_INJURY");
    const deathSession = loadTypeSession("TRAFFIC_DEATH");

    expect(injurySession.currentSavedCalculationId).toBe("saved-injury-1");
    expect(injurySession.savedDisplayName).toBe("Yaralanma Dosyası");
    expect(deathSession.currentSavedCalculationId).toBeNull();
    expect(deathSession.savedDisplayName).toBeNull();
  });
});
