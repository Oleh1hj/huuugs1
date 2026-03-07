import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { profilesApi } from '@/api/profiles.api';
import { useUiTranslations } from '@/i18n';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { calcAge } from '@/utils';
import { theme, g } from '@/styles/theme';

function Chip({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ background: 'rgba(86,171,145,0.1)', border: `1px solid rgba(86,171,145,0.18)`, borderRadius: 10, padding: '6px 13px', fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.green.light, display: 'flex', alignItems: 'center', gap: 5 }}>
      {icon} {label}
    </div>
  );
}

export function ProfilePage() {
  const t = useUiTranslations();
  const { user, updateUser } = useAuthStore();
  const [editMode, setEditMode] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      name: user?.name ?? '',
      birth: user?.birth ?? '',
      city: user?.city ?? '',
      bio: user?.bio ?? '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: profilesApi.updateMe,
    onSuccess: (updated) => {
      updateUser(updated);
      setEditMode(false);
    },
  });

  if (!user) return null;

  return (
    <div className="fade-up">
      <div style={{ background: g.card, borderRadius: theme.radius.xl, overflow: 'hidden', border: `1px solid ${theme.colors.glassBorder}`, backdropFilter: 'blur(20px)' }}>
        {/* Photo banner */}
        <div style={{ position: 'relative', height: 300 }}>
          {user.photo
            ? <img src={user.photo} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%', background: 'rgba(86,171,145,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Avatar photo={null} name={user.name} size={120} />
              </div>
          }
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 35%,rgba(8,20,14,0.92) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 20, left: 22 }}>
            <div style={{ fontFamily: theme.fonts.serif, fontSize: 30, fontWeight: 500, color: theme.colors.text }}>{user.name}</div>
            <div style={{ fontFamily: theme.fonts.sans, fontSize: 13, color: 'rgba(168,230,207,0.65)', marginTop: 3 }}>{calcAge(user.birth)} {t.years} · 🌿 {user.city}</div>
          </div>
        </div>

        <div style={{ padding: '20px 22px 26px' }}>
          {!editMode ? (
            <>
              <p style={{ fontFamily: theme.fonts.serif, fontSize: 17, fontStyle: 'italic', color: 'rgba(232,244,232,0.7)', lineHeight: 1.7, marginBottom: 20 }}>{user.bio || '—'}</p>
              <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
                <Chip icon="🌿" label={user.city} />
                <Chip icon="🎂" label={new Date(user.birth).toLocaleDateString('uk-UA')} />
              </div>
              <Button fullWidth onClick={() => setEditMode(true)}>{t.editBtn}</Button>
            </>
          ) : (
            <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input label={t.fieldName} error={errors.name?.message} {...register('name', { required: true })} />
              <Input label={t.fieldBirth} type="date" error={errors.birth?.message} {...register('birth', { required: true })} />
              <Input label={t.fieldCity} error={errors.city?.message} {...register('city', { required: true })} />
              <div>
                <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: theme.colors.textFaint, marginBottom: 6 }}>{t.fieldBio}</div>
                <textarea
                  rows={3}
                  {...register('bio')}
                  style={{ display: 'block', width: '100%', padding: '12px 16px', background: theme.colors.glass, border: `1.5px solid ${theme.colors.glassBorder}`, borderRadius: theme.radius.md, fontSize: 15, fontFamily: theme.fonts.sans, color: theme.colors.text, resize: 'none', lineHeight: 1.6 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <Button type="submit" fullWidth loading={updateMutation.isPending}>{t.saveBtn}</Button>
                <Button type="button" variant="ghost" fullWidth onClick={() => { reset(); setEditMode(false); }}>{t.cancelBtn}</Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
