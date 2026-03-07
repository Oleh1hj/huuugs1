import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useUiTranslations } from '@/i18n';
import { chatsApi } from '@/api/chats.api';
import { theme } from '@/styles/theme';

const tabs = [
  { to: '/search',  icon: '✦', key: 'search'  as const },
  { to: '/likes',   icon: '❤', key: 'liked'   as const },
  { to: '/chats',   icon: '💬', key: 'chats'   as const },
  { to: '/profile', icon: '◎', key: 'profile' as const },
];

export function NavBar() {
  const t = useUiTranslations();
  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatsApi.getConversations,
    refetchInterval: 30_000,
  });

  const labels: Record<string, string> = {
    search: t.search, liked: t.liked, chats: t.chats, profile: t.profile,
  };

  return (
    <nav style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5,
      background: 'rgba(255,255,255,0.04)',
      borderRadius: theme.radius.lg, padding: 5,
      border: `1px solid ${theme.colors.glassBorder}`,
    }}>
      {tabs.map(({ to, icon, key }) => (
        <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <div style={{
              background: isActive ? 'linear-gradient(135deg,rgba(86,171,145,0.45),rgba(56,141,115,0.45))' : 'transparent',
              borderRadius: 13, padding: '9px 4px',
              color: isActive ? theme.colors.green.light : theme.colors.textFaint,
              fontFamily: theme.fonts.sans, fontSize: 11,
              fontWeight: isActive ? 700 : 400,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              boxShadow: isActive ? '0 2px 14px rgba(86,171,145,0.18)' : 'none',
              transition: 'all 0.2s', position: 'relative',
            }}>
              <span style={{ fontSize: 15 }}>{icon}</span>
              {labels[key]}
              {key === 'chats' && (conversations?.length ?? 0) > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 8,
                  background: theme.colors.green.mid, borderRadius: '50%',
                  width: 16, height: 16, fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', border: '1.5px solid #0d2137',
                }}>{conversations!.length}</span>
              )}
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
