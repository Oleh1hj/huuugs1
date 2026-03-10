import { useRef, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { profilesApi } from '@/api/profiles.api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useUiTranslations } from '@/i18n';
import { calcAge } from '@/utils';
import { theme, g } from '@/styles/theme';

const LANGUAGES = ['Українська', 'Білоруська', 'Польська', 'Англійська', 'Російська', 'Інша'];

function Chip({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ background: 'rgba(86,171,145,0.1)', border: `1px solid rgba(86,171,145,0.18)`, borderRadius: 10, padding: '6px 13px', fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.green.light, display: 'flex', alignItems: 'center', gap: 5 }}>
      {icon} {label}
    </div>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: theme.colors.textFaint, marginBottom: 6 }}>
      {children}
    </div>
  );
}

function ToggleGroup({ options, value, onChange }: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          style={{
            flex: 1, padding: '10px 8px',
            background: value === o.value ? 'rgba(86,171,145,0.3)' : 'rgba(255,255,255,0.05)',
            border: `1.5px solid ${value === o.value ? 'rgba(86,171,145,0.6)' : theme.colors.glassBorder}`,
            borderRadius: theme.radius.md,
            color: value === o.value ? theme.colors.green.light : theme.colors.textMuted,
            fontFamily: theme.fonts.sans, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX = 600;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function ProfilePage() {
  const { user, updateUser, logout } = useAuthStore();
  const t = useUiTranslations();
  const [editMode, setEditMode] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [whoCanContact, setWhoCanContact] = useState('anyone');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    defaultValues: {
      name: user?.name ?? '',
      birth: user?.birth ?? '',
      city: user?.city ?? '',
      bio: user?.bio ?? '',
      gender: user?.gender ?? 'male',
      language: user?.language ?? 'Українська',
      lookingForGender: user?.lookingForGender ?? 'any',
      lookingForCity: user?.lookingForCity ?? '',
      lookingForAgeMin: user?.lookingForAgeMin ?? '',
      lookingForAgeMax: user?.lookingForAgeMax ?? '',
    },
  });

  const genderVal = watch('gender');
  const lookingForGenderVal = watch('lookingForGender');

  // Reset form with fresh user data every time edit mode is opened
  useEffect(() => {
    if (editMode && user) {
      reset({
        name: user.name ?? '',
        birth: user.birth ?? '',
        city: user.city ?? '',
        bio: user.bio ?? '',
        gender: user.gender ?? 'male',
        language: user.language ?? 'Українська',
        lookingForGender: user.lookingForGender ?? 'any',
        lookingForCity: user.lookingForCity ?? '',
        lookingForAgeMin: user.lookingForAgeMin ?? '',
        lookingForAgeMax: user.lookingForAgeMax ?? '',
      });
      setPhotos(user.photos ?? (user.photo ? [user.photo] : []));
      setWhoCanContact(user.whoCanContact ?? 'anyone');
    }
  }, [editMode]); // eslint-disable-line

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const compressed = await Promise.all(files.map(compressImage));
    setPhotos((prev) => [...prev, ...compressed].slice(0, 5));
    e.target.value = '';
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const [saveError, setSaveError] = useState<string>('');

  const updateMutation = useMutation({
    mutationFn: profilesApi.updateMe,
    onSuccess: (updated) => {
      updateUser(updated);
      setEditMode(false);
      setSaveError('');
    },
    onError: () => {
      setSaveError('Помилка збереження. Перевір дані та спробуй ще раз.');
    },
  });

  if (!user) return null;

  const displayPhoto = (user.photos?.[0] ?? user.photo) || null;

  return (
    <div className="fade-up">
      <div style={{ background: g.card, borderRadius: theme.radius.xl, overflow: 'hidden', border: `1px solid ${theme.colors.glassBorder}`, backdropFilter: 'blur(20px)' }}>
        {/* Photo banner */}
        <div style={{ position: 'relative', height: 280 }}>
          {displayPhoto
            ? <img src={displayPhoto} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%', background: 'rgba(86,171,145,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Avatar photo={null} name={user.name} size={120} />
              </div>
          }
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 35%,rgba(8,20,14,0.92) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 20, left: 22 }}>
            <div style={{ fontFamily: theme.fonts.serif, fontSize: 30, fontWeight: 500, color: theme.colors.text }}>{user.name}</div>
            <div style={{ fontFamily: theme.fonts.sans, fontSize: 13, color: 'rgba(168,230,207,0.65)', marginTop: 3 }}>
              {calcAge(user.birth)} р. · 🌿 {user.city}
              {user.isAdmin && <span style={{ marginLeft: 8, background: 'rgba(249,217,118,0.2)', border: '1px solid rgba(249,217,118,0.4)', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#f9d976' }}>Адмін</span>}
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 22px 26px' }}>
          {!editMode ? (
            <>
              {/* Photo thumbnails */}
              {(user.photos?.length ?? 0) > 1 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
                  {user.photos.map((p, i) => (
                    <img key={i} src={p} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0, border: i === 0 ? `2px solid ${theme.colors.green.mid}` : `1px solid ${theme.colors.glassBorder}` }} />
                  ))}
                </div>
              )}
              <p style={{ fontFamily: theme.fonts.serif, fontSize: 17, fontStyle: 'italic', color: 'rgba(232,244,232,0.7)', lineHeight: 1.7, marginBottom: 16 }}>{user.bio || '—'}</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {user.gender && <Chip icon={user.gender === 'male' ? '♂' : '♀'} label={user.gender === 'male' ? t.genderMale : t.genderFemale} />}
                <Chip icon="🌿" label={user.city} />
                <Chip icon="🎂" label={new Date(user.birth).toLocaleDateString('uk-UA')} />
                {user.language && <Chip icon="💬" label={user.language} />}
              </div>
              {(user.lookingForGender || user.lookingForCity || user.lookingForAgeMin) && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: theme.colors.textFaint, marginBottom: 8 }}>{t.lookingSection}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {user.lookingForGender && <Chip icon="❤" label={user.lookingForGender === 'male' ? t.lookingMale : user.lookingForGender === 'female' ? t.lookingFemale : t.lookingAny} />}
                    {user.lookingForCity && <Chip icon="📍" label={user.lookingForCity} />}
                    {user.lookingForAgeMin && user.lookingForAgeMax && <Chip icon="🎯" label={`${user.lookingForAgeMin}–${user.lookingForAgeMax} р.`} />}
                  </div>
                </div>
              )}
              {/* Who can contact */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: theme.colors.textFaint, marginBottom: 8 }}>Хто може писати</div>
                <Chip icon="🔒" label={{ anyone: 'Всі', liked_me: 'Хто мені вподобав', mutual: 'Лише взаємні' }[user.whoCanContact ?? 'anyone'] ?? 'Всі'} />
              </div>
              <Button fullWidth onClick={() => setEditMode(true)}>{t.editBtn}</Button>
              <Button fullWidth variant="ghost" onClick={logout} style={{ marginTop: 10 }}>{t.logout}</Button>
            </>
          ) : (
            <form onSubmit={handleSubmit((d) => {
              const payload = {
                ...d,
                photos,
                whoCanContact,
                lookingForAgeMin: d.lookingForAgeMin !== '' && d.lookingForAgeMin != null ? Number(d.lookingForAgeMin) : undefined,
                lookingForAgeMax: d.lookingForAgeMax !== '' && d.lookingForAgeMax != null ? Number(d.lookingForAgeMax) : undefined,
              };
              setSaveError('');
              updateMutation.mutate(payload as any);
            })} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Photos management */}
              <div>
                <FieldLabel>Фото (до 5)</FieldLabel>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {photos.map((p, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={p} alt="" style={{ width: 70, height: 70, borderRadius: 12, objectFit: 'cover', border: i === 0 ? `2px solid ${theme.colors.green.mid}` : `1px solid ${theme.colors.glassBorder}` }} />
                      {i === 0 && <div style={{ position: 'absolute', bottom: -6, left: 0, right: 0, textAlign: 'center', fontFamily: theme.fonts.sans, fontSize: 9, color: theme.colors.green.light }}>Головне</div>}
                      <button type="button" onClick={() => removePhoto(i)} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#e11d48', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <button type="button" onClick={() => fileInputRef.current?.click()} style={{ width: 70, height: 70, borderRadius: 12, background: 'rgba(86,171,145,0.06)', border: `2px dashed ${theme.colors.glassBorder}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <span style={{ fontSize: 18 }}>📷</span>
                      <span style={{ fontFamily: theme.fonts.sans, fontSize: 9, color: theme.colors.textFaint }}>Додати</span>
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleAddPhoto} />
              </div>

              <Input label={t.fieldName} error={errors.name?.message} {...register('name', { required: true })} />
              <Input label={t.fieldBirth} type="date" error={errors.birth?.message} {...register('birth', { required: true })} />
              <Input label={t.fieldCity} error={errors.city?.message} {...register('city', { required: true })} />

              <div>
                <FieldLabel>{t.genderLabel}</FieldLabel>
                <ToggleGroup
                  value={genderVal}
                  onChange={(v) => setValue('gender', v)}
                  options={[{ label: t.genderMale, value: 'male' }, { label: t.genderFemale, value: 'female' }]}
                />
              </div>

              <div>
                <FieldLabel>{t.langLabel}</FieldLabel>
                <select {...register('language')} style={{ width: '100%', padding: '12px 16px', background: theme.colors.glass, border: `1.5px solid ${theme.colors.glassBorder}`, borderRadius: theme.radius.md, fontFamily: theme.fonts.sans, fontSize: 15, color: theme.colors.text }}>
                  {LANGUAGES.map((l) => <option key={l} value={l} style={{ background: '#0d1f17' }}>{l}</option>)}
                </select>
              </div>

              <div>
                <FieldLabel>{t.bioLabel}</FieldLabel>
                <textarea rows={3} {...register('bio')} style={{ display: 'block', width: '100%', padding: '12px 16px', background: theme.colors.glass, border: `1.5px solid ${theme.colors.glassBorder}`, borderRadius: theme.radius.md, fontSize: 15, fontFamily: theme.fonts.sans, color: theme.colors.text, resize: 'none', lineHeight: 1.6, boxSizing: 'border-box' }} />
              </div>

              <div style={{ height: 1, background: theme.colors.glassBorder }} />
              <FieldLabel>{t.lookingSection}</FieldLabel>

              <div>
                <FieldLabel>{t.genderLabel}</FieldLabel>
                <ToggleGroup
                  value={lookingForGenderVal}
                  onChange={(v) => setValue('lookingForGender', v)}
                  options={[{ label: t.lookingMale, value: 'male' }, { label: t.lookingFemale, value: 'female' }, { label: t.lookingAny, value: 'any' }]}
                />
              </div>

              <Input label={t.lookingCityOptional} {...register('lookingForCity')} />

              <div>
                <FieldLabel>{t.ageRange}</FieldLabel>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="number" min={18} max={100} placeholder="18" {...register('lookingForAgeMin')} style={{ flex: 1, padding: '12px 16px', background: theme.colors.glass, border: `1.5px solid ${theme.colors.glassBorder}`, borderRadius: theme.radius.md, fontFamily: theme.fonts.sans, fontSize: 15, color: theme.colors.text }} />
                  <span style={{ color: theme.colors.textMuted, fontSize: 13 }}>—</span>
                  <input type="number" min={18} max={100} placeholder="99" {...register('lookingForAgeMax')} style={{ flex: 1, padding: '12px 16px', background: theme.colors.glass, border: `1.5px solid ${theme.colors.glassBorder}`, borderRadius: theme.radius.md, fontFamily: theme.fonts.sans, fontSize: 15, color: theme.colors.text }} />
                </div>
              </div>

              {/* Who can contact me */}
              <div style={{ height: 1, background: theme.colors.glassBorder }} />
              <div>
                <FieldLabel>Хто може мені писати</FieldLabel>
                <ToggleGroup
                  value={whoCanContact}
                  onChange={setWhoCanContact}
                  options={[
                    { label: 'Всі', value: 'anyone' },
                    { label: 'Вподобали', value: 'liked_me' },
                    { label: 'Взаємні', value: 'mutual' },
                  ]}
                />
              </div>

              {saveError && (
                <div style={{ fontFamily: theme.fonts.sans, fontSize: 13, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: theme.radius.md, padding: '10px 14px' }}>
                  {saveError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <Button type="submit" fullWidth loading={updateMutation.isPending}>{t.saveBtn}</Button>
                <Button type="button" variant="ghost" fullWidth onClick={() => { reset(); setEditMode(false); setSaveError(''); }}>{t.cancelBtn}</Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
