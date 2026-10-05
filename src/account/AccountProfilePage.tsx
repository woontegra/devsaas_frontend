import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import type { AuthMeResponse } from "../modules/actuarial/types/savedCalculation";
import { updateAccountProfile } from "../services/api";
import { useToast } from "../ui/toast";
import { accountFacts } from "./accountProfileView";
import { AccountCard } from "./accountUi";

type Ctx = {
  me: AuthMeResponse | null;
  setMe: (me: AuthMeResponse | null) => void;
};

const inputClass =
  "account-input min-h-[36px] w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[13.5px] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]";

function formatPhoneDisplay(e164: string | null | undefined): string {
  if (!e164) return "";
  const d = e164.replace(/\D/g, "");
  if (d.startsWith("90") && d.length === 12) {
    const local = d.slice(2);
    return `0${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 8)} ${local.slice(8)}`;
  }
  return e164;
}

export function AccountProfilePage() {
  const { me, setMe } = useOutletContext<Ctx>();
  const toast = useToast();
  const [name, setName] = useState(me?.user?.name ?? "");
  const [phone, setPhone] = useState(formatPhoneDisplay(me?.user?.phoneNormalized));
  const [busy, setBusy] = useState(false);
  const facts = accountFacts(me);
  const email = me?.user?.email ?? "";

  useEffect(() => {
    setName(me?.user?.name ?? "");
    setPhone(formatPhoneDisplay(me?.user?.phoneNormalized));
  }, [me?.user?.name, me?.user?.phoneNormalized]);

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await updateAccountProfile({
        name: name.trim() || null,
        phone: phone.trim() || null,
      });
      if (me) {
        setMe({
          ...me,
          user: {
            ...me.user,
            name: res.user.name,
            phoneNormalized: res.user.phoneNormalized,
          },
        });
      }
      toast.success("Profil güncellendi.", undefined, "profile-ok");
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? String((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? "")
          : "";
      toast.error("Profil güncellenemedi.", msg || undefined, "profile-err");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="account-cols-3">
      <AccountCard title="Kişisel Bilgiler">
        <div className="account-form">
          <div>
            <label className="account-label" htmlFor="account-name">
              Ad Soyad
            </label>
            <input
              id="account-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              className={inputClass}
            />
          </div>
          <div>
            <label className="account-label" htmlFor="account-phone">
              Telefon
            </label>
            <input
              id="account-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XX XXX XX XX"
              className={inputClass}
            />
          </div>
          <div>
            <label className="account-label" htmlFor="account-email">
              E-posta
            </label>
            <input
              id="account-email"
              type="email"
              value={email}
              readOnly
              className={`${inputClass} bg-[var(--color-primary-soft)] text-[var(--color-muted)]`}
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="btn-primary min-h-[34px] px-4 disabled:opacity-50"
          >
            {busy ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </AccountCard>

      <AccountCard title="Hesap Bilgileri">
        {facts.length === 0 ? (
          <p className="m-0 text-[13px] text-[var(--color-muted)]">Hesap bilgisi yüklenemedi.</p>
        ) : (
          <dl className="account-facts">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </AccountCard>

      <AccountCard title="İletişim ve Güvenlik">
        <dl className="account-facts">
          <div>
            <dt>E-posta</dt>
            <dd>{email || "—"}</dd>
          </div>
        </dl>
        <p className="account-note">E-posta değişikliği için destek ile iletişime geçin.</p>
        <div className="account-shortcuts">
          <Link to="/account/security">Şifremi Değiştir</Link>
          <Link to="/support?new=1">Destek Talebi Oluştur</Link>
        </div>
      </AccountCard>
    </div>
  );
}
