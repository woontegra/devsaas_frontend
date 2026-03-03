import { useState } from "react";
import { ActuarialForm } from "./ActuarialForm";
import { ResultCard } from "./ResultCard";
import {
  calculate,
  saveCase,
  downloadReport,
  type ActuarialInputPayload,
  type ActuarialResultPayload,
} from "../../services/api";

export function ActuarialPage() {
  const [result, setResult] = useState<ActuarialResultPayload | null>(null);
  const [lastInput, setLastInput] = useState<ActuarialInputPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
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
        const msg = err.response?.data?.errors?.join?.(" ") ?? err.response?.data?.error ?? "Calculation failed";
        setError(String(msg));
        setResult(null);
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

  return (
    <div className="min-h-screen bg-slate-100 pb-32 md:pb-8">
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-slate-800 mb-4">Actuarial calculation</h1>
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 mb-4">
          <ActuarialForm onSubmit={handleSubmit} loading={loading} />
        </div>
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-base text-red-700">
            {error}
          </div>
        )}
        {result && (
          <div className="mb-4 md:mb-0">
            <ResultCard
              result={result}
              onSave={lastInput ? handleSave : undefined}
              onDownloadReport={handleDownloadReport}
              saving={saving}
              downloading={downloading}
            />
          </div>
        )}
      </div>
      {result && (
        <div className="fixed bottom-0 left-0 right-0 md:relative md:max-w-lg md:mx-auto md:px-4 md:pb-4">
          <div className="bg-slate-800 text-white p-4 shadow-lg md:rounded-xl md:mt-4">
            <p className="text-base font-medium">Present capital value</p>
            <p className="text-lg font-bold">{result.presentCapitalValue.toLocaleString()}</p>
            <p className="text-sm text-slate-300 mt-1">
              Monthly pension: {result.monthlyPension.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
