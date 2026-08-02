/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#09090b",
        surface: "#18181b",
        surface2: "#27272a",
        ink: "#ececec",
        "ink-soft": "#a1a1aa",
        line: "#27272a",
        accent: "#f59e0b",
        "accent-ink": "#09090b",
        pass: "#10b981",
        "pass-soft": "#7ed3a2",
        fail: "#ef4444",
        "fail-soft": "#f0907f",
        sys: "#06b6d4",
      },
      fontFamily: {
        disp: ["Archivo", "IBM Plex Sans", "sans-serif"],
        sans: ["IBM Plex Sans", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        "accent-glow": "0 0 10px #f59e0b",
        card: "0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -1px rgba(0,0,0,.06)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "none" },
        },
        "scan-y": {
          "0%, 100%": { transform: "translateY(-40%)" },
          "50%": { transform: "translateY(40%)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".35" },
        },
      },
      animation: {
        rise: "rise .6s ease both",
        "scan-y": "scan-y 9s ease-in-out infinite",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
