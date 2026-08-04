import type { Config } from 'tailwindcss'

export default {
  content: ['./src/frontend/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f1215',
        ledger: '#f2f7fb',
        palm: '#237a57',
        maize: '#c88520',
        lake: '#577399',
        brick: '#fe5f55',
        // Blue-slate navigation and glaucous actions.
        night: {
          700: '#2c363f',
          800: '#1e242a',
          900: '#0f1215',
        },
        brand: {
          DEFAULT: '#577399',
          bright: '#768eb0',
          deep: '#465c7a',
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
