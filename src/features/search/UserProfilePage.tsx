import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profilesApi } from '@/api/profiles.api';
import { chatsApi } from '@/api/chats.api';
import { likesApi } from '@/api/likes.api';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { calcAge } from '@/utils';
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
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => profilesApi.getById(userId!),
    enabled: !!userId,
  });

  const { data: likedIds = [] } = useQuery({
    queryKey: ['likes', 'given'],
    queryFn: likesApi.getGiven,
  });

  const { data: blockedIds = [] } = useQuery({
    queryKey: ['blocked-ids'],
    queryFn: profilesApi.getBlockedIds,
  });

  const { data: onlineIds = [] } = useQuery({
    queryKey: ['online-users'],
    queryFn: chatsApi.getOnlineUsers,
    refetchInterval: 30_000,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatsApi.getConversations,
  });

  const isLiked = likedIds.includes(userId ?? '');
  const isOnline = onlineIds.includes(userId ?? '');
  const isBlocked = blockedIds.includes(userId ?? '');
  const existingConv = conversations.find((c) =>
    (c.userAId === me?.id && c.userBId === userId) ||
    (c.userBId === me?.id && c.userAId === userId),
  );
  const canDirectMessage = !!(existingConv) || !!(profile?.isAdmin) || !!(me?.isAdmin);

  const openConvMutation = useMutation({
    mutationFn: () => chatsApi.openConversation(userId!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigate(`/chats/${data.conversationId}`);
    },
  });

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

  const blockMutation = useMutation({
    mutationFn: () => isBlocked ? profilesApi.unblockUser(userId!) : profilesApi.blockUser(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-ids'] });
      setShowMenu(false);
      if (!isBlocked) navigate(-1);
    },
  });

  const reportMutation = useMutation({
    mutationFn: () => profilesApi.reportUser(userId!, reportReason),
    onSuccess: () => { setShowReportModal(false); setReportReason(''); },
  });

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>💫</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>
        Профіль не знайдено
      </div>
    );
  }

  const allPhotos = profile.photos?.length ? profile.photos : profile.photo ? [profile.photo] : [];
  const currentPhoto = allPhotos[photoIdx];
  const age = calcAge(profile.birth);

  // Tag-style chips
  const chips: string[] = [];
  if (profile.language) chips.push(profile.language);
  if (profile.gender) chips.push(profile.gender === 'male' ? 'Хлопець' : 'Дівчина');
  if (profile.lookingForGender) chips.push(profile.lookingForGender === 'male' ? 'Шукає хлопця' : profile.lookingForGender === 'female' ? 'Шукає дівчину' : 'Шукає всіх');

  return (
    <div className="fade-up" style={{ margin: '-16px -16px 0', position: 'relative' }}>
      {/* Full-screen photo */}
      <div style={{ position: 'relative', height: '75vh', minHeight: 480, maxHeight: 700 }}>
        {currentPhoto
          ? <img src={currentPhoto} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg, #2d1535 0%, #1a0a3e 40%, #0f0520 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 130, height: 130, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255,69,120,0.3), rgba(200,80,192,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 54 }}>👤</div>
            </div>
          )
        }

        {/* Top gradient */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to bottom, rgba(13,6,24,0.8) 0%, transparent 100%)', pointerEvents: 'none' }} />

        {/* Bottom gradient */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 300, background: 'linear-gradient(to top, rgba(13,6,24,1) 20%, rgba(13,6,24,0.7) 70%, transparent 100%)', pointerEvents: 'none' }} />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: 16, left: 16,
            width: 40, height: 40, borderRadius: 14,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10,
          }}
        >←</button>

        {/* ⋯ Menu button */}
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
          <button
            onClick={() => setShowMenu((s) => !s)}
            style={{
              width: 40, height: 40, borderRadius: 14,
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >⋯</button>
          {showMenu && (
            <div style={{
              position: 'absolute', top: 48, right: 0,
              background: 'rgba(13,6,24,0.98)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
              padding: 6, minWidth: 190, zIndex: 20,
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            }}>
              <button
                onClick={() => { if (confirm(isBlocked ? 'Розблокувати?' : 'Заблокувати?')) blockMutation.mutate(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  background: 'transparent', border: 'none',
                  padding: '11px 14px', borderRadius: 12,
                  color: 'rgba(248,113,113,0.7)', fontFamily: 'Inter, sans-serif', fontSize: 13,
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ opacity: 0.7 }}>🚫</span>
                {isBlocked ? 'Розблокувати' : 'Заблокувати'}
              </button>
              <button
                onClick={() => { setShowMenu(false); setShowReportModal(true); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  background: 'transparent', border: 'none',
                  padding: '11px 14px', borderRadius: 12,
                  color: 'rgba(251,146,60,0.7)', fontFamily: 'Inter, sans-serif', fontSize: 13,
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ opacity: 0.7 }}>⚠️</span>
                Поскаржитись
              </button>
            </div>
          )}
        </div>

        {/* Photo dots */}
        {allPhotos.length > 1 && (
          <>
            {/* Tap zones */}
            <div style={{ position: 'absolute', top: 60, left: 0, width: '40%', height: 'calc(100% - 120px)', cursor: 'pointer', zIndex: 5 }} onClick={() => setPhotoIdx((i) => (i - 1 + allPhotos.length) % allPhotos.length)} />
            <div style={{ position: 'absolute', top: 60, right: 0, width: '40%', height: 'calc(100% - 120px)', cursor: 'pointer', zIndex: 5 }} onClick={() => setPhotoIdx((i) => (i + 1) % allPhotos.length)} />
            {/* Dots */}
            <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, zIndex: 10 }}>
              {allPhotos.map((_, i) => (
                <div key={i} onClick={() => setPhotoIdx(i)} style={{ width: i === photoIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === photoIdx ? '#fff' : 'rgba(255,255,255,0.35)', transition: 'all 0.25s', cursor: 'pointer' }} />
              ))}
            </div>
          </>
        )}

        {/* Online badge */}
        {isOnline && (
          <div style={{ position: 'absolute', top: 64, left: 16, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(74,222,128,0.4)', borderRadius: 50, padding: '4px 10px', zIndex: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#4ade80', fontWeight: 600 }}>Онлайн</span>
          </div>
        )}

        {/* Name and age overlay */}
        <div style={{ position: 'absolute', bottom: 24, left: 20, right: 20, zIndex: 5 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 600, color: '#fff', lineHeight: 1 }}>{profile.name}</span>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: 'rgba(255,255,255,0.65)', lineHeight: 1.1 }}>{age}</span>
            {profile.isVerified && (
              <div style={{ background: 'rgba(59,130,246,0.9)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>✓</div>
            )}
            {profile.isPremium && (
              <div style={{ background: 'linear-gradient(135deg,#FFD166,#f9a825)', borderRadius: 50, padding: '3px 10px', fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#1a1000', fontWeight: 700, flexShrink: 0 }}>⭐ Premium</div>
            )}
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 6 }}>
            📍 {profile.city}{profile.country ? `, ${profile.country}` : ''}
          </div>
        </div>
      </div>

      {/* Info section below photo */}
      <div style={{ padding: '20px 20px 100px', background: '#0d0618' }}>

        {/* Bio */}
        {profile.bio && (
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 18, fontStyle: 'italic',
            color: 'rgba(255,255,255,0.65)', lineHeight: 1.7,
            marginBottom: 18,
          }}>
            "{profile.bio}"
          </p>
        )}

        {/* Tags */}
        {chips.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {chips.map((chip, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 50, padding: '6px 14px',
                fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500,
                color: 'rgba(255,255,255,0.6)',
              }}>{chip}</div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {/* Like button */}
          <button
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            style={{
              flex: 1, height: 54, borderRadius: 18,
              background: isLiked ? 'linear-gradient(135deg,#FF4578,#C850C0)' : 'rgba(255,255,255,0.06)',
              border: isLiked ? 'none' : '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: isLiked ? '0 8px 24px rgba(255,69,120,0.4)' : 'none',
              transition: 'all 0.2s',
              opacity: likeMutation.isPending ? 0.6 : 1,
            }}
          >
            {isLiked ? '❤️ Вподобано' : '♡ Вподобати'}
          </button>

          {/* Super like */}
          <button
            onClick={() => {
              if ((me?.coins ?? 0) < 1) { navigate('/coins'); return; }
              superLikeMutation.mutate();
            }}
            disabled={superLikeMutation.isPending || superLikeSent || (me?.coins ?? 0) < 1}
            style={{
              width: 54, height: 54, borderRadius: 18,
              background: superLikeSent ? 'rgba(255,209,102,0.2)' : 'rgba(255,209,102,0.1)',
              border: `1px solid rgba(255,209,102,${superLikeSent ? '0.5' : '0.25'})`,
              color: '#FFD166', fontSize: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              opacity: superLikeMutation.isPending ? 0.6 : 1, flexShrink: 0,
            }}
            title={`Super Like · ${me?.coins ?? 0}🪙`}
          >⭐</button>
        </div>

        {/* Write button if conversation exists */}
        {canDirectMessage && (
          <button
            onClick={() => existingConv ? navigate(`/chats/${existingConv.id}`) : openConvMutation.mutate()}
            disabled={openConvMutation.isPending}
            style={{
              width: '100%', height: 54, borderRadius: 18,
              background: 'rgba(255,69,120,0.1)',
              border: '1px solid rgba(255,69,120,0.3)',
              color: '#FF8FB1', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: openConvMutation.isPending ? 0.6 : 1,
              marginBottom: 12,
            }}
          >
            💬 Написати
          </button>
        )}

        {/* ID copy */}
        {(() => {
          const short = '#' + profile.id.replace(/-/g, '').slice(0, 4).toUpperCase() + '·' + profile.id.replace(/-/g, '').slice(4, 8).toUpperCase();
          return (
            <div
              onClick={() => navigator.clipboard.writeText(profile.id)}
              title="Натисни, щоб скопіювати ID"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 14px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, cursor: 'pointer',
              }}
            >
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: 1.5, textTransform: 'uppercase' }}>ID</span>
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, flex: 1 }}>{short}</span>
              <span style={{ fontSize: 12, opacity: 0.4 }}>📋</span>
            </div>
          );
        })()}
      </div>

      {/* Report modal */}
      {showReportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 16px 32px' }}>
          <div style={{ background: 'rgba(13,6,24,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: '24px 22px', width: '100%', maxWidth: 430 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: '#fff', marginBottom: 16 }}>Скарга</div>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Опишіть причину скарги..."
              rows={4}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#fff', resize: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button
                onClick={() => reportMutation.mutate()}
                disabled={reportMutation.isPending}
                style={{ flex: 1, padding: '13px', borderRadius: 14, background: 'linear-gradient(135deg,#FF4578,#C850C0)', border: 'none', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >Надіслати</button>
              <button
                onClick={() => { setShowReportModal(false); setReportReason(''); }}
                style={{ flex: 1, padding: '13px', borderRadius: 14, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >Скасувати</button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside menu */}
      {showMenu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setShowMenu(false)} />
      )}
    </div>
  );
}
