import type { DefendantType } from "../../types/calculationDraft";

export const TRAFFIC_RESPONSIBLE_OPTIONS: {
  type: DefendantType;
  title: string;
  description: string;
}[] = [
  {
    type: "INDIVIDUAL_DRIVER",
    title: "Gerçek Kişi Şoför",
    description: "Kazaya karışan aracı kullanan kişi",
  },
  {
    type: "INDIVIDUAL_VEHICLE_OWNER",
    title: "Gerçek Kişi Araç sahibi",
    description: "Aracın gerçek kişi maliki",
  },
  {
    type: "CORPORATE_VEHICLE_OWNER",
    title: "Tüzel Kişi Araç sahibi",
    description: "Aracın şirket veya kurum adına kayıtlı maliki",
  },
];

export const TRAFFIC_INSURER_OPTIONS: {
  type: DefendantType;
  title: string;
  description: string;
}[] = [
  {
    type: "COMPULSORY_TRAFFIC_INSURER",
    title: "Sigorta şirketi (ZMTS)",
    description: "Zorunlu mali sorumluluk sigortacısı",
  },
  {
    type: "CASCO_INSURER",
    title: "Sigorta şirketi (Kasko Şirketi)",
    description: "Kasko poliçesini düzenleyen sigorta şirketi",
  },
];

export function DefendantTypeToggleList({
  options,
  selectedTypes,
  onToggle,
}: {
  options: Array<{ type: DefendantType; title: string; description: string }>;
  selectedTypes: ReadonlySet<DefendantType>;
  onToggle: (type: DefendantType) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2.5">
      {options.map((opt) => {
        const selected = selectedTypes.has(opt.type);
        return (
          <button
            key={opt.type}
            type="button"
            onClick={() => onToggle(opt.type)}
            className={`w-full rounded-[12px] border px-3.5 py-3 text-left flex items-center justify-between gap-4 min-h-[52px] transition-colors ${
              selected
                ? "border-blue-800/70 bg-blue-50/50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
            aria-pressed={selected}
          >
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-slate-800">{opt.title}</span>
              <span className="block text-[12px] font-normal text-slate-500 mt-0.5">
                {opt.description}
              </span>
            </span>
            <span
              className={`h-5 w-5 shrink-0 rounded-[6px] border flex items-center justify-center text-[11px] ${
                selected
                  ? "border-blue-800 bg-blue-800 text-white"
                  : "border-slate-300 bg-white text-transparent"
              }`}
              aria-hidden
            >
              ✓
            </span>
          </button>
        );
      })}
    </div>
  );
}
