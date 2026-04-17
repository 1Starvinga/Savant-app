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
          DEFAULT: '#D4CFC7',
          light: '#E2DED8',
          dark: '#ABA7A0',
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
