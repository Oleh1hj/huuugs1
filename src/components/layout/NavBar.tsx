import { NavLink, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { chatsApi } from '@/api/chats.api';
import { likesApi } from '@/api/likes.api';
import { supportApi } from '@/api/support.api';
import { groupsApi } from '@/api/groups.api';
import { useUiTranslations } from '@/i18n';
import { theme } from '@/styles/theme';

const LIKES_SEEN_KEY = 'huugs_likes_seen';

export function NavBar() {
  const t = useUiTranslations();
  const location = useLocation();
  const tabs = [
    { to: '/search',  icon: '✦',  label: t.search  },
    { to: '/likes',   icon: '❤',  label: t.liked   },
    { to: '/bottle',  icon: '🍾', label: 'Гра'     },
    { to: '/chats',   icon: '💬', label: t.chats   },
    { to: '/groups',  icon: '👥', label: 'Групи'   },
    { to: '/support', icon: '🛟', label: t.support  },
    { to: '/profile', icon: '◎',  label: t.profile  },
  ];
  const { user } = useAuthStore();

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatsApi.getConversations,
    refetchInterval: 30_000,
  });

  const { data: whoLiked = [] } = useQuery({
    queryKey: ['likes', 'received'],
    queryFn: likesApi.getReceived,
    refetchInterval: 60_000,
    enabled: !!user,
  });

  const { data: supportUnread } = useQuery({
    queryKey: ['support', 'unread', user?.isAdmin],
    queryFn: user?.isAdmin ? supportApi.getAdminUnread : supportApi.getUnread,
    refetchInterval: 10_000,
    enabled: !!user,
  });

  const { data: groupInvites = [] } = useQuery({
    queryKey: ['group-invites'],
    queryFn: groupsApi.getMyInvites,
    refetchInterval: 30_000,
    enabled: !!user,
  });

  // Likes badge: how many received likes since user last visited LikesPage
  const seenCount = parseInt(localStorage.getItem(LIKES_SEEN_KEY) ?? '0');
  const newLikes = Math.max(0, whoLiked.length - seenCount);

  // When user visits LikesPage, mark all as seen
  useEffect(() => {
    if (location.pathname === '/likes' && whoLiked.length > 0) {
      localStorage.setItem(LIKES_SEEN_KEY, String(whoLiked.length));
    }
  }, [location.pathname, whoLiked.length]);

  const unreadChats = conversations?.filter(
    (c) => c.lastMessage && !c.lastMessage.isRead && c.lastMessage.senderId !== user?.id,
  ).length ?? 0;

  const badges: Record<string, number> = {
    '/likes': newLikes,
    '/chats': unreadChats,
    '/groups': groupInvites.length,
    '/support': supportUnread?.count ?? 0,
  };

  return (
    <nav style={{
      display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2,
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
                  background: to === '/support' ? '#f97316' : to === '/likes' ? '#e11d48' : theme.colors.green.mid,
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
