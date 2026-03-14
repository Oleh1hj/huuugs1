import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';

export function MatchModal() {
  const { matchNotif, dismissMatch } = useUiStore();
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const [exiting, setExiting] = useState(false);

  // Prevent body scroll when open
  useEffect(() => {
    if (matchNotif) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [matchNotif]);

  if (!matchNotif) return null;

  const myPhoto = me?.photos?.[0] ?? me?.photo ?? null;
  const partnerPhoto = matchNotif.partnerPhoto;

  const handleChat = () => {
    setExiting(true);
    setTimeout(() => {
      dismissMatch();
      navigate(`/chats/${matchNotif.conversationId}`);
    }, 350);
  };

  const handleKeepSwiping = () => {
    setExiting(true);
    setTimeout(() => {
      dismissMatch();
      navigate('/likes');
    }, 350);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: '#000',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.35s ease',
      }}
    >
      {/* Ambient glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,69,120,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Photos */}
      <div style={{
        position: 'relative',
        width: 320, height: 260,
        marginBottom: 40,
        flexShrink: 0,
      }}>
        {/* Left photo (me) */}
        <div style={{
          position: 'absolute',
          left: 0, top: 0,
          width: 175, height: 230,
          borderRadius: 24,
          overflow: 'hidden',
          border: '3px solid #fff',
          transform: 'rotate(-6deg) translateX(-10px)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          background: 'linear-gradient(135deg, rgba(255,69,120,0.3), rgba(65,88,208,0.3))',
          zIndex: 1,
        }}>
          {myPhoto
            ? <img src={myPhoto} alt="Ти" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50 }}>👤</div>
          }
        </div>

        {/* Heart in the middle */}
        <div style={{
          position: 'absolute',
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          width: 48, height: 48,
          background: 'linear-gradient(135deg,#FF4578,#C850C0)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
          boxShadow: '0 0 20px rgba(255,69,120,0.6)',
          animation: 'heartPop 0.6s ease, pulse 2s 0.6s infinite',
        }}>💗</div>

        {/* Right photo (partner) */}
        <div style={{
          position: 'absolute',
          right: 0, top: 0,
          width: 175, height: 230,
          borderRadius: 24,
          overflow: 'hidden',
          border: '3px solid #fff',
          transform: 'rotate(6deg) translateX(10px)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          background: 'linear-gradient(135deg, rgba(200,80,192,0.3), rgba(255,69,120,0.3))',
          zIndex: 2,
        }}>
          {partnerPhoto
            ? <img src={partnerPhoto} alt={matchNotif.partnerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50 }}>👤</div>
          }
        </div>
      </div>

      {/* "match" text */}
      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 72, fontWeight: 700,
        color: '#fff',
        letterSpacing: '-2px',
        lineHeight: 1,
        marginBottom: 14,
        textAlign: 'center',
        textShadow: '0 0 40px rgba(255,69,120,0.4)',
        animation: 'fadeUp 0.5s 0.15s ease both',
      }}>
        match
      </div>

      {/* Subtitle */}
      <div style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 14, color: 'rgba(255,255,255,0.6)',
        textAlign: 'center', lineHeight: 1.6,
        maxWidth: 260, marginBottom: 60,
        animation: 'fadeUp 0.5s 0.25s ease both',
      }}>
        Ти і <strong style={{ color: '#FF8FB1' }}>{matchNotif.partnerName}</strong> сподобались одне одному ✨
      </div>

      {/* Buttons */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '0 24px 44px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        animation: 'fadeUp 0.5s 0.35s ease both',
      }}>
        {/* Chat now */}
        <button
          onClick={handleChat}
          style={{
            width: '100%', maxWidth: 340,
            padding: '17px',
            borderRadius: 18,
            background: 'linear-gradient(135deg,#FF4578 0%,#C850C0 50%,#4158D0 100%)',
            border: 'none',
            color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 800,
            letterSpacing: '1.5px', textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(255,69,120,0.45)',
          }}
        >
          НАПИСАТИ ЗАРАЗ
        </button>

        {/* Keep swiping */}
        <button
          onClick={handleKeepSwiping}
          style={{
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.55)',
            fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
            letterSpacing: '1px', textTransform: 'uppercase',
            textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.25)',
            cursor: 'pointer',
            padding: '8px 16px',
          }}
        >
          ПРОДОВЖИТИ ПЕРЕГЛЯД
        </button>
      </div>
    </div>
  );
}
