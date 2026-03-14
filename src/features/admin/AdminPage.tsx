import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { profilesApi } from '@/api/profiles.api';
import { Avatar } from '@/components/ui/Avatar';
import { User } from '@/types';
import { theme, g } from '@/styles/theme';
import { calcAge } from '@/utils';

type Tab = 'stats' | 'users' | 'reports';

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color?: string }) {
  return (
    <div style={{ background: g.card, border: `1px solid ${theme.colors.glassBorder}`, borderRadius: 16, padding: '16px 18px', flex: 1 }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontFamily: theme.fonts.sans, fontSize: 26, fontWeight: 700, color: color ?? theme.colors.text }}>{value}</div>
      <div style={{ fontFamily: theme.fonts.sans, fontSize: 11, color: theme.colors.textFaint, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function StatsTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: profilesApi.adminGetStats,
    refetchInterval: 30_000,
  });

  if (isLoading) return <div style={{ textAlign: 'center', padding: 40, color: theme.colors.textFaint, fontFamily: theme.fonts.sans }}>🌿</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <StatCard icon="👥" label="Всього юзерів" value={stats?.total ?? 0} />
        <StatCard icon="🌿" label="Активних" value={stats?.active ?? 0} color={theme.colors.green.light} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <StatCard icon="🆕" label="Сьогодні" value={stats?.newToday ?? 0} color="#60a5fa" />
        <StatCard icon="⭐" label="Premium" value={stats?.premium ?? 0} color="#f9d976" />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <StatCard icon="✓" label="Верифікованих" value={stats?.verified ?? 0} color="#3b82f6" />
        <StatCard icon="⚠️" label="Скарг" value={stats?.reports ?? 0} color="#fb923c" />
      </div>
    </div>
  );
}

function UsersTab() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

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

  const filtered = users.filter((u: User) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  if (isLoading) return <div style={{ textAlign: 'center', padding: 40, color: theme.colors.textFaint, fontFamily: theme.fonts.sans }}>🌿</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Пошук за ім'ям або email..."
        style={{ width: '100%', padding: '12px 16px', background: theme.colors.glass, border: `1.5px solid ${theme.colors.glassBorder}`, borderRadius: 14, fontFamily: theme.fonts.sans, fontSize: 14, color: theme.colors.text, boxSizing: 'border-box' }}
      />

      <div style={{ fontFamily: theme.fonts.sans, fontSize: 11, color: theme.colors.textFaint }}>
        {filtered.length} з {users.length} юзерів
      </div>

      {filtered.map((u: User) => (
        <div key={u.id} style={{ background: g.card, border: `1px solid ${(u as any).isActive === false ? 'rgba(239,68,68,0.3)' : theme.colors.glassBorder}`, borderRadius: 18, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/users/${u.id}`)}>
              <Avatar photo={u.photo} name={u.name} size={44} border={`2px solid ${theme.colors.glassBorder}`} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <div style={{ fontFamily: theme.fonts.serif, fontSize: 17, color: theme.colors.text }}>{u.name}</div>
                {u.isVerified && <span style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 50, padding: '1px 8px', fontFamily: theme.fonts.sans, fontSize: 10, color: '#60a5fa' }}>✓ Верифік.</span>}
                {u.isPremium && <span style={{ background: 'rgba(249,217,118,0.15)', border: '1px solid rgba(249,217,118,0.3)', borderRadius: 50, padding: '1px 8px', fontFamily: theme.fonts.sans, fontSize: 10, color: '#f9d976' }}>⭐ Premium</span>}
                {u.isAdmin && <span style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 50, padding: '1px 8px', fontFamily: theme.fonts.sans, fontSize: 10, color: '#c084fc' }}>Адмін</span>}
                {(u as any).isActive === false && <span style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 50, padding: '1px 8px', fontFamily: theme.fonts.sans, fontSize: 10, color: '#f87171' }}>BANNED</span>}
              </div>
              <div style={{ fontFamily: theme.fonts.sans, fontSize: 11, color: theme.colors.textFaint, marginTop: 2 }}>
                {u.email} · {u.city} · {calcAge(u.birth)} р. · 🪙{u.coins}
              </div>
            </div>
          </div>

          {/* Admin action buttons */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => verifyMutation.mutate({ id: u.id, value: !u.isVerified })}
              style={{ padding: '6px 12px', borderRadius: 10, background: u.isVerified ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${u.isVerified ? 'rgba(59,130,246,0.4)' : theme.colors.glassBorder}`, color: u.isVerified ? '#60a5fa' : theme.colors.textMuted, fontFamily: theme.fonts.sans, fontSize: 12, cursor: 'pointer' }}
            >
              {u.isVerified ? '✓ Зняти галочку' : '✓ Верифікувати'}
            </button>

            <button
              onClick={() => premiumMutation.mutate({ id: u.id, value: !u.isPremium })}
              style={{ padding: '6px 12px', borderRadius: 10, background: u.isPremium ? 'rgba(249,217,118,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${u.isPremium ? 'rgba(249,217,118,0.3)' : theme.colors.glassBorder}`, color: u.isPremium ? '#f9d976' : theme.colors.textMuted, fontFamily: theme.fonts.sans, fontSize: 12, cursor: 'pointer' }}
            >
              {u.isPremium ? '⭐ Зняти Premium' : '⭐ Дати Premium'}
            </button>

            {!u.isAdmin && (
              <button
                onClick={() => { if (confirm((u as any).isActive === false ? `Розбанити ${u.name}?` : `Забанити ${u.name}?`)) banMutation.mutate({ id: u.id, value: (u as any).isActive !== false }); }}
                style={{ padding: '6px 12px', borderRadius: 10, background: (u as any).isActive === false ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${(u as any).isActive === false ? 'rgba(239,68,68,0.3)' : theme.colors.glassBorder}`, color: (u as any).isActive === false ? '#f87171' : theme.colors.textMuted, fontFamily: theme.fonts.sans, fontSize: 12, cursor: 'pointer' }}
              >
                {(u as any).isActive === false ? '🔓 Розбанити' : '🚫 Забанити'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportsTab() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: profilesApi.adminGetReports,
    refetchInterval: 30_000,
  });

  const banMutation = useMutation({
    mutationFn: (id: string) => profilesApi.adminBan(id, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });

  if (isLoading) return <div style={{ textAlign: 'center', padding: 40, color: theme.colors.textFaint, fontFamily: theme.fonts.sans }}>🌿</div>;

  if (reports.length === 0) return (
    <div style={{ textAlign: 'center', padding: '50px 20px', fontFamily: theme.fonts.sans, color: theme.colors.textFaint }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>⚠️</div>
      <div>Скарг поки немає</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {reports.map((r: any) => (
        <div key={r.id} style={{ background: g.card, border: `1px solid rgba(249,115,22,0.2)`, borderRadius: 16, padding: '14px 16px' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.textMuted, marginBottom: 4 }}>
                <span style={{ color: theme.colors.green.light, cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate(`/users/${r.reporter?.id}`)}>
                  {r.reporter?.name ?? 'Невідомий'}
                </span>
                {' → '}
                <span style={{ color: '#f87171', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate(`/users/${r.reported?.id}`)}>
                  {r.reported?.name ?? 'Невідомий'}
                </span>
              </div>
              {r.reason && (
                <div style={{ fontFamily: theme.fonts.sans, fontSize: 13, color: theme.colors.text, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 12px', marginBottom: 6 }}>
                  {r.reason}
                </div>
              )}
              <div style={{ fontFamily: theme.fonts.sans, fontSize: 10, color: theme.colors.textFaint }}>
                {new Date(r.createdAt).toLocaleString('uk-UA')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => navigate(`/users/${r.reported?.id}`)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.colors.glassBorder}`, color: theme.colors.textMuted, fontFamily: theme.fonts.sans, fontSize: 12, cursor: 'pointer' }}
            >
              👤 Переглянути профіль
            </button>
            <button
              onClick={() => { if (confirm(`Забанити ${r.reported?.name}?`)) banMutation.mutate(r.reported?.id); }}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontFamily: theme.fonts.sans, fontSize: 12, cursor: 'pointer' }}
            >
              🚫 Забанити
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('stats');

  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'stats', icon: '📊', label: 'Статистика' },
    { key: 'users', icon: '👥', label: 'Юзери' },
    { key: 'reports', icon: '⚠️', label: 'Скарги' },
  ];

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: theme.fonts.serif, fontSize: 26, color: theme.colors.text }}>Адмін-панель</div>
        <div style={{ fontFamily: theme.fonts.sans, fontSize: 12, color: theme.colors.textFaint, marginTop: 3 }}>
          Керування додатком
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 20 }}>
        {tabs.map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '12px 8px', borderRadius: 14,
              background: tab === key ? 'rgba(86,171,145,0.25)' : 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${tab === key ? 'rgba(86,171,145,0.5)' : theme.colors.glassBorder}`,
              color: tab === key ? theme.colors.green.light : theme.colors.textMuted,
              fontFamily: theme.fonts.sans, fontSize: 13, fontWeight: tab === key ? 700 : 400,
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 18 }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {tab === 'stats' && <StatsTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'reports' && <ReportsTab />}
    </div>
  );
}
