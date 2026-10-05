import type { DeathExpenseBlock, ExpenseItem } from "../types/calculationDraft";
import { newId } from "../types/calculationDraft";

export const LEGACY_TRANSPORT_CATEGORY = "legacy-transport";
export const LEGACY_TRANSPORT_NAME = "Nakil gideri";
export const DEFAULT_PRE_DEATH_TREATMENT_NAME = "Ölüm öncesi tedavi gideri";

/** Eski kayıtlarda ad yoksa varsayılanı gösterir. */
export function resolvePreDeathTreatmentName(block: DeathExpenseBlock): string {
  const named = block.preDeathTreatmentName?.trim();
  return named && named.length > 0 ? named : DEFAULT_PRE_DEATH_TREATMENT_NAME;
}

/** Eski nakil giderini otherExpenses satırına taşır; çift kayıt oluşturmaz. */
export function migrateDeathExpenseTransport(block: DeathExpenseBlock): DeathExpenseBlock {
  const transport =
    typeof block.transportCost === "number" && Number.isFinite(block.transportCost) && block.transportCost > 0
      ? block.transportCost
      : 0;
  const others = [...(block.otherExpenses ?? [])];
  if (transport <= 0) {
    return {
      ...block,
      otherExpenses: others,
      ...(block.transportCost != null ? { transportCost: undefined } : {}),
    };
  }
  const hasLegacy = others.some(
    (row) =>
      row.category === LEGACY_TRANSPORT_CATEGORY ||
      (row.name.trim() === LEGACY_TRANSPORT_NAME && Math.abs((row.amount ?? 0) - transport) < 0.005)
  );
  if (!hasLegacy) {
    others.push({
      id: LEGACY_TRANSPORT_CATEGORY,
      name: LEGACY_TRANSPORT_NAME,
      amount: transport,
      category: LEGACY_TRANSPORT_CATEGORY,
    });
  }
  return {
    ...block,
    otherExpenses: others,
    transportCost: undefined,
  };
}

export function emptyDeathOtherExpense(): ExpenseItem {
  return { id: newId(), name: "", amount: 0 };
}

function formatFaultPoint(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value)
    ? String(value)
    : value.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

/** Wizard / sonuç ekranı kırmızı kusur açıklaması. */
export function deathExpenseFaultNote(
  deceasedFaultRate: number | null | undefined,
  tense: "future" | "past" = "future"
): string {
  const rate = Math.max(0, Math.min(100, deceasedFaultRate ?? 0));
  const included = Math.round((100 - rate) * 100) / 100;
  const rateLabel = formatFaultPoint(rate);
  const includedLabel = formatFaultPoint(included);
  if (tense === "past") {
    return `Müteveffanın %${rateLabel} kusur oranı düşülerek giderlerin %${includedLabel}'i hesaplamaya dahil edilmiştir.`;
  }
  return `Müteveffanın %${rateLabel} kusur oranı düşülerek giderlerin %${includedLabel}'i hesaplamaya dahil edilecektir.`;
}
