import { TEMP_INCAPACITY_START_MUST_MATCH_EVENT_DATE_MESSAGE } from "./tempIncapacityStartValidation";
import { ValidationAlertModal } from "./ValidationAlertModal";

const TITLE = "Geçici iş göremezlik başlangıç tarihi kaza tarihi ile aynı olmalıdır";

export function TempIncapacityStartModal({ onClose }: { onClose: () => void }) {
  return (
    <ValidationAlertModal
      title={TITLE}
      description={TEMP_INCAPACITY_START_MUST_MATCH_EVENT_DATE_MESSAGE}
      severity="error"
      onClose={onClose}
    />
  );
}
