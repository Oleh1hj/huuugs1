import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { chatsApi } from '@/api/chats.api';
import { supportApi } from '@/api/support.api';
import { useUiTranslations } from '@/i18n';
import { theme } from '@/styles/theme';

export function NavBar() {
  const t = useUiTranslations();
  const tabs = [
    { to: '/search',  icon: '✦', label: t.search   },
    { to: '/likes',   icon: '❤', label: t.liked    },
    { to: '/chats',   icon: '💬', label: t.chats   },
    { to: '/support', icon: '🛟', label: t.support  },
    { to: '/profile', icon: '◎', label: t.profile  },
  ];
  const { user } = useAuthStore();

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatsApi.getConversations,
    refetchInterval: 30_000,
  });

  const { data: supportUnread } = useQuery({
    queryKey: ['support', 'unread', user?.isAdmin],
    queryFn: user?.isAdmin ? supportApi.getAdminUnread : supportApi.getUnread,
    refetchInterval: 10_000,
    enabled: !!user,
  });

  const badges: Record<string, number> = {
    '/chats': conversations?.length ?? 0,
    '/support': supportUnread?.count ?? 0,
  };

  return (
    <nav style={{
      display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4,
      background: 'rgba(255,255,255,0.04)',
      borderRadius: theme.radius.lg, padding: 5,
      border: `1px solid ${theme.colors.glassBorder}`,
    }}>
      {tabs.map(({ to, icon, label }) => (
        <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <div style={{
              background: isActive ? 'linear-gradient(135deg,rgba(86,171,145,0.45),rgba(56,141,115,0.45))' : 'transparent',
              borderRadius: 13, padding: '9px 2px',
              color: isActive ? theme.colors.green.light : theme.colors.textFaint,
              fontFamily: theme.fonts.sans, fontSize: 10,
              fontWeight: isActive ? 700 : 400,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              boxShadow: isActive ? '0 2px 14px rgba(86,171,145,0.18)' : 'none',
              transition: 'all 0.2s', position: 'relative',
            }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              {label}
              {(badges[to] ?? 0) > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  background: to === '/support' ? '#f97316' : theme.colors.green.mid,
                  borderRadius: '50%',
                  width: 15, height: 15, fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', border: '1.5px solid #0d2137',
                }}>{badges[to]}</span>
              )}
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
