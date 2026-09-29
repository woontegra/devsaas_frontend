import type { TrafficDeathSharePrinciplesContent } from "./buildTrafficDeathSharePrinciples";

export function TrafficDeathSharePrinciplesCard({
  content,
}: {
  content: TrafficDeathSharePrinciplesContent;
}) {
  return (
    <section className="ui-form-section">
      <div className="mb-3 pb-2.5 border-b border-brand-border flex items-start gap-2.5">
        <span className="ui-card-header-mark mt-1" aria-hidden />
        <h3 className="text-[15px] sm:text-[16px] font-semibold text-brand-text tracking-[-0.01em] leading-snug">
          Paylaştırma Esasları
        </h3>
      </div>

      <div className="rounded-[10px] border border-[#DCE3E8] bg-[#F8FAFB] px-3.5 py-3 space-y-2.5">
        <p className="text-[12.5px] leading-relaxed text-[#1F2933]">{content.intro}</p>

        {content.paragraphs.map((p, i) => (
          <p key={i} className="text-[12.5px] leading-relaxed text-[#1F2933]">
            {p}
          </p>
        ))}

        {content.periodNotes.length > 0 && (
          <div className="pt-1.5 mt-1 border-t border-[#DCE3E8]">
            <h4 className="text-[12px] font-semibold text-[#243746] mb-1.5 tracking-wide">
              Dönem Geçişleri
            </h4>
            <ul className="space-y-1.5">
              {content.periodNotes.map((note) => (
                <li key={`${note.startDate}-${note.endDate}`} className="text-[12px] leading-snug">
                  <span className="font-semibold text-[#243746] tabular-nums">{note.rangeLabel}</span>
                  <span className="text-[#66727F]"> — </span>
                  <span className="text-[#1F2933]">{note.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
