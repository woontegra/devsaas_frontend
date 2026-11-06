import { describe, expect, it } from "vitest";
import { resolvePersistedSavedCalculationId } from "./resolvePersistedSavedCalculationId";

describe("resolvePersistedSavedCalculationId", () => {
  it("returns null for run/idempotency UUID without display name (new calculation)", () => {
    expect(
      resolvePersistedSavedCalculationId({
        currentSavedCalculationId: "550e8400-e29b-41d4-a716-446655440000",
        savedDisplayName: null,
      })
    ).toBeNull();
  });

  it("returns null when only a blank display name exists", () => {
    expect(
      resolvePersistedSavedCalculationId({
        currentSavedCalculationId: "saved-1",
        savedDisplayName: "   ",
      })
    ).toBeNull();
  });

  it("returns the id for an opened/saved file with a display name (update path)", () => {
    expect(
      resolvePersistedSavedCalculationId({
        currentSavedCalculationId: "saved-injury-1",
        savedDisplayName: "Dava 2024/12",
      })
    ).toBe("saved-injury-1");
  });

  it("trims id and display name", () => {
    expect(
      resolvePersistedSavedCalculationId({
        currentSavedCalculationId: "  saved-2  ",
        savedDisplayName: "  Dosya  ",
      })
    ).toBe("saved-2");
  });
});
