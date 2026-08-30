/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Warm amber — natural, earthy, human
        brand: {
          50:  '#fdf8ee',
          100: '#faefd3',
          200: '#f5dca3',
          300: '#efc469',
          400: '#e8a33d',
          500: '#d97706',  // Warm amber (main accent)
          600: '#b85c05',
          700: '#8f4204',
          800: '#6b3203',
          900: '#4a2302',
          950: '#2d1401',
        },
        // Warm dark — earthy, not cold blue-black
        dark: {
          50:  '#f5ede0',
          100: '#ece0d0',
          200: '#d9c7b0',
          300: '#bda990',
          400: '#9e8878',
          500: '#7c6b5e',
          600: '#5a4e44',
          700: '#3d3328',
          800: '#261e16',  // warm panel surface
          900: '#191310',  // warm deep surface
          950: '#100d09',  // warm near-black background
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
