import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profilesApi } from '@/api/profiles.api';
import { chatsApi } from '@/api/chats.api';
import { likesApi } from '@/api/likes.api';
import { ProfileCard } from './ProfileCard';
import { useUiTranslations } from '@/i18n';

export function SearchPage() {
  const t = useUiTranslations();
  const [city, setCity] = useState('');
  const [genderFilter, setGenderFilter] = useState('any');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [language, setLanguage] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles', genderFilter, city, ageMin, ageMax, language],
    queryFn: () => profilesApi.getAllFiltered({
      gender: genderFilter !== 'any' ? genderFilter : undefined,
      city: city.trim() || undefined,
      ageMin: ageMin ? Number(ageMin) : undefined,
      ageMax: ageMax ? Number(ageMax) : undefined,
      language: language.trim() || undefined,
    }),
    staleTime: 5 * 60_000,
  });

  const { data: likedIds = [] } = useQuery({
    queryKey: ['likes', 'given'],
    queryFn: likesApi.getGiven,
  });

  const { data: receivedLikes = [] } = useQuery({
    queryKey: ['likes', 'received'],
    queryFn: likesApi.getReceived,
    refetchInterval: 60_000,
  });

  const { data: onlineIds = [] } = useQuery({
    queryKey: ['online-users'],
    queryFn: chatsApi.getOnlineUsers,
    refetchInterval: 30_000,
  });

  const onlineSet = new Set(onlineIds);
  const likedMeBackIds = new Set(receivedLikes.map((u) => u.id));
  const hasActiveFilters = genderFilter !== 'any' || !!ageMin || !!ageMax || !!language;

  const inputBase = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14,
    color: '#fff',
    fontFamily: 'Inter, sans-serif',
  } as const;

  return (
    <div className="fade-up">
      {/* Search + filter bar */}
      <div style={{ marginBottom: 14, display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none', opacity: 0.5 }}>🔍</span>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t.cityPlaceholder}
            style={{
              width: '100%', padding: '13px 44px 13px 46px', boxSizing: 'border-box',
              ...inputBase,
            }}
          />
          {city && (
            <span onClick={() => setCity('')} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#FF8FB1', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</span>
          )}
        </div>
        <button
          onClick={() => setShowFilters((s) => !s)}
          style={{
            padding: '0 16px', borderRadius: 14,
            background: (showFilters || hasActiveFilters) ? 'rgba(255,69,120,0.15)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${(showFilters || hasActiveFilters) ? 'rgba(255,69,120,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: (showFilters || hasActiveFilters) ? '#FF8FB1' : 'rgba(255,255,255,0.5)',
            fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            flexShrink: 0, whiteSpace: 'nowrap',
          }}
        >
          ⚙ Фільтр{hasActiveFilters ? ' ●' : ''}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '16px', marginBottom: 14,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Стать</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ label: 'Всі', value: 'any' }, { label: 'Хлопці', value: 'male' }, { label: 'Дівчата', value: 'female' }].map((o) => (
                <button key={o.value} onClick={() => setGenderFilter(o.value)} style={{
                  flex: 1, padding: '9px 4px', borderRadius: 12,
                  background: genderFilter === o.value ? 'linear-gradient(135deg,#FF4578,#C850C0)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${genderFilter === o.value ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                  color: genderFilter === o.value ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  boxShadow: genderFilter === o.value ? '0 4px 12px rgba(255,69,120,0.3)' : 'none',
                }}>{o.label}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Вік</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="number" min={18} max={100} placeholder="від" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} style={{ flex: 1, padding: '10px 12px', ...inputBase, borderRadius: 12 }} />
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>—</span>
              <input type="number" min={18} max={100} placeholder="до" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} style={{ flex: 1, padding: '10px 12px', ...inputBase, borderRadius: 12 }} />
              {(ageMin || ageMax) && <button onClick={() => { setAgeMin(''); setAgeMax(''); }} style={{ background: 'none', border: 'none', color: '#FF8FB1', cursor: 'pointer', fontSize: 18 }}>✕</button>}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Мова</div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="напр. українська"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ width: '100%', padding: '10px 36px 10px 12px', boxSizing: 'border-box', ...inputBase, borderRadius: 12 }}
              />
              {language && <button onClick={() => setLanguage('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#FF8FB1', cursor: 'pointer', fontSize: 18 }}>✕</button>}
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
          💫 {t.loadingProfiles}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {profiles.map((p, i) => (
          <ProfileCard
            key={p.id}
            profile={{ ...p, online: onlineSet.has(p.id) }}
            isLiked={likedIds.includes(p.id)}
            likedMeBack={likedMeBackIds.has(p.id)}
            index={i}
          />
        ))}
        {!isLoading && profiles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.3)', fontSize: 15 }}>
            🌙 {t.nobody}
            {city && <div style={{ fontSize: 13, marginTop: 6 }}>{t.nobodyCity(city)}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
