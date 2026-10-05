import { api } from "../services/api";

export type SupportCategoryName = "CALCULATION" | "TECHNICAL" | "LICENSE" | "SUGGESTION" | "OTHER";
export type SupportStatusName =
  | "OPEN"
  | "IN_REVIEW"
  | "WAITING_FOR_USER"
  | "ANSWERED"
  | "RESOLVED"
  | "CLOSED";

export const CATEGORY_LABEL: Record<SupportCategoryName, string> = {
  CALCULATION: "Hesaplama",
  TECHNICAL: "Teknik Sorun",
  LICENSE: "Lisans-Abonelik",
  SUGGESTION: "Öneri",
  OTHER: "Diğer",
};

export const STATUS_LABEL: Record<SupportStatusName, string> = {
  OPEN: "Açık",
  IN_REVIEW: "İncelemede",
  WAITING_FOR_USER: "Kullanıcı bekleniyor",
  ANSWERED: "Yanıtlandı",
  RESOLVED: "Çözüldü",
  CLOSED: "Kapalı",
};

export type SupportListItem = {
  publicNumber: string;
  category: SupportCategoryName;
  categoryLabel: string;
  subject: string;
  status: SupportStatusName;
  awaitingUser?: boolean;
  createdAt: string;
  lastActivityAt: string;
};

export type SupportAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type SupportMessage = {
  id: string;
  authorRole: "USER" | "STAFF";
  body: string;
  createdAt: string;
  attachments: SupportAttachment[];
};

export type SupportTicketDetail = SupportListItem & {
  closed: boolean;
  closedMessage: string | null;
  messages: SupportMessage[];
};

export type SupportFilePayload = {
  fileName: string;
  mimeType: string;
  dataBase64: string;
};

function supportUrl(path: string): string {
  const configured = import.meta.env.VITE_API_URL;
  if (typeof configured === "string" && configured.length > 0) {
    return `${configured.replace(/\/$/, "")}${path}`;
  }
  if (import.meta.env.DEV) return `http://localhost:3000${path}`;
  return path;
}

export async function fetchMyTickets(pageSize = 20) {
  const { data } = await api.get<{ unreadCount: number; items: SupportListItem[] }>(supportUrl("/support/tickets"), {
    params: { pageSize },
  });
  return {
    unreadCount: typeof data?.unreadCount === "number" ? data.unreadCount : 0,
    items: Array.isArray(data?.items) ? data.items : [],
  };
}

export async function fetchMyTicket(publicNumber: string) {
  const { data } = await api.get<{ item: SupportTicketDetail }>(
    supportUrl(`/support/tickets/${encodeURIComponent(publicNumber)}`)
  );
  return data.item;
}

export async function createMyTicket(body: {
  category: SupportCategoryName;
  subject: string;
  message: string;
  attachment?: SupportFilePayload | null;
}) {
  const { data } = await api.post<{ item: SupportTicketDetail }>(supportUrl("/support/tickets"), body);
  return data.item;
}

export async function replyMyTicket(
  publicNumber: string,
  body: { message: string; attachment?: SupportFilePayload | null }
) {
  const { data } = await api.post<{ item: SupportTicketDetail }>(
    supportUrl(`/support/tickets/${encodeURIComponent(publicNumber)}/messages`),
    body
  );
  return data.item;
}

export async function downloadSupportFile(id: string, fileName: string) {
  const response = await api.get(supportUrl(`/support/attachments/${encodeURIComponent(id)}`), {
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export const MAX_SUPPORT_FILE_BYTES = 512 * 1024;

export function emitUserSupportSeen() {
  window.dispatchEvent(new Event("user-support-seen"));
}

export function onUserSupportChanged(listener: () => void) {
  window.addEventListener("user-support-seen", listener);
  return () => window.removeEventListener("user-support-seen", listener);
}

export async function fileToPayload(file: File): Promise<SupportFilePayload> {
  if (file.size > MAX_SUPPORT_FILE_BYTES) {
    throw new Error("Dosya 512 KB sınırını aşıyor.");
  }
  const dataBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? "");
      const comma = raw.indexOf(",");
      resolve(comma >= 0 ? raw.slice(comma + 1) : raw);
    };
    reader.onerror = () => reject(new Error("Dosya okunamadı."));
    reader.readAsDataURL(file);
  });
  return { fileName: file.name, mimeType: file.type || "application/octet-stream", dataBase64 };
}
