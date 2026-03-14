import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { chatsApi } from '@/api/chats.api';
import { likesApi } from '@/api/likes.api';
import { supportApi } from '@/api/support.api';
import { groupsApi } from '@/api/groups.api';
import { useUiTranslations } from '@/i18n';

const LIKES_SEEN_KEY = 'huugs_likes_seen';

export function NavBar() {
  const t = useUiTranslations();
  const location = useLocation();
  const tabs = [
    { to: '/search',  icon: '🔍', label: t.search  },
    { to: '/likes',   icon: '💘', label: t.liked   },
    { to: '/bottle',  icon: '🍾', label: 'Гра'     },
    { to: '/chats',   icon: '💬', label: t.chats   },
    { to: '/profile', icon: '👤', label: t.profile  },
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

  const seenCount = parseInt(localStorage.getItem(LIKES_SEEN_KEY) ?? '0');
  const newLikes = Math.max(0, whoLiked.length - seenCount);

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

  // Extra tabs for more menu (groups, support) shown as secondary row or not shown
  // For now: main 5 tabs in bottom nav
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0, left: '50%',
      transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      padding: '10px 16px 20px',
      background: 'rgba(13,6,24,0.95)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(20px)',
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        {tabs.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '8px 14px', borderRadius: 14, cursor: 'pointer',
                position: 'relative', transition: 'all 0.2s', minWidth: 52,
                background: isActive ? 'linear-gradient(135deg,rgba(255,69,120,0.15),rgba(200,80,192,0.1))' : 'transparent',
              }}>
                <span style={{
                  fontSize: 20, lineHeight: 1,
                  filter: isActive ? 'drop-shadow(0 0 8px rgba(255,69,120,0.6))' : 'none',
                }}>{icon}</span>
                <span style={{
                  fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
                  color: isActive ? '#FF8FB1' : 'rgba(255,255,255,0.3)',
                  fontFamily: 'Inter, sans-serif',
                }}>{label}</span>
                {(badges[to] ?? 0) > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 8,
                    background: to === '/chats' ? '#a78bfa' : '#FF4578',
                    borderRadius: '50%',
                    width: 16, height: 16,
                    fontSize: 9, fontWeight: 800, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1.5px solid #0d0618',
                  }}>{badges[to]}</span>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
