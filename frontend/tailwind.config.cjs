/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
      },
      maxWidth: {
        '8xl': '90rem',
        '9xl': '100rem',
      },
      minWidth: {
        '0': '0',
        '1/4': '25%',
        '1/2': '50%',
        '3/4': '75%',
        'full': '100%',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' }
        },
        'zoom-fade-out': {
          '0%': { 
            transform: 'scale(1) translateY(0)',
            opacity: '1'
          },
          '100%': { 
            transform: 'scale(1.05) translateY(-30px)',
            opacity: '0'
          }
        },
        'zoom-fade-in': {
          '0%': { 
            transform: 'scale(0.95) translateY(30px)',
            opacity: '0'
          },
          '100%': { 
            transform: 'scale(1) translateY(0)',
            opacity: '1'
          }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'zoom-fade-out': 'zoom-fade-out 0.5s ease-in-out forwards',
        'zoom-fade-in': 'zoom-fade-in 0.5s ease-in-out'
      }
    },
  },
  plugins: [require('@tailwindcss/forms')],
} 