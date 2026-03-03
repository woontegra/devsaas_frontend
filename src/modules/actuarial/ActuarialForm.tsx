import { useState } from "react";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import type { ActuarialInputPayload } from "../../services/api";

export interface ActuarialFormProps {
  onSubmit: (input: ActuarialInputPayload) => void;
  loading?: boolean;
}

const initial: ActuarialInputPayload = {
  birthDate: "",
  accidentDate: "",
  gender: "male",
  monthlyIncome: 0,
  disabilityRate: 0,
  interestRate: 0,
  wageIncreaseRate: 0,
};

export function ActuarialForm({ onSubmit, loading = false }: ActuarialFormProps) {
  const [birthDate, setBirthDate] = useState(initial.birthDate);
  const [accidentDate, setAccidentDate] = useState(initial.accidentDate);
  const [gender, setGender] = useState<"male" | "female">(initial.gender);
  const [monthlyIncome, setMonthlyIncome] = useState(String(initial.monthlyIncome));
  const [disabilityRate, setDisabilityRate] = useState(String(initial.disabilityRate));
  const [interestRate, setInterestRate] = useState(String(initial.interestRate));
  const [wageIncreaseRate, setWageIncreaseRate] = useState(String(initial.wageIncreaseRate));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      birthDate,
      accidentDate,
      gender,
      monthlyIncome: Number(monthlyIncome),
      disabilityRate: Number(disabilityRate),
      interestRate: Number(interestRate),
      wageIncreaseRate: Number(wageIncreaseRate),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Birth date"
        type="date"
        value={birthDate}
        onChange={(e) => setBirthDate(e.target.value)}
        required
      />
      <Input
        label="Accident date"
        type="date"
        value={accidentDate}
        onChange={(e) => setAccidentDate(e.target.value)}
        required
      />
      <div>
        <label className="block text-base font-medium text-slate-700 mb-1">Gender</label>
        <select
          className="w-full min-h-[44px] px-3 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={gender}
          onChange={(e) => setGender(e.target.value as "male" | "female")}
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
      <Input
        label="Monthly income"
        type="number"
        min={0}
        step={0.01}
        value={monthlyIncome}
        onChange={(e) => setMonthlyIncome(e.target.value)}
        required
      />
      <Input
        label="Disability rate (%)"
        type="number"
        min={0}
        max={100}
        step={0.1}
        value={disabilityRate}
        onChange={(e) => setDisabilityRate(e.target.value)}
        required
      />
      <Input
        label="Interest rate (e.g. 0.05 for 5%)"
        type="number"
        min={0}
        step={0.001}
        value={interestRate}
        onChange={(e) => setInterestRate(e.target.value)}
        required
      />
      <Input
        label="Wage increase rate (e.g. 0.03 for 3%)"
        type="number"
        min={0}
        step={0.001}
        value={wageIncreaseRate}
        onChange={(e) => setWageIncreaseRate(e.target.value)}
        required
      />
      <Button type="submit" fullWidth disabled={loading}>
        {loading ? "Calculating…" : "Calculate"}
      </Button>
    </form>
  );
}
