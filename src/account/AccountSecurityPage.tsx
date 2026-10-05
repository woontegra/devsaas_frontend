import { useState } from "react";
import { changePassword } from "../services/api";
import { useToast } from "../ui/toast";
import { AccountCard, PasswordVisibilityToggle } from "./accountUi";
import { passwordChecklist } from "./passwordRules";

const inputClass =
  "account-input min-h-[36px] w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 pr-16 text-[13.5px] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]";

export function AccountSecurityPage() {
  const toast = useToast();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [busy, setBusy] = useState(false);
  const checks = passwordChecklist({ currentPassword, newPassword, confirm });

  const submit = async () => {
    if (busy) return;
    if (!currentPassword) {
      toast.error("Mevcut şifre zorunludur.", undefined, "pw-cur");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Yeni şifre en az 8 karakter olmalı.", undefined, "pw-len");
      return;
    }
    if (newPassword !== confirm) {
      toast.error("Yeni şifre tekrarı eşleşmiyor.", undefined, "pw-match");
      return;
    }
    if (newPassword === currentPassword) {
      toast.error("Yeni şifre mevcut şifreyle aynı olamaz.", undefined, "pw-same");
      return;
    }
    setBusy(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Şifreniz başarıyla değiştirildi.", undefined, "pw-ok");
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? String((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? "")
          : "";
      toast.error("Şifre değiştirilemedi.", msg || undefined, "pw-err");
    } finally {
      setBusy(false);
    }
  };

  const field = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    visible: boolean,
    toggle: () => void,
    autoComplete: string
  ) => (
    <div>
      <label className="account-label" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={inputClass}
        />
        <PasswordVisibilityToggle visible={visible} onToggle={toggle} />
      </div>
    </div>
  );

  return (
    <div className="account-cols-2">
      <AccountCard title="Şifre değiştir">
        <div className="account-form">
          {field("pw-current", "Mevcut Şifre", currentPassword, setCurrent, showCur, () => setShowCur((v) => !v), "current-password")}
          {field("pw-next", "Yeni Şifre", newPassword, setNext, showNext, () => setShowNext((v) => !v), "new-password")}
          {field("pw-confirm", "Yeni Şifre Tekrar", confirm, setConfirm, showConf, () => setShowConf((v) => !v), "new-password")}
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="btn-primary min-h-[34px] px-4 disabled:opacity-50"
          >
            {busy ? "Kaydediliyor…" : "Şifreyi Güncelle"}
          </button>
        </div>
      </AccountCard>

      <AccountCard title="Şifre Gereksinimleri">
        <ul className="account-checks">
          {checks.map((check) => (
            <li key={check.id} className={check.met ? "is-met" : undefined}>
              <span aria-hidden>{check.met ? "✓" : "·"}</span>
              <span>{check.label}</span>
            </li>
          ))}
        </ul>
      </AccountCard>
    </div>
  );
}
