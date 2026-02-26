/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: '#1f1d2e',
        background: '#191724',
        border: '#524f67',
        muted: '#6e6a86',
        'foreground': '#e0def4',
        foam: '#9ccfd8',
        love: '#eb6f92',

      },
    },
  },
  plugins: [],
}
