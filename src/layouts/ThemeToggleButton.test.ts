import { describe, expect, it } from "vitest";

/** Header quick toggle: effective → next explicit preference */
function nextQuickTheme(effective: "light" | "dark"): "light" | "dark" {
  return effective === "light" ? "dark" : "light";
}

describe("header theme quick toggle", () => {
  it("light effective → switches to dark", () => {
    expect(nextQuickTheme("light")).toBe("dark");
  });

  it("dark effective → switches to light", () => {
    expect(nextQuickTheme("dark")).toBe("light");
  });

  it("system-resolved dark behaves like dark (explicit light on click)", () => {
    const systemResolved: "light" | "dark" = "dark";
    expect(nextQuickTheme(systemResolved)).toBe("light");
  });

  it("system-resolved light behaves like light (explicit dark on click)", () => {
    const systemResolved: "light" | "dark" = "light";
    expect(nextQuickTheme(systemResolved)).toBe("dark");
  });
});
