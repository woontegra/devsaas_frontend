import { Fragment, useEffect, useMemo } from "react";
import type {
  CalculationDraft,
  TrafficInjuryDraft,
  CapitalValueDocument,
  InsurancePaymentRecord,
  InsuranceGarameEntry,
} from "../../types/calculationDraft";
import { newId } from "../../types/calculationDraft";
import { getTrh2010LifeExpectancy } from "../../../../data/trh2010";
import type { Trh2010LifeEntry } from "../../../../data/trh2010";
import { getTrh2010DecimalLifeExpectancy } from "../../../../data/trh2010Decimal";
import { completedCalendarAgeYears, calendarAgeAtEvent } from "../../utils/calendarAge";
import { CurrencyInput, DeleteIconButton, TextInput, formatTRY } from "./FormPrimitives";
import {
  CASCO_NO_PLAINTIFF_MESSAGE,
  ZMTS_NO_PLAINTIFF_MESSAGE,
  deathGarameRowsEqual,
  deathRelationLabel,
  deathZmtsClaimantLabel,
  syncDeathZmtsGarameRows,
  type DeathZmtsClaimantOption,
  type DeathZmtsGaramePerson,
} from "../../utils/deathZmtsClaimants";
import type { StepProps } from "./wizardTypes";

const DEFAULT_PASSIVE_AGE = 60;

function asTraffic(draft: CalculationDraft): TrafficInjuryDraft | null {
  return draft.calculationType === "TRAFFIC_INJURY" ? draft : null;
}

function computeAge(birthDate: string, eventDate: string) {
  return calendarAgeAtEvent(birthDate, eventDate);
}

function parseDateParts(iso: string): { y: number; m: number; d: number } | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m || !m[1] || !m[2] || !m[3]) return null;
  return { y: parseInt(m[1], 10), m: parseInt(m[2], 10), d: parseInt(m[3], 10) };
}

function addYearsToBirthDate(birthDate: string, years: number): string | null {
  const p = parseDateParts(birthDate);
  if (!p) return null;
  const y = p.y + years;
  const m = String(p.m).padStart(2, "0");
  const d = String(p.d).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addLifeExpectancy(eventDate: string, le: Trh2010LifeEntry): string | null {
  const p = parseDateParts(eventDate);
  if (!p) return null;
  const base = new Date(p.y, p.m - 1, p.d);
  base.setFullYear(base.getFullYear() + le.year);
  base.setMonth(base.getMonth() + le.month);
  base.setDate(base.getDate() + le.day);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, "0");
  const d = String(base.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const p = parseDateParts(iso);
  if (!p) return "—";
  return `${String(p.d).padStart(2, "0")}.${String(p.m).padStart(2, "0")}.${p.y}`;
}

function formatYmd(y: number, m: number, d: number): string {
  const parts: string[] = [];
  if (y > 0) parts.push(`${y} yıl`);
  if (m > 0) parts.push(`${m} ay`);
  if (d > 0) parts.push(`${d} gün`);
  return parts.length > 0 ? parts.join(" ") : "0 gün";
}

function mapGender(g: string): "male" | "female" | null {
  if (g === "MALE") return "male";
  if (g === "FEMALE") return "female";
  return null;
}

function genderLabel(g: string): string {
  if (g === "MALE") return "ERKEK";
  if (g === "FEMALE") return "KADIN";
  return "—";
}

function formatCurrency(n: number): string {
  return `₺${formatTRY(n)}`;
}

// ─── Shared table styles ──────────────────────────────────────────────

const tableCls =
  "overflow-x-auto rounded-[10px] border border-[#DCE3E8] shadow-[0_1px_4px_rgba(36,55,70,0.05)]";
const headCls =
  "border-b border-[#DCE3E8] bg-[#243746] px-3 py-2.5 text-[12.5px] font-medium text-white tracking-wide";
const thCls =
  "border-b border-[#DCE3E8] bg-[#F5F7FA] px-3 py-2 text-left text-[11.5px] font-medium text-[#66727F] uppercase tracking-wide align-middle whitespace-nowrap";
const tdCls =
  "border-b border-[#DCE3E8]/80 px-3 py-2 text-[12.5px] font-normal text-[#1F2933] align-middle";
const tdFootCls =
  "border-b border-[#DCE3E8] bg-[#EEF2F4]/50 px-3 py-2 text-[12.5px] font-medium text-[#1F2933] align-middle";

const inputCls =
  "w-full rounded-[8px] border border-[#DCE3E8] bg-white px-2 py-1.5 text-[12.5px] text-[#1F2933] focus:outline-none focus:ring-2 focus:ring-[#243746]/15 focus:border-[#243746]/40 transition";

// ─── Step component ──────────────────────────────────────────────────

export function TrafficLifeExpectancyStep({ draft, onChange }: StepProps) {
  const raw = asTraffic(draft);
  if (!raw) return null;
  const ti = raw;

  const pl = raw.parties.plaintiff;
  const fullName = [pl.firstName, pl.lastName].filter(Boolean).join(" ").trim() || "—";
  const birthDate = pl.birthDate;
  const eventDate = raw.common.eventDate;
  const gender = mapGender(pl.gender);
  const passiveAge = raw.passivePhaseAge ?? DEFAULT_PASSIVE_AGE;
  const faultRatio = raw.liability.injuredFaultRatio ?? 0;
  const externalFaultRatio = raw.liability.externalFaultRatio ?? 0;
  const docs = raw.capitalValueDocuments ?? [];

  const computed = useMemo(() => {
    const age = computeAge(birthDate, eventDate);
    const completedAge = completedCalendarAgeYears(birthDate, eventDate);

    let lifeExpectancy: Trh2010LifeEntry | null = null;
    let lifeExpectancyDecimal: number | null = null;
    if (completedAge != null && gender) {
      lifeExpectancy = getTrh2010LifeExpectancy(completedAge, gender);
      lifeExpectancyDecimal = getTrh2010DecimalLifeExpectancy(completedAge, gender);
    }

    const passiveStart = addYearsToBirthDate(birthDate, passiveAge);
    const probableEnd = lifeExpectancy
      ? addLifeExpectancy(eventDate, lifeExpectancy)
      : null;

    return { age, completedAge, lifeExpectancy, lifeExpectancyDecimal, passiveStart, probableEnd };
  }, [birthDate, eventDate, gender, passiveAge]);

  const { age, lifeExpectancy, lifeExpectancyDecimal, passiveStart, probableEnd } = computed;

  const missingData = !birthDate || !eventDate || !gender;

  // ─── Kusur oranları ──────────────────────────────────────────────

  const liableParties = raw.liability.parties ?? [];

  const totalFault =
    faultRatio +
    externalFaultRatio +
    liableParties.reduce((s, p) => s + (Number(p.faultRatio) || 0), 0);

  // ─── PSD handlers ──────────────────────────────────────────────

  function updateDocs(next: CapitalValueDocument[]) {
    onChange({ ...raw, capitalValueDocuments: next } as TrafficInjuryDraft);
  }

  const sosyalYardimOdenekleri = raw.sosyalYardimOdenekleri ?? [];

  function updateSosyal(next: CapitalValueDocument[]) {
    onChange({ ...raw, sosyalYardimOdenekleri: next } as TrafficInjuryDraft);
  }

  // ─── ZMTS & Kasko handlers ────────────────────────────────────────

  const zmts = raw.zmtsPayments ?? [];
  const casco = raw.cascoPayments ?? [];

  function patchRaw(partial: Partial<TrafficInjuryDraft>) {
    onChange({ ...raw, ...partial } as TrafficInjuryDraft);
  }

  function emptyPayment(insurerType: "COMPULSORY_TRAFFIC_INSURER" | "CASCO_INSURER"): InsurancePaymentRecord {
    const defendants = ti.parties.defendants ?? [];
    const matching = defendants.filter((d) => d.type === insurerType);
    return {
      id: newId(),
      paymentDate: "",
      paymentAmount: 0,
      liabilityLimit: 0,
      accidentLimit: 0,
      ...(matching.length === 1 ? { defendantId: matching[0]!.id } : {}),
      garameEntries: [],
      garameEnabled: false,
    };
  }

  function updatePayments(
    field: "zmtsPayments" | "cascoPayments",
    next: InsurancePaymentRecord[]
  ) {
    patchRaw({ [field]: next });
  }


  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {missingData && (
        <div className="accent-warning-surface px-4 py-3 text-[13px]">
          Bu tablonun hesaplanabilmesi için davacının doğum tarihi, cinsiyeti ve kaza tarihi
          gereklidir. Lütfen önceki adımları kontrol edin.
        </div>
      )}

      {/* ─── 1. Cetvel: Bakiye Ömür ve Dönem Bilgileri ─────────── */}
      <div className={tableCls}>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th colSpan={2} className={headCls}>
                ZARAR GÖRENİN BAKİYE ÖMRÜ: {fullName}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th className={thCls}>Doğum Tarihi</th>
              <td className={tdCls}>{formatDate(birthDate)}</td>
            </tr>
            <tr>
              <th className={thCls}>Kaza Tarihi</th>
              <td className={tdCls}>{formatDate(eventDate)}</td>
            </tr>
            <tr>
              <th className={thCls}>Kaza Tarihindeki Yaşı</th>
              <td className={tdCls}>
                {age ? formatYmd(age.years, age.months, age.days) : "—"}
              </td>
            </tr>
            <tr>
              <th className={thCls}>
                TRH 2010 {genderLabel(pl.gender)} Tablosuna Göre Bakiye Ömür
              </th>
              <td className={`${tdCls} text-[#243746] font-medium`}>
                {lifeExpectancyDecimal != null || lifeExpectancy ? (
                  <>
                    {lifeExpectancyDecimal != null
                      ? lifeExpectancyDecimal.toFixed(2).replace(".", ",") + " yıl"
                      : "—"}
                    {lifeExpectancy && (
                      <span className="font-normal text-slate-600">
                        {" "}
                        ({formatYmd(lifeExpectancy.year, lifeExpectancy.month, lifeExpectancy.day)})
                      </span>
                    )}
                  </>
                ) : (
                  "—"
                )}
              </td>
            </tr>
            <tr>
              <th className={thCls}>Pasif Devre Başlangıcı</th>
              <td className={tdCls}>
                <span className="inline-flex items-center gap-2 flex-wrap">
                  <span>{formatDate(passiveStart)}</span>
                  <span className="text-slate-300">·</span>
                  <span className="inline-flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      inputMode="numeric"
                      value={passiveAge}
                      onChange={(e) => {
                        const v =
                          e.target.value === "" ? DEFAULT_PASSIVE_AGE : Number(e.target.value);
                        onChange({
                          ...raw,
                          passivePhaseAge: Math.max(1, Math.min(99, v)),
                        });
                      }}
                      className="w-[52px] h-[30px] rounded-[6px] border border-slate-300 bg-white px-1.5 text-center text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#243746]/15 focus:border-[#243746]/40 transition"
                    />
                    <span className="text-[12px] text-slate-500">yaş</span>
                  </span>
                </span>
              </td>
            </tr>
            <tr>
              <th className={thCls}>Muhtemel Ömür Sonu</th>
              <td className={`${tdCls} text-[#243746]`}>{formatDate(probableEnd)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ─── 2. Cetvel: Kusur Oranları ──────────────────────────── */}
      <div className={tableCls}>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th colSpan={3} className={headCls}>
                KUSUR ORANLARI
              </th>
            </tr>
            <tr>
              <th className={thCls}>Taraf</th>
              <th className={thCls}>Taraf Türü</th>
              <th className={`${thCls} text-right`}>Kusur Oranı</th>
            </tr>
          </thead>
          <tbody>
            {/* Davacı */}
            <tr>
              <td className={tdCls}>{fullName}</td>
              <td className={tdCls}>Davacı</td>
              <td className={`${tdCls} text-right`}>%{faultRatio}</td>
            </tr>
            {/* Davalılar */}
            {liableParties.map((lp) => (
              <tr key={lp.id}>
                <td className={tdCls}>{lp.name || "—"}</td>
                <td className={tdCls}>Davalı</td>
                <td className={`${tdCls} text-right`}>%{Number(lp.faultRatio) || 0}</td>
              </tr>
            ))}
            <tr>
              <td className={tdCls}>Dava dışı</td>
              <td className={tdCls}>Dava dışı kusur</td>
              <td className={`${tdCls} text-right`}>%{externalFaultRatio}</td>
            </tr>
            {/* Toplam */}
            <tr>
              <td colSpan={2} className={tdFootCls}>
                Toplam Kusur
              </td>
              <td
                className={`${tdFootCls} text-right ${
                  totalFault !== 100 ? "text-red-600" : "text-emerald-700"
                }`}
              >
                %{totalFault}
              </td>
            </tr>
          </tbody>
        </table>
        {totalFault !== 100 && (
          <div className="border-t border-[#DCE3E8] bg-red-50/70 px-4 py-2.5 text-[12px] text-red-700 font-medium">
            Toplam kusur oranı %100 olmalıdır. Şu anki toplam: %{totalFault}
          </div>
        )}
      </div>

      <TrafficDeductionCards
        sosyal={sosyalYardimOdenekleri}
        documents={docs}
        zmts={zmts}
        casco={casco}
        onChangeSosyal={updateSosyal}
        onChangeDocuments={updateDocs}
        onChangeZmts={(next) => updatePayments("zmtsPayments", next)}
        onChangeCasco={(next) => updatePayments("cascoPayments", next)}
        newZmts={() => emptyPayment("COMPULSORY_TRAFFIC_INSURER")}
        newCasco={() => emptyPayment("CASCO_INSURER")}
        garameSubject={{
          plaintiffName: fullName,
          disabilityRate: raw.disability.permanentDisabilityRate,
          faultRate: faultRatio,
        }}
      />
    </div>
  );
}

// ─── Sigorta ödeme cetveli ──────────────────────────────────────────

// ─── Garame — kişi referansı & motor alanları ───────────────────────

interface GarameSubjectContext {
  plaintiffName: string;
  disabilityRate?: number;
  faultRate?: number;
}

function resolveGarameSubject(entry: InsuranceGarameEntry, ctx: GarameSubjectContext) {
  if (entry.subjectRef === "plaintiff") {
    return {
      label: ctx.plaintiffName,
      disabilityRate: ctx.disabilityRate,
      faultRate: ctx.faultRate,
      fromFile: true,
    };
  }
  return {
    label: entry.externalPersonLabel?.trim() || "—",
    disabilityRate: undefined,
    faultRate: undefined,
    fromFile: false,
  };
}

function emptyGarameEntry(): InsuranceGarameEntry {
  return { id: newId(), subjectRef: "plaintiff" };
}

function ReadOnlyAmount({ value }: { value?: number }) {
  return (
    <span className="inline-flex min-h-[32px] items-center px-2 text-[12.5px] tabular-nums text-[#66727F]">
      {value != null && value > 0 ? formatCurrency(value) : "—"}
    </span>
  );
}

function ReadOnlyRatio({ value }: { value?: number }) {
  return (
    <span className="inline-flex min-h-[32px] items-center px-2 text-[12.5px] tabular-nums text-[#66727F]">
      {value != null ? `${(value * 100).toFixed(2).replace(".", ",")} %` : "—"}
    </span>
  );
}

function ReadOnlyPercent({ value }: { value?: number }) {
  return (
    <span className="inline-flex min-h-[32px] items-center px-2 text-[12.5px] tabular-nums text-[#66727F]">
      {value != null ? `%${value.toFixed(2).replace(".", ",")}` : "—"}
    </span>
  );
}

function InsuranceGarameEntriesPanel({
  entries,
  onChange,
  subjectContext,
}: {
  entries: InsuranceGarameEntry[];
  onChange: (next: InsuranceGarameEntry[]) => void;
  subjectContext: GarameSubjectContext;
}) {
  const list = entries ?? [];

  const patch = (id: string, p: Partial<InsuranceGarameEntry>) => {
    onChange(list.map((e) => (e.id === id ? { ...e, ...p } : e)));
  };

  const setSubjectKind = (id: string, kind: "plaintiff" | "external") => {
    if (kind === "plaintiff") {
      patch(id, { subjectRef: "plaintiff", externalPersonLabel: undefined });
      return;
    }
    patch(id, { subjectRef: undefined, externalPersonLabel: "" });
  };

  return (
    <div className="rounded-[8px] border border-[#DCE3E8] bg-[#F5F7FA]/70 p-2.5 sm:p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[11.5px] font-medium text-[#66727F]">
          Garame dağılımı — kişi seçimi (motor çıktıları hesap sonrası doldurulacak)
        </p>
        <button
          type="button"
          onClick={() => onChange([...list, emptyGarameEntry()])}
          className="shrink-0 inline-flex items-center gap-1 rounded-[7px] border border-brand-accent/25 bg-white px-2 py-1 text-[11.5px] font-medium text-brand-accent hover:bg-brand-accent-soft"
        >
          <span className="font-semibold">+</span> Kişi ekle
        </button>
      </div>

      {list.length === 0 && (
        <p className="text-[12px] text-[#66727F] italic py-1">Garame satırı yok</p>
      )}

      <div className="space-y-2">
        {list.map((entry, i) => {
          const resolved = resolveGarameSubject(entry, subjectContext);
          const isPlaintiff = entry.subjectRef === "plaintiff";

          return (
            <div
              key={entry.id}
              className="rounded-[8px] border border-[#DCE3E8] bg-white p-2.5 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11.5px] font-medium text-[#66727F]">Kişi {i + 1}</span>
                <DeleteIconButton onClick={() => onChange(list.filter((e) => e.id !== entry.id))} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#66727F]">Kişi kaynağı</label>
                  <select
                    value={isPlaintiff ? "plaintiff" : "external"}
                    onChange={(e) =>
                      setSubjectKind(entry.id, e.target.value === "plaintiff" ? "plaintiff" : "external")
                    }
                    className={`${inputCls} min-h-[32px] text-[12.5px]`}
                  >
                    <option value="plaintiff">Davacı — {subjectContext.plaintiffName}</option>
                    <option value="external">Dosya dışı kaza mağduru</option>
                  </select>
                </div>
                {!isPlaintiff && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#66727F]">Mağdur tanımı</label>
                    <TextInput
                      value={entry.externalPersonLabel ?? ""}
                      onChange={(e) =>
                        patch(entry.id, { externalPersonLabel: e.target.value, subjectRef: undefined })
                      }
                      placeholder="Ad veya tanım"
                      className="min-h-[32px] text-[12.5px]"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-[6px] border border-[#E6ECEF] bg-[#F8FAFB] px-2.5 py-2">
                <p className="text-[10.5px] font-medium uppercase tracking-wide text-[#9CA3AF] mb-1.5">
                  Dosyadan okunan bilgiler
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-1.5 text-[12px]">
                  <div>
                    <span className="text-[#9CA3AF]">Kişi: </span>
                    <span className="text-[#1F2933]">{resolved.label}</span>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF]">Maluliyet: </span>
                    {resolved.fromFile ? (
                      <ReadOnlyPercent value={resolved.disabilityRate} />
                    ) : (
                      <span className="text-[#66727F]">— (dosya dışı)</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[#9CA3AF]">Kusur: </span>
                    {resolved.fromFile ? (
                      <ReadOnlyPercent value={resolved.faultRate} />
                    ) : (
                      <span className="text-[#66727F]">— (dosya dışı)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-[6px] border border-dashed border-[#DCE3E8] bg-[#F5F7FA]/40 px-2.5 py-2">
                <p className="text-[10.5px] font-medium uppercase tracking-wide text-[#9CA3AF] mb-1.5">
                  Motor çıktıları (salt okunur)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#66727F]">Talep Tutarı</label>
                    <ReadOnlyAmount value={entry.claimAmount} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#66727F]">Garameye Esas Tutar</label>
                    <ReadOnlyAmount value={entry.garameBasisAmount} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#66727F]">Garame Oranı</label>
                    <ReadOnlyRatio value={entry.garameRatio} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#66727F]">Kaza Başı Pay</label>
                    <ReadOnlyAmount value={entry.accidentLimitShare} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#66727F]">
                      Kişi Başı Limit Sonrası Ödenebilir
                    </label>
                    <ReadOnlyAmount value={entry.payableAfterPersonLimit} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GarameToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none text-[12px] text-[#1F2933]">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-[#DCE3E8] text-[#243746] focus:ring-[#243746]/20"
      />
      <span>Garame hesabı uygula</span>
    </label>
  );
}

function ZmtsClaimantField({
  row,
  claimants,
  onPatch,
}: {
  row: InsurancePaymentRecord;
  claimants: DeathZmtsClaimantOption[];
  onPatch: (id: string, p: Partial<InsurancePaymentRecord>) => void;
}) {
  const selectedId = claimants.some((c) => c.id === row.claimantId) ? (row.claimantId ?? "") : "";
  const label = deathZmtsClaimantLabel(row, claimants);
  const stale = Boolean(row.claimantId?.trim()) && selectedId === "";
  return (
    <div className="min-w-[200px] space-y-1">
      <select
        aria-label="Ödemenin Yapıldığı Hak Sahibi"
        value={selectedId}
        onChange={(e) => {
          const opt = claimants.find((c) => c.id === e.target.value);
          if (!opt) return;
          onPatch(row.id, {
            claimantId: opt.id,
            claimantName: opt.name,
            claimantRelation: opt.relation,
          });
        }}
        className={inputCls}
      >
        <option value="">Hak sahibi seçin</option>
        {claimants.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      <div className={`text-[11.5px] ${stale || !row.claimantId ? "text-amber-800" : "text-[#66727F]"}`}>
        {label}
        {stale ? " — yeniden seçin" : ""}
      </div>
    </div>
  );
}

function DeathZmtsGarameTable({
  people,
  rows,
  onChange,
  embedded = false,
}: {
  people: DeathZmtsGaramePerson[];
  rows: InsurancePaymentRecord["deathGarameRows"];
  onChange: (next: NonNullable<InsurancePaymentRecord["deathGarameRows"]>) => void;
  /** Ana tablonun başlığı zaten duruyorsa ikinci thead basılmaz. */
  embedded?: boolean;
}) {
  const synced = syncDeathZmtsGarameRows(rows, people);
  useEffect(() => {
    if (!deathGarameRowsEqual(rows, synced)) onChange(synced);
  }, [onChange, people, rows, synced]);

  const patchPerson = (claimantId: string, patch: Partial<NonNullable<InsurancePaymentRecord["deathGarameRows"]>[number]>) => {
    // Garame aktifken kişi başı limit tüm kişilerde ortaktır; hangi satırdan girilirse hepsine yazılır.
    if ("liabilityLimit" in patch) {
      const liabilityLimit = patch.liabilityLimit;
      onChange(
        synced.map((row) =>
          row.claimantId === claimantId ? { ...row, ...patch } : { ...row, liabilityLimit }
        )
      );
      return;
    }
    onChange(synced.map((row) => (row.claimantId === claimantId ? { ...row, ...patch } : row)));
  };

  if (people.length === 0) {
    const empty = (
      <p className="text-[12.5px] text-amber-900">
        Garame tablosu için Hak Sahipleri adımında en az bir kişi tanımlayın.
      </p>
    );
    return embedded ? (
      <tr>
        <td colSpan={7} className={tdCls}>{empty}</td>
      </tr>
    ) : empty;
  }

  const personRows = synced.map((person) => (
            <tr key={person.claimantId}>
              <td className={tdCls}>{person.claimantName}</td>
              <td className={tdCls}>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    person.claimantStatus === "OUT_OF_CASE"
                      ? "bg-[#EEF2F4] text-[#66727F]"
                      : "bg-[#E7F0EA] text-[#1F6B3A]"
                  }`}
                >
                  {person.claimantStatus === "OUT_OF_CASE" ? "Dava Dışı" : "Davacı"}
                </span>
              </td>
              <td className={tdCls}>{deathRelationLabel(person.claimantRelation) || "—"}</td>
              <td className={tdCls}>
                <input
                  type="date"
                  aria-label={`${person.claimantName} ödeme tarihi`}
                  value={person.paymentDate ?? ""}
                  onChange={(e) => patchPerson(person.claimantId, { paymentDate: e.target.value })}
                  className={inputCls}
                />
              </td>
              <td className={tdCls}>
                <CurrencyInput
                  value={person.paymentAmount ?? 0}
                  onChange={(paymentAmount) => patchPerson(person.claimantId, { paymentAmount })}
                  className={inputCls}
                  showPrefix={false}
                />
              </td>
              <td className={tdCls}>
                <CurrencyInput
                  value={person.liabilityLimit ?? 0}
                  onChange={(liabilityLimit) => patchPerson(person.claimantId, { liabilityLimit })}
                  className={inputCls}
                  showPrefix={false}
                />
              </td>
              <td className={tdCls}>
                <CurrencyInput
                  value={person.accidentLimit ?? 0}
                  onChange={(accidentLimit) => patchPerson(person.claimantId, { accidentLimit })}
                  className={inputCls}
                  showPrefix={false}
                />
              </td>
            </tr>
  ));

  if (embedded) return <>{personRows}</>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left">
        <thead>
          <tr>
            <th className={thCls}>Hak Sahibi</th>
            <th className={thCls}>Durumu</th>
            <th className={thCls}>Yakınlık</th>
            <th className={thCls}>Ödeme Tarihi</th>
            <th className={thCls}>Ödeme Miktarı</th>
            <th className={thCls}>Kişi Başı Limit (TL)</th>
            <th className={thCls}>Kaza Başı Limit (TL)</th>
          </tr>
        </thead>
        <tbody>{personRows}</tbody>
      </table>
    </div>
  );
}

function InsurancePaymentTable({
  title,
  rows,
  onAdd,
  onRemove,
  onPatch,
  total,
  addLabel,
  garameSubjectContext,
  claimants,
  garamePeople,
  emptyClaimantsMessage = ZMTS_NO_PLAINTIFF_MESSAGE,
}: {
  title: string;
  rows: InsurancePaymentRecord[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onPatch: (id: string, p: Partial<InsurancePaymentRecord>) => void;
  total: number;
  addLabel: string;
  garameSubjectContext: GarameSubjectContext;
  claimants?: DeathZmtsClaimantOption[];
  garamePeople?: DeathZmtsGaramePerson[];
  emptyClaimantsMessage?: string;
}) {
  const claimantMode = claimants != null;
  const span = claimantMode ? 6 : 5;
  const deathGarameOn = garamePeople != null ? rows.filter((row) => row.garameEnabled === true) : [];
  const plainRows = garamePeople != null ? rows.filter((row) => row.garameEnabled !== true) : rows;
  const showPlainTable = plainRows.length > 0 || deathGarameOn.length === 0;
  return (
    <div className={tableCls}>
      {claimants && claimants.length === 0 ? (
        <div className="border-b border-[#DCE3E8] bg-amber-50 px-4 py-2.5 text-[12.5px] text-amber-900">
          {emptyClaimantsMessage}
        </div>
      ) : null}
      {/* Masaüstü tablo */}
      <div className="hidden sm:block overflow-x-auto">
        {showPlainTable ? (
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr>
              <th colSpan={span} className={headCls}>{title}</th>
            </tr>
            <tr>
              {claimantMode ? <th className={thCls}>Hak Sahibi</th> : null}
              <th className={thCls}>Ödeme Tarihi</th>
              <th className={thCls}>Ödeme Miktarı</th>
              <th className={thCls}>Kişi Başı Limit (TL)</th>
              <th className={thCls}>Kaza Başı Limit (TL)</th>
              <th className={thCls} style={{ width: 56 }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {plainRows.length === 0 && (
              <tr>
                <td colSpan={span} className={`${tdCls} text-center text-slate-400 italic`}>
                  Henüz kayıt eklenmedi
                </td>
              </tr>
            )}
            {plainRows.map((row) => (
              <Fragment key={row.id}>
                <tr>
                      {claimantMode ? (
                        <td className={tdCls}>
                          <ZmtsClaimantField row={row} claimants={claimants ?? []} onPatch={onPatch} />
                        </td>
                      ) : null}
                      <td className={tdCls}>
                        <input
                          type="date"
                          value={row.paymentDate}
                          onChange={(e) => onPatch(row.id, { paymentDate: e.target.value })}
                          className={inputCls}
                          style={{ minWidth: 140 }}
                        />
                      </td>
                      <td className={tdCls}>
                        <div className="min-w-[120px]">
                          <CurrencyInput
                            value={row.paymentAmount}
                            onChange={(v) => onPatch(row.id, { paymentAmount: v })}
                            className={inputCls}
                            showPrefix={false}
                          />
                        </div>
                      </td>
                      <td className={tdCls}>
                        <div className="min-w-[130px]">
                          <CurrencyInput
                            value={row.liabilityLimit}
                            onChange={(v) => onPatch(row.id, { liabilityLimit: v })}
                            className={inputCls}
                            showPrefix={false}
                          />
                        </div>
                      </td>
                      <td className={tdCls}>
                        <div className="min-w-[130px]">
                          <CurrencyInput
                            value={row.accidentLimit ?? 0}
                            onChange={(v) => onPatch(row.id, { accidentLimit: v })}
                            className={inputCls}
                            showPrefix={false}
                          />
                        </div>
                      </td>
                      <td className={`${tdCls} text-center`} style={{ width: 56 }}>
                        <DeleteIconButton onClick={() => onRemove(row.id)} />
                      </td>
                </tr>
                <tr>
                  <td colSpan={span} className={`${tdCls} bg-[#F8FAFB] py-2`}>
                    <GarameToggle
                      enabled={row.garameEnabled === true}
                      onChange={(garameEnabled) => onPatch(row.id, { garameEnabled })}
                    />
                  </td>
                </tr>
                {row.garameEnabled === true && !garamePeople ? (
                  <tr>
                    <td colSpan={span} className={`${tdCls} bg-[#F8FAFB] py-2 border-t border-[#DCE3E8]/60`}>
                      <InsuranceGarameEntriesPanel
                        entries={row.garameEntries ?? []}
                        onChange={(garameEntries) => onPatch(row.id, { garameEntries })}
                        subjectContext={garameSubjectContext}
                      />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
            {plainRows.length > 0 && deathGarameOn.length === 0 && (
              <tr>
                {claimantMode ? <td className={tdFootCls} /> : null}
                <td className={tdFootCls}>Toplam Ödeme</td>
                <td className={`${tdFootCls} text-right`}>{formatCurrency(total)}</td>
                <td className={tdFootCls} />
                <td className={tdFootCls} />
                <td className={tdFootCls} />
              </tr>
            )}
          </tbody>
        </table>
        ) : (
          <div className={headCls}>{title}</div>
        )}
        {deathGarameOn.length > 0 ? (
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr>
                <th className={thCls}>Hak Sahibi</th>
                <th className={thCls}>Durumu</th>
                <th className={thCls}>Yakınlık</th>
                <th className={thCls}>Ödeme Tarihi</th>
                <th className={thCls}>Ödeme Miktarı</th>
                <th className={thCls}>Kişi Başı Limit (TL)</th>
                <th className={thCls}>Kaza Başı Limit (TL)</th>
              </tr>
            </thead>
            <tbody>
              {deathGarameOn.map((row) => (
                <Fragment key={row.id}>
                  <DeathZmtsGarameTable
                    embedded
                    people={garamePeople ?? []}
                    rows={row.deathGarameRows}
                    onChange={(deathGarameRows) => onPatch(row.id, { deathGarameRows })}
                  />
                  <tr>
                    <td colSpan={7} className={`${tdCls} bg-[#F8FAFB] py-2`}>
                      <div className="flex items-center justify-between gap-3">
                        <GarameToggle
                          enabled
                          onChange={(garameEnabled) => onPatch(row.id, { garameEnabled })}
                        />
                        <DeleteIconButton onClick={() => onRemove(row.id)} />
                      </div>
                    </td>
                  </tr>
                </Fragment>
              ))}
              <tr>
                <td className={tdFootCls} />
                <td className={tdFootCls} />
                <td className={tdFootCls} />
                <td className={tdFootCls}>Toplam Ödeme</td>
                <td className={`${tdFootCls} text-right`}>{formatCurrency(total)}</td>
                <td className={tdFootCls} />
                <td className={tdFootCls} />
              </tr>
            </tbody>
          </table>
        ) : null}
      </div>

      {/* Mobil kart görünümü */}
      <div className="sm:hidden">
        <div className={headCls}>{title}</div>
        {rows.length === 0 && (
          <div className="px-4 py-4 text-center text-[13px] text-slate-400 italic border-b border-[#DCE3E8]">
            Henüz kayıt eklenmedi
          </div>
        )}
        {rows.map((row, i) => {
          const deathGarame = garamePeople != null && row.garameEnabled === true;
          return (
          <div key={row.id} className="border-b border-[#DCE3E8] px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-slate-500">Kayıt {i + 1}</span>
              <DeleteIconButton onClick={() => onRemove(row.id)} />
            </div>
            {deathGarame ? (
              <DeathZmtsGarameTable
                people={garamePeople ?? []}
                rows={row.deathGarameRows}
                onChange={(deathGarameRows) => onPatch(row.id, { deathGarameRows })}
              />
            ) : (
            <>
            {claimantMode ? (
              <div className="space-y-1.5">
                <label className="block text-[12px] font-medium text-slate-500">Ödemenin Yapıldığı Hak Sahibi</label>
                <ZmtsClaimantField row={row} claimants={claimants ?? []} onPatch={onPatch} />
              </div>
            ) : null}
            {claimantMode ? (
              <div className="space-y-1.5">
                <label className="block text-[12px] font-medium text-slate-500">Ödeme Miktarı</label>
                <CurrencyInput
                  value={row.paymentAmount}
                  onChange={(v) => onPatch(row.id, { paymentAmount: v })}
                  className={inputCls}
                />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-slate-500">Ödeme Tarihi</label>
              <input
                type="date"
                value={row.paymentDate}
                onChange={(e) => onPatch(row.id, { paymentDate: e.target.value })}
                className={inputCls}
              />
            </div>
            {claimantMode ? null : (
              <div className="space-y-1.5">
                <label className="block text-[12px] font-medium text-slate-500">Ödeme Miktarı</label>
                <CurrencyInput
                  value={row.paymentAmount}
                  onChange={(v) => onPatch(row.id, { paymentAmount: v })}
                  className={inputCls}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-slate-500">Kişi Başı Limit (TL)</label>
              <CurrencyInput
                value={row.liabilityLimit}
                onChange={(v) => onPatch(row.id, { liabilityLimit: v })}
                className={inputCls}
                showPrefix={false}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-slate-500">Kaza Başı Limit (TL)</label>
              <CurrencyInput
                value={row.accidentLimit ?? 0}
                onChange={(v) => onPatch(row.id, { accidentLimit: v })}
                className={inputCls}
                showPrefix={false}
              />
            </div>
            </>
            )}
            <GarameToggle
              enabled={row.garameEnabled === true}
              onChange={(garameEnabled) => onPatch(row.id, { garameEnabled })}
            />
            {row.garameEnabled === true && !garamePeople ? (
              <InsuranceGarameEntriesPanel
                entries={row.garameEntries ?? []}
                onChange={(garameEntries) => onPatch(row.id, { garameEntries })}
                subjectContext={garameSubjectContext}
              />
            ) : null}
          </div>
          );
        })}
        {rows.length > 0 && (
          <div className="px-4 py-2.5 bg-[#EEF2F4]/50 flex justify-between text-[12.5px] font-medium text-[#1F2933] border-b border-[#DCE3E8]">
            <span>Toplam Ödeme</span>
            <span>{formatCurrency(total)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-[#DCE3E8] bg-white px-4 py-2.5">
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#DCE3E8] bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#243746] hover:bg-[#EEF2F4] transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          {addLabel}
        </button>
      </div>
    </div>
  );
}

export function TrafficDeductionCards({
  sosyal,
  documents,
  zmts,
  casco,
  onChangeSosyal,
  onChangeDocuments,
  onChangeZmts,
  onChangeCasco,
  newZmts,
  newCasco,
  garameSubject,
  zmtsClaimants,
  cascoClaimants,
  garamePeople,
}: {
  sosyal: CapitalValueDocument[];
  documents: CapitalValueDocument[];
  zmts: InsurancePaymentRecord[];
  casco: InsurancePaymentRecord[];
  onChangeSosyal: (next: CapitalValueDocument[]) => void;
  onChangeDocuments: (next: CapitalValueDocument[]) => void;
  onChangeZmts: (next: InsurancePaymentRecord[]) => void;
  onChangeCasco: (next: InsurancePaymentRecord[]) => void;
  newZmts: () => InsurancePaymentRecord;
  newCasco: () => InsurancePaymentRecord;
  garameSubject: GarameSubjectContext;
  zmtsClaimants?: DeathZmtsClaimantOption[];
  cascoClaimants?: DeathZmtsClaimantOption[];
  garamePeople?: DeathZmtsGaramePerson[];
}) {
  function patchDoc(
    rows: CapitalValueDocument[],
    onChange: (next: CapitalValueDocument[]) => void,
    id: string,
    patch: Partial<CapitalValueDocument>
  ) {
    onChange(rows.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function addDoc(rows: CapitalValueDocument[], onChange: (next: CapitalValueDocument[]) => void) {
    onChange([...rows, { id: newId(), amount: 0, documentDate: "", documentNumber: "", notes: "" }]);
  }

  const sosyalTotal = sosyal.reduce((s, d) => s + (d.amount ?? 0), 0);
  const psdTotal = documents.reduce((s, d) => s + (d.amount ?? 0), 0);
  const zmtsTotal = zmts.reduce((s, r) => {
    if (garamePeople && r.garameEnabled === true) {
      return s + (r.deathGarameRows ?? []).reduce((n, row) => n + (row.paymentAmount ?? 0), 0);
    }
    return s + (r.paymentAmount ?? 0);
  }, 0);
  const cascoTotal = casco.reduce((s, r) => {
    if (garamePeople && r.garameEnabled === true) {
      return s + (r.deathGarameRows ?? []).reduce((n, row) => n + (row.paymentAmount ?? 0), 0);
    }
    return s + (r.paymentAmount ?? 0);
  }, 0);

  return (
    <>
      <DocumentAmountCard
        title="SOSYAL YARDIM ÖDENEĞİ"
        emptyLabel="Henüz kayıt eklenmedi"
        totalLabel="Toplam Sosyal Yardım Ödeneği"
        addLabel="Sosyal Yardım Ödeneği Ekle"
        rows={sosyal}
        total={sosyalTotal}
        onAdd={() => addDoc(sosyal, onChangeSosyal)}
        onRemove={(id) => onChangeSosyal(sosyal.filter((d) => d.id !== id))}
        onPatch={(id, patch) => patchDoc(sosyal, onChangeSosyal, id, patch)}
      />
      <DocumentAmountCard
        title="PEŞİN SERMAYE DEĞERİ"
        emptyLabel="Henüz kayıt eklenmedi"
        totalLabel="Toplam Peşin Sermaye Değeri"
        addLabel="Peşin Sermaye Değeri Ekle"
        rows={documents}
        total={psdTotal}
        onAdd={() => addDoc(documents, onChangeDocuments)}
        onRemove={(id) => onChangeDocuments(documents.filter((d) => d.id !== id))}
        onPatch={(id, patch) => patchDoc(documents, onChangeDocuments, id, patch)}
      />
      <InsurancePaymentTable
        title="ZMTS — ZORUNLU MALİ TRAFİK SİGORTASI"
        rows={zmts}
        onAdd={() => onChangeZmts([...zmts, newZmts()])}
        onRemove={(id) => onChangeZmts(zmts.filter((r) => r.id !== id))}
        onPatch={(id, patch) => onChangeZmts(zmts.map((r) => (r.id === id ? { ...r, ...patch } : r)))}
        total={zmtsTotal}
        addLabel="Yeni Ödeme Ekle"
        garameSubjectContext={garameSubject}
        claimants={zmtsClaimants}
        garamePeople={garamePeople}
      />
      <InsurancePaymentTable
        title="KASKO ŞİRKETİ"
        rows={casco}
        onAdd={() => onChangeCasco([...casco, newCasco()])}
        onRemove={(id) => onChangeCasco(casco.filter((r) => r.id !== id))}
        onPatch={(id, patch) => onChangeCasco(casco.map((r) => (r.id === id ? { ...r, ...patch } : r)))}
        total={cascoTotal}
        addLabel="Yeni Ödeme Ekle"
        garameSubjectContext={garameSubject}
        garamePeople={garamePeople}
        claimants={cascoClaimants}
        emptyClaimantsMessage={CASCO_NO_PLAINTIFF_MESSAGE}
      />
    </>
  );
}

function DocumentAmountCard({
  title,
  emptyLabel,
  totalLabel,
  addLabel,
  rows,
  total,
  onAdd,
  onRemove,
  onPatch,
}: {
  title: string;
  emptyLabel: string;
  totalLabel: string;
  addLabel: string;
  rows: CapitalValueDocument[];
  total: number;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onPatch: (id: string, patch: Partial<CapitalValueDocument>) => void;
}) {
  return (
    <div className={tableCls}>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            <th colSpan={5} className={headCls}>
              {title}
            </th>
          </tr>
          <tr>
            <th className={thCls}>Açıklama</th>
            <th className={thCls} style={{ width: 140 }}>
              Belge Tarihi
            </th>
            <th className={thCls} style={{ width: 150 }}>
              Belge Numarası
            </th>
            <th className={thCls} style={{ width: 140 }}>
              Tutar
            </th>
            <th className={thCls} style={{ width: 48 }} />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className={`${tdCls} text-center text-slate-400 italic`}>
                {emptyLabel}
              </td>
            </tr>
          )}
          {rows.map((doc) => (
            <tr key={doc.id}>
              <td className={tdCls}>
                <input
                  type="text"
                  placeholder="Açıklama"
                  value={doc.notes ?? ""}
                  onChange={(e) => onPatch(doc.id, { notes: e.target.value })}
                  className={inputCls}
                />
              </td>
              <td className={tdCls}>
                <input
                  type="date"
                  value={doc.documentDate ?? ""}
                  onChange={(e) => onPatch(doc.id, { documentDate: e.target.value })}
                  className={inputCls}
                />
              </td>
              <td className={tdCls}>
                <input
                  type="text"
                  placeholder="Belge No"
                  value={doc.documentNumber ?? ""}
                  onChange={(e) => onPatch(doc.id, { documentNumber: e.target.value })}
                  className={inputCls}
                />
              </td>
              <td className={tdCls}>
                <CurrencyInput
                  value={doc.amount ?? 0}
                  onChange={(v) => onPatch(doc.id, { amount: v })}
                  className={inputCls}
                  showPrefix={false}
                />
              </td>
              <td className={`${tdCls} text-center`}>
                <DeleteIconButton onClick={() => onRemove(doc.id)} />
              </td>
            </tr>
          ))}
          {rows.length > 0 && (
            <tr>
              <td colSpan={3} className={tdFootCls}>
                {totalLabel}
              </td>
              <td className={`${tdFootCls} text-right`}>{formatCurrency(total)}</td>
              <td className={tdFootCls} />
            </tr>
          )}
        </tbody>
      </table>
      <div className="border-t border-[#DCE3E8] bg-white px-4 py-2.5">
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#DCE3E8] bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#243746] hover:bg-[#EEF2F4] transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          {addLabel}
        </button>
      </div>
    </div>
  );
}
