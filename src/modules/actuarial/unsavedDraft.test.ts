import { describe, expect, it } from "vitest";
import { createEmptyDraft } from "./types/calculationDraft";
import { calculationHasUnsavedChanges, draftFingerprint } from "./typeSessionStorage";

describe("yeni dosya unsaved draft", () => {
  it("treats an unchanged draft as saved", () => {
    const draft = createEmptyDraft("TRAFFIC_DEATH");
    expect(calculationHasUnsavedChanges(draft, draftFingerprint(draft))).toBe(false);
    expect(calculationHasUnsavedChanges(draft, null)).toBe(false);
  });

  it("treats an edited draft as unsaved against the clean fingerprint", () => {
    const clean = createEmptyDraft("TRAFFIC_DEATH");
    if (clean.calculationType !== "TRAFFIC_DEATH") throw new Error("expected death");
    const edited = {
      ...clean,
      deceased: { ...clean.deceased, fullName: "Yüksel Ergin" },
    };
    expect(calculationHasUnsavedChanges(edited, draftFingerprint(clean))).toBe(true);
  });
});
