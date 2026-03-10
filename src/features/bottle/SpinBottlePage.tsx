import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { theme, g } from '@/styles/theme';

interface SpinResult {
  spinId: string;
  spinnerId: string;
  spinnerName: string;
  spinnerPhoto: string | null;
  targetId: string;
  targetName: string;
  targetPhoto: string | null;
}

export function SpinBottlePage() {
  const me = useAuthStore((s) => s.user);
  const showMatch = useUiStore((s) => s.showMatch);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [spinning, setSpinning] = useState(false);
  const [spinKey, setSpinKey] = useState(0); // increment to re-trigger animation
  const [result, setResult] = useState<SpinResult | null>(null);
  const [heartSent, setHeartSent] = useState(false);
  const [noTargets, setNoTargets] = useState(false);

  const clearTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onResult = (data: SpinResult) => {
      setSpinning(false);
      setResult(data);
      setHeartSent(false);
      setNoTargets(false);
      clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(() => setResult(null), 60_000);
    };

    const onNoTargets = () => {
      setSpinning(false);
      setNoTargets(true);
    };

    socket.on('bottle:result', onResult);
    socket.on('bottle:no-targets', onNoTargets);

    return () => {
      socket.off('bottle:result', onResult);
      socket.off('bottle:no-targets', onNoTargets);
      clearTimeout(clearTimer.current);
    };
  }, []);

  const handleSpin = () => {
    const socket = getSocket();
    if (!socket || spinning) return;
    setSpinning(true);
    setNoTargets(false);
    setResult(null);
    setSpinKey((k) => k + 1); // re-trigger CSS animation
    socket.emit('bottle:spin');

    // Safety fallback: stop spinner state after 5s if server doesn't respond
    setTimeout(() => setSpinning(false), 5000);
  };

  const handleHeart = () => {
    if (!result || heartSent) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit('bottle:heart', { spinId: result.spinId, targetId: result.targetId });
    setHeartSent(true);
  };

  const isSpinner = result?.spinnerId === me?.id;
  const isTarget = result?.targetId === me?.id;

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, paddingBottom: 40 }}>

      {/* Title */}
      <div style={{ textAlign: 'center', marginTop: 4 }}>
        <div style={{ fontFamily: theme.fonts.serif, fontSize: 30, color: theme.colors.text, letterSpacing: 0.5 }}>
          Пляшечка 🍾
        </div>
        <div style={{ fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.textFaint, marginTop: 5, lineHeight: 1.6 }}>
          Крутни — пляшка вибере когось з онлайн
        </div>
      </div>

      {/* Bottle visual + spin area */}
      <div style={{
        position: 'relative', width: 200, height: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(86,171,145,0.04)',
        borderRadius: '50%',
        border: `1px solid rgba(86,171,145,0.12)`,
      }}>
        {/* Decorative ring */}
        <div style={{
          position: 'absolute', inset: -8,
          borderRadius: '50%',
          border: `1px dashed rgba(86,171,145,0.15)`,
        }} />

        {/* Bottle emoji — key resets animation on each spin */}
        <span
          key={spinKey}
          className={spinning ? 'bottle-spinning' : ''}
          style={{
            fontSize: 72,
            display: 'inline-block',
            userSelect: 'none',
            filter: !spinning && result ? 'drop-shadow(0 0 16px rgba(249,217,118,0.5))' : undefined,
          }}
        >
          🍾
        </span>
      </div>

      {/* Spin button */}
      <Button
        onClick={handleSpin}
        loading={spinning}
        style={{
          padding: '14px 52px', fontSize: 16, borderRadius: 20,
          background: spinning ? 'rgba(86,171,145,0.2)' : g.greenBtn,
          border: spinning ? `1.5px solid ${theme.colors.glassBorderActive}` : 'none',
          color: spinning ? theme.colors.green.light : '#fff',
          fontWeight: 700,
        }}
      >
        {spinning ? '🍾 Крутиться...' : '🍾 Крутити!'}
      </Button>

      {/* No online targets */}
      {noTargets && (
        <div className="fade-up" style={{
          textAlign: 'center', background: g.card, borderRadius: 20,
          padding: '20px 28px', border: `1px solid ${theme.colors.glassBorder}`,
          fontFamily: theme.fonts.sans, fontSize: 14, color: theme.colors.textMuted,
          lineHeight: 1.6,
        }}>
          😔 Зараз немає онлайн-користувачів протилежної статі
          <div style={{ fontSize: 12, marginTop: 6, color: theme.colors.textFaint }}>
            Спробуй пізніше, коли більше людей онлайн
          </div>
        </div>
      )}

      {/* Spin result — visible to ALL online users */}
      {result && (
        <div className="fade-up" style={{
          width: '100%',
          background: 'linear-gradient(145deg,rgba(86,171,145,0.1),rgba(56,141,115,0.05))',
          borderRadius: 24, padding: '28px 20px',
          border: `1px solid rgba(86,171,145,0.3)`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        }}>
          <div style={{
            fontFamily: theme.fonts.sans, fontSize: 10, letterSpacing: 3,
            textTransform: 'uppercase', color: theme.colors.textFaint,
          }}>
            Пляшка впала
          </div>

          {/* Spinner → Target */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Spinner */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => navigate(`/users/${result.spinnerId}`)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
              >
                <Avatar
                  photo={result.spinnerPhoto}
                  name={result.spinnerName}
                  size={68}
                  border={`2.5px solid ${theme.colors.green.mid}`}
                />
                <span style={{ fontFamily: theme.fonts.serif, fontSize: 17, color: theme.colors.text }}>
                  {result.spinnerName}
                </span>
              </button>
              {isSpinner && (
                <span style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.green.mid, letterSpacing: 1 }}>
                  це ти
                </span>
              )}
              <div style={{
                fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.textFaint,
                background: 'rgba(86,171,145,0.1)', borderRadius: 8, padding: '3px 10px',
              }}>
                крутить 🍾
              </div>
            </div>

            {/* Arrow */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: theme.colors.yellow, fontSize: 22,
            }}>
              <div>→</div>
              {isSpinner && !heartSent && (
                <div style={{ fontSize: 10, fontFamily: theme.fonts.sans, color: theme.colors.textFaint, textAlign: 'center', maxWidth: 40 }}>
                  кинь ❤️
                </div>
              )}
            </div>

            {/* Target */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => navigate(`/users/${result.targetId}`)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
              >
                <Avatar
                  photo={result.targetPhoto}
                  name={result.targetName}
                  size={68}
                  border={`2.5px solid rgba(249,217,118,0.7)`}
                />
                <span style={{ fontFamily: theme.fonts.serif, fontSize: 17, color: theme.colors.text }}>
                  {result.targetName}
                </span>
              </button>
              {isTarget && (
                <span style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: '#f9d976', letterSpacing: 1 }}>
                  це ти
                </span>
              )}
              <div style={{
                fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.textFaint,
                background: 'rgba(249,217,118,0.08)', borderRadius: 8, padding: '3px 10px',
                border: '1px solid rgba(249,217,118,0.2)',
              }}>
                вибрана ✨
              </div>
            </div>
          </div>

          {/* Action for spinner */}
          {isSpinner && !heartSent && (
            <button
              onClick={handleHeart}
              style={{
                marginTop: 4, padding: '13px 36px',
                background: 'rgba(249,217,118,0.12)',
                border: `1.5px solid rgba(249,217,118,0.45)`,
                borderRadius: 16, color: '#f9d976',
                fontFamily: theme.fonts.sans, fontSize: 15, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              ❤️ Кинути сердечко {result.targetName}
            </button>
          )}

          {isSpinner && heartSent && (
            <div style={{
              fontFamily: theme.fonts.sans, fontSize: 14, color: theme.colors.green.light,
              padding: '13px 28px', background: 'rgba(86,171,145,0.12)',
              border: `1px solid rgba(86,171,145,0.3)`, borderRadius: 14, textAlign: 'center',
            }}>
              ❤️ Сердечко відправлено!
              <div style={{ fontSize: 12, marginTop: 4, color: theme.colors.textFaint }}>
                Якщо {result.targetName} відповість — у вас буде спільний чат
              </div>
            </div>
          )}

          {/* Hint for the target */}
          {isTarget && (
            <div style={{
              fontFamily: theme.fonts.sans, fontSize: 13, color: '#f9d976',
              padding: '13px 24px', background: 'rgba(249,217,118,0.07)',
              border: `1px solid rgba(249,217,118,0.25)`, borderRadius: 14, textAlign: 'center',
              lineHeight: 1.6,
            }}>
              🍾 Пляшка впала на тебе!
              <div style={{ fontSize: 12, marginTop: 4, color: theme.colors.textFaint }}>
                Якщо {result.spinnerName} кине тобі сердечко — ти отримаєш сповіщення
              </div>
            </div>
          )}

          {/* Just watching */}
          {!isSpinner && !isTarget && (
            <div style={{
              fontFamily: theme.fonts.sans, fontSize: 12, color: theme.colors.textFaint,
              padding: '8px 20px', background: 'rgba(255,255,255,0.03)',
              borderRadius: 10, textAlign: 'center',
            }}>
              Подивися чи буде метч 👀
            </div>
          )}
        </div>
      )}

      {/* Rules */}
      <div style={{
        width: '100%', background: 'rgba(255,255,255,0.03)',
        borderRadius: 18, padding: '18px 20px',
        border: `1px solid ${theme.colors.glassBorder}`,
      }}>
        <div style={{
          fontFamily: theme.fonts.sans, fontSize: 10, letterSpacing: 2.5,
          textTransform: 'uppercase', color: theme.colors.textFaint, marginBottom: 12,
        }}>
          Як грати
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['🍾', 'Натисни «Крутити» — пляшка виберє когось з онлайн протилежної статі'],
            ['❤️', 'Якщо людина сподобалась — кинь їй сердечко'],
            ['💬', 'Якщо вона теж лайкне тебе — відкриється спільний чат!'],
            ['👀', 'Всі онлайн бачать хто крутить і на кого впала пляшка'],
          ].map(([icon, text], i) => (
            <div key={i} style={{ fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.textMuted, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ flexShrink: 0, fontSize: 14 }}>{icon}</span>
              <span style={{ lineHeight: 1.55 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
