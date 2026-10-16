/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lavender: {
          50: '#f6f5fe',
          100: '#eeeafc',
          200: '#ded8f9',
          300: '#c5b8f4',
          400: '#a790ed',
          500: '#8c68e3',
          600: '#7949d6',
          700: '#6736c0',
          800: '#562da1',
          900: '#472782',
          950: '#2c1458',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'lavender-sm': '0 2px 8px -1px rgba(140, 104, 227, 0.15)',
        'lavender': '0 4px 20px -2px rgba(140, 104, 227, 0.25)',
        'lavender-lg': '0 10px 25px -3px rgba(140, 104, 227, 0.35)',
      },
    },
  },
  plugins: [],
}
