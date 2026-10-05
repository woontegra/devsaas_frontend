import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import type { AuthMeResponse } from "../modules/actuarial/types/savedCalculation";
import { AccountCard, useSalesCta } from "./accountUi";
import { buildLicenseView, type LicenseTone } from "./licenseView";

type Ctx = { me: AuthMeResponse | null };

function formatTrDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("tr-TR");
}

function Meter({ value, tone }: { value: number | null; tone: LicenseTone }) {
  if (value == null) return null;
  const width = Math.max(0, Math.min(100, value));
  return (
    <div className={`license-meter is-${tone}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(width)}>
      <span style={{ width: `${width}%` }} />
    </div>
  );
}

function LicenseTable({ rows }: { rows: Array<{ label: string; value: string }> }) {
  return (
    <div className="license-table" role="table">
      {rows.map((row) => (
        <div key={row.label} className="license-cell" role="cell">
          <span className="license-th">{row.label}</span>
          <span className="license-td">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function ProgressBlock({
  label,
  value,
  percent,
  tone,
}: {
  label: string;
  value: string;
  percent: number | null;
  tone: LicenseTone;
}) {
  return (
    <div className="license-progress">
      <div className="license-progress-row">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <Meter value={percent} tone={tone} />
    </div>
  );
}

export function AccountLicensePage() {
  const { me } = useOutletContext<Ctx>();
  const sales = useSalesCta();
  const now = useMemo(() => new Date(), []);
  const view = buildLicenseView(me, now);

  if (!view) {
    return (
      <AccountCard title="Lisans">
        <p className="m-0 text-[13px] text-[var(--color-muted)]">Lisans bilgisi yüklenemedi.</p>
      </AccountCard>
    );
  }

  if (view.kind === "demo") {
    const duration = !view.expiresAt ? "—" : view.timeEnded ? "Süre doldu" : `${view.daysLeft} gün`;
    const creditCell = view.creditsInitial > 0 ? `${view.creditsRemaining} / ${view.creditsInitial}` : `${view.creditsRemaining}`;
    return (
      <>
        <AccountCard
          padded={false}
          title="Deneme sürümü"
          actions={<span className={`license-status is-${view.tone}`}>{view.statusLabel}</span>}
        >
          <div className="license-panel">
            <LicenseTable
              rows={[
                { label: "Demo Başlangıcı", value: formatTrDate(view.startsAt) },
                { label: "Demo Bitişi", value: formatTrDate(view.expiresAt) },
                { label: "Kalan Süre", value: duration },
                { label: "Kalan Kredi", value: creditCell },
              ]}
            />
            <div className="license-stack">
              {view.expiresAt ? (
                <ProgressBlock
                  label="Demo Süresi"
                  value={view.timeEnded ? "Süre doldu" : `${view.daysLeft} gün kaldı`}
                  percent={view.timePercent}
                  tone={view.tone}
                />
              ) : null}
              <ProgressBlock
                label="Demo Kredisi"
                value={`${view.creditsRemaining} kredi kaldı`}
                percent={view.creditPercent}
                tone={view.tone}
              />
              {view.notice ? (
                <div className={`license-note is-${view.tone}`}>
                  <p>{view.notice}</p>
                  {view.detail ? <p>{view.detail}</p> : null}
                </div>
              ) : null}
            </div>
            <div className="license-actions">
              <button
                type="button"
                className={view.tone === "ended" || view.tone === "critical" ? "btn-primary license-cta is-strong" : "btn-primary license-cta"}
                onClick={sales.trigger}
              >
                {view.cta}
              </button>
            </div>
          </div>
        </AccountCard>
        {sales.modal}
      </>
    );
  }

  if (view.kind === "admin") {
    return (
      <AccountCard
        padded={false}
        title="Yönetici erişimi"
        actions={<span className={`license-status is-${view.tone}`}>{view.statusLabel}</span>}
      >
        <div className="license-panel">
          <LicenseTable
            rows={[
              { label: "Başlangıç Tarihi", value: formatTrDate(view.startsAt) },
              { label: "Bitiş Tarihi", value: formatTrDate(view.expiresAt) },
              { label: "Kalan Süre", value: view.expiresAt ? (view.expired ? "0 gün" : `${view.daysLeft} gün`) : "—" },
              { label: "Erişim", value: "Yönetici" },
            ]}
          />
          {view.expiresAt ? (
            <div className="license-stack">
              <ProgressBlock
                label="Kayıtlı süre"
                value={view.expired ? "0 gün kaldı" : `${view.daysLeft} gün kaldı`}
                percent={view.timePercent}
                tone={view.tone}
              />
              {view.notice ? (
                <div className={`license-note is-${view.tone}`}>
                  <p>{view.notice}</p>
                </div>
              ) : null}
            </div>
          ) : view.notice ? (
            <div className="license-stack">
              <div className={`license-note is-${view.tone}`}>
                <p>{view.notice}</p>
              </div>
            </div>
          ) : null}
        </div>
      </AccountCard>
    );
  }

  return (
    <>
      <AccountCard
        padded={false}
        title={view.plan}
        actions={<span className={`license-status is-${view.tone}`}>{view.statusLabel}</span>}
      >
        <div className="license-panel">
          <LicenseTable
            rows={[
              { label: "Başlangıç Tarihi", value: formatTrDate(view.startsAt) },
              { label: "Bitiş Tarihi", value: formatTrDate(view.expiresAt) },
              { label: "Kalan Süre", value: view.expired ? "0 gün" : `${view.daysLeft} gün` },
              { label: "Kullanım Hakkı", value: view.usageRight },
            ]}
          />
          <div className="license-stack">
            <ProgressBlock
              label="Abonelik Süresi"
              value={view.expired ? "0 gün kaldı" : `${view.daysLeft} gün kaldı`}
              percent={view.timePercent}
              tone={view.tone}
            />
            {view.notice ? (
              <div className={`license-note is-${view.tone}`}>
                <p>{view.notice}</p>
              </div>
            ) : null}
          </div>
          <div className="license-actions">
            <button
              type="button"
              className={view.tone === "ended" ? "btn-primary license-cta is-strong" : "btn-primary license-cta"}
              onClick={sales.trigger}
            >
              {view.cta}
            </button>
          </div>
        </div>
      </AccountCard>
      {sales.modal}
    </>
  );
}
