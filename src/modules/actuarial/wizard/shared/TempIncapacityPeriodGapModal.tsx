import { useState } from "react";
import { formatDateIso } from "../../utils/formatDisplay";
import {
  TEMP_INCAPACITY_PERIOD_GAP_MESSAGE,
  TEMP_INCAPACITY_PERIOD_GAP_TITLE,
} from "./tempIncapacityPeriodContinuity";
import type { EffectiveTemporaryRange } from "./tempIncapacityPeriodUtils";
import { PremiumValidationModal } from "./PremiumValidationModal";

export function TempIncapacityPeriodGapModal({
  effectiveRange,
  onBack,
  onConfirm,
}: {
  effectiveRange: EffectiveTemporaryRange | null;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const [ignoreChecked, setIgnoreChecked] = useState(false);

  const rangeText =
    effectiveRange != null
      ? `${formatDateIso(effectiveRange.startDate)} – ${formatDateIso(effectiveRange.endDate)} tarihleri baz alınacaktır.`
      : null;

  return (
    <PremiumValidationModal
      title={TEMP_INCAPACITY_PERIOD_GAP_TITLE}
      description={TEMP_INCAPACITY_PERIOD_GAP_MESSAGE}
      severity="error"
      cancelLabel="Geri Dön"
      onCancel={onBack}
      confirmLabel="Devam Et"
      confirmDisabled={!ignoreChecked}
      onConfirm={onConfirm}
    >
      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-[#FECACA] text-[#DC2626] focus:ring-[#DC2626]/30"
          checked={ignoreChecked}
          onChange={(e) => setIgnoreChecked(e.target.checked)}
        />
        <span className="text-[13px] text-[#991B1B]">Boşluklu tarihi göz ardı et</span>
      </label>

      {ignoreChecked && rangeText && (
        <div className="mt-3 rounded-[8px] border border-[#FECACA]/80 bg-[#FEF2F2]/80 px-3 py-2">
          <p className="text-[12.5px] text-[#991B1B] leading-snug">{rangeText}</p>
        </div>
      )}
    </PremiumValidationModal>
  );
}
