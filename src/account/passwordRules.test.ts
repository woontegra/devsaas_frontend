import { describe, expect, it } from "vitest";
import { passwordChecklist } from "./passwordRules";

describe("passwordChecklist", () => {
  it("starts unmet", () => {
    expect(passwordChecklist({ currentPassword: "", newPassword: "", confirm: "" }).every((c) => !c.met)).toBe(true);
  });

  it("accepts 8 characters that differ from the current password and match the repeat", () => {
    const checks = passwordChecklist({
      currentPassword: "eski-sifre",
      newPassword: "yeni1234",
      confirm: "yeni1234",
    });
    expect(checks.map((c) => c.met)).toEqual([true, true, true]);
  });

  it("rejects a short password and a repeat that does not match", () => {
    const checks = passwordChecklist({
      currentPassword: "eski-sifre",
      newPassword: "kisa",
      confirm: "baska",
    });
    expect(checks.find((c) => c.id === "length")?.met).toBe(false);
    expect(checks.find((c) => c.id === "match")?.met).toBe(false);
  });

  it("rejects a new password equal to the current one", () => {
    const checks = passwordChecklist({
      currentPassword: "ayni1234",
      newPassword: "ayni1234",
      confirm: "ayni1234",
    });
    expect(checks.find((c) => c.id === "different")?.met).toBe(false);
    expect(checks.find((c) => c.id === "match")?.met).toBe(true);
  });
});
