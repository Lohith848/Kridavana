import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#10121A',
        bg: '#10121A',
        surface: '#171A24',
        surfaceRaised: '#1F2330',
        hairline: '#2A2E3D',
        border: '#2A2E3D',
        cream: '#F3EFE6',
        text: '#F3EFE6',
        muted: '#9CA0B3',
        amber: '#E8A33D',
        accent: '#E8A33D',
        amberDim: '#7A5A28',
        accentMuted: '#7A5A28',
        teal: '#4FB8A6',
        playing: '#4FB8A6',
        rose: '#C9636B',
        dropped: '#C9636B'
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace']
      },
      borderRadius: {
        btn: '6px',
        card: '8px',
        cover: '4px',
        pill: '9999px',
        lg: '12px'
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        'card-hover': '0 10px 25px -5px rgba(0,0,0,0.4), 0 8px 10px -6px rgba(0,0,0,0.2)',
        'glow': '0 0 24px rgba(232, 163, 61, 0.15)',
        'glow-lg': '0 0 40px rgba(232, 163, 61, 0.25)',
        'inner-glow': 'inset 0 0 0 1px rgba(232, 163, 61, 0.2)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 300ms ease-out forwards',
        'slide-up': 'slide-up 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scale-in 200ms ease-out forwards',
        'shimmer': 'shimmer 1.5s infinite',
      },
      backgroundImage: {
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
      },
      backgroundSize: {
        'shimmer': '200% 100%',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    }
  },
  plugins: []
};

export default config;
