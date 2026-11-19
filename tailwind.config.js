/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'a4': '0 0 0 1px rgba(0, 0, 0, 0.05), 0 20px 35px -5px rgba(15, 23, 42, 0.15), 0 10px 15px -5px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
