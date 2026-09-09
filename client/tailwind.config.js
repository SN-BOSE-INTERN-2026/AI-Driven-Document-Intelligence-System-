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
        // Stone/charcoal — clearly visible on white
        dark: {
          50:  '#1c1917',  // darkest — primary text
          100: '#292524',
          200: '#3d3533',
          300: '#57534e',  // secondary text
          400: '#78716c',  // muted text
          500: '#a8a29e',  // placeholder / very muted
          600: '#d6d3d1',  // borders
          700: '#e5e7eb',  // light borders
          800: '#f5f5f4',  // surface off
          900: '#fafaf9',  // background off
          950: '#ffffff',  // white
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
