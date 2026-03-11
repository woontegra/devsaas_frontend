import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { uiText } from "../../../config/uiText";
import type { SupportPerson } from "../types/caseFormTypes";

const t = uiText.support;
const tPersonal = uiText.personal;

function newSupportPerson(): SupportPerson {
  return {
    id: crypto.randomUUID?.() ?? String(Date.now()),
    name: "",
    birthDate: "",
    gender: "male",
    shareRatio: 1,
    relationship: "child",
  };
}

interface Step4SupportProps {
  supports: SupportPerson[];
  onChange: (supports: SupportPerson[]) => void;
}

export function Step4Support({ supports, onChange }: Step4SupportProps) {
  const addPerson = () => onChange([...supports, newSupportPerson()]);

  const updatePerson = (id: string, patch: Partial<SupportPerson>) => {
    onChange(supports.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const removePerson = (id: string) => {
    onChange(supports.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          {t.title}
        </h3>
        <Button type="button" variant="secondary" onClick={addPerson}>
          {t.addPerson}
        </Button>
      </div>
      {supports.length === 0 && (
        <p className="text-[12px] text-gray-500 py-3">{t.addPerson} butonunu kullanin.</p>
      )}
      {supports.map((person) => (
        <div
          key={person.id}
          className="p-3 rounded-lg border border-gray-200 bg-gray-50/50 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={t.name}
              value={person.name}
              onChange={(e) => updatePerson(person.id, { name: e.target.value })}
            />
            <Select
              label={t.relationship}
              value={person.relationship}
              onChange={(e) =>
                updatePerson(person.id, {
                  relationship: e.target.value as SupportPerson["relationship"],
                })
              }
              options={[
                { value: "spouse", label: t.relSpouse },
                { value: "child", label: t.relChild },
                { value: "mother", label: t.relMother },
                { value: "father", label: t.relFather },
              ]}
            />
            <Input
              label={t.birthDate}
              type="date"
              value={person.birthDate}
              onChange={(e) => updatePerson(person.id, { birthDate: e.target.value })}
            />
            <Select
              label={t.gender}
              value={person.gender}
              onChange={(e) =>
                updatePerson(person.id, { gender: e.target.value as SupportPerson["gender"] })
              }
              options={[
                { value: "male", label: tPersonal.male },
                { value: "female", label: tPersonal.female },
              ]}
            />
            <Input
              label={t.shareRatio}
              type="number"
              min={0}
              value={String(person.shareRatio)}
              onChange={(e) =>
                updatePerson(person.id, { shareRatio: Number(e.target.value) || 0 })
              }
            />
            <Input
              label={t.supportDuration}
              type="number"
              min={0}
              value={String(person.supportDurationYears ?? "")}
              onChange={(e) =>
                updatePerson(person.id, {
                  supportDurationYears: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="text-red-600 hover:bg-red-50"
            onClick={() => removePerson(person.id)}
          >
            Kaldir
          </Button>
        </div>
      ))}
    </div>
  );
}
