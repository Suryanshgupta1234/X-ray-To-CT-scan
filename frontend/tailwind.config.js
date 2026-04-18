/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0d1117",
        surface: "#161b22",
        primary: "#58a6ff",
        textMain: "#c9d1d9",
        textSec: "#8b949e",
        border: "#30363d",
      }
    },
  },
  plugins: [],
}
