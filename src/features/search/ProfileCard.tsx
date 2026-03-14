import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, LikeResult } from '@/types';
import { likesApi } from '@/api/likes.api';
import { useUiStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { useUiTranslations } from '@/i18n';
import { calcAge } from '@/utils';

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
  const age = calcAge(profile.birth);

  return (
    <div className={`fade-up-${Math.min(index + 1, 6)}`}>
      <div style={{
        borderRadius: 28,
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(160deg, #2d1b2e 0%, #1a0a35 100%)',
        boxShadow: isLiked
          ? '0 20px 50px rgba(255,69,120,0.3)'
          : '0 20px 50px rgba(0,0,0,0.5)',
        border: `1px solid ${isLiked ? 'rgba(255,69,120,0.3)' : 'rgba(255,255,255,0.07)'}`,
        transition: 'border-color 0.3s, box-shadow 0.3s',
        cursor: 'pointer',
      }}
        onClick={() => navigate(`/users/${profile.id}`)}
      >
        {/* Photo area */}
        <div style={{ position: 'relative', height: 440 }}>
          {currentPhoto
            ? <img src={currentPhoto} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg, #2d1535 0%, #1a0a3e 40%, #0f0520 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: 120, height: 120, borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(255,69,120,0.3), rgba(200,80,192,0.3))',
                  border: '2px solid rgba(255,69,120,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 48, animation: 'float 3s ease-in-out infinite',
                }}>👤</div>
              </div>
            )
          }

          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,6,24,0.98) 0%, rgba(13,6,24,0.7) 50%, transparent 100%)' }} />

          {/* Photo navigation */}
          {allPhotos.length > 1 && (
            <>
              <button onClick={prevPhoto} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              <button onClick={nextPhoto} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
              <div style={{ position: 'absolute', bottom: 100, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
                {allPhotos.map((_, i) => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === photoIdx ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'background 0.2s' }} />
                ))}
              </div>
            </>
          )}

          {/* Content overlay */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 20px 20px' }}>
            {/* Mutual like badge */}
            {likedMeBack && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'rgba(255,69,120,0.15)',
                border: '1px solid rgba(255,69,120,0.3)',
                borderRadius: 50, padding: '4px 12px',
                fontSize: 11, fontWeight: 700, color: '#FF8FB1',
                marginBottom: 8, fontFamily: 'Inter, sans-serif',
              }}>
                ✨ {t.mutualBadge}
              </div>
            )}

            {/* Name row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: '#fff' }}>{profile.name}</span>
              <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.6)', fontFamily: "'Cormorant Garamond', serif' "}}>, {age}</span>
              {profile.isPremium && (
                <div style={{ background: 'linear-gradient(135deg,#FFD166,#f9a825)', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>⭐</div>
              )}
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, sans-serif' }}>
              {profile.online && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
                  Онлайн
                </div>
              )}
              <div>📍 {profile.city}</div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 14, padding: '16px 20px',
          background: '#0d0618',
        }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Skip */}
          <button style={{
            width: 52, height: 52, borderRadius: 18,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
            onClick={() => navigate(`/users/${profile.id}`)}
            title="Переглянути профіль"
          >👁</button>

          {/* Chat if mutual */}
          {likedMeBack && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/users/${profile.id}`); }}
              style={{
                padding: '0 24px', height: 56, borderRadius: 18,
                background: 'linear-gradient(135deg, rgba(255,69,120,0.15), rgba(200,80,192,0.15))',
                border: '1px solid rgba(255,69,120,0.3)',
                color: '#FF8FB1', fontSize: 13, fontWeight: 700, gap: 6,
                display: 'flex', alignItems: 'center', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              💬 Написати
            </button>
          )}

          {/* Like */}
          <button
            className="lb"
            onClick={(e) => { e.stopPropagation(); likeMutation.mutate(); }}
            disabled={likeMutation.isPending}
            style={{
              width: 60, height: 60, borderRadius: 20,
              background: isLiked
                ? 'linear-gradient(135deg,#FF4578,#C850C0)'
                : 'rgba(255,255,255,0.06)',
              border: isLiked ? 'none' : '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: isLiked ? '0 8px 24px rgba(255,69,120,0.45)' : 'none',
            }}
          >
            {isLiked ? '❤️' : '♡'}
          </button>
        </div>
      </div>
    </div>
  );
}
