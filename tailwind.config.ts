import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      backgroundImage: {
        // vertical  gradient where bottom 10% is red, rest is black
        'hero-gradient':
          'linear-gradient(to bottom, rgba(63, 63, 63, 0.75) 0%, transparent 5%, transparent 90%, rgba(63, 63, 63, 0.75) 100%)',
        // horizontal gradient aqua -> magenta
        'navbar-underline-gradient': 'linear-gradient(to right, #00FFFF, #FF00FF)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))'
      }
    }
  },
  plugins: []
}
export default config
