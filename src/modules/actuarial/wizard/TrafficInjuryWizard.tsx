import { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "../../../components/ui/Button";
import { Step2DavaciBilgileri } from "./Step2DavaciBilgileri";
import { Step3CalismaGelir } from "./Step3CalismaGelir";
import {
  type TrafficInjuryFormData,
  type TrafficInjuryGender,
  defaultTrafficInjuryFormData,
} from "../types/trafficInjuryFormTypes";

function getEventAge(birthDate: string, eventDate: string): number {
  if (!birthDate || !eventDate) return 0;
  const b = new Date(birthDate);
  const e = new Date(eventDate);
  const years = (e.getTime() - b.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.floor(years * 100) / 100;
}

function addYears(dateStr: string, years: number): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

const TRH_LIFE_EXPECTANCY = 80;
const passiveAge = (g: TrafficInjuryGender) => (g === "male" ? 65 : 60);

const stepLabels = [
  { id: 1, label: "Hesap Türü" },
  { id: 2, label: "Davacı Bilgileri" },
  { id: 3, label: "Çalışma ve Gelir Bilgileri" },
];

export interface TrafficInjuryWizardProps {
  onComplete?: (formData: TrafficInjuryFormData) => void;
}

export function TrafficInjuryWizard({ onComplete }: TrafficInjuryWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<TrafficInjuryFormData>(() => ({
    ...defaultTrafficInjuryFormData,
    calculationDate: new Date().toISOString().slice(0, 10),
  }));

  const updateForm = useCallback((patch: Partial<TrafficInjuryFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  }, []);

  const eventAge = useMemo(
    () => getEventAge(formData.birthDate, formData.eventDate),
    [formData.birthDate, formData.eventDate]
  );
  const lifeEndDate = useMemo(
    () => (formData.birthDate ? addYears(formData.birthDate, TRH_LIFE_EXPECTANCY) : ""),
    [formData.birthDate]
  );
  const passiveStart = useMemo(
    () =>
      formData.birthDate ? addYears(formData.birthDate, passiveAge(formData.gender)) : "",
    [formData.birthDate, formData.gender]
  );

  useEffect(() => {
    setFormData((prev) => {
      if (
        prev.eventAge === eventAge &&
        prev.lifeExpectancy === TRH_LIFE_EXPECTANCY &&
        prev.lifeEndDate === lifeEndDate &&
        prev.passiveStart === passiveStart
      )
        return prev;
      return {
        ...prev,
        eventAge,
        lifeExpectancy: TRH_LIFE_EXPECTANCY,
        lifeEndDate,
        passiveStart,
      };
    });
  }, [eventAge, lifeEndDate, passiveStart]);

  const canNext =
    step === 1 ||
    (step === 2 &&
      formData.birthDate &&
      formData.eventDate &&
      formData.calculationDate &&
      formData.gender) ||
    step === 3;
  const isLast = step === 3;

  const handleNext = () => {
    if (isLast && onComplete) {
      onComplete(formData);
      return;
    }
    if (step < 3) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  return (
    <div className="space-y-6">
      <nav className="flex gap-2 border-b border-gray-200 dark:border-ds-border pb-3">
        {stepLabels.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            className={`px-3 py-1.5 text-[13px] font-medium rounded-t transition-colors ${
              step === s.id
                ? "bg-app-primary/10 text-app-primary border-b-2 border-app-primary -mb-[3px]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {step === 1 && (
        <div className="py-2">
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Hesap Türü
          </h3>
          <p className="text-base text-gray-700 dark:text-ds-text">
            Trafik Kazası Yaralanma
          </p>
        </div>
      )}

      {step === 2 && (
        <Step2DavaciBilgileri formData={formData} onChange={updateForm} />
      )}

      {step === 3 && (
        <Step3CalismaGelir formData={formData} onChange={updateForm} />
      )}

      <div className="flex justify-between pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="secondary"
          onClick={handleBack}
          disabled={step === 1}
        >
          Geri
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={step === 2 && !canNext}
        >
          {isLast ? "Tamamla" : "İleri"}
        </Button>
      </div>
    </div>
  );
}
