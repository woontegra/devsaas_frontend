import type { ActuarialResultPayload } from "../../services/api";

const formatCurrency = (n: number) => n.toLocaleString("tr-TR");

interface ReportPreviewProps {
  result: ActuarialResultPayload | null;
  onExport?: () => void;
  onExportExpert?: () => void;
  onSave?: () => void;
  exporting?: boolean;
  exportingExpert?: boolean;
  saving?: boolean;
}

export function ReportPreview({
  result,
  onExport,
  onExportExpert,
  onSave,
  exporting = false,
  exportingExpert = false,
  saving = false,
}: ReportPreviewProps) {
  if (!result) return null;

  const d = new Date(result.metadata.calculatedAt);
  const dateStr = d.toLocaleDateString("tr-TR", { dateStyle: "long" });
  const timeStr = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 md:px-8">
      <div className="max-w-[900px] mx-auto">
        {/* Document container */}
        <div className="bg-white rounded-none md:rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative">
          {/* Actions - top right */}
          <div className="absolute top-6 right-6 md:top-8 md:right-8 flex flex-wrap items-center gap-2">
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="text-[14px] font-medium text-app-primary hover:text-app-accent disabled:opacity-60 transition-colors duration-200"
              >
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </button>
            )}
            {onExport && (
              <button
                type="button"
                onClick={onExport}
                disabled={exporting}
                className="px-4 py-2 text-[14px] font-medium text-white bg-app-primary hover:bg-app-accent disabled:opacity-60 transition-colors duration-200"
              >
                {exporting ? "Hazırlanıyor…" : "DOCX İndir"}
              </button>
            )}
            {onExportExpert && (
              <button
                type="button"
                onClick={onExportExpert}
                disabled={exportingExpert}
                className="px-4 py-2 text-[14px] font-medium text-white bg-gray-700 hover:bg-gray-800 disabled:opacity-60 transition-colors duration-200"
              >
                {exportingExpert ? "Hazırlanıyor…" : "Bilirkişi Raporu İndir"}
              </button>
            )}
          </div>

          {/* Document content - Word-like margins */}
          <div className="pt-12 md:pt-16 pb-16 md:pb-20 px-10 md:px-16">
            {/* Case title - centered */}
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-6 leading-tight">
              Aktüeryal Hesaplama Raporu
            </h1>

            {/* Case metadata */}
            <div className="text-[15px] text-gray-600 text-center mb-12 leading-[1.7] font-sans">
              <p>Rapor Tarihi: {dateStr}</p>
              <p>Saat: {timeStr}</p>
            </div>

            {/* Numbered sections */}
            <div className="space-y-8 leading-[1.7]">
              <section>
                <h2 className="text-[16px] font-semibold text-gray-900 mb-3">1. Genel Bilgiler</h2>
                <p className="text-[16px] text-gray-800 font-[Georgia]">
                  Bu rapor, talep konusu iş kazası nedeniyle malulen emeklilik hakkı doğan kişinin
                  hesaplanmış tazminat tutarını içermektedir.
                </p>
              </section>

              <section>
                <h2 className="text-[16px] font-semibold text-gray-900 mb-3">2. Hesaplama Parametreleri</h2>
                <ul className="list-decimal list-inside text-[16px] text-gray-800 font-[Georgia] space-y-2">
                  <li>Kaza tarihinde yaş: {result.ageAtAccident.toFixed(2)}</li>
                  <li>Aktif dönem süresi: {result.activePeriodYears} yıl</li>
                  <li>Pasif dönem süresi: {result.passivePeriodYears} yıl</li>
                  <li>İskonto oranı: %{(result.metadata.interestRate * 100).toFixed(2)}</li>
                  <li>Ücret artış oranı: %{(result.metadata.wageIncreaseRate * 100).toFixed(2)}</li>
                  <li>Maluliyet oranı: %{result.metadata.disabilityRate}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-[16px] font-semibold text-gray-900 mb-3">3. Finansal Özet</h2>
                <div className="bg-[#f0f4f8] border border-[#d1dae6] rounded-sm p-6 md:p-8">
                  <table className="w-full text-[16px] font-[Georgia]">
                    <tbody>
                      <tr>
                        <td className="py-2 text-gray-700">Aktif dönem bugünkü değer</td>
                        <td className="py-2 text-right font-medium text-gray-900 tabular-nums">
                          {formatCurrency(result.breakdown.activePeriodPV)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-700">Pasif dönem bugünkü değer</td>
                        <td className="py-2 text-right font-medium text-gray-900 tabular-nums">
                          {formatCurrency(result.breakdown.passivePeriodPV)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-700">İskonto faktörü</td>
                        <td className="py-2 text-right font-medium text-gray-900 tabular-nums">
                          {result.discountFactor.toFixed(4)}
                        </td>
                      </tr>
                      <tr className="border-t border-[#d1dae6]">
                        <td className="pt-4 pb-2 text-gray-900 font-semibold">Aylık maaş</td>
                        <td className="pt-4 pb-2 text-right font-semibold text-app-primary tabular-nums">
                          {formatCurrency(result.monthlyPension)}
                        </td>
                      </tr>
                      <tr>
                        <td className="pt-2 pb-4 text-gray-900 font-semibold">Toplam bugünkü değer</td>
                        <td className="pt-2 pb-4 text-right font-semibold text-app-primary text-lg tabular-nums">
                          {formatCurrency(result.presentCapitalValue)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-[16px] font-semibold text-gray-900 mb-3">4. Sonuç</h2>
                <p className="text-[16px] text-gray-800 font-[Georgia]">
                  Yapılan aktüeryal hesaplamalar sonucunda, talep konusu olay nedeniyle oluşan
                  maluliyetin bugünkü değeri{" "}
                  <strong className="text-app-primary">{formatCurrency(result.presentCapitalValue)}</strong>{" "}
                  olarak hesaplanmıştır.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
