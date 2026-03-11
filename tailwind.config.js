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
        "app-primary": "#1E3A8A",
        "app-accent": "#2563EB",
        "app-bg": "#F8F9FB",
        "app-border": "#E5E7EB",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
        "gradient-accent": "linear-gradient(135deg, #3B82F6 0%, #9333EA 100%)",
      },
      boxShadow: {
        "soft-glow": "0 0 30px rgba(59, 130, 246, 0.15)",
        "card-shadow": "0 10px 40px rgba(0, 0, 0, 0.35)",
        "app-card": "0 4px 20px rgba(0, 0, 0, 0.05)",
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
