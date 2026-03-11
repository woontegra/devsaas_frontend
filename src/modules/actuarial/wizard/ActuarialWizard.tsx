import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "../../../components/ui/Button";
import { uiText } from "../../../config/uiText";
import { defaultCaseFormState } from "../types/caseFormTypes";
import type { ActuarialCaseFormState, CalculationType } from "../types/caseFormTypes";
import {
  defaultTrafficInjuryFormData,
  type TrafficInjuryFormData,
} from "../types/trafficInjuryFormTypes";
import { Step0CalculationType } from "./Step0CalculationType";
import { Step1Personal } from "./Step1Personal";
import { Step2Income } from "./Step2Income";
import { Step3Actuarial } from "./Step3Actuarial";
import { Step4Support } from "./Step4Support";
import { Step5Result } from "./Step5Result";
import { Step2DavaciBilgileri } from "./Step2DavaciBilgileri";
import { Step3CalismaGelir } from "./Step3CalismaGelir";
import { Step4KusurTablosu } from "./Step4KusurTablosu";
import { Step5MaluliyetOrani } from "./Step5MaluliyetOrani";
import { Step6DigerGiderler } from "./Step6DigerGiderler";
import { Step7PesinSermayeDegeri } from "./Step7PesinSermayeDegeri";
import { Step8DigerOdemeler } from "./Step8DigerOdemeler";
import type { ActuarialInputPayload, ActuarialResultPayload } from "../../../services/api";

function getAgeAtEvent(birthDate: string, eventDate: string): number {
  if (!birthDate || !eventDate) return 0;
  const b = new Date(birthDate);
  const e = new Date(eventDate);
  const years = (e.getTime() - b.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.floor(years * 100) / 100;
}

const stepLabels = [
  { id: 0, label: uiText.wizard.step0 },
  { id: 1, label: uiText.wizard.step1 },
  { id: 2, label: uiText.wizard.step2 },
  { id: 3, label: uiText.wizard.step3 },
  { id: 4, label: uiText.wizard.step4 },
  { id: 5, label: uiText.wizard.step5 },
];

const trafficInjuryStepLabels = [
  { id: 0, label: uiText.wizard.step0 },
  { id: 1, label: "Davacı Bilgileri" },
  { id: 2, label: "Çalışma ve Gelir Bilgileri" },
  { id: 3, label: "Kusur Tablosu" },
  { id: 4, label: "Maluliyet Oranı" },
  { id: 5, label: "Diğer Giderler" },
  { id: 6, label: "Peşin Sermaye Değeri" },
  { id: 7, label: "Diğer Ödemeler" },
];

export interface ActuarialWizardProps {
  onSubmit: (input: ActuarialInputPayload) => void;
  onSubmitByType?: (type: CalculationType, params: Record<string, unknown>) => Promise<ActuarialResultPayload | null>;
  result: ActuarialResultPayload | null;
  loading?: boolean;
  /** Sonuç kartı yokken wizard tam genişlik kullanır */
  fullWidth?: boolean;
}

function toLegacyPayload(form: ActuarialCaseFormState): ActuarialInputPayload {
  const annual = form.income.netSalary > 0 ? form.income.netSalary : form.income.grossSalary;
  const monthlyIncome = annual / 12;
  return {
    birthDate: form.personal.birthDate,
    accidentDate: form.personal.eventDate,
    gender: form.personal.gender,
    monthlyIncome,
    disabilityRate: form.actuarial.maluliyetOrani || 100,
    interestRate: form.actuarial.discountRate,
    wageIncreaseRate: form.actuarial.increaseRate,
  };
}

function buildParamsByType(form: ActuarialCaseFormState): Record<string, unknown> {
  const age = getAgeAtEvent(form.personal.birthDate, form.personal.eventDate);
  const yearlyIncome =
    (form.income.netSalary > 0 ? form.income.netSalary : form.income.grossSalary) || 0;
  const faultRatio = (form.accident.plaintiffFaultRatio ?? 0) / 100;
  const supportShares =
    form.supports.length > 0
      ? form.supports.map((s) => s.shareRatio || 0)
      : [1];

  const base = {
    age,
    gender: form.personal.gender,
    yearlyIncome,
    increaseRate: form.actuarial.increaseRate,
    discountRate: form.actuarial.discountRate,
  };

  const retirementAge =
    form.actuarial.retirementAgeOverride != null ? form.actuarial.retirementAgeOverride : undefined;

  switch (form.calculationType) {
    case "TRAFFIC_DEATH":
      return { ...base, supportShares, faultRatio, ...(retirementAge != null && { retirementAge }) };
    case "TRAFFIC_INJURY":
      return {
        ...base,
        maluliyetOrani: form.actuarial.maluliyetOrani ?? 100,
        faultRatio,
        ...(retirementAge != null && { retirementAge }),
      };
    case "WORK_DEATH":
      return {
        ...base,
        supportShares,
        faultRatio,
        sgkGeliri: form.actuarial.sgkGeliri ?? 0,
        monthlySgkIncome: form.actuarial.monthlySgkIncome ? form.actuarial.monthlySgkIncome : undefined,
        ...(retirementAge != null && { retirementAge }),
      };
    case "WORK_INJURY":
      return {
        ...base,
        maluliyetOrani: form.actuarial.maluliyetOrani ?? 100,
        sgkGeliri: form.actuarial.sgkGeliri ?? 0,
        monthlySgkIncome: form.actuarial.monthlySgkIncome ? form.actuarial.monthlySgkIncome : undefined,
        faultRatio,
        temporaryDisabilityStartDate: form.actuarial.temporaryDisabilityStartDate || undefined,
        temporaryDisabilityEndDate: form.actuarial.temporaryDisabilityEndDate || undefined,
        monthlyCareCost: form.actuarial.monthlyCareCost ? form.actuarial.monthlyCareCost : undefined,
        ...(retirementAge != null && { retirementAge }),
      };
    default:
      return { ...base, supportShares: [1], faultRatio: 0 };
  }
}

const deathTypes: CalculationType[] = ["TRAFFIC_DEATH", "WORK_DEATH"];

export function ActuarialWizard({
  onSubmit,
  onSubmitByType,
  result,
  loading = false,
  fullWidth = false,
}: ActuarialWizardProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ActuarialCaseFormState>(defaultCaseFormState);
  const [trafficInjuryFormData, setTrafficInjuryFormData] =
    useState<TrafficInjuryFormData>(defaultTrafficInjuryFormData);

  const steps = useMemo(() => {
    if (form.calculationType === "TRAFFIC_INJURY") return trafficInjuryStepLabels;
    const showSupport = deathTypes.includes(form.calculationType);
    if (showSupport) return stepLabels;
    return stepLabels.filter((s) => s.id !== 4);
  }, [form.calculationType]);

  const maxStep = Math.max(...steps.map((s) => s.id));
  const isTrafficInjuryLast = form.calculationType === "TRAFFIC_INJURY" && step === 7;
  const isResultStep = step === 5 && form.calculationType !== "TRAFFIC_INJURY";

  const updateTrafficInjuryForm = useCallback((patch: Partial<TrafficInjuryFormData>) => {
    setTrafficInjuryFormData((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    if (form.calculationType !== "TRAFFIC_INJURY") return;
    setForm((f) => ({
      ...f,
      personal: {
        ...f.personal,
        birthDate: trafficInjuryFormData.birthDate,
        eventDate: trafficInjuryFormData.eventDate,
        calculationDate: trafficInjuryFormData.calculationDate,
        gender: trafficInjuryFormData.gender,
      },
    }));
  }, [
    form.calculationType,
    trafficInjuryFormData.birthDate,
    trafficInjuryFormData.eventDate,
    trafficInjuryFormData.calculationDate,
    trafficInjuryFormData.gender,
  ]);

  useEffect(() => {
    if (form.calculationType !== "TRAFFIC_INJURY") return;
    setForm((f) => ({
      ...f,
      accident: {
        ...f.accident,
        plaintiffFaultRatio: trafficInjuryFormData.plaintiffFaultRate ?? 0,
      },
      actuarial: {
        ...f.actuarial,
        maluliyetOrani: trafficInjuryFormData.maluliyetOrani ?? 0,
        retirementAgeOverride:
          trafficInjuryFormData.isPassiveAgeManuallyEdited &&
          trafficInjuryFormData.passiveStartAge != null &&
          trafficInjuryFormData.passiveStartAge >= 0
            ? trafficInjuryFormData.passiveStartAge
            : undefined,
      },
      income: {
        ...f.income,
        netSalary: trafficInjuryFormData.gelir ?? 0,
        grossSalary: trafficInjuryFormData.gelir ?? 0,
      },
    }));
  }, [
    form.calculationType,
    trafficInjuryFormData.plaintiffFaultRate,
    trafficInjuryFormData.maluliyetOrani,
    trafficInjuryFormData.isPassiveAgeManuallyEdited,
    trafficInjuryFormData.passiveStartAge,
    trafficInjuryFormData.gelir,
  ]);

  const updateCalculationType = (calculationType: CalculationType) => {
    setForm((f) => ({ ...f, calculationType }));
  };
  const updatePersonal = (patch: Partial<ActuarialCaseFormState["personal"]>) => {
    setForm((f) => ({ ...f, personal: { ...f.personal, ...patch } }));
  };
  const updateAccident = (patch: Partial<ActuarialCaseFormState["accident"]>) => {
    setForm((f) => ({ ...f, accident: { ...f.accident, ...patch } }));
  };
  const updateIncome = (patch: Partial<ActuarialCaseFormState["income"]>) => {
    setForm((f) => ({ ...f, income: { ...f.income, ...patch } }));
  };
  const updateActuarial = (patch: Partial<ActuarialCaseFormState["actuarial"]>) => {
    setForm((f) => ({ ...f, actuarial: { ...f.actuarial, ...patch } }));
  };
  const updateSupports = (supports: ActuarialCaseFormState["supports"]) => {
    setForm((f) => ({ ...f, supports }));
  };

  const goNext = () => {
    if (step === 3 && !deathTypes.includes(form.calculationType)) {
      setStep(5);
      return;
    }
    setStep((s) => Math.min(maxStep, s + 1));
  };

  const goPrev = () => {
    if (step === 5 && !deathTypes.includes(form.calculationType)) {
      setStep(3);
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  };

  const handleFinalSubmit = () => {
    if (onSubmitByType) {
      const params = buildParamsByType(form);
      void onSubmitByType(form.calculationType, params);
      return;
    }
    onSubmit(toLegacyPayload(form));
  };

  return (
    <div className={fullWidth ? "w-full" : "max-w-2xl mx-auto"}>
      <div className="flex gap-1.5 mb-5 overflow-x-auto overflow-y-hidden pb-1.5">
        {steps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            className={`shrink-0 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              step === s.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-4 sm:p-5 md:p-6 min-h-[260px]">
        {step === 0 && (
          <Step0CalculationType
            value={form.calculationType}
            onChange={updateCalculationType}
          />
        )}
        {step === 1 && form.calculationType === "TRAFFIC_INJURY" && (
          <Step2DavaciBilgileri
            formData={trafficInjuryFormData}
            onChange={updateTrafficInjuryForm}
          />
        )}
        {step === 1 && form.calculationType !== "TRAFFIC_INJURY" && (
          <Step1Personal
            personal={form.personal}
            accident={form.accident}
            onPersonalChange={updatePersonal}
            onAccidentChange={updateAccident}
          />
        )}
        {step === 2 && form.calculationType === "TRAFFIC_INJURY" && (
          <Step3CalismaGelir
            formData={trafficInjuryFormData}
            onChange={updateTrafficInjuryForm}
          />
        )}
        {step === 2 && form.calculationType !== "TRAFFIC_INJURY" && (
          <Step2Income income={form.income} onChange={updateIncome} />
        )}
        {step === 3 && form.calculationType === "TRAFFIC_INJURY" && (
          <Step4KusurTablosu
            formData={trafficInjuryFormData}
            onChange={updateTrafficInjuryForm}
          />
        )}
        {step === 4 && form.calculationType === "TRAFFIC_INJURY" && (
          <Step5MaluliyetOrani
            formData={trafficInjuryFormData}
            onChange={updateTrafficInjuryForm}
          />
        )}
        {step === 5 && form.calculationType === "TRAFFIC_INJURY" && (
          <Step6DigerGiderler
            formData={trafficInjuryFormData}
            onChange={updateTrafficInjuryForm}
          />
        )}
        {step === 6 && form.calculationType === "TRAFFIC_INJURY" && (
          <Step7PesinSermayeDegeri />
        )}
        {step === 7 && form.calculationType === "TRAFFIC_INJURY" && (
          <Step8DigerOdemeler
            formData={trafficInjuryFormData}
            onCalculate={handleFinalSubmit}
            loading={loading}
          />
        )}
        {step === 3 && form.calculationType !== "TRAFFIC_INJURY" && (
          <Step3Actuarial
            actuarial={form.actuarial}
            onChange={updateActuarial}
            calculationType={form.calculationType}
          />
        )}
        {step === 4 && form.calculationType !== "TRAFFIC_INJURY" && (
          <Step4Support supports={form.supports} onChange={updateSupports} />
        )}
        {step === 5 && form.calculationType !== "TRAFFIC_INJURY" && (
          <Step5Result result={result} loading={loading} />
        )}
      </div>

      <div className="flex justify-between mt-4 gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={goPrev}
          disabled={step === 0}
        >
          {uiText.wizard.back}
        </Button>
        {!isResultStep && !isTrafficInjuryLast ? (
          <Button type="button" onClick={goNext}>
            {uiText.wizard.next}
          </Button>
        ) : isResultStep ? (
          <Button type="button" onClick={handleFinalSubmit} disabled={loading}>
            {loading ? uiText.wizard.calculating : uiText.wizard.calculate}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
