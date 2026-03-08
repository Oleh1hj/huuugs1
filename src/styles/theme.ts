export const theme = {
  colors: {
    bg: '#0a1628',
    bgMid: '#0d2137',
    bgGreen: '#112b1e',
    green: { light: '#a8e6cf', mid: '#56ab91', dark: '#388d73' },
    yellow: '#f9d976',
    text: '#e8f4e8',
    textMuted: 'rgba(168,230,207,0.5)',
    textFaint: 'rgba(168,230,207,0.28)',
    glass: 'rgba(255,255,255,0.06)',
    glassBorder: 'rgba(168,230,207,0.09)',
    glassBorderActive: 'rgba(86,171,145,0.35)',
  },
  fonts: {
    serif: "'Cormorant Garamond', Georgia, serif",
    sans: "'Nunito', sans-serif",
  },
  radius: { sm: 10, md: 16, lg: 24, xl: 28, full: 9999 },
  shadow: {
    card: '0 4px 24px rgba(0,0,0,0.28)',
    cardActive: '0 8px 32px rgba(86,171,145,0.2)',
    green: '0 4px 20px rgba(86,171,145,0.35)',
  },
} as const;

// Gradient helpers
export const g = {
  greenBtn: 'linear-gradient(135deg,#56ab91,#388d73)',
  card: 'linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))',
  cardHover: 'linear-gradient(145deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))',
  text: 'linear-gradient(90deg,#a8e6cf 0%,#56ab91 40%,#f9d976 60%,#a8e6cf 100%)',
  bg: 'linear-gradient(160deg,#0a1628 0%,#0d2137 40%,#112b1e 100%)',
  overlay: 'linear-gradient(to bottom,transparent 40%,rgba(8,20,14,0.85) 100%)',
  match: 'linear-gradient(145deg,rgba(86,171,145,0.15),rgba(56,141,115,0.08))',
} as const;
