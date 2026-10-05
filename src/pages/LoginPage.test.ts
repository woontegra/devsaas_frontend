import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "LoginPage.tsx"), "utf8");

describe("login screen", () => {
  it("does not offer a self-serve demo signup", () => {
    expect(source).not.toContain("Deneme hesabı oluştur");
    expect(source).not.toContain('to="/demo"');
    expect(source).not.toContain("DemoRequestPage");
  });

  it("keeps email, password, sign-in, and forgot-password", () => {
    expect(source).toContain("E-posta");
    expect(source).toContain("Şifre");
    expect(source).toContain("Giriş Yap");
    expect(source).toContain("Şifremi Unuttum");
  });
});
