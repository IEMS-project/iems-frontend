/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        bounceTyping: {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
      },
      animation: {
        bounceTyping: 'bounceTyping 1.4s infinite',
        bounceTyping200: 'bounceTyping 1.4s infinite 0.2s',
        bounceTyping400: 'bounceTyping 1.4s infinite 0.4s',
      },
    },
  },
  plugins: [],
}
