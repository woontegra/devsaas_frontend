import axios, { type AxiosInstance } from "axios";

const baseURL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "http://localhost:3000" : "");

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {}

export interface AuthResponse {
  user: { id: string; email: string };
  token: string;
}

export interface ActuarialInputPayload {
  birthDate: string;
  accidentDate: string;
  gender: "male" | "female";
  monthlyIncome: number;
  disabilityRate: number;
  interestRate: number;
  wageIncreaseRate: number;
}

export interface YearlyActuarialTableRowPayload {
  year: number;
  age: number;
  lx: number;
  survivalProbability: number;
  income: number;
  increasedIncome: number;
  discountFactor: number;
  presentValue: number;
  supportShare: number;
  faultAdjustedValue: number;
  cumulativePSD: number;
}

export interface ActuarialResultPayload {
  ageAtAccident: number;
  activePeriodYears: number;
  passivePeriodYears: number;
  monthlyPension: number;
  discountFactor: number;
  presentCapitalValue: number;
  breakdown: { activePeriodPV: number; passivePeriodPV: number };
  metadata: {
    interestRate: number;
    wageIncreaseRate: number;
    disabilityRate: number;
    calculatedAt: string;
  };
  yearlyActuarialTable?: YearlyActuarialTableRowPayload[];
  sgkPSD?: number;
  sgkYearlyTable?: SGKPSDYearlyRowPayload[];
  temporaryDisabilityAmount?: number;
  permanentDisabilityAmount?: number;
  caregiverCostAmount?: number;
  totalCompensation?: number;
}

export interface CalculateResponse {
  result: ActuarialResultPayload;
}

export type ValidationSeverity = "info" | "warning" | "error";

export interface ValidationResultPayload {
  ruleId: string;
  severity: ValidationSeverity;
  message: string;
  field?: string;
}

export interface ValidateResponse {
  validation: ValidationResultPayload[];
  reportText: string;
}

export function validate(
  input: ActuarialInputPayload,
  result: ActuarialResultPayload,
  supportShares?: number[]
): Promise<ValidateResponse> {
  return api
    .post<ValidateResponse>("/validate", { input, result, supportShares })
    .then((r) => r.data);
}

export interface SaveCasePayload {
  inputJson: ActuarialInputPayload;
  resultJson: ActuarialResultPayload;
}

export interface CaseItem {
  id: string;
  inputJson: unknown;
  resultJson: unknown;
  createdAt: string;
}

export interface CasesResponse {
  cases: CaseItem[];
}

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return api.post<AuthResponse>("/auth/login", payload).then((r) => r.data);
}

export function register(payload: RegisterPayload): Promise<AuthResponse> {
  return api.post<AuthResponse>("/auth/register", payload).then((r) => r.data);
}

export function calculate(input: ActuarialInputPayload): Promise<CalculateResponse> {
  return api.post<CalculateResponse>("/calculate", input).then((r) => r.data);
}

/** SGK PSD yıllık satır */
export interface SGKPSDYearlyRowPayload {
  year: number;
  age: number;
  income: number;
  discountFactor: number;
  survivalProbability: number;
  presentValue: number;
}

/** Hesap türüne göre motor (TRAFFIC_DEATH, TRAFFIC_INJURY, WORK_DEATH, WORK_INJURY) */
export interface CalculationResultPayload {
  totalPSD: number;
  yearlyTable: {
    rows: YearlyActuarialTableRowPayload[];
    totalPSD: number;
  };
  activePeriodYears?: number;
  passivePeriodYears?: number;
  sgkPSD?: number;
  sgkYearlyTable?: SGKPSDYearlyRowPayload[];
  /** İş kazası yaralanma: geçici iş göremezlik zararı */
  temporaryDisabilityAmount?: number;
  /** İş kazası yaralanma: sürekli iş göremezlik */
  permanentDisabilityAmount?: number;
  /** İş kazası yaralanma: bakıcı gideri PSD */
  caregiverCostAmount?: number;
  /** İş kazası yaralanma: toplam tazminat */
  totalCompensation?: number;
}

export interface RunCalculationResponse {
  result: CalculationResultPayload;
}

export function runCalculation(
  type: string,
  params: Record<string, unknown>
): Promise<RunCalculationResponse> {
  return api
    .post<RunCalculationResponse>("/calculations/run", { type, params })
    .then((r) => r.data);
}

/** CalculationResultPayload → ActuarialResultPayload (mevcut UI ile uyum) */
export function mapCalculationResultToPayload(
  calc: CalculationResultPayload,
  metadata: { interestRate: number; wageIncreaseRate: number; disabilityRate: number }
): ActuarialResultPayload {
  const activePV = calc.yearlyTable.rows
    .filter((_, i) => (calc.activePeriodYears ?? 0) > i)
    .reduce((s, r) => s + r.faultAdjustedValue, 0);
  const passivePV = calc.totalPSD - activePV;
  return {
    ageAtAccident: calc.yearlyTable.rows[0]?.age ?? 0,
    activePeriodYears: calc.activePeriodYears ?? 0,
    passivePeriodYears: calc.passivePeriodYears ?? 0,
    monthlyPension: 0,
    discountFactor: 0,
    presentCapitalValue: calc.totalCompensation ?? calc.totalPSD,
    breakdown: { activePeriodPV: activePV, passivePeriodPV: passivePV },
    metadata: {
      ...metadata,
      calculatedAt: new Date().toISOString(),
    },
    yearlyActuarialTable: calc.yearlyTable.rows,
    sgkPSD: calc.sgkPSD,
    sgkYearlyTable: calc.sgkYearlyTable,
    temporaryDisabilityAmount: calc.temporaryDisabilityAmount,
    permanentDisabilityAmount: calc.permanentDisabilityAmount,
    caregiverCostAmount: calc.caregiverCostAmount,
    totalCompensation: calc.totalCompensation,
  };
}

export function saveCase(payload: SaveCasePayload): Promise<{ id: string; createdAt: string }> {
  return api.post("/cases/save", payload).then((r) => r.data);
}

export function getCases(): Promise<CasesResponse> {
  return api.get<CasesResponse>("/cases").then((r) => r.data);
}

export function downloadReport(resultJson: ActuarialResultPayload): Promise<Blob> {
  return api
    .post("/report", { resultJson }, { responseType: "blob" })
    .then((r) => r.data as Blob);
}

export interface ExpertReportCaseInfo {
  mahkemeAdi?: string;
  mahkemeEsasNo?: string;
  davaci?: string;
  davali?: string;
  bilirkiyi?: string;
  meslek?: string;
  olayTarihi?: string;
  kazaTuru?: string;
}

export function downloadExpertReport(payload: {
  result: ActuarialResultPayload;
  caseInfo?: ExpertReportCaseInfo;
  calculationType?: string;
}): Promise<Blob> {
  return api
    .post("/report/expert", payload, { responseType: "blob" })
    .then((r) => r.data as Blob);
}
