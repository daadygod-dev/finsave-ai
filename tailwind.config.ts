import type { Config } from 'tailwindcss'

export default {
  content: ['./src/frontend/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        ink: '#151a2d',
        ledger: '#f7f8fc',
        palm: '#10b981',
        maize: '#f59e0b',
        brick: '#fe5f55',
        night: {
          700: '#1e242a',
          800: '#121620',
          900: '#0f111a',
        },
        brand: {
          DEFAULT: '#70C95E', // Main vibrant success green
          bright: '#82d671',  // Lighter hover state green
          deep: '#5eb34d',    // Deeper active selection green
        },
        // Legacy alias bound to the same green token matrix so any residual
        // `*-lake` utilities (e.g. focus-visible:ring-lake) resolve to green.
        lake: '#70C95E',

        fintech: {
          darkBg: '#0f111a',
          canvas: '#f8fafc',
          success: '#10b981',
          warning: '#f59e0b',
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
