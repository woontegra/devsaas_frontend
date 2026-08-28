import { describe, it, expect } from "vitest";
import { actuarialDays360Inclusive } from "./actuarialDayCount360";
import { completedCalendarAgeYears } from "./calendarAge";
import {
  ACTUARIAL_DAY_COUNT_FIXTURES,
  CALENDAR_AGE_FIXTURES,
} from "./actuarialDayCount360.fixtures";

describe("frontend actuarialDayCount360 — backend ile aynı fixture", () => {
  for (const fx of ACTUARIAL_DAY_COUNT_FIXTURES) {
    it(`${fx.start}–${fx.end} → ${fx.days}`, () => {
      expect(actuarialDays360Inclusive(fx.start, fx.end)).toBe(fx.days);
    });
  }
});

describe("frontend completedCalendarAgeYears", () => {
  for (const fx of CALENDAR_AGE_FIXTURES) {
    it(`${fx.birth} / ${fx.event} → ${fx.age}`, () => {
      expect(completedCalendarAgeYears(fx.birth, fx.event)).toBe(fx.age);
    });
  }
});
