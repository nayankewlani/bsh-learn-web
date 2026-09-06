import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  adminBroadcast, adminGetBroadcasts,
  adminBroadcastAudience, adminBroadcastOptions,
} from '../../api/admin';

// ── Types ──────────────────────────────────────────────────────────────────────

type AudienceType = 'all' | 'students' | 'educators' | 'program' | 'course' | 'live_class';

interface AudienceOption { id: string; label: string }
interface BroadcastOptions {
  programs: AudienceOption[];
  courses:  AudienceOption[];
  liveClasses: AudienceOption[];
}

interface Broadcast {
  _id: string;
  title: string;
  body: string;
  link?: string;
  recipientCount: number;
  pushCount?: number;
  audienceType?: string;
  audienceLabel?: string;
  createdAt: string;
  sentBy?: { name: string };
}

// ── Constants ──────────────────────────────────────────────────────────────────

const AUDIENCE_GROUPS: { type: AudienceType; icon: string; label: string; desc: string; needsId?: boolean }[] = [
  { type: 'all',        icon: '🌍', label: 'All Users',          desc: 'Every student & educator on the platform' },
  { type: 'students',   icon: '👨‍🎓', label: 'Students Only',      desc: 'Enrolled students across all courses' },
  { type: 'educators',  icon: '👩‍🏫', label: 'Trainers Only',      desc: 'All educators and healers' },
  { type: 'program',    icon: '🔮', label: 'Program Participants', desc: 'Users enrolled in a specific program (e.g. Hypnosis 2.0)', needsId: true },
  { type: 'course',     icon: '📚', label: 'Course Enrollees',    desc: 'Users enrolled in a specific course', needsId: true },
  { type: 'live_class', icon: '🔴', label: 'Live Class Attendees', desc: 'Users registered for a specific live class', needsId: true },
];

const fmtDate = (d: string) =>
  new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const AUDIENCE_COLORS: Record<AudienceType, string> = {
  all:        '#7c3aed',
  students:   '#0891b2',
  educators:  '#0d9488',
  program:    '#9333ea',
  course:     '#2563eb',
  live_class: '#dc2626',
};

// ── Main Component ─────────────────────────────────────────────────────────────

const AdminBroadcast: React.FC = () => {
  // Compose state
  const [title,       setTitle]       = useState('');
  const [body,        setBody]        = useState('');
  const [link,        setLink]        = useState('');
  const [audienceType, setAudienceType] = useState<AudienceType>('all');
  const [audienceId,  setAudienceId]  = useState('');

  // Audience preview state
  const [audienceCount,     setAudienceCount]     = useState<number | null>(null);
  const [audiencePushCount, setAudiencePushCount] = useState<number>(0);
  const [audienceLabel,     setAudienceLabel]     = useState('All Users');
  const [previewLoading,    setPreviewLoading]    = useState(false);
  const previewDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Options for dropdowns
  const [options,       setOptions]       = useState<BroadcastOptions>({ programs: [], courses: [], liveClasses: [] });
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  // Send state
  const [sending,   setSending]   = useState(false);
  const [result,    setResult]    = useState<{ ok: boolean; msg: string; count?: number; push?: number } | null>(null);

  // History
  const [history,  setHistory]  = useState<Broadcast[]>([]);
  const [histLoading, setHistLoading] = useState(true);

  // Tab
  const [tab, setTab] = useState<'compose' | 'history'>('compose');

  // ── Load options & history ─────────────────────────────────────────────────

  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const res = await adminGetBroadcasts();
      setHistory(res.data.broadcasts ?? []);
    } catch { /* ignore */ }
    finally { setHistLoading(false); }
  }, []);

  useEffect(() => {
    loadHistory();
    adminBroadcastOptions().then(r => {
      setOptions(r.data);
      setOptionsLoaded(true);
    }).catch(() => setOptionsLoaded(true));
  }, [loadHistory]);

  // ── Audience preview (debounced) ───────────────────────────────────────────

  const fetchPreview = useCallback(async (type: AudienceType, id: string) => {
    const needsId = AUDIENCE_GROUPS.find(g => g.type === type)?.needsId;
    if (needsId && !id) { setAudienceCount(null); return; }
    setPreviewLoading(true);
    try {
      const res = await adminBroadcastAudience(type, id || undefined);
      setAudienceCount(res.data.count);
      setAudiencePushCount(res.data.pushCount ?? 0);
      setAudienceLabel(res.data.label ?? type);
    } catch {
      setAudienceCount(null);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (previewDebounce.current) clearTimeout(previewDebounce.current);
    previewDebounce.current = setTimeout(() => fetchPreview(audienceType, audienceId), 300);
    return () => { if (previewDebounce.current) clearTimeout(previewDebounce.current); };
  }, [audienceType, audienceId, fetchPreview]);

  // Reset id when switching type
  const handleTypeChange = (t: AudienceType) => {
    setAudienceType(t);
    setAudienceId('');
  };

  // ── Send ───────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setResult({ ok: false, msg: 'Title and message are required.' });
      return;
    }
    const needsId = AUDIENCE_GROUPS.find(g => g.type === audienceType)?.needsId;
    if (needsId && !audienceId) {
      setResult({ ok: false, msg: 'Please select a specific audience target.' });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await adminBroadcast({
        title: title.trim(),
        body:  body.trim(),
        link:  link.trim() || undefined,
        audienceType,
        audienceId: audienceId || undefined,
      });
      const d = res.data;
      setResult({ ok: true, msg: `Delivered to ${d.recipientCount} user${d.recipientCount !== 1 ? 's' : ''} (${d.pushCount} mobile push)`, count: d.recipientCount, push: d.pushCount });
      setTitle(''); setBody(''); setLink('');
      loadHistory();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to send broadcast.';
      setResult({ ok: false, msg });
    } finally {
      setSending(false);
    }
  };

  // ── Selected audience group ────────────────────────────────────────────────

  const selectedGroup = AUDIENCE_GROUPS.find(g => g.type === audienceType)!;
  const accentColor = AUDIENCE_COLORS[audienceType];

  // ── Dropdown options for the selected type ─────────────────────────────────

  const idOptions: AudienceOption[] = audienceType === 'program'
    ? options.programs
    : audienceType === 'course'
      ? options.courses
      : audienceType === 'live_class'
        ? options.liveClasses
        : [];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: '#e2e8f0' }}>📣 Broadcast</h2>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
          Send in-app + mobile push notifications to targeted groups.
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid #1e293b' }}>
        {(['compose', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '9px 22px', background: 'none', border: 'none', borderBottom: tab === t ? `2.5px solid ${accentColor}` : '2.5px solid transparent', color: tab === t ? '#e2e8f0' : '#64748b', fontWeight: tab === t ? 700 : 500, fontSize: 13, cursor: 'pointer', marginBottom: -1, textTransform: 'capitalize' }}>
            {t === 'compose' ? '✍️ Compose' : `📋 History (${history.length})`}
          </button>
        ))}
      </div>

      {/* ── COMPOSE TAB ────────────────────────────────────────────── */}
      {tab === 'compose' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

          {/* Left: compose form */}
          <div>
            {/* Audience selector */}
            <div style={sectionCard}>
              <div style={sectionTitle}>🎯 Target Audience</div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
                {AUDIENCE_GROUPS.map(g => {
                  const active = audienceType === g.type;
                  const color = AUDIENCE_COLORS[g.type];
                  return (
                    <button key={g.type} onClick={() => handleTypeChange(g.type)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 10,
                        border: `1.5px solid ${active ? color : '#1e3a5f'}`,
                        background: active ? `${color}18` : 'transparent',
                        color: active ? color : '#64748b',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: active ? 700 : 500,
                        textAlign: 'center',
                        transition: 'all 0.15s',
                      }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{g.icon}</div>
                      <div style={{ lineHeight: 1.3 }}>{g.label}</div>
                    </button>
                  );
                })}
              </div>

              {/* Description */}
              <div style={{ fontSize: 12, color: '#64748b', background: '#0f172a', borderRadius: 8, padding: '8px 12px', marginBottom: selectedGroup.needsId ? 12 : 0 }}>
                {selectedGroup.desc}
              </div>

              {/* Sub-selector (program / course / live_class) */}
              {selectedGroup.needsId && (
                <div>
                  <label style={lbl}>
                    {audienceType === 'program' ? 'Select Program' : audienceType === 'course' ? 'Select Course' : 'Select Live Class'}
                  </label>
                  {!optionsLoaded ? (
                    <div style={{ color: '#64748b', fontSize: 12, padding: '8px 0' }}>Loading…</div>
                  ) : (
                    <select
                      value={audienceId}
                      onChange={e => setAudienceId(e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="">— Choose one —</option>
                      {idOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Message form */}
            <div style={{ ...sectionCard, marginTop: 16 }}>
              <div style={sectionTitle}>✍️ Message</div>

              <div style={{ marginBottom: 16, position: 'relative' }}>
                <label style={lbl}>Title <span style={{ color: '#f87171' }}>*</span></label>
                <input
                  style={inputStyle}
                  placeholder="e.g. New free class available!"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={120}
                />
                <span style={charCount}>{title.length}/120</span>
              </div>

              <div style={{ marginBottom: 16, position: 'relative' }}>
                <label style={lbl}>Message <span style={{ color: '#f87171' }}>*</span></label>
                <textarea
                  style={{ ...inputStyle, height: 100, resize: 'vertical' }}
                  placeholder="Write your notification message…"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  maxLength={300}
                />
                <span style={{ ...charCount, bottom: -16 }}>{body.length}/300</span>
              </div>

              <div style={{ marginBottom: 8, position: 'relative' }}>
                <label style={lbl}>Deep Link / URL <span style={{ color: '#475569', fontWeight: 400 }}>(optional)</span></label>
                <input
                  style={inputStyle}
                  placeholder="e.g. /live-classes or https://…"
                  value={link}
                  onChange={e => setLink(e.target.value)}
                />
              </div>
            </div>

            {/* Result */}
            {result && (
              <div style={{ marginTop: 12, background: result.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${result.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, color: result.ok ? '#22c55e' : '#f87171', borderRadius: 10, padding: '12px 14px', fontSize: 13 }}>
                {result.ok ? '✅ ' : '⚠️ '}{result.msg}
              </div>
            )}

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={sending || (selectedGroup.needsId && !audienceId)}
              style={{
                marginTop: 16,
                width: '100%',
                background: sending || (selectedGroup.needsId && !audienceId)
                  ? '#334155'
                  : `linear-gradient(90deg,${accentColor},${accentColor}cc)`,
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '14px',
                fontSize: 15,
                fontWeight: 800,
                cursor: sending || (selectedGroup.needsId && !audienceId) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {sending
                ? 'Sending…'
                : audienceCount !== null
                  ? `📣 Send to ${audienceCount.toLocaleString()} User${audienceCount !== 1 ? 's' : ''}`
                  : '📣 Send Broadcast'}
            </button>
          </div>

          {/* Right: preview + audience stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Audience stats */}
            <div style={sectionCard}>
              <div style={sectionTitle}>👥 Audience Preview</div>

              {previewLoading ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b', fontSize: 13 }}>Calculating…</div>
              ) : audienceCount === null ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#475569', fontSize: 12 }}>
                  {selectedGroup.needsId ? 'Select a target to see count' : 'Loading…'}
                </div>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 40, fontWeight: 900, color: accentColor, lineHeight: 1 }}>
                      {audienceCount.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Total recipients</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#22c55e' }}>{audienceCount.toLocaleString()}</div>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>🔔 In-app</div>
                    </div>
                    <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#f59e0b' }}>{audiencePushCount.toLocaleString()}</div>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>📱 Mobile push</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, fontSize: 11, color: '#475569', textAlign: 'center' }}>
                    {audienceLabel}
                  </div>

                  {audiencePushCount < audienceCount && (
                    <div style={{ marginTop: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#fbbf24' }}>
                      💡 {audienceCount - audiencePushCount} users will receive in-app only (no mobile app installed)
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Notification preview */}
            {(title || body) && (
              <div style={sectionCard}>
                <div style={sectionTitle}>👁 Preview</div>
                {/* Mobile notification mockup */}
                <div style={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 14, padding: '12px 14px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: accentColor + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🧠</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', marginBottom: 1 }}>{title || 'Notification Title'}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>BSH Healers · now</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>{body || 'Message text will appear here…'}</div>
                  {link && <div style={{ fontSize: 10, color: accentColor, marginTop: 6 }}>🔗 {link}</div>}
                </div>

                {/* Audience badge */}
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{selectedGroup.icon}</span>
                  <span style={{ fontSize: 11, color: accentColor, fontWeight: 700 }}>{selectedGroup.label}</span>
                </div>
              </div>
            )}

            {/* Tips */}
            <div style={{ ...sectionCard, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>💡 Tips</div>
              <ul style={{ margin: 0, padding: '0 0 0 14px', fontSize: 11, color: '#64748b', lineHeight: 1.9 }}>
                <li>In-app notifications reach <strong style={{ color: '#94a3b8' }}>all users</strong> (web + mobile)</li>
                <li>Mobile push only goes to users with the app installed</li>
                <li>Keep titles under 60 chars for best display</li>
                <li>Use deep links like <code style={{ color: '#7c3aed', fontSize: 10 }}>/live-classes</code> to drive action</li>
                <li>Program targeting = most engaged users</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ────────────────────────────────────────────── */}
      {tab === 'history' && (
        <div style={sectionCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={sectionTitle}>📋 Broadcast History</div>
            <button onClick={loadHistory} style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}>↻ Refresh</button>
          </div>

          {histLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading…</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569', fontSize: 14 }}>No broadcasts sent yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.map(b => {
                const aType = (b.audienceType || 'all') as AudienceType;
                const color = AUDIENCE_COLORS[aType] || '#7c3aed';
                const group = AUDIENCE_GROUPS.find(g => g.type === aType);
                return (
                  <div key={b._id} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0' }}>{b.title}</span>
                        <span style={{ background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: 50, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>
                          {group?.icon} {b.audienceLabel || group?.label || b.audienceType || 'All'}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6, lineHeight: 1.4 }}>{b.body}</div>
                      {b.link && <div style={{ fontSize: 11, color: '#60a5fa' }}>🔗 {b.link}</div>}
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>
                        {b.sentBy?.name || 'Admin'} · {fmtDate(b.createdAt)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color }}>
                        {(b.recipientCount ?? 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>recipients</div>
                      {(b.pushCount ?? 0) > 0 && (
                        <div style={{ fontSize: 10, color: '#f59e0b' }}>📱 {b.pushCount} push</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Shared styles ──────────────────────────────────────────────────────────────

const sectionCard: React.CSSProperties = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 14,
  padding: '18px 20px',
};

const sectionTitle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 13,
  color: '#e2e8f0',
  marginBottom: 14,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
};

const lbl: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  marginBottom: 6,
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 8,
  padding: '10px 12px',
  color: '#e2e8f0',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const charCount: React.CSSProperties = {
  position: 'absolute',
  right: 10,
  bottom: -18,
  fontSize: 10,
  color: '#475569',
};

export default AdminBroadcast;
