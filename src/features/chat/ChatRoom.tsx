import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { chatsApi } from '@/api/chats.api';
import { useAuthStore } from '@/store/auth.store';
import { useSendMessage, useTyping } from '@/hooks/useSocket';
import { getSocket } from '@/lib/socket';
import { Avatar } from '@/components/ui/Avatar';
import { useUiTranslations } from '@/i18n';
import { Message, Conversation } from '@/types';
import { timeStr } from '@/utils';
import { theme, g } from '@/styles/theme';

export function ChatRoom() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const [input, setInput] = useState('');
  const [typingVisible, setTypingVisible] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const t = useUiTranslations();
  const sendMessage = useSendMessage(conversationId!);
  const emitTyping = useTyping(conversationId!);

  // Get conversation info — use query so it refetches after a new match
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatsApi.getConversations,
  });
  const conv = conversations.find((c) => c.id === conversationId);
  const partner = conv ? (conv.userAId === me?.id ? conv.userB : conv.userA) : null;

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => chatsApi.getMessages(conversationId!),
    enabled: !!conversationId,
    refetchInterval: false, // rely on WebSocket
  });

  // Join socket room for this conversation
  useEffect(() => {
    const socket = getSocket();
    socket.emit('join', conversationId);
  }, [conversationId]);

  // Show typing indicator from socket events
  useEffect(() => {
    const socket = getSocket();
    const handler = ({ userId }: { userId: string }) => {
      if (userId !== me?.id) {
        setTypingVisible(true);
        setTimeout(() => setTypingVisible(false), 2500);
      }
    };
    socket.on('typing', handler);
    return () => { socket.off('typing', handler); };
  }, [me?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !conversationId) return;
    sendMessage(text);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    emitTyping();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${theme.colors.glassBorder}` }}>
        <button
          onClick={() => navigate('/chats')}
          style={{ background: theme.colors.glass, border: `1px solid ${theme.colors.glassBorder}`, borderRadius: 12, padding: '8px 14px', color: theme.colors.green.light, cursor: 'pointer', fontFamily: theme.fonts.sans, fontSize: 14, fontWeight: 700, flexShrink: 0 }}
        >
          ←
        </button>
        {partner && <Avatar photo={partner.photo} name={partner.name} size={42} />}
        <div>
          <div style={{ fontFamily: theme.fonts.serif, fontSize: 20, fontWeight: 500, color: theme.colors.text }}>{partner?.name}</div>
          <div style={{ fontFamily: theme.fonts.sans, fontSize: 11, color: theme.colors.textFaint }}>
            {typingVisible ? t.typing : t.mutualLikeHeader}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14, paddingRight: 2 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.textFaint }}>
            {t.writeFirst}
          </div>
        )}

        {messages.map((m: Message, i) => {
          const isMine = m.senderId === me?.id;
          return (
            <div key={m.id ?? i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
              <div
                className={isMine ? 'msg-me' : 'msg-them'}
                style={{ maxWidth: '75%', padding: '10px 14px', fontFamily: theme.fonts.sans, fontSize: 14, lineHeight: 1.55 }}
              >
                {m.text}
              </div>
              <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.textFaint, marginTop: 3, paddingLeft: 4, paddingRight: 4 }}>
                {timeStr(m.createdAt)}
              </div>
            </div>
          );
        })}

        {typingVisible && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div className="msg-them" style={{ padding: '10px 16px', fontFamily: theme.fonts.sans, fontSize: 14 }}>
              <span style={{ display: 'inline-flex', gap: 3 }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: theme.colors.green.mid, display: 'inline-block', animation: `fp0 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={t.msgPlaceholder}
          style={{
            flex: 1, padding: '12px 16px',
            background: theme.colors.glass,
            border: `1.5px solid ${theme.colors.glassBorder}`,
            borderRadius: 20, fontSize: 14,
            fontFamily: theme.fonts.sans, color: theme.colors.text,
          }}
        />
        <button
          onClick={handleSend}
          style={{
            width: 46, height: 46, borderRadius: '50%',
            background: input.trim() ? g.greenBtn : 'rgba(86,171,145,0.12)',
            border: 'none',
            color: input.trim() ? '#fff' : theme.colors.textFaint,
            fontSize: 18, cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.2s',
            boxShadow: input.trim() ? theme.shadow.green : 'none',
          }}
        >↑</button>
      </div>
    </div>
  );
}
