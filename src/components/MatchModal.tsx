import { useNavigate } from 'react-router-dom';
import { useUiStore } from '@/store/ui.store';
import { useUiTranslations } from '@/i18n';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import { theme, g } from '@/styles/theme';

export function MatchModal() {
  const { matchNotif, dismissMatch } = useUiStore();
  const navigate = useNavigate();
  const t = useUiTranslations();

  if (!matchNotif) return null;

  const handleWrite = () => {
    dismissMatch();
    navigate(`/chats/${matchNotif.conversationId}`);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(5,12,24,0.92)', backdropFilter: 'blur(18px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, animation: 'fadeUp 0.3s ease',
      }}
      onClick={dismissMatch}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: g.match,
          border: `1px solid ${theme.colors.glassBorderActive}`,
          borderRadius: theme.radius.xl, padding: '44px 28px',
          maxWidth: 320, width: '100%', textAlign: 'center',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 80px rgba(86,171,145,0.12)',
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 12, display: 'inline-block', animation: 'heartPop 0.6s ease' }}>
          💚
        </div>

        <h2 style={{ fontFamily: theme.fonts.serif, fontSize: 28, fontWeight: 500, color: theme.colors.green.light, marginBottom: 8 }}>
          {t.matchTitle}
        </h2>
        <p style={{ fontFamily: theme.fonts.sans, fontSize: 14, color: theme.colors.textMuted, lineHeight: 1.65, marginBottom: 28 }}>
          {t.matchSub(matchNotif.partnerName)}
        </p>

        <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 28px' }}>
          <Avatar
            photo={matchNotif.partnerPhoto}
            name={matchNotif.partnerName}
            size={100}
            border="3px solid rgba(86,171,145,0.55)"
            style={{ boxShadow: '0 0 32px rgba(86,171,145,0.35)', margin: '0 auto' }}
          />
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            background: g.greenBtn, borderRadius: '50%',
            width: 30, height: 30, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 14, border: '2.5px solid #0d2137',
          }}>💚</div>
        </div>

        <Button fullWidth onClick={handleWrite} style={{ marginBottom: 12 }}>{t.matchBtn}</Button>
        <Button fullWidth variant="ghost" onClick={dismissMatch}>{t.cancel}</Button>
      </div>
    </div>
  );
}
