import type { Config } from 'tailwindcss'

export default {
  content: ['./src/frontend/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        ledger: '#f4f5f7',
        palm: '#1f6f4a',
        maize: '#e0b44c',
        lake: '#2f6f8f',
        brick: '#9f4f3f',
        // Dark sidebar surface + brand purple (premium reference theme)
        night: {
          700: '#151a28',
          800: '#101624',
          900: '#0c111c',
        },
        brand: {
          DEFAULT: '#6d5df6',
          bright: '#8e5cff',
          deep: '#5c4bff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
