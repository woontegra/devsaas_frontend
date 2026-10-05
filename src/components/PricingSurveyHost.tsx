/**
 * Fiyat anketi modalı — başarılı parasal sonuç sonrası eligibility ile açılır.
 * Hesaplama /run öncesi veya hata durumunda açılmaz. Çıkış tetiklemez.
 *
 * Bilirkişi Hesap fiyatları yalnızca REFERANS gösterim içindir; DB'ye yazılmaz.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { api, fetchPricingSurveyStatus, markPricingSurveyShown } from "../services/api";
import { useToast } from "../ui/toast";

export const PRICING_SURVEY_SESSION_DISMISS_KEY = "pricingSurveyDismissedSession";
/** Bu oturumda teklif zaten planlandı/gösterildi (double-trigger + StrictMode) */
export const PRICING_SURVEY_OFFER_CLAIM_KEY = "pricingSurveyOfferClaimedSession";

/** Logout / yeni oturum — session survey bayraklarını temizle */
export function clearPricingSurveySessionFlags(): void {
  try {
    sessionStorage.removeItem(PRICING_SURVEY_SESSION_DISMISS_KEY);
    sessionStorage.removeItem(PRICING_SURVEY_OFFER_CLAIM_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Geçici pazar araştırması referansı — Woontegra/Bilirkişi backend entegrasyonu yok.
 * Bu değerler input değildir; PricingSurveyResponse'a yazılmaz.
 */
export const BILIRKISI_HESAP_REFERENCE_PRICE = {
  productName: "Bilirkişi Hesap",
  monthlyTl: 2000,
  yearlyTl: 20000,
} as const;

/** Sonuç render sonrası gecikme (ms) — kullanıcı önce sonucu görsün */
export const PRICING_SURVEY_RESULT_DELAY_MS = 10000;

type PurchaseIntent = "YES" | "MAYBE" | "NO";

function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

function formatTlInput(raw: string): string {
  const digits = digitsOnly(raw);
  if (!digits) return "";
  const n = Number(digits);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("tr-TR");
}

function formatTlDisplay(n: number): string {
  return n.toLocaleString("tr-TR");
}

function parseTlInput(raw: string): number | null {
  const digits = digitsOnly(raw);
  if (!digits) return null;
  const n = Number(digits);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

export function PricingSurveyModal({
  open,
  onDismiss,
  onSubmitted,
}: {
  open: boolean;
  /** Şimdi Değil — response oluşturmaz; çıkış devam eder */
  onDismiss: () => void;
  /** Başarılı submit sonrası */
  onSubmitted: () => void;
}) {
  const [monthly, setMonthly] = useState("");
  const [yearly, setYearly] = useState("");
  const [intent, setIntent] = useState<PurchaseIntent | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const m = parseTlInput(monthly);
    const y = parseTlInput(yearly);
    return m != null && y != null && intent !== "" && !busy;
  }, [monthly, yearly, intent, busy]);

  if (!open) return null;

  const dismiss = () => {
    sessionStorage.setItem(PRICING_SURVEY_SESSION_DISMISS_KEY, "1");
    void api.post("/pricing-survey/dismissed").catch(() => undefined);
    onDismiss();
  };

  const submit = async () => {
    setError(null);
    const m = parseTlInput(monthly);
    const y = parseTlInput(yearly);
    if (m == null) {
      setError("Geçerli bir aylık fiyat girin (0 olamaz).");
      return;
    }
    if (y == null) {
      setError("Geçerli bir yıllık fiyat girin (0 olamaz).");
      return;
    }
    if (!intent) {
      setError("Satın alma niyetini seçin.");
      return;
    }
    setBusy(true);
    try {
      // Yalnız Aktüerya önerileri gönderilir — Bilirkişi referansı payload'a eklenmez
      await api.post("/pricing-survey/submit", {
        monthlyPriceSuggested: m,
        yearlyPriceSuggested: y,
        purchaseIntent: intent,
      });
      sessionStorage.setItem(PRICING_SURVEY_SESSION_DISMISS_KEY, "1");
      onSubmitted();
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? String(
              (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? ""
            )
          : "";
      setError(msg || "Görüşünüz kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pricing-survey-title"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0F1E30]/45 p-4"
    >
      <div className="max-h-[min(92vh,720px)] w-full max-w-[500px] overflow-y-auto rounded-[12px] border border-[#D7E0EA] bg-white p-5 shadow-[0_12px_40px_rgba(18,59,99,0.18)]">
        <h2
          id="pricing-survey-title"
          className="m-0 text-[17px] font-semibold tracking-[-0.02em] text-[#123B63]"
        >
          Fiyat konusunda fikrinizi almak isteriz
        </h2>
        <p className="mt-2.5 mb-4 text-[13.5px] leading-[1.5] text-[#5F6F81]">
          Aktüerya Hesaplama Programımızı satışa sunmadan önce, programı test eden kullanıcılarımızın
          fiyat konusundaki görüşlerini almak istiyoruz.
        </p>

        {/* Referans — Bilirkişi Hesap (salt bilgi) */}
        <div
          className="mb-4 rounded-[10px] border border-[#C5D4E3] bg-[#F3F7FB] px-3.5 py-3"
          aria-label="Bilirkişi Hesap referans fiyat"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#0F4C81]">
              {BILIRKISI_HESAP_REFERENCE_PRICE.productName}
            </p>
            <span className="rounded-[6px] bg-white/80 px-2 py-0.5 text-[10.5px] font-medium text-[#66727F] border border-[#D7E0EA]">
              Referans fiyat
            </span>
          </div>
          <p className="mt-1.5 text-[12.5px] text-[#5F6F81]">Mevcut satış fiyatımız:</p>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <div className="rounded-[8px] border border-[#D7E0EA]/80 bg-white px-3 py-2">
              <p className="text-[11px] font-medium text-[#66727F]">Aylık</p>
              <p className="mt-0.5 text-[15px] font-semibold tracking-[-0.02em] text-[#123B63]">
                {formatTlDisplay(BILIRKISI_HESAP_REFERENCE_PRICE.monthlyTl)}{" "}
                <span className="text-[12px] font-medium text-[#66727F]">TL / ay</span>
              </p>
            </div>
            <div className="rounded-[8px] border border-[#D7E0EA]/80 bg-white px-3 py-2">
              <p className="text-[11px] font-medium text-[#66727F]">Yıllık</p>
              <p className="mt-0.5 text-[15px] font-semibold tracking-[-0.02em] text-[#123B63]">
                {formatTlDisplay(BILIRKISI_HESAP_REFERENCE_PRICE.yearlyTl)}{" "}
                <span className="text-[12px] font-medium text-[#66727F]">TL / yıl</span>
              </p>
            </div>
          </div>
        </div>

        <p className="mb-3 text-[13.5px] leading-[1.45] font-medium text-[#1F2933]">
          Bilirkişi Hesap Programımızın mevcut fiyatlarını da dikkate aldığınızda, Aktüerya Hesaplama
          Programı&apos;nın sizce aylık ve yıllık fiyatı ne olmalıdır?
        </p>

        {/* Aktüerya öneri girdileri */}
        <div className="mb-4 rounded-[10px] border border-[#D7E0EA] bg-white px-3.5 py-3">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.04em] text-[#123B63]">
            Aktüerya Hesaplama
          </p>

          <label className="mb-1 block text-[12px] font-medium text-[#5F6F81]">
            Aylık fiyat öneriniz
          </label>
          <div className="mb-3 flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={monthly}
              onChange={(e) => setMonthly(formatTlInput(e.target.value))}
              placeholder="Örn. 2.500"
              className="min-h-[40px] flex-1 rounded-[8px] border border-[#D7E0EA] px-3 text-[14px] text-[#1F2933] outline-none focus:border-[#0F4C81]"
            />
            <span className="shrink-0 text-[12.5px] text-[#66727F]">TL / ay</span>
          </div>

          <label className="mb-1 block text-[12px] font-medium text-[#5F6F81]">
            Yıllık fiyat öneriniz
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={yearly}
              onChange={(e) => setYearly(formatTlInput(e.target.value))}
              placeholder="Örn. 25.000"
              className="min-h-[40px] flex-1 rounded-[8px] border border-[#D7E0EA] px-3 text-[14px] text-[#1F2933] outline-none focus:border-[#0F4C81]"
            />
            <span className="shrink-0 text-[12.5px] text-[#66727F]">TL / yıl</span>
          </div>
        </div>

        <p className="mb-2 text-[13px] font-medium text-[#1F2933]">
          Belirttiğiniz fiyatlarda Aktüerya Hesaplama Programı&apos;nı kullanmayı düşünür müsünüz?
        </p>
        <div className="mb-4 flex gap-2">
          {(
            [
              ["YES", "Evet"],
              ["MAYBE", "Belki"],
              ["NO", "Hayır"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setIntent(v)}
              className={`min-h-[36px] flex-1 rounded-[8px] border text-[13px] font-medium transition-colors ${
                intent === v
                  ? "border-[#0F4C81] bg-[#EEF4FA] text-[#123B63]"
                  : "border-[#D7E0EA] bg-white text-[#1F2933] hover:bg-[#F5F7FA]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error ? <p className="mb-3 text-[12.5px] text-[#B42318]">{error}</p> : null}

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={dismiss}
            disabled={busy}
            className="btn-secondary min-h-[36px] px-4"
          >
            Şimdi Değil
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void submit()}
            className="btn-primary min-h-[36px] px-4 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Gönderiliyor…" : "Görüşümü Gönder"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Başarılı /calculations/run sonrası tetikleyici.
 * triggerToken: her başarılı parasal sonuçta artırılır (0 = henüz yok).
 * Çıkış / beforeunload ile ilgisi yoktur.
 */
export function PricingSurveyAfterResultHost({
  triggerToken,
}: {
  triggerToken: number;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const handledTokenRef = useRef(0);

  useEffect(() => {
    if (!triggerToken || triggerToken <= 0) return;
    if (triggerToken === handledTokenRef.current) return;

    try {
      if (sessionStorage.getItem(PRICING_SURVEY_SESSION_DISMISS_KEY) === "1") {
        handledTokenRef.current = triggerToken;
        return;
      }
      if (sessionStorage.getItem(PRICING_SURVEY_OFFER_CLAIM_KEY) === "1") {
        handledTokenRef.current = triggerToken;
        return;
      }
      // StrictMode / çift effect: claim önce yazılır
      sessionStorage.setItem(PRICING_SURVEY_OFFER_CLAIM_KEY, "1");
    } catch {
      /* sessionStorage yoksa devam */
    }

    handledTokenRef.current = triggerToken;
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const status = await fetchPricingSurveyStatus();
          if (cancelled) return;
          if (!status.eligible) {
            // Kalıcı engellerde claim kalsın; geçici (henüz completed yok) nadiren — claim bırak
            if (status.reason === "NO_COMPLETED_CALCULATION") {
              try {
                sessionStorage.removeItem(PRICING_SURVEY_OFFER_CLAIM_KEY);
              } catch {
                /* ignore */
              }
              handledTokenRef.current = 0;
            }
            return;
          }
          await markPricingSurveyShown().catch(() => undefined);
          if (!cancelled) setOpen(true);
        } catch {
          try {
            sessionStorage.removeItem(PRICING_SURVEY_OFFER_CLAIM_KEY);
          } catch {
            /* ignore */
          }
          handledTokenRef.current = 0;
        }
      })();
    }, PRICING_SURVEY_RESULT_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [triggerToken]);

  return (
    <PricingSurveyModal
      open={open}
      onDismiss={() => {
        setOpen(false);
      }}
      onSubmitted={() => {
        toast.success("Teşekkür ederiz. Görüşünüz kaydedildi.", undefined, "pricing-survey-ok");
        setOpen(false);
      }}
    />
  );
}

/** @deprecated — result host kullanın */
export function PricingSurveyHost(_props: { ready?: boolean }) {
  return null;
}
