import { useTheme } from "../theme/ThemeProvider";

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        d="M21 14.3A8.5 8.5 0 0 1 9.7 3 7 7 0 1 0 21 14.3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Header hızlı tema geçişi — ThemeProvider preference source-of-truth */
export function ThemeToggleButton() {
  const { effective, setPreference } = useTheme();
  const nextIsDark = effective === "light";
  const label = nextIsDark ? "Koyu moda geç" : "Açık moda geç";

  return (
    <button
      type="button"
      className="header-theme-toggle"
      title={label}
      aria-label={label}
      onClick={() => setPreference(nextIsDark ? "dark" : "light")}
    >
      {nextIsDark ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
