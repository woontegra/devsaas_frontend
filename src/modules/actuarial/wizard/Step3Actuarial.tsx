import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { CurrencyInput } from "./shared/FormPrimitives";
import { uiText } from "../../../config/uiText";
import type { ActuarialParams, CalculationType } from "../types/caseFormTypes";

const t = uiText.actuarial;

interface Step3ActuarialProps {
  actuarial: ActuarialParams;
  onChange: (a: Partial<ActuarialParams>) => void;
  calculationType?: CalculationType;
}

const injuryTypes: CalculationType[] = ["TRAFFIC_INJURY", "WORK_INJURY"];
const workTypes: CalculationType[] = ["WORK_DEATH", "WORK_INJURY"];
const isWorkInjury = (c?: CalculationType) => c === "WORK_INJURY";

export function Step3Actuarial({ actuarial, onChange, calculationType }: Step3ActuarialProps) {
  const showMaluliyet = calculationType && injuryTypes.includes(calculationType);
  const showSgkGeliri = calculationType && workTypes.includes(calculationType);
  const showWorkInjuryExtras = isWorkInjury(calculationType);

  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">{t.title}</h3>
      <Select label={t.lifeTable} value={actuarial.lifeTable} onChange={(e) => onChange({ lifeTable: e.target.value as ActuarialParams["lifeTable"] })} options={[{ value: "TRH2010", label: t.tableTRH2010 }, { value: "CSO1980", label: t.tableCSO1980 }, { value: "PMF1931", label: t.tablePMF1931 }]} />
      <Input label={t.activePeriodAge} type="number" min={0} value={String(actuarial.activePeriodAge)} onChange={(e) => onChange({ activePeriodAge: Number(e.target.value) || 0 })} />
      <Input label={t.passivePeriodAge} type="number" min={0} value={String(actuarial.passivePeriodAge)} onChange={(e) => onChange({ passivePeriodAge: Number(e.target.value) || 0 })} />
      {showMaluliyet && (
        <Input label={t.maluliyetOrani} type="number" min={0} max={100} step={0.5} value={String(actuarial.maluliyetOrani)} onChange={(e) => onChange({ maluliyetOrani: Number(e.target.value) || 0 })} />
      )}
      {showSgkGeliri && (
        <>
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[11px] font-normal text-gray-500 tracking-wide">{t.monthlySgkIncome}</label>
            <CurrencyInput value={actuarial.monthlySgkIncome ?? 0} onChange={(v) => onChange({ monthlySgkIncome: v })} />
          </div>
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[11px] font-normal text-gray-500 tracking-wide">{t.sgkGeliri}</label>
            <CurrencyInput value={actuarial.sgkGeliri} onChange={(v) => onChange({ sgkGeliri: v })} />
          </div>
        </>
      )}
      {showWorkInjuryExtras && (
        <>
          <Input label={t.temporaryDisabilityStartDate} type="date" value={actuarial.temporaryDisabilityStartDate ?? ""} onChange={(e) => onChange({ temporaryDisabilityStartDate: e.target.value })} />
          <Input label={t.temporaryDisabilityEndDate} type="date" value={actuarial.temporaryDisabilityEndDate ?? ""} onChange={(e) => onChange({ temporaryDisabilityEndDate: e.target.value })} />
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[11px] font-normal text-gray-500 tracking-wide">{t.monthlyCareCost}</label>
            <CurrencyInput value={actuarial.monthlyCareCost ?? 0} onChange={(v) => onChange({ monthlyCareCost: v })} />
          </div>
        </>
      )}
      <Input label={t.increaseRate} type="number" min={0} step={0.01} value={String(actuarial.increaseRate)} onChange={(e) => onChange({ increaseRate: Number(e.target.value) || 0 })} />
      <Input label={t.discountRate} type="number" min={0} step={0.01} value={String(actuarial.discountRate)} onChange={(e) => onChange({ discountRate: Number(e.target.value) || 0 })} />
      <div className="flex items-center gap-2 pt-1">
        <input type="checkbox" id="progressiveRant" checked={actuarial.progressiveRant} onChange={(e) => onChange({ progressiveRant: e.target.checked })} className="h-3.5 w-3.5 rounded border-gray-300" />
        <label htmlFor="progressiveRant" className="text-[12px] font-medium text-gray-600">{t.progressiveRant}</label>
      </div>
    </div>
  );
}
