import {
  PremiumValidationModal,
  type PremiumValidationSeverity,
} from "./PremiumValidationModal";

export type ValidationAlertSeverity = PremiumValidationSeverity;

export interface ValidationAlertModalProps {
  open?: boolean;
  title: string;
  description: string;
  severity?: ValidationAlertSeverity;
  onClose: () => void;
  confirmLabel?: string;
}

/** @deprecated Prefer PremiumValidationModal directly */
export function ValidationAlertModal({
  open = true,
  title,
  description,
  severity = "error",
  onClose,
  confirmLabel = "Tamam",
}: ValidationAlertModalProps) {
  return (
    <PremiumValidationModal
      open={open}
      title={title}
      description={description}
      severity={severity}
      confirmLabel={confirmLabel}
      onConfirm={onClose}
    />
  );
}

export { PremiumValidationModal };
