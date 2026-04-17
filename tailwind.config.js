/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0D0D0D',
        gold: {
          DEFAULT: '#E8E4DC',
          light: '#F2EFE9',
          dark: '#C8C4BC',
        },
        surface: '#161616',
        border: '#262626',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['BigRiver', 'Georgia', 'serif'],
        script: ['BigRiverScript', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: '1rem',
      },
    },
  },
  plugins: [],
}
