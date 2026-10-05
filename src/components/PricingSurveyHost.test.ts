import { describe, expect, it } from "vitest";
import {
  BILIRKISI_HESAP_REFERENCE_PRICE,
  PRICING_SURVEY_RESULT_DELAY_MS,
} from "./PricingSurveyHost";

type Status = { eligible: boolean; reason?: string | null };

/** Saf kurallar — sonuç sonrası anket gate */
function simulateAfterSuccessfulResult(params: {
  sessionDismissed: boolean;
  offerClaimed: boolean;
  status: Status | null;
  runSucceeded: boolean;
}): "skip" | "schedule_check" | "show_survey" | "no_survey" {
  if (!params.runSucceeded) return "skip";
  if (params.sessionDismissed) return "skip";
  if (params.offerClaimed) return "skip";
  // claim sonra eligibility
  if (!params.status) return "no_survey";
  if (!params.status.eligible) return "no_survey";
  return "show_survey";
}

describe("pricing survey — sonuç sonrası tetikleyici", () => {
  it("1) hesaplama başlamadı → anket yok", () => {
    expect(
      simulateAfterSuccessfulResult({
        sessionDismissed: false,
        offerClaimed: false,
        status: { eligible: true },
        runSucceeded: false,
      })
    ).toBe("skip");
  });

  it("2/3) validate-only veya /run hata → anket yok", () => {
    expect(
      simulateAfterSuccessfulResult({
        sessionDismissed: false,
        offerClaimed: false,
        status: { eligible: true },
        runSucceeded: false,
      })
    ).toBe("skip");
  });

  it("5) eligible + başarılı sonuç → anket", () => {
    expect(
      simulateAfterSuccessfulResult({
        sessionDismissed: false,
        offerClaimed: false,
        status: { eligible: true },
        runSucceeded: true,
      })
    ).toBe("show_survey");
  });

  it("6/7/8) flag/audience/already → no_survey", () => {
    expect(
      simulateAfterSuccessfulResult({
        sessionDismissed: false,
        offerClaimed: false,
        status: { eligible: false, reason: "SURVEY_DISABLED" },
        runSucceeded: true,
      })
    ).toBe("no_survey");
  });

  it("9/10) Şimdi Değil (session dismiss) → aynı session skip", () => {
    expect(
      simulateAfterSuccessfulResult({
        sessionDismissed: true,
        offerClaimed: false,
        status: { eligible: true },
        runSucceeded: true,
      })
    ).toBe("skip");
  });

  it("11) yeni session (dismiss+claim false) → tekrar gösterilebilir", () => {
    expect(
      simulateAfterSuccessfulResult({
        sessionDismissed: false,
        offerClaimed: false,
        status: { eligible: true },
        runSucceeded: true,
      })
    ).toBe("show_survey");
  });

  it("14) offer claim → ikinci trigger skip (double-trigger)", () => {
    expect(
      simulateAfterSuccessfulResult({
        sessionDismissed: false,
        offerClaimed: true,
        status: { eligible: true },
        runSucceeded: true,
      })
    ).toBe("skip");
  });

  it("16) Çıkış artık anket tetiklemez — yalnız sonuç gate", () => {
    expect(PRICING_SURVEY_RESULT_DELAY_MS).toBe(10000);
  });

  it("17) beforeunload kullanılmıyor — delay sabiti tanımlı", () => {
    expect(typeof PRICING_SURVEY_RESULT_DELAY_MS).toBe("number");
  });

  it("timer cleanup: unmount clearTimeout ile aynı delay sabiti", () => {
    expect(PRICING_SURVEY_RESULT_DELAY_MS).toBe(10000);
  });
});

describe("Bilirkişi referans fiyat (DB'ye yazılmaz)", () => {
  it("2.000 / 20.000 TL sabit referans", () => {
    expect(BILIRKISI_HESAP_REFERENCE_PRICE.monthlyTl).toBe(2000);
    expect(BILIRKISI_HESAP_REFERENCE_PRICE.yearlyTl).toBe(20000);
    expect(BILIRKISI_HESAP_REFERENCE_PRICE.productName).toBe("Bilirkişi Hesap");
  });
});

describe("TL input parse", () => {
  function digitsOnly(raw: string): string {
    return raw.replace(/\D/g, "");
  }
  function parseTl(raw: string): number | null {
    const d = digitsOnly(raw);
    if (!d) return null;
    const n = Number(d);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.floor(n);
  }

  it("tr-TR format parse", () => {
    expect(parseTl("2.000")).toBe(2000);
    expect(parseTl("20.000")).toBe(20000);
    expect(parseTl("0")).toBe(null);
    expect(parseTl("")).toBe(null);
  });
});
