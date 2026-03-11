import { useState } from "react";
import { ActuarialWizard } from "./wizard/ActuarialWizard";
import { LiveResultSummary } from "./LiveResultSummary";
import { CaseMetadata } from "./CaseMetadata";
import { ReportPreview } from "./ReportPreview";
import { ValidationPanel } from "./ValidationPanel";
import { YearlyActuarialTable } from "./YearlyActuarialTable";
import { SgkPSDSection } from "./SGKPSDSection";
import { WorkInjuryBreakdown } from "./WorkInjuryBreakdown";
import { uiText } from "../../config/uiText";
import type { CalculationType } from "./types/caseFormTypes";
import {
  calculate,
  runCalculation,
  mapCalculationResultToPayload,
  saveCase,
  downloadReport,
  downloadExpertReport,
  type ActuarialInputPayload,
  type ActuarialResultPayload,
} from "../../services/api";

export function ActuarialPage() {
  const [result, setResult] = useState<ActuarialResultPayload | null>(null);
  const [lastInput, setLastInput] = useState<ActuarialInputPayload | null>(null);
  const [lastCalculationType, setLastCalculationType] = useState<CalculationType | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingExpert, setDownloadingExpert] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (input: ActuarialInputPayload) => {
    setError(null);
    setLoading(true);
    calculate(input)
      .then((res) => {
        setResult(res.result);
        setLastInput(input);
      })
      .catch((err) => {
        const msg = err.response?.data?.errors?.join?.(" ") ?? err.response?.data?.error ?? uiText.errors.calculationFailed;
        setError(String(msg));
        setResult(null);
      })
      .finally(() => setLoading(false));
  };

  const handleSubmitByType = (
    type: CalculationType,
    params: Record<string, unknown>
  ): Promise<ActuarialResultPayload | null> => {
    setError(null);
    setLoading(true);
    return runCalculation(type, params)
      .then((res) => {
        const metadata = {
          interestRate: (params.discountRate as number) ?? 0.1,
          wageIncreaseRate: (params.increaseRate as number) ?? 0.03,
          disabilityRate: (params.maluliyetOrani as number) ?? 100,
        };
        const payload = mapCalculationResultToPayload(res.result, metadata);
        setResult(payload);
        setLastInput(null);
        setLastCalculationType(type);
        return payload;
      })
      .catch((err) => {
        const msg = err.response?.data?.error ?? err.message ?? uiText.errors.calculationFailed;
        setError(String(msg));
        setResult(null);
        return null;
      })
      .finally(() => setLoading(false));
  };

  const handleSave = () => {
    if (!result || !lastInput) return;
    setSaving(true);
    saveCase({ inputJson: lastInput, resultJson: result })
      .then(() => setSaving(false))
      .catch(() => setSaving(false));
  };

  const handleDownloadReport = () => {
    if (!result) return;
    setDownloading(true);
    downloadReport(result)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "actuarial-report.docx";
        a.click();
        URL.revokeObjectURL(url);
      })
      .finally(() => setDownloading(false));
  };

  const handleDownloadExpertReport = () => {
    if (!result) return;
    setError(null);
    setDownloadingExpert(true);
    const caseInfo = lastInput?.accidentDate
      ? { olayTarihi: lastInput.accidentDate, kazaTuru: lastCalculationType ?? undefined }
      : { kazaTuru: lastCalculationType ?? undefined };
    downloadExpertReport({
      result,
      caseInfo: Object.keys(caseInfo).length ? caseInfo : undefined,
      calculationType: lastCalculationType ?? undefined,
    })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "bilirkişi-raporu.docx";
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(async (err) => {
        const data = err.response?.data;
        let message = err.message ?? "Bilirkişi raporu indirilemedi.";
        if (data instanceof Blob) {
          try {
            const text = await data.text();
            const json = JSON.parse(text);
            if (typeof json?.error === "string") message = json.error;
          } catch {
            // ignore parse error
          }
        } else if (data?.error) {
          message = data.error;
        }
        setError(message);
      })
      .finally(() => setDownloadingExpert(false));
  };

  return (
    <div className="min-h-screen pb-[68px] md:pb-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-5 md:py-6">
        <div className="space-y-5 md:space-y-6 animate-fade-in">
          {/* Sonuç yokken wizard tam genişlik; sonuç varken 2 kolon (3+2) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 md:gap-6">
            <div className={result != null ? "lg:col-span-3 space-y-5" : "lg:col-span-5 space-y-5"}>
              <ActuarialWizard
                onSubmit={handleSubmit}
                onSubmitByType={handleSubmitByType}
                result={result}
                loading={loading}
                fullWidth={result == null}
              />
            </div>
            <div className="lg:col-span-2">
              {result != null && (
                <div className="lg:h-fit">
                  <LiveResultSummary result={result} />
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-[13px] text-red-600">
              {error}
            </div>
          )}

          {result && (
            <div className="pt-5 md:pt-6 space-y-5 md:space-y-6">
              <ValidationPanel input={lastInput} result={result} />
              {result.yearlyActuarialTable && result.yearlyActuarialTable.length > 0 && (
                <YearlyActuarialTable rows={result.yearlyActuarialTable} />
              )}
              {result.sgkPSD != null && result.sgkPSD > 0 && (
                <SgkPSDSection
                  sgkPSD={result.sgkPSD}
                  sgkYearlyTable={result.sgkYearlyTable}
                />
              )}
              {result.totalCompensation != null && (
                <WorkInjuryBreakdown result={result} />
              )}
              <CaseMetadata result={result} />
              <ReportPreview
                result={result}
                onSave={lastInput ? handleSave : undefined}
                onExport={handleDownloadReport}
                onExportExpert={handleDownloadExpertReport}
                saving={saving}
                exporting={downloading}
                exportingExpert={downloadingExpert}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile: wizard CTA is inline at step 5 */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-20 h-16 pointer-events-none" aria-hidden="true" />
    </div>
  );
}
