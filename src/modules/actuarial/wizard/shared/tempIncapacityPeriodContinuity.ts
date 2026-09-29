export const TEMP_INCAPACITY_PERIOD_OVERLAP = "TEMP_INCAPACITY_PERIOD_OVERLAP";

export const TEMP_INCAPACITY_PERIOD_OVERLAP_TITLE =
  "Geçici iş göremezlik dönemleri birbiriyle örtüşüyor";

export const TEMP_INCAPACITY_PERIOD_OVERLAP_MESSAGE =
  "Yeni dönem başlangıç tarihi önceki hastane raporu bitiş tarihinden sonra olmalıdır.";

export const TEMP_INCAPACITY_PERIOD_GAP = "TEMP_INCAPACITY_PERIOD_GAP";

export const TEMP_INCAPACITY_PERIOD_GAP_TITLE =
  "Geçici iş göremezlik dönemleri arasında boşluk bulunuyor";

export const TEMP_INCAPACITY_PERIOD_GAP_MESSAGE =
  "Yeni dönem başlangıç tarihi önceki hastane raporu bitiş tarihinin hemen ertesi günü olmalıdır.";

export function hasTempIncapacityPeriodOverlapError(
  errors: Array<{ code?: string }>
): boolean {
  return errors.some((e) => e.code === TEMP_INCAPACITY_PERIOD_OVERLAP);
}

export function hasTempIncapacityPeriodGapError(errors: Array<{ code?: string }>): boolean {
  return errors.some((e) => e.code === TEMP_INCAPACITY_PERIOD_GAP);
}
