import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profilesApi } from '@/api/profiles.api';
import { chatsApi } from '@/api/chats.api';
import { likesApi } from '@/api/likes.api';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { calcAge } from '@/utils';
import { theme, g } from '@/styles/theme';
import { LikeResult, SuperLikeResult } from '@/types';

export function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const showMatch = useUiStore((s) => s.showMatch);
  const queryClient = useQueryClient();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [superLikeSent, setSuperLikeSent] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => profilesApi.getById(userId!),
    enabled: !!userId,
  });

  const { data: likedIds = [] } = useQuery({
    queryKey: ['likes', 'given'],
    queryFn: likesApi.getGiven,
  });

  const { data: onlineIds = [] } = useQuery({
    queryKey: ['online-users'],
    queryFn: chatsApi.getOnlineUsers,
    refetchInterval: 30_000,
  });

  const isLiked = likedIds.includes(userId ?? '');
  const isOnline = onlineIds.includes(userId ?? '');

  const superLikeMutation = useMutation({
    mutationFn: () => likesApi.superLike(userId!),
    onSuccess: (result: SuperLikeResult) => {
      updateUser({ coins: result.coinsLeft });
      setSuperLikeSent(true);
      queryClient.setQueryData<string[]>(['likes', 'given'], (old = []) =>
        old.includes(userId!) ? old : [...old, userId!],
      );
      if (result.match && result.conversationId && me && profile) {
        showMatch({ partnerId: profile.id, partnerName: profile.name, partnerPhoto: profile.photo, conversationId: result.conversationId });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },
  });

  const likeMutation = useMutation({
    mutationFn: () => likesApi.toggle(userId!),
    onSuccess: (result: LikeResult) => {
      queryClient.setQueryData<string[]>(['likes', 'given'], (old = []) =>
        result.liked ? [...old.filter((id) => id !== userId), userId!] : old.filter((id) => id !== userId),
      );
      if (result.match && result.conversationId && me && profile) {
        showMatch({ partnerId: profile.id, partnerName: profile.name, partnerPhoto: profile.photo, conversationId: result.conversationId });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },
  });

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: theme.fonts.sans, color: theme.colors.textFaint, fontSize: 14 }}>🌿</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: 40, fontFamily: theme.fonts.sans, color: theme.colors.textFaint }}>
        Профіль не знайдено
      </div>
    );
  }

  const allPhotos = profile.photos?.length ? profile.photos : profile.photo ? [profile.photo] : [];
  const currentPhoto = allPhotos[photoIdx];

  return (
    <div className="fade-up">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{ background: theme.colors.glass, border: `1px solid ${theme.colors.glassBorder}`, borderRadius: 12, padding: '8px 14px', color: theme.colors.green.light, cursor: 'pointer', fontFamily: theme.fonts.sans, fontSize: 14, fontWeight: 700, marginBottom: 16 }}
      >← Назад</button>

      <div style={{ background: g.card, borderRadius: theme.radius.xl, overflow: 'hidden', border: `1px solid ${theme.colors.glassBorder}` }}>
        {/* Photo carousel */}
        <div style={{ position: 'relative', height: 340 }}>
          {currentPhoto
            ? <img src={currentPhoto} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%', background: 'rgba(86,171,145,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Avatar photo={null} name={profile.name} size={120} />
              </div>
          }
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 40%,rgba(8,20,14,0.95) 100%)' }} />

          {allPhotos.length > 1 && (
            <>
              <button onClick={() => setPhotoIdx((i) => (i - 1 + allPhotos.length) % allPhotos.length)} style={{ position: 'absolute', left: 14, top: '45%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: 38, height: 38, color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              <button onClick={() => setPhotoIdx((i) => (i + 1) % allPhotos.length)} style={{ position: 'absolute', right: 14, top: '45%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%', width: 38, height: 38, color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
              <div style={{ position: 'absolute', bottom: 72, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
                {allPhotos.map((_, i) => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: i === photoIdx ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'background 0.2s' }} />)}
              </div>
            </>
          )}

          {/* Online badge */}
          {isOnline && (
            <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(8,20,14,0.65)', backdropFilter: 'blur(8px)', border: '1px solid rgba(34,197,94,0.5)', borderRadius: 50, padding: '4px 12px', fontFamily: theme.fonts.sans, fontSize: 11, color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
              онлайн
            </div>
          )}

          <div style={{ position: 'absolute', bottom: 20, left: 22, right: 22 }}>
            <div style={{ fontFamily: theme.fonts.serif, fontSize: 30, fontWeight: 500, color: theme.colors.text }}>{profile.name}</div>
            <div style={{ fontFamily: theme.fonts.sans, fontSize: 13, color: 'rgba(168,230,207,0.65)', marginTop: 4 }}>
              {calcAge(profile.birth)} р. · 🌿 {profile.city}
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '20px 22px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {profile.bio && (
            <p style={{ fontFamily: theme.fonts.serif, fontSize: 16, fontStyle: 'italic', color: 'rgba(232,244,232,0.7)', lineHeight: 1.7, margin: 0 }}>{profile.bio}</p>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {profile.gender && <span style={{ background: 'rgba(86,171,145,0.1)', border: '1px solid rgba(86,171,145,0.18)', borderRadius: 10, padding: '5px 12px', fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.green.light }}>{profile.gender === 'male' ? '♂ Хлопець' : '♀ Дівчина'}</span>}
            {profile.language && <span style={{ background: 'rgba(86,171,145,0.1)', border: '1px solid rgba(86,171,145,0.18)', borderRadius: 10, padding: '5px 12px', fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.green.light }}>💬 {profile.language}</span>}
            <span style={{ background: 'rgba(86,171,145,0.1)', border: '1px solid rgba(86,171,145,0.18)', borderRadius: 10, padding: '5px 12px', fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.green.light }}>🎂 {new Date(profile.birth).toLocaleDateString('uk-UA')}</span>
          </div>

          {(profile.lookingForGender || profile.lookingForCity || profile.lookingForAgeMin) && (
            <div>
              <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: theme.colors.textFaint, marginBottom: 8 }}>Шукає</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {profile.lookingForGender && <span style={{ background: 'rgba(86,171,145,0.1)', border: '1px solid rgba(86,171,145,0.18)', borderRadius: 10, padding: '5px 12px', fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.green.light }}>❤ {profile.lookingForGender === 'male' ? 'Хлопця' : profile.lookingForGender === 'female' ? 'Дівчину' : 'Всіх'}</span>}
                {profile.lookingForCity && <span style={{ background: 'rgba(86,171,145,0.1)', border: '1px solid rgba(86,171,145,0.18)', borderRadius: 10, padding: '5px 12px', fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.green.light }}>📍 {profile.lookingForCity}</span>}
                {profile.lookingForAgeMin && profile.lookingForAgeMax && <span style={{ background: 'rgba(86,171,145,0.1)', border: '1px solid rgba(86,171,145,0.18)', borderRadius: 10, padding: '5px 12px', fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.green.light }}>🎯 {profile.lookingForAgeMin}–{profile.lookingForAgeMax} р.</span>}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Button
              fullWidth
              onClick={() => likeMutation.mutate()}
              loading={likeMutation.isPending}
              style={{
                background: isLiked ? 'rgba(86,171,145,0.15)' : g.greenBtn,
                border: isLiked ? `1.5px solid ${theme.colors.glassBorderActive}` : 'none',
                color: isLiked ? theme.colors.green.light : '#fff',
              }}
            >
              {isLiked ? '❤️ Вподобано' : '🤍 Вподобати'}
            </Button>

            {/* Super like */}
            <button
              onClick={() => { if ((me?.coins ?? 0) < 1) { alert('Нема монет! Монети нараховуються автоматично.'); return; } superLikeMutation.mutate(); }}
              disabled={superLikeMutation.isPending || superLikeSent || (me?.coins ?? 0) < 1}
              style={{
                padding: '0 14px', borderRadius: 12,
                background: superLikeSent ? 'rgba(249,217,118,0.25)' : 'rgba(249,217,118,0.1)',
                border: `1.5px solid rgba(249,217,118,${superLikeSent ? '0.6' : '0.35'})`,
                color: '#f9d976', fontFamily: theme.fonts.sans, fontSize: 13, fontWeight: 700,
                cursor: (me?.coins ?? 0) < 1 ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0, opacity: superLikeMutation.isPending ? 0.6 : 1,
              }}
            >
              {superLikeSent ? '⭐ Відправлено' : `⭐ ${me?.coins ?? 0}🪙`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
