/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "var(--surface)",
        panel: "var(--panel)",
        line: "var(--line)",
        ink: "var(--ink)",
        sub: "var(--sub)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
      },
    },
  },
  plugins: [],
};
