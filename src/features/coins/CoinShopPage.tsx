import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { theme, g } from '@/styles/theme';
import { Button } from '@/components/ui/Button';

const PACKAGES = [
  { id: 'starter', coins: 10, label: 'Стартовий', price: '29 грн', bonus: '', popular: false },
  { id: 'popular', coins: 30, label: 'Популярний', price: '69 грн', bonus: '+5 бонус', popular: true },
  { id: 'premium', coins: 100, label: 'Максимум', price: '149 грн', bonus: '+20 бонус', popular: false },
];

const PREMIUM_PLANS = [
  { id: 'month', label: '1 місяць', price: '99 грн / міс', features: ['Хто переглядав профіль', 'Безлімітні лайки', 'Пріоритет у пошуку', '5 super-likes в подарунок'] },
  { id: 'quarter', label: '3 місяці', price: '249 грн', features: ['Все з місячного плану', 'Економія 25%', '20 super-likes в подарунок'], popular: true },
];

export function CoinShopPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const handleBuy = (label: string) => {
    // In production: integrate with payment provider (Stripe, LiqPay, etc.)
    alert(`Для покупки "${label}" — напиши нам у підтримку або зачекай на інтеграцію оплати 🙏`);
  };

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🪙</div>
        <div style={{ fontFamily: theme.fonts.serif, fontSize: 26, color: theme.colors.text }}>Магазин</div>
        <div style={{ fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.textMuted, marginTop: 4 }}>
          Твій баланс: <span style={{ color: '#f9d976', fontWeight: 700 }}>{user?.coins ?? 0} 🪙</span>
        </div>
      </div>

      {/* Coin packages */}
      <div>
        <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: theme.colors.textFaint, marginBottom: 12 }}>
          Монети (super-likes)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              style={{
                background: pkg.popular ? 'rgba(86,171,145,0.12)' : g.card,
                border: `1.5px solid ${pkg.popular ? 'rgba(86,171,145,0.5)' : theme.colors.glassBorder}`,
                borderRadius: 20, padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: 14, position: 'relative',
              }}
            >
              {pkg.popular && (
                <div style={{ position: 'absolute', top: -10, left: 18, background: theme.colors.green.mid, borderRadius: 50, padding: '2px 12px', fontFamily: theme.fonts.sans, fontSize: 10, fontWeight: 700, color: '#0d2137' }}>
                  ПОПУЛЯРНИЙ
                </div>
              )}
              <div style={{ fontSize: 32 }}>🪙</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: theme.fonts.serif, fontSize: 19, color: theme.colors.text }}>{pkg.label}</div>
                <div style={{ fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.textMuted, marginTop: 2 }}>
                  {pkg.coins} монет {pkg.bonus && <span style={{ color: theme.colors.green.light }}>{pkg.bonus}</span>}
                </div>
              </div>
              <button
                onClick={() => handleBuy(`${pkg.label} — ${pkg.price}`)}
                style={{
                  padding: '10px 18px', borderRadius: 12, flexShrink: 0,
                  background: pkg.popular ? g.greenBtn : 'rgba(86,171,145,0.1)',
                  border: `1.5px solid ${pkg.popular ? 'transparent' : 'rgba(86,171,145,0.3)'}`,
                  color: pkg.popular ? '#fff' : theme.colors.green.light,
                  fontFamily: theme.fonts.sans, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {pkg.price}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Premium plans */}
      <div>
        <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: theme.colors.textFaint, marginBottom: 12 }}>
          ⭐ Premium підписка
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PREMIUM_PLANS.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: (plan as any).popular ? 'rgba(249,217,118,0.06)' : g.card,
                border: `1.5px solid ${(plan as any).popular ? 'rgba(249,217,118,0.35)' : theme.colors.glassBorder}`,
                borderRadius: 20, padding: '18px 18px', position: 'relative',
              }}
            >
              {(plan as any).popular && (
                <div style={{ position: 'absolute', top: -10, left: 18, background: '#f9d976', borderRadius: 50, padding: '2px 12px', fontFamily: theme.fonts.sans, fontSize: 10, fontWeight: 700, color: '#1a1000' }}>
                  ВИГІДНО
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: theme.fonts.serif, fontSize: 19, color: theme.colors.text }}>{plan.label}</div>
                  <div style={{ fontFamily: theme.fonts.sans, fontSize: 14, color: '#f9d976', fontWeight: 700, marginTop: 2 }}>{plan.price}</div>
                </div>
                <button
                  onClick={() => handleBuy(`Premium ${plan.label} — ${plan.price}`)}
                  style={{ padding: '10px 18px', borderRadius: 12, background: 'rgba(249,217,118,0.12)', border: '1.5px solid rgba(249,217,118,0.4)', color: '#f9d976', fontFamily: theme.fonts.sans, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  Купити
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.textMuted, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: theme.colors.green.mid }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily bonus reminder */}
      <div style={{ background: 'rgba(86,171,145,0.05)', border: `1px solid ${theme.colors.glassBorder}`, borderRadius: 16, padding: '16px 18px', textAlign: 'center' }}>
        <div style={{ fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.textMuted }}>
          🎁 Не забувай про щоденний бонус +3 монети у профілі!
        </div>
        <Button variant="ghost" onClick={() => navigate('/profile')} style={{ marginTop: 10 }}>
          Перейти до профілю →
        </Button>
      </div>
    </div>
  );
}
