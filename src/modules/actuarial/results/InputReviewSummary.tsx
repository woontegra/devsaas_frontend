import type {
  CalculationReviewSummaryResponse,
  TrafficDeathReviewSummary,
  TrafficInjuryReviewSummary,
} from "../types/calculationReviewSummary";
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

function isTrafficDeathSummary(
  s: CalculationReviewSummaryResponse["summary"]
): s is TrafficDeathReviewSummary {
  return s.calculationType === "TRAFFIC_DEATH";
}

const INCOME_MODE_LABELS: Record<string, string> = {
  minWage: "Net asgari ücret",
  fixed: "Sabit net gelir",
  average: "Ortalama net gelir",
};

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 py-1 border-b border-[#DCE3E8]/50 last:border-0">
      <dt className="text-[12px] text-[#66727F]">{label}</dt>
      <dd className="text-[12.5px] text-[#1F2933] tabular-nums text-left sm:text-right">{value}</dd>
    </div>
  );
}

export function InputReviewSummary({
  data,
}: {
  data: CalculationReviewSummaryResponse;
}) {
  const s = data.summary;
  if (isTrafficDeathSummary(s)) {
    return (
      <FormSection title="Hesabını Kontrol Et">
        <p className="text-[12px] text-[#66727F] mb-3">
          Aşağıda yalnızca girdiğiniz bilgiler özetlenmiştir. Parasal hesap sonucu bu aşamada
          gösterilmez.
        </p>
        <dl className="rounded-[10px] border border-[#DCE3E8] bg-white px-3 py-2">
          <SummaryLine label="Hesap türü" value="Trafik Kazası Ölüm" />
          <SummaryLine label="Müteveffa" value={s.deceasedName} />
          <SummaryLine label="Kaza tarihi" value={formatDateIso(s.eventDate)} />
          <SummaryLine label="Hesap tarihi" value={formatDateIso(s.calculationDate)} />
          <SummaryLine label="Davacılar" value={String(s.plaintiffBeneficiaryCount)} />
          <SummaryLine label="Dava dışı" value={String(s.outOfCaseBeneficiaryCount)} />
          <SummaryLine label="Çalışma durumu" value={s.employmentStatusLabel} />
          {s.employmentStatus === "WORKING" && (
            <>
              <SummaryLine label="Gelir türü" value={s.incomeMode ?? "—"} />
              <SummaryLine label="Esas alınan net gelir" value={formatMoney(s.effectiveNetIncome)} />
            </>
          )}
          {s.employmentStatus === "NOT_WORKING" && (
            <>
              <SummaryLine
                label="Kaza tarihindeki net asgari ücret"
                value={formatMoney(s.referenceMinWageAtEvent)}
              />
              <SummaryLine
                label="Esas alınacak gelir"
                value={formatMoney(s.nonWorkingSelectedIncome)}
              />
            </>
          )}
        </dl>
        <p className="text-[11px] text-[#66727F] mt-2 font-mono break-all">
          Girdi özeti hash (v{data.calculationHashVersion}): {data.inputHash.slice(0, 16)}…
        </p>
      </FormSection>
    );
  }
  if (!isTrafficInjurySummary(s)) {
    return (
      <FormSection title="Hesabını Kontrol Et">
        <p className="text-[13px] text-[#66727F]">{s.message}</p>
      </FormSection>
    );
  }

  return (
    <FormSection title="Hesabını Kontrol Et">
      <p className="text-[12px] text-[#66727F] mb-3">
        Aşağıda yalnızca girdiğiniz bilgiler özetlenmiştir. Parasal hesap sonucu bu aşamada
        gösterilmez.
      </p>
      <dl className="rounded-[10px] border border-[#DCE3E8] bg-white px-3 py-2">
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
          label="Geçici İş Göremezlik"
          value={
            s.temporaryIncapacityPeriods.length === 0
              ? "—"
              : s.temporaryIncapacityPeriods
                  .map((p) => `${formatDateIso(p.startDate)} – ${formatDateIso(p.endDate)}`)
                  .join("; ")
          }
        />
        {s.temporaryIncapacityIgnoreGaps && s.temporaryIncapacityGapIgnoredNote && (
          <div className="py-1.5 border-b border-[#DCE3E8]/50 last:border-0">
            <p className="text-[11.5px] text-[#66727F] leading-snug pl-0.5">
              {s.temporaryIncapacityGapIgnoredNote}
            </p>
          </div>
        )}
        <SummaryLine
          label="Maluliyet"
          value={`${formatPercent(s.permanentDisabilityRate)} · başlangıç ${formatDateIso(s.disabilityStartDate)}`}
        />
        <SummaryLine label="Davacı kusur oranı" value={formatPercent(s.injuredFaultRatio)} />
        {s.defendantFaultRatios.length === 0 ? (
          <SummaryLine label="Davalı kusurları" value="—" />
        ) : (
          s.defendantFaultRatios.map((d, i) => (
            <SummaryLine
              key={`df-${i}`}
              label={s.defendantFaultRatios.length === 1 ? "Davalı kusuru" : `Davalı kusuru (${d.name})`}
              value={formatPercent(d.faultRatio)}
            />
          ))
        )}
        <SummaryLine label="Dava dışı kusur" value={formatPercent(s.externalFaultRatio)} />
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
      <p className="text-[11px] text-[#66727F] mt-2 font-mono break-all">
        Girdi özeti hash (v{data.calculationHashVersion}): {data.inputHash.slice(0, 16)}…
      </p>
    </FormSection>
  );
}
