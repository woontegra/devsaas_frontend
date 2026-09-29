import type { TrafficDeathShareRatioPeriod } from "../../types/trafficDeathShareRatios";
import type { ShareRatioTableColumn } from "./trafficDeathShareRatioColumns";
import { formatDateIso } from "../../utils/formatDisplay";
import { DataTableWrap, resultGridCls } from "./FormPrimitives";

function formatPeriodRange(startDate: string, endDate: string): string {
  const start = formatDateIso(startDate);
  const end = formatDateIso(endDate);
  if (start === "—" && end === "—") return "—";
  if (start === end) return start;
  return `${start} — ${end}`;
}

function ClaimantBadge({ status }: { status: "PLAINTIFF" | "OUT_OF_CASE" }) {
  const isPlaintiff = status === "PLAINTIFF";
  return (
    <span
      className={`inline-block mt-1 rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wide ${
        isPlaintiff
          ? "bg-[#EEF2F4] text-[#243746] border border-[#243746]/20"
          : "bg-[#F5F7FA] text-[#66727F] border border-[#DCE3E8]"
      }`}
    >
      {isPlaintiff ? "Davacı" : "Dava dışı"}
    </span>
  );
}

export function TrafficDeathShareRatiosTable({
  columns,
  periods,
  valueKey = "shares",
}: {
  columns: ShareRatioTableColumn[];
  periods: TrafficDeathShareRatioPeriod[];
  valueKey?: "shares" | "percentages";
}) {
  const personColumns = columns;

  if (periods.length === 0) {
    return null;
  }

  return (
    <DataTableWrap>
      <table className={`${resultGridCls.table} table-auto min-w-[640px]`}>
        <thead>
          <tr>
            <th className={`${resultGridCls.cell} ${resultGridCls.th} min-w-[148px]`}>SÜRE</th>
            {personColumns.map((col) => (
              <th key={col.key} className={`${resultGridCls.cell} ${resultGridCls.th} min-w-[96px]`}>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="tracking-wide">{col.header}</span>
                  {col.subLabel && (
                    <span className="text-[10px] font-normal text-[#66727F] normal-case tracking-normal">
                      {col.subLabel}
                    </span>
                  )}
                  {col.claimantStatus && <ClaimantBadge status={col.claimantStatus} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((row, rowIndex) => (
            <tr
              key={`${row.startDate}-${row.endDate}-${rowIndex}`}
              className={resultGridCls.trHover}
            >
              <td className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac} whitespace-normal`}>
                <div className="tabular-nums leading-snug">
                  {formatPeriodRange(row.startDate, row.endDate)}
                </div>
                {row.label && (
                  <div className="mt-0.5 text-[10px] font-normal text-[#66727F] whitespace-normal">
                    {row.label}
                  </div>
                )}
              </td>
              {personColumns.map((col) => (
                <td
                  key={col.key}
                  className={`${resultGridCls.cell} ${resultGridCls.td} ${resultGridCls.ac}`}
                >
                  {(valueKey === "percentages" ? row.percentages?.[col.key] : row.shares[col.key])?.trim() ||
                    "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </DataTableWrap>
  );
}
