import type { StepProps } from "./wizardTypes";
import { DataTableWrap, FormField, FormSection, TextSelect, TextTextarea } from "./FormPrimitives";
import { formatDateIso, formatKn8, formatMoney } from "../../utils/formatDisplay";
import {
  MARRIAGE_CHILD_COUNT_MAX,
  MARRIAGE_CHILD_RATE_POINTS,
  MARRIAGE_PROBABILITY_BANDS,
  genderLabel,
  resolveMarriageProbabilityPreview,
  type MarriageProbabilityPreview,
} from "../../utils/marriageProbability";
import { resolveEducationExpensePreview } from "../../utils/educationExpenseDeduction";

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
  const education = draft.educationExpenseDeduction ?? { notes: "", educationEndDate: "" };
  const eventDate = draft.common.eventDate?.trim() || "";
  const calculationDate = draft.common.calculationDate?.trim() || "";
  const preview = resolveEducationExpensePreview({
    ...draft,
    educationExpenseDeduction: education,
  });

  const patchEducation = (partial: Partial<typeof education>) => {
    onChange({
      ...draft,
      educationExpenseDeduction: { ...education, ...partial },
    });
  };

  const fatherName = preview.father?.claimantName.toLocaleUpperCase("tr-TR") ?? null;
  const motherName = preview.mother?.claimantName.toLocaleUpperCase("tr-TR") ?? null;
  const hasReady =
    preview.status === "READY" &&
    (preview.pastPeriods.length > 0 || preview.futurePeriods.length > 0);

  return (
    <div className="space-y-5">
      <FormSection title="Eğitim Gideri İndirimi">
        <div className="td-edu-info">
          İşlemiş dönem tarihsel net asgari ücretle; işleyecek dönem mevcut %10 artış / %10 iskonto (KN)
          motoruyla hesaplanır. Çalışma ve Gelir ücreti kullanılmaz.
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Kaza Tarihi" hint="İşlemiş dönem başlangıcı — dosya olay tarihinden.">
            <input type="date" value={eventDate} disabled className="ui-input w-full" />
          </FormField>
          <FormField label="Hesap Tarihi" hint="İşlemiş / işleyecek ayrım sınırı — dosya hesap tarihinden.">
            <input type="date" value={calculationDate} disabled className="ui-input w-full" />
          </FormField>
          <FormField
            label="Öğrenimin Bitirileceği Tarih"
            hint="İşleyecek dönem bitişi. Kaza tarihinden önce olamaz."
          >
            <input
              type="date"
              value={education.educationEndDate ?? ""}
              min={eventDate || undefined}
              onChange={(e) => patchEducation({ educationEndDate: e.target.value })}
              className="ui-input w-full"
            />
          </FormField>
        </div>
        {preview.status === "INVALID_RANGE" ? (
          <p className="text-[12.5px] text-[#C0392B]">
            Öğrenimin bitirileceği tarih kaza tarihinden önce olamaz (veya kaza/hesap tarihi geçersiz).
          </p>
        ) : null}
        {preview.status === "NO_PARENTS" ? (
          <p className="text-[12.5px] text-amber-800">
            Yetiştirme gideri için dosyada Anne veya Baba hak sahibi bulunamadı.
          </p>
        ) : null}
        {preview.status === "NO_MIN_WAGE" ? (
          <p className="text-[12.5px] text-amber-800">
            Seçilen tarih aralığı için tanımlı net asgari ücret dönemi bulunamadı.
          </p>
        ) : null}
        <FormField label="Not" hint="İsteğe bağlı. Hesap tutarını etkilemez.">
          <TextTextarea
            value={education.notes ?? ""}
            onChange={(e) => patchEducation({ notes: e.target.value })}
            placeholder="Eğitim gideri ile ilgili not"
          />
        </FormField>
      </FormSection>

      {hasReady ? (
        <FormSection title="Yetiştirme Gideri Hesabı">
          {preview.pastPeriods.length > 0 ? (
            <div className="space-y-2">
              <div className="td-period-banner td-period-banner--past">
                <div>
                  <span className="td-period-banner-title">İŞLEMİŞ DÖNEM</span>
                  <span className="td-period-banner-range">
                    {formatDateIso(preview.startDate)} – {formatDateIso(preview.calculationDate)}
                  </span>
                </div>
                <div className="td-period-pills">
                  <span className="td-pill">
                    <span>Dönem</span>
                    {formatMoney(preview.pastPeriodExpenseTotal)} TL
                  </span>
                  {preview.father ? (
                    <span className="td-pill">
                      <span>Baba</span>
                      {formatMoney(preview.fatherPastTotal)} TL
                    </span>
                  ) : null}
                  {preview.mother ? (
                    <span className="td-pill">
                      <span>Anne</span>
                      {formatMoney(preview.motherPastTotal)} TL
                    </span>
                  ) : null}
                </div>
              </div>
              <DataTableWrap className="td-table-wrap">
                <table className="td-table min-w-[980px]">
                  <thead>
                    <tr>
                      <th className="!whitespace-normal leading-snug">YILLAR</th>
                      <th className="!whitespace-normal leading-snug">ASGARİ ÜCRET</th>
                      <th className="!whitespace-normal leading-snug">GÜNLÜK ÜCRET</th>
                      <th>GÜN</th>
                      <th className="!whitespace-normal leading-snug">DÖNEM GİDERİ</th>
                      <th className="!whitespace-normal leading-snug">
                        YETİŞTİRME GİDERİ
                        <br />
                        PAY ORANI %
                      </th>
                      {fatherName ? (
                        <th className="!whitespace-normal leading-snug">
                          {fatherName}
                          <br />
                          YETİŞTİRME GİDERİ
                        </th>
                      ) : null}
                      {motherName ? (
                        <th className="!whitespace-normal leading-snug">
                          {motherName}
                          <br />
                          YETİŞTİRME GİDERİ
                        </th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.pastPeriods.map((row) => (
                      <tr key={`past_${row.startDate}_${row.endDate}`}>
                        <td>
                          {formatDateIso(row.startDate)} – {formatDateIso(row.endDate)}
                        </td>
                        <td className="td-num">{formatMoney(row.netMinWage)}</td>
                        <td className="td-num">{formatMoney(row.dailyWage)}</td>
                        <td className="td-num">{row.dayCount}</td>
                        <td className="td-num">{formatMoney(row.periodExpense)}</td>
                        <td className="td-num">%{(row.shareRate * 100).toFixed(0)}</td>
                        {preview.father ? (
                          <td className="td-num">{formatMoney(row.fatherRearingExpense)}</td>
                        ) : null}
                        {preview.mother ? (
                          <td className="td-num">{formatMoney(row.motherRearingExpense)}</td>
                        ) : null}
                      </tr>
                    ))}
                    <tr className="td-table-total">
                      <td colSpan={4}>İŞLEMİŞ TOPLAM</td>
                      <td className="td-num">{formatMoney(preview.pastPeriodExpenseTotal)}</td>
                      <td>—</td>
                      {preview.father ? (
                        <td className="td-num">{formatMoney(preview.fatherPastTotal)}</td>
                      ) : null}
                      {preview.mother ? (
                        <td className="td-num">{formatMoney(preview.motherPastTotal)}</td>
                      ) : null}
                    </tr>
                  </tbody>
                </table>
              </DataTableWrap>
            </div>
          ) : null}

          {preview.futurePeriods.length > 0 ? (
            <div className="space-y-2 pt-3">
              <div className="td-period-banner td-period-banner--future">
                <div>
                  <span className="td-period-banner-title">İŞLEYECEK DÖNEM</span>
                  <span className="td-period-banner-range">
                    {formatDateIso(preview.futurePeriods[0]?.startDate)} –{" "}
                    {formatDateIso(preview.endDate)}
                    {preview.futureBaseNetMinWage != null
                      ? ` · Baz net asgari ücret: ${formatMoney(preview.futureBaseNetMinWage)}`
                      : ""}
                  </span>
                </div>
                <div className="td-period-pills">
                  <span className="td-pill">
                    <span>Dönem</span>
                    {formatMoney(preview.futurePeriodExpenseTotal)} TL
                  </span>
                  {preview.father ? (
                    <span className="td-pill">
                      <span>Baba</span>
                      {formatMoney(preview.fatherFutureTotal)} TL
                    </span>
                  ) : null}
                  {preview.mother ? (
                    <span className="td-pill">
                      <span>Anne</span>
                      {formatMoney(preview.motherFutureTotal)} TL
                    </span>
                  ) : null}
                </div>
              </div>
              <DataTableWrap className="td-table-wrap">
                <table className="td-table min-w-[1100px]">
                  <thead>
                    <tr>
                      <th className="!whitespace-normal leading-snug">YILLAR</th>
                      <th>GÜN</th>
                      <th className="!whitespace-normal leading-snug">GÜNLÜK ÜCRET</th>
                      <th className="!whitespace-normal leading-snug">
                        ÇARPAN
                        <br />
                        KN
                      </th>
                      <th className="!whitespace-normal leading-snug">
                        ÇARPAN
                        <br />
                        (1/KN)
                      </th>
                      <th className="!whitespace-normal leading-snug">
                        ARTIRILMIŞ
                        <br />
                        GİDER
                      </th>
                      <th className="!whitespace-normal leading-snug">
                        İSKONTOLU
                        <br />
                        DÖNEM GİDERİ
                      </th>
                      <th className="!whitespace-normal leading-snug">
                        PAY
                        <br />
                        %
                      </th>
                      {fatherName ? (
                        <th className="!whitespace-normal leading-snug">
                          {fatherName}
                          <br />
                          YETİŞTİRME GİDERİ
                        </th>
                      ) : null}
                      {motherName ? (
                        <th className="!whitespace-normal leading-snug">
                          {motherName}
                          <br />
                          YETİŞTİRME GİDERİ
                        </th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.futurePeriods.map((row) => (
                      <tr key={`future_${row.startDate}_${row.endDate}`}>
                        <td>
                          {formatDateIso(row.startDate)} – {formatDateIso(row.endDate)}
                        </td>
                        <td className="td-num">{row.dayCount}</td>
                        <td className="td-num">{formatMoney(row.dailyWage)}</td>
                        <td className="td-num">{formatKn8(row.kn)}</td>
                        <td className="td-num">{formatKn8(row.discountFactor)}</td>
                        <td className="td-num">{formatMoney(row.increasedExpense)}</td>
                        <td className="td-num">{formatMoney(row.discountedExpense)}</td>
                        <td className="td-num">%{(row.shareRate * 100).toFixed(0)}</td>
                        {preview.father ? (
                          <td className="td-num">{formatMoney(row.fatherRearingExpense)}</td>
                        ) : null}
                        {preview.mother ? (
                          <td className="td-num">{formatMoney(row.motherRearingExpense)}</td>
                        ) : null}
                      </tr>
                    ))}
                    <tr className="td-table-total td-table-total-future">
                      <td colSpan={6}>İŞLEYECEK TOPLAM</td>
                      <td className="td-num">{formatMoney(preview.futurePeriodExpenseTotal)}</td>
                      <td>—</td>
                      {preview.father ? (
                        <td className="td-num">{formatMoney(preview.fatherFutureTotal)}</td>
                      ) : null}
                      {preview.mother ? (
                        <td className="td-num">{formatMoney(preview.motherFutureTotal)}</td>
                      ) : null}
                    </tr>
                  </tbody>
                </table>
              </DataTableWrap>
            </div>
          ) : null}

          <DataTableWrap className="td-table-wrap">
            <table className="td-table mt-3 min-w-[640px]">
              <thead>
                <tr>
                  <th>ÖZET</th>
                  {preview.father ? <th>{fatherName} YETİŞTİRME GİDERİ</th> : null}
                  {preview.mother ? <th>{motherName} YETİŞTİRME GİDERİ</th> : null}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>İşlemiş Dönem</td>
                  {preview.father ? (
                    <td className="td-num">{formatMoney(preview.fatherPastTotal)}</td>
                  ) : null}
                  {preview.mother ? (
                    <td className="td-num">{formatMoney(preview.motherPastTotal)}</td>
                  ) : null}
                </tr>
                <tr>
                  <td>İşleyecek Dönem</td>
                  {preview.father ? (
                    <td className="td-num">{formatMoney(preview.fatherFutureTotal)}</td>
                  ) : null}
                  {preview.mother ? (
                    <td className="td-num">{formatMoney(preview.motherFutureTotal)}</td>
                  ) : null}
                </tr>
                <tr className="td-table-total">
                  <td>Toplam Yetiştirme Gideri</td>
                  {preview.father ? (
                    <td className="td-num">{formatMoney(preview.fatherTotal)}</td>
                  ) : null}
                  {preview.mother ? (
                    <td className="td-num">{formatMoney(preview.motherTotal)}</td>
                  ) : null}
                </tr>
              </tbody>
            </table>
          </DataTableWrap>
          <p className="px-1 pt-2 text-[12px] leading-relaxed text-[#66727F]">
            Bu tutarlar yetiştirme gideri breakdown’ı olarak üretilir; nihai zarara bu sürümde otomatik
            mahsup edilmez.
          </p>
        </FormSection>
      ) : null}
    </div>
  );
}
