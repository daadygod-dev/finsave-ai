import type { Config } from 'tailwindcss'

export default {
  content: ['./src/frontend/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        ink: '#17211b',
        ledger: '#f7f8f4',
        palm: '#1f6f4a',
        maize: '#e0b44c',
        lake: '#2f6f8f',
        brick: '#9f4f3f',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
