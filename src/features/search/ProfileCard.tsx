import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const t = useUiTranslations();
  const showMatch = useUiStore((s) => s.showMatch);
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  // Photo carousel
  const allPhotos = profile.photos?.length ? profile.photos : profile.photo ? [profile.photo] : [];
  const [photoIdx, setPhotoIdx] = useState(0);

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIdx((i) => (i - 1 + allPhotos.length) % allPhotos.length);
  };
  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIdx((i) => (i + 1) % allPhotos.length);
  };

  const likeMutation = useMutation({
    mutationFn: () => likesApi.toggle(profile.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['likes', 'given'] });
      const previous = queryClient.getQueryData<string[]>(['likes', 'given']);
      queryClient.setQueryData<string[]>(['likes', 'given'], (old = []) =>
        isLiked ? old.filter((id) => id !== profile.id) : [...old, profile.id],
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['likes', 'given'], context.previous);
      }
    },
    onSuccess: (result: LikeResult) => {
      queryClient.setQueryData<string[]>(['likes', 'given'], (old = []) =>
        result.liked ? [...old.filter((id) => id !== profile.id), profile.id] : old.filter((id) => id !== profile.id),
      );
      if (result.match && result.conversationId && currentUser) {
        showMatch({ partnerId: profile.id, partnerName: profile.name, partnerPhoto: profile.photo, conversationId: result.conversationId });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },
  });

  const currentPhoto = allPhotos[photoIdx];

  return (
    <div className={`fade-up-${Math.min(index + 1, 6)}`}>
      <div
        style={{
          background: g.card,
          borderRadius: theme.radius.lg, overflow: 'hidden',
          border: `1px solid ${isLiked ? theme.colors.glassBorderActive : theme.colors.glassBorder}`,
          backdropFilter: 'blur(20px)', cursor: 'pointer',
          boxShadow: isLiked ? theme.shadow.cardActive : theme.shadow.card,
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}
        onClick={() => navigate(`/users/${profile.id}`)}
      >
        {/* Photo */}
        <div style={{ position: 'relative', height: 280 }}>
          {currentPhoto
            ? <img src={currentPhoto} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%', background: 'rgba(86,171,145,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>👤</div>
          }
          <div style={{ position: 'absolute', inset: 0, background: g.overlay }} />

          {/* Photo navigation arrows */}
          {allPhotos.length > 1 && (
            <>
              <button onClick={prevPhoto} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              <button onClick={nextPhoto} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
              {/* Dots */}
              <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
                {allPhotos.map((_, i) => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === photoIdx ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'background 0.2s' }} />
                ))}
              </div>
            </>
          )}

          {/* Age badge */}
          <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(8,20,14,0.65)', backdropFilter: 'blur(8px)', border: `1px solid ${theme.colors.glassBorder}`, borderRadius: 50, padding: '4px 13px', fontFamily: theme.fonts.sans, fontSize: 12, color: theme.colors.green.light, fontWeight: 600 }}>
            {calcAge(profile.birth)} р.
          </div>

          {/* Online indicator */}
          {profile.online && (
            <div style={{ position: 'absolute', top: 14, left: 14, width: 10, height: 10, background: '#22c55e', borderRadius: '50%', border: '2px solid #0d2137', marginTop: 0, marginLeft: 0, display: 'none' }} />
          )}

          {/* Online dot on top-left corner of age badge */}
          {profile.online && (
            <div style={{ position: 'absolute', top: 50, left: 14 }}>
              <div style={{ background: 'rgba(8,20,14,0.65)', backdropFilter: 'blur(8px)', border: `1px solid rgba(34,197,94,0.5)`, borderRadius: 50, padding: '2px 10px', fontFamily: theme.fonts.sans, fontSize: 11, color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                онлайн
              </div>
            </div>
          )}

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

        {/* Like button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px 16px', gap: 10 }}>
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
