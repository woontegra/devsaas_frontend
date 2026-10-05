import type { SupportListItem, SupportStatusName } from "./supportApi";

export type SupportListFilter = "all" | "open" | "review" | "waiting" | "done";

export const SUPPORT_FILTERS: { id: SupportListFilter; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "open", label: "Açık" },
  { id: "review", label: "İnceleniyor" },
  { id: "waiting", label: "Yanıt Bekliyor" },
  { id: "done", label: "Yanıtlandı / Çözüldü" },
];

export const SUPPORT_BADGE_LABEL: Record<SupportStatusName, string> = {
  OPEN: "Açık",
  IN_REVIEW: "İnceleniyor",
  WAITING_FOR_USER: "Sizden Yanıt Bekleniyor",
  ANSWERED: "Yanıtlandı",
  RESOLVED: "Çözüldü",
  CLOSED: "Kapalı",
};

function matchesFilter(status: SupportStatusName, filter: SupportListFilter): boolean {
  if (filter === "all") return true;
  if (filter === "open") return status === "OPEN";
  if (filter === "review") return status === "IN_REVIEW";
  if (filter === "waiting") return status === "WAITING_FOR_USER";
  return status === "ANSWERED" || status === "RESOLVED";
}

export function filterSupportTickets(
  items: SupportListItem[],
  filter: SupportListFilter,
  query: string
): SupportListItem[] {
  const q = query.trim().toLocaleLowerCase("tr");
  return items.filter((item) => {
    if (!matchesFilter(item.status, filter)) return false;
    if (!q) return true;
    return (
      item.publicNumber.toLocaleLowerCase("tr").includes(q) ||
      item.subject.toLocaleLowerCase("tr").includes(q)
    );
  });
}
