/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Mono"', "monospace"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      colors: {
        bg: {
          DEFAULT: "#0a0a0a",
          elevated: "#141414",
          card: "#1a1a1a",
        },
        border: "#262626",
        accent: {
          DEFAULT: "#fb923c",
          hover: "#f97316",
        },
        danger: "#ef4444",
        success: "#22c55e",
      },
    },
  },
  plugins: [],
};
