/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // 메인 테마 (Soft Pastel Devotion)
        base: {
          bg: "#F5F1FA",      // 라일락 화이트
          dark: "#FFFFFF",     // 표면(상단/네비)
          text: "#3D3654",     // 다크 플럼
        },
        accent: {
          DEFAULT: "#A78BFA",  // 라벤더 (메인 버튼)
          deep: "#8B5CF6",     // 진한 라벤더 (텍스트 강조)
          light: "#FBBF24",    // 선셋 옐로우 (서브 강조)
          soft: "#EDE7FE",     // 옅은 라벤더 (배경)
        },
        // 카드/표면
        card: {
          DEFAULT: "#FFFFFF",
          hover: "#FAF7FF",
          subtle: "#F9F5FF",
          border: "#E9E2F5",
        },
        // 출석 상태 배지
        status: {
          presentBg: "#D1FAE5", presentTx: "#065F46",
          lateBg:    "#FEF3C7", lateTx:    "#92400E",
          absentBg:  "#FEE2E2", absentTx:  "#991B1B",
          pendingBg: "#EDE9FE", pendingTx: "#5B21B6",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ['"Gmarket Sans"', "Pretendard", "sans-serif"],
        serif: ["Pretendard", "system-ui", "sans-serif"], // 호환성 유지
      },
      boxShadow: {
        card: "0 1px 2px rgba(167,139,250,0.06), 0 4px 14px rgba(167,139,250,0.08)",
        cardHover: "0 4px 16px rgba(167,139,250,0.14)",
        button: "0 2px 8px rgba(139,92,246,0.20)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
