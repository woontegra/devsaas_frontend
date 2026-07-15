import { useMemo } from "react";
import type {
  CalculationDraft,
  TrafficInjuryDraft,
} from "../../types/calculationDraft";
import { getTrh2010LifeExpectancy } from "../../../../data/trh2010";
import type { Trh2010LifeEntry } from "../../../../data/trh2010";
import { getTrh2010DecimalLifeExpectancy } from "../../../../data/trh2010Decimal";
import type { StepProps } from "./wizardTypes";

const DEFAULT_PASSIVE_AGE = 60;

function asTraffic(draft: CalculationDraft): TrafficInjuryDraft | null {
  return draft.calculationType === "TRAFFIC_INJURY" ? draft : null;
}

/** Kaza tarihindeki tam yaşı yıl / ay / gün olarak hesaplar */
function computeAge(
  birthDate: string,
  eventDate: string
): { years: number; months: number; days: number } | null {
  if (!birthDate || !eventDate) return null;
  const b = parseDateParts(birthDate);
  const e = parseDateParts(eventDate);
  if (!b || !e) return null;

  let years = e.y - b.y;
  let months = e.m - b.m;
  let days = e.d - b.d;

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(e.y, e.m - 1, 0).getDate();
    days += prevMonth;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return null;
  return { years, months, days };
}

function parseDateParts(iso: string): { y: number; m: number; d: number } | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m || !m[1] || !m[2] || !m[3]) return null;
  return { y: parseInt(m[1], 10), m: parseInt(m[2], 10), d: parseInt(m[3], 10) };
}

/** Doğum tarihine yıl ekleyerek ISO tarih döndürür */
function addYearsToBirthDate(birthDate: string, years: number): string | null {
  const p = parseDateParts(birthDate);
  if (!p) return null;
  const y = p.y + years;
  const m = String(p.m).padStart(2, "0");
  const d = String(p.d).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Kaza tarihine TRH bakiye ömrü ekler */
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

function formatDate(iso: string | null): string {
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

// ─── Tablo hücre stilleri ─────────────────────────────────────────────

const thCls =
  "border border-blue-200 bg-blue-50/60 px-4 py-2.5 text-left text-[13px] font-medium text-slate-600 align-middle";
const tdCls =
  "border border-blue-200 px-4 py-2.5 text-[13px] font-normal text-slate-800 align-middle";

// ─── Step component ──────────────────────────────────────────────────

export function TrafficLifeExpectancyStep({ draft, onChange }: StepProps) {
  const raw = asTraffic(draft);
  if (!raw) return null;

  const pl = raw.parties.plaintiff;
  const fullName = [pl.firstName, pl.lastName].filter(Boolean).join(" ").trim() || "—";
  const birthDate = pl.birthDate;
  const eventDate = raw.common.eventDate;
  const gender = mapGender(pl.gender);
  const passiveAge = raw.passivePhaseAge ?? DEFAULT_PASSIVE_AGE;
  const faultRatio = raw.liability.injuredFaultRatio ?? 0;

  const computed = useMemo(() => {
    const age = computeAge(birthDate, eventDate);
    const completedAge = age?.years ?? null;

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

  return (
    <div className="space-y-4">
      {missingData && (
        <div className="rounded-[10px] border border-amber-200 bg-amber-50/80 px-4 py-3 text-[13px] text-amber-900">
          Bu tablonun hesaplanabilmesi için davacının doğum tarihi, cinsiyeti ve kaza tarihi
          gereklidir. Lütfen önceki adımları kontrol edin.
        </div>
      )}

      <div className="overflow-x-auto rounded-[12px] border border-blue-200 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th
                colSpan={2}
                className="border border-blue-200 bg-blue-900 px-4 py-3 text-[13px] font-semibold text-white tracking-wide"
              >
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
              <td className={`${tdCls} text-blue-900 font-medium`}>
                {lifeExpectancyDecimal != null || lifeExpectancy
                  ? <>
                      {lifeExpectancyDecimal != null
                        ? lifeExpectancyDecimal.toFixed(2).replace(".", ",") + " yıl"
                        : "—"}
                      {lifeExpectancy && (
                        <span className="font-normal text-slate-600">
                          {" "}({formatYmd(lifeExpectancy.year, lifeExpectancy.month, lifeExpectancy.day)})
                        </span>
                      )}
                    </>
                  : "—"}
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
                      className="w-[52px] h-[30px] rounded-[6px] border border-slate-300 bg-white px-1.5 text-center text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800/50 transition"
                    />
                    <span className="text-[12px] text-slate-500">yaş</span>
                  </span>
                </span>
              </td>
            </tr>
            <tr>
              <th className={thCls}>Muhtemel Ömür Sonu</th>
              <td className={`${tdCls} text-blue-900`}>{formatDate(probableEnd)}</td>
            </tr>
            <tr>
              <th className={thCls}>Kusur Oranı</th>
              <td className={tdCls}>%{faultRatio}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
