import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { profilesApi } from '@/api/profiles.api';
import { Avatar } from '@/components/ui/Avatar';
import { User } from '@/types';
import { theme, g } from '@/styles/theme';
import { calcAge } from '@/utils';

type Section = 'overview' | 'users' | 'reports' | 'support' | 'analytics' | 'chats';
type UserFilter = 'all' | 'verified' | 'premium' | 'banned' | 'ghost' | 'admin' | 'risky';
type UserSort = 'name' | 'coins' | 'age' | 'trust';

// ─── Design tokens ────────────────────────────────────────────────────────────
const c = {
  purple: { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)', text: '#c084fc' },
  blue:   { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)',  text: '#60a5fa' },
  green:  { bg: 'rgba(86,171,145,0.12)',  border: 'rgba(86,171,145,0.3)',  text: '#a8e6cf' },
  yellow: { bg: 'rgba(249,217,118,0.12)', border: 'rgba(249,217,118,0.3)', text: '#f9d976' },
  red:    { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   text: '#f87171' },
  orange: { bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.3)',  text: '#fb923c' },
  pink:   { bg: 'rgba(236,72,153,0.12)',  border: 'rgba(236,72,153,0.3)',  text: '#f472b6' },
  gray:   { bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', text: '#94a3b8' },
};

// ─── Trust Score calculation ──────────────────────────────────────────────────
function calcTrustScore(u: any): number {
  let score = 0;
  if (u.photo) score += 25;
  if (u.bio && u.bio.length > 10) score += 20;
  if (u.city) score += 10;
  if (u.isVerified) score += 25;
  if (u.isPremium) score += 10;
  if (u.coins !== undefined && u.coins > 0) score += 5;
  const ageOfAccount = u.createdAt ? (Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 0;
  if (ageOfAccount > 7) score += 5;
  return Math.min(100, score);
}

function trustColor(score: number) {
  if (score >= 70) return c.green;
  if (score >= 40) return c.yellow;
  return c.red;
}

function trustLabel(score: number) {
  if (score >= 70) return 'Надійний';
  if (score >= 40) return 'Середній';
  return 'Ризик';
}

// ─── Shared components ────────────────────────────────────────────────────────
function Badge({ children, color }: { children: React.ReactNode; color: typeof c.blue }) {
  return (
    <span style={{
      background: color.bg, border: `1px solid ${color.border}`,
      borderRadius: 50, padding: '2px 8px',
      fontFamily: theme.fonts.sans, fontSize: 10, fontWeight: 700,
      color: color.text, whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function ActionBtn({
  children, onClick, color = 'neutral', disabled,
}: { children: React.ReactNode; onClick: () => void; color?: 'green' | 'blue' | 'yellow' | 'red' | 'orange' | 'gray' | 'neutral'; disabled?: boolean }) {
  const map = {
    green: c.green, blue: c.blue, yellow: c.yellow, red: c.red, orange: c.orange, gray: c.gray,
    neutral: { bg: 'rgba(255,255,255,0.05)', border: theme.colors.glassBorder, text: theme.colors.textMuted },
  };
  const col = map[color];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 12px', borderRadius: 10,
        background: col.bg, border: `1px solid ${col.border}`,
        color: col.text, fontFamily: theme.fonts.sans, fontSize: 11, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s', whiteSpace: 'nowrap',
      }}
    >{children}</button>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: g.card, border: `1px solid ${theme.colors.glassBorder}`, borderRadius: 18, overflow: 'hidden' }}>
      {children}
    </div>
  );
}

function CardHeader({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${theme.colors.glassBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontFamily: theme.fonts.sans, fontWeight: 700, fontSize: 13, color: theme.colors.text }}>{title}</div>
        {sub && <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.textFaint, marginTop: 1 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color }: { icon: string; label: string; value: number | string; sub?: string; color: typeof c.blue }) {
  return (
    <div style={{
      background: `linear-gradient(145deg, ${color.bg}, rgba(255,255,255,0.02))`,
      border: `1px solid ${color.border}`,
      borderRadius: 16, padding: '14px 14px 12px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        {sub && <span style={{ fontFamily: theme.fonts.sans, fontSize: 9, color: color.text, background: color.bg, border: `1px solid ${color.border}`, borderRadius: 50, padding: '1px 6px' }}>{sub}</span>}
      </div>
      <div style={{ fontFamily: theme.fonts.sans, fontWeight: 800, fontSize: 26, color: theme.colors.text, lineHeight: 1 }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: color.text, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: profilesApi.adminGetStats,
    refetchInterval: 30_000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: profilesApi.adminGetAll,
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: profilesApi.adminGetReports,
    refetchInterval: 30_000,
  });

  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: 60, color: theme.colors.textFaint, fontFamily: theme.fonts.sans }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>⚙️</div>
      <div style={{ fontSize: 13 }}>Завантаження статистики…</div>
    </div>
  );

  const total = stats?.total ?? 0;
  const active = stats?.active ?? 0;
  const newToday = stats?.newToday ?? 0;
  const premium = stats?.premium ?? 0;
  const verified = stats?.verified ?? 0;
  const ghostBanned = stats?.ghostBanned ?? 0;
  const reportsCount = stats?.reports ?? 0;
  const banned = users.filter((u: any) => u.isActive === false).length;

  const engagementPct = total > 0 ? Math.round((active / total) * 100) : 0;
  const premiumPct = total > 0 ? Math.round((premium / total) * 100) : 0;
  const verifiedPct = total > 0 ? Math.round((verified / total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <KpiCard icon="👥" label="Всього юзерів" value={total} color={c.blue} />
        <KpiCard icon="🟢" label="Активних" value={active} sub={`${engagementPct}%`} color={c.green} />
        <KpiCard icon="🆕" label="Сьогодні" value={newToday} sub="+сьогодні" color={c.purple} />
        <KpiCard icon="⭐" label="Premium" value={premium} sub={`${premiumPct}%`} color={c.yellow} />
        <KpiCard icon="✓" label="Верифікованих" value={verified} sub={`${verifiedPct}%`} color={c.blue} />
        <KpiCard icon="👻" label="Ghost-бан" value={ghostBanned} color={c.gray} />
        <KpiCard icon="🚫" label="Заблокованих" value={banned} color={c.red} />
        <KpiCard icon="⚠️" label="Скарг" value={reportsCount} color={c.orange} />
      </div>

      {/* Platform health */}
      <SectionCard>
        <CardHeader title="Здоров'я платформи" sub="Метрики в реальному часі" />
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Залученість', value: engagementPct, color: theme.colors.green.mid, description: `${active} з ${total} активних` },
            { label: 'Premium конверсія', value: premiumPct, color: '#f9d976', description: `${premium} платних юзерів` },
            { label: 'Верифікація', value: verifiedPct, color: '#60a5fa', description: `${verified} верифіковані` },
            { label: 'Якість (без банів)', value: total > 0 ? Math.round(((total - banned) / total) * 100) : 100, color: '#a8e6cf', description: `${banned} забанено` },
          ].map((row) => (
            <div key={row.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontFamily: theme.fonts.sans, fontSize: 12, color: theme.colors.textMuted }}>{row.label}</span>
                <span style={{ fontFamily: theme.fonts.sans, fontSize: 12, fontWeight: 700, color: row.color }}>{row.value}%</span>
              </div>
              <MiniBar value={row.value} max={100} color={row.color} />
              <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.textFaint, marginTop: 3 }}>{row.description}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Quick actions */}
      <SectionCard>
        <CardHeader title="Швидкі дії" />
        <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { icon: '👥', label: 'Всі юзери', sub: `${total} осіб`, section: 'users' as Section, color: c.blue },
            { icon: '⚠️', label: 'Скарги', sub: `${reportsCount} активних`, section: 'reports' as Section, color: c.orange },
            { icon: '📊', label: 'Аналітика', sub: 'Графіки & тренди', section: 'analytics' as Section, color: c.purple },
            { icon: '💬', label: 'Чати', sub: 'Перегляд діалогів', section: 'chats' as Section, color: c.blue },
            { icon: '🛟', label: 'Підтримка', sub: 'Звернення', section: 'support' as Section, color: c.green },
            { icon: '🚫', label: 'Забанені', sub: `${banned} юзерів`, section: 'users' as Section, color: c.red },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => onNavigate(item.section)}
              style={{
                background: item.color.bg, border: `1px solid ${item.color.border}`,
                borderRadius: 14, padding: '12px 12px', textAlign: 'left',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontFamily: theme.fonts.sans, fontWeight: 700, fontSize: 13, color: theme.colors.text }}>{item.label}</div>
              <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: item.color.text, marginTop: 2 }}>{item.sub}</div>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Recent reports preview */}
      {reports.length > 0 && (
        <SectionCard>
          <CardHeader
            title="Нові скарги"
            sub={`${reports.length} очікують розгляду`}
            right={
              <button onClick={() => onNavigate('reports')} style={{ background: c.orange.bg, border: `1px solid ${c.orange.border}`, borderRadius: 50, padding: '4px 10px', fontFamily: theme.fonts.sans, fontSize: 10, fontWeight: 700, color: c.orange.text, cursor: 'pointer' }}>
                Всі →
              </button>
            }
          />
          <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reports.slice(0, 3).map((r: any) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.1)', borderRadius: 12 }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: theme.fonts.sans, fontSize: 12, color: theme.colors.text, fontWeight: 600 }}>
                    {r.reporter?.name ?? '?'} → {r.reported?.name ?? '?'}
                  </div>
                  {r.reason && (
                    <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: profilesApi.adminGetStats,
    refetchInterval: 60_000,
  });

  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: 60, color: theme.colors.textFaint, fontFamily: theme.fonts.sans }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
      <div style={{ fontSize: 13 }}>Завантаження аналітики…</div>
    </div>
  );

  const total = stats?.total ?? 0;
  const male = stats?.male ?? 0;
  const female = stats?.female ?? 0;
  const totalGender = male + female || 1;
  const malePct = Math.round((male / totalGender) * 100);
  const femalePct = 100 - malePct;

  const totalMessages = stats?.totalMessages ?? 0;
  const totalConversations = stats?.totalConversations ?? 0;
  const totalLikes = stats?.totalLikes ?? 0;
  const withPhoto = stats?.withPhoto ?? 0;
  const premium = stats?.premium ?? 0;
  const verified = stats?.verified ?? 0;

  const days7: { date: string; count: number }[] = stats?.days7 ?? [];
  const maxDay = Math.max(...days7.map((d: any) => d.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Activity KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <KpiCard icon="💬" label="Повідомлень" value={totalMessages} color={c.blue} />
        <KpiCard icon="💞" label="Матчів" value={totalConversations} color={c.pink} />
        <KpiCard icon="❤️" label="Лайків" value={totalLikes} color={c.red} />
        <KpiCard icon="📸" label="З фото" value={withPhoto} sub={total > 0 ? `${Math.round((withPhoto / total) * 100)}%` : '0%'} color={c.purple} />
      </div>

      {/* Registrations per day bar chart */}
      <SectionCard>
        <CardHeader title="Реєстрації за 7 днів" sub="Нові користувачі по днях" />
        <div style={{ padding: '16px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
            {days7.map((d: any) => {
              const heightPct = maxDay > 0 ? (d.count / maxDay) * 100 : 0;
              const dayLabel = new Date(d.date + 'T00:00:00').toLocaleDateString('uk-UA', { weekday: 'short' });
              return (
                <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontFamily: theme.fonts.sans, fontSize: 9, color: theme.colors.textFaint, fontWeight: 700 }}>{d.count > 0 ? d.count : ''}</div>
                  <div style={{
                    width: '100%', background: 'linear-gradient(180deg, rgba(86,171,145,0.8), rgba(86,171,145,0.3))',
                    borderRadius: '4px 4px 2px 2px', minHeight: d.count > 0 ? 4 : 2,
                    height: `${Math.max(heightPct, 2)}%`,
                    transition: 'height 0.5s ease',
                    border: '1px solid rgba(86,171,145,0.4)',
                  }} />
                  <div style={{ fontFamily: theme.fonts.sans, fontSize: 9, color: theme.colors.textFaint }}>{dayLabel}</div>
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {/* Gender Balance */}
      <SectionCard>
        <CardHeader title="Гендерний баланс" sub={`${male} чол. / ${female} жін. з ${total} активних`} />
        <div style={{ padding: '16px 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', height: 24 }}>
            <div style={{ width: `${malePct}%`, background: 'linear-gradient(90deg, #60a5fa, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'width 0.5s ease' }}>
              {malePct > 15 && <span style={{ fontFamily: theme.fonts.sans, fontSize: 10, fontWeight: 700, color: '#fff' }}>♂ {malePct}%</span>}
            </div>
            <div style={{ flex: 1, background: 'linear-gradient(90deg, #ec4899, #f472b6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {femalePct > 15 && <span style={{ fontFamily: theme.fonts.sans, fontSize: 10, fontWeight: 700, color: '#fff' }}>♀ {femalePct}%</span>}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#3b82f6' }} />
              <span style={{ fontFamily: theme.fonts.sans, fontSize: 11, color: theme.colors.textMuted }}>Чоловіки: {male}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#ec4899' }} />
              <span style={{ fontFamily: theme.fonts.sans, fontSize: 11, color: theme.colors.textMuted }}>Жінки: {female}</span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Platform Funnel */}
      <SectionCard>
        <CardHeader title="Воронка платформи" sub="Реєстрація → Premium" />
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Зареєстровані', value: total, color: '#60a5fa', icon: '👤' },
            { label: 'З фотографією', value: withPhoto, color: '#a78bfa', icon: '📸' },
            { label: 'Верифіковані', value: verified, color: '#34d399', icon: '✓' },
            { label: 'Premium', value: premium, color: '#fbbf24', icon: '⭐' },
          ].map((row, i, arr) => {
            const base = arr[0].value || 1;
            const pct = Math.round((row.value / base) * 100);
            return (
              <div key={row.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13 }}>{row.icon}</span>
                    <span style={{ fontFamily: theme.fonts.sans, fontSize: 12, color: theme.colors.textMuted }}>{row.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: theme.fonts.sans, fontSize: 11, color: theme.colors.textFaint }}>{row.value.toLocaleString()}</span>
                    <span style={{ fontFamily: theme.fonts.sans, fontSize: 11, fontWeight: 700, color: row.color }}>{pct}%</span>
                  </div>
                </div>
                <MiniBar value={row.value} max={base} color={row.color} />
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Avg engagement */}
      <SectionCard>
        <CardHeader title="Engagement метрики" />
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Повідомлень на матч', value: totalConversations > 0 ? (totalMessages / totalConversations).toFixed(1) : '—', icon: '💬' },
            { label: 'Лайків на юзера', value: total > 0 ? (totalLikes / total).toFixed(1) : '—', icon: '❤️' },
            { label: 'Матч rate', value: totalLikes > 0 ? `${Math.round((totalConversations / totalLikes) * 100)}%` : '—', icon: '💞' },
          ].map((row) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${theme.colors.glassBorder}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>{row.icon}</span>
                <span style={{ fontFamily: theme.fonts.sans, fontSize: 12, color: theme.colors.textMuted }}>{row.label}</span>
              </div>
              <span style={{ fontFamily: theme.fonts.sans, fontSize: 14, fontWeight: 700, color: theme.colors.text }}>{row.value}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Chats Tab ────────────────────────────────────────────────────────────────
function ChatsTab() {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedConv, setSelectedConv] = useState<any>(null);

  const { data: users = [] } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: profilesApi.adminGetAll,
  });

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return (users as any[]).filter((u) =>
      u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [users, search]);

  const { data: conversations = [], isLoading: convsLoading } = useQuery({
    queryKey: ['admin', 'userConvs', selectedUser?.id],
    queryFn: () => profilesApi.adminGetUserConversations(selectedUser.id),
    enabled: !!selectedUser,
  });

  const { data: messages = [], isLoading: msgsLoading } = useQuery({
    queryKey: ['admin', 'convMsgs', selectedUser?.id, selectedConv?.id],
    queryFn: () => profilesApi.adminGetConversationMessages(selectedUser.id, selectedConv.id),
    enabled: !!selectedUser && !!selectedConv,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionCard>
        <CardHeader title="Перегляд діалогів" sub="Виберіть юзера щоб переглянути переписку" />
        <div style={{ padding: '12px 14px' }}>
          {/* User search */}
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.5 }}>🔍</span>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedUser(null); setSelectedConv(null); }}
              placeholder="Пошук юзера за іменем або email…"
              style={{
                width: '100%', padding: '11px 14px 11px 40px',
                background: theme.colors.glass, border: `1.5px solid ${theme.colors.glassBorder}`,
                borderRadius: 12, fontFamily: theme.fonts.sans, fontSize: 13,
                color: theme.colors.text, boxSizing: 'border-box', outline: 'none',
              }}
            />
          </div>

          {/* User search results */}
          {filteredUsers.length > 0 && !selectedUser && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {filteredUsers.map((u: any) => (
                <button
                  key={u.id}
                  onClick={() => { setSelectedUser(u); setSearch(u.name); setSelectedConv(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                    background: 'rgba(255,255,255,0.04)', border: `1px solid ${theme.colors.glassBorder}`,
                    borderRadius: 10, cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}
                >
                  <Avatar photo={u.photo} name={u.name} size={32} />
                  <div>
                    <div style={{ fontFamily: theme.fonts.sans, fontSize: 12, fontWeight: 600, color: theme.colors.text }}>{u.name}</div>
                    <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.textFaint }}>{u.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected user conversations */}
          {selectedUser && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '8px 10px', background: c.blue.bg, border: `1px solid ${c.blue.border}`, borderRadius: 10 }}>
                <Avatar photo={selectedUser.photo} name={selectedUser.name} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: theme.fonts.sans, fontSize: 12, fontWeight: 700, color: theme.colors.text }}>{selectedUser.name}</div>
                  <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: c.blue.text }}>Вибраний юзер</div>
                </div>
                <button onClick={() => { setSelectedUser(null); setSelectedConv(null); setSearch(''); }} style={{ background: 'none', border: 'none', color: theme.colors.textFaint, cursor: 'pointer', fontSize: 14 }}>✕</button>
              </div>

              {convsLoading ? (
                <div style={{ textAlign: 'center', padding: 20, color: theme.colors.textFaint, fontFamily: theme.fonts.sans, fontSize: 12 }}>Завантаження чатів…</div>
              ) : conversations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: theme.colors.textFaint, fontFamily: theme.fonts.sans, fontSize: 12 }}>У юзера немає діалогів</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.textFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                    {conversations.length} діалогів
                  </div>
                  {(conversations as any[]).map((conv) => {
                    const partner = conv.partnerA?.id === selectedUser.id ? conv.partnerB : conv.partnerA;
                    const isSelected = selectedConv?.id === conv.id;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConv(isSelected ? null : conv)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px',
                          background: isSelected ? c.purple.bg : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSelected ? c.purple.border : theme.colors.glassBorder}`,
                          borderRadius: 10, cursor: 'pointer', textAlign: 'left', width: '100%',
                          transition: 'all 0.15s',
                        }}
                      >
                        <Avatar photo={partner?.photo} name={partner?.name ?? '?'} size={34} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: theme.fonts.sans, fontSize: 12, fontWeight: 600, color: theme.colors.text }}>{partner?.name ?? '?'}</div>
                          {conv.lastMessage && (
                            <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.textFaint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {conv.lastMessage.text}
                            </div>
                          )}
                        </div>
                        <span style={{ color: theme.colors.textFaint, fontSize: 12 }}>{isSelected ? '▲' : '▼'}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </SectionCard>

      {/* Messages viewer */}
      {selectedConv && (
        <SectionCard>
          <CardHeader
            title="Переписка"
            sub={`Розмова між ${selectedUser?.name} та ${((selectedConv.partnerA?.id === selectedUser?.id ? selectedConv.partnerB : selectedConv.partnerA)?.name ?? '?')}`}
          />
          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 400, overflowY: 'auto' }}>
            {msgsLoading ? (
              <div style={{ textAlign: 'center', padding: 20, color: theme.colors.textFaint, fontFamily: theme.fonts.sans, fontSize: 12 }}>Завантаження…</div>
            ) : (messages as any[]).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: theme.colors.textFaint, fontFamily: theme.fonts.sans, fontSize: 12 }}>Повідомлень немає</div>
            ) : (messages as any[]).map((msg) => {
              const isMine = msg.senderId === selectedUser?.id;
              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', marginBottom: 4 }}>
                  <div style={{ fontFamily: theme.fonts.sans, fontSize: 9, color: theme.colors.textFaint, marginBottom: 2, paddingLeft: isMine ? 0 : 4, paddingRight: isMine ? 4 : 0 }}>
                    {msg.sender?.name ?? '?'} · {new Date(msg.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{
                    maxWidth: '80%', padding: '6px 10px', borderRadius: 10,
                    background: isMine ? 'rgba(86,171,145,0.2)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${isMine ? 'rgba(86,171,145,0.3)' : theme.colors.glassBorder}`,
                    fontFamily: theme.fonts.sans, fontSize: 12, color: theme.colors.text, lineHeight: 1.4,
                  }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<UserFilter>('all');
  const [sort, setSort] = useState<UserSort>('name');
  const [page, setPage] = useState(0);
  const PER_PAGE = 10;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: profilesApi.adminGetAll,
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => profilesApi.adminVerify(id, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
  const premiumMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => profilesApi.adminPremium(id, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
  const banMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => profilesApi.adminBan(id, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
  const ghostMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => profilesApi.adminGhostBan(id, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const filtered = useMemo(() => {
    let list = [...users] as any[];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.city?.toLowerCase().includes(q));
    }
    switch (filter) {
      case 'verified': list = list.filter((u) => u.isVerified); break;
      case 'premium':  list = list.filter((u) => u.isPremium);  break;
      case 'banned':   list = list.filter((u) => u.isActive === false); break;
      case 'ghost':    list = list.filter((u) => u.isGhostBanned); break;
      case 'admin':    list = list.filter((u) => u.isAdmin);    break;
      case 'risky':    list = list.filter((u) => calcTrustScore(u) < 40); break;
    }
    switch (sort) {
      case 'coins': list.sort((a, b) => (b.coins ?? 0) - (a.coins ?? 0)); break;
      case 'age':   list.sort((a, b) => (a.birth ?? '').localeCompare(b.birth ?? '')); break;
      case 'trust': list.sort((a, b) => calcTrustScore(a) - calcTrustScore(b)); break;
      default:      list.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')); break;
    }
    return list;
  }, [users, search, filter, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  const filterTabs: { key: UserFilter; label: string }[] = [
    { key: 'all', label: 'Всі' },
    { key: 'risky', label: '⚡ Ризик' },
    { key: 'verified', label: '✓ Верифік.' },
    { key: 'premium', label: '⭐ Premium' },
    { key: 'banned', label: '🚫 Бан' },
    { key: 'ghost', label: '👻 Ghost' },
    { key: 'admin', label: '🔑 Адмін' },
  ];

  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: 60, color: theme.colors.textFaint, fontFamily: theme.fonts.sans }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
      <div style={{ fontSize: 13 }}>Завантаження юзерів…</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Search */}
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.5 }}>🔍</span>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Пошук за іменем, email, містом…"
          style={{
            width: '100%', padding: '12px 14px 12px 40px',
            background: theme.colors.glass, border: `1.5px solid ${theme.colors.glassBorder}`,
            borderRadius: 14, fontFamily: theme.fonts.sans, fontSize: 14,
            color: theme.colors.text, boxSizing: 'border-box', outline: 'none',
          }}
        />
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {filterTabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setFilter(key); setPage(0); }}
            style={{
              padding: '6px 12px', borderRadius: 50, flexShrink: 0,
              background: filter === key ? 'rgba(86,171,145,0.2)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filter === key ? 'rgba(86,171,145,0.5)' : theme.colors.glassBorder}`,
              color: filter === key ? theme.colors.green.light : theme.colors.textMuted,
              fontFamily: theme.fonts.sans, fontSize: 11, fontWeight: filter === key ? 700 : 400,
              cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
          >{label}</button>
        ))}
      </div>

      {/* Sort + count row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: theme.fonts.sans, fontSize: 11, color: theme.colors.textFaint }}>
          <span style={{ color: theme.colors.green.light, fontWeight: 700 }}>{filtered.length}</span> юзерів
          {search && ` · пошук: "${search}"`}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as UserSort)}
          style={{ background: theme.colors.glass, border: `1px solid ${theme.colors.glassBorder}`, borderRadius: 8, padding: '4px 8px', fontFamily: theme.fonts.sans, fontSize: 11, color: theme.colors.textMuted, cursor: 'pointer', outline: 'none' }}
        >
          <option value="name">A–Я</option>
          <option value="trust">Trust Score ↑</option>
          <option value="coins">За монетами</option>
          <option value="age">За віком</option>
        </select>
      </div>

      {/* User cards */}
      {paginated.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', fontFamily: theme.fonts.sans, color: theme.colors.textFaint }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div>Нічого не знайдено</div>
        </div>
      ) : paginated.map((u: User & { isGhostBanned?: boolean }) => {
        const isBanned = (u as any).isActive === false;
        const isGhost = !!(u as any).isGhostBanned;
        const trustScore = calcTrustScore(u);
        const tColor = trustColor(trustScore);
        return (
          <div
            key={u.id}
            style={{
              background: g.card,
              border: `1px solid ${isBanned ? 'rgba(239,68,68,0.25)' : isGhost ? 'rgba(100,116,139,0.35)' : theme.colors.glassBorder}`,
              borderRadius: 18, padding: '14px 14px 12px',
              boxShadow: isBanned ? '0 0 0 1px rgba(239,68,68,0.1) inset' : 'none',
            }}
          >
            {/* User header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate(`/users/${u.id}`)}>
                <Avatar photo={u.photo} name={u.name} size={46} border={`2px solid ${isBanned ? 'rgba(239,68,68,0.4)' : isGhost ? 'rgba(100,116,139,0.4)' : theme.colors.glassBorder}`} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontFamily: theme.fonts.serif, fontSize: 16, color: theme.colors.text, fontWeight: 600 }}>{u.name}</span>
                  {u.isVerified && <Badge color={c.blue}>✓ Верифік.</Badge>}
                  {u.isPremium && <Badge color={c.yellow}>⭐ Premium</Badge>}
                  {u.isAdmin && <Badge color={c.purple}>Адмін</Badge>}
                  {isBanned && <Badge color={c.red}>BANNED</Badge>}
                  {isGhost && <Badge color={c.gray}>👻 Ghost</Badge>}
                </div>
                <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.textFaint, display: 'flex', flexWrap: 'wrap', gap: '0 8px' }}>
                  {u.email && <span>{u.email}</span>}
                  {u.city && <span>📍{u.city}</span>}
                  {u.birth && <span>{calcAge(u.birth)} р.</span>}
                  {u.gender && <span>{u.gender === 'male' ? '♂' : '♀'}</span>}
                  <span>🪙{u.coins ?? 0}</span>
                </div>
              </div>

              {/* Trust Score */}
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: tColor.bg, border: `2px solid ${tColor.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: theme.fonts.sans, fontSize: 11, fontWeight: 800, color: tColor.text,
                }}>{trustScore}</div>
                <div style={{ fontFamily: theme.fonts.sans, fontSize: 8, color: tColor.text, fontWeight: 600 }}>{trustLabel(trustScore)}</div>
              </div>
            </div>

            {/* Trust bar */}
            <MiniBar value={trustScore} max={100} color={tColor.text} />
            <div style={{ fontFamily: theme.fonts.sans, fontSize: 9, color: theme.colors.textFaint, marginTop: 3, marginBottom: 10 }}>
              Trust Score: {trustScore}/100
              {!u.photo && ' · немає фото'}
              {!(u as any).bio && ' · немає bio'}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: theme.colors.glassBorder, marginBottom: 10 }} />

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <ActionBtn onClick={() => navigate(`/users/${u.id}`)} color="neutral">👤 Профіль</ActionBtn>
              <ActionBtn
                onClick={() => verifyMutation.mutate({ id: u.id, value: !u.isVerified })}
                color="blue"
                disabled={verifyMutation.isPending}
              >{u.isVerified ? '✓ Зняти' : '✓ Верифік.'}</ActionBtn>
              <ActionBtn
                onClick={() => premiumMutation.mutate({ id: u.id, value: !u.isPremium })}
                color="yellow"
                disabled={premiumMutation.isPending}
              >{u.isPremium ? '⭐ Скасувати' : '⭐ Premium'}</ActionBtn>
              {!u.isAdmin && (
                <>
                  <ActionBtn
                    onClick={() => { if (confirm(isBanned ? `Розбанити ${u.name}?` : `Забанити ${u.name}?`)) banMutation.mutate({ id: u.id, value: !isBanned }); }}
                    color={isBanned ? 'green' : 'red'}
                    disabled={banMutation.isPending}
                  >{isBanned ? '🔓 Розбан' : '🚫 Бан'}</ActionBtn>
                  <ActionBtn
                    onClick={() => { if (confirm(isGhost ? `Зняти ghost-бан з ${u.name}?` : `Ghost-ban ${u.name}? Вони не дізнаються.`)) ghostMutation.mutate({ id: u.id, value: !isGhost }); }}
                    color={isGhost ? 'gray' : 'orange'}
                    disabled={ghostMutation.isPending}
                  >{isGhost ? '👻 Зняти Ghost' : '👻 Ghost-бан'}</ActionBtn>
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.colors.glassBorder}`, color: page === 0 ? theme.colors.textFaint : theme.colors.textMuted, fontFamily: theme.fonts.sans, fontSize: 12, cursor: page === 0 ? 'not-allowed' : 'pointer' }}
          >← Назад</button>
          <span style={{ fontFamily: theme.fonts.sans, fontSize: 12, color: theme.colors.textMuted }}>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.colors.glassBorder}`, color: page === totalPages - 1 ? theme.colors.textFaint : theme.colors.textMuted, fontFamily: theme.fonts.sans, fontSize: 12, cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer' }}
          >Далі →</button>
        </div>
      )}
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
function ReportsTab() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: profilesApi.adminGetReports,
    refetchInterval: 30_000,
  });

  const banMutation = useMutation({
    mutationFn: (id: string) => profilesApi.adminBan(id, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });

  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: 60, color: theme.colors.textFaint, fontFamily: theme.fonts.sans }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
      <div style={{ fontSize: 13 }}>Завантаження скарг…</div>
    </div>
  );

  if (reports.length === 0) return (
    <SectionCard>
      <div style={{ textAlign: 'center', padding: '50px 20px' }}>
        <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>✅</div>
        <div style={{ fontFamily: theme.fonts.sans, fontWeight: 700, fontSize: 15, color: theme.colors.text, marginBottom: 4 }}>Скарг немає</div>
        <div style={{ fontFamily: theme.fonts.sans, fontSize: 12, color: theme.colors.textFaint }}>Платформа чиста</div>
      </div>
    </SectionCard>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ background: c.orange.bg, border: `1px solid ${c.orange.border}`, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>⚠️</span>
        <div>
          <div style={{ fontFamily: theme.fonts.sans, fontWeight: 700, fontSize: 14, color: theme.colors.text }}>{reports.length} активних скарг</div>
          <div style={{ fontFamily: theme.fonts.sans, fontSize: 11, color: c.orange.text }}>Потребують вашої уваги</div>
        </div>
      </div>

      {reports.map((r: any) => {
        const isOpen = expanded === r.id;
        return (
          <div key={r.id} style={{ background: g.card, border: `1px solid rgba(249,115,22,0.2)`, borderRadius: 16, overflow: 'hidden' }}>
            <div
              style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
              onClick={() => setExpanded(isOpen ? null : r.id)}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.orange.text, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.text, fontWeight: 600 }}>
                  <span style={{ color: theme.colors.green.light }}>{r.reporter?.name ?? '?'}</span>
                  <span style={{ color: theme.colors.textFaint }}> → </span>
                  <span style={{ color: '#f87171' }}>{r.reported?.name ?? '?'}</span>
                </div>
                <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.textFaint, marginTop: 2 }}>
                  {new Date(r.createdAt).toLocaleString('uk-UA')}
                </div>
              </div>
              <span style={{ color: theme.colors.textFaint, fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
            </div>

            {isOpen && (
              <div style={{ borderTop: `1px solid ${theme.colors.glassBorder}`, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {r.reason && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${theme.colors.glassBorder}`, borderRadius: 10, padding: '10px 12px', fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.text, lineHeight: 1.5 }}>
                    "{r.reason}"
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <ActionBtn onClick={() => navigate(`/users/${r.reporter?.id}`)} color="neutral">👤 Скаржник</ActionBtn>
                  <ActionBtn onClick={() => navigate(`/users/${r.reported?.id}`)} color="neutral">👤 Обвинувачений</ActionBtn>
                  <ActionBtn
                    onClick={() => { if (confirm(`Забанити ${r.reported?.name}?`)) banMutation.mutate(r.reported?.id); }}
                    color="red"
                    disabled={banMutation.isPending}
                  >🚫 Забанити</ActionBtn>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Support shortcut ─────────────────────────────────────────────────────────
function SupportTab() {
  const navigate = useNavigate();
  return (
    <SectionCard>
      <div style={{ padding: '30px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: c.green.bg, border: `2px solid ${c.green.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🛟</div>
        <div>
          <div style={{ fontFamily: theme.fonts.sans, fontWeight: 700, fontSize: 16, color: theme.colors.text, marginBottom: 4 }}>Служба підтримки</div>
          <div style={{ fontFamily: theme.fonts.sans, fontSize: 12, color: theme.colors.textFaint }}>Відповідай на звернення юзерів у реальному часі</div>
        </div>
        <button
          onClick={() => navigate('/support')}
          style={{ background: g.greenBtn, border: 'none', borderRadius: 14, padding: '12px 28px', fontFamily: theme.fonts.sans, fontWeight: 700, fontSize: 14, color: '#fff', cursor: 'pointer', boxShadow: theme.shadow.green }}
        >
          Відкрити чат підтримки →
        </button>
      </div>
    </SectionCard>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export function AdminPage() {
  const [section, setSection] = useState<Section>('overview');

  const { data: reports = [] } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: profilesApi.adminGetReports,
    refetchInterval: 30_000,
  });

  const navItems: { key: Section; icon: string; label: string; badge?: number }[] = [
    { key: 'overview',   icon: '📊', label: 'Огляд' },
    { key: 'analytics',  icon: '📈', label: 'Графіки' },
    { key: 'users',      icon: '👥', label: 'Юзери' },
    { key: 'chats',      icon: '💬', label: 'Чати' },
    { key: 'reports',    icon: '⚠️', label: 'Скарги', badge: reports.length },
    { key: 'support',    icon: '🛟', label: 'Support' },
  ];

  return (
    <div className="fade-up">
      {/* Page header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>⚙️</div>
          <div>
            <div style={{ fontFamily: theme.fonts.sans, fontWeight: 800, fontSize: 20, color: theme.colors.text, letterSpacing: '-0.3px' }}>
              Адмін-панель
            </div>
            <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.textFaint, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Pro Control Center
            </div>
          </div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: c.green.bg, border: `1px solid ${c.green.border}`, borderRadius: 50, padding: '3px 10px' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: theme.colors.green.light, animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: theme.fonts.sans, fontSize: 10, fontWeight: 700, color: theme.colors.green.light }}>LIVE</span>
        </div>
      </div>

      {/* Nav tabs — scrollable 2 rows */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 18 }}>
        {navItems.map(({ key, icon, label, badge }) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            style={{
              padding: '9px 6px', borderRadius: 12, position: 'relative',
              background: section === key ? 'rgba(86,171,145,0.2)' : 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${section === key ? 'rgba(86,171,145,0.45)' : theme.colors.glassBorder}`,
              color: section === key ? theme.colors.green.light : theme.colors.textMuted,
              fontFamily: theme.fonts.sans, fontSize: 10, fontWeight: section === key ? 700 : 400,
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}
          >
            <span style={{ fontSize: 15, position: 'relative' }}>
              {icon}
              {badge && badge > 0 ? (
                <span style={{
                  position: 'absolute', top: -5, right: -8,
                  background: '#ef4444', borderRadius: '50%',
                  minWidth: 14, height: 14, fontSize: 8, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', padding: '0 3px', border: '1.5px solid #0d2137',
                }}>{badge}</span>
              ) : null}
            </span>
            {label}
          </button>
        ))}
      </div>

      {/* Section content */}
      {section === 'overview'  && <OverviewTab onNavigate={setSection} />}
      {section === 'analytics' && <AnalyticsTab />}
      {section === 'users'     && <UsersTab />}
      {section === 'chats'     && <ChatsTab />}
      {section === 'reports'   && <ReportsTab />}
      {section === 'support'   && <SupportTab />}
    </div>
  );
}
