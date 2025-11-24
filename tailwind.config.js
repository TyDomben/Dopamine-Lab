/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'game-bg': '#0a0a0f',
        'game-card': '#1a1a2e',
        'game-cyan': '#00d9ff',
        'game-purple': '#b24bf3',
        'game-gold': '#ffd700',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'particle-rise': 'particle-rise 1s ease-out forwards',
        'number-pop': 'number-pop 0.3s ease-out',
        'shake': 'shake 0.2s ease-in-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        'particle-rise': {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-100px) scale(0.5)' },
        },
        'number-pop': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '75%': { transform: 'translateX(2px)' },
        },
      },
    },
  },
  plugins: [],
}
