import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { uiText } from "../../../config/uiText";
import type { IncomeInfo } from "../types/caseFormTypes";

const ti = uiText.income;

interface Step2IncomeProps {
  income: IncomeInfo;
  onChange: (i: Partial<IncomeInfo>) => void;
}

export function Step2Income({ income, onChange }: Step2IncomeProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">{ti.title}</h3>
      <Input label={ti.grossSalary} type="number" min={0} value={String(income.grossSalary)} onChange={(e) => onChange({ grossSalary: Number(e.target.value) || 0 })} />
      <Input label={ti.netSalary} type="number" min={0} value={String(income.netSalary)} onChange={(e) => onChange({ netSalary: Number(e.target.value) || 0 })} />
      <Select label={ti.incomeType} value={income.incomeType} onChange={(e) => onChange({ incomeType: e.target.value as IncomeInfo["incomeType"] })} options={[{ value: "min_wage", label: ti.typeMinWage }, { value: "comparable_wage", label: ti.typeComparableWage }, { value: "sgk_income", label: ti.typeSgkIncome }]} />
      <Input label={ti.incomeStartDate} type="date" value={income.incomeStartDate} onChange={(e) => onChange({ incomeStartDate: e.target.value })} />
      <Input label={ti.incomeIncreaseRate} type="number" min={0} step={0.01} value={String(income.incomeIncreaseRate)} onChange={(e) => onChange({ incomeIncreaseRate: Number(e.target.value) || 0 })} />
    </div>
  );
}
