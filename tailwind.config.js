/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        navy: {
          900: "#0B1D3A",
          800: "#0F2847",
          700: "#143354",
          600: "#1A3F65",
        },
        gold: {
          400: "#E8C468",
          500: "#D4A843",
          600: "#B8922F",
        },
        copper: {
          400: "#3BBFAE",
          500: "#2A9D8F",
          600: "#228177",
        },
        crimson: {
          500: "#C0392B",
          600: "#A93226",
        },
      },
      fontFamily: {
        cinzel: ["Cinzel", "serif"],
        body: ["Noto Sans SC", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "scroll-left": "scrollLeft 30s linear infinite",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(212, 168, 67, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(212, 168, 67, 0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        scrollLeft: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
    },
  },
  plugins: [],
};
