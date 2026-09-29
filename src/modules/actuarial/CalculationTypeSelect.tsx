import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CalculationType } from "./types/calculationDraft";
import { CALCULATION_TYPE_DESCRIPTIONS, CALCULATION_TYPE_LABELS } from "./types/calculationDraft";
import { loadDraftForType } from "./draftStorage";
import { listSavedCalculations, deleteSavedCalculation } from "../../services/api";
import type { SavedCalculationListItem } from "./types/savedCalculation";

const TOPICS: Record<CalculationType, string[]> = {
  TRAFFIC_INJURY: ["Taraf bilgileri", "Hesaplama bilgileri", "Kontrol ve ödeme"],
  TRAFFIC_DEATH: ["Müteveffa", "Hak sahipleri", "Destek ilişkileri", "Kusur", "Önceki ödemeler"],
  WORK_INJURY: ["İşçi / işveren", "Ücret", "Kaçınılmazlık", "SGK belgeleri", "Maluliyet"],
  WORK_DEATH: ["Müteveffa işçi", "Hak sahibi", "SGK ölüm geliri", "İşveren kusuru", "PSD belge"],
};

const TYPES: CalculationType[] = ["TRAFFIC_INJURY", "TRAFFIC_DEATH", "WORK_INJURY", "WORK_DEATH"];

interface DraftSummary {
  type: CalculationType;
  label: string;
  fileName: string;
  eventDate: string;
  calculationDate: string;
}

function scanDrafts(): DraftSummary[] {
  const items: DraftSummary[] = [];
  for (const type of TYPES) {
    const loaded = loadDraftForType(type);
    if (!loaded.ok) continue;
    const d = loaded.draft;
    items.push({
      type,
      label: CALCULATION_TYPE_LABELS[type],
      fileName: d.common.internalFileName?.trim() || "—",
      eventDate: d.common.eventDate || "",
      calculationDate: d.common.calculationDate || "",
    });
  }
  return items;
}

function formatDisplayDate(iso: string): string {
  if (!iso) return "—";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}.${m[2]}.${m[1]}`;
  const d = new Date(iso);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("tr-TR");
  }
  return iso;
}

function TypeIcon({ type, size = 20 }: { type: CalculationType; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (type === "TRAFFIC_INJURY") {
    return (
      <svg {...common} aria-hidden>
        <path d="M5 17h14v-5l-2-5H7L5 12v5Z" />
        <circle cx="7.5" cy="17.5" r="1.5" />
        <circle cx="16.5" cy="17.5" r="1.5" />
        <path d="M12 7v3m-1.5-1.5h3" />
      </svg>
    );
  }
  if (type === "TRAFFIC_DEATH") {
    return (
      <svg {...common} aria-hidden>
        <path d="M5 17h14v-5l-2-5H7L5 12v5Z" />
        <circle cx="7.5" cy="17.5" r="1.5" />
        <circle cx="16.5" cy="17.5" r="1.5" />
        <path d="M9 9.5c0-1.2.9-2 2.2-2s2.2.8 2.2 2c0 1.4-2.2 2.2-2.2 2.2S9 10.9 9 9.5Z" />
      </svg>
    );
  }
  if (type === "WORK_INJURY") {
    return (
      <svg {...common} aria-hidden>
        <path d="M8 10h8l1 3v2H7v-2l1-3Z" />
        <path d="M9 10V8.5A3 3 0 0 1 12 5.5 3 3 0 0 1 15 8.5V10" />
        <path d="M12 14.5v2m-1.5-1h3" />
      </svg>
    );
  }
  return (
    <svg {...common} aria-hidden>
      <path d="M8 10h8l1 3v2H7v-2l1-3Z" />
      <path d="M9 10V8.5A3 3 0 0 1 12 5.5 3 3 0 0 1 15 8.5V10" />
      <path d="M8.5 18.5c.5-1.3 1.6-2 3.5-2s3 .7 3.5 2" />
    </svg>
  );
}

function ArrowIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PanelSection({
  title,
  icon,
  children,
  className = "",
  headerAction,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}) {
  return (
    <section className={`ui-panel-mock ${className}`}>
      <div className="ui-panel-mock-title">
        <span className="ui-panel-mock-title-icon">{icon}</span>
        <h2 className="flex-1 min-w-0">{title}</h2>
        {headerAction}
      </div>
      <div className="ui-panel-mock-body">{children}</div>
    </section>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  icon,
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
}) {
  return (
    <div className="ui-stat-card-mock">
      <span className="ui-stat-info-btn" title={subtitle} aria-label={`${label}: ${subtitle}`}>
        i
      </span>
      <span className="ui-stat-icon-box">{icon}</span>
      <div className="min-w-0 flex-1 pr-4">
        <p className="ui-caption font-medium">{label}</p>
        <p className="mt-1.5 text-[20px] sm:text-[22px] font-semibold tabular-nums text-brand-text tracking-[-0.02em] leading-none">
          {value}
        </p>
        <p className="ui-caption mt-1.5">{subtitle}</p>
      </div>
    </div>
  );
}

function statusLabel(status: string): string {
  if (status === "DRAFT") return "Taslak";
  if (status === "COMPLETED") return "Tamamlandı";
  return status;
}

function SavedWorkListRow({
  item,
  onOpen,
  onDelete,
}: {
  item: SavedCalculationListItem;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const type = item.calculationType as CalculationType;
  const label = CALCULATION_TYPE_LABELS[type] ?? item.calculationType;
  const dateLabel = item.eventDate
    ? formatDisplayDate(item.eventDate)
    : item.calculationDate
      ? formatDisplayDate(item.calculationDate)
      : formatDisplayDate(item.updatedAt);
  const title = item.displayName?.trim() || item.title?.trim() || label;

  return (
    <div className="ui-list-row group flex items-center gap-2">
      <button type="button" onClick={() => onOpen(item.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <span className="ui-module-icon-box !w-9 !h-9">
          <TypeIcon type={type in CALCULATION_TYPE_LABELS ? type : "TRAFFIC_INJURY"} size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-brand-text truncate">{title}</span>
          <span className="ui-caption block truncate mt-0.5">
            {label}
            {dateLabel ? ` · ${dateLabel}` : ""}
            {` · ${statusLabel(item.status)}`}
          </span>
        </span>
        <span className="shrink-0 btn-link text-[12px] opacity-80 group-hover:opacity-100">
          Aç <ArrowIcon size={12} />
        </span>
      </button>
      <button
        type="button"
        className="shrink-0 text-[12px] text-red-600 hover:text-red-700 px-2 min-h-[36px]"
        onClick={() => onDelete(item.id)}
        title="Sil"
      >
        Sil
      </button>
    </div>
  );
}

function WorkListRow({ item, onOpen }: { item: DraftSummary; onOpen: (type: CalculationType) => void }) {
  const dateLabel = item.calculationDate
    ? formatDisplayDate(item.calculationDate)
    : item.eventDate
      ? formatDisplayDate(item.eventDate)
      : null;

  return (
    <button type="button" onClick={() => onOpen(item.type)} className="ui-list-row group">
      <span className="ui-module-icon-box !w-9 !h-9">
        <TypeIcon type={item.type} size={16} />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[13px] font-semibold text-brand-text truncate">{item.label}</span>
        <span className="ui-caption block truncate mt-0.5">
          {item.fileName !== "—" ? item.fileName : "Dosya adı girilmemiş"}
          {dateLabel ? ` · ${dateLabel}` : ""}
        </span>
      </span>
      <span className="shrink-0 btn-link text-[12px] opacity-80 group-hover:opacity-100">
        Aç <ArrowIcon size={12} />
      </span>
    </button>
  );
}

function QuickAccessRow({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="ui-list-row">
      <span className="ui-module-icon-box !w-9 !h-9">{icon}</span>
      <span className="flex-1 text-left text-[13px] font-semibold text-brand-text">{label}</span>
      <ArrowIcon size={12} />
    </button>
  );
}

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="ui-empty-state-mock">
      <span className="ui-empty-icon-lg">{icon}</span>
      <p className="ui-empty-title">{title}</p>
      {description && <p className="ui-empty-desc">{description}</p>}
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="btn-outline mt-5">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function CalculationTypeSelect({
  onSelect,
  onOpenSaved,
  onViewAllSaved,
  savedListVersion = 0,
}: {
  onSelect: (type: CalculationType) => void;
  onOpenSaved?: (id: string) => void;
  onViewAllSaved?: () => void;
  savedListVersion?: number;
}) {
  const newCalcRef = useRef<HTMLElement>(null);
  const [savedItems, setSavedItems] = useState<SavedCalculationListItem[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);

  const refreshSaved = () => {
    setSavedLoading(true);
    listSavedCalculations()
      .then((res) => setSavedItems(res.items))
      .catch(() => setSavedItems([]))
      .finally(() => setSavedLoading(false));
  };

  useEffect(() => {
    refreshSaved();
  }, [savedListVersion]);

  const handleDeleteSaved = async (id: string) => {
    if (!window.confirm("Bu kayıtlı dosya silinsin mi?")) return;
    try {
      await deleteSavedCalculation(id);
      refreshSaved();
    } catch {
      // ignore
    }
  };

  const drafts = useMemo(() => scanDrafts(), [savedListVersion]);
  const draftCount = savedItems.filter((item) => item.status === "DRAFT").length;
  const completedCount = savedItems.filter((item) => item.status === "COMPLETED").length;
  const totalSaved = savedItems.length;
  const recentSaved = savedItems.slice(0, 5);
  const lastSavedLabel = savedItems[0]
    ? formatDisplayDate(savedItems[0].updatedAt)
    : "—";

  const scrollToNew = () => {
    newCalcRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="calc-dashboard w-full pb-6">
      <header className="calc-dashboard-hero">
        <h1 className="ui-page-title">Aktüerya Hesaplama</h1>
        <p className="ui-page-subtitle max-w-2xl">
          Trafik ve iş kazası dosyaları için hesaplama modülleri.
        </p>
      </header>

      <section ref={newCalcRef} id="yeni-hesaplama" className="calc-dashboard-main">
        <h2 className="ui-section-title">Hesap Türleri</h2>

        <div className="calc-dashboard-type-grid">
          {TYPES.map((type, index) => {
            const topics = TOPICS[type] ?? [];
            const shown = topics.slice(0, 2);
            const extra = topics.length - shown.length;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onSelect(type)}
                className="calc-dashboard-type-card ui-module-card-mock group motion-reduce:transform-none text-left"
                style={{ animationDelay: `${index * 55}ms` }}
              >
                <div className="flex items-start gap-3.5 sm:gap-4">
                  <span className="ui-module-icon-box">
                    <TypeIcon type={type} size={22} />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="ui-card-title">{CALCULATION_TYPE_LABELS[type]}</h3>
                    <p className="ui-body-text mt-1.5 line-clamp-2">
                      {CALCULATION_TYPE_DESCRIPTIONS[type]}
                    </p>
                  </div>
                </div>

                <div className="ui-module-card-footer">
                  <ul className="flex flex-wrap items-center gap-1.5">
                    {shown.map((t) => (
                      <li key={t} className="ui-tag-mock">
                        {t}
                      </li>
                    ))}
                    {extra > 0 && (
                      <li>
                        <span className="accent-badge-dot">+{extra}</span>
                      </li>
                    )}
                  </ul>
                  <span className="ui-module-start-btn">
                    Başlat
                    <ArrowIcon size={13} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="calc-dashboard-stats">
        <div className="calc-dashboard-stats-grid">
          <StatCard
            label="Toplam Hesaplama"
            value={String(totalSaved)}
            subtitle="Kayıtlı dosyalar"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 7h8M8 11h5M8 15h3" strokeLinecap="round" />
              </svg>
            }
          />
          <StatCard
            label="Taslak Dosya"
            value={String(draftCount)}
            subtitle="Kayıtlı taslaklar"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
                <path d="M14 3v6h6" />
              </svg>
            }
          />
          <StatCard
            label="Tamamlanan Hesaplama"
            value={String(completedCount)}
            subtitle="Kayıtlı tamamlanan"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
          <StatCard
            label="Son Hesaplama Tarihi"
            value={lastSavedLabel}
            subtitle={totalSaved > 0 ? "Son kayıt" : "Hesaplama bulunmuyor"}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
              </svg>
            }
          />
        </div>
      </section>

      <div className="calc-dashboard-panels-grid">
        <PanelSection
          title="Son Çalışmalar"
          className="calc-dashboard-bottom"
          headerAction={
            onViewAllSaved ? (
              <button
                type="button"
                onClick={onViewAllSaved}
                className="shrink-0 btn-link text-[12.5px] font-medium min-h-[36px] px-1"
              >
                Tümünü Gör
              </button>
            ) : undefined
          }
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <path d="M3 7v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2Z" />
            </svg>
          }
        >
          {savedLoading ? (
            <p className="ui-caption text-center py-6">Kayıtlar yükleniyor…</p>
          ) : savedItems.length === 0 ? (
            <EmptyState
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="M3 7v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2Z" />
                </svg>
              }
              title="Henüz kayıtlı çalışma yok"
              description="Abonelik kullanıcıları tamamlanan hesaplamaları kalıcı olarak kaydedebilir."
              actionLabel="Yeni hesaplama başlat"
              onAction={scrollToNew}
            />
          ) : (
            <ul className="calc-dashboard-work-list space-y-0.5">
              {recentSaved.map((item) => (
                <li key={item.id}>
                  <SavedWorkListRow
                    item={item}
                    onOpen={(id) => onOpenSaved?.(id)}
                    onDelete={handleDeleteSaved}
                  />
                </li>
              ))}
            </ul>
          )}
        </PanelSection>

        <PanelSection
          title="Son Taslaklar"
          className="calc-dashboard-bottom"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
              <path d="M14 3v6h6" />
            </svg>
          }
        >
          {drafts.length === 0 ? (
            <EmptyState
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
                  <path d="M14 3v6h6" />
                </svg>
              }
              title="Kayıtlı taslak bulunmuyor"
              description="Başlattığınız hesaplamalar otomatik olarak taslak olarak saklanır."
              actionLabel="Taslak oluştur"
              onAction={scrollToNew}
            />
          ) : (
            <ul className="calc-dashboard-work-list space-y-0.5">
              {drafts.map((item) => (
                <li key={item.type}>
                  <WorkListRow item={item} onOpen={onSelect} />
                </li>
              ))}
            </ul>
          )}
        </PanelSection>

        <PanelSection
          title="Hızlı Erişim"
          className="calc-dashboard-bottom"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" strokeLinejoin="round" />
            </svg>
          }
        >
          {drafts.length === 0 ? (
            <EmptyState
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" strokeLinejoin="round" />
                </svg>
              }
              title="Hızlı erişim bulunmuyor"
              description="Sık kullandığınız modüller burada görünecek."
              actionLabel="Yeni hesaplama"
              onAction={scrollToNew}
            />
          ) : (
            <ul className="space-y-0.5">
              <li>
                <QuickAccessRow
                  label="Yeni hesaplama"
                  onClick={scrollToNew}
                  icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                  }
                />
              </li>
              {drafts.map((item) => (
                <li key={item.type}>
                  <QuickAccessRow label={item.label} onClick={() => onSelect(item.type)} icon={<TypeIcon type={item.type} size={15} />} />
                </li>
              ))}
            </ul>
          )}
        </PanelSection>
      </div>
    </div>
  );
}
