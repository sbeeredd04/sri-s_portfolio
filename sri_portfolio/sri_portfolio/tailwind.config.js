/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'vision-accent': '#2fb8ff',
        'vision-purple': '#5e17ff',
        'vision-dark': '#1F1F47',
      },
      borderRadius: {
        'vision': '28px',
        'vision-sm': '20px',
        'vision-xs': '16px',
      },
      backdropBlur: {
        'vision': '40px',
        'vision-sm': '20px',
      },
      boxShadow: {
        'vision': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'vision-glow': '0 0 20px rgba(47, 184, 255, 0.3)',
      },
      screens: {
        'xs': '480px',
      },
    },
  },
  plugins: [],
};
