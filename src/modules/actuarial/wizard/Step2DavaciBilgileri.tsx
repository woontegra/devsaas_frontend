import { useMemo, useCallback, useEffect } from "react";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { formTypography } from "../../../styles/formTypography";
import {
  getTrh2010LifeExpectancy,
  formatTrhLifeExpectancy,
} from "../../../data/trh2010";
import type { TrafficInjuryFormData, TrafficInjuryGender } from "../types/trafficInjuryFormTypes";

const PASSIVE_AGE_MIN = 0;
const PASSIVE_AGE_MAX = 99;

/** İki tarih arasındaki yaş (tam yıl) */
function getAgeInYears(birthDate: string, targetDate: string): number {
  if (!birthDate || !targetDate) return 0;
  const b = new Date(birthDate);
  const t = new Date(targetDate);
  let years = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) years -= 1;
  return Math.max(0, years);
}

/** Olay tarihindeki yaş: eventDate − birthDate → { year, month, day } (TRH için sadece year kullanılır) */
function getEventAgeYmd(birthDate: string, eventDate: string): { year: number; month: number; day: number } {
  if (!birthDate || !eventDate) return { year: 0, month: 0, day: 0 };
  const b = new Date(birthDate);
  const e = new Date(eventDate);
  let year = e.getFullYear() - b.getFullYear();
  let month = e.getMonth() - b.getMonth();
  let day = e.getDate() - b.getDate();
  if (day < 0) {
    month -= 1;
    const prev = new Date(e.getFullYear(), e.getMonth(), 0);
    day += prev.getDate();
  }
  if (month < 0) {
    year -= 1;
    month += 12;
  }
  return { year: Math.max(0, year), month: Math.max(0, month), day: Math.max(0, day) };
}

/** "X yıl Y ay Z gün" formatı */
function formatYmdLabel(ymd: { year: number; month: number; day: number }): string {
  const parts: string[] = [];
  if (ymd.year > 0) parts.push(`${ymd.year} yıl`);
  if (ymd.month > 0) parts.push(`${ymd.month} ay`);
  if (ymd.day > 0) parts.push(`${ymd.day} gün`);
  return parts.length > 0 ? parts.join(" ") : "—";
}

/** YYYY-MM-DD → DD.MM.YYYY (gün ay yıl) */
function formatDateDdMmYyyy(isoDateStr: string): string {
  if (!isoDateStr || isoDateStr.length < 10) return "";
  const [y, m, d] = isoDateStr.slice(0, 10).split("-");
  const day = d!.padStart(2, "0");
  const month = m!.padStart(2, "0");
  return `${day}.${month}.${y}`;
}

/** birthDate + years → YYYY-MM-DD */
function addYears(dateStr: string, years: number): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

/** date + { year, month, day } → YYYY-MM-DD (TRH bakiye ömür sonu) */
function addYmd(dateStr: string, y: number, m: number, d: number): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  date.setFullYear(date.getFullYear() + y);
  date.setMonth(date.getMonth() + m);
  date.setDate(date.getDate() + d);
  return date.toISOString().slice(0, 10);
}

/** Pasif dönem başlangıç yaşı: erkek 65, kadın 60 */
function getPassiveStartAge(gender: TrafficInjuryGender): number {
  return gender === "male" ? 65 : 60;
}

export interface Step2DavaciBilgileriProps {
  formData: TrafficInjuryFormData;
  onChange: (data: Partial<TrafficInjuryFormData>) => void;
}

export function Step2DavaciBilgileri({ formData, onChange }: Step2DavaciBilgileriProps) {
  const eventAgeYmd = useMemo(
    () => getEventAgeYmd(formData.birthDate, formData.eventDate),
    [formData.birthDate, formData.eventDate]
  );
  const eventAgeLabel = formatYmdLabel(eventAgeYmd);
  const ageKey = Math.max(0, Math.min(99, eventAgeYmd.year));
  const trhEntry = useMemo(
    () => getTrh2010LifeExpectancy(ageKey, formData.gender),
    [ageKey, formData.gender]
  );
  const trhLifeExpectancyLabel = formatTrhLifeExpectancy(trhEntry);
  const lifeEndDateIso = useMemo(
    () =>
      formData.eventDate
        ? addYmd(
            formData.eventDate,
            trhEntry.year,
            trhEntry.month,
            trhEntry.day
          )
        : "",
    [formData.eventDate, trhEntry.year, trhEntry.month, trhEntry.day]
  );
  const lifeEndDateLabel = formatDateDdMmYyyy(lifeEndDateIso);
  const defaultPassiveAge = getPassiveStartAge(formData.gender);
  const effectivePassiveAge =
    formData.isPassiveAgeManuallyEdited && formData.passiveStartAge != null
      ? Math.min(PASSIVE_AGE_MAX, Math.max(PASSIVE_AGE_MIN, formData.passiveStartAge))
      : defaultPassiveAge;
  const effectivePassiveIso = formData.birthDate
    ? addYears(formData.birthDate, effectivePassiveAge)
    : "";
  const passiveDisplayValue = effectivePassiveIso ? formatDateDdMmYyyy(effectivePassiveIso) : "";

  useEffect(() => {
    if (!formData.birthDate) return;
    const derived = addYears(formData.birthDate, effectivePassiveAge);
    if (derived !== formData.passiveStartDate) {
      onChange({ passiveStartDate: derived });
    }
  }, [formData.birthDate, formData.passiveStartDate, effectivePassiveAge, onChange]);

  const handlePassiveAgeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.trim();
      if (raw === "") {
        onChange({
          passiveStartAge: null,
          passiveStartDate: formData.birthDate ? addYears(formData.birthDate, defaultPassiveAge) : "",
          isPassiveAgeManuallyEdited: false,
        });
        return;
      }
      const num = parseInt(raw, 10);
      if (Number.isNaN(num)) {
        onChange({
          passiveStartAge: null,
          passiveStartDate: formData.birthDate ? addYears(formData.birthDate, defaultPassiveAge) : "",
          isPassiveAgeManuallyEdited: false,
        });
        return;
      }
      const clamped = Math.min(PASSIVE_AGE_MAX, Math.max(PASSIVE_AGE_MIN, num));
      onChange({
        passiveStartAge: clamped,
        passiveStartDate: formData.birthDate ? addYears(formData.birthDate, clamped) : "",
        isPassiveAgeManuallyEdited: true,
      });
    },
    [formData.birthDate, defaultPassiveAge, onChange]
  );

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-6">
      <Input
        label="Doğum Tarihi"
        type="date"
        value={formData.birthDate}
        onChange={(e) => onChange({ birthDate: e.target.value })}
      />
      <Input
        label="Olay Tarihi"
        type="date"
        value={formData.eventDate}
        onChange={(e) => onChange({ eventDate: e.target.value })}
      />
      <div className="flex flex-col gap-1.5">
        <label className={formTypography.label}>Olay Tarihindeki Yaş</label>
        <input
          type="text"
          readOnly
          value={eventAgeLabel}
          className={formTypography.readonly}
          aria-readonly
        />
      </div>
      <Input
        label="Hesap Tarihi"
        type="date"
        value={formData.calculationDate}
        onChange={(e) => onChange({ calculationDate: e.target.value })}
      />
      <Select
        label="Cinsiyet"
        value={formData.gender}
        onChange={(e) => onChange({ gender: e.target.value as TrafficInjuryGender })}
        options={[
          { value: "male", label: "Erkek" },
          { value: "female", label: "Kadın" },
        ]}
      />
      <div className="flex flex-col gap-1.5">
        <label className={formTypography.label}>TRH Tablosuna Göre Muhtemel Ömür</label>
        <input
          type="text"
          readOnly
          value={trhLifeExpectancyLabel || "—"}
          className={formTypography.readonly}
          aria-readonly
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={formTypography.label}>TRH Tablosuna Göre Muhtemel Ömür Sonu</label>
        <input
          type="text"
          readOnly
          value={lifeEndDateLabel || "—"}
          className={formTypography.readonly}
          aria-readonly
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={formTypography.label}>Pasif Dönem Başlangıcı</label>
        <div className="flex items-center gap-2 flex-nowrap">
          <input
            type="text"
            readOnly
            value={passiveDisplayValue || "—"}
            className={`${formTypography.readonly} w-[120px] shrink-0`}
            aria-label="Pasif dönem başlangıcı (tarih)"
          />
          <input
            type="number"
            min={PASSIVE_AGE_MIN}
            max={PASSIVE_AGE_MAX}
            value={effectivePassiveAge}
            onChange={handlePassiveAgeChange}
            className={`${formTypography.input} ${formTypography.inputHeight} w-14 shrink-0 rounded-md border border-gray-200 dark:border-ds-border px-2 bg-white dark:bg-ds-bg text-gray-800 dark:text-ds-text`}
            aria-label="Pasif başlangıç yaşı"
          />
          <span className={`${formTypography.label} shrink-0`}>yaş</span>
        </div>
      </div>
    </div>
  );
}
