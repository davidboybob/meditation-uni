/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // 메인 테마
        base: {
          bg: "#1a3a2a",
          dark: "#0f2318",
          text: "#f5f0e8",
        },
        accent: {
          DEFAULT: "#2d6a4f",
          light: "#74c69d",
        },
        // 카드/오버레이
        card: {
          DEFAULT: "rgba(255,255,255,0.08)",
          hover: "rgba(255,255,255,0.12)",
          subtle: "rgba(255,255,255,0.06)",
          border: "rgba(255,255,255,0.1)",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};
