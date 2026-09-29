export const DEATH_RELATION_LABEL: Record<string, string> = {
  spouse: "Eş",
  mother: "Anne",
  father: "Baba",
  child: "Çocuk",
  sibling: "Kardeş",
  other: "Diğer",
};

export const ZMTS_CLAIMANT_UNSPECIFIED = "Kime yapıldığı belirtilmemiş";
export const ZMTS_NO_PLAINTIFF_MESSAGE =
  "ZMTS ödemesi eklemek için önce Hak Sahipleri adımında en az bir davacı tanımlayın.";
export const CASCO_NO_PLAINTIFF_MESSAGE =
  "Kasko ödemesi eklemek için önce Hak Sahipleri adımında en az bir davacı tanımlayın.";

export type DeathZmtsBeneficiaryRef = {
  id: string;
  fullName?: string;
  relation?: string;
  claimantStatus?: "PLAINTIFF" | "OUT_OF_CASE" | null;
};

export type DeathZmtsClaimantOption = {
  id: string;
  name: string;
  relation: string;
  relationLabel: string;
  label: string;
};

export function deathRelationLabel(relation: string | undefined): string {
  if (!relation) return "";
  return DEATH_RELATION_LABEL[relation] ?? relation;
}

/** Yalnızca Hak Sahipleri adımındaki davacılar. Dava dışı kişiler dahil edilmez. */
export function deathZmtsPlaintiffOptions(
  beneficiaries: DeathZmtsBeneficiaryRef[] | undefined
): DeathZmtsClaimantOption[] {
  return (beneficiaries ?? [])
    .filter((b) => b.claimantStatus !== "OUT_OF_CASE" && Boolean(b.id))
    .map((b) => {
      const name = b.fullName?.trim() || "İsimsiz";
      const relation = b.relation ?? "";
      const relationLabel = deathRelationLabel(relation) || "Hak sahibi";
      return {
        id: b.id,
        name,
        relation,
        relationLabel,
        label: `${name} (${relationLabel})`,
      };
    });
}

export function deathZmtsClaimantLabel(
  row: { claimantId?: string; claimantName?: string; claimantRelation?: string },
  options: DeathZmtsClaimantOption[]
): string {
  const claimantId = row.claimantId?.trim() ?? "";
  if (!claimantId) return ZMTS_CLAIMANT_UNSPECIFIED;
  const live = options.find((o) => o.id === claimantId);
  if (live) return live.label;
  const name = row.claimantName?.trim();
  if (!name) return ZMTS_CLAIMANT_UNSPECIFIED;
  const relationLabel = deathRelationLabel(row.claimantRelation);
  return relationLabel ? `${name} (${relationLabel})` : name;
}

export type DeathZmtsGaramePerson = {
  id: string;
  name: string;
  relation: string;
  relationLabel: string;
  status: "PLAINTIFF" | "OUT_OF_CASE";
  statusLabel: string;
};

export type DeathZmtsGarameRowState = {
  claimantId: string;
  claimantName?: string;
  claimantStatus?: "PLAINTIFF" | "OUT_OF_CASE";
  claimantRelation?: string;
  paymentDate?: string;
  paymentAmount?: number;
  liabilityLimit?: number;
  accidentLimit?: number;
};

/** Davacılar önce, dava dışı sonra. Grup içindeki sıra korunur. */
export function deathZmtsGaramePeople(
  beneficiaries: DeathZmtsBeneficiaryRef[] | undefined
): DeathZmtsGaramePerson[] {
  const list = (beneficiaries ?? []).filter((b) => Boolean(b.id));
  const ordered = [
    ...list.filter((b) => b.claimantStatus !== "OUT_OF_CASE"),
    ...list.filter((b) => b.claimantStatus === "OUT_OF_CASE"),
  ];
  return ordered.map((b) => {
    const status = b.claimantStatus === "OUT_OF_CASE" ? "OUT_OF_CASE" : "PLAINTIFF";
    const relation = b.relation ?? "";
    return {
      id: b.id,
      name: b.fullName?.trim() || "İsimsiz",
      relation,
      relationLabel: deathRelationLabel(relation) || "Hak sahibi",
      status,
      statusLabel: status === "OUT_OF_CASE" ? "Dava Dışı" : "Davacı",
    };
  });
}

export function syncDeathZmtsGarameRows(
  stored: DeathZmtsGarameRowState[] | undefined,
  people: DeathZmtsGaramePerson[]
): DeathZmtsGarameRowState[] {
  const byId = new Map((stored ?? []).map((row) => [row.claimantId, row]));
  return people.map((person) => {
    const prev = byId.get(person.id);
    return {
      claimantId: person.id,
      claimantName: person.name,
      claimantStatus: person.status,
      claimantRelation: person.relation,
      paymentDate: prev?.paymentDate ?? "",
      paymentAmount: prev?.paymentAmount ?? 0,
      liabilityLimit: prev?.liabilityLimit ?? 0,
      accidentLimit: prev?.accidentLimit ?? 0,
    };
  });
}

export function deathGarameRowsEqual(
  left: DeathZmtsGarameRowState[] | undefined,
  right: DeathZmtsGarameRowState[] | undefined
): boolean {
  const a = left ?? [];
  const b = right ?? [];
  if (a.length !== b.length) return false;
  return a.every((row, index) => {
    const other = b[index];
    if (!other) return false;
    return (
      row.claimantId === other.claimantId &&
      (row.claimantName ?? "") === (other.claimantName ?? "") &&
      (row.claimantStatus ?? "") === (other.claimantStatus ?? "") &&
      (row.claimantRelation ?? "") === (other.claimantRelation ?? "") &&
      (row.paymentDate ?? "") === (other.paymentDate ?? "") &&
      (row.paymentAmount ?? 0) === (other.paymentAmount ?? 0) &&
      (row.liabilityLimit ?? 0) === (other.liabilityLimit ?? 0) &&
      (row.accidentLimit ?? 0) === (other.accidentLimit ?? 0)
    );
  });
}
