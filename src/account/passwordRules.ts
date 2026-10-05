/** changeAccountPassword ile aynı eşikler. Ek karmaşıklık kuralı yok. */
export const MIN_PASSWORD_LENGTH = 8;

export type PasswordCheck = {
  id: "length" | "different" | "match";
  label: string;
  met: boolean;
};

export function passwordChecklist(input: {
  currentPassword: string;
  newPassword: string;
  confirm: string;
}): PasswordCheck[] {
  const current = input.currentPassword;
  const next = input.newPassword;
  const confirm = input.confirm;
  return [
    {
      id: "length",
      label: "En az 8 karakter",
      met: next.length >= MIN_PASSWORD_LENGTH,
    },
    {
      id: "different",
      label: "Mevcut şifreden farklı",
      met: next.length > 0 && current.length > 0 && next !== current,
    },
    {
      id: "match",
      label: "Yeni şifre tekrarı eşleşiyor",
      met: next.length > 0 && confirm.length > 0 && next === confirm,
    },
  ];
}
