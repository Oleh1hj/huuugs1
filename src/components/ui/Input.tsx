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
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 6,
        }}>{label}</div>
      )}
      <input
        ref={ref}
        style={{
          display: 'block', width: '100%',
          padding: '13px 16px',
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${error ? 'rgba(255,69,120,0.5)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 14,
          fontSize: 14, fontFamily: theme.fonts.sans, color: '#fff',
          boxSizing: 'border-box',
          ...style,
        }}
        {...rest}
      />
      {error && (
        <div style={{ fontFamily: theme.fonts.sans, fontSize: 11, color: '#FF8FB1', marginTop: 4 }}>
          {error}
        </div>
      )}
    </div>
  ),
);
