import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#10121A',
        surface: '#171A24',
        surfaceRaised: '#1F2330',
        border: '#2A2E3D',
        text: '#F3EFE6',
        muted: '#9CA0B3',
        accent: '#E8A33D',
        accentMuted: '#7A5A28',
        playing: '#4FB8A6',
        dropped: '#C9636B'
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace']
      },
      borderRadius: {
        card: '10px'
      }
    }
  },
  plugins: []
};

export default config;
