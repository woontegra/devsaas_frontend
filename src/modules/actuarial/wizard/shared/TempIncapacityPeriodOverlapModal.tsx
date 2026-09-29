import {
  TEMP_INCAPACITY_PERIOD_OVERLAP_MESSAGE,
  TEMP_INCAPACITY_PERIOD_OVERLAP_TITLE,
} from "./tempIncapacityPeriodContinuity";
import { ValidationAlertModal } from "./ValidationAlertModal";

export function TempIncapacityPeriodOverlapModal({ onClose }: { onClose: () => void }) {
  return (
    <ValidationAlertModal
      title={TEMP_INCAPACITY_PERIOD_OVERLAP_TITLE}
      description={TEMP_INCAPACITY_PERIOD_OVERLAP_MESSAGE}
      severity="error"
      onClose={onClose}
    />
  );
}
