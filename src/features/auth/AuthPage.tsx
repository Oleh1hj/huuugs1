import { useState } from 'react';
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

const loginSchema = z.object({
  email: z.string().email('Невірний email'),
  password: z.string().min(8, 'Мін. 8 символів'),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Мін. 2 символи').max(50),
  birth: z.string().min(1, 'Вкажи дату народження'),
  city: z.string().min(2, 'Вкажи місто').max(100),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { setAuth } = useAuthStore();
  const { lang, setLang } = useUiStore();
  const navigate = useNavigate();

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: LoginForm) => authApi.login(email, password),
    onSuccess: (data) => { setAuth(data.user, data.accessToken, data.refreshToken); navigate('/search'); },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterForm) => authApi.register(data),
    onSuccess: (data) => { setAuth(data.user, data.accessToken, data.refreshToken); navigate('/search'); },
  });

  const isLogin = mode === 'login';
  const error = loginMutation.error?.message ?? registerMutation.error?.message;

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

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 360 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 20px' }}>
            <div style={{ position: 'absolute', inset: 0, border: '1.5px solid rgba(86,171,145,0.25)', borderRadius: '50%', animation: 'orbit 6s linear infinite' }} />
            <div style={{ position: 'absolute', inset: 8, border: '1px solid rgba(168,230,207,0.15)', borderRadius: '50%', animation: 'orbit 10s linear infinite reverse' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 24, height: 24, borderRadius: '50%', background: g.greenBtn, boxShadow: '0 0 20px rgba(86,171,145,0.6)' }} />
            <div style={{ position: 'absolute', top: 0, left: '50%', width: 8, height: 8, borderRadius: '50%', background: theme.colors.yellow, boxShadow: '0 0 8px rgba(249,217,118,0.8)', marginLeft: -4, marginTop: -4, transformOrigin: '4px 44px', animation: 'orbit 6s linear infinite' }} />
          </div>
          <h1 style={{ fontFamily: theme.fonts.serif, fontSize: 42, fontWeight: 600, background: g.text, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'shimmer 4s linear infinite' }}>Huugs</h1>
          <p style={{ fontFamily: theme.fonts.sans, fontSize: 11, color: theme.colors.textFaint, letterSpacing: 2.5, textTransform: 'uppercase', marginTop: 6 }}>два атоми — одна орбіта</p>
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
              <Input label={lang === 'ua' ? 'Пароль' : 'Пароль'} type="password" placeholder="••••••••" error={loginForm.formState.errors.password?.message} {...loginForm.register('password')} />
              {error && <div style={{ fontFamily: theme.fonts.sans, fontSize: 12, color: '#ff6b8a', textAlign: 'center' }}>{error}</div>}
              <Button type="submit" fullWidth loading={loginMutation.isPending} style={{ marginTop: 8 }}>
                {{ ua: 'Увійти', by: 'Увайсці', pl: 'Zaloguj się', en: 'Log in' }[lang]}
              </Button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit((d) => registerMutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input label={{ ua: "Ім'я", by: 'Імя', pl: 'Imię', en: 'Name' }[lang]} placeholder="Олег" error={registerForm.formState.errors.name?.message} {...registerForm.register('name')} />
              <Input label="Email" type="email" placeholder="you@example.com" error={registerForm.formState.errors.email?.message} {...registerForm.register('email')} />
              <Input label={{ ua: 'Пароль', by: 'Пароль', pl: 'Hasło', en: 'Password' }[lang]} type="password" placeholder="мін. 8 символів" error={registerForm.formState.errors.password?.message} {...registerForm.register('password')} />
              <Input label={{ ua: 'Дата народження', by: 'Дата нараджэння', pl: 'Data urodzenia', en: 'Date of birth' }[lang]} type="date" error={registerForm.formState.errors.birth?.message} {...registerForm.register('birth')} />
              <Input label={{ ua: 'Місто', by: 'Горад', pl: 'Miasto', en: 'City' }[lang]} placeholder={{ ua: 'Київ', by: 'Мінск', pl: 'Warszawa', en: 'London' }[lang]} error={registerForm.formState.errors.city?.message} {...registerForm.register('city')} />
              {error && <div style={{ fontFamily: theme.fonts.sans, fontSize: 12, color: '#ff6b8a', textAlign: 'center' }}>{error}</div>}
              <Button type="submit" fullWidth loading={registerMutation.isPending} style={{ marginTop: 8 }}>
                {{ ua: 'Зареєструватись', by: 'Зарэгіструвацца', pl: 'Zarejestruj się', en: 'Sign up' }[lang]}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
