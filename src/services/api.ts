import axios, { type AxiosInstance, type AxiosError } from "axios";
import type {
  CalculationDraftInput,
  CalculationValidateResponse,
} from "../modules/actuarial/types/calculationDraft";
import type { CalculationRunResponse } from "../modules/actuarial/types/trafficInjuryResult";
import type { CalculationReviewSummaryResponse } from "../modules/actuarial/types/calculationReviewSummary";

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

export type ApiClientError = {
  status: number;
  message: string;
  code?: string;
  validation?: CalculationValidateResponse;
};

export function toApiClientError(err: unknown): ApiClientError {
  const ax = err as AxiosError<Record<string, unknown>>;
  const status = ax.response?.status ?? 0;
  const data = ax.response?.data;

  if (status === 401) {
    return { status, message: "Oturum süresi doldu." };
  }
  if (status === 402) {
    return {
      status,
      code: typeof data?.code === "string" ? data.code : "CALCULATION_ACCESS_REQUIRED",
      message:
        typeof data?.message === "string"
          ? data.message
          : "Hesaplama için ödeme veya kredi gerekiyor.",
    };
  }
  if (status === 422 && data && typeof data === "object" && "errors" in data) {
    return {
      status,
      message: typeof data.message === "string" ? data.message : "Veri doğrulama hataları.",
      validation: data as unknown as CalculationValidateResponse,
    };
  }
  if (status >= 500) {
    return { status, message: "Sunucu hatası." };
  }
  if (typeof data?.error === "string") {
    return { status, message: data.error };
  }
  if (typeof data?.message === "string") {
    return { status, message: data.message };
  }
  return { status, message: ax.message || "İstek başarısız." };
}

/** 402 / erişim kodları — run ve report ortak mesaj */
export function formatCalculationAccessError(error: ApiClientError): string {
  if (error.status !== 402) return error.message;
  switch (error.code) {
    case "PAYMENT_REQUIRED_SINGLE":
      return "Bu hesap için tek seferlik ödeme gereklidir.";
    case "SUBSCRIPTION_EXPIRED":
      return "Aboneliğiniz sona ermiş. Yenileme sonrası hesap yapabilirsiniz.";
    case "PAYMENT_PENDING":
      return "Ödemeniz işleniyor. Lütfen kısa süre sonra tekrar deneyin.";
    case "PAYMENT_FAILED":
      return "Ödeme tamamlanamadı. Lütfen tekrar deneyin.";
    case "CALCULATION_ACCESS_REQUIRED":
      return error.message || "Hesaplama erişimi için ödeme veya abonelik gerekiyor.";
    default:
      return error.message || "Hesaplama erişimi reddedildi.";
  }
}

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
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

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return api.post<AuthResponse>("/auth/login", payload).then((r) => r.data);
}

export function register(payload: RegisterPayload): Promise<AuthResponse> {
  return api.post<AuthResponse>("/auth/register", payload).then((r) => r.data);
}

/** Aktif: yalnızca veri doğrulama — parasal sonuç yok */
export function validateCalculationDraft(
  draft: CalculationDraftInput
): Promise<CalculationValidateResponse> {
  return api
    .post<CalculationValidateResponse>("/calculations/validate", draft)
    .then((r) => r.data)
    .catch((err) => {
      const mapped = toApiClientError(err);
      if (mapped.validation) return mapped.validation;
      throw mapped;
    });
}

/** Girdi özeti + inputHash — motor çalıştırmaz */
export function requestCalculationReviewSummary(
  draft: CalculationDraftInput
): Promise<CalculationReviewSummaryResponse> {
  return api
    .post<CalculationReviewSummaryResponse>("/calculations/review-summary", draft)
    .then((r) => r.data)
    .catch((err) => {
      throw toApiClientError(err);
    });
}

/** TRAFFIC_INJURY hesap motoru — sunucu tarafı gerçek sonuç */
export function requestCalculationRun(
  draft: CalculationDraftInput
): Promise<CalculationRunResponse> {
  return api
    .post<CalculationRunResponse>("/calculations/run", draft)
    .then((r) => r.data)
    .catch((err) => {
      throw toApiClientError(err);
    });
}

/** TRAFFIC_INJURY Word raporu — sunucu motor sonucundan .docx üretir */
export function requestTrafficInjuryWordReport(draft: CalculationDraftInput): Promise<Blob> {
  return api
    .post("/calculations/report", draft, { responseType: "blob" })
    .then((r) => r.data as Blob)
    .catch(async (err) => {
      const ax = err as AxiosError<Blob | Record<string, unknown>>;
      if (ax.response?.data instanceof Blob && ax.response.data.type?.includes("json")) {
        try {
          const text = await ax.response.data.text();
          const parsed = JSON.parse(text) as Record<string, unknown>;
          if (ax.response.status === 422 && parsed.errors) {
            throw {
              status: 422,
              message: typeof parsed.message === "string" ? parsed.message : "Doğrulama hatası.",
              validation: parsed as unknown as CalculationValidateResponse,
            } satisfies ApiClientError;
          }
          throw {
            status: ax.response.status,
            code: typeof parsed.code === "string" ? parsed.code : undefined,
            message:
              typeof parsed.message === "string"
                ? parsed.message
                : typeof parsed.error === "string"
                  ? parsed.error
                  : "Rapor oluşturulamadı.",
          } satisfies ApiClientError;
        } catch (inner) {
          if (inner && typeof inner === "object" && "status" in inner) throw inner;
        }
      }
      throw toApiClientError(err);
    });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Legacy tipler (aktif UI kullanmaz; derleme için dosyalar korunur) ───

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

export interface SGKPSDYearlyRowPayload {
  year: number;
  age: number;
  income: number;
  discountFactor: number;
  survivalProbability: number;
  presentValue: number;
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

/** @deprecated LEGACY — aktif UI kullanmaz */
export function validate(
  _input: ActuarialInputPayload,
  _result: ActuarialResultPayload,
  _supportShares?: number[]
): Promise<ValidateResponse> {
  return Promise.reject(new Error("Legacy validate endpoint is retired from active flow."));
}

/** @deprecated LEGACY — ENABLE_LEGACY_CALCULATION gerekir; aktif UI kullanmaz */
export function legacyCalculate(input: ActuarialInputPayload): Promise<{ result: ActuarialResultPayload }> {
  return api.post("/calculate", input).then((r) => r.data);
}

/** @deprecated LEGACY alias */
export function calculate(input: ActuarialInputPayload): Promise<{ result: ActuarialResultPayload }> {
  return legacyCalculate(input);
}

/** @deprecated LEGACY — ENABLE_LEGACY_REPORT gerekir; aktif UI kullanmaz */
export function legacyDownloadReport(resultJson: ActuarialResultPayload): Promise<Blob> {
  return api
    .post("/report", { resultJson }, { responseType: "blob" })
    .then((r) => r.data as Blob);
}

/** @deprecated LEGACY */
export function downloadReport(resultJson: ActuarialResultPayload): Promise<Blob> {
  return legacyDownloadReport(resultJson);
}
