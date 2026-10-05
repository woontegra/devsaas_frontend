/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        base: ["16px", { lineHeight: "1.5" }],
        "label-sm": ["13px", { lineHeight: "1.4" }],
      },
      colors: {
        "brand-primary": "var(--color-primary)",
        "brand-primary-dark": "var(--color-primary-dark)",
        "brand-primary-soft": "var(--color-primary-soft)",
        "brand-navy": "var(--color-primary)",
        "brand-navy-hover": "var(--color-primary-dark)",
        "brand-accent": "var(--color-accent)",
        "brand-accent-soft": "var(--color-accent-soft)",
        "brand-bg": "var(--color-bg)",
        "brand-border": "var(--color-border)",
        "brand-text": "var(--color-text)",
        "brand-muted": "var(--color-muted)",
        "brand-surface": "var(--color-surface)",
        "app-primary": "var(--color-primary)",
        "app-bg": "var(--color-bg)",
        "app-border": "var(--color-border)",
      },
      boxShadow: {
        "app-xs": "0 1px 2px rgba(18, 59, 99, 0.04)",
        "app-sm": "0 1px 3px rgba(18, 59, 99, 0.05)",
        "app-md": "0 4px 14px rgba(18, 59, 99, 0.06)",
        "app-lg": "0 8px 24px rgba(18, 59, 99, 0.08)",
      },
      borderRadius: {
        card: "11px",
        input: "8px",
        button: "8px",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [],
};
