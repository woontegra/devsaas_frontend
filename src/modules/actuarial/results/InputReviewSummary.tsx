import type { CalculationReviewSummaryResponse, TrafficInjuryReviewSummary } from "../types/calculationReviewSummary";
import {
  formatDateIso,
  formatMoney,
  formatNumber,
  formatPercent,
} from "../utils/formatDisplay";
import { FormSection } from "../wizard/shared/FormPrimitives";

function isTrafficInjurySummary(
  s: CalculationReviewSummaryResponse["summary"]
): s is TrafficInjuryReviewSummary {
  return s.calculationType === "TRAFFIC_INJURY";
}

const INCOME_MODE_LABELS: Record<string, string> = {
  minWage: "Net asgari ücret",
  fixed: "Sabit net gelir",
  average: "Ortalama net gelir",
};

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 py-1 border-b border-[#D9E5E3]/50 last:border-0">
      <dt className="text-[12px] text-[#6B7280]">{label}</dt>
      <dd className="text-[12.5px] text-[#22313F] tabular-nums text-left sm:text-right">{value}</dd>
    </div>
  );
}

export function InputReviewSummary({
  data,
}: {
  data: CalculationReviewSummaryResponse;
}) {
  const s = data.summary;
  if (!isTrafficInjurySummary(s)) {
    return (
      <FormSection title="Hesabını Kontrol Et">
        <p className="text-[13px] text-[#6B7280]">{s.message}</p>
      </FormSection>
    );
  }

  return (
    <FormSection title="Hesabını Kontrol Et">
      <p className="text-[12px] text-[#6B7280] mb-3">
        Aşağıda yalnızca girdiğiniz bilgiler özetlenmiştir. Parasal hesap sonucu bu aşamada
        gösterilmez.
      </p>
      <dl className="rounded-[10px] border border-[#D9E5E3] bg-white px-3 py-2">
        <SummaryLine label="Hesap türü" value="Trafik Kazası Yaralanma" />
        <SummaryLine label="Davacı" value={s.plaintiffName} />
        <SummaryLine
          label="Doğum tarihi / cinsiyet"
          value={`${formatDateIso(s.birthDate)} · ${s.gender ?? "—"}`}
        />
        <SummaryLine label="Kaza tarihi" value={formatDateIso(s.eventDate)} />
        <SummaryLine label="Hesap tarihi" value={formatDateIso(s.calculationDate)} />
        <SummaryLine
          label="İşlemiş dönem"
          value={`${formatDateIso(s.processedPeriodStartDate)} – ${formatDateIso(s.processedPeriodEndDate)}`}
        />
        <SummaryLine
          label="Geçici İG dönemleri"
          value={
            s.temporaryIncapacityPeriods.length === 0
              ? "—"
              : s.temporaryIncapacityPeriods
                  .map((p) => `${formatDateIso(p.startDate)} – ${formatDateIso(p.endDate)}`)
                  .join("; ")
          }
        />
        <SummaryLine
          label="Maluliyet"
          value={`${formatPercent(s.permanentDisabilityRate)} · başlangıç ${formatDateIso(s.disabilityStartDate)}`}
        />
        <SummaryLine label="Davacı kusur oranı" value={formatPercent(s.injuredFaultRatio)} />
        <SummaryLine
          label="Gelir"
          value={
            s.incomeMode === "fixed"
              ? `${INCOME_MODE_LABELS[s.incomeMode] ?? s.incomeMode}: ${formatMoney(s.fixedAmount)}`
              : s.incomeMode === "average"
                ? `${INCOME_MODE_LABELS[s.incomeMode] ?? s.incomeMode}: ${formatMoney(s.averageNetResult)}`
                : INCOME_MODE_LABELS[s.incomeMode] ?? s.incomeMode
          }
        />
        <SummaryLine
          label="Pasif dönem yaşı"
          value={s.passivePhaseAge != null ? `${formatNumber(s.passivePhaseAge)} yaş` : "—"}
        />
        <SummaryLine
          label="PSD kayıtları"
          value={
            s.psdDocuments.length === 0
              ? "—"
              : s.psdDocuments
                  .map((d) => `${d.personLabel ?? "—"}: ${formatMoney(d.amount)}`)
                  .join("; ")
          }
        />
        <SummaryLine
          label="ZMTS ödemeleri"
          value={
            s.zmtsPayments.length === 0
              ? "—"
              : `${s.zmtsPayments.length} kayıt`
          }
        />
        {s.zmtsPayments.map((p, i) => (
          <SummaryLine
            key={`z-${i}`}
            label={`  ZMTS ${i + 1}`}
            value={`${formatDateIso(p.paymentDate)} · ${formatMoney(p.paymentAmount)} · garame ${p.garameEnabled ? "açık" : "kapalı"}`}
          />
        ))}
        <SummaryLine
          label="Kasko ödemeleri"
          value={
            s.cascoPayments.length === 0
              ? "—"
              : `${s.cascoPayments.length} kayıt`
          }
        />
        {s.cascoPayments.map((p, i) => (
          <SummaryLine
            key={`c-${i}`}
            label={`  Kasko ${i + 1}`}
            value={`${formatDateIso(p.paymentDate)} · ${formatMoney(p.paymentAmount)} · garame ${p.garameEnabled ? "açık" : "kapalı"}`}
          />
        ))}
      </dl>
      <p className="text-[11px] text-[#6B7280] mt-2 font-mono break-all">
        Girdi özeti hash (v{data.calculationHashVersion}): {data.inputHash.slice(0, 16)}…
      </p>
    </FormSection>
  );
}
