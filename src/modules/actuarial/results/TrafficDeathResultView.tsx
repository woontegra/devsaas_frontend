import type { TrafficDeathDraft } from "../types/calculationDraft";
import type { TrafficDeathCalculationResult } from "../types/trafficDeathResult";
import { Fragment } from "react";
import {
  coercePersonLives,
  isUsableTrafficDeathPayResult,
  type TrafficDeathSupportPeriodsResponse,
} from "../types/trafficDeathSupportPeriods";
import { resolveBeneficiaryClaimantStatus } from "../utils/beneficiaryClaimantStatus";
import { calendarSpanYmd } from "../utils/calendarAge";
import {
  calendarAgeYmd,
  formatAgeYmd,
  formatCalendarAgeYmd,
  formatDateIso,
  formatDecimalYears,
  formatKn8,
  formatMoney,
  formatPercent,
  formatTrhYmd,
} from "../utils/formatDisplay";
import {
  TRAFFIC_DEATH_RESPONSIBLE_LABELS,
  trafficDeathFaultSum,
} from "../utils/trafficDeathFaultRates";
import { deathExpenseFaultNote, migrateDeathExpenseTransport, resolvePreDeathTreatmentName } from "../utils/deathExpenses";
import { MARRIAGE_CHILD_RATE_POINTS } from "../utils/marriageProbability";
import { CHILD_EDUCATION_OPTIONS } from "../wizard/shared/segmentedChoice";
import { DataTableWrap, FormSection, resultGridCls } from "../wizard/shared/FormPrimitives";
import { mergeTrafficDeathShareRatioColumns } from "../wizard/shared/trafficDeathShareRatioColumns";
import { TrafficDeathShareRatiosTable } from "../wizard/shared/TrafficDeathShareRatiosTable";
import {
  formatShareFractionWithPercent,
  groupFuturePeriodsForPlaintiffTable,
  groupProcessedPeriodsForPlaintiffTable,
} from "./groupProcessedPeriodsForPlaintiffTable";
import { buildTrafficDeathSharePrinciples } from "./buildTrafficDeathSharePrinciples";
import { TrafficDeathSharePrinciplesCard } from "./TrafficDeathSharePrinciplesCard";
import {
  normalizeTrafficDeathCalculationResult,
  normalizeTrafficDeathSupportSnapshot,
  resolveDeceasedProbableLifeEndDate,
  isStaleExclusiveDeceasedLifeEndResult,
} from "./capTrafficDeathToDeceasedLifeEnd";
import { monetarySectionFromEngineResult } from "./trafficDeathReviewVisibility";
import type {
  TrafficDeathFutureClaimantRow,
  TrafficDeathProcessedClaimantRow,
} from "../types/trafficDeathResult";

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 py-1.5 border-b border-[#DCE3E8]/60 last:border-0">
      <dt className="text-[12px] font-normal text-[#66727F]">{label}</dt>
      <dd className="text-[12.5px] font-medium text-[#1F2933] tabular-nums text-left sm:text-right">{value}</dd>
    </div>
  );
}

function TotalRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-2 py-1.5 ${
        highlight ? "mt-1 pt-2 border-t border-[#243746]/20 font-semibold" : ""
      }`}
    >
      <span className={`text-[12.5px] ${highlight ? "text-[#243746]" : "text-[#1F2933]"}`}>{label}</span>
      <span className={`text-[12.5px] tabular-nums ${highlight ? "text-[#243746]" : "text-[#1F2933]"}`}>
        {value}
      </span>
    </div>
  );
}

/** Garame paylarını üst hak sahibi (claimantLosses) sırasına claimantId ile hizala. */
function orderGarameSharesByClaimants<T extends { claimantId: string }>(
  shares: T[],
  claimants: Array<{ claimantId: string }>
): T[] {
  const byId = new Map(shares.map((row) => [row.claimantId, row]));
  const ordered: T[] = [];
  for (const claimant of claimants) {
    const row = byId.get(claimant.claimantId);
    if (!row) continue;
    ordered.push(row);
    byId.delete(claimant.claimantId);
  }
  for (const row of byId.values()) ordered.push(row);
  return ordered;
}

function EmptyMotorNote() {
  return (
    <p className="text-[12px] font-normal text-[#66727F] py-2">
      Parasal hesaplama motoru henüz çalıştırılmadı.
    </p>
  );
}

function EmptyTableNote({ text }: { text: string }) {
  return <p className="text-[12px] font-normal text-[#66727F] py-2">{text}</p>;
}

function formatMoneyCell(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ROLE_LABEL: Record<string, string> = {
  DECEASED: "Müteveffa",
  SPOUSE: "Eş",
  MOTHER: "Anne",
  FATHER: "Baba",
  CHILD: "Çocuk",
  OTHER_ADULT: "Diğer",
};

const RELATION_LABEL: Record<string, string> = {
  spouse: "Eş",
  mother: "Anne",
  father: "Baba",
  child: "Çocuk",
  sibling: "Kardeş",
  other: "Diğer",
};

const INCOME_MODE_LABELS: Record<string, string> = {
  minWage: "Net asgari ücret",
  fixed: "Sabit net gelir",
  average: "Ortalama net gelir",
};

const BENEFICIARY_COL_PCTS = [13, 8, 9, 9, 10, 7, 11, 11, 11, 11] as const;
const CLAIMANT_LOSS_COL_PCTS = [14, 9, 9, 10, 11.5, 11.5, 11.5, 11.5, 12] as const;

function ratePoint(value: number): string {
  return `%${value}`;
}

function MarriageProbabilityResultCard({
  result,
  hasMoney,
}: {
  result: TrafficDeathCalculationResult | null;
  hasMoney: boolean;
}) {
  const summary = result?.marriageProbability;
  const showTable = Boolean(summary && (summary.spouseName || summary.applied));
  return (
    <FormSection title="Evlenme İhtimali İndirimi">
      {!hasMoney || !summary || !showTable ? (
        <p className="text-[13px] leading-relaxed text-[#66727F]">
          {summary?.infoMessage ?? "Bu kayıtta evlenme ihtimali indirimi uygulanmamıştır."}
        </p>
      ) : (
        <>
          <DataTableWrap>
            <table className={`${resultGridCls.table} table-auto`} style={{ minWidth: "820px" }}>
              <thead>
                <tr>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>Hak Sahibi</th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>Hesap Tarihindeki Yaş</th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>Yaş Aralığı</th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>Baz Oran</th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>18 Yaş Altı Çocuk</th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>Çocuk İndirimi</th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>Nihai Oran</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.al} whitespace-normal`}>
                    {summary!.spouseName} (Eş)
                  </td>
                  <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac} whitespace-normal`}>
                    {summary!.spouseAgeYmd ? formatCalendarAgeYmd(summary!.spouseAgeYmd) : "—"}
                  </td>
                  <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                    {summary!.spouseAgeRangeKey ?? "—"}
                  </td>
                  <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                    {ratePoint(summary!.baseMarriageProbabilityRate)}
                  </td>
                  <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                    {summary!.under18ChildCount}
                  </td>
                  <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                    {ratePoint(summary!.under18ChildCount * MARRIAGE_CHILD_RATE_POINTS)}
                  </td>
                  <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac} font-medium`}>
                    {ratePoint(summary!.finalMarriageProbabilityRate)}
                  </td>
                </tr>
              </tbody>
            </table>
          </DataTableWrap>
          <p className="mt-2 text-[13px] leading-relaxed text-[#1F2933]">
            <span className="font-medium">Hesap Formülü: </span>
            Baz Oran {ratePoint(summary!.baseMarriageProbabilityRate)} - ({summary!.under18ChildCount} çocuk ×{" "}
            {ratePoint(MARRIAGE_CHILD_RATE_POINTS)}) = {ratePoint(summary!.finalMarriageProbabilityRate)} Evlenme
            İhtimali İndirimi
          </p>
          {summary!.infoMessage ? (
            <p className="text-[12.5px] leading-relaxed text-[#66727F]">{summary!.infoMessage}</p>
          ) : null}
        </>
      )}
    </FormSection>
  );
}

function InsuranceMahsupCard({ result }: { result: TrafficDeathCalculationResult }) {
  const items = result.claimantLosses.flatMap((row) => {
    const name = `${row.claimantName}${row.relationLabel ? ` (${row.relationLabel})` : ""}`;
    return [
      ...(row.zmtsPaymentDetails ?? []).map((detail) => ({ name, kind: "ZMTS" as const, detail })),
      ...(row.cascoPaymentDetails ?? []).map((detail) => ({ name, kind: "Kasko" as const, detail })),
    ];
  });

  return (
    <FormSection title="Sigorta ve Kasko Mahsup Hesabı">
      {items.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-[#66727F]">
          Bu hesapta hak sahibine bağlı ZMTS veya kasko ödemesi yok.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={`${item.kind}-${item.detail.paymentDate}-${index}`} className="space-y-1.5">
              <DataTableWrap>
                <table className={`${resultGridCls.table} table-auto`} style={{ minWidth: "720px" }}>
                  <thead>
                    <tr>
                      <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>Hak Sahibi</th>
                      <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>Ödeme Türü</th>
                      <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>Ana Ödeme</th>
                      <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>Ödeme Tarihi</th>
                      <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>Hesap Tarihi</th>
                      <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>Toplam Faiz</th>
                      <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>Güncellenmiş Ödeme</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.al} whitespace-normal`}>
                        {item.name}
                      </td>
                      <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>{item.kind}</td>
                      <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar}`}>
                        {formatMoney(item.detail.principal)}
                      </td>
                      <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                        {formatDateIso(item.detail.paymentDate)}
                      </td>
                      <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                        {formatDateIso(item.detail.calculationDate)}
                      </td>
                      <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar}`}>
                        {formatMoney(item.detail.legalInterestAmount)}
                      </td>
                      <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar} font-medium`}>
                        {formatMoney(item.detail.updatedAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </DataTableWrap>
              {(item.detail.interestSegments ?? []).length > 0 ? (
                <DataTableWrap>
                  <table className={`${resultGridCls.table} table-auto`} style={{ minWidth: "560px" }}>
                    <thead>
                      <tr>
                        <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>Başlangıç</th>
                        <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>Bitiş</th>
                        <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>Gün</th>
                        <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>Yasal Faiz Oranı</th>
                        <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>Faiz Tutarı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(item.detail.interestSegments ?? []).map((segment, segmentIndex) => (
                        <tr key={`${segment.startDate}-${segmentIndex}`}>
                          <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                            {formatDateIso(segment.startDate)}
                          </td>
                          <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                            {formatDateIso(segment.endDate)}
                          </td>
                          <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar}`}>
                            {segment.calendarDayCount}
                          </td>
                          <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar}`}>
                            {formatPercent(segment.annualRatePercent)}
                          </td>
                          <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar}`}>
                            {formatMoney(segment.interestAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataTableWrap>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </FormSection>
  );
}
const PRIOR_PAYMENT_COL_PCTS = [28, 28, 20, 24] as const;

/** Ortak dönem kolonları: TARİH×2 + Gün + Aylık + Günlük + Dönem Geliri */
const PROCESSED_COMMON_COL_COUNT = 6;
/** Ortak işleyecek kolonları: TARİH×2 + Gün + KN + 1/KN + Günlük + İskontolu gelir */
const FUTURE_COMMON_COL_COUNT = 7;

function DeathProcessedPeriodTable({
  rows,
}: {
  rows: TrafficDeathProcessedClaimantRow[];
}) {
  const { columns, periods, plaintiffTotals } = groupProcessedPeriodsForPlaintiffTable(rows);
  const minWidth = Math.max(720, 420 + columns.length * 200);

  return (
      <DataTableWrap>
        <table
          className={`${resultGridCls.table} table-auto`}
          style={{ minWidth: `${minWidth}px` }}
        >
          <thead>
            <tr>
              <th className={`${resultGridCls.cell} ${resultGridCls.th}`} rowSpan={2} colSpan={2}>
                TARİH
              </th>
              <th className={`${resultGridCls.cell} ${resultGridCls.th}`} rowSpan={2}>
                GÜN
                <br />
                SAYISI
              </th>
              <th className={`${resultGridCls.cell} ${resultGridCls.th}`} rowSpan={2}>
                AYLIK NET
                <br />
                GELİR
              </th>
              <th className={`${resultGridCls.cell} ${resultGridCls.th}`} rowSpan={2}>
                GÜNLÜK NET
                <br />
                GELİR
              </th>
              <th className={`${resultGridCls.cell} ${resultGridCls.th}`} rowSpan={2}>
                DÖNEM
                <br />
                GELİRİ
              </th>
              {columns.map((col) => (
                <th
                  key={col.claimantId}
                  className={`${resultGridCls.cell} ${resultGridCls.th} whitespace-normal`}
                  colSpan={2}
                >
                  {col.header}
                </th>
              ))}
            </tr>
            <tr>
              {columns.map((col) => (
                <Fragment key={`${col.claimantId}-sub`}>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>Pay Oranı</th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>
                    Destek
                    <br />
                    Tazminatı
                  </th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period, i) => (
              <tr
                key={`${period.startDate}-${period.endDate}-${i}`}
                className={resultGridCls.trHover}
              >
                <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                  {formatDateIso(period.startDate)}
                </td>
                <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                  {formatDateIso(period.endDate)}
                </td>
                <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                  {period.dayCount}
                </td>
                <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar}`}>
                  {formatMoneyCell(period.monthlyNetIncome)}
                </td>
                <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar}`}>
                  {formatMoneyCell(period.dailyNetIncome)}
                </td>
                <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar}`}>
                  {formatMoneyCell(period.periodIncome)}
                </td>
                {columns.map((col) => {
                  const cell = period.byClaimantId[col.claimantId];
                  return (
                    <Fragment key={`${col.claimantId}-${i}`}>
                      <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac} whitespace-normal`}>
                        {cell
                          ? formatShareFractionWithPercent(cell.shareFraction, cell.sharePercentage)
                          : "—"}
                      </td>
                      <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar}`}>
                        {cell ? formatMoneyCell(cell.periodDamage) : "—"}
                      </td>
                    </Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {columns.length > 0 && (
            <tfoot>
              <tr>
                <td
                  className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.al} font-semibold whitespace-normal`}
                  colSpan={PROCESSED_COMMON_COL_COUNT}
                >
                  Davacı toplamları
                </td>
                {columns.map((col) => (
                  <Fragment key={`${col.claimantId}-total`}>
                    <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>—</td>
                    <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar} font-semibold`}>
                      {formatMoneyCell(plaintiffTotals[col.claimantId] ?? 0)}
                    </td>
                  </Fragment>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </DataTableWrap>
  );
}

function DeathFuturePeriodTable({ rows }: { rows: TrafficDeathFutureClaimantRow[] }) {
  const { columns, periods, plaintiffTotals } = groupFuturePeriodsForPlaintiffTable(rows);
  const minWidth = Math.max(860, 520 + columns.length * 200);

  return (
    <>
      <DataTableWrap>
        <table
          className={`${resultGridCls.table} table-auto`}
          style={{ minWidth: `${minWidth}px` }}
        >
          <thead>
            <tr>
              <th className={`${resultGridCls.cell} ${resultGridCls.th}`} rowSpan={2} colSpan={2}>
                TARİH
              </th>
              <th className={`${resultGridCls.cell} ${resultGridCls.th}`} rowSpan={2}>
                GÜN
                <br />
                SAYISI
              </th>
              <th className={`${resultGridCls.cell} ${resultGridCls.th}`} rowSpan={2}>
                %10 ARTIŞ
                <br />
                ÇARPANI KN
              </th>
              <th className={`${resultGridCls.cell} ${resultGridCls.th}`} rowSpan={2}>
                %10 İSKONTO
                <br />
                ÇARPANI (1/KN)
              </th>
              <th className={`${resultGridCls.cell} ${resultGridCls.th}`} rowSpan={2}>
                GÜNLÜK
                <br />
                ÜCRET
              </th>
              <th className={`${resultGridCls.cell} ${resultGridCls.th}`} rowSpan={2}>
                İSKONTOLU
                <br />
                DÖNEM GELİRİ
              </th>
              {columns.map((col) => (
                <th
                  key={col.claimantId}
                  className={`${resultGridCls.cell} ${resultGridCls.th} whitespace-normal`}
                  colSpan={2}
                >
                  {col.header}
                </th>
              ))}
            </tr>
            <tr>
              {columns.map((col) => (
                <Fragment key={`${col.claimantId}-sub`}>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>Pay Oranı</th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>
                    Destek
                    <br />
                    Tazminatı
                  </th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period, i) => (
              <tr
                key={`${period.startDate}-${period.endDate}-${i}`}
                className={resultGridCls.trHover}
              >
                <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                  {formatDateIso(period.startDate)}
                </td>
                <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                  {formatDateIso(period.endDate)}
                </td>
                <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                  {period.dayCount}
                </td>
                <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                  {formatKn8(period.kn)}
                </td>
                <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                  {formatKn8(period.discountFactor)}
                </td>
                <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar}`}>
                  {formatMoneyCell(period.dailyNetIncome)}
                </td>
                <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar}`}>
                  {formatMoneyCell(period.discountedIncome)}
                </td>
                {columns.map((col) => {
                  const cell = period.byClaimantId[col.claimantId];
                  return (
                    <Fragment key={`${col.claimantId}-${i}`}>
                      <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac} whitespace-normal`}>
                        {cell
                          ? formatShareFractionWithPercent(cell.shareFraction, cell.sharePercentage)
                          : "—"}
                      </td>
                      <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar}`}>
                        {cell ? formatMoneyCell(cell.periodDamage) : "—"}
                      </td>
                    </Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {columns.length > 0 && (
            <tfoot>
              <tr>
                <td
                  className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.al} font-semibold whitespace-normal`}
                  colSpan={FUTURE_COMMON_COL_COUNT}
                >
                  Davacı toplamları
                </td>
                {columns.map((col) => (
                  <Fragment key={`${col.claimantId}-total`}>
                    <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>—</td>
                    <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar} font-semibold`}>
                      {formatMoneyCell(plaintiffTotals[col.claimantId] ?? 0)}
                    </td>
                  </Fragment>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </DataTableWrap>
    </>
  );
}

function formatAgeAtAccident(
  stored: { years: number; months: number; days: number } | null | undefined,
  birthDate: string | null | undefined,
  accidentDate: string | null | undefined
): string {
  const age = stored ?? calendarSpanYmd(birthDate ?? "", accidentDate ?? "");
  return formatCalendarAgeYmd(age);
}

function genderLabel(g: string | undefined): string {
  if (g === "male" || g === "MALE") return "Erkek";
  if (g === "female" || g === "FEMALE") return "Kadın";
  return "—";
}

function educationLabel(status: string | null | undefined, other?: string): string {
  if (!status) return "—";
  const found = CHILD_EDUCATION_OPTIONS.find((o) => o.value === status);
  if (status === "other" && other?.trim()) return `${found?.label ?? "Diğer"} (${other.trim()})`;
  return found?.label ?? status;
}

export function TrafficDeathResultView({
  draft,
  supportResult,
  monetaryResult,
}: {
  draft: TrafficDeathDraft;
  supportResult: TrafficDeathSupportPeriodsResponse | null;
  monetaryResult?: TrafficDeathCalculationResult | null;
}) {
  const cappedMonetary: TrafficDeathCalculationResult | null = monetaryResult
    ? normalizeTrafficDeathCalculationResult(monetaryResult)
    : null;
  const cappedSupport: TrafficDeathSupportPeriodsResponse | null = supportResult
    ? {
        ...supportResult,
        ...normalizeTrafficDeathSupportSnapshot({
          shareRatioPeriods: supportResult.shareRatioPeriods,
          personLives: supportResult.personLives,
          periods: supportResult.periods,
          columnKeys: supportResult.columnKeys,
          valid: supportResult.valid,
        }),
      }
    : null;

  const monetaryLives = coercePersonLives(cappedMonetary?.personLives);
  const supportLives = coercePersonLives(cappedSupport?.personLives);
  const monetaryLifeEnd = resolveDeceasedProbableLifeEndDate(monetaryLives);
  const supportLifeEnd = resolveDeceasedProbableLifeEndDate(supportLives);
  const monetaryExclusiveStale =
    cappedMonetary != null &&
    isStaleExclusiveDeceasedLifeEndResult({
      personLives: cappedMonetary.personLives,
      shareRatioPeriods: cappedMonetary.shareRatioPeriods,
      futurePeriods: cappedMonetary.futurePeriods,
      supportPeriods: cappedMonetary.supportPeriods as Array<{ endDate: string }> | undefined,
    });
  // Live support / inclusive life-end wins over stale exclusive runResult (periods end day-before)
  const personLives =
    (monetaryLifeEnd && supportLifeEnd && monetaryLifeEnd !== supportLifeEnd) ||
    monetaryExclusiveStale
      ? supportLives.length
        ? supportLives
        : monetaryLives
      : monetaryLives.length
        ? monetaryLives
        : supportLives;
  const deceasedLife = personLives.find((p) => p.role === "DECEASED" || p.personId === "deceased");
  // SSoT: backend personLives deceased.probableLifeEndDate (actuarial30) — frontend’de yeniden hesaplanmaz
  const deceasedLifeEnd =
    resolveDeceasedProbableLifeEndDate(personLives) || deceasedLife?.probableLifeEndDate || null;
  const deathDate = draft.deceased.deathDate || draft.common.eventDate;
  const ageAtDeath = calendarAgeYmd(draft.deceased.birthDate, deathDate);
  const family = draft.deceasedFamilyInfo;
  const displayMonetary = monetarySectionFromEngineResult(
    cappedMonetary,
    monetaryExclusiveStale
  );
  const incomeMode =
    displayMonetary?.resolvedIncome.incomeMode ?? draft.accidentIncome.incomeMode;
  const paySource = displayMonetary
    ? {
        shareRatioPeriods: displayMonetary.shareRatioPeriods,
        columnKeys: displayMonetary.columnKeys,
      }
    : cappedSupport;
  const payUsable = isUsableTrafficDeathPayResult(paySource);
  const sharePeriods = payUsable ? paySource.shareRatioPeriods ?? [] : [];
  const shareColumns = mergeTrafficDeathShareRatioColumns(
    draft,
    (displayMonetary?.columnKeys ?? cappedSupport?.columnKeys) ?? []
  );
  const selectedParties = draft.responsibleParties ?? [];
  const totalFault = trafficDeathFaultSum(
    draft.deceasedFaultRate,
    selectedParties,
    draft.externalFaultRate
  );
  const expenses = migrateDeathExpenseTransport(draft.deathExpenses);
  const hasExpenseInput =
    (expenses.preDeathTreatment ?? 0) > 0 ||
    (expenses.funeralCost ?? 0) > 0 ||
    Boolean(expenses.preDeathIncomeLossNotes?.trim()) ||
    expenses.otherExpenses.some((item) => (item.amount ?? 0) > 0 || Boolean(item.name?.trim()));

  const beneficiaryById = new Map(draft.beneficiaries.map((b) => [b.id, b]));
  const hasMoney = displayMonetary != null;
  const beneficiaryLives = personLives.filter(
    (p) => p.role !== "DECEASED" && p.personId !== "deceased"
  );
  const sharePrinciples = buildTrafficDeathSharePrinciples({
    draft,
    shareRatioPeriods: sharePeriods,
    personLives,
    deceasedProbableLifeEndDate: deceasedLifeEnd,
  });

  return (
    <div className="space-y-3 mt-3">
      {(displayMonetary?.warnings?.length || cappedSupport?.warnings?.length) ? (
        <div className="accent-warning-surface px-3 py-2 text-[12px]">
          {(displayMonetary?.warnings ?? supportResult?.warnings?.map((w) => w.message) ?? []).join(
            " · "
          )}
        </div>
      ) : null}

      <FormSection title="Hesap Özeti">
        <dl className="divide-y divide-[#DCE3E8]/40">
          <SummaryRow label="Olay / ölüm tarihi" value={formatDateIso(deathDate)} />
          <SummaryRow label="Hesap tarihi" value={formatDateIso(draft.common.calculationDate)} />
          <SummaryRow label="Müteveffanın doğum tarihi" value={formatDateIso(draft.deceased.birthDate)} />
          <SummaryRow label="Ölüm tarihindeki yaşı" value={formatAgeYmd(ageAtDeath)} />
          <SummaryRow label="Cinsiyet" value={genderLabel(draft.deceased.gender)} />
          <SummaryRow
            label="Öğrenim durumu"
            value={educationLabel(family.educationStatus, family.educationOtherDescription)}
          />
          <SummaryRow
            label="Çalışma durumu"
            value={
              draft.employmentStatus === "WORKING"
                ? "Çalışıyor"
                : draft.employmentStatus === "NOT_WORKING"
                  ? "Çalışmıyor"
                  : "—"
            }
          />
          <SummaryRow
            label="Esas alınan gelir"
            value={
              hasMoney
                ? formatMoney(displayMonetary!.resolvedIncome.monthlyNetAtCalculation)
                : draft.employmentStatus === "WORKING"
                  ? incomeMode === "fixed"
                    ? `${INCOME_MODE_LABELS.fixed}: ${formatMoney(draft.accidentIncome.fixedAmount)}`
                    : incomeMode === "average"
                      ? `${INCOME_MODE_LABELS.average}: ${formatMoney(draft.accidentIncome.averageNetResult)}`
                      : INCOME_MODE_LABELS[incomeMode] ?? incomeMode
                  : formatMoney(draft.nonWorkingSelectedIncome)
            }
          />
          {hasMoney && (
            <SummaryRow
              label="Günlük net gelir"
              value={formatMoney(displayMonetary!.dailyNetIncome)}
            />
          )}
          <SummaryRow
            label="TRH bakiye ömür (yıl/ay/gün)"
            value={
              deceasedLife
                ? formatTrhYmd({
                    year: deceasedLife.remainingLifetime.years,
                    month: deceasedLife.remainingLifetime.months,
                    day: deceasedLife.remainingLifetime.days,
                  })
                : "—"
            }
          />
          <SummaryRow
            label="TRH bakiye ömür (ondalık)"
            value={formatDecimalYears(deceasedLife?.remainingLifetime.decimalYears ?? null)}
          />
          <SummaryRow
            label="Müteveffanın muhtemel ömür sonu"
            value={formatDateIso(deceasedLifeEnd)}
          />
          <SummaryRow
            label="Müteveffa kusur oranı"
            value={formatPercent(displayMonetary?.deceasedFaultRate ?? draft.deceasedFaultRate ?? 0)}
          />
          {draft.deceased.gender === "male" && family.militaryStatus != null && (
            <SummaryRow
              label="Askerlik"
              value={
                family.militaryStatus === "COMPLETED"
                  ? [
                      "Yapıldı",
                      family.militaryServiceStartDate
                        ? `başlangıç ${formatDateIso(family.militaryServiceStartDate)}`
                        : null,
                      family.militaryServiceDurationMonths
                        ? `${family.militaryServiceDurationMonths} ay`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : "Yapılmadı"
              }
            />
          )}
          {family.hasChildren && (
            <SummaryRow
              label="Çocuk bilgisi"
              value={`${family.childrenCount || family.children.length} çocuk`}
            />
          )}
        </dl>
      </FormSection>

      <FormSection title="Hak Sahipleri ve Destek Süreleri">
        {beneficiaryLives.length === 0 ? (
          <EmptyTableNote text="Destek süresi verisi henüz yok. Pay Oranları adımındaki mevcut motor sonucu burada görünür." />
        ) : (
          <DataTableWrap>
            <table className={resultGridCls.table}>
              <colgroup>
                {BENEFICIARY_COL_PCTS.map((pct, i) => (
                  <col key={i} style={{ width: `${pct}%` }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>HAK SAHİBİ</th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>YAKINLIK</th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>
                    DAVACI /
                    <br />
                    DAVA DIŞI
                  </th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>DOĞUM TARİHİ</th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th} whitespace-normal`}>
                    KAZA TARİHİNDEKİ
                    <br />
                    YAŞ
                  </th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>CİNSİYET</th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>
                    TRH BAKİYE
                    <br />
                    ÖMÜR
                  </th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>
                    MUHTEMEL
                    <br />
                    ÖMÜR SONU
                  </th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>DESTEK SONU</th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>
                    EFEKTİF
                    <br />
                    DESTEK SONU
                  </th>
                </tr>
              </thead>
              <tbody>
                {beneficiaryLives.map((life) => {
                  const ben = beneficiaryById.get(life.personId);
                  const name = ben?.fullName?.trim() || ROLE_LABEL[life.role] || life.personId;
                  const relation = ben
                    ? RELATION_LABEL[ben.relation] ?? ben.relation
                    : ROLE_LABEL[life.role] ?? "—";
                  const claimant = ben ? resolveBeneficiaryClaimantStatus(ben) : null;
                  return (
                    <tr key={life.personId} className={resultGridCls.trHover}>
                      <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.al} whitespace-normal`}>
                        {name}
                      </td>
                      <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                        {relation}
                      </td>
                      <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                        {claimant === "PLAINTIFF"
                          ? "Davacı"
                          : claimant === "OUT_OF_CASE"
                            ? "Dava Dışı"
                            : "—"}
                      </td>
                      <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                        {formatDateIso(life.birthDate || ben?.birthDate)}
                      </td>
                      <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac} whitespace-normal`}>
                        {formatAgeAtAccident(life.ageAtAccident, life.birthDate || ben?.birthDate, draft.common.eventDate)}
                      </td>
                      <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                        {genderLabel(life.gender || ben?.gender)}
                      </td>
                      <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                        {formatTrhYmd({
                          year: life.remainingLifetime.years,
                          month: life.remainingLifetime.months,
                          day: life.remainingLifetime.days,
                        })}
                      </td>
                      <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                        {formatDateIso(life.probableLifeEndDate)}
                      </td>
                      <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                        {formatDateIso(life.supportEndDate)}
                      </td>
                      <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                        {formatDateIso(life.effectiveSupportEndDate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </DataTableWrap>
        )}
      </FormSection>

      {sharePrinciples && <TrafficDeathSharePrinciplesCard content={sharePrinciples} />}

      <FormSection title="Pay Dağılımı">
        {sharePeriods.length === 0 ? (
          <EmptyTableNote text="Pay dağılımı mevcut motor sonucundan henüz yüklenmedi." />
        ) : (
          <TrafficDeathShareRatiosTable columns={shareColumns} periods={sharePeriods} valueKey="shares" />
        )}
      </FormSection>

      <FormSection title="Yüzdesel Pay Dağılımı">
        {sharePeriods.length === 0 ? (
          <EmptyTableNote text="Yüzdesel pay dağılımı mevcut motor sonucundan henüz yüklenmedi." />
        ) : (
          <TrafficDeathShareRatiosTable
            columns={shareColumns}
            periods={sharePeriods}
            valueKey="percentages"
          />
        )}
      </FormSection>

      <FormSection title="Kusur ve Sorumluluk">
        <div className="rounded-[10px] border border-[#DCE3E8] bg-white px-3 py-2 space-y-0.5">
          <TotalRow label="Müteveffa kusuru" value={formatPercent(draft.deceasedFaultRate ?? 0)} />
          {selectedParties.map((p) => (
            <TotalRow
              key={p.id}
              label={TRAFFIC_DEATH_RESPONSIBLE_LABELS[p.type]}
              value={formatPercent(p.faultRatio)}
            />
          ))}
          <TotalRow label="Dava Dışı Kusur" value={formatPercent(draft.externalFaultRate ?? 0)} />
          <TotalRow label="Toplam" value={formatPercent(totalFault)} highlight />
        </div>
      </FormSection>

      <FormSection title="Ölüm Öncesi ve Cenaze Giderleri">
        {!hasExpenseInput && !hasMoney ? (
          <EmptyTableNote text="Bu adımda gider girilmedi." />
        ) : (
          <div className="rounded-[10px] border border-[#DCE3E8] bg-white px-3 py-2 space-y-2">
            <dl className="divide-y divide-[#DCE3E8]/40">
              <SummaryRow
                label={resolvePreDeathTreatmentName(expenses)}
                value={formatMoney(
                  hasMoney
                    ? (displayMonetary?.deathExpenses.grossPreDeathTreatment ??
                        displayMonetary?.deathExpenses.preDeathTreatment ??
                        expenses.preDeathTreatment ??
                        0)
                    : (expenses.preDeathTreatment ?? 0)
                )}
              />
              {expenses.otherExpenses.map((item) => (
                <SummaryRow key={item.id} label={item.name || "Diğer gider"} value={formatMoney(item.amount)} />
              ))}
              <SummaryRow
                label="Cenaze gideri"
                value={formatMoney(
                  hasMoney
                    ? (displayMonetary?.deathExpenses.grossFuneralCost ??
                        displayMonetary?.deathExpenses.funeralCost ??
                        expenses.funeralCost ??
                        0)
                    : (expenses.funeralCost ?? 0)
                )}
              />
            </dl>
            <p className="px-1 text-[12px] leading-relaxed text-[#C0392B]">
              {deathExpenseFaultNote(
                displayMonetary?.deceasedFaultRate ?? draft.deceasedFaultRate,
                hasMoney ? "past" : "future"
              )}
            </p>
          </div>
        )}
      </FormSection>

      <FormSection title="Sigorta ve Önceki Ödemeler">
        {!draft.insurance.company &&
        !draft.insurance.policyNumber &&
        !draft.insurance.coverageNotes &&
        draft.priorPayments.length === 0 ? (
          <EmptyTableNote text="Bu adımda ödeme / sigorta girilmedi." />
        ) : (
          <>
            {(draft.insurance.company ||
              draft.insurance.policyNumber ||
              draft.insurance.coverageNotes) && (
              <div className="rounded-[10px] border border-[#DCE3E8] bg-white px-3 py-2 mb-2">
                <dl className="divide-y divide-[#DCE3E8]/40">
                  {draft.insurance.company && (
                    <SummaryRow label="Sigorta şirketi" value={draft.insurance.company} />
                  )}
                  {draft.insurance.policyNumber && (
                    <SummaryRow label="Poliçe no" value={draft.insurance.policyNumber} />
                  )}
                  {draft.insurance.coverageNotes && (
                    <SummaryRow label="Teminat notu" value={draft.insurance.coverageNotes} />
                  )}
                </dl>
              </div>
            )}
            {draft.priorPayments.length > 0 && (
              <DataTableWrap>
                <table className={resultGridCls.table}>
                  <colgroup>
                    {PRIOR_PAYMENT_COL_PCTS.map((pct, i) => (
                      <col key={i} style={{ width: `${pct}%` }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>ÖDEME TÜRÜ</th>
                      <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>ÖDEYEN</th>
                      <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>TARİH</th>
                      <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>TUTAR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.priorPayments.map((p) => (
                      <tr key={p.id} className={resultGridCls.trHover}>
                        <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.al} whitespace-normal`}>
                          {p.paymentType || "—"}
                        </td>
                        <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.al} whitespace-normal`}>
                          {p.payer || "—"}
                        </td>
                        <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}>
                          {formatDateIso(p.date)}
                        </td>
                        <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar}`}>
                          {formatMoneyCell(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataTableWrap>
            )}
          </>
        )}
      </FormSection>

      <FormSection title="İşlemiş Dönem">
        {!hasMoney ? (
          <EmptyMotorNote />
        ) : displayMonetary!.processedPeriods.length === 0 ? (
          <EmptyTableNote text="İşlemiş dönem satırı yok." />
        ) : (
          <DeathProcessedPeriodTable rows={displayMonetary!.processedPeriods} />
        )}
      </FormSection>

      <FormSection title="İşleyecek Dönem">
        {!hasMoney ? (
          <EmptyMotorNote />
        ) : displayMonetary!.futurePeriods.length === 0 ? (
          <EmptyTableNote text="İşleyecek dönem satırı yok." />
        ) : (
          <DeathFuturePeriodTable rows={displayMonetary!.futurePeriods} />
        )}
      </FormSection>

      <MarriageProbabilityResultCard result={displayMonetary} hasMoney={hasMoney} />

      {hasMoney && displayMonetary ? <InsuranceMahsupCard result={displayMonetary} /> : null}

      <FormSection title="Hak Sahibi Bazlı Destekten Yoksun Kalma Zararı">
        {!hasMoney ? (
          <EmptyMotorNote />
        ) : displayMonetary!.claimantLosses.length === 0 ? (
          <EmptyTableNote text="Hak sahibi zarar satırı yok." />
        ) : (
          <DataTableWrap>
            <table className={resultGridCls.table} style={{ minWidth: "1280px" }}>
              <colgroup>
                {CLAIMANT_LOSS_COL_PCTS.map((pct, i) => (
                  <col key={i} style={{ width: `${pct}%` }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>HAK SAHİBİ</th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>İŞLEMİŞ</th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>İŞLEYECEK</th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th}`}>TOPLAM</th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th} whitespace-normal`}>
                    Müteveffa Kusur İndirimi
                    <br />
                    ({formatPercent(displayMonetary!.deceasedFaultRate)})
                  </th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th} whitespace-normal`}>
                    Evlenme İhtimali İndirimi
                    <br />
                    {displayMonetary!.marriageProbability?.applied
                      ? `(${formatPercent(displayMonetary!.marriageProbability.finalMarriageProbabilityRate)})`
                      : "(uygulanmadı)"}
                  </th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th} whitespace-normal`}>
                    Sigorta Şirketinden Ödenen Miktar
                  </th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th} whitespace-normal`}>
                    Kasko Şirketinden Ödenen Miktar
                  </th>
                  <th className={`${resultGridCls.cell} ${resultGridCls.th} whitespace-normal`}>
                    Mahsup Sonrası Kalan Zarar
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayMonetary!.claimantLosses.map((row) => (
                  <tr key={row.claimantId} className={resultGridCls.trHover}>
                    <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.al} whitespace-normal`}>
                      {row.claimantName}
                      {row.relationLabel ? ` (${row.relationLabel})` : ""}
                    </td>
                    <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar}`}>
                      {formatMoneyCell(row.processedLoss)}
                    </td>
                    <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar}`}>
                      {formatMoneyCell(row.futureLoss)}
                    </td>
                    <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar} font-medium`}>
                      {formatMoneyCell(row.totalLoss)}
                    </td>
                    <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar} font-medium`}>
                      {formatMoneyCell(row.lossAfterDeceasedFault)}
                    </td>
                    <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar} font-medium whitespace-normal`}>
                      {formatMoneyCell(row.lossAfterMarriageProbability ?? row.lossAfterDeceasedFault)}
                      {displayMonetary!.marriageProbability?.applied && row.marriageProbabilityApplied === false ? (
                        <div className="text-[11px] font-normal text-[#66727F]">uygulanmadı</div>
                      ) : null}
                    </td>
                    <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar}`}>
                      {formatMoneyCell(row.updatedZmtsPaymentAmount ?? 0)}
                    </td>
                    <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar}`}>
                      {formatMoneyCell(row.updatedCascoPaymentAmount ?? 0)}
                    </td>
                    <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ar} font-medium`}>
                      {formatMoneyCell(row.lossAfterInsurancePayments)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTableWrap>
        )}
      </FormSection>

      <FormSection title="Toplam ve İndirimler">
        {!hasMoney ? (
          <EmptyMotorNote />
        ) : (
          <div className="rounded-[10px] border border-[#DCE3E8] bg-white px-3 py-2 space-y-0.5">
            <div
              className={
                displayMonetary!.claimantLosses.length > 0
                  ? "pb-1.5 mb-0.5 border-b border-[#243746]/20"
                  : undefined
              }
            >
              {displayMonetary!.claimantLosses.map((row) => {
                const nameLabel = `${row.claimantName}${row.relationLabel ? ` (${row.relationLabel})` : ""}`;
                const afterMahsup =
                  row.lossAfterInsurancePayments ??
                  row.lossAfterMarriageProbability ??
                  row.lossAfterDeceasedFault ??
                  row.totalLoss;
                return (
                  <TotalRow
                    key={row.claimantId}
                    label={`${nameLabel} Toplam Zarar Tazminatı Miktarı`}
                    value={formatMoney(afterMahsup)}
                  />
                );
              })}
            </div>
            {displayMonetary!.garameResponsibilityShares?.zmts ? (
              <div className="pt-1">
                <p className="px-1 py-1 text-[13px] font-semibold text-[#111827]">
                  ZMTS — ZORUNLU MALİ TRAFİK SİGORTASI Sorumluluk Payları
                </p>
                {orderGarameSharesByClaimants(
                  displayMonetary!.garameResponsibilityShares.zmts.shares,
                  displayMonetary!.claimantLosses
                ).map((row) => {
                  const nameLabel = `${row.claimantName}${row.relationLabel ? ` (${row.relationLabel})` : ""}`;
                  return (
                    <TotalRow
                      key={`zmts-garame-${row.claimantId}`}
                      label={nameLabel}
                      value={formatMoney(row.responsibilityShare)}
                    />
                  );
                })}
              </div>
            ) : null}
            {displayMonetary!.garameResponsibilityShares?.casco ? (
              <div className="pt-1">
                <p className="px-1 py-1 text-[13px] font-semibold text-[#111827]">
                  Kasko Şirketi Sorumluluk Payları
                </p>
                {orderGarameSharesByClaimants(
                  displayMonetary!.garameResponsibilityShares.casco.shares,
                  displayMonetary!.claimantLosses
                ).map((row) => {
                  const nameLabel = `${row.claimantName}${row.relationLabel ? ` (${row.relationLabel})` : ""}`;
                  return (
                    <TotalRow
                      key={`casco-garame-${row.claimantId}`}
                      label={nameLabel}
                      value={formatMoney(row.responsibilityShare)}
                    />
                  );
                })}
              </div>
            ) : null}
            {displayMonetary!.marriageProbability?.applied ? (
              <p className="px-1 pt-1 text-[12.5px] leading-relaxed text-[#66727F]">
                Evlenme ihtimali indirimi eş için hak sahibi bazlı uygulanmıştır.
              </p>
            ) : null}
            <TotalRow
              label="Ölüm öncesi giderler"
              value={formatMoney(
                displayMonetary!.deathExpenses.preDeathTreatment +
                  displayMonetary!.deathExpenses.otherExpenses
              )}
            />
            <TotalRow
              label="Cenaze giderleri"
              value={formatMoney(displayMonetary!.deathExpenses.funeralCost)}
            />
            <p className="px-1 pt-1 text-[12px] leading-relaxed text-[#C0392B]">
              {deathExpenseFaultNote(displayMonetary!.deceasedFaultRate, "past")}
            </p>
            {displayMonetary!.insuranceDeductions ||
            displayMonetary!.psdTotal != null ||
            (displayMonetary!.updatedZmtsPaymentTotal ?? 0) > 0 ||
            (displayMonetary!.updatedCascoPaymentTotal ?? 0) > 0 ? (
              <>
                {displayMonetary!.psdTotal != null ? (
                  <TotalRow
                    label="Mahsup edilebilir PSD (kusur sonrası)"
                    value={formatMoney(displayMonetary!.psdDeductibleAfterFault ?? 0)}
                  />
                ) : null}
                {displayMonetary!.totalAfterClaimantInsurance != null ? (
                  <>
                    <TotalRow
                      label="Sigorta Şirketinden Ödenen Miktar"
                      value={formatMoney(displayMonetary!.updatedZmtsPaymentTotal ?? 0)}
                    />
                    <TotalRow
                      label="Kasko Şirketinden Ödenen Miktar"
                      value={formatMoney(displayMonetary!.updatedCascoPaymentTotal ?? 0)}
                    />
                    <TotalRow
                      label="Sigorta ve kasko mahsubu sonrası destek zararı"
                      value={formatMoney(displayMonetary!.totalAfterClaimantInsurance)}
                      highlight
                    />
                  </>
                ) : (
                  <>
                    <TotalRow
                      label="ZMTS faizli mahsup toplamı"
                      value={formatMoney(displayMonetary!.insuranceDeductions?.zmts.deductionTotal ?? 0)}
                    />
                    <TotalRow
                      label="Kasko faizli mahsup toplamı"
                      value={formatMoney(displayMonetary!.insuranceDeductions?.casco.deductionTotal ?? 0)}
                    />
                  </>
                )}
              </>
            ) : (
              <TotalRow
                label={
                  displayMonetary!.priorPaymentsApplied
                    ? "Sigorta / önceki ödeme mahsupları"
                    : "Sigorta / önceki ödeme mahsupları (uygulanmadı)"
                }
                value={formatMoney(displayMonetary!.priorPaymentsTotal)}
              />
            )}
          </div>
        )}
      </FormSection>
    </div>
  );
}
