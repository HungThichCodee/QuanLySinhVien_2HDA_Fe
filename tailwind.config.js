/** @type {import('tailwindcss').Config} */
// Clean Light Theme Design System — QuanLySinhVien
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary":          "#1b64f2",
        "surface":          "#f8f9fa",
        "background-light": "#f8f9fa",
        "background-dark":  "#f8f9fa",
        "surface-dark":     "#ffffff",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"],
      },
      boxShadow: {
        "card":    "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "card-md": "0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.05)",
      },
    },
  },
  plugins: [],
}
