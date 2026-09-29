import { describe, it, expect } from "vitest";
import { actuarialDays360Inclusive } from "./actuarialDayCount360";
import {
  deriveTemporaryPeriodDayCount,
  normalizeTemporaryIncapacityPeriodDayCounts,
} from "./temporaryIncapacityPeriods";

describe("deriveTemporaryPeriodDayCount — dahil takvim günü", () => {
  it("01.09.2022–12.12.2022 → 103", () => {
    expect(deriveTemporaryPeriodDayCount("2022-09-01", "2022-12-12")).toBe(103);
  });

  it("01.09.2022–31.12.2022 → 122", () => {
    expect(deriveTemporaryPeriodDayCount("2022-09-01", "2022-12-31")).toBe(122);
  });

  it("01.01.2023–19.01.2023 → 19", () => {
    expect(deriveTemporaryPeriodDayCount("2023-01-01", "2023-01-19")).toBe(19);
  });

  it("20.01.2023–30.06.2023 → 162", () => {
    expect(deriveTemporaryPeriodDayCount("2023-01-20", "2023-06-30")).toBe(162);
  });

  it("01.07.2023–31.12.2023 → 180", () => {
    expect(deriveTemporaryPeriodDayCount("2023-07-01", "2023-12-31")).toBe(180);
  });

  it("01.01.2024–31.08.2024 → 244", () => {
    expect(deriveTemporaryPeriodDayCount("2024-01-01", "2024-08-31")).toBe(244);
  });
});

describe("deriveTemporaryPeriodDayCount — yarıyıl ve 360", () => {
  it("01.01.2022–30.06.2022 → 180", () => {
    expect(deriveTemporaryPeriodDayCount("2022-01-01", "2022-06-30")).toBe(180);
  });

  it("01.07.2022–31.12.2022 → 180", () => {
    expect(deriveTemporaryPeriodDayCount("2022-07-01", "2022-12-31")).toBe(180);
  });

  it("360 üzeri → 360", () => {
    expect(deriveTemporaryPeriodDayCount("2025-01-01", "2025-12-31")).toBe(360);
    expect(deriveTemporaryPeriodDayCount("2020-01-01", "2022-12-31")).toBe(360);
  });

  it("30/360 kısmi aralıkta ayrı kalır", () => {
    expect(actuarialDays360Inclusive("2022-09-01", "2022-12-12")).toBe(102);
    expect(actuarialDays360Inclusive("2022-09-01", "2022-12-31")).toBe(120);
  });
});

describe("normalizeTemporaryIncapacityPeriodDayCounts", () => {
  it("eski yanlış dayCount değerini tarihlerden yeniden türetir", () => {
    const normalized = normalizeTemporaryIncapacityPeriodDayCounts([
      { id: "t1", startDate: "2022-09-01", endDate: "2022-12-12", dayCount: 102 },
    ]);
    expect(normalized[0]!.dayCount).toBe(103);
  });

  it("tarih yoksa dayCount temizlenir", () => {
    const normalized = normalizeTemporaryIncapacityPeriodDayCounts([
      { id: "t1", startDate: "", endDate: "", dayCount: 102 },
    ]);
    expect(normalized[0]!.dayCount).toBeUndefined();
  });
});
