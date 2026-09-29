import type { ValidationIssue } from "../../types/calculationDraft";
import type { TemporaryIncapacityPeriod } from "../../types/calculationDraft";

export const TEMP_DISABILITY_GAP = "TEMP_DISABILITY_GAP";
export const TEMP_DISABILITY_OVERLAP = "TEMP_DISABILITY_OVERLAP";

export const TEMP_DISABILITY_GAP_MESSAGE =
  "Hastane raporu bitiş tarihi ile maluliyet başlangıç tarihi arasında boşluk gün olmamalı.";

export const TEMP_DISABILITY_OVERLAP_MESSAGE =
  "Maluliyet başlangıç tarihi hastane raporu bitiş tarihinden önce olamaz.";

export type TempDisabilityContinuityCode =
  | typeof TEMP_DISABILITY_GAP
  | typeof TEMP_DISABILITY_OVERLAP;

export function getTempDisabilityContinuityCode(
  errors: Array<{ field: string; code?: string }>
): TempDisabilityContinuityCode | null {
  const disabilityErr = errors.find(
    (e) =>
      e.field === "disability.disabilityStartDate" &&
      (e.code === TEMP_DISABILITY_GAP || e.code === TEMP_DISABILITY_OVERLAP)
  );
  if (disabilityErr?.code === TEMP_DISABILITY_GAP || disabilityErr?.code === TEMP_DISABILITY_OVERLAP) {
    return disabilityErr.code;
  }
  const any = errors.find(
    (e) => e.code === TEMP_DISABILITY_GAP || e.code === TEMP_DISABILITY_OVERLAP
  );
  if (any?.code === TEMP_DISABILITY_GAP || any?.code === TEMP_DISABILITY_OVERLAP) {
    return any.code;
  }
  return null;
}

export function getTempDisabilityContinuityMessage(
  code: TempDisabilityContinuityCode
): string {
  return code === TEMP_DISABILITY_OVERLAP
    ? TEMP_DISABILITY_OVERLAP_MESSAGE
    : TEMP_DISABILITY_GAP_MESSAGE;
}

export function hasTempDisabilityContinuityError(
  errors: Pick<ValidationIssue, "code">[]
): boolean {
  return errors.some(
    (e) => e.code === TEMP_DISABILITY_GAP || e.code === TEMP_DISABILITY_OVERLAP
  );
}

export function findLastTemporaryIncapacityEndIndex(
  periods: TemporaryIncapacityPeriod[]
): number | null {
  let bestIndex: number | null = null;
  let bestEnd = "";
  for (let i = 0; i < periods.length; i++) {
    const end = periods[i]?.endDate?.trim();
    if (!end || !/^\d{4}-\d{2}-\d{2}$/.test(end)) continue;
    if (bestIndex == null || end > bestEnd) {
      bestIndex = i;
      bestEnd = end;
    }
  }
  return bestIndex;
}

export function fieldHasContinuityError(
  fieldErrors: { field: string; code?: string }[],
  field: string
): boolean {
  return fieldErrors.some(
    (e) =>
      e.field === field &&
      (e.code === TEMP_DISABILITY_GAP || e.code === TEMP_DISABILITY_OVERLAP)
  );
}

export function dateInputErrorClass(active: boolean): string {
  return active
    ? "border-red-500 bg-red-50/40 ring-2 ring-red-200/80 focus:border-red-500 focus:ring-red-200/80"
    : "border-slate-200 focus:ring-blue-800/15 focus:border-blue-800/60";
}
