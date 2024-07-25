import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/contexts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        text1: 'var(--text-color-1)',
        text2: 'var(--text-color-2)',
        text3: 'var(--text-color-3)',

        bg1: 'var(--bg-color-1)',
        bg2: 'var(--bg-color-2)',
        bg3: 'var(--bg-color-3)',
        bg4: 'var(--bg-color-4)',

        border1: 'var(--border-color-1)',
        border2: 'var(--border-color-2)',
        border3: 'var(--border-color-3)',

        error: 'var(--error-color)',
        success: 'var(--success-color)',
        select: 'var(--select-color)'
      },
      backgroundImage: {
        // vertical  gradient where bottom 10% is red, rest is black
        'hero-gradient':
          'linear-gradient(to bottom, rgba(63, 63, 63, 0.75) 0%, transparent 5%, transparent 90%, rgba(63, 63, 63, 0.75) 100%)',
        // horizontal gradient aqua -> magenta
        'navbar-underline-gradient': 'linear-gradient(to right, #00FFFF, #FF00FF)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))'
      },
      spacing: {
        'desktop-video-width': 'calc(100% - var(--chat-width))',
        'mobile-video-height': 'calc(100vw * 9 / 16)'
      }
    }
  },
  plugins: []
}
export default config
