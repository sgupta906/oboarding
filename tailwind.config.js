/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /**
       * BRAND COLORS
       * Primary brand identity using indigo/violet palette
       * Used for: CTAs, primary actions, brand headers, active states
       */
      colors: {
        brand: {
          50: '#EBF5FF',   // Lightest tint
          100: '#D6EBFF',
          200: '#ADD6FF',
          300: '#7ABFFF',
          400: '#47A5F5',
          500: '#329AF0',   // Accent blue (lighter)
          600: '#1C7CD6',   // Primary blue (main CTA)
          700: '#1565B8',
          800: '#104E94',
          900: '#0B3A70',
          950: '#06234A',   // Darkest
        },
      },

      /**
       * TYPOGRAPHY
       * Font families optimized for UI readability
       */
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
