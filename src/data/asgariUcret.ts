/**
 * Asgari ücret tablosu (yıllık net).
 * Olay tarihi yılına göre "Olay Tarihindeki Net Asgari Ücret" hesaplamasında kullanılır.
 */

export const ASGARI_UCRET = [
  { year: 2016, net: 1300 },
  { year: 2017, net: 1404 },
  { year: 2018, net: 1603 },
  { year: 2019, net: 2020 },
  { year: 2020, net: 2324 },
  { year: 2021, net: 2825 },
  { year: 2022, net: 5500 },
  { year: 2023, net: 8506 },
  { year: 2024, net: 17002 },
  { year: 2025, net: 22104 },
] as const;

/** 2014 Kasım net asgari ücret (TÜİK katsayı hesabında referans) */
export const KASIM_2014_ASGARI_UCRET_NET = 891;

/**
 * Verilen tarih (YYYY-MM-DD veya yıl) için net asgari ücreti döndürür.
 * Yıl tabloda yoksa en yakın (önceki) yılın değeri kullanılır; hiç yoksa 0.
 */
export function getNetAsgariUcretForDate(eventDate: string): number {
  if (!eventDate || eventDate.length < 4) return 0;
  const year = parseInt(eventDate.slice(0, 4), 10);
  if (Number.isNaN(year)) return 0;
  const entry = ASGARI_UCRET.filter((r) => r.year <= year).pop();
  return entry?.net ?? 0;
}

/**
 * Brüt ücreti yaklaşık net ücrete çevirir (vergi ve sigorta kesintisi tahmini).
 * Oran değiştirilebilir.
 */
export function bruttenNeteCevir(brut: number, oran = 0.75): number {
  if (brut <= 0 || Number.isNaN(brut)) return 0;
  return Math.round(brut * oran * 100) / 100;
}
