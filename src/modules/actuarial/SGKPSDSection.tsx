import { useState } from "react";
import { uiText } from "../../config/uiText";
import type { SGKPSDYearlyRowPayload } from "../../services/api";

const t = uiText.result;
import { formatTRY } from "./wizard/shared/FormPrimitives";
const fmt = formatTRY;

interface SgkPSDSectionProps {
  sgkPSD: number;
  sgkYearlyTable?: SGKPSDYearlyRowPayload[];
}

function SgkPSDSectionComponent({ sgkPSD, sgkYearlyTable }: SgkPSDSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
          {t.sgkPSDTitle}
        </h3>
        <span className="text-base font-[300] text-gray-900 tabular-nums">
          {fmt(sgkPSD)} ₺
        </span>
      </div>
      {sgkYearlyTable && sgkYearlyTable.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="w-full px-3 py-2 text-[11px] font-normal text-gray-500 hover:bg-gray-50 flex items-center justify-between"
          >
            <span>Yıllık tablo</span>
            <span className="transition-transform">{open ? "▾" : "▸"}</span>
          </button>
          {open && (
            <div className="overflow-x-auto border-t border-gray-50">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-1.5 px-2 font-normal text-gray-500">Yıl</th>
                    <th className="text-right py-1.5 px-2 font-normal text-gray-500">Yaş</th>
                    <th className="text-right py-1.5 px-2 font-normal text-gray-500">Gelir</th>
                    <th className="text-right py-1.5 px-2 font-normal text-gray-500">İskonto</th>
                    <th className="text-right py-1.5 px-2 font-normal text-gray-500">Yaşam olas.</th>
                    <th className="text-right py-1.5 px-2 font-normal text-gray-500">Bugünkü değer</th>
                  </tr>
                </thead>
                <tbody>
                  {sgkYearlyTable.slice(0, 20).map((row) => (
                    <tr key={row.year} className="border-b border-gray-50 last:border-b-0">
                      <td className="py-1.5 px-2 tabular-nums">{row.year}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{row.age}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{fmt(row.income)}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{row.discountFactor.toFixed(4)}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{row.survivalProbability.toFixed(4)}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums font-[300]">{fmt(row.presentValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sgkYearlyTable.length > 20 && (
                <p className="px-3 py-2 text-[11px] text-gray-400">
                  +{sgkYearlyTable.length - 20} yıl daha
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export { SgkPSDSectionComponent as SgkPSDSection };
export { SgkPSDSectionComponent as SGKPSDSection };
