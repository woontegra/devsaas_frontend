import { useEffect, useState } from "react";
import { uiText } from "../../config/uiText";
import { validate, type ActuarialInputPayload, type ActuarialResultPayload, type ValidationResultPayload } from "../../services/api";

const t = uiText.validation;

interface ValidationPanelProps {
  input: ActuarialInputPayload | null;
  result: ActuarialResultPayload | null;
}

function Item({ severity, message }: { severity: string; message: string }) {
  const isError = severity === "error";
  const isWarning = severity === "warning";
  const bg = isError ? "bg-red-50 border-red-100" : isWarning ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100";
  const icon = isError ? "●" : isWarning ? "◆" : "○";
  const color = isError ? "text-red-700" : isWarning ? "text-amber-800" : "text-slate-600";
  return (
    <div className={`flex gap-2 py-1.5 px-2.5 rounded-md border text-[12px] ${bg} ${color}`}>
      <span className="shrink-0">{icon}</span>
      <span>{message}</span>
    </div>
  );
}

export function ValidationPanel({ input, result }: ValidationPanelProps) {
  const [validation, setValidation] = useState<ValidationResultPayload[] | null>(null);
  const [reportText, setReportText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!input || !result) {
      setValidation(null);
      setReportText(null);
      return;
    }
    setLoading(true);
    validate(input, result)
      .then((res) => {
        setValidation(res.validation);
        setReportText(res.reportText);
      })
      .catch(() => {
        setValidation([]);
        setReportText(null);
      })
      .finally(() => setLoading(false));
  }, [input, result]);

  if (!result) return null;
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-3">
        <h3 className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-2">{t.title}</h3>
        <p className="text-[12px] text-gray-400">Denetim yapılıyor…</p>
      </div>
    );
  }

  const errors = validation?.filter((v) => v.severity === "error") ?? [];
  const warnings = validation?.filter((v) => v.severity === "warning") ?? [];
  const infos = validation?.filter((v) => v.severity === "info") ?? [];
  const hasAny = errors.length + warnings.length + infos.length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-3 py-2.5 border-b border-gray-100">
        <h3 className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">{t.title}</h3>
      </div>
      <div className="p-3 space-y-3">
        {!hasAny && (
          <p className="text-[12px] text-gray-500">{t.noIssues}</p>
        )}
        {errors.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-red-600 uppercase tracking-wider mb-1.5">{t.errors}</p>
            <div className="space-y-1">
              {errors.map((v, i) => (
                <Item key={i} severity={v.severity} message={v.message} />
              ))}
            </div>
          </div>
        )}
        {warnings.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-amber-700 uppercase tracking-wider mb-1.5">{t.warnings}</p>
            <div className="space-y-1">
              {warnings.map((v, i) => (
                <Item key={i} severity={v.severity} message={v.message} />
              ))}
            </div>
          </div>
        )}
        {infos.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-1.5">{t.suggestions}</p>
            <div className="space-y-1">
              {infos.map((v, i) => (
                <Item key={i} severity={v.severity} message={v.message} />
              ))}
            </div>
          </div>
        )}
        {reportText && (
          <details className="group">
            <summary className="text-[11px] font-medium text-gray-600 cursor-pointer list-none flex items-center gap-1">
              <span className="group-open:rotate-90 transition-transform">▸</span>
              {t.reportText}
            </summary>
            <pre className="mt-1.5 p-2.5 rounded-md bg-gray-50 border border-gray-100 text-[11px] text-gray-700 whitespace-pre-wrap font-sans overflow-x-auto max-h-40 overflow-y-auto">
              {reportText}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
