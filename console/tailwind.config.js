/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#F5F1FA",
          text: "#3D3654",
        },
        accent: {
          DEFAULT: "#A78BFA",
          deep: "#8B5CF6",
          soft: "#EDE7FE",
        },
        card: {
          DEFAULT: "#FFFFFF",
          subtle: "#F9F5FF",
          border: "#E9E2F5",
        },
        sidebar: "#1c1830",
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
