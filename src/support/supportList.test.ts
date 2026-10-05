import { describe, expect, it } from "vitest";
import type { SupportListItem } from "./supportApi";
import { filterSupportTickets } from "./supportList";

function item(partial: Partial<SupportListItem> & Pick<SupportListItem, "publicNumber" | "status" | "subject">): SupportListItem {
  return {
    category: "OTHER",
    categoryLabel: "Diğer",
    createdAt: "2026-10-04T00:00:00.000Z",
    lastActivityAt: "2026-10-04T00:00:00.000Z",
    ...partial,
  };
}

const rows = [
  item({ publicNumber: "AKT-000004", status: "OPEN", subject: "Prim hesabı" }),
  item({ publicNumber: "AKT-000005", status: "IN_REVIEW", subject: "Ekran hatası" }),
  item({ publicNumber: "AKT-000006", status: "WAITING_FOR_USER", subject: "Lisans" }),
  item({ publicNumber: "AKT-000007", status: "ANSWERED", subject: "Rapor" }),
  item({ publicNumber: "AKT-000008", status: "RESOLVED", subject: "Kapanış" }),
  item({ publicNumber: "AKT-000009", status: "CLOSED", subject: "Eski talep" }),
];

describe("support list filters", () => {
  it("keeps closed tickets only in the full list", () => {
    expect(filterSupportTickets(rows, "all", "")).toHaveLength(6);
    expect(filterSupportTickets(rows, "done", "").map((row) => row.status)).toEqual(["ANSWERED", "RESOLVED"]);
  });

  it("filters by status group", () => {
    expect(filterSupportTickets(rows, "open", "").map((row) => row.publicNumber)).toEqual(["AKT-000004"]);
    expect(filterSupportTickets(rows, "review", "").map((row) => row.publicNumber)).toEqual(["AKT-000005"]);
    expect(filterSupportTickets(rows, "waiting", "").map((row) => row.publicNumber)).toEqual(["AKT-000006"]);
  });

  it("searches ticket number and subject without calling the backend", () => {
    expect(filterSupportTickets(rows, "all", "0007").map((row) => row.publicNumber)).toEqual(["AKT-000007"]);
    expect(filterSupportTickets(rows, "all", "prim").map((row) => row.subject)).toEqual(["Prim hesabı"]);
    expect(filterSupportTickets(rows, "open", "ekran")).toEqual([]);
  });
});
