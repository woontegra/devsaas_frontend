import type { StepProps } from "./wizardTypes";
import { DataTableWrap, FormField, FormSection, TextSelect, TextTextarea } from "./FormPrimitives";
import { formatDateIso } from "../../utils/formatDisplay";
import {
  MARRIAGE_CHILD_COUNT_MAX,
  MARRIAGE_CHILD_RATE_POINTS,
  MARRIAGE_PROBABILITY_BANDS,
  genderLabel,
  resolveMarriageProbabilityPreview,
  type MarriageProbabilityPreview,
} from "../../utils/marriageProbability";

const childOptions = Array.from({ length: MARRIAGE_CHILD_COUNT_MAX + 1 }, (_, n) => n);

export function MarriageProbabilityStep({ draft, onChange }: StepProps) {
  if (draft.calculationType !== "TRAFFIC_DEATH") return null;
  const marriage = draft.marriageProbabilityDeduction ?? { under18ChildCount: 0, note: "" };
  const preview = resolveMarriageProbabilityPreview({ ...draft, marriageProbabilityDeduction: marriage });
  const note = marriage.note ?? "";

  const setChildCount = (under18ChildCount: number) => {
    onChange({
      ...draft,
      marriageProbabilityDeduction: { ...marriage, under18ChildCount },
    });
  };

  const calculatedChildReduction = preview.under18ChildCount * MARRIAGE_CHILD_RATE_POINTS;
  const belowFloor = preview.applied && preview.baseMarriageProbabilityRate < calculatedChildReduction;

  return (
    <div className="space-y-5">
      <FormSection title="Evlenme İhtimali Bilgileri" description="Hak sahipleri arasındaki eş kaydından okunur.">
        {preview.status === "NO_SPOUSE" ? (
          <p className="text-[13px] leading-relaxed text-[#66727F]">{preview.infoMessage}</p>
        ) : (
          <DataTableWrap>
            <table className={`${gridCls.table} min-w-[760px]`}>
              <thead>
                <tr>
                  {["Hak Sahibi", "Cinsiyet", "Doğum Tarihi", "Hesap Tarihi", "Hesap Tarihindeki Yaş", "Yaş Aralığı", "Baz Oran"].map(
                    (label) => (
                      <th key={label} className={gridCls.th}>
                        {label}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={`${gridCls.td} font-semibold`}>{`${preview.spouseName || "Eş"} (Eş)`}</td>
                  <td className={gridCls.td}>{genderLabel(preview.spouseGender)}</td>
                  <td className={gridCls.td}>{formatDateIso(preview.spouseBirthDate)}</td>
                  <td className={gridCls.td}>{formatDateIso(preview.calculationDate)}</td>
                  <td className={gridCls.td}>{calendarAgeText(preview)}</td>
                  <td className={gridCls.td}>{preview.spouseAgeRangeKey ?? "—"}</td>
                  <td className={`${gridCls.td} font-semibold`}>
                    {preview.applied ? `%${preview.baseMarriageProbabilityRate}` : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </DataTableWrap>
        )}
        {preview.infoMessage && preview.status !== "NO_SPOUSE" ? (
          <p className="text-[13px] leading-relaxed text-[#8A5A12]">{preview.infoMessage}</p>
        ) : null}
      </FormSection>

      <FormSection
        title="Evlenme İhtimali İndirimi Hesabı"
        description="Her 18 yaş altı çocuk için evlenme ihtimali oranından %5 indirim uygulanır."
      >
        <DataTableWrap>
          <table className={`${gridCls.table} min-w-[600px]`}>
            <thead>
              <tr>
                {[
                  "18 Yaş Altı Çocuk Sayısı",
                  "Çocuk Başına İndirim",
                  "Hesaplanan Çocuk İndirimi",
                  "Uygulanan Çocuk İndirimi",
                  "Nihai Evlenme İhtimali Oranı",
                ].map(
                  (label) => (
                    <th key={label} className={`${gridCls.th} !whitespace-normal leading-snug`}>
                      {label}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={`${gridCls.td} py-1.5`}>
                  <div className="max-w-[120px]">
                    <TextSelect
                      aria-label="18 Yaş Altı Çocuk Sayısı"
                      value={String(preview.under18ChildCount)}
                      onChange={(e) => setChildCount(Number(e.target.value))}
                      disabled={preview.status === "NO_SPOUSE"}
                    >
                      {childOptions.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </TextSelect>
                  </div>
                </td>
                <td className={gridCls.td}>%{MARRIAGE_CHILD_RATE_POINTS}</td>
                <td className={gridCls.td}>%{calculatedChildReduction}</td>
                <td className={`${gridCls.td} font-semibold`}>%{preview.childReductionRate}</td>
                <td className={`${gridCls.td} font-semibold`}>%{preview.finalMarriageProbabilityRate}</td>
              </tr>
            </tbody>
          </table>
        </DataTableWrap>
        {preview.applied ? (
          <div>
            <p className="text-[13.5px] font-semibold text-[#1F2933] tabular-nums">
              {belowFloor
                ? `%${preview.baseMarriageProbabilityRate} − %${preview.childReductionRate} = %${preview.finalMarriageProbabilityRate}`
                : `%${preview.baseMarriageProbabilityRate} − (${preview.under18ChildCount} × %${MARRIAGE_CHILD_RATE_POINTS}) = %${preview.finalMarriageProbabilityRate}`}
              {belowFloor ? <span className="ml-2 text-[12px] font-normal text-[#66727F]">Alt sınır %0</span> : null}
            </p>
            {belowFloor ? (
              <p className="text-[12px] text-[#66727F] tabular-nums">
                Hesaplanan çocuk indirimi %{calculatedChildReduction}, uygulanabilecek azami indirim %
                {preview.baseMarriageProbabilityRate}
              </p>
            ) : null}
          </div>
        ) : null}
        {preview.suggestedUnder18ChildCount !== preview.under18ChildCount ? (
          <button
            type="button"
            className="text-[12.5px] font-semibold text-[#243746] underline underline-offset-2"
            onClick={() => setChildCount(preview.suggestedUnder18ChildCount)}
          >
            Hak sahiplerinden önerilen sayıyı kullan ({preview.suggestedUnder18ChildCount})
          </button>
        ) : (
          <p className="text-[12px] text-[#66727F]">
            Hak sahiplerindeki 18 yaş altı çocuk önerisi: {preview.suggestedUnder18ChildCount}. Kayıtlı değer esas alınır.
          </p>
        )}
        <FormField label="Not">
          <TextTextarea
            value={note}
            onChange={(e) =>
              onChange({
                ...draft,
                marriageProbabilityDeduction: { ...marriage, note: e.target.value },
              })
            }
            placeholder="İsteğe bağlı not"
          />
        </FormField>
      </FormSection>

      <FormSection
        title="AYİM Evlenme İhtimali Oran Tablosu"
        description="Referans amaçlıdır. Yaş, hesap tarihindeki tam yaştır; eşin aralığı vurgulanır."
      >
        <DataTableWrap className="max-w-[520px]">
          <table className={gridCls.table}>
            <thead>
              <tr>
                <th className={gridCls.th}>Yaş Aralığı</th>
                <th className={gridCls.th}>Kadın</th>
                <th className={gridCls.th}>Erkek</th>
              </tr>
            </thead>
            <tbody>
              {MARRIAGE_PROBABILITY_BANDS.map((band) => {
                const active = preview.spouseAgeRangeKey === band.key;
                const rowCls = active ? "bg-[#EEF2F4] font-semibold" : "";
                return (
                  <tr key={band.key} className={rowCls}>
                    <td className={gridCls.td}>{band.key}</td>
                    <td className={gridCls.td}>%{band.female}</td>
                    <td className={gridCls.td}>%{band.male}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </DataTableWrap>
      </FormSection>
    </div>
  );
}

const gridCls = {
  table: "w-full border-collapse text-[13px]",
  th: "border-b border-r last:border-r-0 border-brand-border bg-brand-bg px-3 py-2 text-left text-[12px] font-semibold text-brand-text whitespace-nowrap",
  td: "border-b border-r last:border-r-0 border-brand-border/80 px-3 py-2 text-brand-text tabular-nums whitespace-nowrap",
} as const;

function calendarAgeText(preview: MarriageProbabilityPreview): string {
  const ymd = preview.spouseAgeYmd;
  if (ymd) return `${ymd.years} yıl ${ymd.months} ay ${ymd.days} gün`;
  return preview.spouseAgeAtCalculationDate == null ? "—" : `${preview.spouseAgeAtCalculationDate} yaş`;
}

export function EducationExpenseStep({ draft, onChange }: StepProps) {
  if (draft.calculationType !== "TRAFFIC_DEATH") return null;
  return (
    <FormSection
      title="Eğitim Gideri İndirimi"
      description="Eğitim gideri indirimi oranı bu sürümde henüz hesaplanmaz. Notlarınız kayda alınır; parasal sonuca etkisi yoktur."
    >
      <FormField label="Not" hint="Bu alan sonraki hesap kuralı için saklanır. Şimdilik tutar üretmez.">
        <TextTextarea
          value={draft.educationExpenseDeduction?.notes ?? ""}
          onChange={(e) =>
            onChange({
              ...draft,
              educationExpenseDeduction: { notes: e.target.value },
            })
          }
          placeholder="Eğitim gideri ile ilgili not"
        />
      </FormField>
    </FormSection>
  );
}