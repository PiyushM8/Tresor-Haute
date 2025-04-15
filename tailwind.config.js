/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        offwhite: '#f8f8f8',
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        gold: {
          50: '#faf6e9',
          100: '#f5ecd3',
          200: '#e6d5a7',
          300: '#d7be7b',
          400: '#c8a74f',
          500: '#b99023',
          600: '#9a791c',
          700: '#7b6215',
          800: '#5c4b0e',
          900: '#3d3407',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        cormorant: ['var(--font-cormorant)', 'serif'],
      },
    },
  },
  plugins: [],
} 