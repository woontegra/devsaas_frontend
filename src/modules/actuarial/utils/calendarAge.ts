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
