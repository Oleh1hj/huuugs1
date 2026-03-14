import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { NavBar } from './NavBar';
import { Particles } from '@/components/Particles';
import { MatchModal } from '@/components/MatchModal';
import { Avatar } from '@/components/ui/Avatar';
import { useUiTranslations } from '@/i18n';
import { theme, g } from '@/styles/theme';
import { chatsApi } from '@/api/chats.api';
import { likesApi } from '@/api/likes.api';

export function Layout() {
  const { user } = useAuthStore();
  const { lang, setLang } = useUiStore();
  const matchNotif = useUiStore((s) => s.matchNotif);
  const t = useUiTranslations();
  const navigate = useNavigate();

  // For tab badge (document.title)
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatsApi.getConversations,
    refetchInterval: 30_000,
    enabled: !!user,
  });

  const { data: whoLiked = [] } = useQuery({
    queryKey: ['likes', 'received'],
    queryFn: likesApi.getReceived,
    refetchInterval: 60_000,
    enabled: !!user,
  });

  const unreadChats = conversations.filter(
    (c) => c.lastMessage && !c.lastMessage.isRead && c.lastMessage.senderId !== user?.id,
  ).length;

  const seenCount = parseInt(localStorage.getItem('huugs_likes_seen') ?? '0');
  const newLikes = Math.max(0, whoLiked.length - seenCount);
  const totalBadge = unreadChats + newLikes;

  useEffect(() => {
    document.title = totalBadge > 0 ? `(${totalBadge}) Huugs` : 'Huugs';
  }, [totalBadge]);

  return (
    <div style={{
      minHeight: '100dvh',
      background: g.bg,
      fontFamily: theme.fonts.serif,
      color: theme.colors.text,
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* Ambient glows */}
      <div style={{ position: 'fixed', borderRadius: '50%', filter: 'blur(70px)', pointerEvents: 'none', zIndex: 0, width: 320, height: 320, top: -90, right: -90, background: 'rgba(86,171,145,0.07)' }} />
      <div style={{ position: 'fixed', borderRadius: '50%', filter: 'blur(70px)', pointerEvents: 'none', zIndex: 0, width: 260, height: 260, bottom: 80, left: -70, background: 'rgba(249,217,118,0.05)' }} />
      <Particles />

      {/* Match popup */}
      {matchNotif && <MatchModal />}

      <div style={{ maxWidth: 430, minHeight: '100dvh', margin: '0 auto', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <header style={{ padding: '16px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 4 }}>
            {/* Logo */}
            <div>
              <h1 style={{
                fontFamily: theme.fonts.serif, fontSize: 32, fontWeight: 600, letterSpacing: '-0.5px', lineHeight: 1,
                background: g.text, backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                animation: 'shimmer 4s linear infinite',
              }}>Huugs</h1>
              <p style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.textFaint, letterSpacing: 2.5, textTransform: 'uppercase', marginTop: 3 }}>
                {t.tagline}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Coins button */}
              {user && (
                <button
                  onClick={() => navigate('/coins')}
                  style={{ background: 'rgba(249,217,118,0.08)', border: '1px solid rgba(249,217,118,0.25)', borderRadius: 50, padding: '6px 12px', fontFamily: theme.fonts.sans, fontSize: 13, fontWeight: 700, color: '#f9d976', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  🪙 {user.coins ?? 0}
                </button>
              )}

              {/* Lang switcher */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 50, padding: 3, gap: 2, border: `1px solid ${theme.colors.glassBorder}` }}>
                {(['ua', 'by', 'pl', 'en'] as const).map((code) => (
                  <button key={code} onClick={() => setLang(code)} style={{
                    background: lang === code ? 'rgba(86,171,145,0.35)' : 'transparent',
                    border: 'none', borderRadius: 50, width: 34, height: 34,
                    fontSize: 18, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: lang === code ? '0 0 12px rgba(86,171,145,0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}>{code === 'ua' ? '🇺🇦' : code === 'by' ? '🇧🇾' : code === 'pl' ? '🇵🇱' : '🇬🇧'}</button>
                ))}
              </div>

              {/* Avatar → profile */}
              {user && (
                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/profile')} title={t.profile}>
                  <Avatar photo={user.photo} name={user.name} size={38} border={`2px solid ${theme.colors.green.mid}`} />
                  {user.isPremium && (
                    <div style={{ position: 'absolute', top: -4, right: -4, background: '#f9d976', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, border: '2px solid #0d2137' }}>⭐</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Nav */}
          <div style={{ marginTop: 14, marginBottom: 0 }}>
            <NavBar />
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '20px 16px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
