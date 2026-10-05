import { useTheme } from "../theme/ThemeProvider";
import type { ThemePreference } from "../theme/themePreference";

const OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: "light", label: "Açık" },
  { value: "dark", label: "Koyu" },
  { value: "system", label: "Sistem" },
];

export function AccountSettingsPage() {
  const { preference, setPreference, effective } = useTheme();

  return (
    <section className="account-settings">
      <div className="account-settings-copy">
        <h2>Görünüm</h2>
        <p>
          Tema tercihi bu cihazda saklanır. Uygulanan görünüm:{" "}
          <span>{effective === "dark" ? "Koyu" : "Açık"}</span>.
        </p>
      </div>
      <div className="account-theme" role="radiogroup" aria-label="Görünüm">
        {OPTIONS.map((opt) => {
          const active = preference === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setPreference(opt.value)}
              className={active ? "is-active" : undefined}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
