import { describe, expect, it } from "vitest";

/** Mirrors AdminLayout pageTitle + guard decision helpers for unit coverage */
function pageTitle(pathname: string): string {
  if (pathname === "/admin") return "Kontrol Merkezi";
  if (pathname === "/admin/users/new") return "Yeni Kullanıcı";
  if (pathname.startsWith("/admin/users/")) return "Kullanıcı Detayı";
  if (pathname.startsWith("/admin/users")) return "Kullanıcı Yönetimi";
  if (pathname.startsWith("/admin/subscriptions")) return "Abonelikler";
  return "Yönetim Paneli";
}

function canEnterAdmin(isAdmin: boolean | undefined): boolean {
  return Boolean(isAdmin);
}

describe("admin route helpers", () => {
  it("maps titles", () => {
    expect(pageTitle("/admin")).toBe("Kontrol Merkezi");
    expect(pageTitle("/admin/users")).toBe("Kullanıcı Yönetimi");
    expect(pageTitle("/admin/users/new")).toBe("Yeni Kullanıcı");
    expect(pageTitle("/admin/users/abc")).toBe("Kullanıcı Detayı");
  });

  it("denies non-admin", () => {
    expect(canEnterAdmin(false)).toBe(false);
    expect(canEnterAdmin(undefined)).toBe(false);
    expect(canEnterAdmin(true)).toBe(true);
  });
});
