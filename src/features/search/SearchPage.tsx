import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profilesApi } from '@/api/profiles.api';
import { likesApi } from '@/api/likes.api';
import { ProfileCard } from './ProfileCard';
import { useUiTranslations } from '@/i18n';
import { theme } from '@/styles/theme';

export function SearchPage() {
  const [city, setCity] = useState('');
  const t = useUiTranslations();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: profilesApi.getAll,
    staleTime: 5 * 60_000,
  });

  const { data: likedIds = [] } = useQuery({
    queryKey: ['likes', 'given'],
    queryFn: likesApi.getGiven,
  });

  // For demo: simulate some profiles that have liked me back (odd index positions)
  // In production this would come from a /profiles?withLikeStatus=true endpoint
  const likedMeBackIds = new Set(profiles.filter((_, i) => i % 3 === 0).map((p) => p.id));

  const filtered = city.trim()
    ? profiles.filter((p) => p.city.toLowerCase().includes(city.trim().toLowerCase()))
    : profiles;

  return (
    <div className="fade-up">
      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none', opacity: 0.5 }}>🌿</span>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={t.cityPlaceholder}
          style={{
            width: '100%', padding: '14px 44px 14px 46px',
            background: theme.colors.glass,
            border: `1.5px solid ${theme.colors.glassBorder}`,
            borderRadius: 50, fontSize: 15,
            fontFamily: theme.fonts.sans, color: theme.colors.text,
          }}
        />
        {city && (
          <span onClick={() => setCity('')} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: theme.colors.green.mid, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</span>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: theme.fonts.sans, color: theme.colors.textMuted, fontSize: 14 }}>
          🌿 {t.loadingProfiles}
        </div>
      )}

      {/* Profile cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filtered.map((p, i) => (
          <ProfileCard
            key={p.id}
            profile={p}
            isLiked={likedIds.includes(p.id)}
            likedMeBack={likedMeBackIds.has(p.id)}
            index={i}
          />
        ))}

        {!isLoading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: theme.fonts.sans, color: theme.colors.textFaint, fontSize: 15 }}>
            🌙 {t.nobody}
            {city && <div style={{ fontSize: 13, marginTop: 6 }}>{t.nobodyCity(city)}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
