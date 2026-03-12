/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        schoolDark: '#0f0070',
        schoolLight: '#2a1a8c',
        schoolAccent: '#ffffff'
      }
    },
  },
  plugins: [],
}
