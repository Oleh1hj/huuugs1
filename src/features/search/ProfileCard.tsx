import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, LikeResult } from '@/types';
import { likesApi } from '@/api/likes.api';
import { useUiStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { useUiTranslations } from '@/i18n';
import { calcAge } from '@/utils';
import { theme, g } from '@/styles/theme';

interface Props {
  profile: User;
  isLiked: boolean;
  likedMeBack: boolean;
  index: number;
}

export function ProfileCard({ profile, isLiked, likedMeBack, index }: Props) {
  const [expanded, setExpanded] = useState(false);
  const t = useUiTranslations();
  const lang = useUiStore((s) => s.lang);
  const showMatch = useUiStore((s) => s.showMatch);
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () => likesApi.toggle(profile.id),
    onSuccess: (result: LikeResult) => {
      // Update liked IDs cache
      queryClient.setQueryData<string[]>(['likes', 'given'], (old = []) =>
        result.liked ? [...old, profile.id] : old.filter((id) => id !== profile.id),
      );

      // Mutual like → show match popup
      if (result.match && result.conversationId && currentUser) {
        showMatch({
          partnerId: profile.id,
          partnerName: profile.name,
          partnerPhoto: profile.photo,
          conversationId: result.conversationId,
        });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },
  });

  return (
    <div className={`fade-up-${Math.min(index + 1, 6)}`}>
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{
          background: g.card,
          borderRadius: theme.radius.lg, overflow: 'hidden',
          border: `1px solid ${isLiked ? theme.colors.glassBorderActive : theme.colors.glassBorder}`,
          backdropFilter: 'blur(20px)', cursor: 'pointer',
          boxShadow: isLiked ? theme.shadow.cardActive : theme.shadow.card,
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}
      >
        {/* Photo */}
        <div style={{ position: 'relative', height: 280 }}>
          {profile.photo
            ? <img src={profile.photo} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%', background: 'rgba(86,171,145,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>👤</div>
          }
          <div style={{ position: 'absolute', inset: 0, background: g.overlay }} />

          {/* Age badge */}
          <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(8,20,14,0.65)', backdropFilter: 'blur(8px)', border: `1px solid ${theme.colors.glassBorder}`, borderRadius: 50, padding: '4px 13px', fontFamily: theme.fonts.sans, fontSize: 12, color: theme.colors.green.light, fontWeight: 600 }}>
            {calcAge(profile.birth)} {t.years}
          </div>

          {/* Liked indicator */}
          {isLiked && (
            <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(86,171,145,0.85)', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, animation: 'pulse 2s infinite' }}>❤️</div>
          )}

          {/* Liked me badge */}
          {likedMeBack && !isLiked && (
            <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(249,217,118,0.18)', border: '1px solid rgba(249,217,118,0.45)', borderRadius: 50, padding: '4px 10px', fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.yellow, fontWeight: 700, letterSpacing: 0.4 }}>
              {t.mutualBadge}
            </div>
          )}

          {/* Name */}
          <div style={{ position: 'absolute', bottom: 16, left: 18, right: 18 }}>
            <div style={{ fontFamily: theme.fonts.serif, fontSize: 26, fontWeight: 500, color: theme.colors.text, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{profile.name}</div>
            <div style={{ fontFamily: theme.fonts.sans, fontSize: 12, color: 'rgba(168,230,207,0.7)', marginTop: 3 }}>🌿 {profile.city}</div>
          </div>
        </div>

        {/* Bio expand */}
        <div style={{ overflow: 'hidden', maxHeight: expanded ? 120 : 0, transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)' }}>
          <div style={{ padding: '14px 18px 4px' }}>
            <p style={{ fontFamily: theme.fonts.serif, fontSize: 16, fontStyle: 'italic', color: 'rgba(232,244,232,0.72)', lineHeight: 1.65 }}>
              {profile.bio || '—'}
            </p>
          </div>
        </div>

        {/* Like button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px 16px' }}>
          <button
            className="lb"
            onClick={(e) => { e.stopPropagation(); likeMutation.mutate(); }}
            disabled={likeMutation.isPending}
            style={{
              padding: '9px 22px', borderRadius: 50,
              border: isLiked ? 'none' : `1.5px solid ${theme.colors.glassBorderActive}`,
              background: isLiked ? g.greenBtn : 'rgba(86,171,145,0.07)',
              color: isLiked ? '#fff' : theme.colors.green.mid,
              fontFamily: theme.fonts.sans, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s',
            }}
          >
            {isLiked ? '❤️' : '🤍'} {isLiked ? t.likedBtn : t.likeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
