import { describe, it, expect } from "vitest";
import {
  coerceTrafficDeathBeneficiaries,
  countBeneficiariesByClaimantStatus,
  resolveBeneficiaryClaimantStatus,
} from "./beneficiaryClaimantStatus";
import type { Beneficiary } from "../types/calculationDraft";

describe("beneficiaryClaimantStatus", () => {
  it("missing claimantStatus defaults to PLAINTIFF", () => {
    const b = { id: "1" } as Beneficiary;
    expect(resolveBeneficiaryClaimantStatus(b)).toBe("PLAINTIFF");
    expect(coerceTrafficDeathBeneficiaries([b])[0]?.claimantStatus).toBe("PLAINTIFF");
  });

  it("counts plaintiff and out-of-case separately", () => {
    const rows: Beneficiary[] = [
      { id: "1", fullName: "A", relation: "spouse", birthDate: "", gender: "female", claimantStatus: "PLAINTIFF" },
      { id: "2", fullName: "B", relation: "child", birthDate: "", gender: "male", claimantStatus: "OUT_OF_CASE" },
      { id: "3", fullName: "C", relation: "child", birthDate: "", gender: "male" },
    ];
    expect(countBeneficiariesByClaimantStatus(rows)).toEqual({ plaintiff: 2, outOfCase: 1 });
  });
});
