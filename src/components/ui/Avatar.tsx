import { CSSProperties } from 'react';
import { theme } from '@/styles/theme';
import { getInitials } from '@/utils';

interface Props {
  photo?: string | null;
  name: string;
  size?: number;
  border?: string;
  style?: CSSProperties;
}

export function Avatar({ photo, name, size = 48, border, style }: Props) {
  const base: CSSProperties = {
    width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
    border: border ?? `2px solid ${theme.colors.glassBorderActive}`,
    background: theme.colors.glass,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: theme.fonts.serif, fontSize: size * 0.35, color: theme.colors.green.mid,
    ...style,
  };

  if (photo) {
    return <img src={photo} alt={name} style={{ ...base, display: 'block' }} />;
  }

  return <div style={base}>{getInitials(name)}</div>;
}
