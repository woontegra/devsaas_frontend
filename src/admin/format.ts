const calcTypeLabels: Record<string, string> = {
  TRAFFIC_INJURY: "Trafik Kazası Yaralanma",
  TRAFFIC_DEATH: "Trafik Kazası Ölüm",
  WORK_INJURY: "İş Kazası Yaralanma",
  WORK_DEATH: "İş Kazası Ölüm",
};

const eventLabels: Record<string, string> = {
  LOGIN: "Giriş yaptı",
  LOGOUT: "Çıkış yaptı",
  SESSION_START: "Oturum başladı",
  SESSION_END: "Oturum bitti",
  CALCULATION_CREATED: "Hesap oluşturuldu",
  CALCULATION_OPENED: "Hesap açıldı",
  CALCULATION_SAVED: "Hesap kaydedildi",
  CALCULATION_COMPLETED: "Hesap tamamlandı",
  CALCULATION_DELETED: "Hesap silindi",
  REPORT_CREATED: "Rapor oluşturuldu",
  STEP_OPENED: "Adım açıldı",
  STEP_COMPLETED: "Adım tamamlandı",
  STEP_VALIDATION_FAILED: "Adım doğrulama hatası",
  PRICING_SURVEY_SHOWN: "Fiyat anketi gösterildi",
  PRICING_SURVEY_DISMISSED: "Fiyat anketi ertelendi",
  PRICING_SURVEY_SUBMITTED: "Fiyat anketi cevaplandı",
  USER_CREATED: "Kullanıcı oluşturuldu",
  USER_UPDATED: "Kullanıcı güncellendi",
  SUBSCRIPTION_CHANGED: "Abonelik değiştirildi",
  ADMIN_ACTION: "Admin işlemi",
  TRIAL_STARTED: "Demo başladı",
  TRIAL_CREDIT_CONSUMED: "Demo kredisi kullanıldı",
  TRIAL_EXPIRED: "Demo süresi bitti",
  TRIAL_CREDITS_EXHAUSTED: "Demo kredileri bitti",
  TRIAL_CREDIT_ADJUSTED: "Demo kredisi ayarlandı",
  TRIAL_EXTENDED: "Demo uzatıldı",
  TRIAL_CONVERTED: "Demo profesyonele çevrildi",
};

const planLabels: Record<string, string> = {
  credit: "Kredi",
  monthly: "Aylık",
  yearly: "Yıllık",
  starter: "Starter (eski)",
  single: "Tek hesap (eski)",
  free: "Ücretsiz (eski)",
  pro: "Pro (eski)",
  admin: "Admin plan (eski)",
};

export function calcTypeLabel(type: string | null | undefined): string {
  if (!type) return "—";
  return calcTypeLabels[type] ?? type;
}

export function eventLabel(type: string): string {
  return eventLabels[type] ?? type;
}

export function planLabel(plan: string | null | undefined): string {
  if (!plan) return "—";
  return planLabels[plan] ?? plan;
}

export function displayName(name: string | null | undefined): string {
  const t = name?.trim();
  return t ? t : "Ad belirtilmemiş";
}

export function formatAdminDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatAdminDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function formatRemaining(ms: number): string {
  if (ms < 0) return "Süresi doldu";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days >= 60) {
    const months = Math.floor(days / 30);
    return `${months} ay`;
  }
  if (days >= 1) return `${days} gün`;
  const hours = Math.floor(ms / (60 * 60 * 1000));
  return hours <= 0 ? "1 günden az" : `${hours} sa`;
}

/** Admin yeni kullanıcı / abonelik — yeni ticari model */
export const PLAN_OPTIONS = [
  { value: "monthly", label: "Aylık" },
  { value: "yearly", label: "Yıllık" },
  { value: "credit", label: "Kredi (ileriye dönük)" },
];

export const PLAN_FILTER_OPTIONS = [
  ...PLAN_OPTIONS,
  { value: "starter", label: "Starter (eski)" },
  { value: "single", label: "Tek hesap (eski)" },
  { value: "pro", label: "Pro (eski)" },
  { value: "free", label: "Ücretsiz (eski)" },
];
