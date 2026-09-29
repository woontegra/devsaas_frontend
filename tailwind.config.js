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
        "brand-primary": "#243746",
        "brand-primary-dark": "#192833",
        "brand-primary-soft": "#EEF2F4",
        "brand-navy": "#1B4F8A",
        "brand-navy-hover": "#164072",
        "brand-accent": "#D9892B",
        "brand-accent-soft": "#FFF3E3",
        "brand-bg": "#F5F7FA",
        "brand-border": "#DCE3E8",
        "brand-text": "#1F2933",
        "brand-muted": "#66727F",
        "brand-surface": "#FFFFFF",
        "app-primary": "#243746",
        "app-bg": "#F5F7FA",
        "app-border": "#DCE3E8",
      },
      boxShadow: {
        "app-xs": "0 1px 2px rgba(36, 55, 70, 0.04)",
        "app-sm": "0 2px 8px rgba(15, 23, 42, 0.05)",
        "app-md": "0 4px 14px rgba(15, 23, 42, 0.08)",
        "app-lg": "0 8px 24px rgba(15, 23, 42, 0.1)",
      },
      borderRadius: {
        card: "12px",
        input: "10px",
        button: "10px",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [],
};
