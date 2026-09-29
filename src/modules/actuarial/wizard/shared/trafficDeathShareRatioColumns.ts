import type { Beneficiary, RelationType, TrafficDeathDraft } from "../../types/calculationDraft";
import { resolveBeneficiaryClaimantStatus } from "../../utils/beneficiaryClaimantStatus";

export interface ShareRatioTableColumn {
  key: string;
  header: string;
  subLabel?: string;
  claimantStatus?: "PLAINTIFF" | "OUT_OF_CASE";
  isDeceased?: boolean;
  synthetic?: boolean;
}

export interface MotorShareRatioColumn {
  key: string;
  header: string;
  subLabel?: string;
  synthetic?: boolean;
}

const RELATION_HEADER: Record<RelationType, string> = {
  spouse: "EŞ",
  mother: "ANNE",
  father: "BABA",
  child: "ÇOCUK",
  sibling: "KARDEŞ",
  other: "DİĞER",
};

export function buildBeneficiaryColumnHeader(
  beneficiary: Beneficiary,
  childIndex: number
): string {
  if (beneficiary.relation === "child") {
    return `${childIndex}. ÇOCUK`;
  }
  return RELATION_HEADER[beneficiary.relation];
}

export function buildTrafficDeathShareRatioColumns(
  draft: TrafficDeathDraft
): ShareRatioTableColumn[] {
  const columns: ShareRatioTableColumn[] = [
    {
      key: "deceased",
      header: "MÜTEVEFFA",
      subLabel: draft.deceased.fullName?.trim() || undefined,
      isDeceased: true,
    },
  ];

  let childCount = 0;
  for (const beneficiary of draft.beneficiaries) {
    if (beneficiary.relation === "child") childCount++;
    const header = buildBeneficiaryColumnHeader(beneficiary, childCount);
    columns.push({
      key: beneficiary.id,
      header,
      subLabel: beneficiary.fullName?.trim() || undefined,
      claimantStatus: resolveBeneficiaryClaimantStatus(beneficiary),
    });
  }

  return columns;
}

/** Motor columnKeys ile taslak kolonlarını birleştirir (muhtemel eş / farazi çocuk dahil). */
export function mergeTrafficDeathShareRatioColumns(
  draft: TrafficDeathDraft,
  motorColumns: MotorShareRatioColumn[] = []
): ShareRatioTableColumn[] {
  const base = buildTrafficDeathShareRatioColumns(draft);
  const byKey = new Map(base.map((c) => [c.key, c]));

  for (const mc of motorColumns) {
    if (byKey.has(mc.key)) continue;
    byKey.set(mc.key, {
      key: mc.key,
      header: mc.header,
      subLabel: mc.subLabel,
      synthetic: mc.synthetic ?? true,
    });
  }

  const orderedKeys = motorColumns.length
    ? motorColumns.map((c) => c.key)
    : base.map((c) => c.key);
  const seen = new Set<string>();
  const merged: ShareRatioTableColumn[] = [];
  for (const key of orderedKeys) {
    if (seen.has(key)) continue;
    const col = byKey.get(key);
    if (col) {
      merged.push(col);
      seen.add(key);
    }
  }
  for (const col of base) {
    if (!seen.has(col.key)) merged.push(col);
  }
  return merged.length ? merged : base;
}
