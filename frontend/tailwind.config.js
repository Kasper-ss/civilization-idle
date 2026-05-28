/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        civ: {
          gold: '#d4a853',
          bronze: '#cd7f32',
          dark: '#0a0e17',
          panel: 'rgba(20, 28, 45, 0.75)',
          border: 'rgba(212, 168, 83, 0.25)',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'era-flash': 'eraFlash 2s ease-out forwards',
      },
      keyframes: {
        eraFlash: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '20%': { opacity: '1', transform: 'scale(1)' },
          '80%': { opacity: '1' },
          '100%': { opacity: '0', pointerEvents: 'none' },
        },
      },
    },
  },
  plugins: [],
};
