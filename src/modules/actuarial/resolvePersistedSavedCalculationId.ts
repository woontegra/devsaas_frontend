/**
 * Run/idempotency UUID (demo kredi) ile SavedCalculation DB id'sini ayırır.
 * PUT yalnız gerçek kalıcı kayıt + dosya adı varken yapılır.
 */
export function resolvePersistedSavedCalculationId(params: {
  currentSavedCalculationId: string | null | undefined;
  savedDisplayName: string | null | undefined;
}): string | null {
  const id =
    typeof params.currentSavedCalculationId === "string"
      ? params.currentSavedCalculationId.trim()
      : "";
  const name =
    typeof params.savedDisplayName === "string" ? params.savedDisplayName.trim() : "";
  if (!id || !name) return null;
  return id;
}
