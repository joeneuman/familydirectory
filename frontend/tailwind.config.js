/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'recent-change': '#fff9c4', // Light yellow for recent changes
      },
    },
  },
  plugins: [],
}





