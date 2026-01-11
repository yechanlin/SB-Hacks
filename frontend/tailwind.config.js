/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'jura': ['Jura', 'sans-serif'],
      },
      colors: {
        'interview': {
          'purple': '#1e3a8a',
          'dark-purple': '#0f172a',
          'pink': '#475569',
        }
      }
    },
  },
  plugins: [],
}
