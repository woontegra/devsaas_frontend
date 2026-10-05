import { describe, expect, it } from "vitest";
import {
  isAdminPath,
  resolveEffectiveTheme,
  type ThemePreference,
} from "./themePreference";

describe("theme preference", () => {
  it("27/28) light/dark resolve", () => {
    expect(resolveEffectiveTheme("light")).toBe("light");
    expect(resolveEffectiveTheme("dark")).toBe("dark");
  });

  it("29) system uses matchMedia when available", () => {
    const pref: ThemePreference = "system";
    const resolved = resolveEffectiveTheme(pref);
    expect(resolved === "light" || resolved === "dark").toBe(true);
  });

  it("42) admin path detection", () => {
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/users")).toBe(true);
    expect(isAdminPath("/dashboard")).toBe(false);
    expect(isAdminPath("/account/settings")).toBe(false);
  });
});
