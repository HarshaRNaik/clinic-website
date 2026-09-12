import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Segoe UI", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"]
      },
      colors: {
        brand: {
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
          800: "var(--brand-800)"
        },
        care: {
          100: "var(--care-100)",
          600: "var(--care-600)",
          700: "var(--care-700)"
        },
        clinic: {
          100: "var(--clinic-100)",
          600: "var(--clinic-600)",
          800: "var(--clinic-800)"
        },
        marigold: {
          100: "var(--marigold-100)",
          600: "var(--marigold-600)"
        },
        terracotta: {
          600: "var(--terracotta-600)"
        },
        ink: {
          900: "var(--ink-900)",
          700: "var(--ink-700)",
          500: "var(--ink-500)",
          400: "var(--ink-400)"
        },
        surface: "var(--surface)",
        page: "var(--bg)",
        subtle: "var(--bg-subtle)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        info: "var(--info)",
        "staff-chrome": "var(--staff-chrome)",
        "staff-chrome-text": "var(--staff-chrome-text)"
      }
    }
  },
  plugins: []
};

export default config;
