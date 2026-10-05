import type { ValidationIssue } from "../../types/calculationDraft";

export function buildValidationToastCopy(errors: ValidationIssue[]): {
  title: string;
  description: string;
} {
  if (errors.length === 0) {
    return {
      title: "Eksik bilgi",
      description: "Devam etmek için bu adımdaki zorunlu alanları doldurun.",
    };
  }
  if (errors.length === 1) {
    return {
      title: "Eksik bilgi",
      description: errors[0]!.message,
    };
  }
  if (errors.length <= 3) {
    return {
      title: `${errors.length} zorunlu alan eksik`,
      description: errors.map((e) => e.message).join(" "),
    };
  }
  return {
    title: `${errors.length} zorunlu alan eksik`,
    description: "İşaretlenen alanları doldurun.",
  };
}

export function buildFileValidationToastCopy(errorCount: number): {
  title: string;
  description: string;
} {
  if (errorCount <= 0) {
    return {
      title: "Dosyada eksik bilgiler var",
      description: "Zorunlu alanları tamamlayın.",
    };
  }
  if (errorCount === 1) {
    return {
      title: "Dosyada eksik bilgiler var",
      description: "1 zorunlu alan tamamlanmadı.",
    };
  }
  return {
    title: "Dosyada eksik bilgiler var",
    description: `${errorCount} zorunlu alan tamamlanmadı.`,
  };
}

/** Scroll/focus the first field marked with validation error after paint. */
export function focusFirstInvalidField(): void {
  const run = () => {
    const host =
      document.querySelector<HTMLElement>(".actuarial-premium .field-has-error") ??
      document.querySelector<HTMLElement>(".field-has-error");
    if (!host) return;
    host.scrollIntoView({ behavior: "smooth", block: "center" });
    const control = host.querySelector<HTMLElement>(
      "input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
    );
    if (control && typeof control.focus === "function") {
      try {
        control.focus({ preventScroll: true });
      } catch {
        control.focus();
      }
    }
  };
  window.requestAnimationFrame(() => {
    window.setTimeout(run, 40);
  });
}
