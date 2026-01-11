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
          'purple': '#667eea',
          'dark-purple': '#764ba2',
          'pink': '#f093fb',
        }
      }
    },
  },
  plugins: [],
}
