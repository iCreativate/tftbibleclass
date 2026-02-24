import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-heading)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        scripture: ["var(--font-heading)", "Georgia", "serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#2563eb",
          foreground: "#ffffff",
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        secondary: {
          DEFAULT: "#059669",
          foreground: "#ffffff",
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981",
          600: "#059669",
        },
        accent: {
          DEFAULT: "#d97706",
          50: "#fffbeb",
          500: "#f59e0b",
        },
        surface: {
          DEFAULT: "#f8fafc",
          elevated: "#ffffff",
          muted: "#f1f5f9",
        },
      },
      backgroundImage: {
        "gradient-premium":
          "linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(5,150,105,0.04) 100%)",
        parchment:
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37,99,235,0.06), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(5,150,105,0.05), transparent)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 6px 12px -2px rgb(0 0 0 / 0.05)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 12px 24px -4px rgb(0 0 0 / 0.08)",
        soft: "0 2px 8px rgb(0 0 0 / 0.04)",
        "soft-lg": "0 8px 24px rgb(0 0 0 / 0.06)",
        glow: "0 0 0 1px rgb(37 99 235 / 0.08)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
