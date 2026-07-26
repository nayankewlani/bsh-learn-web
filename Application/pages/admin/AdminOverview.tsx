import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { AdminStats, AdminEarnings, AdminAnalytics, AnalyticsPeriod, AnalyticsSeries, CourseEnrollmentSeries, LiveClassesSeries } from '../../api/admin';
import { adminGetStats, adminGetEarnings, adminGetAnalytics } from '../../api/admin';

const fmt     = (p: number) => '₹' + (p / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmtNum  = (n: number) => n.toLocaleString('en-IN');

const PERIODS: AnalyticsPeriod[] = ['1d', '2d', '1w', '1m', '3m', '6m', '1y'];
const PERIOD_LABEL: Record<AnalyticsPeriod, string> = {
  '1d': '1D', '2d': '2D', '1w': '1W', '1m': '1M', '3m': '3M', '6m': '6M', '1y': '1Y',
};

type MetricKey = 'students' | 'courses' | 'sessions' | 'revenue' | 'courseEnrollments' | 'liveClasses';

const METRICS: { key: MetricKey; label: string; color: string; icon: string; currency?: boolean }[] = [
  { key: 'students',          label: 'New Students',       color: '#3b82f6', icon: '👥' },
  { key: 'courses',           label: 'New Courses',        color: '#22c55e', icon: '📚' },
  { key: 'sessions',          label: 'Sessions',           color: '#a855f7', icon: '📋' },
  { key: 'revenue',           label: 'Revenue',            color: '#f59e0b', icon: '💰', currency: true },
  { key: 'courseEnrollments', label: 'Course Enrollments', color: '#06b6d4', icon: '🎓' },
  { key: 'liveClasses',       label: 'Live Classes',       color: '#ef4444', icon: '📡' },
];

// Custom tooltip for Recharts
const ChartTooltip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0f0e1a', border: '1px solid #3730a3', borderRadius: 8,
      padding: '8px 12px', fontSize: 12, color: '#e2e8f0',
    }}>
      <div style={{ color: '#64748b', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 700, color: payload[0].color }}>
        {currency ? fmt(payload[0].value) : fmtNum(payload[0].value)}
      </div>
    </div>
  );
};

interface ChartCardProps {
  metric: typeof METRICS[number];
  series: AnalyticsSeries | undefined;
  period: AnalyticsPeriod;
  onPeriodChange: (p: AnalyticsPeriod) => void;
  expanded: boolean;
  onToggle: () => void;
  loading: boolean;
  extraContent?: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({
  metric, series, period, onPeriodChange, expanded, onToggle, loading, extraContent,
}) => {
  const gradId = `grad-${metric.key}`;
  const change = series?.change ?? 0;
  const positive = change >= 0;
  const total = series?.total ?? 0;
  const chartH = expanded ? 220 : 90;

  // Thin out labels when many data points
  const data = series?.data ?? [];
  const tickInterval = data.length > 60 ? Math.floor(data.length / 10) :
                       data.length > 30 ? Math.floor(data.length / 6) : 0;

  return (
    <div
      onClick={onToggle}
      style={{
        background: '#1a1835',
        border: `1px solid ${expanded ? metric.color : '#2a2a5a'}`,
        borderRadius: 14,
        padding: '16px 18px',
        cursor: 'pointer',
        transition: 'border-color .2s, box-shadow .2s',
        boxShadow: expanded ? `0 0 0 1px ${metric.color}33, 0 8px 32px rgba(0,0,0,.4)` : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: metric.color, borderRadius: '14px 14px 0 0',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
            {metric.icon} {metric.label}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
            {metric.currency ? fmt(total) : fmtNum(total)}
          </div>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
            background: positive ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)',
            color: positive ? '#22c55e' : '#ef4444',
          }}>
            {positive ? '▲' : '▼'} {Math.abs(change)}%
          </span>
          <div style={{ fontSize: 10, color: '#475569' }}>vs prev period</div>
        </div>
      </div>

      {/* Period selector — stop click bubbling to card toggle */}
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 3, marginBottom: 12, flexWrap: 'wrap' }}>
        {PERIODS.map(p => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            style={{
              padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all .15s',
              background: period === p ? metric.color : 'transparent',
              color: period === p ? '#fff' : '#64748b',
            }}
          >
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>

      {/* Chart */}
      {loading ? (
        <div style={{ height: chartH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="adm-spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
        </div>
      ) : data.length === 0 ? (
        <div style={{ height: chartH, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 13 }}>
          No data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={chartH}>
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={metric.color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
              </linearGradient>
            </defs>

            {expanded && (
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false} />
            )}
            <XAxis
              dataKey="label"
              tick={{ fill: '#475569', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={tickInterval}
              hide={!expanded}
            />
            <YAxis
              tick={{ fill: '#475569', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={expanded ? 38 : 0}
              tickFormatter={metric.currency ? (v: number) => `₹${(v / 100).toFixed(0)}` : (v: number) => String(v)}
              hide={!expanded}
            />
            <Tooltip
              content={<ChartTooltip currency={metric.currency} />}
              cursor={{ stroke: metric.color, strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={metric.color}
              strokeWidth={2}
              fill={`url(#${gradId})`}
              dot={false}
              activeDot={{ r: 4, fill: metric.color, strokeWidth: 0 }}
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Extra content (top courses, recent classes, etc.) shown when expanded */}
      {expanded && extraContent && (
        <div onClick={e => e.stopPropagation()} style={{ marginTop: 16, borderTop: '1px solid #2a2a5a', paddingTop: 14 }}>
          {extraContent}
        </div>
      )}

      {/* Expand hint */}
      <div style={{
        position: 'absolute', bottom: 8, right: 12,
        fontSize: 10, color: '#475569', pointerEvents: 'none',
      }}>
        {expanded ? '▲ collapse' : '▼ expand'}
      </div>
    </div>
  );
};

// ── Main overview page ──────────────────────────────────────────────────────

const AdminOverview: React.FC = () => {
  const [stats,    setStats]    = useState<AdminStats | null>(null);
  const [earnings, setEarnings] = useState<AdminEarnings | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [aLoading, setALoading] = useState(false);
  const [error,    setError]    = useState('');

  // Per-card period state
  const [periods, setPeriods] = useState<Record<MetricKey, AnalyticsPeriod>>({
    students: '1m', courses: '1m', sessions: '1m', revenue: '1m',
    courseEnrollments: '1m', liveClasses: '1m',
  });
  // Which card is expanded (null = all collapsed)
  const [expanded, setExpanded] = useState<MetricKey | null>(null);

  // Fetch base stats once
  useEffect(() => {
    Promise.all([adminGetStats(), adminGetEarnings()])
      .then(([sr, er]) => {
        setStats((sr.data as any).stats ?? sr.data);
        setEarnings(er.data as any);
      })
      .catch(() => setError('Failed to load stats.'))
      .finally(() => setLoading(false));
  }, []);

  // Fetch analytics whenever any period changes (debounced by collecting all)
  const fetchAnalytics = useCallback((p: AnalyticsPeriod) => {
    setALoading(true);
    adminGetAnalytics(p)
      .then(r => setAnalytics(r.data as AdminAnalytics))
      .catch(() => {})
      .finally(() => setALoading(false));
  }, []);

  // When a card changes its period, refetch with that period
  // We use a "dominant" period = the expanded card's period, or the most recently changed
  const [activePeriod, setActivePeriod] = useState<AnalyticsPeriod>('1m');

  useEffect(() => { fetchAnalytics(activePeriod); }, [activePeriod, fetchAnalytics]);

  const handlePeriodChange = (metric: MetricKey, p: AnalyticsPeriod) => {
    setPeriods(prev => ({ ...prev, [metric]: p }));
    setActivePeriod(p);
  };

  const handleToggle = (key: MetricKey) => {
    setExpanded(prev => prev === key ? null : key);
  };

  if (loading) return <div className="adm-loading"><div className="adm-spinner" /><span>Loading dashboard…</span></div>;
  if (error)   return <div className="adm-empty" style={{ color: '#ef4444' }}>{error}</div>;
  if (!stats)  return null;

  // Summary stat chips at top
  const chips = [
    { label: 'Students',      value: stats.totalStudents,       color: '#3b82f6' },
    { label: 'Trainers',      value: stats.totalTrainers,       color: '#a855f7' },
    { label: 'Courses',       value: stats.totalCourses,        color: '#22c55e' },
    { label: 'Enrollments',   value: stats.totalEnrollments,    color: '#06b6d4' },
    { label: 'Live Now',      value: stats.liveNow,             color: '#ef4444' },
    { label: 'Subscriptions', value: stats.activeSubscriptions, color: '#f59e0b' },
    { label: 'Pending',       value: stats.pendingSessions,     color: '#f97316' },
  ];

  return (
    <>
      {/* ── Revenue hero ── */}
      <div className="adm-card" style={{ marginBottom: 18, background: 'linear-gradient(135deg,#1a1835,#1f0f4d)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
              Total Revenue
            </div>
            <div className="adm-rev-big">{fmt(stats.totalRevenuePaise)}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
              This month: <strong style={{ color: '#a78bfa' }}>{fmt(stats.thisMonthRevenuePaise)}</strong>
            </div>
          </div>
          {earnings?.byType && earnings.byType.length > 0 && (
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              {earnings.byType.map(t => (
                <div key={t.type} style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize', marginBottom: 2 }}>{t.type}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>{fmt(t.revenuePaise)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick stat chips ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {chips.map(c => (
          <div key={c.label} style={{
            background: '#1a1835', border: '1px solid #2a2a5a', borderRadius: 10,
            padding: '8px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center',
            minWidth: 70,
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{fmtNum(c.value)}</div>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── Chart cards ── */}
      {(() => {
        const ce = analytics?.courseEnrollments as CourseEnrollmentSeries | undefined;
        const lc = analytics?.liveClasses       as LiveClassesSeries      | undefined;

        const courseEnrollmentsExtra = ce?.topCourses?.length ? (() => {
          const max = Math.max(...ce.topCourses.map(c => c.count), 1);
          return (
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
                Top Courses by Enrollment
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ce.topCourses.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 140, fontSize: 12, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{c.title}</div>
                    <div style={{ flex: 1, background: '#1f1c3d', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round((c.count / max) * 100)}%`, height: '100%', background: '#06b6d4', borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 12, color: '#06b6d4', fontWeight: 700, width: 28, textAlign: 'right' }}>{c.count}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })() : null;

        const liveClassesExtra = lc ? (() => {
          const recent = lc.recentClasses ?? [];
          return (
            <div>
              <div style={{ display: 'flex', gap: 24, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Total Classes</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>{lc.total}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Total Attendees</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#f97316' }}>{lc.totalAttendees ?? 0}</div>
                </div>
              </div>
              {recent.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
                    Recent Live Classes
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {recent.map((c, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#13102b', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                            {new Date(c.scheduledAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginLeft: 10 }}>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>👥 {c.attendees}</span>
                          <span className={`pill ${c.status === 'live' ? 'pill-red' : c.status === 'scheduled' ? 'pill-blue' : 'pill-gray'}`}>{c.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })() : null;

        const extraMap: Partial<Record<MetricKey, React.ReactNode>> = {
          courseEnrollments: courseEnrollmentsExtra,
          liveClasses:       liveClassesExtra,
        };

        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: expanded ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
            marginBottom: 20,
            transition: 'grid-template-columns .2s',
          }}>
            {METRICS.map(metric => (
              <ChartCard
                key={metric.key}
                metric={metric}
                series={analytics?.[metric.key] as AnalyticsSeries | undefined}
                period={periods[metric.key]}
                onPeriodChange={p => handlePeriodChange(metric.key, p)}
                expanded={expanded === metric.key}
                onToggle={() => handleToggle(metric.key)}
                loading={aLoading}
                extraContent={extraMap[metric.key]}
              />
            ))}
          </div>
        );
      })()}

      {/* ── Top courses ── */}
      {earnings?.topCourses && earnings.topCourses.length > 0 && (
        <div className="adm-card" style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 14 }}>📈 Top Earning Courses</div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>#</th><th>Course</th><th>Enrollments</th><th>Revenue</th></tr></thead>
              <tbody>
                {earnings.topCourses.map((c, i) => (
                  <tr key={i}>
                    <td style={{ color: '#64748b' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{c.title}</td>
                    <td>{fmtNum(c.enrollments)}</td>
                    <td style={{ color: '#a78bfa', fontWeight: 700 }}>{fmt(c.revenuePaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Monthly bar chart ── */}
      {earnings?.monthlyBreakdown && earnings.monthlyBreakdown.length > 0 && (
        <div className="adm-card">
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>📅 Monthly Revenue</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {earnings.monthlyBreakdown.slice(-6).map(m => {
              const max = Math.max(...earnings.monthlyBreakdown.map(x => x.revenuePaise), 1);
              return (
                <div className="adm-bar-row" key={m.month}>
                  <div style={{ width: 60, fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>{m.month}</div>
                  <div className="adm-bar-track">
                    <div className="adm-bar-fill" style={{ width: `${Math.round((m.revenuePaise / max) * 100)}%` }} />
                  </div>
                  <div style={{ width: 80, textAlign: 'right', fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>
                    {fmt(m.revenuePaise)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminOverview;
