import type {
  DeceasedChildEducationLevel,
  DeceasedChildRecord,
  DeceasedFamilyInfo,
  Gender,
  TrafficDeathDraft,
} from "../types/calculationDraft";
import { newId } from "../types/calculationDraft";

export function emptyDeceasedFamilyInfo(): DeceasedFamilyInfo {
  return {
    maritalStatus: null,
    militaryStatus: null,
    militaryServiceStartDate: null,
    militaryServiceDurationMonths: null,
    educationStatus: null,
    educationOtherDescription: "",
    hasChildren: null,
    childrenCount: 0,
    children: [],
  };
}

const VALID_EDUCATION_LEVELS = new Set<DeceasedChildEducationLevel>([
  "preschool",
  "primary",
  "middle",
  "high",
  "university",
  "postgraduate",
  "graduate",
  "not_in_education",
  "other",
]);

export function coerceDeceasedFamilyInfo(
  raw: Partial<DeceasedFamilyInfo> | undefined | null
): DeceasedFamilyInfo {
  const base = emptyDeceasedFamilyInfo();
  if (!raw) return base;
  const childrenCount =
    typeof raw.childrenCount === "number" && raw.childrenCount >= 0
      ? Math.min(Math.floor(raw.childrenCount), 20)
      : Array.isArray(raw.children)
        ? raw.children.length
        : 0;
  const children = syncDeceasedChildrenArray(
    childrenCount,
    Array.isArray(raw.children) ? raw.children : []
  );
  return {
    maritalStatus:
      raw.maritalStatus === "MARRIED" ||
      raw.maritalStatus === "SINGLE" ||
      raw.maritalStatus === "DIVORCED"
        ? raw.maritalStatus
        : null,
    militaryStatus:
      raw.militaryStatus === "COMPLETED" || raw.militaryStatus === "NOT_COMPLETED"
        ? raw.militaryStatus
        : null,
    militaryServiceStartDate:
      typeof raw.militaryServiceStartDate === "string" ? raw.militaryServiceStartDate : null,
    militaryServiceDurationMonths:
      raw.militaryServiceDurationMonths === 6 || raw.militaryServiceDurationMonths === 12
        ? raw.militaryServiceDurationMonths
        : null,
    hasChildren: typeof raw.hasChildren === "boolean" ? raw.hasChildren : null,
    educationStatus:
      raw.educationStatus && VALID_EDUCATION_LEVELS.has(raw.educationStatus)
        ? raw.educationStatus
        : null,
    educationOtherDescription:
      raw.educationStatus === "other" && typeof raw.educationOtherDescription === "string"
        ? raw.educationOtherDescription
        : "",
    childrenCount: raw.hasChildren === false ? 0 : childrenCount,
    children: raw.hasChildren === false ? [] : children,
  };
}

export function syncDeceasedChildrenArray(
  count: number,
  existing: DeceasedChildRecord[]
): DeceasedChildRecord[] {
  const safeCount = Math.max(0, Math.min(Math.floor(count), 20));
  const next: DeceasedChildRecord[] = [];
  for (let i = 0; i < safeCount; i++) {
    const prev = existing[i];
    next.push(
      prev
        ? { ...prev }
        : {
            id: newId(),
            gender: "male" as Gender,
            educationLevel: null,
          }
    );
  }
  return next;
}

export function countChildrenByGender(children: DeceasedChildRecord[]): {
  female: number;
  male: number;
} {
  let female = 0;
  let male = 0;
  for (const c of children) {
    if (c.gender === "female") female++;
    else male++;
  }
  return { female, male };
}

export function patchTrafficDeathEmploymentStatus(
  draft: TrafficDeathDraft,
  status: TrafficDeathDraft["employmentStatus"]
): TrafficDeathDraft {
  if (status === "WORKING") {
    return {
      ...draft,
      employmentStatus: status,
      nonWorkingSelectedIncome: null,
      accidentIncome: draft.accidentIncome ?? {
        incomeMode: "minWage",
        fixedAmount: null,
        averageSources: [],
      },
    };
  }
  if (status === "NOT_WORKING") {
    return {
      ...draft,
      employmentStatus: status,
      accidentIncome: { incomeMode: "minWage", fixedAmount: null, averageSources: [] },
    };
  }
  return {
    ...draft,
    employmentStatus: null,
    nonWorkingSelectedIncome: null,
  };
}

export function patchDeceasedGender(
  draft: TrafficDeathDraft,
  gender: Gender
): TrafficDeathDraft {
  const family = draft.deceasedFamilyInfo ?? emptyDeceasedFamilyInfo();
  return {
    ...draft,
    deceased: { ...draft.deceased, gender },
    deceasedFamilyInfo:
      gender === "female"
        ? {
            ...family,
            militaryStatus: null,
            militaryServiceStartDate: null,
            militaryServiceDurationMonths: null,
          }
        : family,
  };
}

export function patchDeceasedFamilyInfo(
  draft: TrafficDeathDraft,
  patch: Partial<DeceasedFamilyInfo>
): TrafficDeathDraft {
  const current = draft.deceasedFamilyInfo ?? emptyDeceasedFamilyInfo();
  let next: DeceasedFamilyInfo = { ...current, ...patch };

  if (patch.hasChildren === false) {
    next = {
      ...next,
      hasChildren: false,
      childrenCount: 0,
      children: [],
    };
  }

  if (patch.hasChildren === true && next.childrenCount === 0) {
    next = { ...next, childrenCount: 1, children: syncDeceasedChildrenArray(1, []) };
  }

  if (patch.childrenCount != null && next.hasChildren === true) {
    const count = Math.max(0, Math.min(Math.floor(patch.childrenCount), 20));
    next = {
      ...next,
      childrenCount: count,
      children: syncDeceasedChildrenArray(count, next.children),
    };
  }

  if (patch.children) {
    next = {
      ...next,
      children: patch.children,
      childrenCount: patch.children.length,
    };
  }

  if (patch.educationStatus != null && patch.educationStatus !== "other") {
    next = { ...next, educationOtherDescription: "" };
  }
  if (patch.educationStatus === "other" && patch.educationOtherDescription === undefined) {
    next = { ...next, educationOtherDescription: current.educationOtherDescription ?? "" };
  }

  return { ...draft, deceasedFamilyInfo: next };
}
