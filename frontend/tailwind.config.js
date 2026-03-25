/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#23b0c7', // The exact Sea-Blue from legacy UI screenshots
          sidebar: '#22c1d9', // Slightly lighter sidebar variant
          sidebarHover: '#139ab3', 
          tableHeader: '#38cbdc', // Greenish-blue table header
          tableRowAlt: '#e9f9fb', // Light row color
        }
      }
    },
  },
  plugins: [],
}
