import type { TemporaryIncapacityPeriod } from "../../types/calculationDraft";

export const TEMP_INCAPACITY_START_MUST_MATCH_EVENT_DATE =
  "TEMP_INCAPACITY_START_MUST_MATCH_EVENT_DATE";

export const TEMP_INCAPACITY_START_MUST_MATCH_EVENT_DATE_MESSAGE =
  "Hastane raporu / geçici iş göremezlik başlangıç tarihi kaza tarihinden önce veya sonra olamaz.";

export function hasTempIncapacityStartEventDateError(
  errors: Array<{ code?: string }>
): boolean {
  return errors.some((e) => e.code === TEMP_INCAPACITY_START_MUST_MATCH_EVENT_DATE);
}

export function findFirstTemporaryIncapacityStartIndex(
  periods: TemporaryIncapacityPeriod[]
): number | null {
  let bestIndex: number | null = null;
  let bestStart = "";
  for (let i = 0; i < periods.length; i++) {
    const start = periods[i]?.startDate?.trim();
    if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) continue;
    if (bestIndex == null || start < bestStart) {
      bestIndex = i;
      bestStart = start;
    }
  }
  return bestIndex;
}

export function fieldHasTempIncapacityStartError(
  fieldErrors: { field: string; code?: string }[],
  field: string
): boolean {
  return fieldErrors.some(
    (e) => e.field === field && e.code === TEMP_INCAPACITY_START_MUST_MATCH_EVENT_DATE
  );
}

import {
  hasTempIncapacityPeriodGapError,
  hasTempIncapacityPeriodOverlapError,
} from "./tempIncapacityPeriodContinuity";
import { hasDisabilityStartDateRequiredError } from "./disabilityStartDateValidation";

export type TrafficValidationModalKind =
  | "temp_incapacity_period_overlap"
  | "temp_incapacity_period_gap"
  | "disability_start_date_required"
  | "temp_incapacity_start"
  | "temp_disability_continuity";

export function resolveTrafficValidationModal(
  errors: Array<{ field: string; code?: string }>
): TrafficValidationModalKind | null {
  if (hasTempIncapacityPeriodOverlapError(errors)) return "temp_incapacity_period_overlap";
  if (hasTempIncapacityPeriodGapError(errors)) return "temp_incapacity_period_gap";
  if (hasDisabilityStartDateRequiredError(errors)) return "disability_start_date_required";
  if (hasTempIncapacityStartEventDateError(errors)) return "temp_incapacity_start";
  if (
    errors.some(
      (e) => e.code === "TEMP_DISABILITY_GAP" || e.code === "TEMP_DISABILITY_OVERLAP"
    )
  ) {
    return "temp_disability_continuity";
  }
  return null;
}
