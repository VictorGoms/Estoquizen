import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* Nunito carregada via next/font em layout.tsx (variável --font-nunito) */
      fontFamily: {
        sans: ["var(--font-nunito)", "ui-rounded", "Segoe UI", "system-ui", "sans-serif"],
        display: ["var(--font-nunito)", "ui-rounded", "Segoe UI", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        navy: {
          900: "#0b1220",
          800: "#1e293b",
          700: "#334155",
          600: "#475569",
        },
        /* ── Tema "Noite Azul" ── */
        ink:     "#0b1220",                                   // fundo
        panel:   "#111a2c",                                   // menu lateral
        surface: { DEFAULT: "#151f33", 2: "#1d2840" },        // cards / elementos internos
        fg:      { DEFAULT: "#f4f7fc", soft: "#c9d3e3", muted: "#a9b5c9", subtle: "#8592a8" },
        inverse: { DEFAULT: "#eef3fb", muted: "#4a5872", line: "#d5deec" }, // card claro (ativo/selecionado)
        accent:  { DEFAULT: "#60a5fa" },                      // = brand-400, card de destaque
        ok:      "#34d399",                                   // estoque normal
        low:     "#fbbf24",                                   // estoque baixo
        zero:    "#fb7185",                                   // estoque zerado
      },
      borderRadius: {
        "4xl": "1.75rem",
        "5xl": "2rem",
        "6xl": "2.25rem",
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(ellipse at 60% 0%, rgba(37,99,235,0.18) 0%, transparent 70%)",
        "card-gradient": "linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.9) 100%)",
        "btn-gradient": "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)",
      },
      boxShadow: {
        "card": "0 4px 24px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2)",
        "btn": "0 4px 20px rgba(37,99,235,0.4)",
        "btn-hover": "0 6px 28px rgba(37,99,235,0.6)",
        "glass": "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
        "lift": "0 18px 40px rgba(0,0,0,0.35)",
        "nav": "0 -10px 30px rgba(11,18,32,0.9)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease forwards",
        "fade-in": "fadeIn 0.5s ease forwards",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
