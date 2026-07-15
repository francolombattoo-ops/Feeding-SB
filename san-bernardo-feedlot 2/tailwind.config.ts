import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        earth: {
          950: '#17140f',
          900: '#211d16',
          800: '#2c271d',
          700: '#3d3628',
        },
        olive: {
          600: '#6b6b47',
          300: '#b9b998',
        },
        cream: {
          DEFAULT: '#f6f3ea',
          dim: '#ede8d9',
        },
        corn: {
          100: '#faedd0',
          500: '#d99a2b',
          600: '#b87e1c',
        },
        good: {
          100: '#e3ecdd',
          600: '#4f7942',
        },
        bad: {
          100: '#f4dfda',
          600: '#a83c2e',
        },
        over: {
          100: '#dde9ef',
          600: '#3d6b8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '1.25rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(23,20,15,0.06), 0 8px 24px -12px rgba(23,20,15,0.12)',
        'card-lg': '0 2px 8px rgba(23,20,15,0.08), 0 16px 40px -16px rgba(23,20,15,0.18)',
      },
    },
  },
  plugins: [],
};
export default config;
