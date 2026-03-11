/**
 * Trafik Kazası Yaralanma wizard form state.
 * Tek obje: formData.
 */

export type TrafficInjuryGender = "male" | "female";

export type WorkingStatus = "yes" | "no";

/** Eğitim düzeyi (educationLevel) — Öğrenci dropdown */
export const EDUCATION_LEVEL_OPTIONS = [
  { value: "", label: "Seçiniz" },
  { value: "0-4-okul-oncesi", label: "0-4 yaş okul öncesi" },
  { value: "4-6-okul-oncesi", label: "4-6 yaş okul öncesi eğitim" },
  { value: "ilkokul", label: "İlkokul" },
  { value: "ortaokul", label: "Ortaokul" },
  { value: "lise", label: "Lise" },
  { value: "on-lisans", label: "Ön lisans" },
  { value: "universite", label: "Üniversite" },
] as const;

/** educationLevel seçildikten sonra sınıf seçenekleri (1-4, 5-8, 9-12, 1-2, 1-6) + Lise/Ön lisans/Üniversite için "Mezun" */
const CLASS_ILKOKUL = ["1", "2", "3", "4"].map((n) => ({ value: n, label: n }));
const CLASS_ORTAOKUL = ["5", "6", "7", "8"].map((n) => ({ value: n, label: n }));
const CLASS_LISE = ["9", "10", "11", "12"].map((n) => ({ value: n, label: n }));
const CLASS_ON_LISANS = ["1", "2"].map((n) => ({ value: n, label: n }));
const CLASS_UNIVERSITE = ["1", "2", "3", "4", "5", "6"].map((n) => ({ value: n, label: n }));
const MEZUN_OPTION = { value: "mezun", label: "Mezun" };

export const EDUCATION_CLASS_BY_LEVEL: Record<string, { value: string; label: string }[]> = {
  ilkokul: CLASS_ILKOKUL,
  ortaokul: CLASS_ORTAOKUL,
  lise: [...CLASS_LISE, MEZUN_OPTION],
  "on-lisans": [...CLASS_ON_LISANS, MEZUN_OPTION],
  universite: [...CLASS_UNIVERSITE, MEZUN_OPTION],
};

export const LEVELS_WITH_CLASS = ["ilkokul", "ortaokul", "lise", "on-lisans", "universite"];

/** Eğitim potansiyeli */
export const EDUCATION_POTENTIAL_OPTIONS = [
  { value: "", label: "Seçiniz" },
  { value: "mevcut-egitimde-kalir", label: "Mevcut eğitimde kalır" },
  { value: "lise-mezunu", label: "Lise mezunu olur" },
  { value: "universite-okuyabilir", label: "Üniversite okuyabilir" },
  { value: "yuksek-lisans-potansiyeli", label: "Yüksek lisans potansiyeli" },
] as const;

/** @deprecated use EDUCATION_LEVEL_OPTIONS */
export const STUDENT_OPTIONS = EDUCATION_LEVEL_OPTIONS.filter((o) => o.value !== "").map(
  (o) => ({ value: o.value, label: o.label } as const)
);

/** @deprecated use educationClass */
export const EDUCATION_DURATION_OPTIONS = [
  { value: "2", label: "2 yıl" },
  { value: "3", label: "3 yıl" },
  { value: "4", label: "4 yıl" },
  { value: "5", label: "5 yıl" },
  { value: "6", label: "6 yıl" },
] as const;

export interface DefendantRow {
  name: string;
  faultRate: number;
}

export interface DateRangeRow {
  startDate: string;
  endDate: string;
}

export interface HospitalBillRow {
  date: string;
  amount: number;
}

export interface CaregiverExpenseRow {
  startDate: string;
  endDate: string;
  amount: number;
}

export interface OtherExpenseRow {
  name: string;
  date: string;
  amount: number;
}

/** Emsal ücret satırı: kullanıcının verdiği isim + tutar */
export interface EmsalUcretRow {
  name: string;
  amount: number;
}

/** Diğer ücret satırı: tutar + ortalamaya dahil mi */
export interface DigerUcretRow {
  value: number;
  secili: boolean;
}

export interface TrafficInjuryFormData {
  birthDate: string;
  eventDate: string;
  eventAge: number;
  calculationDate: string;
  gender: TrafficInjuryGender;
  lifeExpectancy: number;
  lifeEndDate: string;
  passiveStart: string;
  /** Pasif dönem başlangıç tarihi (YYYY-MM-DD); birthDate + passiveStartAge ile türetilir */
  passiveStartDate: string;
  /** Pasif başlangıç yaşı; kullanıcı bu alanı değiştirir (0–99), tarih buna göre hesaplanır */
  passiveStartAge: number | null;
  /** Kullanıcı pasif başlangıç yaşını manuel değiştirdiyse true */
  isPassiveAgeManuallyEdited: boolean;
  workingStatus: WorkingStatus;
  /** Emsal ücret listesi (isim + tutar); ortalama gelir hesaplanır */
  emsalUcretList: EmsalUcretRow[];
  /** Hesaplanan/atanan gelir (TL); Hayır → asgari ücret, Evet → emsal ortalaması */
  gelir: number;
  incomeType: string;
  /** Ücret paneli: Asgari ücret ortalamaya dahil mi */
  asgariSecili: boolean;
  /** Bordro tutarı (TL) */
  bordro: number;
  bordroSecili: boolean;
  /** TÜİK ücreti (referans) */
  tuikUcret: number;
  tuikSecili: boolean;
  /** Odalardan gelen brüt ücret */
  odalarBrut: number;
  odalarNet: number;
  odalarSecili: boolean;
  /** Tanık 1..7 tutarları */
  taniklar: number[];
  tanikSecili: boolean;
  /** Diğer ücretler (value + secili) */
  digerUcretler: DigerUcretRow[];
  studentStatus: string;
  educationDuration: string;
  educationLevel: string;
  educationClass: string;
  educationPotential: string;
  graduationWaitYears: string;
  plaintiffFaultRate: number;
  defendants: DefendantRow[];
  maluliyetOrani: number;
  disabilityPeriods: DateRangeRow[];
  treatmentPeriods: DateRangeRow[];
  caregiverPeriods: DateRangeRow[];
  hospitalBills: HospitalBillRow[];
  caregiverExpenses: CaregiverExpenseRow[];
  otherExpenses: OtherExpenseRow[];
}

const today = () => new Date().toISOString().slice(0, 10);

export const defaultTrafficInjuryFormData: TrafficInjuryFormData = {
  birthDate: "",
  eventDate: "",
  eventAge: 0,
  calculationDate: today(),
  gender: "male",
  lifeExpectancy: 0,
  lifeEndDate: "",
  passiveStart: "",
  passiveStartDate: "",
  passiveStartAge: null,
  isPassiveAgeManuallyEdited: false,
  workingStatus: "yes",
  emsalUcretList: [],
  gelir: 0,
  incomeType: "",
  asgariSecili: true,
  bordro: 0,
  bordroSecili: false,
  tuikUcret: 0,
  tuikSecili: false,
  odalarBrut: 0,
  odalarNet: 0,
  odalarSecili: false,
  taniklar: [0, 0, 0, 0, 0, 0, 0],
  tanikSecili: false,
  digerUcretler: [],
  studentStatus: "",
  educationDuration: "",
  educationLevel: "",
  educationClass: "",
  educationPotential: "",
  graduationWaitYears: "",
  plaintiffFaultRate: 0,
  defendants: [],
  maluliyetOrani: 0,
  disabilityPeriods: [],
  treatmentPeriods: [],
  caregiverPeriods: [],
  hospitalBills: [],
  caregiverExpenses: [],
  otherExpenses: [],
};
