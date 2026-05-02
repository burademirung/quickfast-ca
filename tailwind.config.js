import defaultTheme from 'tailwindcss/defaultTheme';
import plugin from 'tailwindcss/plugin';
import typographyPlugin from '@tailwindcss/typography';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,json,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Using rgb(<channels> / <alpha>) so opacity modifiers like /20 work
        primary: 'rgb(var(--aw-color-primary-rgb) / <alpha-value>)',
        secondary: 'rgb(var(--aw-color-secondary-rgb) / <alpha-value>)',
        accent: 'rgb(var(--aw-color-accent-rgb) / <alpha-value>)',
        heading: 'rgb(var(--aw-color-text-heading-rgb) / <alpha-value>)',
        default: 'rgb(var(--aw-color-text-default-rgb) / <alpha-value>)',
        muted: 'rgb(var(--aw-color-text-muted-rgb) / <alpha-value>)',
        page: 'rgb(var(--aw-color-bg-page-rgb) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--aw-font-sans, ui-sans-serif)', ...defaultTheme.fontFamily.sans],
        serif: ['var(--aw-font-serif, ui-serif)', ...defaultTheme.fontFamily.serif],
        heading: ['var(--aw-font-heading, ui-sans-serif)', ...defaultTheme.fontFamily.sans],
      },

      animation: {
        fade: 'fadeInUp 1s both',
      },

      keyframes: {
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(2rem)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    typographyPlugin,
    plugin(({ addVariant }) => {
      addVariant('intersect', '&:not([no-intersect])');
    }),
  ],
};
