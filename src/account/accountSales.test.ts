import { describe, expect, it } from "vitest";
import { SALES_CHECKOUT_CONFIG } from "../config/salesCheckout";

describe("sales checkout placeholder", () => {
  it("15/16/17) CTA henüz gerçek ödeme yapmıyor", () => {
    expect(SALES_CHECKOUT_CONFIG.enabled).toBe(false);
    expect(SALES_CHECKOUT_CONFIG.checkoutUrl).toBeNull();
    expect(SALES_CHECKOUT_CONFIG.infoMessage.length).toBeGreaterThan(20);
  });
});
