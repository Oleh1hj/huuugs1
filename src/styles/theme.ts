export const theme = {
  colors: {
    bg: '#0d0618',
    bgMid: '#1a0a2e',
    green: { light: '#FF8FB1', mid: '#FF4578', dark: '#C850C0' },
    yellow: '#FFD166',
    text: '#ffffff',
    textMuted: 'rgba(255,255,255,0.5)',
    textFaint: 'rgba(255,255,255,0.28)',
    glass: 'rgba(255,255,255,0.06)',
    glassBorder: 'rgba(255,255,255,0.1)',
    glassBorderActive: 'rgba(255,69,120,0.4)',
  },
  fonts: {
    serif: "'Cormorant Garamond', Georgia, serif",
    sans: "'Inter', 'Nunito', sans-serif",
  },
  radius: { sm: 10, md: 16, lg: 24, xl: 28, full: 9999 },
  shadow: {
    card: '0 4px 24px rgba(0,0,0,0.4)',
    cardActive: '0 8px 32px rgba(255,69,120,0.25)',
    green: '0 8px 24px rgba(255,69,120,0.35)',
  },
} as const;

// Gradient helpers
export const g = {
  greenBtn: 'linear-gradient(135deg,#FF4578 0%,#C850C0 50%,#4158D0 100%)',
  card: 'rgba(255,255,255,0.05)',
  cardHover: 'rgba(255,255,255,0.08)',
  text: 'linear-gradient(135deg,#FF8FB1 0%,#FF4578 35%,#C850C0 65%,#a78bfa 100%)',
  bg: 'linear-gradient(160deg,#0d0618 0%,#1a0a2e 50%,#0d0618 100%)',
  overlay: 'linear-gradient(to top,rgba(13,6,24,0.98) 0%,rgba(13,6,24,0.7) 50%,transparent 100%)',
  match: 'linear-gradient(135deg,rgba(255,69,120,0.15),rgba(200,80,192,0.08))',
} as const;
