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
            background: value === o.value ? 'linear-gradient(135deg,#FF4578,#C850C0)' : 'rgba(255,255,255,0.05)',
            border: `1.5px solid ${value === o.value ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 12,
            color: value === o.value ? '#fff' : 'rgba(255,255,255,0.5)',
            fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: value === o.value ? '0 4px 12px rgba(255,69,120,0.3)' : 'none',
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
      fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: 2,
      textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
      marginBottom: 10, marginTop: 6,
    }}>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <div style={{
      fontFamily: 'Inter, sans-serif', fontSize: 10, letterSpacing: 2,
      textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 6,
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
      aboutMe: 'ПРО СЕБЕ', lookingFor: 'КОГО ШУКАЮ',
      male: 'Хлопець', female: 'Дівчина', any: 'Всі',
      gender: 'Стать', language: 'Мова спілкування',
      bio: "Про себе (необов'язково)", lookingGender: 'Шукаю',
      lookingCity: 'Місто (необов\'язково)', ageFrom: 'Вік від', ageTo: 'до',
    },
    by: {
      aboutMe: 'ПРА СЯБЕ', lookingFor: 'КАГО ШУКАЮ',
      male: 'Хлопец', female: 'Дзяўчына', any: 'Усе',
      gender: 'Пол', language: 'Мова зносін',
      bio: 'Пра сябе (неабавязкова)', lookingGender: 'Шукаю',
      lookingCity: 'Горад (неабавязкова)', ageFrom: 'Узрост ад', ageTo: 'да',
    },
    pl: {
      aboutMe: 'O SOBIE', lookingFor: 'KOGO SZUKAM',
      male: 'Chłopak', female: 'Dziewczyna', any: 'Wszyscy',
      gender: 'Płeć', language: 'Język',
      bio: 'O sobie (opcjonalnie)', lookingGender: 'Szukam',
      lookingCity: 'Miasto (opcjonalnie)', ageFrom: 'Wiek od', ageTo: 'do',
    },
    en: {
      aboutMe: 'ABOUT ME', lookingFor: 'LOOKING FOR',
      male: 'Male', female: 'Female', any: 'Anyone',
      gender: 'Gender', language: 'Language',
      bio: 'About me (optional)', lookingGender: 'Looking for',
      lookingCity: 'City (optional)', ageFrom: 'Age from', ageTo: 'to',
    },
  }[lang];

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: '13px 16px',
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0d0618',
      position: 'relative',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      {/* Gradient background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 80% 60% at 20% 10%, rgba(255,69,120,0.18) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 80% 30%, rgba(168,85,247,0.2) 0%, transparent 55%),
          radial-gradient(ellipse 70% 50% at 50% 80%, rgba(65,88,208,0.15) 0%, transparent 60%),
          linear-gradient(170deg, #0d0618 0%, #1a0a2e 50%, #0d0618 100%)
        `,
      }} />
      {/* Orbs */}
      <div style={{ position: 'fixed', width: 280, height: 280, top: -60, left: -80, borderRadius: '50%', background: 'rgba(255,69,120,0.22)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', width: 240, height: 240, top: 100, right: -70, borderRadius: '50%', background: 'rgba(168,85,247,0.2)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', width: 300, height: 300, bottom: -80, left: 20, borderRadius: '50%', background: 'rgba(65,88,208,0.18)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Lang switcher */}
      <div style={{ position: 'fixed', top: 16, right: 16, display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 50, padding: 3, gap: 2, border: '1px solid rgba(255,255,255,0.1)', zIndex: 10 }}>
        {(['ua', 'by', 'pl', 'en'] as const).map((code) => (
          <button key={code} onClick={() => setLang(code)} style={{
            background: lang === code ? 'linear-gradient(135deg,#FF4578,#C850C0)' : 'transparent',
            border: 'none', borderRadius: 50, width: 38, height: 38, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s', color: lang === code ? '#fff' : 'rgba(255,255,255,0.5)',
            letterSpacing: '0.5px',
          }}>
            {code === 'ua' ? 'UA' : code === 'by' ? 'BY' : code === 'pl' ? 'PL' : 'EN'}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 52, fontWeight: 600, lineHeight: 1,
            background: 'linear-gradient(135deg,#FF8FB1 0%,#FF4578 35%,#C850C0 65%,#a78bfa 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px',
            animation: 'float 3s ease-in-out infinite',
          }}>Huugs</div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 3, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginTop: 6 }}>Find your person</div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 28,
          padding: '28px 24px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
            {isLogin ? 'З поверненням ✨' : 'Реєстрація 🌸'}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 22 }}>
            {isLogin ? 'Увійди, щоб продовжити' : 'Створи свій акаунт'}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 22, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: '8px', borderRadius: 10,
                  fontSize: 13, fontWeight: 600, textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                  background: mode === m ? 'linear-gradient(135deg,#FF4578,#C850C0)' : 'transparent',
                  color: mode === m ? '#fff' : 'rgba(255,255,255,0.4)',
                  boxShadow: mode === m ? '0 4px 12px rgba(255,69,120,0.3)' : 'none',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {m === 'login'
                  ? { ua: 'Увійти', by: 'Уваход', pl: 'Logowanie', en: 'Log in' }[lang]
                  : { ua: 'Реєстрація', by: 'Рэгістрацыя', pl: 'Rejestracja', en: 'Sign up' }[lang]}
              </button>
            ))}
          </div>

          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit((d) => loginMutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input label="Email" type="email" placeholder="email@example.com" error={loginForm.formState.errors.email?.message} {...loginForm.register('email')} />
              <Input
                label={{ ua: 'Пароль', by: 'Пароль', pl: 'Hasło', en: 'Password' }[lang]}
                type="password" placeholder="••••••••"
                error={loginForm.formState.errors.password?.message}
                {...loginForm.register('password')}
              />
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 12, color: 'rgba(255,69,120,0.8)', cursor: 'pointer' }}>Забув пароль?</span>
              </div>
              {error && (
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#FF8FB1', textAlign: 'center', background: 'rgba(255,69,120,0.1)', border: '1px solid rgba(255,69,120,0.3)', borderRadius: 10, padding: '10px 14px' }}>{error}</div>
              )}
              <Button type="submit" fullWidth loading={loginMutation.isPending} style={{ marginTop: 4 }}>
                {{ ua: 'Увійти →', by: 'Увайсці →', pl: 'Zaloguj się →', en: 'Log in →' }[lang]}
              </Button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                або
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              </div>
              <button
                type="button"
                onClick={() => setMode('register')}
                style={{
                  width: '100%', padding: 13,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 16,
                  fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Створити акаунт
              </button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit((d) => registerMutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              <SectionLabel>{labels.aboutMe}</SectionLabel>

              {/* Photo upload */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: 90, height: 90, borderRadius: '50%', cursor: 'pointer',
                    border: `2px dashed ${photoPreview ? 'rgba(255,69,120,0.6)' : 'rgba(255,255,255,0.15)'}`,
                    background: photoPreview ? 'transparent' : 'rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', position: 'relative', transition: 'border-color 0.2s',
                  }}
                >
                  {photoPreview
                    ? <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, marginBottom: 2 }}>📷</div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Фото</div>
                      </div>
                  }
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
              </div>

              <Input label={{ ua: "Ім'я", by: 'Імя', pl: 'Imię', en: 'Name' }[lang]} placeholder="Олег" error={registerForm.formState.errors.name?.message} {...registerForm.register('name')} />
              <Input label="Email" type="email" placeholder="email@example.com" error={registerForm.formState.errors.email?.message} {...registerForm.register('email')} />
              <Input label={{ ua: 'Пароль', by: 'Пароль', pl: 'Hasło', en: 'Password' }[lang]} type="password" placeholder="мін. 8 символів" error={registerForm.formState.errors.password?.message} {...registerForm.register('password')} />
              <Input label={{ ua: 'Дата народження', by: 'Дата нараджэння', pl: 'Data urodzenia', en: 'Date of birth' }[lang]} type="date" error={registerForm.formState.errors.birth?.message} {...registerForm.register('birth')} />
              <Input label={{ ua: 'Місто', by: 'Горад', pl: 'Miasto', en: 'City' }[lang]} placeholder={{ ua: 'Київ', by: 'Мінск', pl: 'Warszawa', en: 'London' }[lang]} error={registerForm.formState.errors.city?.message} {...registerForm.register('city')} />

              <div>
                <FieldLabel>{labels.gender}</FieldLabel>
                <ToggleGroup
                  value={genderVal}
                  onChange={(v) => registerForm.setValue('gender', v as 'male' | 'female')}
                  options={[{ label: labels.male, value: 'male' }, { label: labels.female, value: 'female' }]}
                />
                {registerForm.formState.errors.gender && (
                  <div style={{ fontSize: 11, color: '#FF8FB1', marginTop: 4 }}>{registerForm.formState.errors.gender.message}</div>
                )}
              </div>

              <div>
                <FieldLabel>{labels.language}</FieldLabel>
                <select {...registerForm.register('language')} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {LANGUAGES.map((l) => <option key={l} value={l} style={{ background: '#0d0618' }}>{l}</option>)}
                </select>
              </div>

              <div>
                <FieldLabel>{labels.bio}</FieldLabel>
                <textarea
                  rows={3}
                  placeholder={{ ua: 'Розкажи про себе…', by: 'Раскажы пра сябе…', pl: 'Opowiedz o sobie…', en: 'Tell about yourself…' }[lang]}
                  {...registerForm.register('bio')}
                  style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
                />
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '6px 0' }} />
              <SectionLabel>{labels.lookingFor}</SectionLabel>

              <div>
                <FieldLabel>{labels.lookingGender}</FieldLabel>
                <ToggleGroup
                  value={lookingForGenderVal}
                  onChange={(v) => registerForm.setValue('lookingForGender', v as 'male' | 'female' | 'any')}
                  options={[{ label: labels.male, value: 'male' }, { label: labels.female, value: 'female' }, { label: labels.any, value: 'any' }]}
                />
              </div>

              <Input label={labels.lookingCity} placeholder={{ ua: 'Київ', by: 'Мінск', pl: 'Warszawa', en: 'London' }[lang]} error={registerForm.formState.errors.lookingForCity?.message} {...registerForm.register('lookingForCity')} />

              <div>
                <FieldLabel>{{ ua: 'Вік', by: 'Узрост', pl: 'Wiek', en: 'Age range' }[lang]}</FieldLabel>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="number" min={18} max={100} placeholder="18" {...registerForm.register('lookingForAgeMin')} style={{ flex: 1, ...inputStyle }} />
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>—</span>
                  <input type="number" min={18} max={100} placeholder="99" {...registerForm.register('lookingForAgeMax')} style={{ flex: 1, ...inputStyle }} />
                </div>
              </div>

              {error && (
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#FF8FB1', textAlign: 'center', background: 'rgba(255,69,120,0.1)', border: '1px solid rgba(255,69,120,0.3)', borderRadius: 10, padding: '10px 14px' }}>{error}</div>
              )}

              <Button type="submit" fullWidth loading={registerMutation.isPending} style={{ marginTop: 8 }}>
                {{ ua: 'Зареєструватись →', by: 'Зарэгіструвацца →', pl: 'Zarejestruj się →', en: 'Sign up →' }[lang]}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Welcome popup */}
      {showWelcome && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
          <div style={{ background: 'rgba(13,6,24,0.98)', border: '1px solid rgba(255,69,120,0.3)', borderRadius: 28, padding: '32px 28px', maxWidth: 360, width: '100%', textAlign: 'center', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: '#fff', marginBottom: 18 }}>Ласкаво просимо!</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, marginBottom: 28, textAlign: 'left', background: 'rgba(255,69,120,0.06)', border: '1px solid rgba(255,69,120,0.15)', borderRadius: 14, padding: '16px 18px' }}>
              Цей сайт був створений недавно, тому можливо учасників є не сильно багато. Буду вдячний за розуміння 🙏<br /><br />
              Кожному новому учаснику дається <strong style={{ color: '#FFD166' }}>⭐ Premium підписка на 1 місяць</strong> — з повагою, <strong style={{ color: '#FF8FB1' }}>Адмін</strong>
            </div>
            <button
              onClick={() => { setShowWelcome(false); navigate('/search'); }}
              style={{ width: '100%', padding: 14, borderRadius: 16, background: 'linear-gradient(135deg,#FF4578 0%,#C850C0 50%,#4158D0 100%)', border: 'none', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(255,69,120,0.35)' }}
            >
              Дякую, розпочати! 💫
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
