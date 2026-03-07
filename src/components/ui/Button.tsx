import { ButtonHTMLAttributes, ReactNode } from 'react';
import { theme, g } from '@/styles/theme';

type Variant = 'primary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
}

const variants: Record<Variant, object> = {
  primary: {
    background: g.greenBtn,
    color: '#fff',
    border: 'none',
    boxShadow: theme.shadow.green,
  },
  ghost: {
    background: 'transparent',
    color: theme.colors.green.mid,
    border: `1.5px solid ${theme.colors.glassBorderActive}`,
  },
  danger: {
    background: 'rgba(220,39,67,0.15)',
    color: '#ff6b8a',
    border: '1.5px solid rgba(220,39,67,0.3)',
  },
};

const sizes: Record<Size, object> = {
  sm: { padding: '8px 18px', fontSize: 12, borderRadius: 50 },
  md: { padding: '12px 24px', fontSize: 14, borderRadius: theme.radius.md },
  lg: { padding: '15px', fontSize: 15, borderRadius: theme.radius.md },
};

export function Button({ variant = 'primary', size = 'md', loading, children, fullWidth, style, disabled, ...rest }: Props) {
  return (
    <button
      disabled={disabled || loading}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: theme.fonts.sans, fontWeight: 700, cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'all 0.2s',
        width: fullWidth ? '100%' : undefined,
        ...variants[variant],
        ...sizes[size],
        ...style,
      }}
      {...rest}
    >
      {loading ? '⏳' : children}
    </button>
  );
}
