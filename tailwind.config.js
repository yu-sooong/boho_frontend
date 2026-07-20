import colors from 'tailwindcss/colors'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: colors.teal, // primary-50 ~ primary-900 對應 teal-50 ~ teal-900
      },
      fontFamily: {
        heading: ['"Noto Sans TC"', '"Inter"', 'sans-serif'],
        body: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"PingFang TC"',
          '"Microsoft JhengHei"',
          'sans-serif',
        ],
        mono: ['"Inter"', 'sans-serif'],
      },
      borderRadius: {
        md: '0.5rem',
      },
    },
  },
  plugins: [],
}
