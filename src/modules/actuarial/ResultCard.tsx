import type { ActuarialResultPayload } from "../../services/api";

export interface ResultCardProps {
  result: ActuarialResultPayload | null;
  onSave?: () => void;
  onDownloadReport?: () => void;
  saving?: boolean;
  downloading?: boolean;
}

export function ResultCard({
  result,
  onSave,
  onDownloadReport,
  saving = false,
  downloading = false,
}: ResultCardProps) {
  if (!result) return null;

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-base font-semibold text-slate-800">Result</h3>
      </div>
      <div className="p-4 space-y-2 text-base">
        <div className="flex justify-between">
          <span className="text-slate-600">Age at accident</span>
          <span className="font-medium">{result.ageAtAccident.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Active period</span>
          <span className="font-medium">{result.activePeriodYears} years</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Passive period</span>
          <span className="font-medium">{result.passivePeriodYears} years</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Monthly pension</span>
          <span className="font-medium">{result.monthlyPension.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Present capital value</span>
          <span className="font-medium text-green-700">
            {result.presentCapitalValue.toLocaleString()}
          </span>
        </div>
      </div>
      {(onSave || onDownloadReport) && (
        <div className="p-4 flex gap-2 flex-wrap">
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="min-h-[44px] px-4 py-2 text-base font-medium rounded-lg bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save case"}
            </button>
          )}
          {onDownloadReport && (
            <button
              type="button"
              onClick={onDownloadReport}
              disabled={downloading}
              className="min-h-[44px] px-4 py-2 text-base font-medium rounded-lg border-2 border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {downloading ? "Preparing…" : "Download report"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
