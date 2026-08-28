import { useMemo, useState } from "react";
import { uiText } from "../../config/uiText";
import type { YearlyActuarialTableRowPayload } from "../../services/api";

const t = uiText.table;
import { formatTRY } from "./wizard/shared/FormPrimitives";
const fmt = formatTRY;
const fmtFactor = (n: number) => n.toFixed(4);

interface YearlyActuarialTableProps {
  rows: YearlyActuarialTableRowPayload[];
}

const PAGE_SIZE = 15;

export function YearlyActuarialTable({ rows }: YearlyActuarialTableProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const slice = useMemo(() => {
    const start = page * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  if (rows.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-3 py-2.5 border-b border-gray-100">
        <h3 className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
          {t.sectionTitle}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left py-2 px-2 font-medium text-gray-600">{t.year}</th>
              <th className="text-right py-2 px-2 font-medium text-gray-600">{t.age}</th>
              <th className="text-right py-2 px-2 font-medium text-gray-600">{t.income}</th>
              <th className="text-right py-2 px-2 font-medium text-gray-600">{t.increasedIncome}</th>
              <th className="text-right py-2 px-2 font-medium text-gray-600">{t.discountFactor}</th>
              <th className="text-right py-2 px-2 font-medium text-gray-600">{t.survivalProbability}</th>
              <th className="text-right py-2 px-2 font-medium text-gray-600">{t.psd}</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <YearlyRow key={row.year} row={row} />
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
          <span className="text-[11px] text-gray-500">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, rows.length)} / {rows.length}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
            >
              Önceki
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function YearlyRow({ row }: { row: YearlyActuarialTableRowPayload }) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50">
      <td className="py-1.5 px-2 tabular-nums">{row.year}</td>
      <td className="py-1.5 px-2 text-right tabular-nums">{row.age}</td>
      <td className="py-1.5 px-2 text-right tabular-nums">{fmt(row.income)}</td>
      <td className="py-1.5 px-2 text-right tabular-nums">{fmt(row.increasedIncome)}</td>
      <td className="py-1.5 px-2 text-right tabular-nums">{fmtFactor(row.discountFactor)}</td>
      <td className="py-1.5 px-2 text-right tabular-nums">{fmtFactor(row.survivalProbability)}</td>
      <td className="py-1.5 px-2 text-right tabular-nums font-medium">{fmt(row.faultAdjustedValue)}</td>
    </tr>
  );
}
