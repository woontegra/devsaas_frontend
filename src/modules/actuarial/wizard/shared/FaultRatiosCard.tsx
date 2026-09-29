import { FormSection, TextInput, WarningAlert } from "./FormPrimitives";

export interface FaultRatioRowModel {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

export function FaultRatiosCard({
  rows,
  emptyMessage,
  externalFault,
  onExternalFaultChange,
  externalError,
  totalFault,
  showTotalLine = false,
}: {
  rows: FaultRatioRowModel[];
  emptyMessage?: string;
  externalFault: number;
  onExternalFaultChange: (value: number) => void;
  externalError?: string;
  totalFault: number;
  showTotalLine?: boolean;
}) {
  const faultWarn = Math.abs(totalFault - 100) > 0.001;

  return (
    <FormSection title="Kusur Oranları">
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.id}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
              <p className="flex-1 text-[14px] font-medium text-slate-800">{row.label}</p>
              <div className="flex items-center gap-1.5 w-full sm:w-36">
                <TextInput
                  type="number"
                  min={0}
                  max={100}
                  inputMode="decimal"
                  value={row.value}
                  onChange={(e) => row.onChange(Number(e.target.value))}
                />
                <span className="text-[13px] text-slate-500">%</span>
              </div>
            </div>
            {row.error && <p className="text-[12px] text-red-600">{row.error}</p>}
          </div>
        ))}

        {emptyMessage && <p className="text-[13px] text-slate-500">{emptyMessage}</p>}

        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
          <p className="flex-1 text-[14px] font-medium text-slate-800">Dava Dışı Kusur</p>
          <div className="flex items-center gap-1.5 w-full sm:w-36">
            <TextInput
              type="number"
              min={0}
              max={100}
              inputMode="decimal"
              value={externalFault}
              onChange={(e) => onExternalFaultChange(Number(e.target.value))}
            />
            <span className="text-[13px] text-slate-500">%</span>
          </div>
        </div>
        {externalError && <p className="text-[12px] text-red-600">{externalError}</p>}

        {showTotalLine && (
          <p className="text-[13px] text-slate-600">
            Toplam: <strong>%{totalFault.toFixed(0)}</strong> / %100
          </p>
        )}

        {faultWarn && (
          <WarningAlert>
            Kusur oranları toplamı %{totalFault.toFixed(0)}. Toplam %100 olmalıdır (otomatik
            düzeltilmez).
          </WarningAlert>
        )}
      </div>
    </FormSection>
  );
}
