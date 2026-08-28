import { Input } from "../../../components/ui/Input";
import { CurrencyInput } from "./shared/FormPrimitives";
import { formTypography } from "../../../styles/formTypography";
import type {
  TrafficInjuryFormData,
  HospitalBillRow,
  CaregiverExpenseRow,
  OtherExpenseRow,
} from "../types/trafficInjuryFormTypes";

export interface Step6DigerGiderlerProps {
  formData: TrafficInjuryFormData;
  onChange: (data: Partial<TrafficInjuryFormData>) => void;
}

const emptyHospitalBill = (): HospitalBillRow => ({ date: "", amount: 0 });
const emptyCaregiverExpense = (): CaregiverExpenseRow => ({
  startDate: "",
  endDate: "",
  amount: 0,
});
const emptyOtherExpense = (): OtherExpenseRow => ({
  name: "",
  date: "",
  amount: 0,
});

export function Step6DigerGiderler({
  formData,
  onChange,
}: Step6DigerGiderlerProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-x-6 gap-y-6">
        {/* Hastane Faturaları */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-3">
            <span className={formTypography.label}>Hastane Faturaları</span>
            <button
              type="button"
              onClick={() =>
                onChange({
                  hospitalBills: [...(formData.hospitalBills ?? []), emptyHospitalBill()],
                })
              }
              className="text-[13px] font-medium text-app-primary hover:text-app-accent"
            >
              Fatura Ekle
            </button>
          </div>
          <div className="space-y-4">
            {formData.hospitalBills.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-2 gap-x-4 gap-y-2 items-end pb-4 border-b border-gray-100 last:border-0"
              >
                <Input
                  label="Tarih"
                  type="date"
                  value={row.date}
                  onChange={(e) =>
                    onChange({
                      hospitalBills: (formData.hospitalBills ?? []).map((r, i) =>
                        i === index ? { ...r, date: e.target.value } : r
                      ),
                    })
                  }
                />
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-[11px] font-normal text-gray-500 tracking-wide">Ödenen Miktar</label>
                      <CurrencyInput
                        value={row.amount}
                        onChange={(v) =>
                          onChange({
                            hospitalBills: (formData.hospitalBills ?? []).map((r, i) =>
                              i === index ? { ...r, amount: v } : r
                            ),
                          })
                        }
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        hospitalBills: (formData.hospitalBills ?? []).filter(
                          (_, i) => i !== index
                        ),
                      })
                    }
                    className="shrink-0 h-9 px-2 text-[12px] text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bakıcı Giderleri */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-3">
            <span className={formTypography.label}>Bakıcı Giderleri</span>
            <button
              type="button"
              onClick={() =>
                onChange({
                  caregiverExpenses: [
                    ...(formData.caregiverExpenses ?? []),
                    emptyCaregiverExpense(),
                  ],
                })
              }
              className="text-[13px] font-medium text-app-primary hover:text-app-accent"
            >
              Bakıcı Gideri Ekle
            </button>
          </div>
          <div className="space-y-4">
            {(formData.caregiverExpenses ?? []).map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-2 gap-x-4 gap-y-2 items-end pb-4 border-b border-gray-100 last:border-0"
              >
                <Input
                  label="Başlangıç Tarihi"
                  type="date"
                  value={row.startDate}
                  onChange={(e) =>
                    onChange({
                      caregiverExpenses: (formData.caregiverExpenses ?? []).map((r, i) =>
                        i === index ? { ...r, startDate: e.target.value } : r
                      ),
                    })
                  }
                />
                <Input
                  label="Bitiş Tarihi"
                  type="date"
                  value={row.endDate}
                  onChange={(e) =>
                    onChange({
                      caregiverExpenses: (formData.caregiverExpenses ?? []).map((r, i) =>
                        i === index ? { ...r, endDate: e.target.value } : r
                      ),
                    })
                  }
                />
                <div className="col-span-2 flex gap-2 items-end">
                  <div className="flex-1">
                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-[11px] font-normal text-gray-500 tracking-wide">Ödenen Miktar</label>
                      <CurrencyInput
                        value={row.amount}
                        onChange={(v) =>
                          onChange({
                            caregiverExpenses: (formData.caregiverExpenses ?? []).map((r, i) =>
                              i === index ? { ...r, amount: v } : r
                            ),
                          })
                        }
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        caregiverExpenses: (formData.caregiverExpenses ?? []).filter(
                          (_, i) => i !== index
                        ),
                      })
                    }
                    className="shrink-0 h-9 px-2 text-[12px] text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diğer Giderler */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-3">
            <span className={formTypography.label}>Diğer Giderler</span>
            <button
              type="button"
              onClick={() =>
                onChange({
                  otherExpenses: [...(formData.otherExpenses ?? []), emptyOtherExpense()],
                })
              }
              className="text-[13px] font-medium text-app-primary hover:text-app-accent"
            >
              Diğer Gider Ekle
            </button>
          </div>
          <div className="space-y-4">
            {(formData.otherExpenses ?? []).map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-2 gap-x-4 gap-y-2 items-end pb-4 border-b border-gray-100 last:border-0"
              >
                <Input
                  label="Gider Adı"
                  type="text"
                  value={row.name}
                  onChange={(e) =>
                    onChange({
                      otherExpenses: (formData.otherExpenses ?? []).map((r, i) =>
                        i === index ? { ...r, name: e.target.value } : r
                      ),
                    })
                  }
                />
                <Input
                  label="Tarih"
                  type="date"
                  value={row.date}
                  onChange={(e) =>
                    onChange({
                      otherExpenses: (formData.otherExpenses ?? []).map((r, i) =>
                        i === index ? { ...r, date: e.target.value } : r
                      ),
                    })
                  }
                />
                <div className="col-span-2 flex gap-2 items-end">
                  <div className="flex-1">
                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-[11px] font-normal text-gray-500 tracking-wide">Ücret</label>
                      <CurrencyInput
                        value={row.amount}
                        onChange={(v) =>
                          onChange({
                            otherExpenses: (formData.otherExpenses ?? []).map((r, i) =>
                              i === index ? { ...r, amount: v } : r
                            ),
                          })
                        }
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        otherExpenses: (formData.otherExpenses ?? []).filter(
                          (_, i) => i !== index
                        ),
                      })
                    }
                    className="shrink-0 h-9 px-2 text-[12px] text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
