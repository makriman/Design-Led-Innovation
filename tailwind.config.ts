import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1a1aff",
        accent: "#ff385c",
        neutral: "#f7f4ef",
        border: "#d6d0c8",
        foreground: "#0d0d0d",
        background: "#ffffff",
        gold: "#f5a623",
        terra: "#c0522a",
        sage: "#3d7a5e",
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
      },
      boxShadow: {
        card: "0 14px 30px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
