/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E40AF',
        secondary: '#3B82F6',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        background: '#F8FAFC',
        foreground: '#1E293B',
        border: '#E2E8F0',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans HK', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
