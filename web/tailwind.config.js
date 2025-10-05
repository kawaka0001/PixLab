/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E1E1E',
          dark: '#0F0F0F',
          light: '#2A2A2A',
        },
        accent: {
          DEFAULT: '#91CD21',
          dark: '#76B319',
          light: '#A4DC3D',
        },
        secondary: {
          DEFAULT: '#4EB521',
          light: '#76D1BA',
        },
      },
    },
  },
  plugins: [],
}
