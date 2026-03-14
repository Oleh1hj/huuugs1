import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { groupsApi } from '@/api/groups.api';
import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GroupChat, GroupInvite } from '@/types';
import { theme, g } from '@/styles/theme';
import { timeStr } from '@/utils';

export function GroupsPage() {
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.getMyGroups,
  });

  const { data: invites = [] } = useQuery({
    queryKey: ['group-invites'],
    queryFn: groupsApi.getMyInvites,
    refetchInterval: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: () => groupsApi.createGroup(newName.trim(), newDesc.trim() || undefined),
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      navigate(`/groups/${group.id}`);
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ inviteId, accept }: { inviteId: string; accept: boolean }) =>
      groupsApi.respondToInvite(inviteId, accept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-invites'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  return (
    <div className="fade-up">
      {/* Pending invites */}
      {invites.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: theme.colors.textFaint, marginBottom: 10 }}>
            Запрошення ({invites.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {invites.map((inv: GroupInvite) => (
              <div
                key={inv.id}
                style={{ background: 'rgba(249,217,118,0.06)', border: '1px solid rgba(249,217,118,0.2)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: theme.fonts.serif, fontSize: 17, color: theme.colors.text }}>{inv.group?.name ?? 'Група'}</div>
                  <div style={{ fontFamily: theme.fonts.sans, fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>
                    від {inv.fromUser?.name ?? '?'} · до {inv.group?.maxMembers ?? 12} учасників
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button size="sm" onClick={() => respondMutation.mutate({ inviteId: inv.id, accept: true })}>✓</Button>
                  <Button size="sm" variant="ghost" onClick={() => respondMutation.mutate({ inviteId: inv.id, accept: false })}>✕</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create group */}
      {showCreate ? (
        <div style={{ background: g.card, borderRadius: theme.radius.xl, padding: '18px 20px', border: `1px solid ${theme.colors.glassBorder}`, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.green.light, letterSpacing: 1, textTransform: 'uppercase' }}>Нова група</div>
          <Input label="Назва" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Input label="Опис (необов'язково)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          <div style={{ display: 'flex', gap: 10 }}>
            <Button fullWidth onClick={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!newName.trim()}>Створити</Button>
            <Button fullWidth variant="ghost" onClick={() => setShowCreate(false)}>Скасувати</Button>
          </div>
        </div>
      ) : (
        <Button fullWidth onClick={() => setShowCreate(true)} style={{ marginBottom: 20 }}>
          + Створити групу (до 12 людей)
        </Button>
      )}

      {isLoading && (
        <div style={{ textAlign: 'center', padding: 40, fontFamily: theme.fonts.sans, color: theme.colors.textMuted }}>🌿</div>
      )}

      {!isLoading && groups.length === 0 && (
        <div style={{ textAlign: 'center', padding: '50px 20px', fontFamily: theme.fonts.sans, color: theme.colors.textFaint }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>👥</div>
          <div style={{ fontSize: 15 }}>Ще немає груп</div>
          <div style={{ fontSize: 13, marginTop: 6, color: theme.colors.textFaint }}>Створи групу або дочекайся запрошення</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groups.map((group: GroupChat, i: number) => (
          <div
            key={group.id}
            className={`fade-up-${Math.min(i + 1, 6)}`}
            onClick={() => navigate(`/groups/${group.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: g.card, borderRadius: 20, padding: '14px 16px',
              border: `1px solid ${theme.colors.glassBorder}`,
              cursor: 'pointer', transition: 'background 0.2s',
            }}
          >
            {/* Group icon */}
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(86,171,145,0.15)', border: `2.5px solid rgba(86,171,145,0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
              👥
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: theme.fonts.serif, fontSize: 19, fontWeight: 500, color: theme.colors.text }}>{group.name}</div>
              <div style={{ fontFamily: theme.fonts.sans, fontSize: 12, color: theme.colors.textMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {group.lastMessage
                  ? (group.lastMessage.senderId === me?.id ? 'Ти: ' : `${group.lastMessage.senderName ?? ''}: `) + group.lastMessage.text
                  : `${group.memberCount ?? 1} учасник${(group.memberCount ?? 1) === 1 ? '' : 'ів'} · ${group.myRole === 'admin' ? 'адмін' : 'учасник'}`}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              {group.lastMessage && (
                <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.textFaint }}>
                  {timeStr(group.lastMessage.createdAt)}
                </div>
              )}
              <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.textFaint }}>
                {group.memberCount ?? 1}/{group.maxMembers ?? 12}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
