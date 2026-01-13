/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6d28d9',
          50: '#f6f2ff',
          100: '#efe7ff',
          200: '#dfccff',
          300: '#c29cff',
          400: '#9b6bff',
          500: '#6d28d9',
          600: '#5a21b8',
          700: '#451a90',
          800: '#341268',
          900: '#220b3f'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: [],
}