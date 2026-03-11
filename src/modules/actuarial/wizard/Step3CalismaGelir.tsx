import { useEffect, useMemo, useState } from "react";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { formTypography } from "../../../styles/formTypography";
import {
  getNetAsgariUcretForDate,
  KASIM_2014_ASGARI_UCRET_NET,
  bruttenNeteCevir,
} from "../../../data/asgariUcret";
import {
  type TrafficInjuryFormData,
  type WorkingStatus,
  EDUCATION_LEVEL_OPTIONS,
  EDUCATION_CLASS_BY_LEVEL,
  EDUCATION_POTENTIAL_OPTIONS,
  LEVELS_WITH_CLASS,
} from "../types/trafficInjuryFormTypes";

const showEducationClass = (level: string) =>
  LEVELS_WITH_CLASS.includes(level);

function formatGelir(value: number): string {
  if (value <= 0) return "";
  return new Intl.NumberFormat("tr-TR").format(value);
}

const CARD_CLASS =
  "bg-white dark:bg-ds-bg rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-none border border-gray-100 dark:border-ds-border p-5";
const INNER_CARD =
  "rounded-lg border border-gray-100 dark:border-ds-border bg-gray-50/50 dark:bg-ds-input/30 p-3 mt-1";
const inputClass =
  formTypography.input +
  " " +
  formTypography.inputHeight +
  " rounded-md border border-gray-200 dark:border-ds-border px-2.5 bg-white dark:bg-ds-input text-gray-800 dark:text-ds-text min-w-0 w-full";
const readonlyClass = formTypography.readonly + " min-w-0 flex-1";
const BTN_PRIMARY = "text-[13px] font-medium text-white rounded-lg px-3 py-1.5 transition hover:opacity-90";
const PRIMARY_COLOR = "#2f5bea";

export interface Step3CalismaGelirProps {
  formData: TrafficInjuryFormData;
  onChange: (data: Partial<TrafficInjuryFormData>) => void;
}

export function Step3CalismaGelir({ formData, onChange }: Step3CalismaGelirProps) {
  const [gelirKaynaklariOpen, setGelirKaynaklariOpen] = useState(true);
  const level = formData.educationLevel ?? formData.studentStatus ?? "";
  const showClass = showEducationClass(level);
  const isWorking = formData.workingStatus === "yes";
  const eventAsgari = useMemo(
    () => getNetAsgariUcretForDate(formData.eventDate),
    [formData.eventDate]
  );

  const tuikKatsayi = useMemo(() => {
    if (KASIM_2014_ASGARI_UCRET_NET <= 0 || !formData.tuikUcret) return 0;
    return Math.round((formData.tuikUcret / KASIM_2014_ASGARI_UCRET_NET) * 1e6) / 1e6;
  }, [formData.tuikUcret]);

  const tuikSonuc = useMemo(() => {
    if (tuikKatsayi <= 0 || eventAsgari <= 0) return 0;
    return Math.round(tuikKatsayi * eventAsgari * 100) / 100;
  }, [tuikKatsayi, eventAsgari]);

  const taniklarSafe = useMemo(
    () => Array.from({ length: 7 }, (_, i) => formData.taniklar?.[i] ?? 0),
    [formData.taniklar]
  );
  const tanikOrtalama = useMemo(() => {
    const valid = taniklarSafe.filter((n) => n > 0);
    if (valid.length === 0) return 0;
    return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 100) / 100;
  }, [taniklarSafe]);

  const seciliDegerler = useMemo(() => {
    const list: number[] = [];
    if (formData.asgariSecili && eventAsgari > 0) list.push(eventAsgari);
    if (formData.bordroSecili && formData.bordro > 0) list.push(formData.bordro);
    if (formData.tuikSecili && tuikSonuc > 0) list.push(tuikSonuc);
    if (formData.odalarSecili && formData.odalarNet > 0) list.push(formData.odalarNet);
    if (formData.tanikSecili && tanikOrtalama > 0) list.push(tanikOrtalama);
    (formData.digerUcretler ?? []).forEach((r) => {
      if (r.secili && r.value > 0) list.push(r.value);
    });
    return list;
  }, [
    formData.asgariSecili,
    formData.bordroSecili,
    formData.bordro,
    formData.tuikSecili,
    formData.odalarSecili,
    formData.odalarNet,
    formData.tanikSecili,
    formData.digerUcretler,
    eventAsgari,
    tuikSonuc,
    tanikOrtalama,
  ]);

  const emsalUcret = useMemo(() => {
    if (seciliDegerler.length === 0) return 0;
    const sum = seciliDegerler.reduce((a, b) => a + b, 0);
    return Math.round((sum / seciliDegerler.length) * 100) / 100;
  }, [seciliDegerler]);

  const kullanilanVerilerHiyerarsi = useMemo(
    () =>
      isWorking
        ? [
            { label: "Asgari Ücret", value: eventAsgari, secili: formData.asgariSecili, indent: false },
            { label: "Bordro", value: formData.bordro ?? 0, secili: formData.bordroSecili, indent: false },
            { label: "TÜİK", value: tuikSonuc, secili: formData.tuikSecili, indent: false },
            { label: "2014 Kasım Asgari Ücret", value: KASIM_2014_ASGARI_UCRET_NET, secili: false, indent: true },
            { label: "Katsayı", value: tuikKatsayi, secili: false, indent: true, formatNum: true },
            { label: "Hesaplanan Ücret", value: tuikSonuc, secili: formData.tuikSecili, indent: true },
            { label: "Oda Ücreti", value: formData.odalarNet ?? 0, secili: formData.odalarSecili, indent: false },
            { label: "Brüt", value: formData.odalarBrut ?? 0, secili: false, indent: true },
            { label: "Net", value: formData.odalarNet ?? 0, secili: false, indent: true },
            { label: "Ortalama", value: tanikOrtalama, secili: formData.tanikSecili, indent: true },
            ...(formData.digerUcretler ?? []).map((r, i) => ({
              label: `Diğer ${i + 1}`,
              value: r.value,
              secili: r.secili,
              indent: false as boolean,
            })),
          ]
        : [{ label: "Asgari Ücret", value: eventAsgari, secili: true, indent: false }],
    [
      isWorking,
      eventAsgari,
      formData.asgariSecili,
      formData.bordro,
      formData.bordroSecili,
      formData.tuikSecili,
      tuikSonuc,
      tuikKatsayi,
      formData.odalarSecili,
      formData.odalarNet,
      formData.odalarBrut,
      formData.tanikSecili,
      tanikOrtalama,
      formData.digerUcretler,
    ]
  );

  useEffect(() => {
    if (!isWorking && formData.eventDate) {
      onChange({ gelir: eventAsgari });
    }
  }, [isWorking, formData.eventDate, eventAsgari]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isWorking && emsalUcret >= 0) {
      onChange({ gelir: emsalUcret });
    }
  }, [isWorking, emsalUcret]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTanikChange = (index: number, value: number) => {
    const next = [...taniklarSafe];
    next[index] = value;
    onChange({ taniklar: next });
  };

  const addDiger = () => {
    const next = [...(formData.digerUcretler ?? []), { value: 0, secili: false }];
    onChange({ digerUcretler: next });
  };

  const setDigerAt = (index: number, field: "value" | "secili", val: number | boolean) => {
    const next = [...(formData.digerUcretler ?? [])];
    next[index] = { ...next[index]!, [field]: val };
    onChange({ digerUcretler: next });
  };

  const removeDiger = (index: number) => {
    const next = (formData.digerUcretler ?? []).filter((_, i) => i !== index);
    onChange({ digerUcretler: next });
  };

  const handleBruttenNete = () => {
    const net = bruttenNeteCevir(formData.odalarBrut);
    onChange({ odalarNet: net });
  };

  const rowClass = "grid grid-cols-[auto_1fr_auto] gap-2 items-center min-h-9";

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 min-[900px]:grid-cols-2 min-[1200px]:grid-cols-[2fr_1.75fr_1.25fr] gap-6">
        {/* SOL PANEL - Veri Girişi */}
        <div className="space-y-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-ds-text uppercase tracking-wide">
            Veri Girişi
          </h3>
          <div className={CARD_CLASS + " space-y-4"}>
            <div className="flex flex-col gap-1.5">
              <label className={formTypography.label}>Çalışıyor mu?</label>
              <div className="flex items-center gap-6 min-h-9">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="workingStatus"
                    value="yes"
                    checked={formData.workingStatus === "yes"}
                    onChange={() =>
                      onChange({
                        workingStatus: "yes" as WorkingStatus,
                        gelir: 0,
                        emsalUcretList: [],
                      })
                    }
                    className="w-3.5 h-3.5 border-gray-300 focus:ring-[#2f5bea]"
                    style={{ accentColor: PRIMARY_COLOR }}
                  />
                  <span className="text-gray-800 dark:text-ds-text text-[13px]">Evet</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="workingStatus"
                    value="no"
                    checked={formData.workingStatus === "no"}
                    onChange={() => onChange({ workingStatus: "no" as WorkingStatus })}
                    className="w-3.5 h-3.5 border-gray-300 focus:ring-[#2f5bea]"
                    style={{ accentColor: PRIMARY_COLOR }}
                  />
                  <span className="text-gray-800 dark:text-ds-text text-[13px]">Hayır</span>
                </label>
              </div>
            </div>
            {!isWorking && (
              <div className="flex flex-col gap-1.5">
                <label className={formTypography.label}>Gelir (Net Asgari Ücret)</label>
                <input type="text" readOnly value={formatGelir(eventAsgari) || "—"} className={readonlyClass} />
              </div>
            )}
          </div>

          {isWorking && (
            <div className={CARD_CLASS + " space-y-4"}>
              <button
                type="button"
                onClick={() => setGelirKaynaklariOpen((o) => !o)}
                className="w-full flex items-center justify-between text-left text-xs font-semibold text-gray-700 dark:text-ds-text uppercase tracking-wide py-1"
              >
                <span>Gelir Kaynakları</span>
                <svg
                  className={`w-4 h-4 transition-transform ${gelirKaynaklariOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              {gelirKaynaklariOpen && (
                <div className="space-y-4">
              {/* 1 Asgari Ücret */}
              <div className={rowClass}>
                <input
                  type="checkbox"
                  checked={formData.asgariSecili}
                  onChange={(e) => onChange({ asgariSecili: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                  style={{ accentColor: PRIMARY_COLOR }}
                />
                <label className={formTypography.label}>Asgari Ücret</label>
                <input type="text" readOnly value={formatGelir(eventAsgari) || "—"} className={readonlyClass + " max-w-[120px]"} />
              </div>
              {/* 2 Bordro */}
              <div className={rowClass}>
                <input
                  type="checkbox"
                  checked={formData.bordroSecili}
                  onChange={(e) => onChange({ bordroSecili: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                  style={{ accentColor: PRIMARY_COLOR }}
                />
                <label className={formTypography.label}>Bordro</label>
                <div className="flex items-center gap-1.5 max-w-[140px]">
                  <input
                    type="number"
                    min={0}
                    value={formData.bordro || ""}
                    onChange={(e) => onChange({ bordro: parseFloat(e.target.value) || 0 })}
                    className={inputClass + " max-w-[100px]"}
                    placeholder="0"
                  />
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>
              {/* 3 TÜİK Hesabı */}
              <div className="space-y-2">
                <div className={rowClass}>
                  <input
                    type="checkbox"
                    checked={formData.tuikSecili}
                    onChange={(e) => onChange({ tuikSecili: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                    style={{ accentColor: PRIMARY_COLOR }}
                  />
                  <label className={formTypography.label}>TÜİK Hesabı</label>
                  <span className="max-w-[120px]" />
                </div>
                <div className={INNER_CARD + " space-y-2"}>
                  <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                    <label className={formTypography.label}>TÜİK Ücreti</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.tuikUcret || ""}
                      onChange={(e) => onChange({ tuikUcret: parseFloat(e.target.value) || 0 })}
                      className={inputClass + " max-w-[120px]"}
                      placeholder="0"
                    />
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                    <label className={formTypography.label}>2014 Kasım Asgari Ücret</label>
                    <input type="text" readOnly value="891" className={readonlyClass + " max-w-[120px]"} />
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                    <label className={formTypography.label}>Katsayı</label>
                    <input
                      type="text"
                      readOnly
                      value={tuikKatsayi > 0 ? tuikKatsayi.toFixed(4) : ""}
                      className={readonlyClass + " max-w-[120px]"}
                    />
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                    <label className={formTypography.label}>Hesaplanan TÜİK Ücreti</label>
                    <input
                      type="text"
                      readOnly
                      value={tuikSonuc > 0 ? formatGelir(tuikSonuc) + " TL" : "—"}
                      className={readonlyClass + " max-w-[120px]"}
                      title="Katsayı × Olay tarihi asgari ücreti"
                    />
                  </div>
                </div>
              </div>
              {/* 4 Oda Ücreti */}
              <div className="space-y-2">
                <div className={rowClass}>
                  <input
                    type="checkbox"
                    checked={formData.odalarSecili}
                    onChange={(e) => onChange({ odalarSecili: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                    style={{ accentColor: PRIMARY_COLOR }}
                  />
                  <label className={formTypography.label}>Oda Ücreti</label>
                  <span className="max-w-[120px]" />
                </div>
                <div className={INNER_CARD + " space-y-2"}>
                  <div className="flex items-center gap-2">
                    <label className={formTypography.label + " w-16 shrink-0"}>Brüt</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.odalarBrut || ""}
                      onChange={(e) => onChange({ odalarBrut: parseFloat(e.target.value) || 0 })}
                      className={inputClass + " max-w-[100px]"}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className={formTypography.label + " w-16 shrink-0"}>Net</label>
                    <input
                      type="text"
                      readOnly
                      value={formatGelir(formData.odalarNet ?? 0)}
                      className={readonlyClass + " max-w-[100px]"}
                    />
                    <button
                      type="button"
                      onClick={handleBruttenNete}
                      className={BTN_PRIMARY + " shrink-0"}
                      style={{ backgroundColor: PRIMARY_COLOR }}
                    >
                      Brütten Nete Çevir
                    </button>
                  </div>
                </div>
              </div>
              {/* 5 Tanık Ücretleri */}
              <div className="space-y-2">
                <div className={rowClass}>
                  <input
                    type="checkbox"
                    checked={formData.tanikSecili}
                    onChange={(e) => onChange({ tanikSecili: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                    style={{ accentColor: PRIMARY_COLOR }}
                  />
                  <label className={formTypography.label}>Tanık Ücretleri</label>
                  <span className="max-w-[120px]" />
                </div>
                <div className="ml-6 grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <label className={formTypography.label + " shrink-0 w-14"}>Tanık {i + 1}</label>
                      <input
                        type="number"
                        min={0}
                        value={taniklarSafe[i] || ""}
                        onChange={(e) => handleTanikChange(i, parseFloat(e.target.value) || 0)}
                        className={inputClass}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 ml-6">
                  <label className={formTypography.label + " shrink-0"}>Tanık Ortalama</label>
                  <input type="text" readOnly value={formatGelir(tanikOrtalama)} className={readonlyClass + " max-w-[100px]"} />
                </div>
              </div>
              {/* 6 Diğer */}
              <div className="space-y-2">
                <div className={rowClass}>
                  <span className="w-4" />
                  <label className={formTypography.label}>Diğer</label>
                  <span className="max-w-[120px]" />
                </div>
                {(formData.digerUcretler ?? []).map((row, i) => (
                  <div key={i} className={rowClass + " ml-6"}>
                    <input
                      type="checkbox"
                      checked={row.secili}
                      onChange={(e) => setDigerAt(i, "secili", e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                      style={{ accentColor: PRIMARY_COLOR }}
                    />
                    <label className={formTypography.label}>Ücret</label>
                    <div className="flex items-center gap-1 max-w-[140px]">
                      <input
                        type="number"
                        min={0}
                        value={row.value || ""}
                        onChange={(e) => setDigerAt(i, "value", parseFloat(e.target.value) || 0)}
                        className={inputClass}
                        placeholder="0"
                      />
                      <button type="button" onClick={() => removeDiger(i)} className="text-[11px] text-red-600 hover:underline shrink-0">
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addDiger}
                  className="text-[12px] font-medium ml-6 hover:underline"
                  style={{ color: PRIMARY_COLOR }}
                >
                  + Ücret Ekle
                </button>
              </div>
                </div>
              )}
            </div>
          )}

          {/* Eğitim Düzeyi - sol panelde */}
          <div className={CARD_CLASS + " space-y-4"}>
            <Select
              label="Eğitim düzeyi"
              value={formData.educationLevel}
              onChange={(e) => {
                const v = e.target.value;
                onChange({
                  educationLevel: v,
                  studentStatus: v,
                  ...(showEducationClass(v) ? {} : { educationClass: "", graduationWaitYears: "" }),
                });
              }}
              options={EDUCATION_LEVEL_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
            {showClass && (
              <Select
                label="Sınıf / Yıl"
                value={formData.educationClass}
                onChange={(e) => {
                  const v = e.target.value;
                  onChange({
                    educationClass: v,
                    ...(v !== "mezun" ? { graduationWaitYears: "" } : {}),
                  });
                }}
                options={[{ value: "", label: "Seçiniz" }, ...(EDUCATION_CLASS_BY_LEVEL[level] ?? [])]}
              />
            )}
            {formData.educationClass === "mezun" && (
              <Input
                label="Mezuniyet Sonrası Bekleme Süresi (Yıl)"
                type="number"
                value={formData.graduationWaitYears ?? ""}
                onChange={(e) => onChange({ graduationWaitYears: e.target.value })}
                placeholder="Yıl"
              />
            )}
            <Select
              label="Eğitim potansiyeli"
              value={formData.educationPotential}
              onChange={(e) => onChange({ educationPotential: e.target.value })}
              options={EDUCATION_POTENTIAL_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
          </div>
        </div>

        {/* ORTA PANEL - Kullanılan Veriler */}
        <div className={CARD_CLASS + " min-h-[200px]"}>
          <h4 className="text-xs font-semibold text-gray-700 dark:text-ds-text uppercase tracking-wide mb-4">
            Kullanılan Veriler
          </h4>
          <div className="space-y-1">
            {kullanilanVerilerHiyerarsi.map((item, i) => (
              <div
                key={i}
                className={`flex justify-between items-center gap-2 py-1.5 border-b border-gray-100 dark:border-ds-border last:border-0 ${item.indent ? "pl-5" : ""}`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {!item.indent && (
                    <input
                      type="checkbox"
                      checked={item.secili}
                      readOnly
                      className="w-4 h-4 rounded border-gray-300 shrink-0"
                      style={{ accentColor: PRIMARY_COLOR }}
                    />
                  )}
                  {item.indent && <span className="w-4 shrink-0" />}
                  <span className={formTypography.label + " truncate"}>{item.label}</span>
                </div>
                <span className="text-[13px] font-medium tabular-nums text-gray-800 dark:text-ds-text shrink-0">
                  {item.formatNum
                    ? (typeof item.value === "number" && item.value > 0 ? item.value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—")
                    : (item.value > 0 ? formatGelir(item.value) : "—")}
                </span>
                <span className="w-5 h-5 shrink-0 flex items-center justify-center">
                  {item.secili ? (
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                  ) : (
                    <span className="text-gray-300 font-light text-sm">—</span>
                  )}
                </span>
              </div>
            ))}
            {isWorking && (
              <button
                type="button"
                onClick={addDiger}
                className="text-[12px] font-medium mt-2 hover:underline flex items-center gap-1"
                style={{ color: PRIMARY_COLOR }}
              >
                <span>+</span> Ücret Ekle
              </button>
            )}
            {kullanilanVerilerHiyerarsi.length === 0 && (
              <p className="text-[12px] text-gray-400">Seçili veri yok</p>
            )}
          </div>
        </div>

        {/* SAĞ PANEL - Emsal Ücret */}
        <div className={CARD_CLASS + " flex flex-col justify-center items-center text-center self-start py-6 px-8"}>
          <h4 className="text-[11px] font-semibold text-gray-500 dark:text-ds-muted uppercase tracking-wider mb-3">
            EMSAL ÜCRET
          </h4>
          <p
            className="text-[36px] font-bold tabular-nums"
            style={{ color: PRIMARY_COLOR }}
          >
            {formatGelir(emsalUcret) || "—"} TL
          </p>
        </div>
      </div>
    </div>
  );
}
