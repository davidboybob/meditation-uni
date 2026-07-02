/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // 라이트/다크 팔레트는 src/index.css의 --c-* CSS 변수로 정의
        base: {
          bg: "rgb(var(--c-bg) / <alpha-value>)",
          text: "rgb(var(--c-text) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--c-accent) / <alpha-value>)",
          deep: "rgb(var(--c-accent-deep) / <alpha-value>)",
          soft: "rgb(var(--c-accent-soft) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--c-card) / <alpha-value>)",
          subtle: "rgb(var(--c-card-subtle) / <alpha-value>)",
          border: "rgb(var(--c-card-border) / <alpha-value>)",
        },
        sidebar: "rgb(var(--c-sidebar) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Pretendard", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(167,139,250,0.06), 0 4px 14px rgba(167,139,250,0.08)",
      },
    },
  },
  plugins: [],
};
