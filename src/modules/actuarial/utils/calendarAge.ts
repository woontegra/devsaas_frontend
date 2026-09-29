/** Tamamlanmış takvim yaşı — TRH lookup key (30/360 KULLANILMAZ) */

export function parseIsoDateParts(iso: string): { y: number; m: number; d: number } | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m?.[1] || !m[2] || !m[3]) return null;
  return { y: parseInt(m[1], 10), m: parseInt(m[2], 10), d: parseInt(m[3], 10) };
}

export function completedCalendarAgeYears(birthDate: string, eventDate: string): number | null {
  const b = parseIsoDateParts(birthDate);
  const e = parseIsoDateParts(eventDate);
  if (!b || !e) return null;

  let age = e.y - b.y;
  if (e.m < b.m || (e.m === b.m && e.d < b.d)) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

function daysInCalendarMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addCalendarMonths(y: number, m: number, d: number, add: number): { y: number; m: number; d: number } {
  const index = y * 12 + (m - 1) + add;
  const ny = Math.floor(index / 12);
  const nm = (index % 12) + 1;
  return { y: ny, m: nm, d: Math.min(d, daysInCalendarMonth(ny, nm)) };
}

function utcDaySerial(y: number, m: number, d: number): number {
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Doğum → kaza gerçek takvim farkı. Eski kayıtta yıl/ay/gün yoksa ekran bunu kullanır. */
export function calendarSpanYmd(
  startDate: string,
  endDate: string
): { years: number; months: number; days: number } | null {
  const start = parseIsoDateParts(startDate);
  const end = parseIsoDateParts(endDate);
  if (!start || !end) return null;
  if (utcDaySerial(end.y, end.m, end.d) < utcDaySerial(start.y, start.m, start.d)) return null;

  let totalMonths = (end.y - start.y) * 12 + (end.m - start.m);
  let anchor = addCalendarMonths(start.y, start.m, start.d, totalMonths);
  if (utcDaySerial(anchor.y, anchor.m, anchor.d) > utcDaySerial(end.y, end.m, end.d)) {
    totalMonths -= 1;
    anchor = addCalendarMonths(start.y, start.m, start.d, totalMonths);
  }
  if (totalMonths < 0) return null;
  const days = utcDaySerial(end.y, end.m, end.d) - utcDaySerial(anchor.y, anchor.m, anchor.d);
  if (days < 0) return null;
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12, days };
}

export interface CalendarAgeYmd {
  years: number;
  months: number;
  days: number;
}

/** Backend dateUtils.calendarAgeAtEvent ile aynı mantık — wizard önizlemesi */
export function calendarAgeAtEvent(birthDate: string, eventDate: string): CalendarAgeYmd | null {
  const b = parseIsoDateParts(birthDate);
  const e = parseIsoDateParts(eventDate);
  if (!b || !e) return null;

  let years = e.y - b.y;
  let months = e.m - b.m;
  let days = e.d - b.d;

  if (days < 0) {
    months -= 1;
    days += new Date(e.y, e.m - 1, 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return null;
  return { years, months, days };
}
