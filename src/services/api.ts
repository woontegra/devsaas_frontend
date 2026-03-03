import axios, { type AxiosInstance } from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? "";

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
}

export interface CalculateResponse {
  result: ActuarialResultPayload;
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
