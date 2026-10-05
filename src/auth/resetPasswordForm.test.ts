import { describe, expect, it } from "vitest";
import { readAuthRedirect, resetPasswordIssue } from "./resetPasswordForm";

describe("reset password form", () => {
  it("blocks a password shorter than 8 characters", () => {
    expect(resetPasswordIssue("kisa", "kisa")).toBe("Şifre en az 8 karakter olmalı.");
  });

  it("blocks a confirmation that does not match", () => {
    expect(resetPasswordIssue("yeni-sifre-1", "yeni-sifre-2")).toBe("Şifreler eşleşmiyor.");
  });

  it("accepts a matching password of 8 or more characters", () => {
    expect(resetPasswordIssue("yeni-sifre-1", "yeni-sifre-1")).toBeNull();
  });

  it("reads the post-reset notice and the new-link view", () => {
    expect(readAuthRedirect({ info: "Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz." })).toEqual({
      view: "login",
      info: "Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.",
    });
    expect(readAuthRedirect({ view: "forgot" }).view).toBe("forgot");
  });
});
