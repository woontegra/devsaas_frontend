/**
 * Satış henüz açık değil — CTA placeholder.
 * İleride checkout URL / PAYTR buraya bağlanır.
 */
export const SALES_CHECKOUT_CONFIG = {
  enabled: false,
  /** true olduğunda checkoutUrl kullanılır */
  checkoutUrl: null as string | null,
  infoTitle: "Satış yakında",
  infoMessage:
    "Aktüerya Hesaplama Programı henüz satışa açılmamıştır. Satış başladığında bu alandan profesyonel pakete geçebilir veya aboneliğinizi yenileyebilirsiniz.",
} as const;
