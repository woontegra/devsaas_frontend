/**
 * Kontrol ve Ödeme: başarılı motor sonucu destek cevabı veya exclusive-stale
 * bayrağı yüzünden silinmez ve ikinci bir /calculations/run planlamaz.
 * Müteveffa ömür sonu sınırı normalize/cap katmanında uygulanır.
 */

export function reviewAfterTrafficDeathSupport<T>(runResult: T | null): {
  runResult: T | null;
  requestAnotherRun: false;
} {
  return { runResult, requestAnotherRun: false };
}

/** Geçerli (cap uygulanmış) motor sonucunun parasal bölümü exclusive-stale ile yok edilmez. */
export function monetarySectionFromEngineResult<T>(
  cappedMonetary: T | null,
  exclusiveStale: boolean
): T | null {
  if (cappedMonetary == null) return null;
  void exclusiveStale;
  return cappedMonetary;
}

export function trafficDeathReportActionsVisible(params: {
  reviewFlowPhase: string;
  calculationType: string;
  runResult: unknown;
  hasReportHandler: boolean;
}): boolean {
  return (
    params.reviewFlowPhase === "result" &&
    params.calculationType === "TRAFFIC_DEATH" &&
    params.runResult != null &&
    params.hasReportHandler
  );
}
