import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'monospace'],
        serif: ['var(--font-serif)', 'Lora', 'Georgia', 'serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'fog-gray': "var(--color-fog-gray)",
        'ocean-teal': "var(--color-ocean-teal)",
        'terracotta': "var(--color-terracotta)",
        'forest-green': "var(--color-forest-green)",
        'warm-white': "var(--color-warm-white)",
        'card-bg': "var(--color-card-bg)",
        'card-border': "var(--color-card-border)",
        'text-muted': "var(--color-text-muted)",
        'ink': "var(--color-ink)",
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
export default config;

