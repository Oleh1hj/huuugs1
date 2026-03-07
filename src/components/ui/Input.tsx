import { InputHTMLAttributes, forwardRef } from 'react';
import { theme } from '@/styles/theme';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, style, ...rest }, ref) => (
    <div style={{ marginBottom: 2 }}>
      {label && (
        <div style={{
          fontFamily: theme.fonts.sans, fontSize: 10, letterSpacing: 2,
          textTransform: 'uppercase', color: theme.colors.textFaint, marginBottom: 6,
        }}>{label}</div>
      )}
      <input
        ref={ref}
        style={{
          display: 'block', width: '100%',
          padding: '12px 16px',
          background: theme.colors.glass,
          border: `1.5px solid ${error ? 'rgba(220,39,67,0.5)' : theme.colors.glassBorder}`,
          borderRadius: theme.radius.md,
          fontSize: 15, fontFamily: theme.fonts.sans, color: theme.colors.text,
          ...style,
        }}
        {...rest}
      />
      {error && (
        <div style={{ fontFamily: theme.fonts.sans, fontSize: 11, color: '#ff6b8a', marginTop: 4 }}>
          {error}
        </div>
      )}
    </div>
  ),
);
