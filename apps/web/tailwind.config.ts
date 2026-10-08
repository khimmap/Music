import type { Config } from 'tailwindcss';

/**
 * Design tokens derived from DESIGN.md (ElevenLabs design analysis).
 *
 * DESIGN.md is the single source of truth. Every token here maps 1:1 to a CSS
 * variable declared in src/app/globals.css — do not introduce colors, fonts,
 * radii, or spacing that are not in DESIGN.md.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          active: 'var(--color-primary-active)',
        },
        ink: 'var(--color-ink)',
        body: {
          DEFAULT: 'var(--color-body)',
          strong: 'var(--color-body-strong)',
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
          soft: 'var(--color-muted-soft)',
        },
        hairline: {
          DEFAULT: 'var(--color-hairline)',
          soft: 'var(--color-hairline-soft)',
          strong: 'var(--color-hairline-strong)',
        },
        canvas: {
          DEFAULT: 'var(--color-canvas)',
          soft: 'var(--color-canvas-soft)',
          deep: 'var(--color-canvas-deep)',
        },
        surface: {
          card: 'var(--color-surface-card)',
          strong: 'var(--color-surface-strong)',
          dark: 'var(--color-surface-dark)',
          'dark-elevated': 'var(--color-surface-dark-elevated)',
        },
        on: {
          primary: 'var(--color-on-primary)',
          dark: 'var(--color-on-dark)',
          'dark-soft': 'var(--color-on-dark-soft)',
        },
        gradient: {
          mint: 'var(--color-gradient-mint)',
          peach: 'var(--color-gradient-peach)',
          lavender: 'var(--color-gradient-lavender)',
          sky: 'var(--color-gradient-sky)',
          rose: 'var(--color-gradient-rose)',
        },
        success: 'var(--color-success)',
        error: 'var(--color-error)',
        ember: 'var(--color-ember)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Times New Roman', 'serif'],
      },
      fontSize: {
        'display-mega': ['64px', { lineHeight: '1.05', letterSpacing: '-1.92px', fontWeight: '300' }],
        'display-xl': ['48px', { lineHeight: '1.08', letterSpacing: '-0.96px', fontWeight: '300' }],
        'display-lg': ['36px', { lineHeight: '1.17', letterSpacing: '-0.36px', fontWeight: '300' }],
        'display-md': ['32px', { lineHeight: '1.13', letterSpacing: '-0.32px', fontWeight: '300' }],
        'display-sm': ['24px', { lineHeight: '1.2', letterSpacing: '0', fontWeight: '300' }],
        'title-md': ['20px', { lineHeight: '1.35', fontWeight: '500' }],
        'title-sm': ['18px', { lineHeight: '1.44', letterSpacing: '0.18px', fontWeight: '500' }],
        'body-md': ['16px', { lineHeight: '1.5', letterSpacing: '0.16px' }],
        'body-strong': ['16px', { lineHeight: '1.5', letterSpacing: '0.16px', fontWeight: '500' }],
        'body-sm': ['15px', { lineHeight: '1.47', letterSpacing: '0.15px' }],
        caption: ['14px', { lineHeight: '1.5' }],
        'caption-uppercase': ['12px', { lineHeight: '1.4', letterSpacing: '0.96px', fontWeight: '600' }],
        button: ['15px', { lineHeight: '1', fontWeight: '500' }],
      },
      borderRadius: {
        none: 'var(--radius-none)',
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        xxl: 'var(--radius-xxl)',
        pill: 'var(--radius-pill)',
        full: 'var(--radius-full)',
      },
      spacing: {
        xxs: 'var(--space-xxs)',
        xs: 'var(--space-xs)',
        sm: 'var(--space-sm)',
        base: 'var(--space-base)',
        md: 'var(--space-md)',
        lg: 'var(--space-lg)',
        xl: 'var(--space-xl)',
        xxl: 'var(--space-xxl)',
        section: 'var(--space-section)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
};

export default config;
