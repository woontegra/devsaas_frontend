/**
 * Form yazı kalıbı — tüm formlarda kullanılacak tek tip.
 * Bu değerlerin dışına çıkılmamalı.
 */
export const formTypography = {
  /** Label: 11px, normal, gri */
  label: "text-[11px] font-normal text-gray-500 dark:text-ds-muted tracking-wide",
  /** Input/Select metin: 13px, ince */
  input: "text-[13px] font-[300]",
  /** Input yükseklik */
  inputHeight: "h-9",
  /** Readonly alan (input ile aynı metin, gri arka plan) */
  readonly:
    "w-full rounded-md border border-gray-200 dark:border-ds-border px-2.5 min-w-0 h-9 " +
    "bg-gray-50 dark:bg-ds-input text-gray-700 dark:text-ds-text font-[300] text-[13px] cursor-default",
} as const;
