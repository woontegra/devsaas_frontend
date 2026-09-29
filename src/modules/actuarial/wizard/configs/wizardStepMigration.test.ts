import { describe, expect, it } from "vitest";
import {
  getWizardSteps,
  resolveTrafficDeathBeforeDeductionStepIndex,
  resolveTrafficDeathLegacyStepIndex,
  resolveWizardStepId,
} from "./index";

function deathNavIds(): string[] {
  return [...getWizardSteps("TRAFFIC_DEATH").map((s) => s.id), "review"];
}

describe("TRAFFIC_DEATH wizard step migration", () => {
  it("starts at deceased without caseEvent step", () => {
    const steps = getWizardSteps("TRAFFIC_DEATH");
    expect(steps[0]?.id).toBe("deceased");
    expect(steps.some((s) => s.id === "caseEvent")).toBe(false);
    expect(steps.length).toBe(8);
  });

  it("shows nine steps including Kontrol ve Ödeme", () => {
    expect(deathNavIds()).toEqual([
      "deceased",
      "beneficiaries",
      "supportRelations",
      "liability",
      "marriageProbabilityDeduction",
      "educationExpenseDeduction",
      "deathExpenses",
      "priorPayments",
      "review",
    ]);
    const steps = getWizardSteps("TRAFFIC_DEATH");
    expect(steps[4]?.title).toBe("Evlenme İhtimali İndirimi");
    expect(steps[5]?.title).toBe("Eğitim Gideri İndirimi");
    expect(steps[6]?.title).toBe("Ölüm Öncesi ve Cenaze Giderleri");
    expect(steps[7]?.title).toBe("Sigorta ve Önceki Ödemeler");
  });

  it("maps removed caseEvent and income steps to deceased", () => {
    expect(resolveWizardStepId("TRAFFIC_DEATH", "caseEvent")).toBe("deceased");
    expect(resolveWizardStepId("TRAFFIC_DEATH", "income")).toBe("deceased");
  });

  it("maps legacy step index 0 (caseEvent) and 1 (deceased) to deceased", () => {
    expect(resolveTrafficDeathLegacyStepIndex(0)).toBe("deceased");
    expect(resolveTrafficDeathLegacyStepIndex(1)).toBe("deceased");
  });

  it("maps legacy step index 2 (income) to deceased", () => {
    expect(resolveTrafficDeathLegacyStepIndex(2)).toBe("deceased");
  });

  it("maps legacy step index 3 (beneficiaries) to beneficiaries", () => {
    expect(resolveTrafficDeathLegacyStepIndex(3)).toBe("beneficiaries");
  });

  it("keeps supportRelations step id for Pay Oranları placeholder", () => {
    const steps = getWizardSteps("TRAFFIC_DEATH");
    expect(steps[2]?.id).toBe("supportRelations");
    expect(steps[2]?.title).toBe("Pay Oranları");
    expect(resolveWizardStepId("TRAFFIC_DEATH", "supportRelations")).toBe("supportRelations");
    expect(resolveTrafficDeathLegacyStepIndex(4)).toBe("supportRelations");
  });

  it("keeps saved step ids on the same page after the two new steps", () => {
    const nav = deathNavIds();
    expect(resolveWizardStepId("TRAFFIC_DEATH", "deathExpenses")).toBe("deathExpenses");
    expect(resolveWizardStepId("TRAFFIC_DEATH", "priorPayments")).toBe("priorPayments");
    expect(resolveWizardStepId("TRAFFIC_DEATH", "review")).toBe("review");
    expect(nav.indexOf("deathExpenses") + 1).toBe(7);
    expect(nav.indexOf("priorPayments") + 1).toBe(8);
    expect(nav.indexOf("review") + 1).toBe(9);
  });

  it("maps the previous 7-step indexes 5, 6 and 7 onto the same pages", () => {
    const nav = deathNavIds();
    expect(nav.indexOf(resolveTrafficDeathBeforeDeductionStepIndex(5)) + 1).toBe(7);
    expect(nav.indexOf(resolveTrafficDeathBeforeDeductionStepIndex(6)) + 1).toBe(8);
    expect(nav.indexOf(resolveTrafficDeathBeforeDeductionStepIndex(7)) + 1).toBe(9);
    expect(resolveWizardStepId("TRAFFIC_DEATH", "5")).toBe("deathExpenses");
    expect(resolveWizardStepId("TRAFFIC_DEATH", "6")).toBe("priorPayments");
    expect(resolveWizardStepId("TRAFFIC_DEATH", "7")).toBe("review");
  });

  it("does not affect other calculation types", () => {
    expect(resolveWizardStepId("WORK_DEATH", "caseEvent")).toBe("caseEvent");
    expect(resolveWizardStepId("WORK_INJURY", "employee")).toBe("employee");
  });
});
