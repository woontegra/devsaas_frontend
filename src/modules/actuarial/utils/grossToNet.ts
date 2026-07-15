/**
 * Türkiye ücret bordrosu brüt → net dönüşüm servisi.
 *
 * Gelir Vergisi Kanunu (GVK md. 103), 5510 sayılı SGK Kanunu ve
 * 488 sayılı Damga Vergisi Kanunu parametrelerine dayanır.
 *
 * 2022 ve sonrası: 7349 sayılı Kanun ile asgari ücret gelir vergisi
 * ve damga vergisi istisnası uygulanmaktadır.
 *
 * NOT: Yıllık parametreler Resmi Gazete ilanlarına göre güncellenmelidir.
 */

// ─── Sabit oranlar ──────────────────────────────────────────────────
export const SGK_EMPLOYEE_RATE = 0.14;
export const SGK_UNEMPLOYMENT_RATE = 0.01;
export const STAMP_TAX_RATE = 0.00759;

// ─── Tip tanımları ──────────────────────────────────────────────────

interface TaxBracket {
  /** Yıllık kümülatif üst sınır (TL). Son dilim: Infinity */
  upTo: number;
  /** Vergi oranı (ör. 0.15 = %15) */
  rate: number;
}

interface PeriodConfig {
  /** Geçerli ay aralığı [başlangıç, bitiş] dahil (1 = Ocak) */
  months: [number, number];
  /** Brüt asgari ücret (TL/ay) */
  minWageGross: number;
  /** SGK primine esas kazanç tavanı (TL/ay) — genelde brüt asgari × 7.5 */
  sgkCeiling: number;
}

interface YearConfig {
  /** GVK md. 103 gelir vergisi dilimleri (yıllık kümülatif sınırlar) */
  brackets: TaxBracket[];
  /** Dönemsel parametreler */
  periods: PeriodConfig[];
  /** Asgari ücrete isabet eden vergi istisnası (7349 s.K., 2022+) */
  minWageExemption: boolean;
}

// ─── Yıllık parametre tablosu ───────────────────────────────────────

const YEARS: Record<number, YearConfig> = {
  2019: {
    brackets: [
      { upTo: 18_000, rate: 0.15 },
      { upTo: 40_000, rate: 0.20 },
      { upTo: 148_000, rate: 0.27 },
      { upTo: 500_000, rate: 0.35 },
      { upTo: Infinity, rate: 0.40 },
    ],
    periods: [{ months: [1, 12], minWageGross: 2_558.40, sgkCeiling: 19_188 }],
    minWageExemption: false,
  },
  2020: {
    brackets: [
      { upTo: 22_000, rate: 0.15 },
      { upTo: 49_000, rate: 0.20 },
      { upTo: 180_000, rate: 0.27 },
      { upTo: 600_000, rate: 0.35 },
      { upTo: Infinity, rate: 0.40 },
    ],
    periods: [{ months: [1, 12], minWageGross: 2_943, sgkCeiling: 22_072.50 }],
    minWageExemption: false,
  },
  2021: {
    brackets: [
      { upTo: 24_000, rate: 0.15 },
      { upTo: 53_000, rate: 0.20 },
      { upTo: 190_000, rate: 0.27 },
      { upTo: 650_000, rate: 0.35 },
      { upTo: Infinity, rate: 0.40 },
    ],
    periods: [{ months: [1, 12], minWageGross: 3_577.50, sgkCeiling: 26_831.25 }],
    minWageExemption: false,
  },
  2022: {
    brackets: [
      { upTo: 32_000, rate: 0.15 },
      { upTo: 70_000, rate: 0.20 },
      { upTo: 250_000, rate: 0.27 },
      { upTo: 880_000, rate: 0.35 },
      { upTo: Infinity, rate: 0.40 },
    ],
    periods: [
      { months: [1, 6], minWageGross: 5_004, sgkCeiling: 37_530 },
      { months: [7, 12], minWageGross: 6_471, sgkCeiling: 48_532.50 },
    ],
    minWageExemption: true,
  },
  2023: {
    brackets: [
      { upTo: 70_000, rate: 0.15 },
      { upTo: 150_000, rate: 0.20 },
      { upTo: 550_000, rate: 0.27 },
      { upTo: 1_900_000, rate: 0.35 },
      { upTo: Infinity, rate: 0.40 },
    ],
    periods: [
      { months: [1, 6], minWageGross: 10_008, sgkCeiling: 75_060 },
      { months: [7, 12], minWageGross: 13_414.50, sgkCeiling: 100_608.75 },
    ],
    minWageExemption: true,
  },
  2024: {
    brackets: [
      { upTo: 110_000, rate: 0.15 },
      { upTo: 230_000, rate: 0.20 },
      { upTo: 870_000, rate: 0.27 },
      { upTo: 3_000_000, rate: 0.35 },
      { upTo: Infinity, rate: 0.40 },
    ],
    periods: [
      { months: [1, 6], minWageGross: 17_002, sgkCeiling: 127_515 },
      { months: [7, 12], minWageGross: 20_002.50, sgkCeiling: 150_018.75 },
    ],
    minWageExemption: true,
  },
  2025: {
    brackets: [
      { upTo: 158_000, rate: 0.15 },
      { upTo: 330_000, rate: 0.20 },
      { upTo: 1_250_000, rate: 0.27 },
      { upTo: 4_300_000, rate: 0.35 },
      { upTo: Infinity, rate: 0.40 },
    ],
    periods: [{ months: [1, 12], minWageGross: 22_104.75, sgkCeiling: 165_785.63 }],
    minWageExemption: true,
  },
  2026: {
    brackets: [
      { upTo: 200_000, rate: 0.15 },
      { upTo: 420_000, rate: 0.20 },
      { upTo: 1_500_000, rate: 0.27 },
      { upTo: 5_500_000, rate: 0.35 },
      { upTo: Infinity, rate: 0.40 },
    ],
    periods: [{ months: [1, 12], minWageGross: 28_000, sgkCeiling: 210_000 }],
    minWageExemption: true,
  },
};

// ─── Yardımcı fonksiyonlar ──────────────────────────────────────────

function getYearConfig(year: number): YearConfig {
  if (YEARS[year]) return YEARS[year]!;
  const keys = Object.keys(YEARS).map(Number).sort((a, b) => a - b);
  const nearest = keys.reduce((best, k) =>
    Math.abs(k - year) < Math.abs(best - year) ? k : best
  );
  return YEARS[nearest]!;
}

function getPeriodConfig(config: YearConfig, month: number): PeriodConfig {
  for (const p of config.periods) {
    if (month >= p.months[0] && month <= p.months[1]) return p;
  }
  return config.periods[config.periods.length - 1]!;
}

/** Kümülatif gelir vergisi hesaplama (GVK md. 103 dilim tablosu) */
function progressiveTax(base: number, brackets: TaxBracket[]): number {
  if (base <= 0) return 0;
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    if (base <= prev) break;
    const taxable = Math.min(base, b.upTo) - prev;
    tax += taxable * b.rate;
    prev = b.upTo;
  }
  return tax;
}

// ─── Ana dönüşüm fonksiyonu ─────────────────────────────────────────

/**
 * Aylık brüt ücreti nete çevirir.
 *
 * Varsayım: Çalışan yıl başından beri aynı brüt ücretle çalışmaktadır.
 * Kümülatif gelir vergisi matrahı bu varsayıma göre hesaplanır.
 *
 * @param gross Aylık brüt ücret (TL)
 * @param year  İlgili yıl (kaza yılı)
 * @param month İlgili ay (1–12)
 * @returns Aylık net ücret (TL, iki ondalık yuvarlanmış)
 */
export function computeMonthlyNet(gross: number, year: number, month: number): number {
  if (gross <= 0 || !Number.isFinite(gross)) return 0;

  const config = getYearConfig(year);
  const period = getPeriodConfig(config, month);

  // 1. SGK kesintileri (tavan sınırı)
  const sgkBase = Math.min(gross, period.sgkCeiling);
  const sgkEmployee = sgkBase * SGK_EMPLOYEE_RATE;
  const sgkUnemployment = sgkBase * SGK_UNEMPLOYMENT_RATE;
  const totalSgk = sgkEmployee + sgkUnemployment;

  // 2. Aylık gelir vergisi matrahı
  const monthlyTaxBase = Math.max(0, gross - totalSgk);

  // 3. Kümülatif vergi (aynı maaşla yıl başından beri)
  const cumTaxBaseCurrent = monthlyTaxBase * month;
  const cumTaxBasePrev = monthlyTaxBase * (month - 1);
  let monthlyIncomeTax =
    progressiveTax(cumTaxBaseCurrent, config.brackets) -
    progressiveTax(cumTaxBasePrev, config.brackets);

  // 4. Damga vergisi ve asgari ücret istisnası
  let stampTax: number;

  if (config.minWageExemption) {
    // Asgari ücrete isabet eden vergi istisnası
    const mwSgkBase = Math.min(period.minWageGross, period.sgkCeiling);
    const mwTotalSgk = mwSgkBase * (SGK_EMPLOYEE_RATE + SGK_UNEMPLOYMENT_RATE);
    const mwTaxBase = Math.max(0, period.minWageGross - mwTotalSgk);

    const mwCumTaxCurrent = progressiveTax(mwTaxBase * month, config.brackets);
    const mwCumTaxPrev = progressiveTax(mwTaxBase * (month - 1), config.brackets);
    const mwMonthlyTax = mwCumTaxCurrent - mwCumTaxPrev;

    monthlyIncomeTax = Math.max(0, monthlyIncomeTax - mwMonthlyTax);
    stampTax = Math.max(0, gross - period.minWageGross) * STAMP_TAX_RATE;
  } else {
    stampTax = gross * STAMP_TAX_RATE;
  }

  // 5. Net ücret
  const net = gross - totalSgk - monthlyIncomeTax - stampTax;
  return Math.round(net * 100) / 100;
}

/** Parametrelerin mevcut olduğu yıl aralığını döndürür. */
export function supportedYearRange(): [number, number] {
  const keys = Object.keys(YEARS).map(Number);
  return [Math.min(...keys), Math.max(...keys)];
}
