import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ["Orbitron", "sans-serif"],
        fira: ["Fira Code", "monospace"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        primary: "#0a0e1a",
        secondary: "#0f1422",
        "accent-cyan": "#00f0ff",
        "accent-pink": "#ff2e97",
        "accent-purple": "#a855f7",
        "accent-green": "#00ff88",
      },
    },
  },
  plugins: [],
};

export default config;
