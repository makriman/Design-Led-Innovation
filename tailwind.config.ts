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
        primary: "#0030ab",
        accent: "#db3e4a",
        neutral: "#e8e8e8",
        border: "#d8d8d8",
        foreground: "#1a1a1a",
        background: "#ffffff",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.625rem",
        sm: "0.5rem",
      },
      boxShadow: {
        card: "0 6px 20px rgba(0, 48, 171, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
