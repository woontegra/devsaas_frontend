import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from "recharts";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import type { ActuarialResultPayload } from "../../services/api";

export interface ResultCardProps {
  result: ActuarialResultPayload | null;
  onSave?: () => void;
  onDownloadReport?: () => void;
  saving?: boolean;
  downloading?: boolean;
}

const formatCurrency = (n: number) => n.toLocaleString("tr-TR");
const LIGHT_PRIMARY = "#1E3A8A";
const LIGHT_ACCENT = "#2563EB";
const BAR_COLORS = ["#1E3A8A", "#2563EB"];

export function ResultCard({
  result,
  onSave,
  onDownloadReport,
  saving = false,
  downloading = false,
}: ResultCardProps) {
  if (!result) return null;

  const barData = [
    { name: "Active period", value: result.breakdown.activePeriodPV, fill: BAR_COLORS[0] },
    { name: "Passive period", value: result.breakdown.passivePeriodPV, fill: BAR_COLORS[1] },
  ];

  const totalYears = result.activePeriodYears + result.passivePeriodYears;
  const areaData = Array.from({ length: Math.min(totalYears + 1, 40) }, (_, i) => {
    const year = i;
    if (year <= result.activePeriodYears) {
      const pct = result.activePeriodYears > 0 ? year / result.activePeriodYears : 0;
      return { year, value: result.breakdown.activePeriodPV * pct };
    }
    const passiveYear = year - result.activePeriodYears;
    const pct = result.passivePeriodYears > 0 ? passiveYear / result.passivePeriodYears : 0;
    return {
      year,
      value: result.breakdown.activePeriodPV + result.breakdown.passivePeriodPV * pct,
    };
  });

  const tooltipClass =
    "bg-white px-3 py-2.5 rounded-button shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-app-border text-[14px] text-gray-900";

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number; payload: { name: string } }[] }) => {
    if (!active || !payload?.[0]) return null;
    return (
      <div className={tooltipClass}>
        {payload[0].payload.name}: {formatCurrency(payload[0].value as number)}
      </div>
    );
  };

  const AreaTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload?: { year: number } }> }) => {
    if (!active || !payload?.[0]) return null;
    const p = payload[0];
    const year = p.payload?.year ?? 0;
    return (
      <div className={tooltipClass}>
        Yıl {year}: {formatCurrency(p.value)}
      </div>
    );
  };

  const tickStyle = { fontSize: 12, fill: "#64748B" };

  return (
    <div className="space-y-4 animate-fade-in">
      <Card variant="light">
        <div className="p-4 md:p-5 border-b border-app-border">
          <h3 className="text-[15px] font-semibold text-app-primary">Result</h3>
        </div>
        <div className="p-4 md:p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-input p-3 border border-app-border">
              <p className="text-[13px] text-gray-600 mb-0.5 uppercase tracking-wide">Present capital value</p>
              <p className="text-lg font-semibold text-emerald-600">
                {formatCurrency(result.presentCapitalValue)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-input p-3 border border-app-border">
              <p className="text-[13px] text-gray-600 mb-0.5 uppercase tracking-wide">Monthly pension</p>
              <p className="text-lg font-semibold text-app-primary">
                {formatCurrency(result.monthlyPension)}
              </p>
            </div>
          </div>
          <div className="space-y-2 text-[15px]">
            <div className="flex justify-between text-gray-900">
              <span className="text-gray-600">Age at accident</span>
              <span className="font-medium">{result.ageAtAccident.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-900">
              <span className="text-gray-600">Active period</span>
              <span className="font-medium">{result.activePeriodYears} years</span>
            </div>
            <div className="flex justify-between text-gray-900">
              <span className="text-gray-600">Passive period</span>
              <span className="font-medium">{result.passivePeriodYears} years</span>
            </div>
          </div>
          <div className="h-[180px] w-full bg-white rounded-input border border-app-border p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} />
                <YAxis tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={300}>
                  {barData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[180px] w-full bg-white rounded-input border border-app-border p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradientFillLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={LIGHT_ACCENT} stopOpacity={0.1} />
                    <stop offset="100%" stopColor={LIGHT_PRIMARY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" tick={tickStyle} axisLine={false} tickLine={false} />
                <YAxis tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip content={<AreaTooltip />} cursor={{ stroke: "rgba(37,99,235,0.3)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Area
                  type="natural"
                  dataKey="value"
                  stroke={LIGHT_PRIMARY}
                  strokeWidth={2}
                  fill="url(#areaGradientFillLight)"
                  isAnimationActive
                  animationDuration={300}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {(onSave || onDownloadReport) && (
            <div className="flex gap-2 pt-2">
              {onSave && (
                <Button variant="primary" onClick={onSave} disabled={saving}>
                  {saving ? "Saving…" : "Save case"}
                </Button>
              )}
              {onDownloadReport && (
                <Button variant="outline" onClick={onDownloadReport} disabled={downloading}>
                  {downloading ? "Preparing…" : "Download report"}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
