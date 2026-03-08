import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '@/api/support.api';
import { SupportConversation } from '@/types';
import { theme, g } from '@/styles/theme';

function ConversationList({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (c: SupportConversation) => void;
}) {
  const { data: convos = [], isLoading } = useQuery({
    queryKey: ['support', 'admin', 'conversations'],
    queryFn: supportApi.getConversations,
    refetchInterval: 5000,
  });

  if (isLoading) return (
    <div style={{ padding: '20px', color: theme.colors.textMuted, fontFamily: theme.fonts.sans, fontSize: 14 }}>
      Завантаження…
    </div>
  );

  if (convos.length === 0) return (
    <div style={{ padding: '30px 20px', textAlign: 'center', color: theme.colors.textFaint, fontFamily: theme.fonts.sans, fontSize: 14 }}>
      🛟 Ще немає звернень
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {convos.map((c) => (
        <div
          key={c.userId}
          onClick={() => onSelect(c)}
          style={{
            padding: '14px 16px', cursor: 'pointer',
            background: selected === c.userId ? 'rgba(86,171,145,0.15)' : 'transparent',
            borderRadius: theme.radius.md,
            borderLeft: selected === c.userId ? `3px solid rgba(86,171,145,0.6)` : '3px solid transparent',
            transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(86,171,145,0.15)',
            border: `1px solid rgba(86,171,145,0.2)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: theme.fonts.sans, fontWeight: 700, fontSize: 14,
            color: theme.colors.green.light, flexShrink: 0,
          }}>
            {c.userName?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: theme.fonts.sans, fontWeight: 600, fontSize: 14, color: theme.colors.text }}>
              {c.userName}
            </div>
            <div style={{ fontFamily: theme.fonts.sans, fontSize: 11, color: theme.colors.textMuted, marginTop: 1 }}>
              {new Date(c.lastAt).toLocaleDateString('uk-UA')}
            </div>
          </div>
          {c.unread > 0 && (
            <div style={{
              background: theme.colors.green.mid, borderRadius: '50%',
              minWidth: 20, height: 20, fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', padding: '0 4px',
            }}>{c.unread}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function ConversationView({ userId, userName }: { userId: string; userName: string }) {
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ['support', 'admin', 'conv', userId],
    queryFn: () => supportApi.getConversation(userId),
    refetchInterval: 4000,
  });

  const replyMutation = useMutation({
    mutationFn: (t: string) => supportApi.adminReply(userId, t),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support', 'admin', 'conv', userId] });
      qc.invalidateQueries({ queryKey: ['support', 'admin', 'conversations'] });
      setText('');
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    replyMutation.mutate(t);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px', borderBottom: `1px solid ${theme.colors.glassBorder}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(86,171,145,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: theme.fonts.sans, fontWeight: 700,
          color: theme.colors.green.light,
        }}>
          {userName[0]?.toUpperCase()}
        </div>
        <div style={{ fontFamily: theme.fonts.sans, fontWeight: 700, color: theme.colors.text }}>{userName}</div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((msg) => {
          const isAdmin = msg.fromAdmin;
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '75%' }}>
                <div style={{
                  background: isAdmin
                    ? 'linear-gradient(135deg,rgba(86,171,145,0.45),rgba(56,141,115,0.45))'
                    : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${isAdmin ? 'rgba(86,171,145,0.3)' : theme.colors.glassBorder}`,
                  borderRadius: isAdmin ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  padding: '10px 14px',
                  fontFamily: theme.fonts.sans, fontSize: 14,
                  color: theme.colors.text, lineHeight: 1.55,
                  wordBreak: 'break-word',
                }}>
                  {msg.text}
                </div>
                <div style={{
                  fontFamily: theme.fonts.sans, fontSize: 10,
                  color: theme.colors.textFaint, marginTop: 3,
                  textAlign: isAdmin ? 'right' : 'left', padding: '0 4px',
                }}>
                  {isAdmin ? 'Ти · ' : `${userName} · `}
                  {new Date(msg.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: 8,
        borderTop: `1px solid ${theme.colors.glassBorder}`,
        padding: '10px 12px',
      }}>
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Відповісти ${userName}…`}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${theme.colors.glassBorder}`,
            borderRadius: 12, outline: 'none',
            fontFamily: theme.fonts.sans, fontSize: 14, color: theme.colors.text,
            resize: 'none', lineHeight: 1.5, padding: '8px 12px',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || replyMutation.isPending}
          style={{
            background: g.greenBtn, border: 'none', borderRadius: 12,
            width: 40, height: 40, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
            alignSelf: 'flex-end', opacity: !text.trim() ? 0.4 : 1,
            fontSize: 16, color: '#fff',
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}

export function AdminSupportPage() {
  const [selected, setSelected] = useState<SupportConversation | null>(null);

  return (
    <div className="fade-up" style={{ height: 'calc(100dvh - 160px)', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Title */}
      <div style={{
        background: g.card, border: `1px solid ${theme.colors.glassBorder}`,
        borderRadius: `${theme.radius.lg} ${theme.radius.lg} 0 0`,
        padding: '14px 18px',
        fontFamily: theme.fonts.sans, fontWeight: 700, fontSize: 15,
        color: theme.colors.text, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        🛟 Служба підтримки — Адмін
      </div>

      {/* Layout */}
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: selected ? '240px 1fr' : '1fr',
        border: `1px solid ${theme.colors.glassBorder}`,
        borderTop: 'none',
        borderRadius: `0 0 ${theme.radius.lg} ${theme.radius.lg}`,
        background: g.card, overflow: 'hidden',
      }}>
        {/* Sidebar */}
        <div style={{
          borderRight: selected ? `1px solid ${theme.colors.glassBorder}` : 'none',
          overflowY: 'auto',
        }}>
          <ConversationList selected={selected?.userId ?? null} onSelect={setSelected} />
        </div>

        {/* Chat view */}
        {selected && (
          <ConversationView userId={selected.userId} userName={selected.userName} />
        )}

        {/* Empty state when no conversation selected and list visible */}
        {!selected && (
          <div style={{ display: 'none' }} />
        )}
      </div>
    </div>
  );
}
