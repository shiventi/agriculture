/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'deep-green': '#1a3a2a',
        cream: '#f5f0e8',
        gold: '#d4a843',
        'soft-red': '#c0392b',
        teal: '#2d8a6e',
      },
    },
  },
  plugins: [],
}
