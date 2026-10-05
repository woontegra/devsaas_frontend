import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import {
  isAdminPath,
  readThemePreference,
  resolveEffectiveTheme,
  writeThemePreference,
  type ThemePreference,
} from "./themePreference";

type ThemeContextValue = {
  preference: ThemePreference;
  effective: "light" | "dark";
  setPreference: (pref: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyDomTheme(effective: "light" | "dark", admin: boolean) {
  const root = document.documentElement;
  if (admin) {
    root.classList.remove("theme-dark", "dark");
    root.removeAttribute("data-theme");
    return;
  }
  if (effective === "dark") {
    root.classList.add("theme-dark", "dark");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("theme-dark", "dark");
    root.setAttribute("data-theme", "light");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const admin = isAdminPath(location.pathname);
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readThemePreference());
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const effective = useMemo(() => {
    if (preference === "system") return systemDark ? "dark" : "light";
    return resolveEffectiveTheme(preference);
  }, [preference, systemDark]);

  useEffect(() => {
    applyDomTheme(effective, admin);
  }, [effective, admin]);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    writeThemePreference(pref);
  }, []);

  const value = useMemo(
    () => ({ preference, effective: admin ? "light" : effective, setPreference }),
    [preference, effective, admin, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      preference: "system",
      effective: "light",
      setPreference: () => undefined,
    };
  }
  return ctx;
}
