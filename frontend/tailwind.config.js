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
          primary: '#1a202c', // Charcoal (Main Text)
          sidebar: '#ffffff', // Pure White (Sidebar)
          sidebarHover: '#f0fdfa', // Very light mint
          tableHeader: '#34d399', // Mint Green
          tableRowAlt: '#f9fafb', // Lightest gray for row stripes
          accent: '#10b981', // Active Mint (Vibrant)
          bg: '#f0fdfa', // Global Minty Background (Cyan-50 tint)
          surface: '#ffffff', // Pure White for cards
          border: '#e2e8f0', // Soft borders
          muted: '#718096', // Slate-500 (Secondary text)
          success: '#10b981',
          danger: '#ef4444',
          info: '#3b82f6',
          warning: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}
