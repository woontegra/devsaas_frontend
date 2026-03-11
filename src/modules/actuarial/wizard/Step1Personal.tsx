import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { uiText } from "../../../config/uiText";
import type { PersonalInfo, AccidentInfo } from "../types/caseFormTypes";

const tp = uiText.personal;
const ta = uiText.accident;

export interface Step1PersonalProps {
  personal: PersonalInfo;
  accident: AccidentInfo;
  onPersonalChange: (p: Partial<PersonalInfo>) => void;
  onAccidentChange: (a: Partial<AccidentInfo>) => void;
}

export function Step1Personal(p: Step1PersonalProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">{tp.title}</h3>
        <div className="space-y-3">
          <Input label={tp.birthDate} type="date" value={p.personal.birthDate} onChange={(e) => p.onPersonalChange({ birthDate: e.target.value })} />
          <Select label={tp.gender} value={p.personal.gender} onChange={(e) => p.onPersonalChange({ gender: e.target.value as PersonalInfo["gender"] })} options={[{ value: "male", label: tp.male }, { value: "female", label: tp.female }]} />
          <Select label={tp.maritalStatus} value={p.personal.maritalStatus} onChange={(e) => p.onPersonalChange({ maritalStatus: e.target.value as PersonalInfo["maritalStatus"] })} options={[{ value: "single", label: tp.maritalSingle }, { value: "married", label: tp.maritalMarried }, { value: "divorced", label: tp.maritalDivorced }, { value: "widowed", label: tp.maritalWidowed }]} />
          <Select label={tp.educationLevel} value={p.personal.educationLevel} onChange={(e) => p.onPersonalChange({ educationLevel: e.target.value as PersonalInfo["educationLevel"] })} options={[{ value: "primary", label: tp.educationPrimary }, { value: "high_school", label: tp.educationHighSchool }, { value: "university", label: tp.educationUniversity }, { value: "other", label: tp.educationOther }]} />
          <Input label={tp.occupation} type="text" value={p.personal.occupation} onChange={(e) => p.onPersonalChange({ occupation: e.target.value })} />
          <Input label={tp.eventDate} type="date" value={p.personal.eventDate} onChange={(e) => p.onPersonalChange({ eventDate: e.target.value })} />
          <Input label={tp.calculationDate} type="date" value={p.personal.calculationDate} onChange={(e) => p.onPersonalChange({ calculationDate: e.target.value })} />
        </div>
      </div>
      <div>
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">{ta.title}</h3>
        <div className="space-y-3">
          <Select label={ta.accidentType} value={p.accident.accidentType} onChange={(e) => p.onAccidentChange({ accidentType: e.target.value as AccidentInfo["accidentType"] })} options={[{ value: "work", label: ta.typeWork }, { value: "traffic", label: ta.typeTraffic }, { value: "support_loss", label: ta.typeSupportLoss }, { value: "disability", label: ta.typeDisability }]} />
          <Input label={ta.plaintiffFaultRatio} type="number" min={0} max={100} value={String(p.accident.plaintiffFaultRatio)} onChange={(e) => p.onAccidentChange({ plaintiffFaultRatio: Number(e.target.value) || 0 })} />
          <Input label={ta.defendantFaultRatio} type="number" min={0} max={100} value={String(p.accident.defendantFaultRatio)} onChange={(e) => p.onAccidentChange({ defendantFaultRatio: Number(e.target.value) || 0 })} />
        </div>
      </div>
    </div>
  );
}
