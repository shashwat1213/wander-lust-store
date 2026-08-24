import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7f4',
          100: '#d6ece5',
          200: '#aed9cc',
          300: '#7cc0ad',
          400: '#4ba189',
          500: '#2f8570',
          600: '#236a5a',
          700: '#1f554a',
          800: '#1c443c',
          900: '#173832',
        },
        sand: {
          50: '#faf7f2',
          100: '#f2ebdd',
          200: '#e4d5bb',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
