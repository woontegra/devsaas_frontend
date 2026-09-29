import {
  getTempDisabilityContinuityMessage,
  type TempDisabilityContinuityCode,
} from "./tempDisabilityContinuity";
import { ValidationAlertModal } from "./ValidationAlertModal";

const TITLE = "Hastane raporu bitiş tarihi ile maluliyet başlangıç tarihi örtüşmüyor";

export function TempDisabilityGapModal({
  errorCode,
  onClose,
}: {
  errorCode: TempDisabilityContinuityCode;
  onClose: () => void;
}) {
  return (
    <ValidationAlertModal
      title={TITLE}
      description={getTempDisabilityContinuityMessage(errorCode)}
      severity="error"
      onClose={onClose}
    />
  );
}
