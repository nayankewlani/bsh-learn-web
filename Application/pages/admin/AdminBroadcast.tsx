import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  adminBroadcast, adminGetBroadcasts, adminCancelBroadcast, adminCheckReceipts,
  adminBroadcastAudience, adminBroadcastOptions,
  BroadcastCampaign, BroadcastPayload, DeepLinkType,
} from '../../api/admin';

// ── Types ──────────────────────────────────────────────────────────────────────

type AudienceType = 'all' | 'students' | 'educators' | 'program' | 'course' | 'live_class';

interface AudienceOption { id: string; label: string }
interface BroadcastOptions {
  programs: AudienceOption[];
  courses:  AudienceOption[];
  liveClasses: AudienceOption[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

const AUDIENCE_GROUPS: { type: AudienceType; icon: string; label: string; desc: string; needsId?: boolean }[] = [
  { type: 'all',        icon: '🌍', label: 'All Users',           desc: 'Every student & educator on the platform' },
  { type: 'students',   icon: '👨‍🎓', label: 'Students Only',       desc: 'Enrolled students across all courses' },
  { type: 'educators',  icon: '👩‍🏫', label: 'Trainers Only',       desc: 'All educators and healers' },
  { type: 'program',    icon: '🔮', label: 'Program Participants', desc: 'Users enrolled in a specific program (e.g. Hypnosis 2.0)', needsId: true },
  { type: 'course',     icon: '📚', label: 'Course Enrollees',    desc: 'Users enrolled in a specific course', needsId: true },
  { type: 'live_class', icon: '🔴', label: 'Live Class Attendees', desc: 'Users registered for a specific live class', needsId: true },
];

const DEEP_LINK_OPTIONS: { type: DeepLinkType; icon: string; label: string; needsId?: boolean; idLabel?: string; idPlaceholder?: string }[] = [
  { type: 'none',         icon: '—',  label: 'No link (open app)' },
  { type: 'home',         icon: '🏠', label: 'Home screen' },
  { type: 'explore',      icon: '🔍', label: 'Explore / Courses' },
  { type: 'live_tab',     icon: '🔴', label: 'Live Classes tab' },
  { type: 'consultation', icon: '🩺', label: 'Consultation tab' },
  { type: 'store',        icon: '🛍', label: 'Store' },
  { type: 'dashboard',    icon: '📊', label: 'Dashboard' },
  { type: 'course',       icon: '📚', label: 'Specific Course',    needsId: true, idLabel: 'Course ID', idPlaceholder: 'e.g. 64b7f2…' },
  { type: 'program',      icon: '🔮', label: 'Specific Program',   needsId: true, idLabel: 'Program slug', idPlaceholder: 'e.g. hypnosis-2' },
  { type: 'live_room',    icon: '🎥', label: 'Live Room',          needsId: true, idLabel: 'Class ID', idPlaceholder: 'e.g. 65a3c1…' },
  { type: 'educator',     icon: '👤', label: 'Educator Profile',   needsId: true, idLabel: 'Educator slug', idPlaceholder: 'e.g. dr-sharma' },
  { type: 'custom_url',   icon: '🔗', label: 'Custom URL',         needsId: true, idLabel: 'Full URL', idPlaceholder: 'https://…' },
];

const AUDIENCE_COLORS: Record<AudienceType, string> = {
  all:        '#7c3aed',
  students:   '#0891b2',
  educators:  '#0d9488',
  program:    '#9333ea',
  course:     '#2563eb',
  live_class: '#dc2626',
};

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  sent:      { bg: 'rgba(34,197,94,0.1)',   color: '#22c55e', label: '✓ Sent' },
  scheduled: { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', label: '⏰ Scheduled' },
  cancelled: { bg: 'rgba(100,116,139,0.1)', color: '#64748b', label: '✕ Cancelled' },
};

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

// Minimum datetime-local value = now (prevent scheduling in the past)
const nowInputValue = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
};

// ── Main Component ─────────────────────────────────────────────────────────────

const AdminBroadcast: React.FC = () => {

  // ── Compose state ─────────────────────────────────────────────────────────
  const [title,         setTitle]         = useState('');
  const [body,          setBody]          = useState('');
  const [imageUrl,      setImageUrl]      = useState('');
  const [audienceType,  setAudienceType]  = useState<AudienceType>('all');
  const [audienceId,    setAudienceId]    = useState('');
  const [deepLinkType,  setDeepLinkType]  = useState<DeepLinkType>('none');
  const [deepLinkId,    setDeepLinkId]    = useState('');
  const [isScheduled,   setIsScheduled]   = useState(false);
  const [scheduledAt,   setScheduledAt]   = useState('');

  // ── Audience preview ──────────────────────────────────────────────────────
  const [audienceCount,     setAudienceCount]     = useState<number | null>(null);
  const [audiencePushCount, setAudiencePushCount] = useState<number>(0);
  const [audienceLabel,     setAudienceLabel]     = useState('All Users');
  const [previewLoading,    setPreviewLoading]    = useState(false);
  const previewDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Options for dropdowns ─────────────────────────────────────────────────
  const [options,       setOptions]       = useState<BroadcastOptions>({ programs: [], courses: [], liveClasses: [] });
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  // ── Send state ────────────────────────────────────────────────────────────
  const [sending, setSending] = useState(false);
  const [result,  setResult]  = useState<{ ok: boolean; msg: string } | null>(null);

  // ── History ───────────────────────────────────────────────────────────────
  const [history,     setHistory]     = useState<BroadcastCampaign[]>([]);
  const [histLoading, setHistLoading] = useState(true);
  const [receiptsChecking, setReceiptsChecking] = useState<Record<string, boolean>>({});

  // ── Tab ───────────────────────────────────────────────────────────────────
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
    previewDebounce.current = setTimeout(() => fetchPreview(audienceType, audienceId), 350);
    return () => { if (previewDebounce.current) clearTimeout(previewDebounce.current); };
  }, [audienceType, audienceId, fetchPreview]);

  const handleTypeChange = (t: AudienceType) => { setAudienceType(t); setAudienceId(''); };

  // ── Send / Schedule ────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setResult({ ok: false, msg: 'Title and message are required.' });
      return;
    }
    const audienceGroup = AUDIENCE_GROUPS.find(g => g.type === audienceType)!;
    if (audienceGroup.needsId && !audienceId) {
      setResult({ ok: false, msg: 'Please select a specific audience target.' });
      return;
    }
    const dlOption = DEEP_LINK_OPTIONS.find(d => d.type === deepLinkType)!;
    if (dlOption.needsId && !deepLinkId.trim()) {
      setResult({ ok: false, msg: `Please enter the ${dlOption.idLabel} for the selected link target.` });
      return;
    }
    if (isScheduled && !scheduledAt) {
      setResult({ ok: false, msg: 'Please pick a date and time to schedule.' });
      return;
    }

    setSending(true);
    setResult(null);
    try {
      const payload: BroadcastPayload = {
        title:        title.trim(),
        body:         body.trim(),
        imageUrl:     imageUrl.trim() || undefined,
        deepLinkType: deepLinkType !== 'none' ? deepLinkType : 'none',
        deepLinkId:   deepLinkId.trim() || undefined,
        audienceType,
        audienceId:   audienceId || undefined,
        scheduledAt:  isScheduled ? scheduledAt : null,
      };
      const res  = await adminBroadcast(payload);
      const d    = res.data;

      if (d.scheduled) {
        setResult({ ok: true, msg: `Campaign scheduled for ${fmtDate(d.scheduledAt)} — ${audienceLabel}` });
      } else {
        const count = audienceCount ?? 0;
        setResult({ ok: true, msg: `Sent to ${count.toLocaleString()} user${count !== 1 ? 's' : ''} · ${audiencePushCount} mobile push` });
      }

      setTitle(''); setBody(''); setImageUrl(''); setDeepLinkId('');
      setDeepLinkType('none'); setIsScheduled(false); setScheduledAt('');
      loadHistory();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to send.';
      setResult({ ok: false, msg });
    } finally {
      setSending(false);
    }
  };

  // ── Cancel scheduled campaign ──────────────────────────────────────────────

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this scheduled campaign?')) return;
    try {
      await adminCancelBroadcast(id);
      setHistory(h => h.map(b => b._id === id ? { ...b, status: 'cancelled' } : b));
    } catch { alert('Failed to cancel.'); }
  };

  // ── Check Expo receipts ────────────────────────────────────────────────────

  const handleCheckReceipts = async (id: string) => {
    setReceiptsChecking(s => ({ ...s, [id]: true }));
    try {
      const res = await adminCheckReceipts(id);
      const { deliveredCount } = res.data;
      setHistory(h => h.map(b => b._id === id ? { ...b, deliveredCount } : b));
    } catch { alert('Failed to check receipts.'); }
    finally { setReceiptsChecking(s => ({ ...s, [id]: false })); }
  };

  // ── Derived values ─────────────────────────────────────────────────────────

  const selectedGroup = AUDIENCE_GROUPS.find(g => g.type === audienceType)!;
  const accentColor   = AUDIENCE_COLORS[audienceType];
  const dlOption      = DEEP_LINK_OPTIONS.find(d => d.type === deepLinkType)!;

  const idOptions: AudienceOption[] = audienceType === 'program'
    ? options.programs
    : audienceType === 'course'
      ? options.courses
      : audienceType === 'live_class'
        ? options.liveClasses
        : [];

  const pendingCount = history.filter(b => b.status === 'scheduled').length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: '#e2e8f0' }}>📣 Push Notifications</h2>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
          Send in-app + mobile push notifications. Schedule future campaigns. Track delivery and opens.
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid #1e293b' }}>
        {(['compose', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '9px 22px', background: 'none', border: 'none', borderBottom: tab === t ? `2.5px solid ${accentColor}` : '2.5px solid transparent', color: tab === t ? '#e2e8f0' : '#64748b', fontWeight: tab === t ? 700 : 500, fontSize: 13, cursor: 'pointer', marginBottom: -1 }}>
            {t === 'compose' ? '✍️ Compose' : `📋 History${pendingCount > 0 ? ` · ${pendingCount} scheduled` : ` (${history.length})`}`}
          </button>
        ))}
      </div>

      {/* ── COMPOSE TAB ────────────────────────────────────────────── */}
      {tab === 'compose' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

          {/* Left: form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ① Audience */}
            <div style={sectionCard}>
              <div style={sectionTitle}>🎯 Target Audience</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
                {AUDIENCE_GROUPS.map(g => {
                  const active = audienceType === g.type;
                  const color  = AUDIENCE_COLORS[g.type];
                  return (
                    <button key={g.type} onClick={() => handleTypeChange(g.type)}
                      style={{ padding: '10px 8px', borderRadius: 10, border: `1.5px solid ${active ? color : '#1e3a5f'}`, background: active ? `${color}18` : 'transparent', color: active ? color : '#64748b', cursor: 'pointer', fontSize: 11, fontWeight: active ? 700 : 500, textAlign: 'center', transition: 'all 0.15s' }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{g.icon}</div>
                      <div style={{ lineHeight: 1.3 }}>{g.label}</div>
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', background: '#0f172a', borderRadius: 8, padding: '7px 11px', marginBottom: selectedGroup.needsId ? 12 : 0 }}>
                {selectedGroup.desc}
              </div>
              {selectedGroup.needsId && (
                <div>
                  <label style={lbl}>{audienceType === 'program' ? 'Select Program' : audienceType === 'course' ? 'Select Course' : 'Select Live Class'}</label>
                  {!optionsLoaded ? (
                    <div style={{ color: '#64748b', fontSize: 12, padding: '8px 0' }}>Loading…</div>
                  ) : (
                    <select value={audienceId} onChange={e => setAudienceId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="">— Choose one —</option>
                      {idOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* ② Message */}
            <div style={sectionCard}>
              <div style={sectionTitle}>✍️ Message</div>

              <div style={{ marginBottom: 16, position: 'relative' }}>
                <label style={lbl}>Title <span style={{ color: '#f87171' }}>*</span></label>
                <input style={inputStyle} placeholder="e.g. 🔔 Hypnosis 2.0 – Class Starting Today" value={title} onChange={e => setTitle(e.target.value)} maxLength={120} />
                <span style={charCount}>{title.length}/120</span>
              </div>

              <div style={{ marginBottom: 16, position: 'relative' }}>
                <label style={lbl}>Message <span style={{ color: '#f87171' }}>*</span></label>
                <textarea style={{ ...inputStyle, height: 90, resize: 'vertical' }} placeholder="Your Hypnosis 2.0 session starts at 8:00 PM today. Join the class on time." value={body} onChange={e => setBody(e.target.value)} maxLength={300} />
                <span style={{ ...charCount, bottom: -16 }}>{body.length}/300</span>
              </div>

              <div style={{ marginBottom: 0, position: 'relative' }}>
                <label style={lbl}>Notification Image <span style={{ color: '#475569', fontWeight: 400 }}>(optional)</span></label>
                <input style={inputStyle} placeholder="https://cdn.bshhealers.com/images/promo.jpg" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
                {imageUrl && (
                  <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', maxHeight: 80, background: '#0f172a' }}>
                    <img src={imageUrl} alt="preview" style={{ width: '100%', maxHeight: 80, objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
              </div>
            </div>

            {/* ③ Deep Link */}
            <div style={sectionCard}>
              <div style={sectionTitle}>🔗 Tap Action (Deep Link)</div>
              <label style={lbl}>Where should the app open when users tap?</label>
              <select value={deepLinkType} onChange={e => { setDeepLinkType(e.target.value as DeepLinkType); setDeepLinkId(''); }} style={{ ...inputStyle, cursor: 'pointer', marginBottom: dlOption.needsId ? 12 : 0 }}>
                {DEEP_LINK_OPTIONS.map(d => (
                  <option key={d.type} value={d.type}>{d.icon} {d.label}</option>
                ))}
              </select>
              {dlOption.needsId && (
                <div>
                  <label style={lbl}>{dlOption.idLabel}</label>
                  <input style={inputStyle} placeholder={dlOption.idPlaceholder} value={deepLinkId} onChange={e => setDeepLinkId(e.target.value)} />
                </div>
              )}
            </div>

            {/* ④ Schedule */}
            <div style={sectionCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isScheduled ? 14 : 0 }}>
                <div style={sectionTitle} >⏰ Schedule</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <div style={{ position: 'relative', width: 40, height: 22 }}>
                    <input type="checkbox" checked={isScheduled} onChange={e => { setIsScheduled(e.target.checked); if (!e.target.checked) setScheduledAt(''); }} style={{ opacity: 0, width: 0, height: 0 }} />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: isScheduled ? accentColor : '#334155', borderRadius: 22, transition: 'background 0.2s' }} />
                    <div style={{ position: 'absolute', top: 3, left: isScheduled ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </div>
                  <span style={{ fontSize: 12, color: isScheduled ? accentColor : '#64748b' }}>{isScheduled ? 'Scheduled' : 'Send now'}</span>
                </label>
              </div>
              {isScheduled && (
                <div>
                  <label style={lbl}>Date &amp; Time</label>
                  <input type="datetime-local" min={nowInputValue()} value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                    style={{ ...inputStyle, colorScheme: 'dark' }} />
                  {scheduledAt && (
                    <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 6 }}>
                      ⏰ Will send at {fmtDate(new Date(scheduledAt).toISOString())}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Result */}
            {result && (
              <div style={{ background: result.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${result.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, color: result.ok ? '#22c55e' : '#f87171', borderRadius: 10, padding: '12px 14px', fontSize: 13 }}>
                {result.ok ? '✅ ' : '⚠️ '}{result.msg}
              </div>
            )}

            {/* Send button */}
            <button onClick={handleSend} disabled={sending || (selectedGroup.needsId && !audienceId)}
              style={{ background: sending || (selectedGroup.needsId && !audienceId) ? '#334155' : `linear-gradient(90deg,${accentColor},${accentColor}cc)`, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 800, cursor: sending || (selectedGroup.needsId && !audienceId) ? 'not-allowed' : 'pointer', transition: 'all 0.2s', width: '100%' }}>
              {sending
                ? (isScheduled ? 'Scheduling…' : 'Sending…')
                : isScheduled
                  ? '⏰ Schedule Campaign'
                  : audienceCount !== null
                    ? `📣 Send to ${audienceCount.toLocaleString()} User${audienceCount !== 1 ? 's' : ''}`
                    : '📣 Send Now'}
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
                    <div style={{ fontSize: 40, fontWeight: 900, color: accentColor, lineHeight: 1 }}>{audienceCount.toLocaleString()}</div>
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
                  <div style={{ marginTop: 10, fontSize: 11, color: '#475569', textAlign: 'center' }}>{audienceLabel}</div>
                  {audiencePushCount < audienceCount && (
                    <div style={{ marginTop: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#fbbf24' }}>
                      💡 {(audienceCount - audiencePushCount).toLocaleString()} users get in-app only (no mobile app)
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Phone preview */}
            {(title || body) && (
              <div style={sectionCard}>
                <div style={sectionTitle}>📱 Preview</div>
                <div style={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 14, padding: '12px 14px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
                  {imageUrl && (
                    <div style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 10, maxHeight: 70 }}>
                      <img src={imageUrl} alt="" style={{ width: '100%', maxHeight: 70, objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: `${accentColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🧠</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', marginBottom: 1 }}>{title || 'Notification Title'}</div>
                      <div style={{ fontSize: 9, color: '#64748b' }}>BSH Healers · now</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>{body || 'Message text will appear here…'}</div>
                  {deepLinkType !== 'none' && (
                    <div style={{ marginTop: 6, fontSize: 10, color: accentColor }}>
                      {dlOption.icon} Opens: {dlOption.label}{deepLinkId ? ` → ${deepLinkId}` : ''}
                    </div>
                  )}
                  {isScheduled && scheduledAt && (
                    <div style={{ marginTop: 4, fontSize: 9, color: '#f59e0b' }}>⏰ Sends at {fmtDate(new Date(scheduledAt).toISOString())}</div>
                  )}
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13 }}>{selectedGroup.icon}</span>
                  <span style={{ fontSize: 11, color: accentColor, fontWeight: 700 }}>{selectedGroup.label}</span>
                </div>
              </div>
            )}

            {/* Tips */}
            <div style={{ ...sectionCard, background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>💡 Best Practices</div>
              <ul style={{ margin: 0, padding: '0 0 0 14px', fontSize: 11, color: '#64748b', lineHeight: 1.9 }}>
                <li>Keep titles under <strong style={{ color: '#94a3b8' }}>60 chars</strong> for full display</li>
                <li>Images boost engagement — use 1200×628px</li>
                <li>Deep links reduce friction — always set one</li>
                <li>Schedule during peak hours (7-9pm IST)</li>
                <li>Program targeting = highest intent audience</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ────────────────────────────────────────────── */}
      {tab === 'history' && (
        <div style={sectionCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ ...sectionTitle, marginBottom: 0 }}>📋 Campaign History</div>
            <button onClick={loadHistory} style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}>↻ Refresh</button>
          </div>

          {histLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading…</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569', fontSize: 14 }}>No campaigns yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.map(b => {
                const aType  = (b.audienceType || 'all') as AudienceType;
                const color  = AUDIENCE_COLORS[aType] || '#7c3aed';
                const group  = AUDIENCE_GROUPS.find(g => g.type === aType);
                const status = STATUS_BADGE[b.status] || STATUS_BADGE.sent;
                const dlOpt  = DEEP_LINK_OPTIONS.find(d => d.type === b.deepLinkType);
                const isChecking = receiptsChecking[b._id];
                return (
                  <div key={b._id} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
                      <div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0' }}>{b.title}</span>
                          <span style={{ background: status.bg, color: status.color, borderRadius: 50, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>{status.label}</span>
                          <span style={{ background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: 50, padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>
                            {group?.icon} {b.audienceLabel || group?.label || b.audienceType}
                          </span>
                          {dlOpt && b.deepLinkType !== 'none' && (
                            <span style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 50, padding: '1px 8px', fontSize: 10 }}>
                              {dlOpt.icon} {dlOpt.label}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, lineHeight: 1.4 }}>{b.body}</div>
                        {b.imageUrl && (
                          <div style={{ borderRadius: 6, overflow: 'hidden', width: 80, height: 45, marginBottom: 6 }}>
                            <img src={b.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                          {b.sentBy?.name || 'Admin'} · {b.status === 'scheduled' ? `Scheduled for ${fmtDate(b.scheduledAt)}` : fmtDate(b.createdAt)}
                        </div>
                      </div>

                      {/* Stats column */}
                      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 90 }}>
                        {b.status === 'sent' && (
                          <>
                            <StatRow value={b.recipientCount} label="sent" color={color} big />
                            {b.pushCount > 0 && <StatRow value={b.pushCount} label="📱 push" color="#f59e0b" />}
                            {b.deliveredCount > 0 && <StatRow value={b.deliveredCount} label="✓ delivered" color="#22c55e" />}
                            {b.openedCount > 0 && <StatRow value={b.openedCount} label="👆 opened" color="#60a5fa" />}
                          </>
                        )}
                        {b.status === 'scheduled' && b.scheduledAt && (
                          <div style={{ fontSize: 11, color: '#f59e0b', textAlign: 'right' }}>
                            {fmtDate(b.scheduledAt)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                      {b.status === 'scheduled' && (
                        <button onClick={() => handleCancel(b._id)}
                          style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#f87171', cursor: 'pointer' }}>
                          ✕ Cancel
                        </button>
                      )}
                      {b.status === 'sent' && b.pushCount > 0 && (
                        <button onClick={() => handleCheckReceipts(b._id)} disabled={isChecking}
                          style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: isChecking ? 'not-allowed' : 'pointer' }}>
                          {isChecking ? '…' : '↻ Check delivery'}
                        </button>
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

// ── Stat row helper ────────────────────────────────────────────────────────────

const StatRow: React.FC<{ value: number; label: string; color: string; big?: boolean }> = ({ value, label, color, big }) => (
  <div style={{ marginBottom: 3 }}>
    <span style={{ fontSize: big ? 20 : 14, fontWeight: 800, color }}>{value.toLocaleString()}</span>
    {' '}
    <span style={{ fontSize: 10, color: '#64748b' }}>{label}</span>
  </div>
);

// ── Shared styles ──────────────────────────────────────────────────────────────

const sectionCard: React.CSSProperties = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 14,
  padding: '18px 20px',
};

const sectionTitle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 12,
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
