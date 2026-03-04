/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./dev/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5ff',
          100: '#e0eaff',
          200: '#c2d5ff',
          300: '#93b4ff',
          400: '#6490ff',
          500: '#3b6cff',
          600: '#1a4fff',
          700: '#0037e6',
          800: '#002db8',
          900: '#00258f',
        },
      },
    },
  },
  plugins: [],
};
