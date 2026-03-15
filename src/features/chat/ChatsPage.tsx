import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { chatsApi } from '@/api/chats.api';
import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '@/components/ui/Avatar';
import { useUiTranslations } from '@/i18n';
import { Conversation } from '@/types';
import { theme, g } from '@/styles/theme';
import { timeStr } from '@/utils';

export function ChatsPage() {
  const t = useUiTranslations();
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatsApi.getConversations,
    refetchInterval: 15_000,
  });

  if (isLoading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 40, opacity: 0.4 }}>💬</div>
      <div style={{ fontFamily: theme.fonts.sans, color: theme.colors.textFaint, fontSize: 14 }}>{t.loading}</div>
    </div>
  );

  if (conversations.length === 0) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px' }}>
      <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.35 }}>💬</div>
      <div style={{ fontFamily: theme.fonts.serif, fontSize: 22, color: theme.colors.textMuted, marginBottom: 8 }}>{t.noChats}</div>
      <div style={{ fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.textFaint, lineHeight: 1.65, maxWidth: 260 }}>{t.noChatsHint}</div>
    </div>
  );

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {conversations.map((conv: Conversation, i) => {
        const partner = conv.userAId === me?.id ? conv.userB : conv.userA;
        const lastMsg = conv.lastMessage;
        const unread = conv.unreadCount ?? 0;

        return (
          <div
            key={conv.id}
            className={`fade-up-${Math.min(i + 1, 6)}`}
            onClick={() => navigate(`/chats/${conv.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: unread > 0 ? 'rgba(86,171,145,0.07)' : g.card,
              borderRadius: 20, padding: '14px 16px',
              border: `1px solid ${unread > 0 ? 'rgba(86,171,145,0.35)' : theme.colors.glassBorder}`,
              cursor: 'pointer', transition: 'background 0.2s',
            }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Avatar photo={partner?.photo} name={partner?.name ?? '?'} size={56} border="2.5px solid rgba(86,171,145,0.4)" />
              <div style={{ position: 'absolute', bottom: 0, right: 0, background: g.greenBtn, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, border: '2px solid #0d2137' }}>💚</div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <button
                onClick={(e) => { e.stopPropagation(); if (partner) navigate(`/users/${partner.id}`); }}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ fontFamily: theme.fonts.serif, fontSize: 20, fontWeight: 500, color: theme.colors.text }}>{partner?.name}</div>
              </button>
              <div style={{
                fontFamily: theme.fonts.sans, fontSize: 12,
                color: unread > 0 ? theme.colors.text : theme.colors.textMuted,
                fontWeight: unread > 0 ? 600 : 400,
                marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {lastMsg
                  ? (lastMsg.senderId === me?.id ? 'Ти: ' : '') + lastMsg.text
                  : t.mutualLikeFirst}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
              {lastMsg && (
                <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.textFaint }}>
                  {timeStr(lastMsg.createdAt)}
                </div>
              )}
              {unread > 0 && (
                <div style={{
                  background: g.greenBtn,
                  borderRadius: 10, minWidth: 20, height: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: theme.fonts.sans, fontSize: 11, fontWeight: 700,
                  color: '#fff', padding: '0 6px',
                }}>
                  {unread > 99 ? '99+' : unread}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
