import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '@/api/support.api';
import { useAuthStore } from '@/store/auth.store';
import { theme, g } from '@/styles/theme';

export function SupportPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['support', 'my'],
    queryFn: supportApi.getMyChat,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: (t: string) => supportApi.sendMessage(t),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support', 'my'] });
      setText('');
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    sendMutation.mutate(t);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 160px)' }}>
      {/* Header */}
      <div style={{
        background: g.card, border: `1px solid ${theme.colors.glassBorder}`,
        borderRadius: theme.radius.lg, padding: '14px 18px',
        marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(86,171,145,0.2)',
          border: `1px solid rgba(86,171,145,0.3)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>🛟</div>
        <div>
          <div style={{ fontFamily: theme.fonts.sans, fontWeight: 700, color: theme.colors.text, fontSize: 15 }}>Служба підтримки</div>
          <div style={{ fontFamily: theme.fonts.sans, fontSize: 12, color: theme.colors.textMuted }}>Зазвичай відповідаємо протягом дня</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 10,
        padding: '4px 0',
      }}>
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: theme.colors.textMuted, fontFamily: theme.fonts.sans, fontSize: 14 }}>
            🌿 Завантаження…
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: theme.colors.textFaint, fontFamily: theme.fonts.sans, fontSize: 14, lineHeight: 1.7,
          }}>
            🛟 Напиши нам — ми відповімо якомога швидше!<br />
            <span style={{ fontSize: 12, opacity: 0.7 }}>Питання, пропозиції, скарги — все сюди.</span>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = !msg.fromAdmin;
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', padding: '0 4px' }}>
              {!isMe && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(86,171,145,0.2)',
                  border: `1px solid rgba(86,171,145,0.3)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, marginRight: 8, alignSelf: 'flex-end',
                }}>🛟</div>
              )}
              <div style={{ maxWidth: '75%' }}>
                <div style={{
                  background: isMe
                    ? 'linear-gradient(135deg,rgba(86,171,145,0.45),rgba(56,141,115,0.45))'
                    : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${isMe ? 'rgba(86,171,145,0.3)' : theme.colors.glassBorder}`,
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
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
                  textAlign: isMe ? 'right' : 'left', padding: '0 4px',
                }}>
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
        display: 'flex', gap: 8, marginTop: 10,
        background: g.card, border: `1px solid ${theme.colors.glassBorder}`,
        borderRadius: theme.radius.lg, padding: '8px 12px',
      }}>
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Напиши повідомлення…"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontFamily: theme.fonts.sans, fontSize: 15, color: theme.colors.text,
            resize: 'none', lineHeight: 1.5, padding: '6px 4px',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sendMutation.isPending}
          style={{
            background: g.greenBtn, border: 'none', borderRadius: 12,
            width: 40, height: 40, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
            alignSelf: 'flex-end', opacity: !text.trim() ? 0.4 : 1,
            transition: 'opacity 0.2s', fontSize: 16,
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
