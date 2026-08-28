import { describe, expect, it } from "vitest";
import { getNetMinWageForDate, NET_MIN_WAGE_PERIODS } from "./netMinWage";

describe("getNetMinWageForDate", () => {
  it("returns correct amount for first half of 2010", () => {
    expect(getNetMinWageForDate("2010-01-01")).toBe(576.57);
    expect(getNetMinWageForDate("2010-03-15")).toBe(576.57);
    expect(getNetMinWageForDate("2010-06-30")).toBe(576.57);
  });

  it("returns correct amount for second half of 2010", () => {
    expect(getNetMinWageForDate("2010-07-01")).toBe(599.12);
    expect(getNetMinWageForDate("2010-12-31")).toBe(599.12);
  });

  it("returns correct amount for full-year periods", () => {
    expect(getNetMinWageForDate("2016-06-15")).toBe(1300.99);
    expect(getNetMinWageForDate("2017-01-01")).toBe(1404.06);
    expect(getNetMinWageForDate("2020-11-20")).toBe(2324.71);
  });

  it("returns correct amount for 2022 split periods", () => {
    expect(getNetMinWageForDate("2022-01-01")).toBe(4253.40);
    expect(getNetMinWageForDate("2022-06-30")).toBe(4253.40);
    expect(getNetMinWageForDate("2022-07-01")).toBe(5500.35);
    expect(getNetMinWageForDate("2022-12-31")).toBe(5500.35);
  });

  it("returns correct amount for 2024-2026", () => {
    expect(getNetMinWageForDate("2024-05-01")).toBe(17002.12);
    expect(getNetMinWageForDate("2025-09-15")).toBe(22104.67);
    expect(getNetMinWageForDate("2026-01-01")).toBe(28075.50);
    expect(getNetMinWageForDate("2026-12-31")).toBe(28075.50);
  });

  it("returns null for dates before 2010", () => {
    expect(getNetMinWageForDate("2009-12-31")).toBeNull();
    expect(getNetMinWageForDate("2005-06-01")).toBeNull();
  });

  it("returns null for dates after 2026", () => {
    expect(getNetMinWageForDate("2027-01-01")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getNetMinWageForDate("")).toBeNull();
  });

  it("correctly handles period boundaries (no gaps)", () => {
    for (let i = 0; i < NET_MIN_WAGE_PERIODS.length - 1; i++) {
      const current = NET_MIN_WAGE_PERIODS[i]!;
      const next = NET_MIN_WAGE_PERIODS[i + 1]!;
      const currentEnd = new Date(current.endDate);
      const nextStart = new Date(next.startDate);
      const diffDays = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(1);
    }
  });
});
