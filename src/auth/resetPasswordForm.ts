export function resetPasswordIssue(password: string, confirm: string): string | null {
  if (password.length < 8) return "Şifre en az 8 karakter olmalı.";
  if (password !== confirm) return "Şifreler eşleşmiyor.";
  return null;
}

export function readAuthRedirect(state: unknown): { view: "login" | "forgot"; info: string | null } {
  if (!state || typeof state !== "object") return { view: "login", info: null };
  const record = state as { view?: unknown; info?: unknown };
  return {
    view: record.view === "forgot" ? "forgot" : "login",
    info: typeof record.info === "string" && record.info.trim() ? record.info : null,
  };
}
