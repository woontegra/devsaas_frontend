import type { TemporaryIncapacityPeriod } from "../../types/calculationDraft";

export interface EffectiveTemporaryRange {
  startDate: string;
  endDate: string;
}

function isTempPeriodFilled(row: TemporaryIncapacityPeriod): boolean {
  const start = row.startDate?.trim();
  const end = row.endDate?.trim();
  return Boolean(start && end && /^\d{4}-\d{2}-\d{2}$/.test(start) && /^\d{4}-\d{2}-\d{2}$/.test(end));
}

export function getFilledTemporaryPeriodsSorted(
  periods: TemporaryIncapacityPeriod[]
): Array<{ index: number; startDate: string; endDate: string }> {
  const filled: Array<{ index: number; startDate: string; endDate: string }> = [];
  for (let i = 0; i < periods.length; i++) {
    const row = periods[i]!;
    if (!isTempPeriodFilled(row)) continue;
    filled.push({ index: i, startDate: row.startDate.trim(), endDate: row.endDate.trim() });
  }
  filled.sort((a, b) => a.startDate.localeCompare(b.startDate));
  return filled;
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function computeEffectiveTemporaryRange(
  periods: TemporaryIncapacityPeriod[]
): EffectiveTemporaryRange | null {
  const filled = getFilledTemporaryPeriodsSorted(periods);
  if (filled.length === 0) return null;
  return {
    startDate: filled[0]!.startDate,
    endDate: filled[filled.length - 1]!.endDate,
  };
}

export function areTemporaryPeriodsConsecutive(periods: TemporaryIncapacityPeriod[]): boolean {
  const filled = getFilledTemporaryPeriodsSorted(periods);
  if (filled.length <= 1) return true;
  for (let i = 1; i < filled.length; i++) {
    const expected = addDaysIso(filled[i - 1]!.endDate, 1);
    if (filled[i]!.startDate !== expected) return false;
  }
  return true;
}

export function clearIgnoreGapsIfConsecutive<T extends { temporaryIncapacityIgnoreGaps?: boolean; temporaryIncapacityPeriods: TemporaryIncapacityPeriod[] }>(
  draft: T
): T {
  if (!draft.temporaryIncapacityIgnoreGaps) return draft;
  if (areTemporaryPeriodsConsecutive(draft.temporaryIncapacityPeriods)) {
    return { ...draft, temporaryIncapacityIgnoreGaps: false };
  }
  return draft;
}
