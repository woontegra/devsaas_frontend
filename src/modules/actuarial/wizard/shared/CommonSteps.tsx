import type {
  CalculationDraft,
  CommonCaseInfo,
  IncomePeriod,
  LiabilityBlock,
  LiableParty,
  DisabilityBlock,
  TemporaryIncapacityPeriod,
  PriorPayment,
  Beneficiary,
  CareExpensesBlock,
  EmploymentInfo,
  CapitalValueDocument,
  SgkIncomeRecord,
  SgkDeathIncomeRecord,
  SupportRelation,
  ExpenseItem,
} from "../../types/calculationDraft";
import { newId } from "../../types/calculationDraft";
import {
  AddRowButton,
  EmptyState,
  FormField,
  FormGrid,
  FormSection,
  InfoAlert,
  TextInput,
  TextSelect,
  TextTextarea,
} from "../shared/FormPrimitives";
import type { StepProps } from "../shared/wizardTypes";
import { errorFor } from "../shared/wizardTypes";

function updateCommon(draft: CalculationDraft, patch: Partial<CommonCaseInfo>): CalculationDraft {
  return { ...draft, common: { ...draft.common, ...patch } };
}

export function CaseEventStep({ draft, onChange, fieldErrors }: StepProps) {
  const c = draft.common;
  return (
    <FormSection
      title="Dosya ve olay"
      description="Mahkeme, esas ve olay tarihleri. Sigorta alanları bilgilendirme amaçlıdır."
    >
      <FormGrid>
        <FormField label="Dahili dosya adı" error={errorFor(fieldErrors, "common.internalFileName")}>
          <TextInput
            value={c.internalFileName ?? ""}
            onChange={(e) => onChange(updateCommon(draft, { internalFileName: e.target.value }))}
          />
        </FormField>
        <FormField label="Mahkeme">
          <TextInput
            value={c.courtName ?? ""}
            onChange={(e) => onChange(updateCommon(draft, { courtName: e.target.value }))}
          />
        </FormField>
        <FormField label="Esas numarası">
          <TextInput
            value={c.caseNumber ?? ""}
            onChange={(e) => onChange(updateCommon(draft, { caseNumber: e.target.value }))}
          />
        </FormField>
        <FormField label="Olay tarihi" required error={errorFor(fieldErrors, "common.eventDate")}>
          <TextInput
            type="date"
            value={c.eventDate}
            onChange={(e) => onChange(updateCommon(draft, { eventDate: e.target.value }))}
          />
        </FormField>
        <FormField label="Hesap tarihi" required error={errorFor(fieldErrors, "common.calculationDate")}>
          <TextInput
            type="date"
            value={c.calculationDate}
            onChange={(e) => onChange(updateCommon(draft, { calculationDate: e.target.value }))}
          />
        </FormField>
        <FormField label="Sigorta şirketi">
          <TextInput
            value={c.insuranceCompany ?? ""}
            onChange={(e) => onChange(updateCommon(draft, { insuranceCompany: e.target.value }))}
          />
        </FormField>
        <FormField label="Poliçe numarası">
          <TextInput
            value={c.policyNumber ?? ""}
            onChange={(e) => onChange(updateCommon(draft, { policyNumber: e.target.value }))}
          />
        </FormField>
      </FormGrid>
      <FormField label="Olay açıklaması">
        <TextTextarea
          value={c.eventDescription ?? ""}
          onChange={(e) => onChange(updateCommon(draft, { eventDescription: e.target.value }))}
        />
      </FormField>
      <FormField label="Teminat bilgisi">
        <TextTextarea
          value={c.coverageNotes ?? ""}
          onChange={(e) => onChange(updateCommon(draft, { coverageNotes: e.target.value }))}
        />
      </FormField>
    </FormSection>
  );
}

export function IncomePeriodsStep({ draft, onChange, fieldErrors }: StepProps) {
  if (draft.calculationType === "TRAFFIC_INJURY") return null;
  const periods = draft.incomePeriods;
  const setPeriods = (incomePeriods: IncomePeriod[]) => onChange({ ...draft, incomePeriods });

  return (
    <FormSection
      title="Çalışma ve gelir"
      description="Gelir dönemlerini tablo olarak girin. Bu aşamada tazminat hesaplanmaz."
    >
      {errorFor(fieldErrors, "incomePeriods") && (
        <p className="text-sm text-red-600">{errorFor(fieldErrors, "incomePeriods")}</p>
      )}
      {periods.length === 0 ? (
        <EmptyState
          title="Henüz gelir dönemi eklenmedi."
          actionLabel="Gelir Dönemi Ekle"
          onAction={() =>
            setPeriods([
              ...periods,
              {
                id: newId(),
                startDate: "",
                amount: 0,
                amountKind: "net",
                sourceType: "payroll",
              },
            ])
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2.5 font-medium">Başlangıç</th>
                <th className="px-3 py-2.5 font-medium">Bitiş</th>
                <th className="px-3 py-2.5 font-medium">Tür</th>
                <th className="px-3 py-2.5 font-medium">Net/Brüt</th>
                <th className="px-3 py-2.5 font-medium">Tutar</th>
                <th className="px-3 py-2.5 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p, i) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-2 py-2">
                    <TextInput
                      type="date"
                      value={p.startDate}
                      onChange={(e) =>
                        setPeriods(periods.map((x, idx) => (idx === i ? { ...x, startDate: e.target.value } : x)))
                      }
                    />
                  </td>
                  <td className="px-2 py-2">
                    <TextInput
                      type="date"
                      value={p.endDate ?? ""}
                      onChange={(e) =>
                        setPeriods(periods.map((x, idx) => (idx === i ? { ...x, endDate: e.target.value } : x)))
                      }
                    />
                  </td>
                  <td className="px-2 py-2">
                    <TextSelect
                      value={p.sourceType}
                      onChange={(e) =>
                        setPeriods(
                          periods.map((x, idx) =>
                            idx === i ? { ...x, sourceType: e.target.value as IncomePeriod["sourceType"] } : x
                          )
                        )
                      }
                    >
                      <option value="payroll">Bordro</option>
                      <option value="min_wage">Asgari</option>
                      <option value="comparable">Emsal</option>
                      <option value="wage">Ücret</option>
                      <option value="sgk">SGK</option>
                      <option value="other">Diğer</option>
                    </TextSelect>
                  </td>
                  <td className="px-2 py-2">
                    <TextSelect
                      value={p.amountKind}
                      onChange={(e) =>
                        setPeriods(
                          periods.map((x, idx) =>
                            idx === i ? { ...x, amountKind: e.target.value as "net" | "gross" } : x
                          )
                        )
                      }
                    >
                      <option value="net">Net</option>
                      <option value="gross">Brüt</option>
                    </TextSelect>
                  </td>
                  <td className="px-2 py-2">
                    <TextInput
                      type="number"
                      min={0}
                      value={p.amount || ""}
                      onChange={(e) =>
                        setPeriods(
                          periods.map((x, idx) =>
                            idx === i ? { ...x, amount: Number(e.target.value) || 0 } : x
                          )
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      className="text-red-600 text-xs font-medium"
                      onClick={() => setPeriods(periods.filter((_, idx) => idx !== i))}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {periods.length > 0 && (
        <AddRowButton
          label="Gelir Dönemi Ekle"
          onClick={() =>
            setPeriods([
              ...periods,
              { id: newId(), startDate: "", amount: 0, amountKind: "net", sourceType: "payroll" },
            ])
          }
        />
      )}
    </FormSection>
  );
}

export function LiabilityStep({
  draft,
  onChange,
  fieldErrors,
  showInevitability,
}: StepProps & { showInevitability?: boolean }) {
  const liability = draft.liability;
  const set = (liability: LiabilityBlock) => onChange({ ...draft, liability });
  const parties = liability.parties ?? [];
  const total =
    (Number(liability.injuredFaultRatio) || 0) +
    parties.reduce((s, p) => s + (Number(p.faultRatio) || 0), 0) +
    (showInevitability ? Number(liability.inevitabilityRatio) || 0 : 0);

  return (
    <FormSection
      title="Kusur ve sorumluluk"
      description="Oranlar otomatik düzeltilmez. Toplam yüzde 100 değilse uyarı üretilir."
    >
      <FormGrid>
        <FormField
          label="Zarar gören / işçi kusur oranı (%)"
          required
          error={errorFor(fieldErrors, "liability.injuredFaultRatio")}
        >
          <TextInput
            type="number"
            min={0}
            max={100}
            value={liability.injuredFaultRatio}
            onChange={(e) => set({ ...liability, injuredFaultRatio: Number(e.target.value) || 0 })}
          />
        </FormField>
        {showInevitability && (
          <FormField label="Kaçınılmazlık oranı (%)">
            <TextInput
              type="number"
              min={0}
              max={100}
              value={liability.inevitabilityRatio ?? 0}
              onChange={(e) => set({ ...liability, inevitabilityRatio: Number(e.target.value) || 0 })}
            />
          </FormField>
        )}
      </FormGrid>
      <p className="text-sm text-slate-600">
        Toplam: <strong>%{total.toFixed(2)}</strong>
        {Math.abs(total - 100) > 0.01 ? " — 100 beklenir (uyarı)" : ""}
      </p>

      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-800">Sorumlular</h4>
        <AddRowButton
          label="Sorumlu Ekle"
          onClick={() =>
            set({
              ...liability,
              parties: [
                ...parties,
                {
                  id: newId(),
                  partyType: showInevitability ? "employer" : "defendant",
                  name: "",
                  faultRatio: 0,
                } as LiableParty,
              ],
            })
          }
        />
      </div>
      {parties.length === 0 ? (
        <EmptyState
          title="Henüz sorumlu eklenmedi."
          actionLabel="Sorumlu Ekle"
          onAction={() =>
            set({
              ...liability,
              parties: [
                {
                  id: newId(),
                  partyType: showInevitability ? "employer" : "defendant",
                  name: "",
                  faultRatio: 0,
                },
              ],
            })
          }
        />
      ) : (
        <div className="space-y-3">
          {parties.map((p, i) => (
            <div key={p.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-xl border border-slate-200 p-3">
              <FormField label="Tür">
                <TextSelect
                  value={p.partyType}
                  onChange={(e) =>
                    set({
                      ...liability,
                      parties: parties.map((x, idx) =>
                        idx === i ? { ...x, partyType: e.target.value as LiableParty["partyType"] } : x
                      ),
                    })
                  }
                >
                  <option value="defendant">Davalı</option>
                  <option value="employer">İşveren</option>
                  <option value="subcontractor">Alt işveren</option>
                  <option value="third_party">Üçüncü kişi</option>
                  <option value="other">Diğer</option>
                </TextSelect>
              </FormField>
              <FormField label="Ad">
                <TextInput
                  value={p.name}
                  onChange={(e) =>
                    set({
                      ...liability,
                      parties: parties.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)),
                    })
                  }
                />
              </FormField>
              <FormField label="Kusur (%)">
                <TextInput
                  type="number"
                  min={0}
                  max={100}
                  value={p.faultRatio}
                  onChange={(e) =>
                    set({
                      ...liability,
                      parties: parties.map((x, idx) =>
                        idx === i ? { ...x, faultRatio: Number(e.target.value) || 0 } : x
                      ),
                    })
                  }
                />
              </FormField>
              <div className="flex items-end">
                <button
                  type="button"
                  className="text-sm text-red-600"
                  onClick={() => set({ ...liability, parties: parties.filter((_, idx) => idx !== i) })}
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </FormSection>
  );
}

export function DisabilityStep({ draft, onChange, fieldErrors }: StepProps) {
  if (draft.calculationType !== "TRAFFIC_INJURY" && draft.calculationType !== "WORK_INJURY") {
    return null;
  }
  const disability = draft.disability;
  const set = (disability: DisabilityBlock) => onChange({ ...draft, disability });
  return (
    <FormSection title="Maluliyet" description="Sürekli maluliyet / iş göremezlik bilgileri.">
      <FormGrid>
        <FormField
          label="Sürekli maluliyet / iş göremezlik oranı (%)"
          required
          error={errorFor(fieldErrors, "disability.permanentDisabilityRate")}
        >
          <TextInput
            type="number"
            min={0}
            max={100}
            value={disability.permanentDisabilityRate ?? ""}
            onChange={(e) =>
              set({
                ...disability,
                permanentDisabilityRate: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
          />
        </FormField>
        <FormField label="Maluliyet başlangıç tarihi">
          <TextInput
            type="date"
            value={disability.disabilityStartDate ?? ""}
            onChange={(e) => set({ ...disability, disabilityStartDate: e.target.value })}
          />
        </FormField>
        <FormField label="Rapor tarihi">
          <TextInput
            type="date"
            value={disability.reportDate ?? ""}
            onChange={(e) => set({ ...disability, reportDate: e.target.value })}
          />
        </FormField>
        <FormField label="Rapor dayanağı">
          <TextInput
            value={disability.reportBasis ?? ""}
            onChange={(e) => set({ ...disability, reportBasis: e.target.value })}
          />
        </FormField>
      </FormGrid>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={Boolean(disability.earningCapacityLoss)}
          onChange={(e) => set({ ...disability, earningCapacityLoss: e.target.checked })}
        />
        Meslekte kazanma gücü kaybı
      </label>
      <FormField label="Açıklama">
        <TextTextarea
          value={disability.notes ?? ""}
          onChange={(e) => set({ ...disability, notes: e.target.value })}
        />
      </FormField>
    </FormSection>
  );
}

export function TemporaryIncapacityStep({ draft, onChange }: StepProps) {
  if (draft.calculationType !== "TRAFFIC_INJURY" && draft.calculationType !== "WORK_INJURY") {
    return null;
  }
  const rows = draft.temporaryIncapacityPeriods;
  const set = (temporaryIncapacityPeriods: TemporaryIncapacityPeriod[]) =>
    onChange({ ...draft, temporaryIncapacityPeriods });
  return (
    <FormSection title="Geçici iş göremezlik" description="Birden fazla dönem eklenebilir.">
      {rows.length === 0 ? (
        <EmptyState
          title="Henüz geçici iş göremezlik dönemi eklenmedi."
          actionLabel="Dönem Ekle"
          onAction={() => set([...rows, { id: newId(), startDate: "", endDate: "" }])}
        />
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={r.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-xl border p-3">
              <FormField label="Başlangıç">
                <TextInput
                  type="date"
                  value={r.startDate}
                  onChange={(e) =>
                    set(rows.map((x, idx) => (idx === i ? { ...x, startDate: e.target.value } : x)))
                  }
                />
              </FormField>
              <FormField label="Bitiş">
                <TextInput
                  type="date"
                  value={r.endDate}
                  onChange={(e) =>
                    set(rows.map((x, idx) => (idx === i ? { ...x, endDate: e.target.value } : x)))
                  }
                />
              </FormField>
              <FormField label="Oran (%)">
                <TextInput
                  type="number"
                  value={r.rate ?? ""}
                  onChange={(e) =>
                    set(
                      rows.map((x, idx) =>
                        idx === i ? { ...x, rate: e.target.value === "" ? undefined : Number(e.target.value) } : x
                      )
                    )
                  }
                />
              </FormField>
              <div className="flex items-end">
                <button type="button" className="text-sm text-red-600" onClick={() => set(rows.filter((_, idx) => idx !== i))}>
                  Sil
                </button>
              </div>
            </div>
          ))}
          <AddRowButton label="Dönem Ekle" onClick={() => set([...rows, { id: newId(), startDate: "", endDate: "" }])} />
        </div>
      )}
    </FormSection>
  );
}

export function PriorPaymentsStep({ draft, onChange }: StepProps) {
  if (draft.calculationType === "TRAFFIC_INJURY") return null;
  const rows = draft.priorPayments;
  const set = (priorPayments: PriorPayment[]) => onChange({ ...draft, priorPayments });
  return (
    <FormSection title="Önceki ödemeler" description="Sigorta veya diğer ödeme kayıtları.">
      {rows.length === 0 ? (
        <EmptyState
          title="Henüz önceki ödeme eklenmedi."
          actionLabel="Ödeme Ekle"
          onAction={() => set([...rows, { id: newId(), amount: 0 }])}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2">Ödeyen</th>
                <th className="px-3 py-2">Tarih</th>
                <th className="px-3 py-2">Tür</th>
                <th className="px-3 py-2">Tutar</th>
                <th className="px-3 py-2">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">
                    <TextInput
                      value={r.payer ?? ""}
                      onChange={(e) => set(rows.map((x, idx) => (idx === i ? { ...x, payer: e.target.value } : x)))}
                    />
                  </td>
                  <td className="p-2">
                    <TextInput
                      type="date"
                      value={r.date ?? ""}
                      onChange={(e) => set(rows.map((x, idx) => (idx === i ? { ...x, date: e.target.value } : x)))}
                    />
                  </td>
                  <td className="p-2">
                    <TextInput
                      value={r.paymentType ?? ""}
                      onChange={(e) =>
                        set(rows.map((x, idx) => (idx === i ? { ...x, paymentType: e.target.value } : x)))
                      }
                    />
                  </td>
                  <td className="p-2">
                    <TextInput
                      type="number"
                      value={r.amount || ""}
                      onChange={(e) =>
                        set(rows.map((x, idx) => (idx === i ? { ...x, amount: Number(e.target.value) || 0 } : x)))
                      }
                    />
                  </td>
                  <td className="p-2">
                    <button type="button" className="text-red-600 text-xs" onClick={() => set(rows.filter((_, idx) => idx !== i))}>
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > 0 && <AddRowButton label="Ödeme Ekle" onClick={() => set([...rows, { id: newId(), amount: 0 }])} />}
    </FormSection>
  );
}

export function BeneficiariesStep({ draft, onChange, fieldErrors }: StepProps) {
  if (draft.calculationType !== "TRAFFIC_DEATH" && draft.calculationType !== "WORK_DEATH") return null;
  const rows = draft.beneficiaries;
  const set = (beneficiaries: Beneficiary[]) => onChange({ ...draft, beneficiaries });
  return (
    <FormSection title="Hak sahipleri" description="Ölüm hesaplarında en az bir hak sahibi gereklidir.">
      {errorFor(fieldErrors, "beneficiaries") && (
        <p className="text-sm text-red-600">{errorFor(fieldErrors, "beneficiaries")}</p>
      )}
      {rows.length === 0 ? (
        <EmptyState
          title="Henüz hak sahibi eklenmedi."
          actionLabel="Hak Sahibi Ekle"
          onAction={() =>
            set([
              ...rows,
              {
                id: newId(),
                fullName: "",
                relation: "spouse",
                birthDate: "",
                gender: "female",
              },
            ])
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map((b, i) => (
            <div key={b.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl border p-4">
              <FormField label="Ad soyad">
                <TextInput
                  value={b.fullName}
                  onChange={(e) => set(rows.map((x, idx) => (idx === i ? { ...x, fullName: e.target.value } : x)))}
                />
              </FormField>
              <FormField label="Yakınlık">
                <TextSelect
                  value={b.relation}
                  onChange={(e) =>
                    set(
                      rows.map((x, idx) =>
                        idx === i ? { ...x, relation: e.target.value as Beneficiary["relation"] } : x
                      )
                    )
                  }
                >
                  <option value="spouse">Eş</option>
                  <option value="child">Çocuk</option>
                  <option value="mother">Anne</option>
                  <option value="father">Baba</option>
                  <option value="sibling">Kardeş</option>
                  <option value="other">Diğer</option>
                </TextSelect>
              </FormField>
              <FormField label="Doğum tarihi">
                <TextInput
                  type="date"
                  value={b.birthDate}
                  onChange={(e) => set(rows.map((x, idx) => (idx === i ? { ...x, birthDate: e.target.value } : x)))}
                />
              </FormField>
              <FormField label="Cinsiyet">
                <TextSelect
                  value={b.gender}
                  onChange={(e) =>
                    set(
                      rows.map((x, idx) =>
                        idx === i ? { ...x, gender: e.target.value as "male" | "female" } : x
                      )
                    )
                  }
                >
                  <option value="female">Kadın</option>
                  <option value="male">Erkek</option>
                </TextSelect>
              </FormField>
              <FormField label="Eğitim durumu">
                <TextInput
                  value={b.educationStatus ?? ""}
                  onChange={(e) =>
                    set(rows.map((x, idx) => (idx === i ? { ...x, educationStatus: e.target.value } : x)))
                  }
                />
              </FormField>
              <div className="flex items-end">
                <button type="button" className="text-sm text-red-600" onClick={() => set(rows.filter((_, idx) => idx !== i))}>
                  Sil
                </button>
              </div>
            </div>
          ))}
          <AddRowButton
            label="Hak Sahibi Ekle"
            onClick={() =>
              set([
                ...rows,
                { id: newId(), fullName: "", relation: "child", birthDate: "", gender: "male" },
              ])
            }
          />
        </div>
      )}
    </FormSection>
  );
}

export function SupportRelationsStep({ draft, onChange }: StepProps) {
  if (draft.calculationType !== "TRAFFIC_DEATH" && draft.calculationType !== "WORK_DEATH") return null;
  const rows = draft.supportRelations;
  const beneficiaries = draft.beneficiaries;
  const set = (supportRelations: SupportRelation[]) => onChange({ ...draft, supportRelations });
  return (
    <FormSection
      title="Destek ilişkileri"
      description="Destek oranları kullanıcı tarafından girilir; bu aşamada otomatik hesap yapılmaz."
    >
      {rows.length === 0 ? (
        <EmptyState
          title="Henüz destek ilişkisi eklenmedi."
          actionLabel="Destek İlişkisi Ekle"
          onAction={() =>
            set([
              ...rows,
              { id: newId(), beneficiaryId: beneficiaries[0]?.id ?? "", actualSupport: true },
            ])
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map((s, i) => (
            <div key={s.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl border p-4">
              <FormField label="Hak sahibi">
                <TextSelect
                  value={s.beneficiaryId}
                  onChange={(e) =>
                    set(rows.map((x, idx) => (idx === i ? { ...x, beneficiaryId: e.target.value } : x)))
                  }
                >
                  <option value="">Seçiniz</option>
                  {beneficiaries.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.fullName || b.id}
                    </option>
                  ))}
                </TextSelect>
              </FormField>
              <FormField label="Başlangıç">
                <TextInput
                  type="date"
                  value={s.startDate ?? ""}
                  onChange={(e) => set(rows.map((x, idx) => (idx === i ? { ...x, startDate: e.target.value } : x)))}
                />
              </FormField>
              <FormField label="Bitiş">
                <TextInput
                  type="date"
                  value={s.endDate ?? ""}
                  onChange={(e) => set(rows.map((x, idx) => (idx === i ? { ...x, endDate: e.target.value } : x)))}
                />
              </FormField>
              <FormField label="Destek oranı girişi">
                <TextInput
                  type="number"
                  value={s.supportShareInput ?? ""}
                  onChange={(e) =>
                    set(
                      rows.map((x, idx) =>
                        idx === i
                          ? { ...x, supportShareInput: e.target.value === "" ? undefined : Number(e.target.value) }
                          : x
                      )
                    )
                  }
                />
              </FormField>
              <FormField label="Yeniden evlenme değerlendirmesi">
                <TextInput
                  value={s.remarriageAssessment ?? ""}
                  onChange={(e) =>
                    set(rows.map((x, idx) => (idx === i ? { ...x, remarriageAssessment: e.target.value } : x)))
                  }
                />
              </FormField>
              <div className="flex items-end">
                <button type="button" className="text-sm text-red-600" onClick={() => set(rows.filter((_, idx) => idx !== i))}>
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </FormSection>
  );
}

export function CareExpensesStep({ draft, onChange }: StepProps) {
  if (draft.calculationType !== "WORK_INJURY") return null;
  const block = draft.careAndExpenses;
  const set = (careAndExpenses: CareExpensesBlock) => onChange({ ...draft, careAndExpenses });
  const others = block.otherExpenses ?? [];
  return (
    <FormSection title="Bakıcı ve diğer giderler" description="Gider satırları kaydedilir; hesap yapılmaz.">
      <FormGrid>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(block.temporaryCaregiver)}
            onChange={(e) => set({ ...block, temporaryCaregiver: e.target.checked })}
          />
          Geçici bakıcı ihtiyacı
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(block.permanentCaregiver)}
            onChange={(e) => set({ ...block, permanentCaregiver: e.target.checked })}
          />
          Sürekli bakıcı ihtiyacı
        </label>
        <FormField label="Aylık bakıcı gideri">
          <TextInput
            type="number"
            value={block.monthlyCareCost ?? ""}
            onChange={(e) =>
              set({ ...block, monthlyCareCost: e.target.value === "" ? undefined : Number(e.target.value) })
            }
          />
        </FormField>
        <FormField label="Tedavi gideri">
          <TextInput
            type="number"
            value={block.treatmentCost ?? ""}
            onChange={(e) =>
              set({ ...block, treatmentCost: e.target.value === "" ? undefined : Number(e.target.value) })
            }
          />
        </FormField>
        <FormField label="Hastane gideri">
          <TextInput
            type="number"
            value={block.hospitalCost ?? ""}
            onChange={(e) =>
              set({ ...block, hospitalCost: e.target.value === "" ? undefined : Number(e.target.value) })
            }
          />
        </FormField>
        <FormField label="Protez/cihaz gideri">
          <TextInput
            type="number"
            value={block.prosthesisCost ?? ""}
            onChange={(e) =>
              set({ ...block, prosthesisCost: e.target.value === "" ? undefined : Number(e.target.value) })
            }
          />
        </FormField>
      </FormGrid>
      <AddRowButton
        label="Diğer Gider Ekle"
        onClick={() => set({ ...block, otherExpenses: [...others, { id: newId(), name: "", amount: 0 }] })}
      />
      {others.map((o, i) => (
        <div key={o.id} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField label="Gider adı">
            <TextInput
              value={o.name}
              onChange={(e) =>
                set({
                  ...block,
                  otherExpenses: others.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)),
                })
              }
            />
          </FormField>
          <FormField label="Tutar">
            <TextInput
              type="number"
              value={o.amount || ""}
              onChange={(e) =>
                set({
                  ...block,
                  otherExpenses: others.map((x, idx) =>
                    idx === i ? { ...x, amount: Number(e.target.value) || 0 } : x
                  ),
                })
              }
            />
          </FormField>
          <div className="flex items-end">
            <button
              type="button"
              className="text-sm text-red-600"
              onClick={() => set({ ...block, otherExpenses: others.filter((_, idx) => idx !== i) })}
            >
              Sil
            </button>
          </div>
        </div>
      ))}
    </FormSection>
  );
}

export function EmploymentStep({ draft, onChange, fieldErrors }: StepProps) {
  if (draft.calculationType !== "WORK_INJURY" && draft.calculationType !== "WORK_DEATH") return null;
  const employment = draft.employment;
  const set = (employment: EmploymentInfo) => onChange({ ...draft, employment });
  return (
    <FormSection title="Çalışma ve işveren bilgileri">
      <FormGrid>
        <FormField label="İşveren" required error={errorFor(fieldErrors, "employment.employerName")}>
          <TextInput
            value={employment.employerName ?? ""}
            onChange={(e) => set({ ...employment, employerName: e.target.value })}
          />
        </FormField>
        <FormField label="Alt işveren">
          <TextInput
            value={employment.subEmployerName ?? ""}
            onChange={(e) => set({ ...employment, subEmployerName: e.target.value })}
          />
        </FormField>
        <FormField label="İşe giriş tarihi">
          <TextInput
            type="date"
            value={employment.hireDate ?? ""}
            onChange={(e) => set({ ...employment, hireDate: e.target.value })}
          />
        </FormField>
        <FormField label="İşten çıkış tarihi">
          <TextInput
            type="date"
            value={employment.leaveDate ?? ""}
            onChange={(e) => set({ ...employment, leaveDate: e.target.value })}
          />
        </FormField>
        <FormField label="Olay tarihindeki görev">
          <TextInput
            value={employment.jobAtEvent ?? ""}
            onChange={(e) => set({ ...employment, jobAtEvent: e.target.value })}
          />
        </FormField>
        <FormField label="Sigortalılık durumu">
          <TextInput
            value={employment.insuranceStatus ?? ""}
            onChange={(e) => set({ ...employment, insuranceStatus: e.target.value })}
          />
        </FormField>
      </FormGrid>
    </FormSection>
  );
}

export function CapitalValueDocsStep({ draft, onChange }: StepProps) {
  if (draft.calculationType !== "WORK_INJURY" && draft.calculationType !== "WORK_DEATH") return null;
  const rows = draft.capitalValueDocuments;
  const set = (capitalValueDocuments: CapitalValueDocument[]) => onChange({ ...draft, capitalValueDocuments });
  return (
    <FormSection title="Peşin sermaye değeri bilgileri">
      <InfoAlert>
        Bu bölümde kullanıcı tarafından girilen SGK belge verileri kaydedilir. Sistem bu aşamada peşin
        sermaye değeri hesaplamaz.
      </InfoAlert>
      {rows.length === 0 ? (
        <EmptyState
          title="Henüz PSD belgesi eklenmedi."
          actionLabel="Belge Ekle"
          onAction={() => set([...rows, { id: newId() }])}
        />
      ) : (
        <div className="space-y-3">
          {rows.map((d, i) => (
            <div key={d.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl border p-4">
              <FormField label="Kişi / hak sahibi">
                <TextInput
                  value={d.personLabel ?? ""}
                  onChange={(e) => set(rows.map((x, idx) => (idx === i ? { ...x, personLabel: e.target.value } : x)))}
                />
              </FormField>
              <FormField label="İlk peşin sermaye değeri tutarı">
                <TextInput
                  type="number"
                  value={d.amount ?? ""}
                  onChange={(e) =>
                    set(
                      rows.map((x, idx) =>
                        idx === i ? { ...x, amount: e.target.value === "" ? undefined : Number(e.target.value) } : x
                      )
                    )
                  }
                />
              </FormField>
              <FormField label="Belge tarihi">
                <TextInput
                  type="date"
                  value={d.documentDate ?? ""}
                  onChange={(e) =>
                    set(rows.map((x, idx) => (idx === i ? { ...x, documentDate: e.target.value } : x)))
                  }
                />
              </FormField>
              <FormField label="Belge numarası">
                <TextInput
                  value={d.documentNumber ?? ""}
                  onChange={(e) =>
                    set(rows.map((x, idx) => (idx === i ? { ...x, documentNumber: e.target.value } : x)))
                  }
                />
              </FormField>
              <label className="flex items-center gap-2 text-sm mt-6">
                <input
                  type="checkbox"
                  checked={Boolean(d.recourseIndicated)}
                  onChange={(e) =>
                    set(rows.map((x, idx) => (idx === i ? { ...x, recourseIndicated: e.target.checked } : x)))
                  }
                />
                Rücuya tabi olduğu belirtilmiş
              </label>
              <div className="flex items-end">
                <button type="button" className="text-sm text-red-600" onClick={() => set(rows.filter((_, idx) => idx !== i))}>
                  Sil
                </button>
              </div>
            </div>
          ))}
          <AddRowButton label="Belge Ekle" onClick={() => set([...rows, { id: newId() }])} />
        </div>
      )}
    </FormSection>
  );
}

export function SgkIncomeStep({ draft, onChange }: StepProps) {
  if (draft.calculationType !== "WORK_INJURY") return null;
  const rows = draft.sgkIncome;
  const set = (sgkIncome: SgkIncomeRecord[]) => onChange({ ...draft, sgkIncome });
  return (
    <FormSection title="SGK gelirleri" description="Belge bilgileri kaydedilir; mahsup hesaplanmaz.">
      {rows.length === 0 ? (
        <EmptyState title="Henüz SGK geliri eklenmedi." actionLabel="SGK Kaydı Ekle" onAction={() => set([...rows, { id: newId() }])} />
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={r.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl border p-4">
              <FormField label="Gelir türü">
                <TextInput
                  value={r.incomeKind ?? ""}
                  onChange={(e) => set(rows.map((x, idx) => (idx === i ? { ...x, incomeKind: e.target.value } : x)))}
                />
              </FormField>
              <FormField label="Başlangıç">
                <TextInput
                  type="date"
                  value={r.startDate ?? ""}
                  onChange={(e) => set(rows.map((x, idx) => (idx === i ? { ...x, startDate: e.target.value } : x)))}
                />
              </FormField>
              <FormField label="Aylık tutar">
                <TextInput
                  type="number"
                  value={r.monthlyAmount ?? ""}
                  onChange={(e) =>
                    set(
                      rows.map((x, idx) =>
                        idx === i
                          ? { ...x, monthlyAmount: e.target.value === "" ? undefined : Number(e.target.value) }
                          : x
                      )
                    )
                  }
                />
              </FormField>
              <FormField label="Rücu notu">
                <TextInput
                  value={r.recourseNotes ?? ""}
                  onChange={(e) => set(rows.map((x, idx) => (idx === i ? { ...x, recourseNotes: e.target.value } : x)))}
                />
              </FormField>
              <div className="flex items-end">
                <button type="button" className="text-sm text-red-600" onClick={() => set(rows.filter((_, idx) => idx !== i))}>
                  Sil
                </button>
              </div>
            </div>
          ))}
          <AddRowButton label="SGK Kaydı Ekle" onClick={() => set([...rows, { id: newId() }])} />
        </div>
      )}
    </FormSection>
  );
}

export function SgkDeathIncomeStep({ draft, onChange }: StepProps) {
  if (draft.calculationType !== "WORK_DEATH") return null;
  const rows = draft.sgkDeathIncomes;
  const beneficiaries = draft.beneficiaries;
  const set = (sgkDeathIncomes: SgkDeathIncomeRecord[]) => onChange({ ...draft, sgkDeathIncomes });
  return (
    <FormSection title="SGK ölüm gelirleri">
      {rows.length === 0 ? (
        <EmptyState
          title="Henüz SGK ölüm geliri eklenmedi."
          actionLabel="Kayıt Ekle"
          onAction={() => set([...rows, { id: newId() }])}
        />
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={r.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl border p-4">
              <FormField label="Hak sahibi">
                <TextSelect
                  value={r.beneficiaryId ?? ""}
                  onChange={(e) =>
                    set(rows.map((x, idx) => (idx === i ? { ...x, beneficiaryId: e.target.value } : x)))
                  }
                >
                  <option value="">Seçiniz</option>
                  {beneficiaries.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.fullName || b.id}
                    </option>
                  ))}
                </TextSelect>
              </FormField>
              <FormField label="Gelir türü">
                <TextInput
                  value={r.incomeKind ?? ""}
                  onChange={(e) => set(rows.map((x, idx) => (idx === i ? { ...x, incomeKind: e.target.value } : x)))}
                />
              </FormField>
              <FormField label="Aylık tutar">
                <TextInput
                  type="number"
                  value={r.monthlyAmount ?? ""}
                  onChange={(e) =>
                    set(
                      rows.map((x, idx) =>
                        idx === i
                          ? { ...x, monthlyAmount: e.target.value === "" ? undefined : Number(e.target.value) }
                          : x
                      )
                    )
                  }
                />
              </FormField>
              <div className="flex items-end">
                <button type="button" className="text-sm text-red-600" onClick={() => set(rows.filter((_, idx) => idx !== i))}>
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </FormSection>
  );
}

export function GenericExpensesStep({ draft, onChange }: StepProps) {
  if (draft.calculationType !== "WORK_DEATH") return null;
  const rows = draft.expenses;
  const set = (expenses: ExpenseItem[]) => onChange({ ...draft, expenses });
  return (
    <FormSection title="Giderler">
      {rows.length === 0 ? (
        <EmptyState title="Henüz gider eklenmedi." actionLabel="Gider Ekle" onAction={() => set([...rows, { id: newId(), name: "", amount: 0 }])} />
      ) : (
        rows.map((r, i) => (
          <div key={r.id} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormField label="Ad">
              <TextInput
                value={r.name}
                onChange={(e) => set(rows.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))}
              />
            </FormField>
            <FormField label="Tutar">
              <TextInput
                type="number"
                value={r.amount || ""}
                onChange={(e) =>
                  set(rows.map((x, idx) => (idx === i ? { ...x, amount: Number(e.target.value) || 0 } : x)))
                }
              />
            </FormField>
            <div className="flex items-end">
              <button type="button" className="text-sm text-red-600" onClick={() => set(rows.filter((_, idx) => idx !== i))}>
                Sil
              </button>
            </div>
          </div>
        ))
      )}
    </FormSection>
  );
}

export function DeathExpensesStep({ draft, onChange }: StepProps) {
  if (draft.calculationType !== "TRAFFIC_DEATH") return null;
  const block = draft.deathExpenses;
  return (
    <FormSection title="Ölüm öncesi ve cenaze giderleri">
      <FormGrid>
        <FormField label="Ölüm öncesi tedavi gideri">
          <TextInput
            type="number"
            value={block.preDeathTreatment ?? ""}
            onChange={(e) =>
              onChange({
                ...draft,
                deathExpenses: {
                  ...block,
                  preDeathTreatment: e.target.value === "" ? undefined : Number(e.target.value),
                },
              })
            }
          />
        </FormField>
        <FormField label="Cenaze gideri">
          <TextInput
            type="number"
            value={block.funeralCost ?? ""}
            onChange={(e) =>
              onChange({
                ...draft,
                deathExpenses: {
                  ...block,
                  funeralCost: e.target.value === "" ? undefined : Number(e.target.value),
                },
              })
            }
          />
        </FormField>
        <FormField label="Nakil gideri">
          <TextInput
            type="number"
            value={block.transportCost ?? ""}
            onChange={(e) =>
              onChange({
                ...draft,
                deathExpenses: {
                  ...block,
                  transportCost: e.target.value === "" ? undefined : Number(e.target.value),
                },
              })
            }
          />
        </FormField>
      </FormGrid>
      <FormField label="Ölüm öncesi kazanç kaybı notu">
        <TextTextarea
          value={block.preDeathIncomeLossNotes ?? ""}
          onChange={(e) =>
            onChange({
              ...draft,
              deathExpenses: { ...block, preDeathIncomeLossNotes: e.target.value },
            })
          }
        />
      </FormField>
    </FormSection>
  );
}
