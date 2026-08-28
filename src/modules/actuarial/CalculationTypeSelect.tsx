import { useMemo, useRef, type ReactNode } from "react";
import type { CalculationType } from "./types/calculationDraft";
import { CALCULATION_TYPE_DESCRIPTIONS, CALCULATION_TYPE_LABELS } from "./types/calculationDraft";
import { loadDraftForType } from "./draftStorage";

const TOPICS: Record<CalculationType, string[]> = {
  TRAFFIC_INJURY: ["Taraf bilgileri", "Hesaplama bilgileri", "Kontrol ve ödeme"],
  TRAFFIC_DEATH: ["Müteveffa", "Hak sahipleri", "Destek ilişkileri", "Kusur", "Önceki ödemeler"],
  WORK_INJURY: ["İşçi / işveren", "Ücret", "Kaçınılmazlık", "SGK belgeleri", "Maluliyet"],
  WORK_DEATH: ["Müteveffa işçi", "Hak sahibi", "SGK ölüm geliri", "İşveren kusuru", "PSD belge"],
};

const TYPES: CalculationType[] = ["TRAFFIC_INJURY", "TRAFFIC_DEATH", "WORK_INJURY", "WORK_DEATH"];

const HOVER =
  "transition-[transform,box-shadow,border-color,background-color,color,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none motion-reduce:transform-none";

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
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

function latestDate(dates: string[]): string {
  const valid = dates.filter(Boolean).sort();
  return valid.length > 0 ? valid[valid.length - 1]! : "";
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

function ArrowIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[11px] border border-[#D9E5E3] bg-white shadow-[0_1px_4px_rgba(15,95,99,0.05)] overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-[#D9E5E3] bg-[#FAFCFC] px-4 py-2.5">
        <span className="h-3.5 w-[3px] rounded-full bg-[#0F5F63]" aria-hidden />
        <h2 className="text-[15px] font-medium text-[#22313F] tracking-[-0.01em]">{title}</h2>
      </div>
      <div className="p-2 sm:p-3">{children}</div>
    </section>
  );
}

function StatIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#EAF4F3] text-[#0F5F63]">
      {children}
    </span>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-[10px] border border-[#D9E5E3] bg-[#EAF4F3]/35 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <StatIcon>{icon}</StatIcon>
      </div>
      <p className="mt-2 text-[11.5px] font-normal text-[#6B7280] leading-snug">{label}</p>
      <p className="mt-0.5 text-[14px] font-medium tabular-nums text-[#22313F] tracking-[-0.01em]">{value}</p>
    </div>
  );
}

function WorkListRow({
  item,
  onOpen,
}: {
  item: DraftSummary;
  onOpen: (type: CalculationType) => void;
}) {
  const dateLabel = item.calculationDate
    ? formatDisplayDate(item.calculationDate)
    : item.eventDate
      ? formatDisplayDate(item.eventDate)
      : null;

  return (
    <button
      type="button"
      onClick={() => onOpen(item.type)}
      className={`group flex w-full items-center gap-3 rounded-[10px] border border-transparent px-2 py-2 sm:px-2.5 hover:border-[#D9E5E3] hover:bg-[#EAF4F3]/50 ${HOVER}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#EAF4F3] text-[#0F5F63]">
        <TypeIcon type={item.type} size={16} />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[13px] font-medium text-[#22313F] truncate">{item.label}</span>
        <span className="block text-[12px] font-normal text-[#6B7280] truncate">
          {item.fileName !== "—" ? item.fileName : "Dosya adı girilmemiş"}
          {dateLabel ? ` · ${dateLabel}` : ""}
        </span>
      </span>
      <span className="shrink-0 text-[12px] font-medium text-[#0F5F63] opacity-70 group-hover:opacity-100">
        Aç
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
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-2.5 rounded-[10px] border border-transparent px-2 py-2 hover:border-[#D9E5E3] hover:bg-[#EAF4F3]/50 ${HOVER}`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[#EAF4F3] text-[#0F5F63]">
        {icon}
      </span>
      <span className="flex-1 text-left text-[13px] font-medium text-[#22313F]">{label}</span>
      <ArrowIcon size={11} />
    </button>
  );
}

export function CalculationTypeSelect({
  onSelect,
}: {
  onSelect: (type: CalculationType) => void;
}) {
  const newCalcRef = useRef<HTMLElement>(null);

  const drafts = useMemo(() => scanDrafts(), []);
  const draftCount = drafts.length;
  const lastCalcIso = latestDate(drafts.map((d) => d.calculationDate));
  const lastCalcLabel = lastCalcIso ? formatDisplayDate(lastCalcIso) : "—";

  const scrollToNew = () => {
    newCalcRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="calc-dashboard w-full space-y-3.5 sm:space-y-4 pb-3">
      {/* 1. Page intro */}
      <header className="calc-dashboard-hero pb-0.5">
        <h1 className="text-[21px] sm:text-[22px] font-semibold text-[#22313F] tracking-[-0.02em] leading-tight">
          Aktüerya Hesaplama
        </h1>
        <p className="mt-0.5 text-[12px] font-normal text-[#6B7280]">
          Trafik ve iş kazası dosyaları
        </p>
      </header>

      {/* 2. Primary focus: 4 calculation type cards */}
      <section ref={newCalcRef} id="yeni-hesaplama" className="calc-dashboard-main">
        <div className="mb-2.5 sm:mb-3 flex items-center justify-between gap-2">
          <h2 className="text-[15px] sm:text-[16px] font-medium text-[#22313F] tracking-[-0.01em]">
            Hesap Türleri
          </h2>
          <button
            type="button"
            onClick={scrollToNew}
            className={`shrink-0 inline-flex items-center justify-center min-h-[30px] px-3 rounded-[9px] border border-[#D9E5E3] bg-white text-[12.5px] font-medium text-[#0F5F63] hover:border-[#0F5F63]/30 hover:bg-[#EAF4F3] sm:hidden ${HOVER}`}
          >
            Yeni
          </button>
        </div>

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
                className={`calc-dashboard-type-card group relative flex flex-col overflow-hidden text-left rounded-[11px] border border-[#D9E5E3] bg-gradient-to-br from-[#FAFDFD] to-[#F3F8F7] p-4 sm:p-[18px] min-h-[158px] sm:min-h-[166px] shadow-[0_2px_6px_rgba(15,95,99,0.06)] hover:-translate-y-0.5 hover:border-[#0F5F63] hover:shadow-[0_6px_16px_rgba(15,95,99,0.1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5F63]/25 ${HOVER}`}
                style={{ animationDelay: `${index * 55}ms` }}
              >
                <span
                  className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0F5F63] opacity-70 group-hover:opacity-100"
                  aria-hidden
                />
                <span
                  className="absolute top-0 left-0 right-0 h-[2px] bg-[#0F5F63]/20 group-hover:bg-[#0F5F63]/40"
                  aria-hidden
                />

                <div className="flex items-start gap-3 pl-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#EAF4F3] text-[#0F5F63] ring-1 ring-[#0F5F63]/10">
                    <TypeIcon type={type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14px] sm:text-[15px] font-medium text-[#22313F] leading-snug tracking-[-0.01em] group-hover:text-[#0B474A]">
                      {CALCULATION_TYPE_LABELS[type]}
                    </h3>
                    <p className="mt-1 text-[12.5px] sm:text-[13px] font-normal text-[#6B7280] leading-snug line-clamp-2">
                      {CALCULATION_TYPE_DESCRIPTIONS[type]}
                    </p>
                  </div>
                </div>

                <ul className="mt-3 pl-1 flex flex-wrap gap-1">
                  {shown.map((t) => (
                    <li
                      key={t}
                      className="inline-flex rounded-full border border-[#D9E5E3] bg-[#EAF4F3]/60 px-2 py-0.5 text-[11px] font-normal text-[#0F5F63]/80"
                    >
                      {t}
                    </li>
                  ))}
                  {extra > 0 && (
                    <li className="inline-flex rounded-full border border-[#D9E5E3] bg-white/70 px-2 py-0.5 text-[11px] font-normal text-[#6B7280]">
                      +{extra}
                    </li>
                  )}
                </ul>

                <span className="mt-auto pt-3 pl-1 flex justify-end">
                  <span className="inline-flex items-center gap-1 min-h-[30px] px-3 rounded-[8px] bg-[#0F5F63] text-white text-[12.5px] font-medium shadow-[0_1px_4px_rgba(15,95,99,0.28)] group-hover:bg-[#0B474A] group-hover:shadow-[0_2px_8px_rgba(11,71,74,0.32)]">
                    Başlat
                    <ArrowIcon />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Secondary summary stats */}
      <div className="calc-dashboard-stats calc-dashboard-stats-grid">
        <StatCard
          label="Toplam Hesaplama"
          value="—"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <path d="M4 7h16M4 12h10M4 17h6" strokeLinecap="round" />
            </svg>
          }
        />
        <StatCard
          label="Taslak Dosya"
          value={draftCount > 0 ? String(draftCount) : "—"}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
              <path d="M14 3v6h6" />
            </svg>
          }
        />
        <StatCard
          label="Tamamlanan Hesaplama"
          value="—"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <StatCard
          label="Son Hesaplama Tarihi"
          value={lastCalcLabel}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
            </svg>
          }
        />
      </div>

      {/* 4. Recent work */}
      <Panel title="Son Çalışmalar" className="calc-dashboard-side">
        {drafts.length === 0 ? (
          <div className="text-center py-5 px-2">
            <p className="text-[13px] font-normal text-[#6B7280]">Henüz kayıtlı çalışma yok</p>
            <button
              type="button"
              onClick={scrollToNew}
              className="mt-2.5 text-[12.5px] font-medium text-[#0F5F63] hover:text-[#0B474A] underline-offset-2 hover:underline"
            >
              Yeni hesaplama başlat
            </button>
          </div>
        ) : (
          <ul className="calc-dashboard-work-list divide-y divide-[#D9E5E3]/70 xl:divide-y-0">
            {drafts.map((item) => (
              <li key={item.type}>
                <WorkListRow item={item} onOpen={onSelect} />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* 5. Bottom row */}
      <div className="calc-dashboard-panels-grid">
        <Panel title="Son Taslaklar" className="calc-dashboard-bottom">
          {drafts.length === 0 ? (
            <p className="px-2 py-1.5 text-[12.5px] font-normal text-[#6B7280]">Kayıtlı taslak bulunmuyor.</p>
          ) : (
            <ul className="calc-dashboard-work-list divide-y divide-[#D9E5E3]/70 xl:divide-y-0">
              {drafts.map((item) => (
                <li key={item.type}>
                  <WorkListRow item={item} onOpen={onSelect} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Hızlı Erişim" className="calc-dashboard-bottom">
          <ul className="space-y-0.5">
            <li>
              <QuickAccessRow
                label="Yeni hesaplama"
                onClick={scrollToNew}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                }
              />
            </li>
            {draftCount > 0 && (
              <li>
                <div className="flex items-center gap-2.5 px-2 pt-2 pb-1">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[#EAF4F3]/60 text-[#0F5F63]/70">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
                    </svg>
                  </span>
                  <span className="text-[11.5px] font-normal uppercase tracking-wide text-[#6B7280]">Taslaklar</span>
                </div>
                <ul className="space-y-0.5">
                  {drafts.map((item) => (
                    <li key={item.type}>
                      <QuickAccessRow
                        label={item.label}
                        onClick={() => onSelect(item.type)}
                        icon={<TypeIcon type={item.type} size={14} />}
                      />
                    </li>
                  ))}
                </ul>
              </li>
            )}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
