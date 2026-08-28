/**
 * 30/360 aktüeryal gün sayısı — backend dayCount360.ts ile birebir aynı kural.
 * Yalnızca tazminat dönemleri için; yaş hesabında kullanılmaz.
 */

function parseIsoDateParts(iso: string): { y: number; m: number; d: number } | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m?.[1] || !m[2] || !m[3]) return null;
  return { y: parseInt(m[1], 10), m: parseInt(m[2], 10), d: parseInt(m[3], 10) };
}

function normalizeDay360(p: { d: number }): number {
  return p.d === 31 ? 30 : p.d;
}

/** backend actuarialDays360Inclusive ile aynı */
export function actuarialDays360Inclusive(startDate: string, endDate: string): number {
  if (!startDate || !endDate || startDate > endDate) return 0;

  const s = parseIsoDateParts(startDate);
  const e = parseIsoDateParts(endDate);
  if (!s || !e) return 0;

  const d1 = normalizeDay360(s);
  const d2 = normalizeDay360(e);

  const raw = (e.y - s.y) * 360 + (e.m - s.m) * 30 + (d2 - d1) + 1;
  return Math.min(Math.max(0, raw), 360);
}
