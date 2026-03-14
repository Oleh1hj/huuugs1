import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '@/api/groups.api';
import { useAuthStore } from '@/store/auth.store';
import { getSocket } from '@/lib/socket';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { GroupMessage } from '@/types';
import { timeStr } from '@/utils';
import { theme, g } from '@/styles/theme';

export function GroupRoomPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: groupDetail } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupsApi.getGroupDetails(groupId!),
    enabled: !!groupId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['group-messages', groupId],
    queryFn: () => groupsApi.getMessages(groupId!),
    enabled: !!groupId,
    refetchInterval: false,
  });

  // Join group room + listen for messages
  useEffect(() => {
    const socket = getSocket();
    socket.emit('group:join', groupId);

    const onMessage = (msg: GroupMessage) => {
      if (msg.groupId !== groupId) return;
      queryClient.setQueryData<GroupMessage[]>(['group-messages', groupId], (old = []) => {
        if (old.some((m) => m.id === msg.id)) return old;
        return [...old, msg];
      });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    };

    const onTyping = ({ userName, groupId: gId }: { userId: string; userName: string; groupId: string }) => {
      if (gId !== groupId) return;
      setTypingUser(userName);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingUser(null), 2500);
    };

    socket.on('group:message', onMessage);
    socket.on('group:typing', onTyping);
    return () => {
      socket.off('group:message', onMessage);
      socket.off('group:typing', onTyping);
    };
  }, [groupId, queryClient]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !groupId) return;
    const socket = getSocket();
    socket.emit('group:message', { groupId, text });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    const socket = getSocket();
    socket.emit('group:typing', groupId);
  };

  const inviteMutation = useMutation({
    mutationFn: () => groupsApi.inviteUser(groupId!, inviteUserId.trim()),
    onSuccess: () => {
      setInviteUserId('');
      setShowInvite(false);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => groupsApi.leaveGroup(groupId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      navigate('/groups');
    },
  });

  const group = groupDetail;
  const memberCount = group?.members?.length ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${theme.colors.glassBorder}` }}>
        <button
          onClick={() => navigate('/groups')}
          style={{ background: theme.colors.glass, border: `1px solid ${theme.colors.glassBorder}`, borderRadius: 12, padding: '8px 14px', color: theme.colors.green.light, cursor: 'pointer', fontFamily: theme.fonts.sans, fontSize: 14, fontWeight: 700, flexShrink: 0 }}
        >←</button>

        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(86,171,145,0.15)', border: `2px solid rgba(86,171,145,0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
          👥
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: theme.fonts.serif, fontSize: 20, fontWeight: 500, color: theme.colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {group?.name ?? '...'}
          </div>
          <div style={{ fontFamily: theme.fonts.sans, fontSize: 11, color: theme.colors.textFaint }}>
            {typingUser ? `${typingUser} друкує...` : `${memberCount}/${group?.maxMembers ?? 12} учасників`}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {group?.myRole === 'admin' && (
            <button
              onClick={() => setShowInvite(!showInvite)}
              style={{ background: 'rgba(86,171,145,0.1)', border: `1px solid ${theme.colors.glassBorder}`, borderRadius: 10, padding: '6px 10px', color: theme.colors.green.light, cursor: 'pointer', fontFamily: theme.fonts.sans, fontSize: 12 }}
            >+ Запросити</button>
          )}
          <button
            onClick={() => { if (confirm('Вийти з групи?')) leaveMutation.mutate(); }}
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '6px 10px', color: '#f87171', cursor: 'pointer', fontFamily: theme.fonts.sans, fontSize: 12 }}
          >Вийти</button>
        </div>
      </div>

      {/* Invite panel */}
      {showInvite && (
        <div style={{ background: 'rgba(86,171,145,0.06)', border: `1px solid ${theme.colors.glassBorder}`, borderRadius: theme.radius.md, padding: '12px 14px', marginBottom: 12, display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={inviteUserId}
            onChange={(e) => setInviteUserId(e.target.value)}
            placeholder="ID користувача"
            style={{ flex: 1, padding: '10px 14px', background: theme.colors.glass, border: `1.5px solid ${theme.colors.glassBorder}`, borderRadius: 12, fontFamily: theme.fonts.sans, fontSize: 14, color: theme.colors.text }}
          />
          <Button size="sm" onClick={() => inviteMutation.mutate()} loading={inviteMutation.isPending} disabled={!inviteUserId.trim()}>
            Запросити
          </Button>
        </div>
      )}

      {/* Members avatars row */}
      {group?.members && group.members.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {group.members.slice(0, 12).map((m: any) => (
            <div
              key={m.id}
              title={m.name}
              onClick={() => navigate(`/users/${m.id}`)}
              style={{ cursor: 'pointer', flexShrink: 0 }}
            >
              <Avatar photo={m.photo} name={m.name} size={32} border={m.role === 'admin' ? `2px solid ${theme.colors.green.mid}` : `1px solid ${theme.colors.glassBorder}`} />
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14, paddingRight: 2 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.textFaint }}>
            Напиши перший у цій групі 👋
          </div>
        )}

        {messages.map((m: GroupMessage, i: number) => {
          const isMine = m.senderId === me?.id;
          return (
            <div key={m.id ?? i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
              {!isMine && (
                <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.textFaint, marginBottom: 2, paddingLeft: 4 }}>
                  {m.senderName ?? m.sender?.name}
                </div>
              )}
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

        {typingUser && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.textFaint, marginBottom: 2, paddingLeft: 4 }}>{typingUser}</div>
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
          placeholder="Написати у групу..."
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
