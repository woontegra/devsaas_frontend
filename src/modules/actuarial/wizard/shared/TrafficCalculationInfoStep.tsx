import { useEffect, useMemo, useState } from "react";
import type {
  AccidentIncomeBlock,
  AverageIncomeKind,
  AverageIncomeSource,
  CalculationDraft,
  CaregiverExpenseRow,
  DefendantType,
  ExpenseItem,
  IncomeMode,
  LiableParty,
  TemporaryIncapacityPeriod,
  TrafficInjuryDraft,
} from "../../types/calculationDraft";
import { newId } from "../../types/calculationDraft";
import { computeMonthlyNet } from "../../utils/grossToNet";
import { actuarialDays360Inclusive } from "../../utils/actuarialDayCount360";
import { getNetMinWageForDate } from "../../../../data/netMinWage";
import {
  AddRowButton,
  CurrencyInput,
  DeleteIconButton,
  FormField,
  FormSection,
  TextInput,
  TextSelect,
  WarningAlert,
  formatTRY,
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
  const days = actuarialDays360Inclusive(start, end);
  return days > 0 ? days : undefined;
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

const formatCurrency = formatTRY;

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

  const setCommonEvent = (eventDate: string) => {
    let calculationDate = ti.common.calculationDate;
    if (calculationDate && eventDate && calculationDate < eventDate) {
      calculationDate = eventDate;
    }
    patch({ ...ti, common: { ...ti.common, eventDate, calculationDate } });
  };

  const setCalculationDate = (calculationDate: string) => {
    patch({ ...ti, common: { ...ti.common, calculationDate } });
  };

  const processedStart = ti.processedPeriodStartDate ?? ti.common.eventDate;
  const processedEnd = ti.processedPeriodEndDate ?? ti.common.calculationDate;

  const setProcessedStart = (processedPeriodStartDate: string) => {
    patch({ ...ti, processedPeriodStartDate: processedPeriodStartDate || undefined });
  };

  const setProcessedEnd = (processedPeriodEndDate: string) => {
    patch({ ...ti, processedPeriodEndDate: processedPeriodEndDate || undefined });
  };

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

  /* Hastane raporları: en az 1 boş dönem */
  useEffect(() => {
    if (ti.temporaryIncapacityPeriods.length === 0) {
      setTemps([emptyTemp()]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      {/* Sol / sağ bağımsız kolonlar; masraflar altta tam genişlik */}
      <div className="calc-info-columns">
        <div className="calc-info-column">
        <FormSection title="Kaza ve Hesap Tarihleri">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Kaza tarihi" required error={errorFor(fieldErrors, "common.eventDate")}>
              <TextInput
                type="date"
                value={ti.common.eventDate}
                onChange={(e) => setCommonEvent(e.target.value)}
              />
            </FormField>
            <FormField label="Hesap tarihi" required error={errorFor(fieldErrors, "common.calculationDate")}>
              <TextInput
                type="date"
                min={ti.common.eventDate || undefined}
                value={ti.common.calculationDate}
                onChange={(e) => setCalculationDate(e.target.value)}
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="İşlemiş Dönem">
          <p className="text-[12px] font-normal text-[#6B7280] mb-2">
            Boş bırakılırsa başlangıç kaza tarihi, bitiş hesap tarihi kullanılır.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="İşlemiş dönem başlangıcı"
              error={errorFor(fieldErrors, "processedPeriodStartDate")}
            >
              <TextInput
                type="date"
                min={ti.common.eventDate || undefined}
                max={processedEnd || ti.common.calculationDate || undefined}
                value={ti.processedPeriodStartDate ?? ""}
                onChange={(e) => setProcessedStart(e.target.value)}
              />
            </FormField>
            <FormField
              label="İşlemiş dönem bitişi"
              error={errorFor(fieldErrors, "processedPeriodEndDate")}
            >
              <TextInput
                type="date"
                min={processedStart || ti.common.eventDate || undefined}
                max={ti.common.calculationDate || undefined}
                value={ti.processedPeriodEndDate ?? ""}
                onChange={(e) => setProcessedEnd(e.target.value)}
              />
            </FormField>
          </div>
          {(ti.processedPeriodStartDate || ti.processedPeriodEndDate) && (
            <p className="text-[11.5px] text-[#6B7280] mt-2 tabular-nums">
              Etkin aralık: {processedStart || "—"} → {processedEnd || "—"}
            </p>
          )}
        </FormSection>

        <FormSection title="Hastane Raporları">
          <p className="text-[13px] font-medium text-slate-700 mb-1.5">Geçici İş Göremezlik</p>

          {/* Başlık satırı — sadece masaüstünde */}
          {ti.temporaryIncapacityPeriods.length > 0 && (
            <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_100px_32px] gap-2 mb-1 px-1">
              <span className="text-[12px] font-medium text-slate-500">Başlangıç</span>
              <span className="text-[12px] font-medium text-slate-500">Bitiş</span>
              <span className="text-[12px] font-medium text-slate-500">Gün</span>
              <span />
            </div>
          )}

          <div className="space-y-1.5">
            {ti.temporaryIncapacityPeriods.map((row) => (
              <div
                key={row.id}
                className="rounded-[8px] border border-slate-200 px-2.5 py-2"
              >
                {/* Masaüstü: tek satır */}
                <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_100px_32px] gap-2 items-center">
                  <input
                    type="date"
                    className="w-full h-[36px] rounded-[8px] border border-slate-200 bg-white px-2.5 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800/15 focus:border-blue-800/60 transition"
                    value={row.startDate}
                    onChange={(e) => updateTemp(row.id, { startDate: e.target.value }, true)}
                  />
                  <input
                    type="date"
                    className="w-full h-[36px] rounded-[8px] border border-slate-200 bg-white px-2.5 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800/15 focus:border-blue-800/60 transition"
                    value={row.endDate}
                    onChange={(e) => updateTemp(row.id, { endDate: e.target.value }, true)}
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    className="w-full h-[36px] rounded-[8px] border border-slate-200 bg-white px-2.5 text-[13px] text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-800/15 focus:border-blue-800/60 transition"
                    value={row.dayCount ?? ""}
                    onChange={(e) =>
                      updateTemp(row.id, {
                        dayCount: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                  />
                  <DeleteIconButton
                    title="Satırı sil"
                    onClick={() =>
                      setTemps(ti.temporaryIncapacityPeriods.filter((x) => x.id !== row.id))
                    }
                  />
                </div>

                {/* Mobil: dikey düzen */}
                <div className="sm:hidden space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 space-y-1">
                      <label className="text-[12px] font-medium text-slate-500">Başlangıç</label>
                      <input
                        type="date"
                        className="w-full h-[38px] rounded-[8px] border border-slate-200 bg-white px-2.5 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800/15 focus:border-blue-800/60 transition"
                        value={row.startDate}
                        onChange={(e) => updateTemp(row.id, { startDate: e.target.value }, true)}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[12px] font-medium text-slate-500">Bitiş</label>
                      <input
                        type="date"
                        className="w-full h-[38px] rounded-[8px] border border-slate-200 bg-white px-2.5 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800/15 focus:border-blue-800/60 transition"
                        value={row.endDate}
                        onChange={(e) => updateTemp(row.id, { endDate: e.target.value }, true)}
                      />
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="w-24 space-y-1">
                      <label className="text-[12px] font-medium text-slate-500">Gün</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        className="w-full h-[38px] rounded-[8px] border border-slate-200 bg-white px-2.5 text-[13px] text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-800/15 focus:border-blue-800/60 transition"
                        value={row.dayCount ?? ""}
                        onChange={(e) =>
                          updateTemp(row.id, {
                            dayCount: e.target.value === "" ? undefined : Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <DeleteIconButton
                      title="Satırı sil"
                      onClick={() =>
                        setTemps(ti.temporaryIncapacityPeriods.filter((x) => x.id !== row.id))
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
            <AddRowButton
              label="Yeni dönem ekle"
              onClick={() => setTemps([...ti.temporaryIncapacityPeriods, emptyTemp()])}
            />
          </div>
        </FormSection>

        <FormSection title="Kaza Tarihindeki Gelir">
          {(() => {
            const mode: IncomeMode = income.incomeMode ?? (income.useAverage ? "average" : "fixed");
            const selectMode = (m: IncomeMode) => {
              if (m === mode) return;
              if (m === "minWage") {
                setIncome({ ...income, incomeMode: "minWage", fixedAmount: null, averageSources: [], averageNetResult: undefined });
              } else if (m === "fixed") {
                setIncome({ ...income, incomeMode: "fixed", averageSources: [], averageNetResult: undefined });
              } else {
                setIncome({ ...income, incomeMode: "average", fixedAmount: null });
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
                      ? "border-blue-800 bg-blue-50/60 ring-1 ring-blue-800/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span
                    className={`shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      active ? "border-blue-800" : "border-slate-300"
                    }`}
                  >
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-blue-800" />}
                  </span>
                  <span className={`text-[14px] font-medium ${active ? "text-blue-900" : "text-slate-600"}`}>
                    {label}
                  </span>
                </button>
              );
            };

            const eventDate = ti.common.eventDate;
            const minWageAmount = eventDate ? getNetMinWageForDate(eventDate) : null;

            return (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {modeBtn("minWage", "Asgari Ücret")}
                  {modeBtn("fixed", "Sabit Ücret")}
                  {modeBtn("average", "Ortalama Gelir")}
                </div>

                {mode === "minWage" && (
                  <div className="mt-3 rounded-[10px] border border-slate-200 bg-slate-50/70 px-4 py-3">
                    {!eventDate ? (
                      <p className="text-[14px] text-amber-700">Önce kaza tarihini girin</p>
                    ) : minWageAmount == null ? (
                      <WarningAlert>
                        {eventDate} tarihi için tanımlı asgari ücret dönemi bulunamadı.
                      </WarningAlert>
                    ) : (
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-slate-500">
                          Kaza Tarihindeki Net Asgari Ücret
                        </p>
                        <p className="mt-0.5 text-[18px] font-semibold tracking-tight text-blue-900">
                          {formatCurrency(minWageAmount)} TL
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {mode === "fixed" && (
                  <div className="mt-2.5">
                    <FormField
                      label="Tutar"
                      error={errorFor(fieldErrors, "accidentIncome.fixedAmount")}
                    >
                      <CurrencyInput
                        value={income.fixedAmount ?? 0}
                        onChange={(v) =>
                          setIncome({
                            ...income,
                            fixedAmount: v === 0 ? null : v,
                          })
                        }
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
                      <p className="mt-0.5 text-[18px] font-semibold tracking-tight text-blue-900">
                        {income.averageNetResult != null
                          ? `₺${formatCurrency(income.averageNetResult)}`
                          : "—"}
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
              </>
            );
          })()}
        </FormSection>
        </div>

        <div className="calc-info-column">
        <FormSection title="Kusur Oranları">
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <p className="flex-1 text-[14px] font-medium text-slate-800">
                Davacı{plaintiffName ? ` — ${plaintiffName}` : ""}
              </p>
              <div className="flex items-center gap-1.5 w-full sm:w-36">
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
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                <p className="flex-1 text-[14px] font-medium text-slate-800">{p.name}</p>
                <div className="flex items-center gap-1.5 w-full sm:w-36">
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

        <FormSection title="Maluliyet">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        </div>
      </div>

      <FormSection title="Masraflar">
          <ExpenseList
            title="Hastane masrafı"
            rows={hospital}
            onChange={(hospitalExpenses) => patch({ ...ti, hospitalExpenses })}
          />
          <div className="mt-4">
            <ExpenseList
              title="Yol masrafı"
              rows={travel}
              onChange={(travelExpenses) => patch({ ...ti, travelExpenses })}
            />
          </div>
          <div className="mt-4">
            <p className="text-[13px] font-medium text-slate-700 mb-2">Bakıcı masrafı</p>
            <div className="space-y-2.5">
              {caregivers.map((row) => (
                <div
                  key={row.id}
                  className="rounded-[10px] border border-slate-200 p-3"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                        <CurrencyInput
                          value={row.amount}
                          onChange={(v) =>
                            patch({
                              ...ti,
                              caregiverExpenses: caregivers.map((x) =>
                                x.id === row.id ? { ...x, amount: v } : x
                              ),
                            })
                          }
                        />
                      </FormField>
                    </div>
                    <div className="pt-6 sm:pt-6">
                      <DeleteIconButton
                        title="Bakıcı masrafını sil"
                        onClick={() =>
                          patch({
                            ...ti,
                            caregiverExpenses: caregivers.filter((x) => x.id !== row.id),
                          })
                        }
                      />
                    </div>
                  </div>
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
            setIncome({ ...income, incomeMode: "average", averageSources: sources, averageNetResult });
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
      <p className="text-[13px] font-medium text-slate-700 mb-1.5">{title}</p>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.id} className="rounded-[10px] border border-slate-200 p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                  <CurrencyInput
                    value={row.amount}
                    onChange={(v) =>
                      onChange(
                        rows.map((x) =>
                          x.id === row.id ? { ...x, amount: v } : x
                        )
                      )
                    }
                  />
                </FormField>
              </div>
              <div className="pt-6 sm:pt-6">
                <DeleteIconButton
                  title="Masrafı sil"
                  onClick={() => onChange(rows.filter((x) => x.id !== row.id))}
                />
              </div>
            </div>
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
                          <CurrencyInput
                            value={s.amount}
                            onChange={(v) =>
                              updateSource(s.id, { amount: v })
                            }
                          />
                        </FormField>
                        <FormField label="Net karşılık">
                          <div className="w-full min-h-[42px] rounded-[8px] border border-slate-200 bg-slate-50 px-3 flex items-center justify-end text-[13px] text-slate-800">
                            {s.amount > 0 ? `₺${formatCurrency(net)}` : "—"}
                          </div>
                        </FormField>
                      </div>
                      {canDelete && (
                        <div className="mt-2">
                          <DeleteIconButton
                            title="Kaynağı sil"
                            onClick={() => removeSource(s.id)}
                          />
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
