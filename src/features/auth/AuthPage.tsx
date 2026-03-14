import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Particles } from '@/components/Particles';
import { theme, g } from '@/styles/theme';

const LANGUAGES = ['Українська', 'Білоруська', 'Польська', 'Англійська', 'Російська', 'Інша'];

const DRAFT_KEY = 'huugs_reg_draft';

function readDraft(): Partial<RegisterForm> {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const loginSchema = z.object({
  email: z.string().email('Невірний email'),
  password: z.string().min(8, 'Мін. 8 символів'),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Мін. 2 символи').max(50),
  birth: z.string().min(1, 'Вкажи дату народження'),
  city: z.string().min(2, 'Вкажи місто').max(100),
  gender: z.enum(['male', 'female'], { required_error: 'Вкажи стать' }),
  language: z.string().min(1, 'Вкажи мову'),
  bio: z.string().max(500).optional(),
  photo: z.string().optional(),
  lookingForGender: z.enum(['male', 'female', 'any']),
  lookingForCity: z.string().max(100).optional(),
  lookingForAgeMin: z.coerce.number().int().min(18).max(100).optional().or(z.literal('')),
  lookingForAgeMax: z.coerce.number().int().min(18).max(100).optional().or(z.literal('')),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

// Inline toggle for binary choices
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
            fontFamily: theme.fonts.sans, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{
      fontFamily: theme.fonts.sans, fontSize: 10, letterSpacing: 2,
      textTransform: 'uppercase', color: theme.colors.textFaint,
      marginBottom: 10, marginTop: 6,
    }}>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <div style={{
      fontFamily: theme.fonts.sans, fontSize: 10, letterSpacing: 2,
      textTransform: 'uppercase', color: theme.colors.textFaint, marginBottom: 6,
    }}>
      {children}
    </div>
  );
}

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showWelcome, setShowWelcome] = useState(false);
  const { setAuth } = useAuthStore();
  const { lang, setLang } = useUiStore();
  const navigate = useNavigate();

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const draft = readDraft();
  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { gender: 'male', lookingForGender: 'any', language: 'Українська', ...draft },
  });

  // Persist draft to sessionStorage on every change (exclude photo & password)
  useEffect(() => {
    const { unsubscribe } = registerForm.watch((values) => {
      const { photo, password, ...toSave } = values as any;
      try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(toSave)); } catch {}
    });
    return unsubscribe;
  }, [registerForm]);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: LoginForm) => authApi.login(email, password),
    onSuccess: (data) => { setAuth(data.user, data.accessToken, data.refreshToken); navigate('/search'); },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterForm) => authApi.register({
      ...data,
      lookingForAgeMin: data.lookingForAgeMin ? Number(data.lookingForAgeMin) : undefined,
      lookingForAgeMax: data.lookingForAgeMax ? Number(data.lookingForAgeMax) : undefined,
    }),
    onSuccess: (data) => { sessionStorage.removeItem(DRAFT_KEY); setAuth(data.user, data.accessToken, data.refreshToken); setShowWelcome(true); },
    onError: () => { /* error rendered below */ },
  });

  const isLogin = mode === 'login';
  const getErrMsg = (e: unknown) => {
    if (!e) return undefined;
    const ae = e as any;
    const srv = ae?.response?.data;
    if (typeof srv?.message === 'string') return srv.message;
    if (Array.isArray(srv?.message)) return srv.message.join(', ');
    return ae?.message ?? 'Помилка сервера';
  };
  const error = getErrMsg(loginMutation.error) ?? getErrMsg(registerMutation.error);

  const [photoPreview, setPhotoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (!dataUrl) return;
      const img = new Image();
      img.onload = () => {
        const MAX = 600;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const result = canvas.toDataURL('image/jpeg', 0.75);
        setPhotoPreview(result);
        registerForm.setValue('photo', result);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const genderVal = registerForm.watch('gender');
  const lookingForGenderVal = registerForm.watch('lookingForGender');

  const labels = {
    ua: {
      aboutMe: 'ПРО СЕБЕ',
      lookingFor: 'КОГО ШУКАЮ',
      male: 'Хлопець',
      female: 'Дівчина',
      any: 'Всі',
      gender: 'Стать',
      language: 'Мова спілкування',
      bio: 'Про себе (необов\'язково)',
      lookingGender: 'Шукаю',
      lookingCity: 'Місто (необов\'язково)',
      ageFrom: 'Вік від',
      ageTo: 'до',
    },
    by: {
      aboutMe: 'ПРА СЯБЕ',
      lookingFor: 'КАГО ШУКАЮ',
      male: 'Хлопец',
      female: 'Дзяўчына',
      any: 'Усе',
      gender: 'Пол',
      language: 'Мова зносін',
      bio: 'Пра сябе (неабавязкова)',
      lookingGender: 'Шукаю',
      lookingCity: 'Горад (неабавязкова)',
      ageFrom: 'Узрост ад',
      ageTo: 'да',
    },
    pl: {
      aboutMe: 'O SOBIE',
      lookingFor: 'KOGO SZUKAM',
      male: 'Chłopak',
      female: 'Dziewczyna',
      any: 'Wszyscy',
      gender: 'Płeć',
      language: 'Język',
      bio: 'O sobie (opcjonalnie)',
      lookingGender: 'Szukam',
      lookingCity: 'Miasto (opcjonalnie)',
      ageFrom: 'Wiek od',
      ageTo: 'do',
    },
    en: {
      aboutMe: 'ABOUT ME',
      lookingFor: 'LOOKING FOR',
      male: 'Male',
      female: 'Female',
      any: 'Anyone',
      gender: 'Gender',
      language: 'Language',
      bio: 'About me (optional)',
      lookingGender: 'Looking for',
      lookingCity: 'City (optional)',
      ageFrom: 'Age from',
      ageTo: 'to',
    },
  }[lang];

  return (
    <div style={{ minHeight: '100dvh', background: g.bg, position: 'relative', overflowX: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <Particles />
      <div style={{ position: 'fixed', borderRadius: '50%', filter: 'blur(70px)', pointerEvents: 'none', zIndex: 0, width: 320, height: 320, top: -90, right: -90, background: 'rgba(86,171,145,0.07)' }} />

      {/* Lang */}
      <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 50, padding: 3, gap: 2, border: `1px solid ${theme.colors.glassBorder}`, zIndex: 2 }}>
        {(['ua', 'by', 'pl', 'en'] as const).map((code) => (
          <button key={code} onClick={() => setLang(code)} style={{ background: lang === code ? 'rgba(86,171,145,0.35)' : 'transparent', border: 'none', borderRadius: 50, width: 38, height: 38, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', color: lang === code ? '#56ab91' : 'rgba(255,255,255,0.7)', letterSpacing: '0.5px' }}>
            {code === 'ua' ? 'UA' : code === 'by' ? 'BY' : code === 'pl' ? 'PL' : 'EN'}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 20px' }}>
            <div style={{ position: 'absolute', inset: 0, border: '1.5px solid rgba(86,171,145,0.25)', borderRadius: '50%', animation: 'orbit 6s linear infinite' }} />
            <div style={{ position: 'absolute', inset: 8, border: '1px solid rgba(168,230,207,0.15)', borderRadius: '50%', animation: 'orbit 10s linear infinite reverse' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 24, height: 24, borderRadius: '50%', background: g.greenBtn, boxShadow: '0 0 20px rgba(86,171,145,0.6)' }} />
            <div style={{ position: 'absolute', top: 0, left: '50%', width: 8, height: 8, borderRadius: '50%', background: theme.colors.yellow, boxShadow: '0 0 8px rgba(249,217,118,0.8)', marginLeft: -4, marginTop: -4, transformOrigin: '4px 44px', animation: 'orbit 6s linear infinite' }} />
          </div>
          <h1 style={{ fontFamily: theme.fonts.serif, fontSize: 42, fontWeight: 600, background: g.text, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'shimmer 4s linear infinite' }}>Huugs</h1>
        </div>

        {/* Card */}
        <div style={{ background: 'linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))', border: `1px solid ${theme.colors.glassBorder}`, borderRadius: theme.radius.xl, padding: '32px 24px', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
          {/* Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4, marginBottom: 24 }}>
            {(['login', 'register'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{ background: mode === m ? g.greenBtn : 'transparent', border: 'none', borderRadius: 11, padding: '10px', color: mode === m ? '#fff' : theme.colors.textMuted, fontFamily: theme.fonts.sans, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                {m === 'login'
                  ? { ua: 'Вхід', by: 'Уваход', pl: 'Logowanie', en: 'Log in' }[lang]
                  : { ua: 'Реєстрація', by: 'Рэгістрацыя', pl: 'Rejestracja', en: 'Sign up' }[lang]}
              </button>
            ))}
          </div>

          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit((d) => loginMutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input label="Email" type="email" placeholder="you@example.com" error={loginForm.formState.errors.email?.message} {...loginForm.register('email')} />
              <Input label={{ ua: 'Пароль', by: 'Пароль', pl: 'Hasło', en: 'Password' }[lang]} type="password" placeholder="••••••••" error={loginForm.formState.errors.password?.message} {...loginForm.register('password')} />
              {error && <div style={{ fontFamily: theme.fonts.sans, fontSize: 13, color: '#ff6b8a', textAlign: 'center', background: 'rgba(255,107,138,0.1)', border: '1px solid rgba(255,107,138,0.3)', borderRadius: 10, padding: '10px 14px' }}>{error}</div>}
              <Button type="submit" fullWidth loading={loginMutation.isPending} style={{ marginTop: 8 }}>
                {{ ua: 'Увійти', by: 'Увайсці', pl: 'Zaloguj się', en: 'Log in' }[lang]}
              </Button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit((d) => registerMutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* ── ПРО СЕБЕ ── */}
              <SectionLabel>{labels.aboutMe}</SectionLabel>

              {/* Photo upload */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 90, height: 90, borderRadius: '50%', cursor: 'pointer',
                    border: `2px dashed ${photoPreview ? 'rgba(86,171,145,0.6)' : theme.colors.glassBorder}`,
                    background: photoPreview ? 'transparent' : 'rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', position: 'relative', transition: 'border-color 0.2s',
                  }}
                >
                  {photoPreview
                    ? <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, marginBottom: 2 }}>📷</div>
                        <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.textFaint }}>Фото</div>
                      </div>
                  }
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoChange}
                />
              </div>

              <Input
                label={{ ua: "Ім'я", by: 'Імя', pl: 'Imię', en: 'Name' }[lang]}
                placeholder="Олег"
                error={registerForm.formState.errors.name?.message}
                {...registerForm.register('name')}
              />
              <Input
                label="Email" type="email" placeholder="you@example.com"
                error={registerForm.formState.errors.email?.message}
                {...registerForm.register('email')}
              />
              <Input
                label={{ ua: 'Пароль', by: 'Пароль', pl: 'Hasło', en: 'Password' }[lang]}
                type="password" placeholder="мін. 8 символів"
                error={registerForm.formState.errors.password?.message}
                {...registerForm.register('password')}
              />
              <Input
                label={{ ua: 'Дата народження', by: 'Дата нараджэння', pl: 'Data urodzenia', en: 'Date of birth' }[lang]}
                type="date"
                error={registerForm.formState.errors.birth?.message}
                {...registerForm.register('birth')}
              />
              <Input
                label={{ ua: 'Місто', by: 'Горад', pl: 'Miasto', en: 'City' }[lang]}
                placeholder={{ ua: 'Київ', by: 'Мінск', pl: 'Warszawa', en: 'London' }[lang]}
                error={registerForm.formState.errors.city?.message}
                {...registerForm.register('city')}
              />

              {/* Стать */}
              <div>
                <FieldLabel>{labels.gender}</FieldLabel>
                <ToggleGroup
                  value={genderVal}
                  onChange={(v) => registerForm.setValue('gender', v as 'male' | 'female')}
                  options={[
                    { label: labels.male, value: 'male' },
                    { label: labels.female, value: 'female' },
                  ]}
                />
                {registerForm.formState.errors.gender && (
                  <div style={{ fontSize: 11, color: '#ff6b8a', marginTop: 4 }}>{registerForm.formState.errors.gender.message}</div>
                )}
              </div>

              {/* Мова */}
              <div>
                <FieldLabel>{labels.language}</FieldLabel>
                <select
                  {...registerForm.register('language')}
                  style={{
                    width: '100%', padding: '12px 16px',
                    background: theme.colors.glass,
                    border: `1.5px solid ${theme.colors.glassBorder}`,
                    borderRadius: theme.radius.md,
                    fontFamily: theme.fonts.sans, fontSize: 15,
                    color: theme.colors.text, cursor: 'pointer',
                  }}
                >
                  {LANGUAGES.map((l) => <option key={l} value={l} style={{ background: '#0d1f17' }}>{l}</option>)}
                </select>
              </div>

              {/* Опис */}
              <div>
                <FieldLabel>{labels.bio}</FieldLabel>
                <textarea
                  rows={3}
                  placeholder={{ ua: 'Розкажи про себе…', by: 'Раскажы пра сябе…', pl: 'Opowiedz o sobie…', en: 'Tell about yourself…' }[lang]}
                  {...registerForm.register('bio')}
                  style={{
                    display: 'block', width: '100%', padding: '12px 16px',
                    background: theme.colors.glass,
                    border: `1.5px solid ${theme.colors.glassBorder}`,
                    borderRadius: theme.radius.md,
                    fontSize: 15, fontFamily: theme.fonts.sans,
                    color: theme.colors.text, resize: 'none', lineHeight: 1.6,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* ── КОГО ШУКАЮ ── */}
              <div style={{ height: 1, background: theme.colors.glassBorder, margin: '6px 0' }} />
              <SectionLabel>{labels.lookingFor}</SectionLabel>

              {/* Стать кого шукаю */}
              <div>
                <FieldLabel>{labels.lookingGender}</FieldLabel>
                <ToggleGroup
                  value={lookingForGenderVal}
                  onChange={(v) => registerForm.setValue('lookingForGender', v as 'male' | 'female' | 'any')}
                  options={[
                    { label: labels.male, value: 'male' },
                    { label: labels.female, value: 'female' },
                    { label: labels.any, value: 'any' },
                  ]}
                />
              </div>

              {/* Місто кого шукаю */}
              <Input
                label={labels.lookingCity}
                placeholder={{ ua: 'Київ', by: 'Мінск', pl: 'Warszawa', en: 'London' }[lang]}
                error={registerForm.formState.errors.lookingForCity?.message}
                {...registerForm.register('lookingForCity')}
              />

              {/* Вік */}
              <div>
                <FieldLabel>{{ ua: 'Вік', by: 'Узрост', pl: 'Wiek', en: 'Age range' }[lang]}</FieldLabel>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="number" min={18} max={100} placeholder="18"
                    {...registerForm.register('lookingForAgeMin')}
                    style={{
                      flex: 1, padding: '12px 16px',
                      background: theme.colors.glass,
                      border: `1.5px solid ${theme.colors.glassBorder}`,
                      borderRadius: theme.radius.md,
                      fontFamily: theme.fonts.sans, fontSize: 15,
                      color: theme.colors.text,
                    }}
                  />
                  <span style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.sans, fontSize: 13 }}>—</span>
                  <input
                    type="number" min={18} max={100} placeholder="99"
                    {...registerForm.register('lookingForAgeMax')}
                    style={{
                      flex: 1, padding: '12px 16px',
                      background: theme.colors.glass,
                      border: `1.5px solid ${theme.colors.glassBorder}`,
                      borderRadius: theme.radius.md,
                      fontFamily: theme.fonts.sans, fontSize: 15,
                      color: theme.colors.text,
                    }}
                  />
                </div>
              </div>

              {error && <div style={{ fontFamily: theme.fonts.sans, fontSize: 13, color: '#ff6b8a', textAlign: 'center', background: 'rgba(255,107,138,0.1)', border: '1px solid rgba(255,107,138,0.3)', borderRadius: 10, padding: '10px 14px' }}>{error}</div>}

              <Button type="submit" fullWidth loading={registerMutation.isPending} style={{ marginTop: 8 }}>
                {{ ua: 'Зареєструватись', by: 'Зарэгіструвацца', pl: 'Zarejestruj się', en: 'Sign up' }[lang]}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Welcome popup after registration */}
      {showWelcome && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
          <div style={{ background: 'linear-gradient(145deg,rgba(13,31,23,0.98),rgba(8,20,14,0.99))', border: '1px solid rgba(86,171,145,0.3)', borderRadius: 24, padding: '32px 28px', maxWidth: 360, width: '100%', textAlign: 'center', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
            <div style={{ fontFamily: theme.fonts.serif, fontSize: 24, color: theme.colors.text, marginBottom: 18 }}>Ласкаво просимо!</div>
            <div style={{ fontFamily: theme.fonts.sans, fontSize: 14, color: 'rgba(168,230,207,0.75)', lineHeight: 1.75, marginBottom: 28, textAlign: 'left', background: 'rgba(86,171,145,0.06)', border: '1px solid rgba(86,171,145,0.15)', borderRadius: 14, padding: '16px 18px' }}>
              Цей сайт був створений недавно, тому можливо учасників є не сильно багато. Буду вдячний за розуміння 🙏<br /><br />
              Кожному новому учаснику дається <strong style={{ color: '#f9d976' }}>⭐ Premium підписка на 1 місяць</strong> — з повагою, <strong style={{ color: theme.colors.green.light }}>Адмін</strong>
            </div>
            <button
              onClick={() => { setShowWelcome(false); navigate('/search'); }}
              style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg,#56ab91,#3d8b6a)', border: 'none', color: '#fff', fontFamily: theme.fonts.sans, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(86,171,145,0.4)' }}
            >
              Дякую, розпочати! 💚
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
