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
        "ds-main": "#0F172A",
        "ds-card": "#111827",
        "ds-glass": "rgba(255,255,255,0.05)",
        "ds-input": "#1F2937",
        "ds-text": "#F8FAFC",
        "ds-muted": "#94A3B8",
        "ds-border": "rgba(255,255,255,0.08)",
        "brand-primary": "#0F5F63",
        "brand-primary-dark": "#0B474A",
        "brand-primary-soft": "#EAF4F3",
        "brand-bg": "#F4F7F7",
        "brand-border": "#D9E5E3",
        "brand-text": "#22313F",
        "brand-muted": "#6B7280",
        "app-primary": "#0F5F63",
        "app-accent": "#0F5F63",
        "app-bg": "#F4F7F7",
        "app-border": "#D9E5E3",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #0F5F63 0%, #0B474A 100%)",
        "gradient-accent": "linear-gradient(135deg, #0F5F63 0%, #0B474A 100%)",
      },
      boxShadow: {
        "soft-glow": "0 0 24px rgba(15, 95, 99, 0.12)",
        "card-shadow": "0 10px 40px rgba(0, 0, 0, 0.35)",
        "app-card": "0 2px 8px rgba(15, 95, 99, 0.06)",
      },
      borderRadius: {
        card: "16px",
        input: "14px",
        button: "14px",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [],
};
