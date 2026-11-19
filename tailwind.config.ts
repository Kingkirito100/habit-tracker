import type { Config } from "tailwindcss";

// Все цвета берутся из CSS-переменных (ui/tokens.css) — никаких хардкодных цветов в компонентах.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surf: "var(--surf)",
        ink: "var(--ink)",
        mute: "var(--mute)",
        line: "var(--line)",
        ok: "var(--ok)",
        okt: "var(--okt)",
        skip: "var(--skip)",
        skipbg: "var(--skipbg)",
      },
      borderRadius: { card: "var(--r-card)", ctl: "var(--r-ctl)" },
    },
  },
  plugins: [],
};
export default config;
