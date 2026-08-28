import type {
  TrafficInjuryCalculationResult,
  InsuranceDeductionGroup,
} from "../types/trafficInjuryResult";
import type { TrafficInjuryDraft } from "../types/calculationDraft";
import { Fragment } from "react";
import {
  formatDateIso,
  formatDecimalYears,
  formatAgeYmd,
  formatKn8,
  formatMoney,
  formatNumber,
  formatPercent,
  formatTrhYmd,
} from "../utils/formatDisplay";
import { DataTableWrap, dataTableCls, FormSection, InfoAlert } from "../wizard/shared/FormPrimitives";

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 py-1.5 border-b border-[#D9E5E3]/60 last:border-0">
      <dt className="text-[12px] font-normal text-[#6B7280]">{label}</dt>
      <dd className="text-[12.5px] font-medium text-[#22313F] tabular-nums text-left sm:text-right">{value}</dd>
    </div>
  );
}

function TotalRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-2 py-1.5 ${
        highlight ? "mt-1 pt-2 border-t border-[#0F5F63]/20 font-semibold" : ""
      }`}
    >
      <span className={`text-[12.5px] ${highlight ? "text-[#0F5F63]" : "text-[#22313F]"}`}>{label}</span>
      <span className={`text-[12.5px] tabular-nums ${highlight ? "text-[#0F5F63]" : "text-[#22313F]"}`}>
        {value}
      </span>
    </div>
  );
}

function formatPhaseSection(phase: "ACTIVE" | "PASSIVE" | undefined): string {
  if (phase === "ACTIVE") return "Aktif Dönem";
  if (phase === "PASSIVE") return "Pasif Dönem";
  return "—";
}

function formatMoneyCell(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 9 fiziksel kolon — colgroup tek genişlik kaynağı */
const FUTURE_COL_PCTS = [10, 10, 8, 14, 14, 10, 14, 8, 12] as const;

const futurePeriodCls = {
  table: "w-full table-fixed border-collapse box-border text-[11px] leading-normal",
  cell: "box-border border border-[#D9E5E3] px-2 py-2 align-middle text-[11px] leading-normal",
  th: "bg-[#F4F7F7] text-center font-medium text-[#6B7280] whitespace-normal",
  td: "bg-white font-normal text-[#22313F] tabular-nums whitespace-nowrap",
  trHover: "hover:bg-[#EAF4F3]/35 transition-colors duration-150",
  phaseTd: "bg-[#E8F0EF] text-center font-semibold text-[#0F5F63]",
  ac: "text-center",
  ar: "text-right",
} as const;

function FuturePeriodTable({ rows }: { rows: TrafficInjuryCalculationResult["futurePeriods"] }) {
  const hasBothPhases =
    rows.some((r) => r.phase === "ACTIVE") && rows.some((r) => r.phase === "PASSIVE");
  let lastPhase: "ACTIVE" | "PASSIVE" | undefined;

  return (
    <table className={futurePeriodCls.table}>
      <colgroup>
        {FUTURE_COL_PCTS.map((pct, i) => (
          <col key={i} style={{ width: `${pct}%` }} />
        ))}
      </colgroup>
      <thead>
        <tr>
          <th className={`${futurePeriodCls.cell} ${futurePeriodCls.th}`} colSpan={2}>
            TARİH
          </th>
          <th className={`${futurePeriodCls.cell} ${futurePeriodCls.th}`}>GÜN SAYISI</th>
          <th className={`${futurePeriodCls.cell} ${futurePeriodCls.th}`}>
            %10 ARTIŞ
            <br />
            ÇARPANI KN
          </th>
          <th className={`${futurePeriodCls.cell} ${futurePeriodCls.th}`}>
            %10 İSKONTO
            <br />
            ÇARPANI (1/KN)
          </th>
          <th className={`${futurePeriodCls.cell} ${futurePeriodCls.th}`}>GÜNLÜK ÜCRET</th>
          <th className={`${futurePeriodCls.cell} ${futurePeriodCls.th}`}>
            İSKONTOLU
            <br />
            DÖNEM GELİRİ
          </th>
          <th className={`${futurePeriodCls.cell} ${futurePeriodCls.th}`}>maluliyet oranı</th>
          <th className={`${futurePeriodCls.cell} ${futurePeriodCls.th}`}>
            iskontolu
            <br />
            Dönem gelirleri
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => {
          const phaseBreak =
            hasBothPhases && row.phase && row.phase !== lastPhase ? (
              <tr key={`phase-${i}`}>
                <td className={`${futurePeriodCls.cell} ${futurePeriodCls.phaseTd}`} colSpan={9}>
                  {formatPhaseSection(row.phase)}
                </td>
              </tr>
            ) : null;
          if (row.phase) lastPhase = row.phase;

          return (
            <Fragment key={i}>
              {phaseBreak}
              <tr className={futurePeriodCls.trHover}>
                <td className={`${futurePeriodCls.cell} ${futurePeriodCls.td} ${futurePeriodCls.ac}`}>
                  {formatDateIso(row.startDate)}
                </td>
                <td className={`${futurePeriodCls.cell} ${futurePeriodCls.td} ${futurePeriodCls.ac}`}>
                  {formatDateIso(row.endDate)}
                </td>
                <td className={`${futurePeriodCls.cell} ${futurePeriodCls.td} ${futurePeriodCls.ac}`}>
                  {row.dayCount}
                </td>
                <td className={`${futurePeriodCls.cell} ${futurePeriodCls.td} ${futurePeriodCls.ac}`}>
                  {formatKn8(row.kn)}
                </td>
                <td className={`${futurePeriodCls.cell} ${futurePeriodCls.td} ${futurePeriodCls.ac}`}>
                  {formatKn8(row.discountFactor)}
                </td>
                <td className={`${futurePeriodCls.cell} ${futurePeriodCls.td} ${futurePeriodCls.ar}`}>
                  {formatMoneyCell(row.dailyNetIncome)}
                </td>
                <td className={`${futurePeriodCls.cell} ${futurePeriodCls.td} ${futurePeriodCls.ar}`}>
                  {formatMoneyCell(row.discountedIncome)}
                </td>
                <td className={`${futurePeriodCls.cell} ${futurePeriodCls.td} ${futurePeriodCls.ac}`}>
                  {formatPercent(row.disabilityRate)}
                </td>
                <td className={`${futurePeriodCls.cell} ${futurePeriodCls.td} ${futurePeriodCls.ar}`}>
                  {formatMoneyCell(row.periodDamage)}
                </td>
              </tr>
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

function InsuranceLegalInterestSection({
  title,
  group,
}: {
  title: string;
  group: InsuranceDeductionGroup;
}) {
  if (group.rows.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="text-[13px] font-semibold text-[#0F5F63] mb-1.5">{title}</h4>
      <p className="text-[11.5px] text-[#6B7280] mb-2">
        Ana Para × Yasal Faiz Oranı × Gün Sayısı / 36500 = Faiz
      </p>
      <div className="space-y-4">
        {group.rows.map((row, i) => (
          <div key={i} className="rounded-[10px] border border-[#D9E5E3] overflow-hidden">
            <DataTableWrap>
              <table className={`${dataTableCls.table} w-full text-[12px]`}>
                <thead>
                  <tr>
                    <th className={dataTableCls.th}>Ödeme Tarihi</th>
                    <th className={dataTableCls.th}>Hesap Tarihi</th>
                    <th className={dataTableCls.th}>Ana Para</th>
                    <th className={dataTableCls.th}>Toplam Gün</th>
                    <th className={dataTableCls.th}>Toplam Faiz</th>
                    <th className={dataTableCls.th}>Faizli Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={dataTableCls.td}>{formatDateIso(row.paymentDate)}</td>
                    <td className={dataTableCls.td}>{formatDateIso(row.calculationDate)}</td>
                    <td className={`${dataTableCls.td} tabular-nums`}>{formatMoney(row.principalAmount)}</td>
                    <td className={`${dataTableCls.td} tabular-nums`}>{row.calendarDayCount}</td>
                    <td className={`${dataTableCls.td} tabular-nums`}>{formatMoney(row.interestAmount)}</td>
                    <td className={`${dataTableCls.td} tabular-nums font-medium`}>
                      {formatMoney(row.principalPlusInterest)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </DataTableWrap>
            {row.interestSegments.length > 0 && (
              <div className="border-t border-[#D9E5E3] bg-[#F9FBFB] px-3 py-2">
                <p className="text-[11px] font-medium text-[#6B7280] mb-1.5">Faiz segmentleri</p>
                <div className="space-y-1">
                  {row.interestSegments.map((seg, j) => (
                    <p key={j} className="text-[11.5px] text-[#22313F] tabular-nums">
                      {formatDateIso(seg.startDate)} – {formatDateIso(seg.endDate)} |{" "}
                      {formatPercent(seg.annualRatePercent)} | {seg.calendarDayCount} gün |{" "}
                      {formatMoney(seg.interestAmount)}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 space-y-0.5">
        <TotalRow label="Ana para toplamı" value={formatMoney(group.principalTotal)} />
        <TotalRow label="Faiz toplamı" value={formatMoney(group.interestTotal)} />
        <TotalRow label="Mahsup toplamı" value={formatMoney(group.deductionTotal)} highlight />
      </div>
    </div>
  );
}

function EmptyTableNote({ text }: { text: string }) {
  return <p className="text-[12px] font-normal text-[#6B7280] py-2">{text}</p>;
}

export function TrafficInjuryResultView({
  draft,
  result,
  onDownloadWordReport,
  reporting = false,
  reportError = null,
}: {
  draft: TrafficInjuryDraft;
  result: TrafficInjuryCalculationResult;
  onDownloadWordReport?: () => void;
  reporting?: boolean;
  reportError?: string | null;
}) {
  const processedRows = result.processedPeriods.filter((r) => r.periodKind === "processed_permanent");
  const le = result.lifeExpectancy;

  return (
    <div className="space-y-3 mt-3">
      {result.warnings.length > 0 && (
        <div className="rounded-[10px] border border-amber-200 bg-amber-50/70 px-3 py-2 text-[12px] text-amber-900">
          {result.warnings.join(" · ")}
        </div>
      )}

      {/* A) HESAP ÖZETİ */}
      <FormSection title="Hesap Özeti">
        <dl className="divide-y divide-[#D9E5E3]/40">
          <SummaryRow label="Kaza tarihi" value={formatDateIso(draft.common.eventDate)} />
          <SummaryRow label="Hesap tarihi" value={formatDateIso(draft.common.calculationDate)} />
          <SummaryRow label="Kaza tarihindeki yaş" value={formatAgeYmd(le.ageAtAccident)} />
          <SummaryRow label="TRH bakiye ömür (yıl/ay/gün)" value={formatTrhYmd(le.lifeExpectancyYmd)} />
          <SummaryRow
            label="TRH bakiye ömür (ondalık)"
            value={formatDecimalYears(le.decimalLifeExpectancy)}
          />
          <SummaryRow label="Muhtemel ömür sonu" value={formatDateIso(result.probableLifeEndDate)} />
          <SummaryRow label="Pasif dönem başlangıcı" value={formatDateIso(result.passivePhaseStartDate)} />
          <SummaryRow
            label="Maluliyet oranı"
            value={formatPercent(result.permanentDisabilityRate)}
          />
          <SummaryRow label="Davacı kusur oranı" value={formatPercent(result.injuredFaultRate)} />
          <SummaryRow
            label="Hesaba esas aylık net gelir"
            value={formatMoney(result.resolvedIncome.monthlyNetAtCalculation)}
          />
          <SummaryRow label="Günlük net gelir" value={formatMoney(result.dailyNetIncome)} />
        </dl>
      </FormSection>

      {/* B) GEÇİCİ İG */}
      <FormSection title="Geçici İş Göremezlik">
        {result.temporaryIncapacityPeriods.length === 0 ? (
          <EmptyTableNote text="Geçici iş göremezlik dönemi girilmemiş veya hesaplanmadı." />
        ) : (
          <>
            <DataTableWrap>
              <table className={dataTableCls.table}>
                <thead>
                  <tr>
                    <th className={dataTableCls.th}>Başlangıç</th>
                    <th className={dataTableCls.th}>Bitiş</th>
                    <th className={dataTableCls.th}>Gün</th>
                    <th className={dataTableCls.th}>Aylık net</th>
                    <th className={dataTableCls.th}>Günlük net</th>
                    <th className={dataTableCls.th}>Oran</th>
                    <th className={dataTableCls.th}>Dönem zararı</th>
                  </tr>
                </thead>
                <tbody>
                  {result.temporaryIncapacityPeriods.map((row, i) => (
                    <tr key={i} className={dataTableCls.trHover}>
                      <td className={dataTableCls.td}>{formatDateIso(row.startDate)}</td>
                      <td className={dataTableCls.td}>{formatDateIso(row.endDate)}</td>
                      <td className={`${dataTableCls.td} tabular-nums`}>{row.dayCount}</td>
                      <td className={`${dataTableCls.td} tabular-nums`}>{formatMoney(row.monthlyNetIncome)}</td>
                      <td className={`${dataTableCls.td} tabular-nums`}>{formatMoney(row.dailyNetIncome)}</td>
                      <td className={dataTableCls.td}>%100,00</td>
                      <td className={`${dataTableCls.td} tabular-nums font-medium`}>
                        {formatMoney(row.periodDamage)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTableWrap>
            <TotalRow label="Geçici İG toplamı" value={formatMoney(result.temporaryIncapacityTotal)} highlight />
          </>
        )}
      </FormSection>

      {/* C) İŞLEMİŞ DÖNEM */}
      <FormSection title="İşlemiş Dönem (Maluliyet Sonrası)">
        {processedRows.length === 0 ? (
          <EmptyTableNote text="Maluliyet sonrası işlemiş dönem satırı yok." />
        ) : (
          <>
            <p className="text-[11.5px] text-[#6B7280] mb-2">
              Asgari ücret değişim dönemlerine göre bölünmüş satırlar.
            </p>
            <DataTableWrap>
              <table className={dataTableCls.table}>
                <thead>
                  <tr>
                    <th className={dataTableCls.th}>Başlangıç</th>
                    <th className={dataTableCls.th}>Bitiş</th>
                    <th className={dataTableCls.th}>Gün</th>
                    <th className={dataTableCls.th}>Aylık net</th>
                    <th className={dataTableCls.th}>Günlük net</th>
                    <th className={dataTableCls.th}>Maluliyet</th>
                    <th className={dataTableCls.th}>Dönem zararı</th>
                  </tr>
                </thead>
                <tbody>
                  {processedRows.map((row, i) => (
                    <tr key={i} className={dataTableCls.trHover}>
                      <td className={dataTableCls.td}>{formatDateIso(row.startDate)}</td>
                      <td className={dataTableCls.td}>{formatDateIso(row.endDate)}</td>
                      <td className={`${dataTableCls.td} tabular-nums`}>{row.dayCount}</td>
                      <td className={`${dataTableCls.td} tabular-nums`}>{formatMoney(row.monthlyNetIncome)}</td>
                      <td className={`${dataTableCls.td} tabular-nums`}>{formatMoney(row.dailyNetIncome)}</td>
                      <td className={dataTableCls.td}>{formatPercent(row.disabilityRate)}</td>
                      <td className={`${dataTableCls.td} tabular-nums font-medium`}>
                        {formatMoney(row.periodDamage)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTableWrap>
            <TotalRow label="İşlemiş dönem toplamı" value={formatMoney(result.processedPermanentTotal)} highlight />
          </>
        )}
      </FormSection>

      {/* D) İŞLEYECEK DÖNEM */}
      <FormSection title="İşleyecek Dönem">
        {result.futurePeriods.length === 0 ? (
          <EmptyTableNote text="İşleyecek dönem satırı üretilemedi." />
        ) : (
          <>
            <DataTableWrap>
              <FuturePeriodTable rows={result.futurePeriods} />
            </DataTableWrap>
            <TotalRow label="İşleyecek dönem toplamı" value={formatMoney(result.futurePermanentTotal)} highlight />
          </>
        )}
      </FormSection>

      {/* E) TOPLAM VE İNDİRİMLER */}
      <FormSection title="Toplam ve İndirimler">
        <div className="space-y-0.5">
          <TotalRow label="Geçici İG" value={formatMoney(result.temporaryIncapacityTotal)} />
          <TotalRow label="İşlemiş dönem" value={formatMoney(result.processedPermanentTotal)} />
          <TotalRow label="İşleyecek dönem" value={formatMoney(result.futurePermanentTotal)} />
          <TotalRow label="Toplam zarar" value={formatMoney(result.totalDamageBeforeFault)} highlight />
          <TotalRow
            label={`Davacı kusur indirimi (${formatPercent(result.injuredFaultRate)})`}
            value={`− ${formatMoney(result.faultDeductionAmount)}`}
          />
          <TotalRow label="Kusur sonrası zarar" value={formatMoney(result.totalAfterFault)} />
          <TotalRow label="Toplam PSD" value={formatMoney(result.psdTotal)} />
          <TotalRow
            label="Mahsup edilebilir PSD (kusur sonrası)"
            value={formatMoney(result.psdDeductibleAfterFault)}
          />
          <TotalRow label="PSD sonrası zarar" value={formatMoney(result.totalAfterPSD)} />
          <TotalRow
            label="Sigorta / garame öncesi nihai tazminat"
            value={formatMoney(result.finalCompensationBeforeInsurance)}
            highlight
          />
          <TotalRow
            label="ZMTS ana para toplamı"
            value={formatMoney(result.insuranceDeductions.zmts.principalTotal)}
          />
          <TotalRow
            label="ZMTS yasal faiz toplamı"
            value={formatMoney(result.insuranceDeductions.zmts.interestTotal)}
          />
          <TotalRow
            label="ZMTS faizli mahsup toplamı"
            value={`− ${formatMoney(result.insuranceDeductions.zmts.deductionTotal)}`}
          />
          <TotalRow
            label="Kasko ana para toplamı"
            value={formatMoney(result.insuranceDeductions.casco.principalTotal)}
          />
          <TotalRow
            label="Kasko yasal faiz toplamı"
            value={formatMoney(result.insuranceDeductions.casco.interestTotal)}
          />
          <TotalRow
            label="Kasko faizli mahsup toplamı"
            value={`− ${formatMoney(result.insuranceDeductions.casco.deductionTotal)}`}
          />
          <TotalRow
            label="Sigorta ödemeleri sonrası nihai tazminat"
            value={formatMoney(result.finalCompensationAfterInsurance)}
            highlight
          />
        </div>
      </FormSection>

      {/* F) ZMTS / KASKO YASAL FAİZ */}
      <FormSection title="ZMTS / Kasko / Garame">
        <InsuranceLegalInterestSection
          title="ZMTS YASAL FAİZ HESABI"
          group={result.insuranceDeductions.zmts}
        />
        <InsuranceLegalInterestSection
          title="KASKO YASAL FAİZ HESABI"
          group={result.insuranceDeductions.casco}
        />
        {result.insuranceDeductions.zmts.rows.length === 0 &&
          result.insuranceDeductions.casco.rows.length === 0 && (
            <InfoAlert>
              Yasal faiz mahsubu için geçerli ZMTS/Kasko ödeme kaydı bulunmamaktadır.
            </InfoAlert>
          )}
        {(draft.zmtsPayments.length > 0 || draft.cascoPayments.length > 0) && (
          <p className="text-[12px] text-[#6B7280] mt-2">
            Girilen sigorta kayıtları: ZMTS {formatNumber(draft.zmtsPayments.length)}, Kasko{" "}
            {formatNumber(draft.cascoPayments.length)}
          </p>
        )}
      </FormSection>

      {onDownloadWordReport && (
        <FormSection title="Rapor">
          <div className="rounded-[12px] border border-[#0F5F63]/25 bg-[#F4F7F7] p-4">
            <p className="text-[13px] font-normal text-[#22313F] mb-3">
              Hesap sonucunu bilirkişi/aktüerya Word raporu olarak indirebilirsiniz.
            </p>
            <button
              type="button"
              onClick={onDownloadWordReport}
              disabled={reporting}
              className="btn-primary w-full sm:w-auto min-h-[44px] px-5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reporting ? "Rapor hazırlanıyor…" : "Word Raporu Oluştur"}
            </button>
            {reportError && (
              <p className="mt-2.5 text-[13px] font-normal text-red-800">{reportError}</p>
            )}
          </div>
        </FormSection>
      )}
    </div>
  );
}
