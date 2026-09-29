export const DISABILITY_START_DATE_REQUIRED = "DISABILITY_START_DATE_REQUIRED";

export const DISABILITY_START_DATE_REQUIRED_TITLE =
  "Maluliyet başlangıç tarihi girilmelidir";

export const DISABILITY_START_DATE_REQUIRED_MESSAGE =
  "Maluliyet oranı girilmiş dosyalarda maluliyet başlangıç tarihi boş bırakılamaz.";

export function hasDisabilityStartDateRequiredError(
  errors: Array<{ code?: string }>
): boolean {
  return errors.some((e) => e.code === DISABILITY_START_DATE_REQUIRED);
}

export function fieldHasDisabilityStartDateRequiredError(
  fieldErrors: { field: string; code?: string }[],
  field: string
): boolean {
  return fieldErrors.some(
    (e) => e.field === field && e.code === DISABILITY_START_DATE_REQUIRED
  );
}
