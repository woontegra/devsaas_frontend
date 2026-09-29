import {
  DISABILITY_START_DATE_REQUIRED_MESSAGE,
  DISABILITY_START_DATE_REQUIRED_TITLE,
} from "./disabilityStartDateValidation";
import { ValidationAlertModal } from "./ValidationAlertModal";

export function DisabilityStartDateRequiredModal({ onClose }: { onClose: () => void }) {
  return (
    <ValidationAlertModal
      title={DISABILITY_START_DATE_REQUIRED_TITLE}
      description={DISABILITY_START_DATE_REQUIRED_MESSAGE}
      severity="error"
      onClose={onClose}
    />
  );
}
