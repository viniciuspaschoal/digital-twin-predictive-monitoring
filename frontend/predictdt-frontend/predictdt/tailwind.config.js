/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#007C73',
          light: '#00A89C',
          dark: '#005952',
        },
        surface: {
          DEFAULT: '#0D1117',
          1: '#161B22',
          2: '#1C2333',
          3: '#243044',
          border: '#30363D',
        },
        status: {
          active: '#22C55E',
          inactive: '#EF4444',
          warning: '#F59E0B',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        'brand': '0 0 20px rgba(0,124,115,0.3)',
        'brand-lg': '0 0 40px rgba(0,124,115,0.4)',
        'glass': '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
};

