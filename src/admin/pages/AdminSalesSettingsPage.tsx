import { useEffect, useState, type FormEvent } from "react";
import { useToast } from "../../ui/toast";
import {
  fetchAdminSalesSetting,
  patchAdminSalesSetting,
  salesAssetUrl,
  uploadAdminSalesMedia,
  type AdminSalesPage,
  type AdminSalesSetting,
  type AdminSalesText,
} from "../adminApi";
import { AdminCard, AdminPageHeader } from "../components";

type SalesForm = {
  monthlyPriceTl: string;
  yearlyPriceTl: string;
  demoDurationDays: string;
  demoCredits: string;
  demoRequestsEnabled: boolean;
  purchaseEnabled: boolean;
  page: AdminSalesPage;
};

const SALES_PAGE_URL =
  import.meta.env.VITE_PUBLIC_SALES_URL || "http://localhost:5174/yazilimlar/aktuerya-hesaplama";

const SECTION_LABELS: { key: keyof AdminSalesPage["sections"]; label: string }[] = [
  { key: "modules", label: "Hesap modülleri" },
  { key: "features", label: "Öne çıkan özellikler" },
  { key: "gallery", label: "Programdan görüntüler" },
  { key: "audience", label: "Kimler için" },
  { key: "reasons", label: "Neden Aktüerya" },
  { key: "demo", label: "Demo" },
  { key: "faq", label: "Sık sorulan sorular" },
  { key: "mobile", label: "Aktüerya Mobil" },
  { key: "closing", label: "Kapanış" },
];

function toForm(setting: AdminSalesSetting): SalesForm {
  return {
    monthlyPriceTl: String(setting.monthlyPriceTl),
    yearlyPriceTl: String(setting.yearlyPriceTl),
    demoDurationDays: String(setting.demoDurationDays),
    demoCredits: String(setting.demoCredits),
    demoRequestsEnabled: setting.demoRequestsEnabled,
    purchaseEnabled: setting.purchaseEnabled,
    page: setting.page,
  };
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? "");
      const comma = value.indexOf(",");
      resolve(comma >= 0 ? value.slice(comma + 1) : value);
    };
    reader.onerror = () => reject(new Error("Dosya okunamadı."));
    reader.readAsDataURL(file);
  });
}

function mimeOf(file: File): string {
  if (file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/webp") return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".webp")) return "image/webp";
  return "";
}

export function AdminSalesSettingsPage() {
  const toast = useToast();
  const [form, setForm] = useState<SalesForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminSalesSetting()
      .then((res) => setForm(toForm(res.setting)))
      .catch((e) => setError(e?.message ?? "Yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  function patchPage(patch: Partial<AdminSalesPage>) {
    setForm((current) => (current ? { ...current, page: { ...current.page, ...patch } } : current));
  }

  async function upload(file: File): Promise<string> {
    if (file.size > 4 * 1024 * 1024) throw new Error("Görsel 4 MB sınırını aşıyor.");
    const mimeType = mimeOf(file);
    if (!mimeType) throw new Error("Yalnızca PNG, JPEG veya WEBP yüklenebilir.");
    const dataBase64 = await readFile(file);
    const saved = await uploadAdminSalesMedia({ fileName: file.name, mimeType, dataBase64 });
    return saved.url;
  }

  async function onLogo(file: File | undefined) {
    if (!file) return;
    setUploading("logo");
    try {
      patchPage({ logoUrl: await upload(file) });
      toast.success("Logo yüklendi. Kaydet ile sayfaya yazılır.");
    } catch (err) {
      toast.error("Logo yüklenemedi.", err instanceof Error ? err.message : undefined);
    } finally {
      setUploading(null);
    }
  }

  async function onHero(file: File | undefined) {
    if (!file) return;
    setUploading("hero");
    try {
      patchPage({ heroImageUrl: await upload(file) });
      toast.success("Ana görsel yüklendi. Kaydet ile sayfaya yazılır.");
    } catch (err) {
      toast.error("Ana görsel yüklenemedi.", err instanceof Error ? err.message : undefined);
    } finally {
      setUploading(null);
    }
  }

  async function onGalleryFile(file: File | undefined) {
    if (!file || !form) return;
    setUploading("gallery");
    try {
      const url = await upload(file);
      patchPage({
        gallery: [
          ...form.page.gallery,
          {
            id: `gorsel-${Date.now().toString(36)}`,
            caption: "Ekran görüntüsü",
            alt: "Aktüerya Hesaplama ekran görüntüsü",
            url,
          },
        ],
      });
      toast.success("Galeriye eklendi. Kaydet ile sayfaya yazılır.");
    } catch (err) {
      toast.error("Görsel eklenemedi.", err instanceof Error ? err.message : undefined);
    } finally {
      setUploading(null);
    }
  }

  function moveShot(index: number, direction: -1 | 1) {
    if (!form) return;
    const next = index + direction;
    if (next < 0 || next >= form.page.gallery.length) return;
    const gallery = form.page.gallery.slice();
    const [item] = gallery.splice(index, 1);
    if (!item) return;
    gallery.splice(next, 0, item);
    patchPage({ gallery });
  }

  function updateText(list: "modules" | "features", index: number, patch: Partial<AdminSalesText>) {
    if (!form) return;
    patchPage({
      [list]: form.page[list].map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    const monthlyPriceTl = Number(form.monthlyPriceTl);
    const yearlyPriceTl = Number(form.yearlyPriceTl);
    const demoDurationDays = Number(form.demoDurationDays);
    const demoCredits = Number(form.demoCredits);
    if (![monthlyPriceTl, yearlyPriceTl, demoDurationDays, demoCredits].every((n) => Number.isFinite(n) && n > 0)) {
      toast.error("Fiyat, süre ve kredi pozitif sayı olmalı.");
      return;
    }
    setBusy(true);
    patchAdminSalesSetting({
      monthlyPriceTl,
      yearlyPriceTl,
      demoDurationDays,
      demoCredits,
      demoRequestsEnabled: form.demoRequestsEnabled,
      purchaseEnabled: form.purchaseEnabled,
      page: form.page,
    })
      .then((res) => {
        setForm(toForm(res.setting));
        toast.success("Satış sayfası kaydedildi.");
      })
      .catch((err) => toast.error("Kayıt başarısız.", err?.message))
      .finally(() => setBusy(false));
  }

  if (loading) {
    return (
      <div className="admin-page">
        <AdminPageHeader title="Satış Sayfası Yönetimi" />
        <div className="admin-loading">Sayfa içeriği yükleniyor…</div>
      </div>
    );
  }
  if (error || !form) {
    return (
      <div className="admin-page">
        <AdminPageHeader title="Satış Sayfası Yönetimi" />
        <div className="admin-error">{error ?? "Yüklenemedi"}</div>
      </div>
    );
  }

  const page = form.page;
  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Satış Sayfası Yönetimi"
        description="Aktüerya ürün sayfasının metinleri, görselleri ve ticari ayarları. Sayfa düzeni aynı kalır."
        actions={
          <a className="admin-btn admin-btn-secondary" href={SALES_PAGE_URL} target="_blank" rel="noreferrer">
            Sayfayı Görüntüle
          </a>
        }
      />
      <form className="grid gap-4" onSubmit={onSubmit}>
        <AdminCard>
          <h2 className="mb-3 text-base font-semibold">Hero</h2>
          <div className="grid max-w-3xl gap-3">
            <label className="grid gap-1 text-sm">
              Başlık
              <input className="admin-input" value={page.heroTitle} onChange={(e) => patchPage({ heroTitle: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              Üst açıklama
              <textarea className="admin-input min-h-16" value={page.heroHeadline} onChange={(e) => patchPage({ heroHeadline: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              Açıklama
              <textarea className="admin-input min-h-20" value={page.heroLead} onChange={(e) => patchPage({ heroLead: e.target.value })} />
            </label>
            <ImageField
              label="Logo"
              url={page.logoUrl}
              busy={uploading === "logo"}
              onFile={onLogo}
              onClear={() => patchPage({ logoUrl: "" })}
            />
            <ImageField
              label="Ana ekran görüntüsü"
              url={page.heroImageUrl}
              busy={uploading === "hero"}
              onFile={onHero}
              onClear={() => patchPage({ heroImageUrl: "" })}
            />
          </div>
        </AdminCard>

        <AdminCard>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Galeri</h2>
            <label className="admin-btn admin-btn-secondary admin-btn-sm">
              {uploading === "gallery" ? "Yükleniyor…" : "Görsel ekle"}
              <input
                className="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploading !== null}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  void onGalleryFile(file);
                }}
              />
            </label>
          </div>
          <div className="grid gap-3">
            {page.gallery.map((shot, index) => (
              <div key={`${shot.id}-${index}`} className="grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-[96px_minmax(0,1fr)_auto]">
                {shot.url ? (
                  <img src={salesAssetUrl(shot.url)} alt="" className="h-16 w-24 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500">Boş</div>
                )}
                <div className="grid gap-2">
                  <input
                    className="admin-input"
                    value={shot.caption}
                    aria-label={`Görsel ${index + 1} başlığı`}
                    onChange={(event) => {
                      const gallery = page.gallery.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, caption: event.target.value } : item
                      );
                      patchPage({ gallery });
                    }}
                  />
                  <input
                    className="admin-input"
                    value={shot.alt}
                    aria-label={`Görsel ${index + 1} açıklaması`}
                    onChange={(event) => {
                      const gallery = page.gallery.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, alt: event.target.value } : item
                      );
                      patchPage({ gallery });
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => moveShot(index, -1)}>Yukarı</button>
                  <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => moveShot(index, 1)}>Aşağı</button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-ghost admin-btn-sm"
                    onClick={() => patchPage({ gallery: page.gallery.filter((_, itemIndex) => itemIndex !== index) })}
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        <TextCards title="Hesap modülleri" items={page.modules} onChange={(index, patch) => updateText("modules", index, patch)} />
        <TextCards title="Özellik kartları" items={page.features} onChange={(index, patch) => updateText("features", index, patch)} />

        <AdminCard>
          <h2 className="mb-3 text-base font-semibold">Bölümler</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {SECTION_LABELS.map((item) => (
              <label key={item.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={page.sections[item.key]}
                  onChange={(event) => patchPage({ sections: { ...page.sections, [item.key]: event.target.checked } })}
                />
                {item.label}
              </label>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="mb-3 text-base font-semibold">Aktüerya Mobil</h2>
          <div className="grid max-w-3xl gap-3">
            <label className="grid gap-1 text-sm">
              Başlık
              <input className="admin-input" value={page.mobileTitle} onChange={(e) => patchPage({ mobileTitle: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              Açıklama
              <textarea className="admin-input min-h-20" value={page.mobileText} onChange={(e) => patchPage({ mobileText: e.target.value })} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Google Play üst yazı
                <input className="admin-input" value={page.googlePlayKicker} onChange={(e) => patchPage({ googlePlayKicker: e.target.value })} />
              </label>
              <label className="grid gap-1 text-sm">
                Google Play etiket
                <input className="admin-input" value={page.googlePlayLabel} onChange={(e) => patchPage({ googlePlayLabel: e.target.value })} />
              </label>
              <label className="grid gap-1 text-sm">
                Google Play bağlantısı
                <input className="admin-input" value={page.googlePlayUrl} placeholder="https://" onChange={(e) => patchPage({ googlePlayUrl: e.target.value })} />
              </label>
              <label className="grid gap-1 text-sm">
                App Store üst yazı
                <input className="admin-input" value={page.appStoreKicker} onChange={(e) => patchPage({ appStoreKicker: e.target.value })} />
              </label>
              <label className="grid gap-1 text-sm">
                App Store etiket
                <input className="admin-input" value={page.appStoreLabel} onChange={(e) => patchPage({ appStoreLabel: e.target.value })} />
              </label>
              <label className="grid gap-1 text-sm">
                App Store bağlantısı
                <input className="admin-input" value={page.appStoreUrl} placeholder="https://" onChange={(e) => patchPage({ appStoreUrl: e.target.value })} />
              </label>
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="mb-3 text-base font-semibold">Fiyat ve demo</h2>
          <div className="grid max-w-xl gap-3">
            <label className="grid gap-1 text-sm">
              Aylık fiyat (TL)
              <input className="admin-input" inputMode="numeric" value={form.monthlyPriceTl} onChange={(e) => setForm({ ...form, monthlyPriceTl: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              Yıllık fiyat (TL)
              <input className="admin-input" inputMode="numeric" value={form.yearlyPriceTl} onChange={(e) => setForm({ ...form, yearlyPriceTl: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              Demo süresi (gün)
              <input className="admin-input" inputMode="numeric" value={form.demoDurationDays} onChange={(e) => setForm({ ...form, demoDurationDays: e.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              Demo kredi sayısı
              <input className="admin-input" inputMode="numeric" value={form.demoCredits} onChange={(e) => setForm({ ...form, demoCredits: e.target.value })} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.demoRequestsEnabled} onChange={(e) => setForm({ ...form, demoRequestsEnabled: e.target.checked })} />
              Demo talepleri açık
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.purchaseEnabled} onChange={(e) => setForm({ ...form, purchaseEnabled: e.target.checked })} />
              Satın alma açık
            </label>
          </div>
        </AdminCard>

        <div className="flex flex-wrap gap-2">
          <button type="submit" className="admin-btn admin-btn-primary" disabled={busy || uploading !== null}>
            {busy ? "Kaydediliyor…" : "Kaydet"}
          </button>
          <a className="admin-btn admin-btn-secondary" href={SALES_PAGE_URL} target="_blank" rel="noreferrer">
            Sayfayı Görüntüle
          </a>
        </div>
      </form>
    </div>
  );
}

function ImageField({
  label,
  url,
  busy,
  onFile,
  onClear,
}: {
  label: string;
  url: string;
  busy: boolean;
  onFile: (file: File | undefined) => void;
  onClear: () => void;
}) {
  return (
    <div className="grid gap-2 text-sm">
      <span>{label}</span>
      {url ? <img src={salesAssetUrl(url)} alt="" className="h-24 w-auto max-w-full rounded-lg border border-slate-200 object-contain" /> : null}
      <div className="flex flex-wrap gap-2">
        <label className="admin-btn admin-btn-secondary admin-btn-sm">
          {busy ? "Yükleniyor…" : "Dosya seç"}
          <input
            className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              onFile(file);
            }}
          />
        </label>
        {url ? (
          <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={onClear}>
            Kaldır
          </button>
        ) : null}
      </div>
    </div>
  );
}

function TextCards({
  title,
  items,
  onChange,
}: {
  title: string;
  items: AdminSalesText[];
  onChange: (index: number, patch: Partial<AdminSalesText>) => void;
}) {
  return (
    <AdminCard>
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      <div className="grid gap-3">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="grid gap-2 rounded-xl border border-slate-200 p-3">
            <input className="admin-input" value={item.title} aria-label={`${title} ${index + 1} başlık`} onChange={(e) => onChange(index, { title: e.target.value })} />
            <textarea className="admin-input min-h-16" value={item.text} aria-label={`${title} ${index + 1} açıklama`} onChange={(e) => onChange(index, { text: e.target.value })} />
          </div>
        ))}
      </div>
    </AdminCard>
  );
}
