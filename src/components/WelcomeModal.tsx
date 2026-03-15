import { useNavigate } from 'react-router-dom';
import { theme, g } from '@/styles/theme';

const STORAGE_KEY = 'huugs_welcome_count';
const MAX_SHOWS = 3;

export function shouldShowWelcome(): boolean {
  const count = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0');
  return count < MAX_SHOWS;
}

export function incrementWelcomeCount() {
  const count = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0');
  localStorage.setItem(STORAGE_KEY, String(count + 1));
}

interface Props {
  onClose: () => void;
}

export function WelcomeModal({ onClose }: Props) {
  const navigate = useNavigate();

  const handleSupport = () => {
    onClose();
    navigate('/support');
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(13,6,24,0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'linear-gradient(160deg,rgba(26,10,46,0.98) 0%,rgba(13,6,24,0.98) 100%)',
        border: '1px solid rgba(255,69,120,0.2)',
        borderRadius: theme.radius.xl,
        padding: '28px 24px',
        maxWidth: 390,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(255,69,120,0.08)',
        position: 'relative',
      }}>
        {/* Header — від кого */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: g.greenBtn,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
            boxShadow: '0 4px 16px rgba(255,69,120,0.35)',
          }}>
            🤗
          </div>
          <div>
            <div style={{
              fontFamily: theme.fonts.sans, fontWeight: 700,
              fontSize: 14, color: theme.colors.text,
            }}>
              Команда Huugs
            </div>
            <div style={{
              fontFamily: theme.fonts.sans, fontSize: 12,
              color: theme.colors.textMuted,
            }}>
              Адміністрація
            </div>
          </div>
        </div>

        {/* Greeting */}
        <div style={{
          fontFamily: theme.fonts.sans, fontSize: 20, fontWeight: 700,
          color: theme.colors.text, marginBottom: 14, lineHeight: 1.3,
        }}>
          👋 Вітаємо на Huugs!
        </div>

        {/* Body text */}
        <div style={{
          fontFamily: theme.fonts.sans, fontSize: 14,
          color: 'rgba(255,255,255,0.8)', lineHeight: 1.7,
          marginBottom: 18,
        }}>
          Ми щойно запустилися, тому нас поки що небагато, але кожен користувач для нас — особливий. Ми хочемо зробити цей простір комфортним, тому на платформі ніколи не буде нав'язливої реклами.
        </div>

        {/* Bonus block */}
        <div style={{
          background: 'rgba(255,209,102,0.08)',
          border: '1px solid rgba(255,209,102,0.2)',
          borderRadius: theme.radius.md,
          padding: '12px 16px',
          marginBottom: 20,
          fontFamily: theme.fonts.sans, fontSize: 14,
          color: 'rgba(255,255,255,0.85)', lineHeight: 1.6,
        }}>
          🎁 <strong style={{ color: '#FFD166' }}>Ваш бонус:</strong> Даруємо{' '}
          <strong style={{ color: '#FFD166' }}>3 місяці Premium</strong> за те, що ви з нами з самого початку!
        </div>

        {/* Support hint */}
        <div style={{
          fontFamily: theme.fonts.sans, fontSize: 13,
          color: theme.colors.textMuted, marginBottom: 22, lineHeight: 1.6,
        }}>
          Знайшли баг чи маєте ідею? Пишіть у підтримку — ми відповімо.
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleSupport}
            style={{
              background: g.greenBtn,
              border: 'none', borderRadius: theme.radius.md,
              padding: '13px 20px',
              fontFamily: theme.fonts.sans, fontSize: 15, fontWeight: 600,
              color: '#fff', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(255,69,120,0.3)',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            🛟 Написати в підтримку
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: theme.radius.md,
              padding: '12px 20px',
              fontFamily: theme.fonts.sans, fontSize: 15, fontWeight: 500,
              color: theme.colors.textMuted, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = theme.colors.text; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = theme.colors.textMuted; }}
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}
