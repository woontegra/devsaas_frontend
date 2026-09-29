import { useEffect, useMemo, useRef, useState } from "react";
import type { TrafficDeathDraft } from "../../types/calculationDraft";
import type { TrafficDeathShareRatioPeriod } from "../../types/trafficDeathShareRatios";
import {
  isUsableTrafficDeathPayResult,
  type TrafficDeathSupportPeriodsResponse,
} from "../../types/trafficDeathSupportPeriods";
import { requestTrafficDeathSupportPeriods } from "../../../../services/api";
import type { StepProps } from "./wizardTypes";
import {
  mergeTrafficDeathShareRatioColumns,
  type ShareRatioTableColumn,
} from "./trafficDeathShareRatioColumns";
import { TrafficDeathShareRatiosTable } from "./TrafficDeathShareRatiosTable";

function periodsFromResult(
  result: TrafficDeathSupportPeriodsResponse | null | undefined
): TrafficDeathShareRatioPeriod[] {
  return isUsableTrafficDeathPayResult(result) ? result.shareRatioPeriods ?? [] : [];
}

export function TrafficDeathShareRatiosStep({
  draft,
  trafficDeathSupportResult,
  onTrafficDeathSupportResult,
}: StepProps) {
  const td = draft.calculationType === "TRAFFIC_DEATH" ? (draft as TrafficDeathDraft) : null;
  const restoredPeriods = periodsFromResult(trafficDeathSupportResult);
  const restoredResultRef = useRef(trafficDeathSupportResult);
  restoredResultRef.current = trafficDeathSupportResult;

  const [periods, setPeriods] = useState<TrafficDeathShareRatioPeriod[]>(restoredPeriods);
  const [columns, setColumns] = useState<ShareRatioTableColumn[]>(() =>
    td
      ? mergeTrafficDeathShareRatioColumns(td, trafficDeathSupportResult?.columnKeys ?? [])
      : []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draftKey = useMemo(() => JSON.stringify(td), [td]);
  const resolvedColumns = columns.length ? columns : td ? mergeTrafficDeathShareRatioColumns(td) : [];

  useEffect(() => {
    if (!td) return;
    if (!isUsableTrafficDeathPayResult(trafficDeathSupportResult)) return;
    setPeriods(trafficDeathSupportResult.shareRatioPeriods ?? []);
    setColumns(mergeTrafficDeathShareRatioColumns(td, trafficDeathSupportResult.columnKeys ?? []));
  }, [td, trafficDeathSupportResult]);

  useEffect(() => {
    if (!td) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    requestTrafficDeathSupportPeriods(td)
      .then((res) => {
        if (cancelled) return;
        const next = res.shareRatioPeriods ?? [];
        if (next.length > 0) {
          setPeriods(next);
          setColumns(mergeTrafficDeathShareRatioColumns(td, res.columnKeys ?? []));
          onTrafficDeathSupportResult?.(res);
          setError(null);
          return;
        }
        const fallback = periodsFromResult(restoredResultRef.current);
        if (fallback.length === 0) setPeriods([]);
      })
      .catch((err: { message?: string }) => {
        if (cancelled) return;
        const fallback = periodsFromResult(restoredResultRef.current);
        if (fallback.length > 0) {
          setPeriods(fallback);
          setColumns(
            mergeTrafficDeathShareRatioColumns(td, restoredResultRef.current?.columnKeys ?? [])
          );
          setError(null);
          return;
        }
        setPeriods([]);
        setColumns(mergeTrafficDeathShareRatioColumns(td));
        setError(err.message ?? "Pay dönemleri hesaplanamadı.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [draftKey, td, onTrafficDeathSupportResult]);

  if (!td) return null;

  return (
    <div className="space-y-3">
      {loading && periods.length === 0 && (
        <p className="mb-3 text-[13px] text-[#66727F]">Pay oranları hesaplanıyor…</p>
      )}
      {error && (
        <div className="mb-3 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          {error}
        </div>
      )}
      {periods.length === 0 && !loading ? (
        <div className="ui-card p-4">
          <div className="rounded-[10px] border border-[#DCE3E8] bg-[#F5F7FA] px-4 py-8 text-center">
            <p className="text-[14px] font-medium text-[#1F2933]">Pay oranları henüz oluşturulmadı.</p>
            <p className="mt-2 text-[12.5px] text-[#66727F]">
              Pay oranları hesap motoru çalıştırıldığında otomatik oluşturulacaktır.
            </p>
          </div>
        </div>
      ) : periods.length === 0 ? null : (
        <>
          <div className="ui-card p-4">
            <h4 className="mb-3 text-[15px] font-semibold text-[#1F2933]">Pay Dağılımı</h4>
            <TrafficDeathShareRatiosTable
              columns={resolvedColumns}
              periods={periods}
              valueKey="shares"
            />
          </div>
          <div className="ui-card p-4 mt-6">
            <h4 className="mb-3 text-[15px] font-semibold text-[#1F2933]">Yüzdesel Pay Dağılımı</h4>
            <TrafficDeathShareRatiosTable
              columns={resolvedColumns}
              periods={periods}
              valueKey="percentages"
            />
          </div>
        </>
      )}
    </div>
  );
}
