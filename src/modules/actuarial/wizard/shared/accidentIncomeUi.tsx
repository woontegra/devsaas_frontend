import { useEffect, useMemo, useState } from "react";
import type {
  AccidentIncomeBlock,
  AverageIncomeKind,
  AverageIncomeSource,
  IncomeMode,
} from "../../types/calculationDraft";
import { newId } from "../../types/calculationDraft";
import { computeMonthlyNet } from "../../utils/grossToNet";
import { getNetMinWageForDate } from "../../../../data/netMinWage";
import {
  CurrencyInput,
  DeleteIconButton,
  FormField,
  FormSection,
  TextSelect,
  WarningAlert,
  formatTRY,
} from "./FormPrimitives";
import type { StepProps } from "./wizardTypes";
import { errorFor } from "./wizardTypes";

const AVERAGE_KINDS: { kind: AverageIncomeKind; label: string; multi: boolean }[] = [
  { kind: "min_wage", label: "Asgari Ücret", multi: false },
  { kind: "tuik", label: "TÜİK Verisi", multi: false },
  { kind: "union", label: "Sendika", multi: true },
  { kind: "witness", label: "Tanık", multi: true },
  { kind: "other", label: "Diğer", multi: false },
];

const formatCurrency = formatTRY;

function parseEventYearMonth(eventDate: string): [number, number] {
  const m = eventDate.match(/^(\d{4})-(\d{2})/);
  if (m && m[1] && m[2]) return [parseInt(m[1], 10), parseInt(m[2], 10)];
  const now = new Date();
  return [now.getFullYear(), now.getMonth() + 1];
}

function ensureDefaultSources(existing: AverageIncomeSource[]): AverageIncomeSource[] {
  const result = [...existing];
  for (const meta of AVERAGE_KINDS) {
    if (!result.some((s) => s.kind === meta.kind)) {
      result.push({
        id: newId(),
        kind: meta.kind,
        label: meta.label,
        amountKind: "net",
        amount: 0,
        netAmount: 0,
      });
    }
  }
  const kindOrder = AVERAGE_KINDS.map((k) => k.kind);
  result.sort((a, b) => kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind));
  return result;
}

function computeSourceNet(s: { amount: number; amountKind: string }, year: number, month: number): number {
  if (!s.amount || s.amount <= 0) return 0;
  if (s.amountKind === "net") return s.amount;
  return computeMonthlyNet(s.amount, year, month);
}

function computeAverage(
  sources: AverageIncomeSource[],
  year: number,
  month: number
): { filledCount: number; totalNet: number; average: number } {
  const filled = sources.filter((s) => s.amount > 0);
  const totalNet = filled.reduce((sum, s) => sum + computeSourceNet(s, year, month), 0);
  return {
    filledCount: filled.length,
    totalNet,
    average: filled.length > 0 ? totalNet / filled.length : 0,
  };
}

function AverageIncomeModal({
  initialSources,
  eventDate,
  onApply,
  onClose,
}: {
  initialSources: AverageIncomeSource[];
  eventDate: string;
  onApply: (sources: AverageIncomeSource[], averageNetResult: number) => void;
  onClose: () => void;
}) {
  const [sources, setSources] = useState<AverageIncomeSource[]>(() => ensureDefaultSources(initialSources));
  const [year, month] = useMemo(() => parseEventYearMonth(eventDate), [eventDate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const updateSource = (id: string, patch: Partial<AverageIncomeSource>) => {
    setSources((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const next = { ...s, ...patch };
        next.netAmount = computeSourceNet(next, year, month);
        return next;
      })
    );
  };

  const removeSource = (id: string) => {
    setSources((prev) => {
      const item = prev.find((s) => s.id === id);
      if (!item) return prev;
      if (prev.filter((s) => s.kind === item.kind).length <= 1) return prev;
      return prev.filter((s) => s.id !== id);
    });
  };

  const addSource = (kind: AverageIncomeKind) => {
    const meta = AVERAGE_KINDS.find((k) => k.kind === kind)!;
    const existing = sources.filter((s) => s.kind === kind);
    setSources((prev) => {
      let lastIdx = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i]!.kind === kind) {
          lastIdx = i;
          break;
        }
      }
      const entry: AverageIncomeSource = {
        id: newId(),
        kind,
        label: `${meta.label} ${existing.length + 1}`,
        amountKind: "net",
        amount: 0,
        netAmount: 0,
      };
      const next = [...prev];
      next.splice(lastIdx + 1, 0, entry);
      return next;
    });
  };

  const { filledCount, average } = computeAverage(sources, year, month);
  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
  ];
  const dateLabel = eventDate ? `${monthNames[month - 1] ?? month} ${year}` : "Tarih belirtilmedi";

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/40 border-0" aria-label="Kapat" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ortalama gelir kaynakları"
        className="relative w-full max-w-2xl max-h-[85vh] rounded-[14px] bg-white border border-slate-200 shadow-lg flex flex-col"
      >
        <div className="p-5 pb-3 border-b border-slate-100 shrink-0">
          <h3 className="text-[16px] font-semibold text-slate-800">Ortalama Gelir Kaynakları</h3>
          <p className="text-[13px] text-slate-500 mt-1">
            Kaza tarihi: <span className="font-medium">{dateLabel}</span>
            {" · "}Brüt tutarlar otomatik nete çevrilir.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {AVERAGE_KINDS.map((group) => {
            const rows = sources.filter((s) => s.kind === group.kind);
            return (
              <div key={group.kind}>
                <p className="text-[13px] font-semibold text-slate-700 mb-2">{group.label}</p>
                <div className="space-y-2">
                  {rows.map((s) => {
                    const net = computeSourceNet(s, year, month);
                    const canDelete = rows.length > 1;
                    return (
                      <div key={s.id} className="rounded-[10px] border border-slate-200 p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr_1fr] gap-2 items-end">
                          <FormField label="Tutar türü">
                            <TextSelect
                              value={s.amountKind}
                              onChange={(e) => updateSource(s.id, { amountKind: e.target.value as "net" | "gross" })}
                            >
                              <option value="net">Net</option>
                              <option value="gross">Brüt</option>
                            </TextSelect>
                          </FormField>
                          <FormField label="Tutar">
                            <CurrencyInput value={s.amount} onChange={(v) => updateSource(s.id, { amount: v })} />
                          </FormField>
                          <FormField label="Net karşılık">
                            <div className="w-full min-h-[42px] rounded-[8px] border border-slate-200 bg-slate-50 px-3 flex items-center justify-end text-[13px] text-slate-800">
                              {s.amount > 0 ? `₺${formatCurrency(net)}` : "—"}
                            </div>
                          </FormField>
                        </div>
                        {canDelete && (
                          <div className="mt-2">
                            <DeleteIconButton title="Kaynağı sil" onClick={() => removeSource(s.id)} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {group.multi && (
                  <button
                    type="button"
                    className="mt-2 text-[13px] font-medium text-blue-700 hover:text-blue-800"
                    onClick={() => addSource(group.kind)}
                  >
                    + {group.label} ekle
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="p-5 pt-3 border-t border-slate-100 shrink-0 space-y-3">
          <div className="flex items-center justify-between gap-4 text-[14px]">
            <span className="text-slate-600">
              Dolu kayıt: <span className="font-semibold text-slate-800">{filledCount}</span>
            </span>
            <span className="text-slate-600">
              Ortalama:{" "}
              <span className="font-semibold text-slate-800">
                {filledCount > 0 ? `₺${formatCurrency(average)}` : "—"}
              </span>
            </span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="btn-primary flex-1 min-h-[44px]"
              onClick={() => {
                const withNets = sources.map((s) => ({ ...s, netAmount: computeSourceNet(s, year, month) }));
                const { average: avg } = computeAverage(withNets, year, month);
                onApply(withNets, Math.round(avg * 100) / 100);
              }}
            >
              Uygula
            </button>
            <button type="button" className="btn-secondary flex-1 min-h-[44px]" onClick={onClose}>
              İptal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AccidentIncomeSection({
  income,
  eventDate,
  fieldErrors,
  onChange,
  fieldPrefix = "accidentIncome",
}: {
  income: AccidentIncomeBlock;
  eventDate: string;
  fieldErrors: StepProps["fieldErrors"];
  onChange: (next: AccidentIncomeBlock) => void;
  fieldPrefix?: string;
}) {
  const [avgModalOpen, setAvgModalOpen] = useState(false);
  const mode: IncomeMode = income.incomeMode ?? (income.useAverage ? "average" : "fixed");

  const selectMode = (m: IncomeMode) => {
    if (m === mode) return;
    if (m === "minWage") {
      onChange({ ...income, incomeMode: "minWage", fixedAmount: null, averageSources: [], averageNetResult: undefined });
    } else if (m === "fixed") {
      onChange({ ...income, incomeMode: "fixed", averageSources: [], averageNetResult: undefined });
    } else {
      onChange({ ...income, incomeMode: "average", fixedAmount: null });
      setAvgModalOpen(true);
    }
  };

  const modeBtn = (m: IncomeMode, label: string) => {
    const active = mode === m;
    return (
      <button
        type="button"
        onClick={() => selectMode(m)}
        className={`relative flex items-center gap-2 rounded-[8px] border px-3 py-2.5 text-left transition-all ${
          active
            ? "border-[#243746] bg-[#EEF2F4]/80 ring-1 ring-[#243746]/20"
            : "border-slate-200 bg-white hover:border-slate-300"
        }`}
      >
        <span
          className={`shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${
            active ? "border-[#243746]" : "border-slate-300"
          }`}
        >
          {active && <span className="h-1.5 w-1.5 rounded-full bg-[#243746]" />}
        </span>
        <span className={`text-[14px] font-medium ${active ? "text-[#1F2933]" : "text-slate-600"}`}>{label}</span>
      </button>
    );
  };

  const minWageAmount = eventDate ? getNetMinWageForDate(eventDate) : null;

  return (
    <FormSection title="Kaza Tarihindeki Gelir">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {modeBtn("minWage", "Asgari Ücret")}
        {modeBtn("fixed", "Sabit Ücret")}
        {modeBtn("average", "Ortalama Gelir")}
      </div>

      {mode === "minWage" && (
        <div className="mt-3 rounded-[10px] border border-slate-200 bg-slate-50/70 px-4 py-3">
          {!eventDate ? (
            <p className="text-[14px] text-amber-700">Önce kaza tarihini girin</p>
          ) : minWageAmount == null ? (
            <WarningAlert>{eventDate} tarihi için tanımlı asgari ücret dönemi bulunamadı.</WarningAlert>
          ) : (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-slate-500">
                Kaza Tarihindeki Net Asgari Ücret
              </p>
              <p className="mt-0.5 text-[18px] font-semibold tracking-tight text-[#243746]">
                {formatCurrency(minWageAmount)} TL
              </p>
            </div>
          )}
        </div>
      )}

      {mode === "fixed" && (
        <div className="mt-2.5">
          <FormField label="Tutar" error={errorFor(fieldErrors, `${fieldPrefix}.fixedAmount`)}>
            <CurrencyInput
              value={income.fixedAmount ?? 0}
              onChange={(v) => onChange({ ...income, fixedAmount: v === 0 ? null : v })}
            />
          </FormField>
        </div>
      )}

      {mode === "average" && (
        <div className="mt-3 flex items-center gap-3 rounded-[10px] border border-slate-200 bg-slate-50/70 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-slate-500">
              Hesaplanan Ortalama Net Gelir
            </p>
            <p className="mt-0.5 text-[18px] font-semibold tracking-tight text-[#243746]">
              {income.averageNetResult != null ? `₺${formatCurrency(income.averageNetResult)}` : "—"}
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-[8px] border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
            onClick={() => setAvgModalOpen(true)}
          >
            Kaynakları Düzenle
          </button>
        </div>
      )}

      {avgModalOpen && (
        <AverageIncomeModal
          initialSources={income.averageSources}
          eventDate={eventDate}
          onApply={(sources, averageNetResult) => {
            onChange({ ...income, incomeMode: "average", averageSources: sources, averageNetResult });
            setAvgModalOpen(false);
          }}
          onClose={() => setAvgModalOpen(false)}
        />
      )}
    </FormSection>
  );
}

export function ReadonlyEventMinWage({ eventDate, label }: { eventDate: string; label: string }) {
  const minWageAmount = eventDate ? getNetMinWageForDate(eventDate) : null;
  return (
    <div className="rounded-[10px] border border-slate-200 bg-slate-50/70 px-4 py-3">
      {!eventDate ? (
        <p className="text-[14px] text-amber-700">Önce kaza tarihini girin</p>
      ) : minWageAmount == null ? (
        <WarningAlert>{eventDate} tarihi için tanımlı asgari ücret dönemi bulunamadı.</WarningAlert>
      ) : (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-slate-500">{label}</p>
          <p className="mt-0.5 text-[18px] font-semibold tracking-tight text-[#243746]">
            {formatCurrency(minWageAmount)} TL
          </p>
        </div>
      )}
    </div>
  );
}
