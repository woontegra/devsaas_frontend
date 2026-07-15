import type { CalculationType } from "./types/calculationDraft";
import { CALCULATION_TYPE_DESCRIPTIONS, CALCULATION_TYPE_LABELS } from "./types/calculationDraft";

const TOPICS: Record<CalculationType, string[]> = {
  TRAFFIC_INJURY: ["Taraf bilgileri", "Hesaplama bilgileri", "Kontrol ve ödeme"],
  TRAFFIC_DEATH: ["Müteveffa", "Hak sahipleri", "Destek ilişkileri", "Kusur", "Önceki ödemeler"],
  WORK_INJURY: ["İşçi / işveren", "Ücret", "Kaçınılmazlık", "SGK belgeleri", "Maluliyet"],
  WORK_DEATH: ["Müteveffa işçi", "Hak sahipleri", "SGK ölüm gelirleri", "İşveren kusuru", "PSD belge"],
};

const TYPES: CalculationType[] = ["TRAFFIC_INJURY", "TRAFFIC_DEATH", "WORK_INJURY", "WORK_DEATH"];

function TypeIcon({ type }: { type: CalculationType }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
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
        <path d="M8.5 15.2c.4-1.2 1.4-1.8 2.7-1.8s2.3.6 2.7 1.8" />
      </svg>
    );
  }
  if (type === "WORK_INJURY") {
    return (
      <svg {...common} aria-hidden>
        <path d="M8 10h8l1 3v2H7v-2l1-3Z" />
        <path d="M9 10V8.5A3 3 0 0 1 12 5.5 3 3 0 0 1 15 8.5V10" />
        <path d="M12 14.5v2m-1.5-1h3" />
        <path d="M6 18h12" />
      </svg>
    );
  }
  return (
    <svg {...common} aria-hidden>
      <path d="M8 10h8l1 3v2H7v-2l1-3Z" />
      <path d="M9 10V8.5A3 3 0 0 1 12 5.5 3 3 0 0 1 15 8.5V10" />
      <path d="M8.5 18.5c.5-1.3 1.6-2 3.5-2s3 .7 3.5 2" />
      <circle cx="9" cy="16.5" r="1" />
      <circle cx="15" cy="16.5" r="1" />
    </svg>
  );
}

export function CalculationTypeSelect({
  onSelect,
}: {
  onSelect: (type: CalculationType) => void;
}) {
  return (
    <div className="py-2 sm:py-4 lg:py-6">
      <div className="mb-5 sm:mb-8 max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-slate-400 mb-1.5">
          Yeni dosya
        </p>
        <h1 className="text-[22px] sm:text-[24px] lg:text-[25px] font-semibold text-slate-800 tracking-tight leading-snug">
          Hesap türünü seçin
        </h1>
        <p className="mt-2 text-[13px] sm:text-[14px] font-normal text-slate-500 leading-relaxed">
          Her hesap türü kendi adımlarına ve alanlarına sahiptir. Bu aşamada yalnızca veri girişi ve
          doğrulama yapılır; aktüeryal sonuç ödeme sonrası üretilecektir.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
        {TYPES.map((type) => {
          const topics = TOPICS[type] ?? [];
          const shown = topics.slice(0, 3);
          const extra = topics.length - shown.length;
          return (
            <article
              key={type}
              className="group rounded-[14px] border border-slate-200/90 bg-white p-[18px] sm:p-6 lg:p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-blue-300 hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 transition-all flex flex-col"
            >
              <div className="flex items-start justify-between gap-3 mb-3.5">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-[12px] bg-blue-900 text-white flex items-center justify-center">
                  <TypeIcon type={type} />
                </div>
                <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-500">
                  Veri girişi hazır
                </span>
              </div>
              <h2 className="text-[17px] sm:text-[18px] font-semibold text-slate-800">
                {CALCULATION_TYPE_LABELS[type]}
              </h2>
              <p className="mt-1.5 text-[13px] font-normal text-slate-500 leading-relaxed flex-1 line-clamp-3 sm:line-clamp-none">
                {CALCULATION_TYPE_DESCRIPTIONS[type]}
              </p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {shown.map((t) => (
                  <li
                    key={t}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-900/80 border border-blue-100"
                  >
                    {t}
                  </li>
                ))}
                {extra > 0 && (
                  <li className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
                    +{extra} özellik
                  </li>
                )}
              </ul>
              <p className="mt-3 text-[12px] font-normal text-slate-400">
                Sonuç motoru sonraki aşamada bağlanacak
              </p>
              <button
                type="button"
                onClick={() => onSelect(type)}
                className="btn-primary mt-4 w-full min-h-[44px]"
              >
                Bu hesapla devam et
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
