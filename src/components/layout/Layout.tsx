import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { NavBar } from './NavBar';
import { MatchModal } from '@/components/MatchModal';
import { WelcomeModal, shouldShowWelcome, incrementWelcomeCount } from '@/components/WelcomeModal';
import { Avatar } from '@/components/ui/Avatar';
import { useUiTranslations } from '@/i18n';
import { chatsApi } from '@/api/chats.api';
import { likesApi } from '@/api/likes.api';

export function Layout() {
  const { user } = useAuthStore();
  const { lang, setLang } = useUiStore();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => shouldShowWelcome());
  const matchNotif = useUiStore((s) => s.matchNotif);

  useEffect(() => {
    if (showWelcome) {
      incrementWelcomeCount();
    }
  }, [showWelcome]);
  const t = useUiTranslations();
  const navigate = useNavigate();

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
      background: '#0d0618',
      fontFamily: "'Inter', sans-serif",
      color: '#fff',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* Ambient glows */}
      <div style={{ position: 'fixed', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0, width: 350, height: 350, top: -100, right: -100, background: 'rgba(255,69,120,0.08)' }} />
      <div style={{ position: 'fixed', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0, width: 280, height: 280, bottom: 100, left: -80, background: 'rgba(168,85,247,0.08)' }} />

      {/* Match popup */}
      {matchNotif && <MatchModal />}

      {/* Welcome modal — first 3 visits */}
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}

      <div style={{ maxWidth: 430, minHeight: '100dvh', margin: '0 auto', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <header style={{
          padding: '14px 20px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(13,6,24,0.9)',
          backdropFilter: 'blur(20px)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          {/* Logo */}
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 30, fontWeight: 600,
            background: 'linear-gradient(135deg,#FF8FB1,#FF4578,#C850C0)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', letterSpacing: '-0.5px', lineHeight: 1,
          }}>Huugs</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Admin button */}
            {user?.isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 50, padding: '6px 12px', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: '#c084fc', cursor: 'pointer' }}
              >
                ⚙️ Адмін
              </button>
            )}

            {/* Coins */}
            {user && (
              <button
                onClick={() => navigate('/coins')}
                style={{
                  background: 'rgba(255,209,102,0.1)',
                  border: '1px solid rgba(255,209,102,0.25)',
                  borderRadius: 50, padding: '5px 10px',
                  fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: '#FFD166',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                🪙 {user.coins ?? 0}
              </button>
            )}

            {/* Lang switcher */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowLangMenu((s) => !s)}
                style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: 20, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {lang === 'ua' ? '🇺🇦' : lang === 'by' ? '🇧🇾' : lang === 'pl' ? '🇵🇱' : '🇬🇧'}
              </button>
              {showLangMenu && (
                <div style={{ position: 'absolute', top: 44, right: 0, background: 'rgba(13,6,24,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 6, display: 'flex', flexDirection: 'column', gap: 2, zIndex: 100, backdropFilter: 'blur(12px)' }}>
                  {(['ua', 'by', 'pl', 'en'] as const).map((code) => (
                    <button key={code} onClick={() => { setLang(code); setShowLangMenu(false); }} style={{ background: lang === code ? 'rgba(255,69,120,0.2)' : 'transparent', border: 'none', borderRadius: 10, width: 38, height: 38, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                      {code === 'ua' ? '🇺🇦' : code === 'by' ? '🇧🇾' : code === 'pl' ? '🇵🇱' : '🇬🇧'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Avatar → profile */}
            {user && (
              <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate('/profile')} title={t.profile}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: 'linear-gradient(135deg,#FF4578,#C850C0)',
                  border: '2px solid rgba(255,69,120,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {user.photo
                    ? <img src={user.photo} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{user.name[0]?.toUpperCase()}</span>
                  }
                </div>
                {user.isPremium && (
                  <div style={{ position: 'absolute', top: -4, right: -4, background: '#FFD166', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, border: '2px solid #0d0618' }}>⭐</div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '16px 16px 90px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <NavBar />
      </div>
    </div>
  );
}
