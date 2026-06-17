import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "hsl(var(--primary))",
        background: "hsl(var(--background))",
        surface: "hsl(var(--card))",
        outline: "hsl(var(--border))",
        error: "hsl(var(--destructive))",
        success: "#10b981",
      },
      fontFamily: {
        sans: ["var(--font-noto-sans)", "sans-serif"],
        display: ["var(--font-eb-garamond)", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;