/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: { DEFAULT: "#0B0D17", 2: "#10132A", 3: "#141833" },
        gold: { DEFAULT: "#D6B47C", soft: "#E8D3A8", deep: "#B08D57" },
        ivory: { DEFAULT: "#F4EDE2", paper: "#F7F0E4" },
        muted: "#A79E92",
        rose: "#C98B84",
        sage: "#8FAE96",
        ink: "#3A2B26",
        copper: "#8A5A3B",
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        glyph: ['"Noto Sans Symbols"', '"Noto Sans Symbols 2"', '"Segoe UI Symbol"', '"Apple Symbols"', '"DejaVu Sans"', "serif"],
      },
      letterSpacing: { eyebrow: "0.24em" },
      boxShadow: { glow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(214,180,124,0.12), 0 30px 80px -40px rgba(0,0,0,0.8)", paper: "0 40px 90px -30px rgba(0,0,0,0.65)" },
      keyframes: { spinSlow: { to: { transform: "rotate(360deg)" } }, blink: { "50%": { opacity: "0" } } },
      animation: { spinSlow: "spinSlow 240s linear infinite", blink: "blink 1s steps(2) infinite" },
    },
  },
  plugins: [],
};
