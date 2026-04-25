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
        primary: '#409eff',
        secondary: '#67c23a',
        background: '#f5f7fa',
        card: '#ffffff',
        text: '#303133',
        'dark-background': '#1a1a1a',
        'dark-card': '#2d2d2d',
        'dark-text': '#e0e0e0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}