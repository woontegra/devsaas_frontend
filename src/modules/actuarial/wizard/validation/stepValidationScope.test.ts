import { describe, expect, it } from "vitest";
import {
  filterErrorsForStep,
  getStepValidationScope,
  isStepBlockedByValidation,
  resolveStepIdForMissingSection,
} from "./stepValidationScope";
import { buildFileValidationToastCopy, buildValidationToastCopy } from "./validationFeedback";

describe("stepValidationScope", () => {
  it("scopes TRAFFIC_DEATH deceased required fields", () => {
    const scope = getStepValidationScope("TRAFFIC_DEATH", "deceased");
    expect(scope?.missingKeys).toContain("deceased");
    const errors = [
      { field: "deceased.deathDate", code: "REQUIRED", message: "Ölüm tarihi zorunludur." },
      { field: "beneficiaries[0].fullName", code: "REQUIRED", message: "Hak sahibi adı zorunludur." },
    ];
    const filtered = filterErrorsForStep(errors, scope);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]!.field).toBe("deceased.deathDate");
  });

  it("maps employment missing section to caseEvent step", () => {
    expect(resolveStepIdForMissingSection("WORK_INJURY", "employment")).toBe("caseEvent");
    expect(resolveStepIdForMissingSection("WORK_DEATH", "employment")).toBe("caseEvent");
  });

  it("blocks when missingKeys hit even without field errors", () => {
    const scope = getStepValidationScope("TRAFFIC_INJURY", "parties");
    const r = isStepBlockedByValidation([], ["parties"], scope);
    expect(r.blocked).toBe(true);
  });

  it("does not block optional education step without errors", () => {
    const scope = getStepValidationScope("TRAFFIC_DEATH", "educationExpenseDeduction");
    const r = isStepBlockedByValidation([], [], scope);
    expect(r.blocked).toBe(false);
  });
});

describe("validationFeedback copy", () => {
  it("uses single message for one error", () => {
    const copy = buildValidationToastCopy([
      { field: "deceased.deathDate", code: "REQUIRED", message: "Ölüm tarihi zorunludur." },
    ]);
    expect(copy.title).toBe("Eksik bilgi");
    expect(copy.description).toContain("Ölüm tarihi");
  });

  it("summarizes many errors", () => {
    const errors = Array.from({ length: 5 }, (_, i) => ({
      field: `f${i}`,
      code: "REQUIRED",
      message: `Alan ${i}`,
    }));
    const copy = buildValidationToastCopy(errors);
    expect(copy.title).toBe("5 zorunlu alan eksik");
    expect(copy.description).toContain("İşaretlenen");
  });

  it("builds file-level copy", () => {
    expect(buildFileValidationToastCopy(3).description).toContain("3 zorunlu alan");
  });
});
