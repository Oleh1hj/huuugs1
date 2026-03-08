import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likesApi } from '@/api/likes.api';
import { chatsApi } from '@/api/chats.api';
import { useUiTranslations } from '@/i18n';
import { useUiStore } from '@/store/ui.store';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { calcAge } from '@/utils';
import { User } from '@/types';
import { theme, g } from '@/styles/theme';
import { likesApi as api } from '@/api/likes.api';

export function LikesPage() {
  const t = useUiTranslations();
  const navigate = useNavigate();
  const showMatch = useUiStore((s) => s.showMatch);
  const queryClient = useQueryClient();

  const { data: whoLiked = [], isLoading } = useQuery({
    queryKey: ['likes', 'received'],
    queryFn: likesApi.getReceived,
    refetchInterval: 60_000,
  });

  const replyMutation = useMutation({
    mutationFn: (userId: string) => api.toggle(userId),
    onSuccess: (result, userId) => {
      if (result.match && result.conversationId) {
        const person = whoLiked.find((p) => p.id === userId);
        if (person) {
          showMatch({ partnerId: person.id, partnerName: person.name, partnerPhoto: person.photo, conversationId: result.conversationId });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      } else if (result.conversationId) {
        navigate(`/chats/${result.conversationId}`);
      }
    },
  });

  return (
    <div className="fade-up">
      <p style={{ textAlign: 'center', fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.textMuted, marginBottom: 20, letterSpacing: 1 }}>
        ❤️ {whoLiked.length} {t.likedMe}
      </p>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: 40, fontFamily: theme.fonts.sans, color: theme.colors.textMuted }}>🌿</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {whoLiked.map((person: User, i) => (
          <div
            key={person.id}
            className={`fade-up-${Math.min(i + 1, 6)}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              background: g.card,
              borderRadius: 20, padding: '14px 16px',
              border: `1px solid ${theme.colors.glassBorder}`,
            }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Avatar photo={person.photo} name={person.name} size={66} border="2.5px solid rgba(86,171,145,0.35)" />
              <div style={{ position: 'absolute', bottom: 0, right: 0, background: theme.colors.green.mid, borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, border: '2px solid #0d2137' }}>❤</div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: theme.fonts.serif, fontSize: 21, fontWeight: 500, color: theme.colors.text }}>{person.name}</div>
              <div style={{ fontFamily: theme.fonts.sans, fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>
                {calcAge(person.birth)} {t.years} · 🌿 {person.city}
              </div>
            </div>

            <Button
              size="sm"
              style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              onClick={() => replyMutation.mutate(person.id)}
              loading={replyMutation.isPending}
            >
              {t.replyBtn}
            </Button>
          </div>
        ))}

        {!isLoading && whoLiked.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: theme.fonts.sans, color: theme.colors.textFaint }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>❤️</div>
            <div style={{ fontSize: 15 }}>{t.noneYet}</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>{t.noneYetHint}</div>
          </div>
        )}
      </div>
    </div>
  );
}
