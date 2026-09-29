/** Türkçe para / tarih / yüzde formatları — yalnızca görüntüleme */

export function formatMoney(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}

export function formatDateIso(iso: string | null | undefined): string {
  if (!iso) return "—";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `%${value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatKn(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

/** KN / iskonto — referans cetvel 8 ondalık (kesme) */
function truncateToDecimals(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.trunc(value * factor) / factor;
}

export function formatKn8(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const t = truncateToDecimals(value, 8);
  return t.toLocaleString("tr-TR", { minimumFractionDigits: 8, maximumFractionDigits: 8 });
}

export function formatDecimalYears(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} yıl`;
}

export function formatTrhYmd(entry: { year: number; month: number; day: number }): string {
  const parts: string[] = [];
  if (entry.year > 0) parts.push(`${entry.year} yıl`);
  if (entry.month > 0) parts.push(`${entry.month} ay`);
  if (entry.day > 0) parts.push(`${entry.day} gün`);
  return parts.length > 0 ? parts.join(" ") : "—";
}

export function formatCalendarAgeYmd(
  entry: { years: number; months: number; days: number } | null | undefined
): string {
  if (
    !entry ||
    !Number.isFinite(entry.years) ||
    !Number.isFinite(entry.months) ||
    !Number.isFinite(entry.days)
  ) {
    return "—";
  }
  return `${entry.years} yıl ${entry.months} ay ${entry.days} gün`;
}

export function formatAgeYmd(
  entry: { years: number; months: number; days: number } | null | undefined
): string {
  if (!entry) return "—";
  const parts: string[] = [];
  if (entry.years > 0) parts.push(`${entry.years} yıl`);
  if (entry.months > 0) parts.push(`${entry.months} ay`);
  if (entry.days > 0) parts.push(`${entry.days} gün`);
  return parts.length > 0 ? parts.join(" ") : "0 gün";
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

/** Takvim yaşı (doğum → olay); TRH tablosu değildir. */
export function calendarAgeYmd(
  birthDate: string | undefined,
  eventDate: string | undefined
): { years: number; months: number; days: number } | null {
  const b = birthDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const e = eventDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!b?.[1] || !b[2] || !b[3] || !e?.[1] || !e[2] || !e[3]) return null;
  const by = Number(b[1]);
  const bm = Number(b[2]);
  const bd = Number(b[3]);
  const ey = Number(e[1]);
  const em = Number(e[2]);
  const ed = Number(e[3]);
  let years = ey - by;
  let months = em - bm;
  let days = ed - bd;
  if (days < 0) {
    months -= 1;
    days += new Date(ey, em - 1, 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return null;
  return { years, months, days };
}
