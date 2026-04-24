import type { Config } from "tailwindcss";

const theme = require("./tailwind.theme.json");

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: theme.colors,
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSize,
      borderRadius: theme.borderRadius,
      spacing: theme.spacing,
      boxShadow: theme.shadows,
    },
  },
  plugins: [],
};
export default config;
