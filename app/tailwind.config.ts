import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f8fafc",
        foreground: "#0f172a",
        // Brand teal – matches design token color/brand/primary
        teal: {
          50:  "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",  // ← primary brand colour
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        // Semantic aliases wired to teal
        primary: {
          DEFAULT: "#0d9488",
          hover:   "#0f766e",
          light:   "#f0fdfa",
          foreground: "#ffffff",
        },
        // Semantic states — use bg-danger / text-muted (not *-danger-DEFAULT; DEFAULT is the bare name)
        success: { DEFAULT: "#16a34a", light: "#dcfce7", foreground: "#166534" },
        warning: { DEFAULT: "#ca8a04", light: "#fef9c3", foreground: "#854d0e" },
        danger:  { DEFAULT: "#dc2626", light: "#fee2e2", foreground: "#991b1b" },
        info:    { DEFAULT: "#2563eb", light: "#dbeafe", foreground: "#1e40af" },
        // Neutral surface tokens
        surface: {
          page: "#f8fafc",
          card: "#ffffff",
        },
        border: {
          subtle: "#e2e8f0",
        },
        muted: {
          DEFAULT: "#64748b",
          foreground: "#94a3b8",
        },
      },
      borderRadius: {
        sm: "0.375rem",  // 6px
        md: "0.5rem",    // 8px
        lg: "0.75rem",   // 12px
        xl: "1rem",      // 16px
        "2xl": "1.25rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "card-md": "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
