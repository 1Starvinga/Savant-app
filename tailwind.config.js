/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        accent: {
          DEFAULT: '#5B8A8A',
          light: '#7AABAB',
          dark: '#3D6B6B',
        },
        surface: '#121212',
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
