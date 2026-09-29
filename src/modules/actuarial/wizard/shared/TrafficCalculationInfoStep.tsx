import { useEffect } from "react";
import type {
  AccidentIncomeBlock,
  CalculationDraft,
  CaregiverExpenseRow,
  DefendantType,
  ExpenseItem,
  LiableParty,
  TemporaryIncapacityPeriod,
  TrafficInjuryDraft,
} from "../../types/calculationDraft";
import { newId } from "../../types/calculationDraft";
import { deriveTemporaryPeriodDayCount } from "../../utils/temporaryIncapacityPeriods";
import {
  AddRowButton,
  CurrencyInput,
  DeleteIconButton,
  FormField,
  FormSection,
  TextInput,
} from "./FormPrimitives";
import type { StepProps } from "./wizardTypes";
import { errorFor } from "./wizardTypes";
import {
  dateInputErrorClass,
  fieldHasContinuityError,
  findLastTemporaryIncapacityEndIndex,
  getTempDisabilityContinuityMessage,
  getTempDisabilityContinuityCode,
} from "./tempDisabilityContinuity";
import {
  TEMP_INCAPACITY_START_MUST_MATCH_EVENT_DATE_MESSAGE,
  fieldHasTempIncapacityStartError,
  findFirstTemporaryIncapacityStartIndex,
  hasTempIncapacityStartEventDateError,
} from "./tempIncapacityStartValidation";
import {
  DISABILITY_START_DATE_REQUIRED_MESSAGE,
  fieldHasDisabilityStartDateRequiredError,
  hasDisabilityStartDateRequiredError,
} from "./disabilityStartDateValidation";
import { AccidentIncomeSection } from "./accidentIncomeUi";
import { FaultRatiosCard } from "./FaultRatiosCard";

// ─── Sabitler ────────────────────────────────────────────────────────

const DEFENDANT_LABELS: Record<DefendantType, string> = {
  INDIVIDUAL_DRIVER: "Gerçek Kişi Şoför",
  INDIVIDUAL_VEHICLE_OWNER: "Gerçek Kişi Araç sahibi",
  CORPORATE_VEHICLE_OWNER: "Tüzel Kişi Araç sahibi",
  COMPULSORY_TRAFFIC_INSURER: "Sigorta şirketi (ZMTS)",
  CASCO_INSURER: "Sigorta şirketi (Kasko Şirketi)",
};

// ─── Yardımcılar ────────────────────────────────────────────────────

function asTraffic(draft: CalculationDraft): TrafficInjuryDraft | null {
  return draft.calculationType === "TRAFFIC_INJURY" ? draft : null;
}

function inclusiveDayCount(start: string, end: string): number | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return undefined;
  const days = deriveTemporaryPeriodDayCount(start, end);
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

// ─── Ana bileşen ────────────────────────────────────────────────────

export function TrafficCalculationInfoStep({
  draft,
  onChange,
  fieldErrors,
  validationFieldHighlight = false,
}: StepProps) {
  const raw = asTraffic(draft);

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

  const lastTempEndIndex = findLastTemporaryIncapacityEndIndex(ti.temporaryIncapacityPeriods);
  const firstTempStartIndex = findFirstTemporaryIncapacityStartIndex(ti.temporaryIncapacityPeriods);
  const lastTempEndField =
    lastTempEndIndex != null ? `temporaryIncapacityPeriods[${lastTempEndIndex}].endDate` : null;
  const firstTempStartField =
    firstTempStartIndex != null
      ? `temporaryIncapacityPeriods[${firstTempStartIndex}].startDate`
      : null;
  const continuityErrorCode = getTempDisabilityContinuityCode(fieldErrors);
  const hasContinuityIssue = continuityErrorCode != null;
  const hasIncapacityStartIssue = hasTempIncapacityStartEventDateError(fieldErrors);
  const hasDisabilityStartRequiredIssue = hasDisabilityStartDateRequiredError(fieldErrors);
  const disabilityRate = ti.disability.permanentDisabilityRate ?? 0;
  const eventDateHighlight =
    fieldHasTempIncapacityStartError(fieldErrors, "common.eventDate") ||
    (validationFieldHighlight && hasIncapacityStartIssue);
  const disabilityDateHighlight =
    fieldHasContinuityError(fieldErrors, "disability.disabilityStartDate") ||
    fieldHasDisabilityStartDateRequiredError(fieldErrors, "disability.disabilityStartDate") ||
    (validationFieldHighlight && (hasContinuityIssue || hasDisabilityStartRequiredIssue));
  const tempStartDateHighlight = (rowIndex: number) =>
    firstTempStartField != null &&
    rowIndex === firstTempStartIndex &&
    (fieldHasTempIncapacityStartError(fieldErrors, firstTempStartField) ||
      (validationFieldHighlight && hasIncapacityStartIssue));
  const tempEndDateHighlight = (rowIndex: number) =>
    lastTempEndField != null &&
    rowIndex === lastTempEndIndex &&
    (fieldHasContinuityError(fieldErrors, lastTempEndField) ||
      (validationFieldHighlight && hasContinuityIssue));

  const tempDateInputCls = (highlight: boolean, height = "h-[36px]") =>
    `w-full ${height} rounded-[8px] border bg-white px-2.5 text-[13px] text-slate-800 focus:outline-none transition ${dateInputErrorClass(highlight)}`;

  const plaintiffFault = ti.liability.injuredFaultRatio ?? 0;
  const externalFault = ti.liability.externalFaultRatio ?? 0;
  const defendantFaultSum = ti.liability.parties.reduce(
    (s, p) => s + (Number(p.faultRatio) || 0),
    0
  );
  const totalFault = plaintiffFault + defendantFaultSum + externalFault;

  const setPlaintiffFault = (v: number) =>
    patch({ ...ti, liability: { ...ti.liability, injuredFaultRatio: v } });

  const setExternalFault = (v: number) =>
    patch({ ...ti, liability: { ...ti.liability, externalFaultRatio: v } });

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
            <FormField
              label="Kaza tarihi"
              required
              error={
                errorFor(fieldErrors, "common.eventDate") ??
                (eventDateHighlight ? TEMP_INCAPACITY_START_MUST_MATCH_EVENT_DATE_MESSAGE : undefined)
              }
            >
              <TextInput
                type="date"
                className={eventDateHighlight ? dateInputErrorClass(true) : undefined}
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
          <p className="text-[12px] font-normal text-[#66727F] mb-2">
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
            <p className="text-[11.5px] text-[#66727F] mt-2 tabular-nums">
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
            {ti.temporaryIncapacityPeriods.map((row, rowIndex) => (
              <div
                key={row.id}
                className={`rounded-[8px] border px-2.5 py-2 ${
                  tempEndDateHighlight(rowIndex) || tempStartDateHighlight(rowIndex)
                    ? "border-red-300 bg-red-50/30"
                    : "border-slate-200"
                }`}
              >
                {/* Masaüstü: tek satır */}
                <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_100px_32px] gap-2 items-center">
                  <input
                    type="date"
                    className={tempDateInputCls(tempStartDateHighlight(rowIndex))}
                    value={row.startDate}
                    onChange={(e) => updateTemp(row.id, { startDate: e.target.value }, true)}
                  />
                  <input
                    type="date"
                    className={tempDateInputCls(tempEndDateHighlight(rowIndex))}
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
                        className={tempDateInputCls(tempStartDateHighlight(rowIndex), "h-[38px]")}
                        value={row.startDate}
                        onChange={(e) => updateTemp(row.id, { startDate: e.target.value }, true)}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[12px] font-medium text-slate-500">Bitiş</label>
                      <input
                        type="date"
                        className={tempDateInputCls(tempEndDateHighlight(rowIndex), "h-[38px]")}
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

        <AccidentIncomeSection
          income={income}
          eventDate={ti.common.eventDate}
          fieldErrors={fieldErrors}
          onChange={setIncome}
        />
        </div>

        <div className="calc-info-column">
        <FaultRatiosCard
          rows={[
            {
              id: "plaintiff",
              label: `Davacı${plaintiffName ? ` — ${plaintiffName}` : ""}`,
              value: plaintiffFault,
              onChange: setPlaintiffFault,
            },
            ...ti.liability.parties.map((p) => ({
              id: p.id,
              label: p.name,
              value: p.faultRatio,
              onChange: (v: number) => setDefendantFault(p.id, v),
            })),
          ]}
          emptyMessage={
            ti.liability.parties.length === 0
              ? "İlk adımda davalı türü seçildiğinde burada listelenir."
              : undefined
          }
          externalFault={externalFault}
          onExternalFaultChange={setExternalFault}
          externalError={errorFor(fieldErrors, "liability.externalFaultRatio")}
          totalFault={totalFault}
        />

        <FormSection title="Maluliyet">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Maluliyet başlangıç"
              required={disabilityRate > 0}
              error={
                errorFor(fieldErrors, "disability.disabilityStartDate") ??
                (disabilityDateHighlight && hasDisabilityStartRequiredIssue
                  ? DISABILITY_START_DATE_REQUIRED_MESSAGE
                  : disabilityDateHighlight && continuityErrorCode
                    ? getTempDisabilityContinuityMessage(continuityErrorCode)
                    : undefined)
              }
            >
              <TextInput
                type="date"
                className={disabilityDateHighlight ? dateInputErrorClass(true) : undefined}
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
