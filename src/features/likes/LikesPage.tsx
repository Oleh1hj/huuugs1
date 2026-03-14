import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likesApi } from '@/api/likes.api';
import { chatsApi } from '@/api/chats.api';
import { useUiTranslations } from '@/i18n';
import { useUiStore } from '@/store/ui.store';
import { calcAge } from '@/utils';
import { User } from '@/types';
import { likesApi as api } from '@/api/likes.api';

export function LikesPage() {
  const t = useUiTranslations();
  const navigate = useNavigate();
  const showMatch = useUiStore((s) => s.showMatch);
  const queryClient = useQueryClient();

  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data: whoLiked = [], isLoading } = useQuery({
    queryKey: ['likes', 'received'],
    queryFn: likesApi.getReceived,
    refetchInterval: 60_000,
  });

  const { data: likedIds = [] } = useQuery({
    queryKey: ['likes', 'given'],
    queryFn: likesApi.getGiven,
  });

  const replyMutation = useMutation({
    mutationFn: (userId: string) => api.toggle(userId),
    onSuccess: (result, userId) => {
      setPendingId(null);
      if (result.match && result.conversationId) {
        const person = whoLiked.find((p) => p.id === userId);
        if (person) {
          showMatch({ partnerId: person.id, partnerName: person.name, partnerPhoto: person.photo, conversationId: result.conversationId });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      } else if (result.conversationId) {
        navigate(`/chats/${result.conversationId}`);
      }
      queryClient.invalidateQueries({ queryKey: ['likes', 'given'] });
    },
    onError: () => setPendingId(null),
  });

  const mutualIds = new Set(likedIds);

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: '#fff' }}>
            {t.liked}
          </h2>
          {whoLiked.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg,#FF4578,#C850C0)',
              borderRadius: 50, padding: '3px 10px',
              fontSize: 12, fontWeight: 700, color: '#fff',
              boxShadow: '0 4px 12px rgba(255,69,120,0.35)',
              fontFamily: 'Inter, sans-serif',
            }}>
              {whoLiked.length} {whoLiked.length === 1 ? 'новий' : 'нових'}
            </div>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif' }}>
          Люди, яким ти сподобався
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
          💫
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {whoLiked.map((person: User, i) => {
          const isMutual = mutualIds.has(person.id);
          const age = calcAge(person.birth);

          return (
            <div
              key={person.id}
              className={`fade-up-${Math.min(i + 1, 6)}`}
              style={{
                background: isMutual ? 'rgba(255,69,120,0.07)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isMutual ? 'rgba(255,69,120,0.2)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 20,
                padding: '14px 14px',
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'all 0.2s',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 54, height: 54, borderRadius: 16, flexShrink: 0,
                  overflow: 'hidden', cursor: 'pointer',
                  border: `2px solid ${isMutual ? 'rgba(255,69,120,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  background: 'linear-gradient(135deg, rgba(255,69,120,0.25), rgba(168,85,247,0.25))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}
                onClick={() => navigate(`/users/${person.id}`)}
              >
                {person.photo
                  ? <img src={person.photo} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '👤'
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <button
                  onClick={() => navigate(`/users/${person.id}`)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2, fontFamily: 'Inter, sans-serif' }}>
                    {person.name}{age ? `, ${age}` : ''}
                  </div>
                </button>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>
                  📍 {person.city}
                  {person.isSuper && ' · ⭐ Super Like'}
                </div>
                {isMutual && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: 'rgba(255,69,120,0.12)',
                    border: '1px solid rgba(255,69,120,0.25)',
                    borderRadius: 50, padding: '2px 8px',
                    fontSize: 10, fontWeight: 700, color: '#FF8FB1',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    ✨ {t.mutualBadge}
                  </div>
                )}
              </div>

              {/* Action button */}
              {isMutual ? (
                <button
                  onClick={() => navigate(`/users/${person.id}`)}
                  style={{
                    flexShrink: 0, width: 42, height: 42, borderRadius: 14, border: 'none',
                    background: 'linear-gradient(135deg,#FF4578,#C850C0)',
                    boxShadow: '0 4px 14px rgba(255,69,120,0.4)',
                    color: '#fff', fontSize: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  💬
                </button>
              ) : (
                <button
                  onClick={() => { setPendingId(person.id); replyMutation.mutate(person.id); }}
                  disabled={pendingId === person.id}
                  style={{
                    flexShrink: 0, width: 42, height: 42, borderRadius: 14, border: 'none',
                    background: pendingId === person.id ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,#FF4578,#C850C0)',
                    boxShadow: pendingId === person.id ? 'none' : '0 4px 14px rgba(255,69,120,0.4)',
                    color: '#fff', fontSize: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {pendingId === person.id ? '…' : '♡'}
                </button>
              )}
            </div>
          );
        })}

        {!isLoading && whoLiked.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>💘</div>
            <div style={{ fontSize: 15 }}>{t.noneYet}</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>{t.noneYetHint}</div>
          </div>
        )}
      </div>
    </div>
  );
}
