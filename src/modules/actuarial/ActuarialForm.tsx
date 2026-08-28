import { useState } from "react";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { CurrencyInput } from "./wizard/shared/FormPrimitives";
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

function InputCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[14px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-6 transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus-within:shadow-[0_0_0_2px_rgba(37,99,235,0.2)] mb-4">
      <h3 className="text-[14px] font-medium text-gray-500 uppercase tracking-wider mb-4">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function ActuarialForm({ onSubmit, loading = false }: ActuarialFormProps) {
  const [birthDate, setBirthDate] = useState(initial.birthDate);
  const [accidentDate, setAccidentDate] = useState(initial.accidentDate);
  const [gender, setGender] = useState<"male" | "female">(initial.gender);
  const [monthlyIncome, setMonthlyIncome] = useState(initial.monthlyIncome);
  const [disabilityRate, setDisabilityRate] = useState(String(initial.disabilityRate));
  const [interestRate, setInterestRate] = useState(String(initial.interestRate));
  const [wageIncreaseRate, setWageIncreaseRate] = useState(String(initial.wageIncreaseRate));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      birthDate,
      accidentDate,
      gender,
      monthlyIncome,
      disabilityRate: Number(disabilityRate),
      interestRate: Number(interestRate),
      wageIncreaseRate: Number(wageIncreaseRate),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputCard title="Kişisel Bilgiler">
        <Input
          label="Doğum Tarihi"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          required
        />
        <Input
          label="Olay Tarihi"
          type="date"
          value={accidentDate}
          onChange={(e) => setAccidentDate(e.target.value)}
          required
        />
        <Select
          label="Cinsiyet"
          value={gender}
          onChange={(e) => setGender(e.target.value as "male" | "female")}
          options={[
            { value: "male", label: "Erkek" },
            { value: "female", label: "Kadın" },
          ]}
        />
      </InputCard>
      <InputCard title="Finansal Veriler">
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-[11px] font-normal text-gray-500 tracking-wide">Aylık Gelir *</label>
          <CurrencyInput
            value={monthlyIncome}
            onChange={setMonthlyIncome}
          />
        </div>
        <Input
          label="Maluliyet Oranı (%)"
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={disabilityRate}
          onChange={(e) => setDisabilityRate(e.target.value)}
          required
        />
      </InputCard>
      <InputCard title="Ekonomik Parametreler">
        <Input
          label="Faiz Oranı"
          type="number"
          min={0}
          step={0.001}
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
          required
        />
        <Input
          label="Ücret Artış Oranı"
          type="number"
          min={0}
          step={0.001}
          value={wageIncreaseRate}
          onChange={(e) => setWageIncreaseRate(e.target.value)}
          required
        />
      </InputCard>
      <div className="hidden md:block">
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Hesaplanıyor…" : "Hesapla"}
        </Button>
      </div>
    </form>
  );
}
