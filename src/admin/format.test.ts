import { describe, expect, it } from "vitest";
import { displayName, eventLabel, formatRemaining, planLabel } from "./format";

describe("admin format helpers", () => {
  it("displayName fallback", () => {
    expect(displayName(null)).toBe("Ad belirtilmemiş");
    expect(displayName("  ")).toBe("Ad belirtilmemiş");
    expect(displayName("Ayşe Yılmaz")).toBe("Ayşe Yılmaz");
  });

  it("event and plan labels", () => {
    expect(eventLabel("LOGIN")).toBe("Giriş yaptı");
    expect(planLabel("monthly")).toBe("Aylık");
  });

  it("remaining duration", () => {
    expect(formatRemaining(-1000)).toBe("Süresi doldu");
    expect(formatRemaining(3 * 24 * 60 * 60 * 1000)).toBe("3 gün");
  });
});
