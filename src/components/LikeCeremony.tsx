import { useEffect, useRef, useState } from 'react';
import { useUiStore } from '@/store/ui.store';

const TEXTS: Array<{ icon: string; text: (name: string) => string }> = [
  { icon: '🤍', text: (n) => `"${n} думала про тебе сьогодні"` },
  { icon: '🌙', text: (n) => `"${n} зупинилась на твоєму фото"` },
  { icon: '✨', text: (n) => `"${n} хоче познайомитись з тобою"` },
  { icon: '🌊', text: (n) => `"${n} відчула щось побачивши тебе"` },
  { icon: '🕯️', text: (n) => `"${n} помітила тебе серед усіх"` },
  { icon: '🌿', text: (n) => `"${n} сподівається що ти напишеш"` },
  { icon: '🫧', text: (n) => `"${n} посміхнулась коли побачила тебе"` },
  { icon: '🌸', text: (n) => `"${n} вибрала тебе сьогодні"` },
  { icon: '💫', text: (n) => `"${n} хотіла б тебе обійняти"` },
  { icon: '🤍', text: (n) => `"${n} ще не знає тебе — але вже хоче"` },
];

export function LikeCeremony() {
  const { likeQueue, dequeueLike } = useUiStore();
  const notif = likeQueue[0];
  const [phase, setPhase] = useState<'in' | 'visible' | 'out'>('in');
  const [variant] = useState(() => TEXTS[Math.floor(Math.random() * TEXTS.length)]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    // in → visible after overlay fades in
    const t1 = setTimeout(() => setPhase('visible'), 600);
    // visible → out after 3s
    const t2 = setTimeout(() => setPhase('out'), 3600);
    // out → dequeue after fade-out
    timerRef.current = setTimeout(() => dequeueLike(), 4200);

    return () => {
      document.body.style.overflow = '';
      clearTimeout(t1);
      clearTimeout(t2);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('out');
    setTimeout(() => dequeueLike(), 600);
  };

  if (!notif) return null;

  const opacity = phase === 'out' ? 0 : 1;

  return (
    <>
      <style>{`
        @keyframes ceremony-ripple {
          0%   { transform: translate(-50%, -50%) scale(0.1); opacity: 0.7; }
          100% { transform: translate(-50%, -50%) scale(4);   opacity: 0; }
        }
        @keyframes ceremony-content-rise {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ceremony-glow-pulse {
          0%, 100% { box-shadow: 0 0 22px 8px rgba(255,140,177,0.45); }
          50%       { box-shadow: 0 0 42px 18px rgba(255,140,177,0.7); }
        }
      `}</style>

      {/* Overlay */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(13,6,24,0.88)',
          transition: 'opacity 0.6s ease',
          opacity,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* Ripple rings */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%', top: '50%',
              width: 150, height: 150,
              borderRadius: '50%',
              border: `1.5px solid ${i % 2 === 0 ? 'rgba(255,140,177,0.55)' : 'rgba(249,217,118,0.45)'}`,
              animation: `ceremony-ripple 3.8s ease-out ${i * 0.75}s infinite`,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Content */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 16, padding: '0 36px', maxWidth: 320,
            position: 'relative', zIndex: 2,
            animation: phase !== 'in' ? 'ceremony-content-rise 0.7s ease both' : undefined,
            opacity: phase === 'in' ? 0 : 1,
          }}
        >
          {/* Photo */}
          <div
            style={{
              width: 120, height: 120, borderRadius: '50%',
              overflow: 'hidden', flexShrink: 0,
              animation: 'ceremony-glow-pulse 2.6s ease-in-out infinite',
              border: '2px solid rgba(255,140,177,0.6)',
            }}
          >
            {notif.fromPhoto
              ? <img src={notif.fromPhoto} alt={notif.fromName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (
                <div style={{
                  width: '100%', height: '100%',
                  background: 'linear-gradient(135deg,#FF8FB1,#C850C0)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 44, fontWeight: 700, color: '#fff',
                }}>
                  {notif.fromName[0]?.toUpperCase()}
                </div>
              )
            }
          </div>

          {/* Name */}
          <div style={{ fontSize: 22, fontWeight: 600, color: '#fff', letterSpacing: '-0.3px', textAlign: 'center' }}>
            {notif.fromName}
          </div>

          {/* Icon */}
          <div style={{ fontSize: 26, lineHeight: 1 }}>{variant.icon}</div>

          {/* Quote text */}
          <div style={{
            fontSize: 15, color: 'rgba(255,255,255,0.72)',
            fontStyle: 'italic', textAlign: 'center', lineHeight: 1.65,
            fontFamily: "'Cormorant Garamond', serif",
            letterSpacing: '0.2px',
          }}>
            {variant.text(notif.fromName)}
          </div>
        </div>

        {/* Close — bottom right, small and unobtrusive */}
        <button
          onClick={(e) => { e.stopPropagation(); dismiss(); }}
          style={{
            position: 'absolute', bottom: 40, right: 32,
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.3)', fontSize: 22,
            cursor: 'pointer', padding: 8, lineHeight: 1,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)'; }}
        >
          ✕
        </button>
      </div>
    </>
  );
}
