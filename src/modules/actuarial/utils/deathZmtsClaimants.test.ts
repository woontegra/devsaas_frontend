import { describe, expect, it } from "vitest";
import {
  ZMTS_CLAIMANT_UNSPECIFIED,
  deathZmtsClaimantLabel,
  deathZmtsGaramePeople,
  deathZmtsPlaintiffOptions,
  syncDeathZmtsGarameRows,
} from "./deathZmtsClaimants";

const people = [
  { id: "ebru", fullName: "Ebru Aydın", relation: "spouse", claimantStatus: "PLAINTIFF" as const },
  { id: "ahmet", fullName: "Ahmet Aydın", relation: "child", claimantStatus: "PLAINTIFF" as const },
  { id: "ali-1", fullName: "Ali Aydın", relation: "child", claimantStatus: "PLAINTIFF" as const },
  { id: "ali-2", fullName: "Ali Aydın", relation: "sibling", claimantStatus: "PLAINTIFF" as const },
  { id: "dava-disi", fullName: "Mehmet Aydın", relation: "father", claimantStatus: "OUT_OF_CASE" as const },
];

describe("death ZMTS claimant options", () => {
  it("lists only plaintiffs and keeps same names apart by id", () => {
    const options = deathZmtsPlaintiffOptions(people);
    expect(options.map((o) => o.id)).toEqual(["ebru", "ahmet", "ali-1", "ali-2"]);
    expect(options.map((o) => o.label)).toEqual([
      "Ebru Aydın (Eş)",
      "Ahmet Aydın (Çocuk)",
      "Ali Aydın (Çocuk)",
      "Ali Aydın (Kardeş)",
    ]);
    expect(options.some((o) => o.id === "dava-disi")).toBe(false);
  });

  it("does not invent a claimant for an old row", () => {
    const options = deathZmtsPlaintiffOptions(people);
    expect(deathZmtsClaimantLabel({ paymentAmount: 1 } as { claimantId?: string }, options)).toBe(
      ZMTS_CLAIMANT_UNSPECIFIED
    );
    expect(
      deathZmtsClaimantLabel(
        { claimantId: "silinen", claimantName: "Ebru Aydın", claimantRelation: "spouse" },
        options.filter((o) => o.id !== "ebru")
      )
    ).toBe("Ebru Aydın (Eş)");
  });
});

describe("death ZMTS garame people", () => {
  const beneficiaries = [
    { id: "ebru", fullName: "Ebru", relation: "spouse", claimantStatus: "PLAINTIFF" as const },
    { id: "ali", fullName: "Ali", relation: "child", claimantStatus: "PLAINTIFF" as const },
    { id: "ayse", fullName: "Ayşe", relation: "mother", claimantStatus: "OUT_OF_CASE" as const },
    { id: "mehmet", fullName: "Mehmet", relation: "father", claimantStatus: "OUT_OF_CASE" as const },
    { id: "ali-2", fullName: "Ali", relation: "sibling", claimantStatus: "PLAINTIFF" as const },
  ];

  it("lists plaintiffs first, then out-of-case, and keeps same names apart", () => {
    const rows = deathZmtsGaramePeople(beneficiaries);
    expect(rows.map((r) => r.id)).toEqual(["ebru", "ali", "ali-2", "ayse", "mehmet"]);
    expect(rows.map((r) => r.statusLabel)).toEqual(["Davacı", "Davacı", "Davacı", "Dava Dışı", "Dava Dışı"]);
    expect(rows.map((r) => r.relationLabel)).toEqual(["Eş", "Çocuk", "Kardeş", "Anne", "Baba"]);
  });

  it("adds, drops and refreshes people without rebinding entered amounts", () => {
    const first = syncDeathZmtsGarameRows(
      [{ claimantId: "ebru", paymentAmount: 1500, paymentDate: "2023-01-01", liabilityLimit: 10, accidentLimit: 20 }],
      deathZmtsGaramePeople(beneficiaries)
    );
    expect(first.find((r) => r.claimantId === "ebru")?.paymentAmount).toBe(1500);
    expect(first.find((r) => r.claimantId === "ayse")?.paymentAmount).toBe(0);

    const renamed = beneficiaries.map((b) => (b.id === "ebru" ? { ...b, fullName: "Ebru Aydın", claimantStatus: "OUT_OF_CASE" as const } : b));
    const next = syncDeathZmtsGarameRows(first, deathZmtsGaramePeople(renamed.filter((b) => b.id !== "ali")));
    expect(next.some((r) => r.claimantId === "ali")).toBe(false);
    const ebru = next.find((r) => r.claimantId === "ebru");
    expect(ebru?.claimantName).toBe("Ebru Aydın");
    expect(ebru?.claimantStatus).toBe("OUT_OF_CASE");
    expect(ebru?.paymentAmount).toBe(1500);
    expect(ebru?.paymentDate).toBe("2023-01-01");
  });
});
