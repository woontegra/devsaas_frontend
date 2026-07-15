import { useEffect, useMemo, useState } from "react";
import type {
  AccidentIncomeBlock,
  AverageIncomeKind,
  AverageIncomeSource,
  CalculationDraft,
  CaregiverExpenseRow,
  DefendantType,
  ExpenseItem,
  LiableParty,
  TemporaryIncapacityPeriod,
  TrafficInjuryDraft,
} from "../../types/calculationDraft";
import { newId } from "../../types/calculationDraft";
import { computeMonthlyNet } from "../../utils/grossToNet";
import {
  AddRowButton,
  FormField,
  FormSection,
  TextInput,
  TextSelect,
  WarningAlert,
} from "./FormPrimitives";
import type { StepProps } from "./wizardTypes";
import { errorFor } from "./wizardTypes";

// ─── Sabitler ────────────────────────────────────────────────────────

const DEFENDANT_LABELS: Record<DefendantType, string> = {
  INDIVIDUAL_DRIVER: "Gerçek Kişi Şoför",
  INDIVIDUAL_VEHICLE_OWNER: "Gerçek Kişi Araç sahibi",
  CORPORATE_VEHICLE_OWNER: "Tüzel Kişi Araç sahibi",
  COMPULSORY_TRAFFIC_INSURER: "Sigorta şirketi (ZMTS)",
  CASCO_INSURER: "Sigorta şirketi (Kasko Şirketi)",
};

const AVERAGE_KINDS: { kind: AverageIncomeKind; label: string; multi: boolean }[] = [
  { kind: "min_wage", label: "Asgari Ücret", multi: false },
  { kind: "tuik", label: "TÜİK Verisi", multi: false },
  { kind: "union", label: "Sendika", multi: true },
  { kind: "witness", label: "Tanık", multi: true },
  { kind: "other", label: "Diğer", multi: false },
];

// ─── Yardımcılar ────────────────────────────────────────────────────

function asTraffic(draft: CalculationDraft): TrafficInjuryDraft | null {
  return draft.calculationType === "TRAFFIC_INJURY" ? draft : null;
}

function inclusiveDayCount(start: string, end: string): number | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return undefined;
  const a = new Date(`${start}T00:00:00.000Z`).getTime();
  const b = new Date(`${end}T00:00:00.000Z`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return undefined;
  return Math.round((b - a) / 86400000) + 1;
}

function emptyExpense(): ExpenseItem {
  return { id: newId(), name: "", amount: 0 };
}

function emptyCaregiver(): CaregiverExpenseRow {
  return { id: newId(), startDate: "", endDate: "", amount: 0 };
}

function emptyTemp(): TemporaryIncapacityPeriod {
  return { id: newId(), startDate: "", endDate: "", dayCount: undefined };
}

function parseEventYearMonth(eventDate: string): [number, number] {
  const m = eventDate.match(/^(\d{4})-(\d{2})/);
  if (m && m[1] && m[2]) return [parseInt(m[1], 10), parseInt(m[2], 10)];
  const now = new Date();
  return [now.getFullYear(), now.getMonth() + 1];
}

function formatCurrency(v: number): string {
  return v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function syncLiabilityParties(draft: TrafficInjuryDraft): TrafficInjuryDraft {
  const types = [...new Set(draft.parties.defendants.map((d) => d.type))];
  const parties: LiableParty[] = types.map((t) => {
    const name = DEFENDANT_LABELS[t];
    const existing = draft.liability.parties.find((p) => p.name === name);
    return {
      id: existing?.id ?? `def-${t}`,
      partyType: "defendant" as const,
      name,
      faultRatio: existing?.faultRatio ?? 0,
    };
  });
  return { ...draft, liability: { ...draft.liability, parties } };
}

/** Modal açılırken her kaynak türü için en az 1 satır oluştur */
function ensureDefaultSources(existing: AverageIncomeSource[]): AverageIncomeSource[] {
  const result = [...existing];
  for (const meta of AVERAGE_KINDS) {
    const hasKind = result.some((s) => s.kind === meta.kind);
    if (!hasKind) {
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
  result.sort((a, b) => {
    const ai = kindOrder.indexOf(a.kind);
    const bi = kindOrder.indexOf(b.kind);
    return ai - bi;
  });
  return result;
}

function computeSourceNet(
  s: { amount: number; amountKind: string },
  year: number,
  month: number
): number {
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

// ─── Ana bileşen ────────────────────────────────────────────────────

export function TrafficCalculationInfoStep({ draft, onChange, fieldErrors }: StepProps) {
  const raw = asTraffic(draft);
  const [avgModalOpen, setAvgModalOpen] = useState(false);

  useEffect(() => {
    if (!raw) return;
    const synced = syncLiabilityParties(raw);
    const same =
      synced.liability.parties.length === raw.liability.parties.length &&
      synced.liability.parties.every(
        (p, i) => p.name === raw.liability.parties[i]?.name && p.id === raw.liability.parties[i]?.id
      );
    if (!same) onChange(synced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw?.parties.defendants.map((d) => d.type).join("|")]);

  if (!raw) return null;
  const ti = syncLiabilityParties(raw);

  const patch = (next: TrafficInjuryDraft) => onChange(next);

  const setCommonEvent = (eventDate: string) =>
    patch({ ...ti, common: { ...ti.common, eventDate } });

  const plaintiffName = [ti.parties.plaintiff.firstName, ti.parties.plaintiff.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const plaintiffFault = ti.liability.injuredFaultRatio ?? 0;
  const defendantFaultSum = ti.liability.parties.reduce(
    (s, p) => s + (Number(p.faultRatio) || 0),
    0
  );
  const totalFault = plaintiffFault + defendantFaultSum;
  const faultWarn = Math.abs(totalFault - 100) > 0.001;

  const setPlaintiffFault = (v: number) =>
    patch({ ...ti, liability: { ...ti.liability, injuredFaultRatio: v } });

  const setDefendantFault = (id: string, v: number) =>
    patch({
      ...ti,
      liability: {
        ...ti.liability,
        parties: ti.liability.parties.map((p) => (p.id === id ? { ...p, faultRatio: v } : p)),
      },
    });

  const setTemps = (temporaryIncapacityPeriods: TemporaryIncapacityPeriod[]) =>
    patch({ ...ti, temporaryIncapacityPeriods });

  const updateTemp = (
    id: string,
    patchRow: Partial<TemporaryIncapacityPeriod>,
    autoDays = false
  ) => {
    setTemps(
      ti.temporaryIncapacityPeriods.map((row) => {
        if (row.id !== id) return row;
        const next = { ...row, ...patchRow };
        if (autoDays) {
          const days = inclusiveDayCount(next.startDate, next.endDate);
          if (days != null) next.dayCount = days;
        }
        return next;
      })
    );
  };

  const income = ti.accidentIncome;
  const setIncome = (accidentIncome: AccidentIncomeBlock) => patch({ ...ti, accidentIncome });

  const hospital = ti.hospitalExpenses;
  const travel = ti.travelExpenses;
  const caregivers = ti.caregiverExpenses;

  return (
    <div className="space-y-4">
      {/* ── Kaza Tarihi ── */}
      <FormSection title="Kaza Tarihi">
        <FormField label="Kaza tarihi" required error={errorFor(fieldErrors, "common.eventDate")}>
          <TextInput
            type="date"
            value={ti.common.eventDate}
            onChange={(e) => setCommonEvent(e.target.value)}
          />
        </FormField>
      </FormSection>

      {/* ── Kusur Oranları ── */}
      <FormSection title="Kusur Oranları">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <p className="flex-1 text-[14px] font-medium text-slate-800">
              Davacı{plaintiffName ? ` — ${plaintiffName}` : ""}
            </p>
            <div className="flex items-center gap-2 w-full sm:w-40">
              <TextInput
                type="number"
                min={0}
                max={100}
                inputMode="decimal"
                value={plaintiffFault}
                onChange={(e) => setPlaintiffFault(Number(e.target.value))}
              />
              <span className="text-[13px] text-slate-500">%</span>
            </div>
          </div>

          {ti.liability.parties.length === 0 && (
            <p className="text-[13px] text-slate-500">
              İlk adımda davalı türü seçildiğinde burada listelenir.
            </p>
          )}

          {ti.liability.parties.map((p) => (
            <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <p className="flex-1 text-[14px] font-medium text-slate-800">{p.name}</p>
              <div className="flex items-center gap-2 w-full sm:w-40">
                <TextInput
                  type="number"
                  min={0}
                  max={100}
                  inputMode="decimal"
                  value={p.faultRatio}
                  onChange={(e) => setDefendantFault(p.id, Number(e.target.value))}
                />
                <span className="text-[13px] text-slate-500">%</span>
              </div>
            </div>
          ))}

          {faultWarn && (
            <WarningAlert>
              Kusur oranları toplamı %{totalFault.toFixed(0)}. Toplam %100 olmalıdır (otomatik
              düzeltilmez).
            </WarningAlert>
          )}
        </div>
      </FormSection>

      {/* ── Hastane Raporları ── */}
      <FormSection title="Hastane Raporları">
        <p className="text-[13px] font-medium text-slate-700 mb-3">Geçici İş Göremezlik</p>
        <div className="space-y-3">
          {ti.temporaryIncapacityPeriods.map((row) => (
            <div
              key={row.id}
              className="rounded-[12px] border border-slate-200 p-3.5 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField label="Başlangıç tarihi">
                  <TextInput
                    type="date"
                    value={row.startDate}
                    onChange={(e) => updateTemp(row.id, { startDate: e.target.value }, true)}
                  />
                </FormField>
                <FormField label="Bitiş tarihi">
                  <TextInput
                    type="date"
                    value={row.endDate}
                    onChange={(e) => updateTemp(row.id, { endDate: e.target.value }, true)}
                  />
                </FormField>
                <FormField label="Gün sayısı">
                  <TextInput
                    type="number"
                    inputMode="numeric"
                    value={row.dayCount ?? ""}
                    onChange={(e) =>
                      updateTemp(row.id, {
                        dayCount: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                  />
                </FormField>
              </div>
              <button
                type="button"
                className="text-[12px] font-medium text-red-600"
                onClick={() =>
                  setTemps(ti.temporaryIncapacityPeriods.filter((x) => x.id !== row.id))
                }
              >
                Sil
              </button>
            </div>
          ))}
          <AddRowButton
            label="Yeni dönem ekle"
            onClick={() => setTemps([...ti.temporaryIncapacityPeriods, emptyTemp()])}
          />
        </div>
      </FormSection>

      {/* ── Maluliyet ── */}
      <FormSection title="Maluliyet">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Maluliyet başlangıç"
            error={errorFor(fieldErrors, "disability.disabilityStartDate")}
          >
            <TextInput
              type="date"
              value={ti.disability.disabilityStartDate ?? ""}
              onChange={(e) =>
                patch({
                  ...ti,
                  disability: { ...ti.disability, disabilityStartDate: e.target.value },
                })
              }
            />
          </FormField>
          <FormField
            label="E cetveline göre (%)"
            required
            error={errorFor(fieldErrors, "disability.permanentDisabilityRate")}
          >
            <TextInput
              type="number"
              min={0}
              max={100}
              inputMode="decimal"
              value={ti.disability.permanentDisabilityRate ?? ""}
              onChange={(e) =>
                patch({
                  ...ti,
                  disability: {
                    ...ti.disability,
                    permanentDisabilityRate:
                      e.target.value === "" ? undefined : Number(e.target.value),
                  },
                })
              }
            />
          </FormField>
        </div>
      </FormSection>

      {/* ── Kaza Tarihindeki Gelir ── */}
      <FormSection title="Kaza Tarihindeki Gelir">
        {/* Seçim kartları */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (!income.useAverage) return;
              setIncome({
                ...income,
                useAverage: false,
                averageSources: [],
                averageNetResult: undefined,
              });
            }}
            className={`relative flex items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5 text-left transition-all ${
              !income.useAverage
                ? "border-blue-800 bg-blue-50/60 ring-1 ring-blue-800/20"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <span
              className={`shrink-0 h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center transition-colors ${
                !income.useAverage ? "border-blue-800" : "border-slate-300"
              }`}
            >
              {!income.useAverage && (
                <span className="h-2 w-2 rounded-full bg-blue-800" />
              )}
            </span>
            <span
              className={`text-[13px] font-medium ${
                !income.useAverage ? "text-blue-900" : "text-slate-600"
              }`}
            >
              Sabit gelir
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (income.useAverage) return;
              setIncome({ ...income, useAverage: true, fixedAmount: null });
              setAvgModalOpen(true);
            }}
            className={`relative flex items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5 text-left transition-all ${
              income.useAverage
                ? "border-blue-800 bg-blue-50/60 ring-1 ring-blue-800/20"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <span
              className={`shrink-0 h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center transition-colors ${
                income.useAverage ? "border-blue-800" : "border-slate-300"
              }`}
            >
              {income.useAverage && (
                <span className="h-2 w-2 rounded-full bg-blue-800" />
              )}
            </span>
            <span
              className={`text-[13px] font-medium ${
                income.useAverage ? "text-blue-900" : "text-slate-600"
              }`}
            >
              Ortalama gelir
            </span>
          </button>
        </div>

        {/* Sabit gelir inputu */}
        {!income.useAverage && (
          <div className="mt-3">
            <FormField
              label="Tutar"
              error={errorFor(fieldErrors, "accidentIncome.fixedAmount")}
            >
              <TextInput
                type="number"
                inputMode="decimal"
                value={income.fixedAmount ?? ""}
                onChange={(e) =>
                  setIncome({
                    ...income,
                    fixedAmount: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </FormField>
          </div>
        )}

        {/* Ortalama gelir özet kartı */}
        {income.useAverage && (
          <div className="mt-3 flex items-center gap-3 rounded-[10px] border border-slate-200 bg-slate-50/70 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-slate-500">
                Hesaplanan Ortalama Net Gelir
              </p>
              <p className="mt-0.5 text-[18px] font-semibold tracking-tight text-blue-900">
                {income.averageNetResult != null
                  ? `₺${formatCurrency(income.averageNetResult)}`
                  : "—"}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-[8px] border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
              onClick={() => setAvgModalOpen(true)}
            >
              Kaynakları Düzenle
            </button>
          </div>
        )}
      </FormSection>

      {/* ── Masraflar ── */}
      <FormSection title="Masraflar">
        <ExpenseList
          title="Hastane masrafı"
          rows={hospital}
          onChange={(hospitalExpenses) => patch({ ...ti, hospitalExpenses })}
        />
        <div className="mt-5">
          <ExpenseList
            title="Yol masrafı"
            rows={travel}
            onChange={(travelExpenses) => patch({ ...ti, travelExpenses })}
          />
        </div>
        <div className="mt-5">
          <p className="text-[13px] font-medium text-slate-700 mb-2">Bakıcı masrafı</p>
          <div className="space-y-3">
            {caregivers.map((row) => (
              <div
                key={row.id}
                className="rounded-[12px] border border-slate-200 p-3.5 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField label="Başlangıç tarihi">
                    <TextInput
                      type="date"
                      value={row.startDate}
                      onChange={(e) =>
                        patch({
                          ...ti,
                          caregiverExpenses: caregivers.map((x) =>
                            x.id === row.id ? { ...x, startDate: e.target.value } : x
                          ),
                        })
                      }
                    />
                  </FormField>
                  <FormField label="Bitiş tarihi">
                    <TextInput
                      type="date"
                      value={row.endDate}
                      onChange={(e) =>
                        patch({
                          ...ti,
                          caregiverExpenses: caregivers.map((x) =>
                            x.id === row.id ? { ...x, endDate: e.target.value } : x
                          ),
                        })
                      }
                    />
                  </FormField>
                  <FormField label="Ücret">
                    <TextInput
                      type="number"
                      inputMode="decimal"
                      value={row.amount}
                      onChange={(e) =>
                        patch({
                          ...ti,
                          caregiverExpenses: caregivers.map((x) =>
                            x.id === row.id ? { ...x, amount: Number(e.target.value) } : x
                          ),
                        })
                      }
                    />
                  </FormField>
                </div>
                <button
                  type="button"
                  className="text-[12px] font-medium text-red-600"
                  onClick={() =>
                    patch({
                      ...ti,
                      caregiverExpenses: caregivers.filter((x) => x.id !== row.id),
                    })
                  }
                >
                  Sil
                </button>
              </div>
            ))}
            <AddRowButton
              label="Bakıcı masrafı ekle"
              onClick={() =>
                patch({ ...ti, caregiverExpenses: [...caregivers, emptyCaregiver()] })
              }
            />
          </div>
        </div>
      </FormSection>

      {/* ── Ortalama gelir modalı ── */}
      {avgModalOpen && (
        <AverageIncomeModal
          initialSources={income.averageSources}
          eventDate={ti.common.eventDate}
          onApply={(sources, averageNetResult) => {
            setIncome({ ...income, useAverage: true, averageSources: sources, averageNetResult });
            setAvgModalOpen(false);
          }}
          onClose={() => setAvgModalOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Masraf listesi ──────────────────────────────────────────────────

function ExpenseList({
  title,
  rows,
  onChange,
}: {
  title: string;
  rows: ExpenseItem[];
  onChange: (rows: ExpenseItem[]) => void;
}) {
  return (
    <div>
      <p className="text-[13px] font-medium text-slate-700 mb-2">{title}</p>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-[12px] border border-slate-200 p-3.5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Açıklama">
                <TextInput
                  value={row.name}
                  onChange={(e) =>
                    onChange(
                      rows.map((x) => (x.id === row.id ? { ...x, name: e.target.value } : x))
                    )
                  }
                />
              </FormField>
              <FormField label="Tutar">
                <TextInput
                  type="number"
                  inputMode="decimal"
                  value={row.amount}
                  onChange={(e) =>
                    onChange(
                      rows.map((x) =>
                        x.id === row.id ? { ...x, amount: Number(e.target.value) } : x
                      )
                    )
                  }
                />
              </FormField>
            </div>
            <button
              type="button"
              className="text-[12px] font-medium text-red-600"
              onClick={() => onChange(rows.filter((x) => x.id !== row.id))}
            >
              Sil
            </button>
          </div>
        ))}
        <AddRowButton label={`${title} ekle`} onClick={() => onChange([...rows, emptyExpense()])} />
      </div>
    </div>
  );
}

// ─── Ortalama gelir modalı ───────────────────────────────────────────

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
  const [sources, setSources] = useState<AverageIncomeSource[]>(() =>
    ensureDefaultSources(initialSources)
  );

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
      const sameKindCount = prev.filter((s) => s.kind === item.kind).length;
      if (sameKindCount <= 1) return prev;
      return prev.filter((s) => s.id !== id);
    });
  };

  const addSource = (kind: AverageIncomeKind) => {
    const meta = AVERAGE_KINDS.find((k) => k.kind === kind)!;
    const existing = sources.filter((s) => s.kind === kind);
    setSources((prev) => {
      let lastIdx = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i]!.kind === kind) { lastIdx = i; break; }
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

  const handleApply = () => {
    const withNets = sources.map((s) => ({
      ...s,
      netAmount: computeSourceNet(s, year, month),
    }));
    const { average: avg } = computeAverage(withNets, year, month);
    onApply(withNets, Math.round(avg * 100) / 100);
  };

  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
  ];
  const dateLabel = eventDate
    ? `${monthNames[month - 1] ?? month} ${year}`
    : "Tarih belirtilmedi";

  const groupedKinds = AVERAGE_KINDS.map((meta) => ({
    ...meta,
    rows: sources.filter((s) => s.kind === meta.kind),
  }));

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 border-0"
        aria-label="Kapat"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ortalama gelir kaynakları"
        className="relative w-full max-w-2xl max-h-[85vh] rounded-[14px] bg-white border border-slate-200 shadow-lg flex flex-col"
      >
        {/* Başlık */}
        <div className="p-5 pb-3 border-b border-slate-100 shrink-0">
          <h3 className="text-[16px] font-semibold text-slate-800">Ortalama Gelir Kaynakları</h3>
          <p className="text-[13px] text-slate-500 mt-1">
            Kaza tarihi: <span className="font-medium">{dateLabel}</span>
            {" · "}Brüt tutarlar otomatik nete çevrilir.
          </p>
        </div>

        {/* İçerik */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {groupedKinds.map((group) => (
            <div key={group.kind}>
              <p className="text-[13px] font-semibold text-slate-700 mb-2">{group.label}</p>
              <div className="space-y-2">
                {group.rows.map((s) => {
                  const net = computeSourceNet(s, year, month);
                  const canDelete = group.rows.length > 1;
                  return (
                    <div
                      key={s.id}
                      className="rounded-[10px] border border-slate-200 p-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr_1fr] gap-2 items-end">
                        <FormField label="Tutar türü">
                          <TextSelect
                            value={s.amountKind}
                            onChange={(e) =>
                              updateSource(s.id, {
                                amountKind: e.target.value as "net" | "gross",
                              })
                            }
                          >
                            <option value="net">Net</option>
                            <option value="gross">Brüt</option>
                          </TextSelect>
                        </FormField>
                        <FormField label="Tutar">
                          <TextInput
                            type="number"
                            inputMode="decimal"
                            value={s.amount || ""}
                            onChange={(e) =>
                              updateSource(s.id, {
                                amount:
                                  e.target.value === "" ? 0 : Number(e.target.value),
                              })
                            }
                          />
                        </FormField>
                        <FormField label="Net karşılık">
                          <div className="w-full min-h-[46px] rounded-[9px] border border-slate-200 bg-slate-50 px-3.5 flex items-center text-[14px] text-slate-800">
                            {s.amount > 0 ? `₺${formatCurrency(net)}` : "—"}
                          </div>
                        </FormField>
                      </div>
                      {canDelete && (
                        <button
                          type="button"
                          className="text-[12px] font-medium text-red-600 mt-2"
                          onClick={() => removeSource(s.id)}
                        >
                          Sil
                        </button>
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
          ))}
        </div>

        {/* Alt bilgi */}
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
              onClick={handleApply}
            >
              Uygula
            </button>
            <button
              type="button"
              className="btn-secondary flex-1 min-h-[44px]"
              onClick={onClose}
            >
              İptal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
