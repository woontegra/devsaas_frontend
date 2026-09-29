import type {
  DeceasedChildEducationLevel,
  DeceasedChildRecord,
  TrafficDeathDraft,
} from "../../types/calculationDraft";
import {
  countChildrenByGender,
  patchDeceasedFamilyInfo,
  patchTrafficDeathEmploymentStatus,
} from "../../utils/deceasedFamilyUtils";
import { FormField, TextInput, TextSelect } from "./FormPrimitives";
import {
  CHILD_EDUCATION_OPTIONS,
  FieldBlock,
  SectionDivider,
  SegmentedChoice,
} from "./segmentedChoice";
import type { StepProps } from "./wizardTypes";
import { errorFor } from "./wizardTypes";

export function DeceasedPersonalFamilySection({
  draft,
  onChange,
  fieldErrors,
}: StepProps) {
  if (draft.calculationType !== "TRAFFIC_DEATH") return null;
  const td = draft;
  const family = td.deceasedFamilyInfo;
  const isMale = td.deceased.gender === "male";

  const setFamily = (patch: Parameters<typeof patchDeceasedFamilyInfo>[1]) => {
    onChange(patchDeceasedFamilyInfo(td, patch));
  };

  const setEmployment = (status: TrafficDeathDraft["employmentStatus"]) => {
    onChange(patchTrafficDeathEmploymentStatus(td, status));
  };

  const genderCounts =
    family.hasChildren === true ? countChildrenByGender(family.children) : { female: 0, male: 0 };

  const updateChild = (index: number, patch: Partial<DeceasedChildRecord>) => {
    const children = family.children.map((c, i) => (i === index ? { ...c, ...patch } : c));
    setFamily({ children });
  };

  return (
    <>
      <SectionDivider />
      <h4 className="text-[14px] font-semibold text-[#1F2933] tracking-[-0.01em]">
        Kişisel ve Aile Bilgileri
      </h4>

      <div className="mt-4 space-y-5">
        <FieldBlock label="Medeni Durum">
          <SegmentedChoice
            value={family.maritalStatus}
            options={[
              { id: "MARRIED", label: "Evli" },
              { id: "SINGLE", label: "Bekar" },
              { id: "DIVORCED", label: "Dul" },
            ]}
            onChange={(maritalStatus) => setFamily({ maritalStatus })}
            columns={3}
          />
        </FieldBlock>

        <FieldBlock
          label="Çalışma Durumu"
          error={errorFor(fieldErrors, "employmentStatus")}
        >
          <SegmentedChoice
            value={td.employmentStatus}
            options={[
              { id: "WORKING", label: "Çalışıyor" },
              { id: "NOT_WORKING", label: "Çalışmıyor" },
            ]}
            onChange={setEmployment}
          />
        </FieldBlock>

        {isMale && (
          <FieldBlock label="Askerlik Durumu">
            <SegmentedChoice
              value={family.militaryStatus}
              options={[
                { id: "COMPLETED", label: "Askerliğini Yapmış" },
                { id: "NOT_COMPLETED", label: "Askerliğini Yapmamış" },
              ]}
              onChange={(militaryStatus) =>
                setFamily({
                  militaryStatus,
                  militaryServiceStartDate: null,
                  militaryServiceDurationMonths: null,
                })
              }
            />
          </FieldBlock>
        )}

        {isMale && family.militaryStatus != null && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Askerlik başlangıç tarihi"
              error={errorFor(fieldErrors, "deceasedFamilyInfo.militaryServiceStartDate")}
            >
              <TextInput
                type="date"
                value={family.militaryServiceStartDate ?? ""}
                onChange={(e) => setFamily({ militaryServiceStartDate: e.target.value || null })}
              />
            </FormField>
            <FormField
              label="Askerlik süresi"
              error={errorFor(fieldErrors, "deceasedFamilyInfo.militaryServiceDurationMonths")}
            >
              <TextSelect
                value={
                  family.militaryServiceDurationMonths != null
                    ? String(family.militaryServiceDurationMonths)
                    : ""
                }
                onChange={(e) => {
                  const v = e.target.value;
                  setFamily({
                    militaryServiceDurationMonths: v === "6" ? 6 : v === "12" ? 12 : null,
                  });
                }}
              >
                <option value="">Seçiniz</option>
                <option value="6">6 Ay</option>
                <option value="12">1 Yıl</option>
              </TextSelect>
            </FormField>
          </div>
        )}

        <FieldBlock label="Çocuk Durumu">
          <SegmentedChoice
            value={
              family.hasChildren === true ? "yes" : family.hasChildren === false ? "no" : null
            }
            options={[
              { id: "yes", label: "Çocuklu" },
              { id: "no", label: "Çocuksuz" },
            ]}
            onChange={(v) => {
              if (v === "yes") setFamily({ hasChildren: true, childrenCount: 1, children: [] });
              else if (v === "no") setFamily({ hasChildren: false });
              else setFamily({ hasChildren: null, childrenCount: 0, children: [] });
            }}
          />
        </FieldBlock>

        {family.hasChildren === true && (
          <div className="space-y-4 rounded-[10px] border border-[#DCE3E8] bg-[#FAFBFC] p-4">
            <FormField label="Toplam çocuk sayısı">
              <TextInput
                type="number"
                min={1}
                max={20}
                inputMode="numeric"
                value={family.childrenCount > 0 ? String(family.childrenCount) : "1"}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  setFamily({ childrenCount: Number.isFinite(n) ? n : 1 });
                }}
              />
            </FormField>

            {family.children.length > 0 && (
              <div className="flex flex-wrap gap-4 text-[13px] text-[#66727F]">
                <span>
                  Kız:{" "}
                  <span className="font-semibold text-[#1F2933] tabular-nums">
                    {genderCounts.female}
                  </span>
                </span>
                <span>
                  Erkek:{" "}
                  <span className="font-semibold text-[#1F2933] tabular-nums">
                    {genderCounts.male}
                  </span>
                </span>
              </div>
            )}

            <div className="space-y-3">
              {family.children.map((child, index) => (
                <div
                  key={child.id}
                  className="rounded-[10px] border border-[#DCE3E8] bg-white p-3 space-y-3"
                >
                  <p className="text-[13px] font-semibold text-[#1F2933]">Çocuk {index + 1}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Cinsiyet">
                      <TextSelect
                        value={child.gender}
                        onChange={(e) =>
                          updateChild(index, { gender: e.target.value as "male" | "female" })
                        }
                      >
                        <option value="female">Kız</option>
                        <option value="male">Erkek</option>
                      </TextSelect>
                    </FormField>
                    <FormField label="Öğrenim Durumu">
                      <TextSelect
                        value={child.educationLevel ?? ""}
                        onChange={(e) => {
                          const v = e.target.value as DeceasedChildEducationLevel | "";
                          updateChild(index, {
                            educationLevel: v || null,
                            educationOther: v === "other" ? child.educationOther ?? "" : undefined,
                          });
                        }}
                      >
                        <option value="">Seçiniz</option>
                        {CHILD_EDUCATION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </TextSelect>
                    </FormField>
                  </div>
                  {child.educationLevel === "other" && (
                    <FormField label="Diğer (açıklama)">
                      <TextInput
                        value={child.educationOther ?? ""}
                        onChange={(e) => updateChild(index, { educationOther: e.target.value })}
                      />
                    </FormField>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
