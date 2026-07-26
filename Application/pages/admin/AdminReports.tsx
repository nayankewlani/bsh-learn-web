import React, { useState, useMemo } from 'react';
import client from '../../api/client';

// ─── File utilities ────────────────────────────────────────────────────────────

const BOM = '﻿';

function csvRow(cells: any[]): string {
  return cells.map(v => {
    const s = String(v ?? '');
    return (s.includes(',') || s.includes('"') || s.includes('\n'))
      ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',');
}

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// ─── Formatters ────────────────────────────────────────────────────────────────

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

const fmtRs = (paise?: number) =>
  paise != null ? (paise / 100).toLocaleString('en-IN') : '';

const todayStr = () => new Date().toISOString().slice(0, 10);

function inRange(dateStr?: string, from?: string, to?: string) {
  if (!dateStr) return true;
  if (!from && !to) return true;
  const d = new Date(dateStr).getTime();
  if (from && d < new Date(from).getTime()) return false;
  if (to && d > new Date(to + 'T23:59:59').getTime()) return false;
  return true;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type Section = 'students' | 'trainers' | 'courses' | 'enrollments' | 'live' | 'sessions' | 'applications' | 'revenue';
interface ColDef { header: string; get: (row: any) => any; }

// ─── Section metadata ──────────────────────────────────────────────────────────

const SECTIONS: { key: Section; icon: string; label: string; desc: string }[] = [
  { key: 'students',     icon: '👥', label: 'Students',           desc: 'All registered students' },
  { key: 'trainers',     icon: '🎓', label: 'Trainers',           desc: 'Trainer profiles & performance stats' },
  { key: 'courses',      icon: '📚', label: 'Courses & Programs',  desc: 'All courses and programs with status' },
  { key: 'enrollments',  icon: '🧾', label: 'Enrollments',        desc: 'Enrollment & payment transaction records' },
  { key: 'live',         icon: '📡', label: 'Live Classes',       desc: 'All live class records by status & type' },
  { key: 'sessions',     icon: '📋', label: 'Private Sessions',   desc: 'Admin-managed sessions & calls' },
  { key: 'applications', icon: '✋', label: '1:1 Applications',   desc: 'Customer session applications to trainers' },
  { key: 'revenue',      icon: '₹',  label: 'Revenue',            desc: 'Financial breakdown by month & type' },
];

// ─── Column definitions ────────────────────────────────────────────────────────

const COLS: Record<Section, ColDef[]> = {
  students: [
    { header: 'Name',        get: r => r.name },
    { header: 'Email',       get: r => r.email },
    { header: 'Phone',       get: r => r.phone || '' },
    { header: 'Enrollments', get: r => r.enrollmentCount ?? 0 },
    { header: 'Status',      get: r => r.isActive !== false ? 'Active' : 'Suspended' },
    { header: 'Joined',      get: r => fmtDate(r.createdAt) },
  ],
  trainers: [
    { header: 'Name',                  get: r => r.name },
    { header: 'Email',                 get: r => r.email },
    { header: 'Phone',                 get: r => r.phone || '' },
    { header: 'Role / Title',          get: r => r.trainerRole || '' },
    { header: 'Specialties',           get: r => (r.specialties || []).join('; ') },
    { header: 'Rating',                get: r => r.rating ?? '' },
    { header: 'Followers',             get: r => r.followers ?? '' },
    { header: 'Sessions Display',      get: r => r.sessionsDisplay || '' },
    { header: 'Session Price (₹/min)', get: r => r.sessionPricePaise ? fmtRs(r.sessionPricePaise) : '' },
    { header: 'Revenue (₹)',           get: r => fmtRs(r.revenuePaise) },
    { header: 'Courses',               get: r => r.courseCount ?? 0 },
    { header: 'Students',              get: r => r.studentCount ?? 0 },
    { header: 'Can Publish',           get: r => r.canPublish ? 'Yes' : 'No' },
    { header: 'Can Go Live',           get: r => r.canGoLive ? 'Yes' : 'No' },
    { header: 'Can Offer Sessions',    get: r => r.canOfferSessions ? 'Yes' : 'No' },
    { header: 'Pay Button',            get: r => r.hasPayBooking ? 'Yes' : 'No' },
    { header: 'Apply Button',          get: r => r.hasApplyBooking ? 'Yes' : 'No' },
    { header: 'Status',                get: r => r.isActive ? 'Active' : 'Paused' },
    { header: 'Verified',              get: r => r.isVerified ? 'Yes' : 'No' },
    { header: 'Verified Badge',        get: r => r.isVerifiedBadge ? 'Yes' : 'No' },
    { header: 'Joined',                get: r => fmtDate(r.createdAt) },
  ],
  courses: [
    { header: 'Type',              get: r => r._type === 'program' ? 'Program' : 'Course' },
    { header: 'Title',             get: r => r.title },
    { header: 'Educator',          get: r => r.educator?.name ?? '' },
    { header: 'Category',          get: r => r.category || '' },
    { header: 'Sub-category',      get: r => r.subcategory || '' },
    { header: 'Language',          get: r => r.language || '' },
    { header: 'Level',             get: r => r.level || '' },
    { header: 'Price (₹)',         get: r => fmtRs(r.price) },
    { header: 'Discount Price (₹)', get: r => r.discountPrice ? fmtRs(r.discountPrice) : '' },
    { header: 'Enrollments',       get: r => r.enrollmentCount ?? 0 },
    { header: 'Batches',           get: r => r.batches?.length ?? 0 },
    { header: 'Published',         get: r => (r.isPublished || r.isActive) ? 'Yes' : 'No' },
    { header: 'Featured',          get: r => r.isFeatured ? 'Yes' : 'No' },
    { header: 'GHL Connected',     get: r => r.ghlConfig?.isConnected ? 'Yes' : 'No' },
    { header: 'Razorpay Link',     get: r => r.razorpayPaymentLink ? 'Yes' : 'No' },
    { header: 'Showcase',          get: r => r.showcaseWork ? 'Yes' : 'No' },
    { header: 'Tags',              get: r => (r.tags || []).join('; ') },
    { header: 'Created',           get: r => fmtDate(r.createdAt) },
  ],
  enrollments: [
    { header: 'Student Name',  get: r => r.user?.name || r.student?.name || r.userName || '' },
    { header: 'Email',         get: r => r.user?.email || r.student?.email || r.userEmail || '' },
    { header: 'Phone',         get: r => r.user?.phone || r.student?.phone || r.userPhone || '' },
    { header: 'Course / Item', get: r => r.course?.title || r.program?.title || r.courseName || r.itemTitle || '' },
    { header: 'Amount (₹)',    get: r => r.amount ? fmtRs(r.amount) : r.amountPaise ? fmtRs(r.amountPaise) : '' },
    { header: 'Payment ID',    get: r => r.razorpayPaymentId || r.paymentId || '' },
    { header: 'Order ID',      get: r => r.razorpayOrderId || r.orderId || '' },
    { header: 'Type',          get: r => r.type || '' },
    { header: 'Status',        get: r => r.status || '' },
    { header: 'Date',          get: r => fmtDate(r.createdAt || r.purchasedAt) },
  ],
  live: [
    { header: 'Title',            get: r => r.title },
    { header: 'Type',             get: r => (r.maxParticipants ?? 500) <= 2 ? '1:1 Session' : r.course ? 'Course Live' : 'Free Live' },
    { header: 'Trainer',          get: r => r.educator?.name ?? '' },
    { header: 'Course',           get: r => r.course?.title ?? '' },
    { header: 'Status',           get: r => r.status || '' },
    { header: 'Scheduled At',     get: r => fmtDate(r.scheduledAt) },
    { header: 'Duration (min)',   get: r => r.duration ?? '' },
    { header: 'Max Participants', get: r => r.maxParticipants ?? '' },
    { header: 'Agora Channel',    get: r => r.agoraChannel || '' },
  ],
  sessions: [
    { header: 'Name',         get: r => r.name },
    { header: 'Email',        get: r => r.email },
    { header: 'Phone',        get: r => r.phone || '' },
    { header: 'Type',         get: r => r.type || '' },
    { header: 'Status',       get: r => r.status || '' },
    { header: 'Issues',       get: r => Array.isArray(r.issues) ? r.issues.join('; ') : r.issues || '' },
    { header: 'Detail',       get: r => r.detail || '' },
    { header: 'DOB',          get: r => r.dob ? fmtDate(r.dob) : '' },
    { header: 'Scheduled At', get: r => fmtDate(r.scheduledAt) },
    { header: 'Admin Notes',  get: r => r.adminNotes || '' },
    { header: 'Created',      get: r => fmtDate(r.createdAt) },
  ],
  applications: [
    { header: 'Client Name',       get: r => r.clientName },
    { header: 'Email',             get: r => r.clientEmail },
    { header: 'Phone',             get: r => r.clientPhone || '' },
    { header: 'Trainer',           get: r => r.trainerName || '' },
    { header: 'Issue',             get: r => r.issue || '' },
    { header: 'Preferred Time',    get: r => r.preferredTime || '' },
    { header: 'Message',           get: r => r.message || '' },
    { header: 'Status',            get: r => r.status || '' },
    { header: 'Proposed Schedule', get: r => r.proposedSchedule || '' },
    { header: 'Trainer Note',      get: r => r.trainerNote || '' },
    { header: 'Admin Note',        get: r => r.adminNote || '' },
    { header: 'Agora Channel',     get: r => r.agoraChannel || '' },
    { header: 'Created',           get: r => fmtDate(r.createdAt) },
  ],
  revenue: [
    { header: 'Month',       get: r => r.month },
    { header: 'Revenue (₹)', get: r => fmtRs(r.revenuePaise) },
  ],
};

// ─── Status/type options ───────────────────────────────────────────────────────

const STATUS_OPTS: Partial<Record<Section, string[]>> = {
  live:         ['pending_approval', 'scheduled', 'live', 'ended', 'rejected'],
  sessions:     ['pending', 'contacted', 'scheduled', 'completed', 'cancelled'],
  applications: ['pending', 'trainer_proposed', 'approved', 'rejected', 'completed'],
};

// ─── Inline input style helper ────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%', background: '#1e1b4b', border: '1.5px solid #312e81',
  borderRadius: 8, color: '#e2e8f0', padding: '8px 11px', fontSize: 13,
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
};

// ─── AdminReports ──────────────────────────────────────────────────────────────

const AdminReports: React.FC = () => {
  const [section, setSection] = useState<Section>('students');
  const [cache, setCache]     = useState<Partial<Record<Section, any[]>>>({});
  const [revExtra, setRevExtra] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState('');

  // ── Filters ──
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [search,   setSearch]   = useState('');
  const [statusF,  setStatusF]  = useState('all');
  const [typeF,    setTypeF]    = useState('all');

  const raw  = cache[section] ?? null;
  const cols = COLS[section];
  const sec  = SECTIONS.find(s => s.key === section)!;
  const statusOpts = STATUS_OPTS[section] ?? [];

  // ── Data fetcher ──────────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true); setLoadErr('');
    try {
      let rows: any[] = [];
      if (section === 'students') {
        const r = await client.get('/admin/students', { params: { limit: 10000 } });
        rows = r.data.students ?? r.data ?? [];
      } else if (section === 'trainers') {
        const r = await client.get('/admin/trainers');
        rows = r.data.trainers ?? r.data ?? [];
      } else if (section === 'courses') {
        const r = await client.get('/admin-courses');
        const { courses = [], programs = [] } = r.data;
        rows = [
          ...programs.map((p: any) => ({ ...p, _type: 'program' })),
          ...courses.map((c: any) => ({ ...c, _type: 'course' })),
        ];
      } else if (section === 'enrollments') {
        const r = await client.get('/admin/transactions');
        rows = r.data.transactions ?? r.data ?? [];
      } else if (section === 'live') {
        const r = await client.get('/admin/live-classes', { params: { limit: 10000 } });
        rows = r.data.classes ?? r.data.liveClasses ?? r.data ?? [];
      } else if (section === 'sessions') {
        const r = await client.get('/admin/private-sessions');
        rows = r.data.sessions ?? r.data ?? [];
      } else if (section === 'applications') {
        const r = await client.get('/admin/session-applications');
        rows = r.data.applications ?? r.data ?? [];
      } else if (section === 'revenue') {
        const r = await client.get('/admin/earnings');
        setRevExtra(r.data);
        rows = r.data.monthlyBreakdown ?? [];
      }
      setCache(c => ({ ...c, [section]: rows }));
    } catch (e: any) {
      setLoadErr(e.response?.data?.message || 'Failed to load data');
    } finally { setLoading(false); }
  };

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!raw) return [];
    return raw.filter(row => {
      if (section !== 'revenue') {
        const dv = row.createdAt || row.scheduledAt || row.purchasedAt;
        if (!inRange(dv, dateFrom || undefined, dateTo || undefined)) return false;
      }
      if (search) {
        const q   = search.toLowerCase();
        const txt = [
          row.name, row.email, row.title, row.clientName, row.clientEmail,
          row.trainerName, row.issue, row.phone, row.clientPhone,
          row.educator?.name, row.month, row.type, row.status,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!txt.includes(q)) return false;
      }
      if (statusF !== 'all' && row.status && row.status !== statusF) return false;
      if (typeF !== 'all') {
        if (section === 'courses') { if (row._type !== typeF) return false; }
        if (section === 'live') {
          const t = (row.maxParticipants ?? 500) <= 2 ? '1on1' : row.course ? 'course' : 'free';
          if (t !== typeF) return false;
        }
        if (section === 'sessions') { if (row.type !== typeF) return false; }
      }
      return true;
    });
  }, [raw, dateFrom, dateTo, search, statusF, typeF, section]);

  // ── Export helpers ────────────────────────────────────────────────────────
  const runCSV = (data: any[], colDefs: ColDef[], name: string) => {
    const lines = [colDefs.map(c => c.header), ...data.map(r => colDefs.map(c => c.get(r)))].map(csvRow);
    triggerDownload(BOM + lines.join('\n'), `bsh-${name}-${todayStr()}.csv`, 'text/csv;charset=utf-8;');
  };
  const runJSON = (data: any[], colDefs: ColDef[], name: string) => {
    const out = data.map(row => {
      const o: any = {};
      colDefs.forEach(c => { o[c.header] = c.get(row); });
      return o;
    });
    triggerDownload(JSON.stringify(out, null, 2), `bsh-${name}-${todayStr()}.json`, 'application/json');
  };

  // ── Summary stats ─────────────────────────────────────────────────────────
  const stats = useMemo((): { label: string; value: string | number; color: string }[] => {
    if (!raw) return [];
    const fil = filtered.length;
    switch (section) {
      case 'students': return [
        { label: 'Total',     value: raw.length, color: '#a78bfa' },
        { label: 'Active',    value: raw.filter(r => r.isActive !== false).length, color: '#22c55e' },
        { label: 'Suspended', value: raw.filter(r => r.isActive === false).length, color: '#ef4444' },
        { label: 'Filtered',  value: fil, color: '#f59e0b' },
      ];
      case 'trainers': return [
        { label: 'Total',         value: raw.length, color: '#a78bfa' },
        { label: 'Active',        value: raw.filter(r => r.isActive).length, color: '#22c55e' },
        { label: 'Total Revenue', value: '₹' + fmtRs(raw.reduce((s, r) => s + (r.revenuePaise || 0), 0)), color: '#f59e0b' },
        { label: 'Filtered',      value: fil, color: '#60a5fa' },
      ];
      case 'courses': return [
        { label: 'Total',       value: raw.length, color: '#a78bfa' },
        { label: 'Published',   value: raw.filter(r => r.isPublished || r.isActive).length, color: '#22c55e' },
        { label: 'Enrollments', value: raw.reduce((s, r) => s + (r.enrollmentCount || 0), 0), color: '#f59e0b' },
        { label: 'Filtered',    value: fil, color: '#60a5fa' },
      ];
      case 'enrollments': return [
        { label: 'Records',       value: raw.length, color: '#a78bfa' },
        { label: 'Total Revenue', value: '₹' + fmtRs(raw.reduce((s, r) => s + (r.amount || r.amountPaise || 0), 0)), color: '#22c55e' },
        { label: 'Filtered',      value: fil, color: '#f59e0b' },
      ];
      case 'live': return [
        { label: 'Total',    value: raw.length, color: '#a78bfa' },
        { label: 'Pending',  value: raw.filter(r => r.status === 'pending_approval').length, color: '#f59e0b' },
        { label: 'Ended',    value: raw.filter(r => r.status === 'ended').length, color: '#64748b' },
        { label: 'Filtered', value: fil, color: '#60a5fa' },
      ];
      case 'sessions': return [
        { label: 'Total',     value: raw.length, color: '#a78bfa' },
        { label: 'Pending',   value: raw.filter(r => r.status === 'pending').length, color: '#f59e0b' },
        { label: 'Completed', value: raw.filter(r => r.status === 'completed').length, color: '#22c55e' },
        { label: 'Filtered',  value: fil, color: '#60a5fa' },
      ];
      case 'applications': return [
        { label: 'Total',    value: raw.length, color: '#a78bfa' },
        { label: 'Pending',  value: raw.filter(r => r.status === 'pending').length, color: '#f59e0b' },
        { label: 'Approved', value: raw.filter(r => r.status === 'approved').length, color: '#22c55e' },
        { label: 'Filtered', value: fil, color: '#60a5fa' },
      ];
      case 'revenue': {
        const tot = revExtra?.totalRevenuePaise ?? raw.reduce((s, r) => s + (r.revenuePaise || 0), 0);
        return [
          { label: 'Total Revenue', value: '₹' + fmtRs(tot), color: '#22c55e' },
          { label: 'Months',        value: raw.length, color: '#a78bfa' },
          { label: 'Avg / Month',   value: raw.length ? '₹' + fmtRs(Math.round(tot / raw.length)) : '—', color: '#f59e0b' },
          { label: 'Filtered',      value: fil, color: '#60a5fa' },
        ];
      }
      default: return [];
    }
  }, [raw, filtered, section, revExtra]);

  // ── Quick date shortcuts ──────────────────────────────────────────────────
  const setQuickDate = (days: number) => {
    const from = new Date();
    from.setDate(from.getDate() - days);
    setDateFrom(from.toISOString().slice(0, 10));
    setDateTo(todayStr());
  };

  const clearFilters = () => { setDateFrom(''); setDateTo(''); setSearch(''); setStatusF('all'); setTypeF('all'); };
  const hasFilters   = !!(dateFrom || dateTo || search || statusF !== 'all' || typeF !== 'all');

  const PREVIEW_CAP = 200;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div className="adm-sh" style={{ marginBottom: 22 }}>
        <div>
          <h2>Reports & Exports</h2>
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
            Fetch and download data from any section · CSV (Excel-ready with UTF-8) · JSON
          </div>
        </div>
        <div style={{ background: '#1e1b4b', border: '1px solid #312e81', borderRadius: 10, padding: '8px 16px', fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>
          📅 {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: 18, alignItems: 'start' }}>

        {/* ── Section sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, position: 'sticky', top: 16 }}>
          <div style={{ color: '#475569', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingLeft: 2 }}>
            Report Sections
          </div>
          {SECTIONS.map(s => {
            const active  = section === s.key;
            const loaded  = cache[s.key] != null;
            return (
              <button key={s.key}
                onClick={() => { setSection(s.key); clearFilters(); }}
                style={{
                  background:   active ? 'linear-gradient(135deg,rgba(124,58,237,0.22),rgba(124,58,237,0.08))' : 'transparent',
                  border:       active ? '1.5px solid rgba(124,58,237,0.45)' : '1.5px solid transparent',
                  borderRadius: 10, padding: '9px 12px', cursor: 'pointer',
                  display:      'flex', alignItems: 'flex-start', gap: 10,
                  textAlign:    'left', width: '100%', transition: 'all 0.15s',
                }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: active ? '#c4b5fd' : '#cbd5e1', fontWeight: 700, fontSize: 13 }}>{s.label}</div>
                  {loaded
                    ? <div style={{ color: '#22c55e', fontSize: 10, fontWeight: 700, marginTop: 2 }}>✓ {cache[s.key]!.length} records loaded</div>
                    : <div style={{ color: '#475569', fontSize: 10, marginTop: 2 }}>{s.desc}</div>
                  }
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Main panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>

          {/* Section banner */}
          <div style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(124,58,237,0.05))', border: '1.5px solid rgba(124,58,237,0.2)', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 30 }}>{sec.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 16 }}>{sec.label} Report</div>
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                {sec.desc} · <span style={{ color: '#7c3aed' }}>{cols.length} columns</span>
              </div>
            </div>
            {raw && (
              <div style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8, padding: '6px 14px', fontSize: 13, color: '#c4b5fd', fontWeight: 700 }}>
                {raw.length} total records
              </div>
            )}
          </div>

          {/* ── Filters card ── */}
          <div style={{ background: '#13103a', border: '1.5px solid #1e1b4b', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>
              🔍 Filters
            </div>

            {/* Filter grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Date From</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Date To</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inp} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Search</label>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, email, title…" style={inp} />
              </div>
              {statusOpts.length > 0 && (
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Status</label>
                  <select value={statusF} onChange={e => setStatusF(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="all">All Statuses</option>
                    {statusOpts.map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
              )}
              {['courses', 'live', 'sessions'].includes(section) && (
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Type</label>
                  <select value={typeF} onChange={e => setTypeF(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="all">All Types</option>
                    {section === 'courses' && <><option value="course">Courses</option><option value="program">Programs</option></>}
                    {section === 'live'    && <><option value="free">Free Live</option><option value="course">Course Live</option><option value="1on1">1:1 Session</option></>}
                    {section === 'sessions' && <><option value="private">Private</option><option value="free_call">Free Call</option></>}
                  </select>
                </div>
              )}
            </div>

            {/* Quick date chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              <span style={{ color: '#475569', fontSize: 11, alignSelf: 'center', marginRight: 2 }}>Quick:</span>
              {[
                { label: 'Today',        days: 0 },
                { label: 'Last 7 days',  days: 7 },
                { label: 'Last 30 days', days: 30 },
                { label: 'Last 90 days', days: 90 },
                { label: 'This year',    days: 365 },
                { label: 'All time',     days: -1 },
              ].map(({ label, days }) => (
                <button key={label}
                  onClick={() => days === -1 ? clearFilters() : setQuickDate(days)}
                  style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {label}
                </button>
              ))}
              {hasFilters && (
                <button onClick={clearFilters}
                  style={{ background: 'transparent', color: '#64748b', border: '1px solid #1e1b4b', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', marginLeft: 4 }}>
                  ✕ Clear
                </button>
              )}
            </div>

            {/* Load button + record count */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={loadData} disabled={loading}
                style={{ background: loading ? '#374151' : '#7c3aed', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {loading
                  ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'adm-spin 0.7s linear infinite' }} />Loading…</>
                  : raw ? '🔄 Reload Data' : '⬇ Load Data'
                }
              </button>
              {raw && !loading && (
                <span style={{ color: '#94a3b8', fontSize: 13 }}>
                  {filtered.length === raw.length
                    ? <><span style={{ color: '#e2e8f0', fontWeight: 700 }}>{raw.length}</span> records</>
                    : <><span style={{ color: '#f59e0b', fontWeight: 700 }}>{filtered.length}</span> of <span style={{ color: '#94a3b8' }}>{raw.length}</span> after filters</>
                  }
                </span>
              )}
            </div>

            {loadErr && (
              <div style={{ marginTop: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '8px 12px', color: '#f87171', fontSize: 12 }}>
                ⚠ {loadErr}
              </div>
            )}
          </div>

          {/* ── Summary stats ── */}
          {raw && stats.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: 10 }}>
              {stats.map(s => (
                <div key={s.label} style={{ background: '#13103a', border: '1.5px solid #1e1b4b', borderRadius: 12, padding: '12px 16px' }}>
                  <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 5, letterSpacing: 0.5 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Export card ── */}
          {raw && filtered.length > 0 && (
            <div style={{ background: '#0f172a', border: '1.5px solid #1e293b', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ fontWeight: 700, fontSize: 11, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
                📥 Export {filtered.length} records
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
                <button onClick={() => runCSV(filtered, cols, section)}
                  style={{ background: 'linear-gradient(135deg,#15803d,#166534)', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📊 Download CSV
                  <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '1px 8px', fontSize: 11 }}>{filtered.length}</span>
                </button>
                <button onClick={() => runJSON(filtered, cols, section)}
                  style={{ background: 'linear-gradient(135deg,#1d4ed8,#1e3a8a)', color: '#fff', border: 'none', borderRadius: 9, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📋 Download JSON
                  <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '1px 8px', fontSize: 11 }}>{filtered.length}</span>
                </button>
                <div style={{ color: '#475569', fontSize: 12 }}>
                  ✓ CSV opens in Excel · UTF-8 BOM · Indian Rupee compatible
                </div>
              </div>

              {/* Revenue extra exports */}
              {section === 'revenue' && revExtra && (
                <div style={{ background: '#13103a', borderRadius: 10, border: '1px solid #1e1b4b', padding: '12px 14px' }}>
                  <div style={{ color: '#64748b', fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Additional Revenue Exports</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {revExtra.byType?.length > 0 && <>
                      <button onClick={() => runCSV(revExtra.byType, [{ header: 'Type', get: r => r.type }, { header: 'Revenue (₹)', get: r => fmtRs(r.revenuePaise) }], 'revenue-by-type')}
                        style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>📊 By Type CSV</button>
                      <button onClick={() => runJSON(revExtra.byType, [{ header: 'Type', get: r => r.type }, { header: 'Revenue (₹)', get: r => fmtRs(r.revenuePaise) }], 'revenue-by-type')}
                        style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>📋 By Type JSON</button>
                    </>}
                    {revExtra.topCourses?.length > 0 && <>
                      <button onClick={() => runCSV(revExtra.topCourses, [{ header: 'Course', get: r => r.title }, { header: 'Revenue (₹)', get: r => fmtRs(r.revenuePaise) }, { header: 'Enrollments', get: r => r.enrollments }], 'top-courses')}
                        style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>📊 Top Courses CSV</button>
                      <button onClick={() => runJSON(revExtra.topCourses, [{ header: 'Course', get: r => r.title }, { header: 'Revenue (₹)', get: r => fmtRs(r.revenuePaise) }, { header: 'Enrollments', get: r => r.enrollments }], 'top-courses')}
                        style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>📋 Top Courses JSON</button>
                    </>}
                  </div>
                </div>
              )}

              <div style={{ color: '#334155', fontSize: 11, marginTop: 12 }}>
                Filename: <code style={{ color: '#7c3aed', background: '#0f0c2e', padding: '1px 6px', borderRadius: 4 }}>bsh-{section}-{todayStr()}.csv</code>
              </div>
            </div>
          )}

          {/* ── Preview table ── */}
          {raw && (
            <div style={{ background: '#13103a', border: '1.5px solid #1e1b4b', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid #1e1b4b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>
                  {filtered.length === 0 ? 'No matching records' : `Preview — ${Math.min(filtered.length, PREVIEW_CAP)} of ${filtered.length}`}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  {filtered.length > PREVIEW_CAP && (
                    <span style={{ color: '#64748b', fontSize: 12 }}>First {PREVIEW_CAP} shown · download to get all</span>
                  )}
                  {filtered.length === 0 && raw.length > 0 && (
                    <span style={{ color: '#f59e0b', fontSize: 12 }}>No records match current filters</span>
                  )}
                </div>
              </div>

              {filtered.length > 0 && (
                <div style={{ overflowX: 'auto', maxHeight: 520, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#0f0c2e', position: 'sticky', top: 0, zIndex: 1 }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569', fontSize: 10, fontWeight: 700, borderBottom: '1.5px solid #1e1b4b', whiteSpace: 'nowrap', minWidth: 36 }}>#</th>
                        {cols.map((col, i) => (
                          <th key={i} style={{ padding: '8px 14px', textAlign: 'left', color: '#7c3aed', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap', borderBottom: '1.5px solid #1e1b4b' }}>
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.slice(0, PREVIEW_CAP).map((row, ri) => (
                        <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)' }}>
                          <td style={{ padding: '6px 12px', color: '#334155', fontSize: 11 }}>{ri + 1}</td>
                          {cols.map((col, ci) => {
                            const val = String(col.get(row) ?? '');
                            const isPositive = ['Yes','Active','Published','approved','completed','live','scheduled'].includes(val);
                            const isNegative = ['No','Suspended','Paused','rejected','cancelled','pending_approval'].includes(val);
                            return (
                              <td key={ci} style={{ padding: '6px 14px', color: isPositive ? '#4ade80' : isNegative ? '#f87171' : '#94a3b8', whiteSpace: 'nowrap', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isPositive || isNegative ? 600 : 400 }}>
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Empty state ── */}
          {!raw && !loading && (
            <div style={{ background: '#13103a', border: '1.5px solid #1e1b4b', borderRadius: 14, padding: '56px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>{sec.icon}</div>
              <div style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 17, marginBottom: 8 }}>Load {sec.label} Report</div>
              <div style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>{sec.desc}</div>
              <div style={{ color: '#475569', fontSize: 12, marginBottom: 22 }}>
                {cols.length} columns · CSV + JSON export · date range & status filters
              </div>
              <button onClick={loadData}
                style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 30px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                ⬇ Load Data
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminReports;
