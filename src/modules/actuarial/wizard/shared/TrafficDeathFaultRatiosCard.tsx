import type { TrafficDeathResponsibleType } from "../../types/calculationDraft";
import { TRAFFIC_RESPONSIBLE_OPTIONS } from "./DefendantTypeToggleList";
import { FormSection, TextInput } from "./FormPrimitives";

type RowTone = "deceased" | "party" | "external";

function FaultPercentInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-1.5 w-full sm:w-[132px] shrink-0">
      <div className="w-[100px]">
        <TextInput
          type="number"
          min={0}
          max={100}
          inputMode="decimal"
          aria-label={`${label} kusur oranı`}
          disabled={disabled}
          value={disabled ? 0 : value}
          onChange={(e) => onChange?.(Number(e.target.value))}
          style={{ textAlign: "right" }}
        />
      </div>
      <span className="w-4 text-[13px] font-medium text-brand-muted tabular-nums">%</span>
    </div>
  );
}

function SelectionMark({ selected }: { selected: boolean }) {
  return (
    <span
      className={`h-[18px] w-[18px] shrink-0 rounded-[5px] border flex items-center justify-center text-[10px] leading-none transition-colors duration-150 ${
        selected
          ? "border-brand-primary bg-brand-primary text-white"
          : "border-brand-border bg-white text-transparent"
      }`}
      aria-hidden
    >
      ✓
    </span>
  );
}

function FaultPartyRow({
  title,
  description,
  value,
  onChange,
  error,
  selectable,
  selected,
  onToggle,
  inputDisabled,
  tone,
}: {
  title: string;
  description?: string;
  value: number;
  onChange?: (value: number) => void;
  error?: string;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: () => void;
  inputDisabled?: boolean;
  tone: RowTone;
}) {
  const isSelectedParty = Boolean(selectable && selected);
  const surface =
    tone === "deceased"
      ? "bg-brand-primary-soft/70 border-brand-border"
      : isSelectedParty
        ? "bg-brand-primary-soft/55 border-brand-primary/35"
        : "bg-white border-brand-border";

  return (
    <div
      className={`relative overflow-hidden rounded-[13px] border px-3.5 py-3 sm:px-4 transition-all duration-150 hover:shadow-sm hover:border-brand-primary/25 focus-within:border-brand-primary/40 focus-within:shadow-sm ${surface}`}
    >
      {tone === "deceased" && (
        <span
          className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full bg-brand-primary"
          aria-hidden
        />
      )}
      <div className={`flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 ${tone === "deceased" ? "sm:pl-1" : ""}`}>
        <div className="flex-1 min-w-0 flex items-center gap-3">
          {selectable && (
            <button
              type="button"
              onClick={onToggle}
              className="shrink-0 flex items-center justify-center"
              aria-pressed={selected}
              aria-label={`${title} seç`}
            >
              <SelectionMark selected={Boolean(selected)} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            {selectable ? (
              <button type="button" onClick={onToggle} className="text-left w-full min-w-0">
                <p className="text-[13.5px] font-semibold text-brand-text tracking-[-0.01em] leading-snug">
                  {title}
                </p>
                {description && (
                  <p className="text-[12px] font-normal text-brand-muted mt-0.5 leading-snug">
                    {description}
                  </p>
                )}
              </button>
            ) : (
              <>
                <p className="text-[13.5px] font-semibold text-brand-text tracking-[-0.01em] leading-snug">
                  {title}
                </p>
                {description && (
                  <p className="text-[12px] font-normal text-brand-muted mt-0.5 leading-snug">
                    {description}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
        <FaultPercentInput
          label={title}
          value={value}
          onChange={onChange}
          disabled={inputDisabled}
        />
      </div>
      {error && <p className="text-[12px] text-red-600 mt-1.5 sm:pl-[30px]">{error}</p>}
    </div>
  );
}

export function TrafficDeathFaultRatiosCard({
  deceasedFaultRate,
  onDeceasedFaultChange,
  deceasedError,
  selectedTypes,
  faultByType,
  onToggleType,
  onPartyFaultChange,
  partyErrors,
  externalFault,
  onExternalFaultChange,
  externalError,
  totalFault,
}: {
  deceasedFaultRate: number;
  onDeceasedFaultChange: (value: number) => void;
  deceasedError?: string;
  selectedTypes: ReadonlySet<TrafficDeathResponsibleType>;
  faultByType: Partial<Record<TrafficDeathResponsibleType, number>>;
  onToggleType: (type: TrafficDeathResponsibleType) => void;
  onPartyFaultChange: (type: TrafficDeathResponsibleType, value: number) => void;
  partyErrors: Partial<Record<TrafficDeathResponsibleType, string>>;
  externalFault: number;
  onExternalFaultChange: (value: number) => void;
  externalError?: string;
  totalFault: number;
}) {
  const faultWarn = Math.abs(totalFault - 100) > 0.001;

  return (
    <FormSection title="Kusur Oranları">
      <div className="space-y-2">
        <FaultPartyRow
          tone="deceased"
          title="Müteveffa"
          value={deceasedFaultRate}
          onChange={onDeceasedFaultChange}
          error={deceasedError}
        />

        {TRAFFIC_RESPONSIBLE_OPTIONS.map((opt) => {
          const type = opt.type as TrafficDeathResponsibleType;
          const selected = selectedTypes.has(type);
          return (
            <FaultPartyRow
              key={opt.type}
              tone="party"
              title={opt.title}
              description={opt.description}
              value={faultByType[type] ?? 0}
              onChange={(value) => onPartyFaultChange(type, value)}
              error={selected ? partyErrors[type] : undefined}
              selectable
              selected={selected}
              onToggle={() => onToggleType(type)}
              inputDisabled={!selected}
            />
          );
        })}

        <FaultPartyRow
          tone="external"
          title="Dava Dışı Kusur"
          value={externalFault}
          onChange={onExternalFaultChange}
          error={externalError}
        />

        <div className="rounded-[13px] border border-brand-border bg-brand-primary-soft/50 px-3.5 py-2.5 sm:px-4 flex items-center justify-between gap-3 mt-1">
          <p className="text-[13px] font-semibold text-brand-text">Toplam Kusur</p>
          <p className="text-[13px] tabular-nums text-brand-text">
            <span className="font-semibold">%{totalFault.toFixed(0)}</span>
            <span className="text-brand-muted font-medium"> / %100</span>
          </p>
        </div>

        {faultWarn && (
          <div className="accent-warning-surface flex items-start gap-2 px-3 py-2 text-[12.5px] font-normal leading-snug">
            <svg
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-accent"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
            <p>
              Kusur oranları toplamı %{totalFault.toFixed(0)}. Toplam %100 olmalıdır (otomatik
              düzeltilmez).
            </p>
          </div>
        )}
      </div>
    </FormSection>
  );
}
