import React, { useEffect, useState, useMemo, useRef } from 'react';
import type { AdminTrainer } from '../../api/admin';
import {
  adminGetTrainers, adminCreateTrainer, adminUpdateTrainerProfile,
  adminGenTrainerRazorpay, adminDeleteTrainer, adminGetEducatorApplications,
  adminApproveApplication, adminRejectApplication,
} from '../../api/admin';

// ── Constants ──────────────────────────────────────────────────────────────────

const SPECIALTIES_OPTIONS = [
  "Hypnotherapy","Shadow Work","NLP Coaching","Spiritual Healing",
  "Mind Wellness","Emotional Healing","Vastu Shastra","Autism Healing",
  "Corporate Training","Meditation","Past Life Regression","Reiki Healing",
  "Cognitive Behavioral Therapy","Sound Healing","Crystal Healing",
];

const LANGUAGE_OPTIONS = ["English","Hindi","Telugu","Tamil","Marathi","Bengali","Gujarati","Kannada","Malayalam","Punjabi"];

const SPECIALTY_COLORS: Record<string, string> = {
  "Hypnotherapy":              "#FF1E56",
  "Shadow Work":               "#0d9488",
  "NLP Coaching":              "#2563eb",
  "Spiritual Healing":         "#9333ea",
  "Mind Wellness":             "#be185d",
  "Emotional Healing":         "#db2777",
  "Vastu Shastra":             "#d97706",
  "Autism Healing":            "#059669",
  "Corporate Training":        "#1d4ed8",
  "Meditation":                "#8b5cf6",
  "Past Life Regression":      "#D4003F",
  "Reiki Healing":             "#0891b2",
  "Cognitive Behavioral Therapy": "#065f46",
  "Sound Healing":             "#92400e",
  "Crystal Healing":           "#9f1239",
};

const fmt = (p: number) => '₹' + (p / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Shared custom-specialty store (all ChipSelect instances share this) ──────

let _extraSpecialties: string[] = [];
const _specListeners = new Set<() => void>();

function addGlobalSpecialty(raw: string) {
  const s = raw.trim();
  if (!s || _extraSpecialties.includes(s) || SPECIALTIES_OPTIONS.includes(s)) return;
  _extraSpecialties = [..._extraSpecialties, s];
  _specListeners.forEach(fn => fn());
}

function useExtraSpecialties() {
  const [, tick] = useState(0);
  useEffect(() => {
    const fn = () => tick(n => n + 1);
    _specListeners.add(fn);
    return () => { _specListeners.delete(fn); };
  }, []);
  return _extraSpecialties;
}

// ── Image compression helper ───────────────────────────────────────────────────

const compressImage = (file: File, maxPx = 320, quality = 0.88): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = ev => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = ev.target!.result as string;
    };
    reader.readAsDataURL(file);
  });

// ── Drag-and-drop image upload zone ───────────────────────────────────────────

const ImageDropZone: React.FC<{
  value: string;
  onChange: (v: string) => void;
  size?: number;
  label?: string;
}> = ({ value, onChange, size = 80, label = 'Photo' }) => {
  const [drag, setDrag]       = useState(false);
  const [busy, setBusy]       = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setBusy(true);
    try { onChange(await compressImage(file)); }
    finally { setBusy(false); }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const initials = label.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Preview circle */}
        <div style={{ width: size, height: size, borderRadius: '50%', border: '2px solid #FF1E56', overflow: 'hidden', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.28, fontWeight: 800, color: '#FF1E56', flexShrink: 0 }}>
          {value
            ? <img src={value} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : initials || '?'}
        </div>

        <div style={{ flex: 1 }}>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            onClick={() => !busy && fileRef.current?.click()}
            style={{
              border: `2px dashed ${drag ? '#FF1E56' : '#334155'}`,
              borderRadius: 10,
              padding: '14px 10px',
              textAlign: 'center',
              cursor: busy ? 'wait' : 'pointer',
              background: drag ? 'rgba(255,30,86,0.08)' : '#0f172a',
              transition: 'all 0.15s',
              marginBottom: 8,
            }}>
            {busy ? (
              <span style={{ color: '#FF6B8A', fontSize: 12 }}>Compressing…</span>
            ) : drag ? (
              <span style={{ color: '#FF6B8A', fontSize: 12, fontWeight: 700 }}>Drop to upload</span>
            ) : (
              <>
                <div style={{ fontSize: 20, marginBottom: 4 }}>📷</div>
                <div style={{ color: '#94a3b8', fontSize: 11 }}>Drag & drop photo here</div>
                <div style={{ color: '#475569', fontSize: 10, marginTop: 2 }}>or click to browse</div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />

          {/* URL toggle */}
          {!urlMode ? (
            <button type="button" onClick={() => setUrlMode(true)} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 11, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
              or paste a URL instead
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                autoFocus
                value={value.startsWith('data:') ? '' : value}
                onChange={e => onChange(e.target.value)}
                placeholder="https://..."
                style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '7px 10px', color: '#e2e8f0', fontSize: 12, outline: 'none' }}
              />
              <button type="button" onClick={() => setUrlMode(false)} style={{ background: 'none', border: 'none', color: '#475569', fontSize: 13, cursor: 'pointer', padding: '0 4px' }}>✕</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────────

interface Application {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  whyEducator?: string;
  specialties?: string[];
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  createdAt: string;
}

interface PendingEducator {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  specialties?: string[];
  experience?: string;
  trainerLanguages?: string[];
  createdAt: string;
}

// ── Multi-select chip input ────────────────────────────────────────────────────

const ChipSelect: React.FC<{
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  label?: string;
  allowCustom?: boolean;
}> = ({ options, selected, onChange, label, allowCustom }) => {
  const extras = useExtraSpecialties();
  // All base options + custom extras + anything already selected
  const allOpts = Array.from(new Set([...options, ...extras, ...selected]));

  const [adding, setAdding] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt]);

  const submitCustom = () => {
    const name = inputVal.trim();
    if (name) {
      addGlobalSpecialty(name);
      if (!selected.includes(name)) onChange([...selected, name]);
    }
    setInputVal('');
    setAdding(false);
  };

  return (
    <div>
      {label && <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>{label}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {allOpts.map(opt => {
          const active = selected.includes(opt);
          const color = SPECIALTY_COLORS[opt] || '#FF1E56';
          return (
            <button key={opt} onClick={() => toggle(opt)} type="button"
              style={{ padding: '5px 12px', borderRadius: 50, fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', border: `1.5px solid ${active ? color : '#334155'}`, background: active ? `${color}22` : 'transparent', color: active ? color : '#94a3b8', transition: 'all 0.15s' }}>
              {opt}
            </button>
          );
        })}

        {/* +Other button / inline input */}
        {allowCustom && (
          adding ? (
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <input
                ref={inputRef}
                autoFocus
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); submitCustom(); }
                  if (e.key === 'Escape') { setAdding(false); setInputVal(''); }
                }}
                placeholder="Modality name…"
                style={{ padding: '4px 10px', borderRadius: 50, border: '1.5px solid #FF1E56', background: 'rgba(255,30,86,0.08)', color: '#e2e8f0', fontSize: 12, outline: 'none', width: 140 }}
              />
              <button onClick={submitCustom} type="button"
                style={{ padding: '4px 10px', borderRadius: 50, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1.5px solid #22c55e', background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                Add
              </button>
              <button onClick={() => { setAdding(false); setInputVal(''); }} type="button"
                style={{ padding: '4px 9px', borderRadius: 50, fontSize: 12, cursor: 'pointer', border: '1.5px solid #475569', background: 'transparent', color: '#64748b' }}>
                ✕
              </button>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} type="button"
              style={{ padding: '5px 12px', borderRadius: 50, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1.5px dashed #475569', background: 'transparent', color: '#64748b', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF1E56'; e.currentTarget.style.color = '#FF6B8A'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.color = '#64748b'; }}>
              + Other
            </button>
          )
        )}
      </div>
    </div>
  );
};

// ── Trainer Card ───────────────────────────────────────────────────────────────

const TrainerCard: React.FC<{
  t: AdminTrainer;
  onClick: () => void;
  onPause: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}> = ({ t, onClick, onPause, onDelete }) => {
  const initials = t.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const primarySpec = t.specialties?.[0] || '';
  const specColor = SPECIALTY_COLORS[primarySpec] || '#FF1E56';
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <div onClick={onClick} style={{ background: '#1e293b', border: `1px solid ${t.isActive ? '#334155' : 'rgba(239,68,68,0.25)'}`, borderRadius: 16, padding: '18px 16px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', opacity: t.isActive ? 1 : 0.72 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = t.isActive ? specColor : 'rgba(239,68,68,0.5)'; e.currentTarget.style.boxShadow = `0 6px 24px ${specColor}22`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = t.isActive ? '#334155' : 'rgba(239,68,68,0.25)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>

      {/* Paused banner */}
      {!t.isActive && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(239,68,68,0.12)', borderBottom: '1px solid rgba(239,68,68,0.2)', borderRadius: '16px 16px 0 0', padding: '4px 12px', fontSize: 10, fontWeight: 700, color: '#f87171', textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase' }}>
          ⏸ Paused — hidden from consultation page
        </div>
      )}

      {/* Online dot */}
      {t.isOnline && t.isActive && (
        <span style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 0 2px rgba(239,68,68,0.3)', display: 'inline-block' }} />
      )}

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, marginTop: !t.isActive ? 20 : 0 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', border: `2.5px solid ${specColor}`, overflow: 'hidden', flexShrink: 0, background: `${specColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: specColor }}>
          {t.avatar ? <img src={t.avatar} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
            {t.isVerifiedBadge && <span style={{ color: '#3b82f6', fontSize: 13 }}>✓</span>}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.email}</div>
        </div>
      </div>

      {/* Specialties */}
      {(t.specialties?.length ?? 0) > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
          {t.specialties!.slice(0, 3).map(s => (
            <span key={s} style={{ background: `${SPECIALTY_COLORS[s] || '#FF1E56'}22`, color: SPECIALTY_COLORS[s] || '#FF6B8A', border: `1px solid ${SPECIALTY_COLORS[s] || '#FF1E56'}44`, borderRadius: 50, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>{s}</span>
          ))}
          {(t.specialties!.length > 3) && (
            <span style={{ background: '#0f172a', color: '#64748b', border: '1px solid #334155', borderRadius: 50, padding: '2px 8px', fontSize: 10 }}>+{t.specialties!.length - 3}</span>
          )}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
        <span>⏱ {t.experience || '—'}</span>
        <span>{(t.rating ?? 0) > 0 ? <span style={{ color: '#f59e0b', fontWeight: 700 }}>★ {t.rating}</span> : <span>{t.courseCount} course{t.courseCount !== 1 ? 's' : ''}</span>}</span>
        <span>{t.sessionsDisplay ? `🎯 ${t.sessionsDisplay} sessions` : `${t.studentCount.toLocaleString()} students`}</span>
        <span style={{ color: '#FF6B8A', fontWeight: 700 }}>{fmt(t.revenuePaise)}</span>
      </div>

      {/* Session price */}
      {(t.sessionPricePaise ?? 0) > 0 && (
        <div style={{ background: 'rgba(255,30,86,0.08)', border: '1px solid rgba(255,30,86,0.2)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#FF6B8A', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>💳 {fmt(t.sessionPricePaise!)}/min</span>
        </div>
      )}

      {/* Permission badges */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
        {t.isActive ? <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 50, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>Active</span>
                    : <span style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 50, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>Paused</span>}
        {t.canPublish       && <span style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 50, padding: '2px 8px', fontSize: 10 }}>Publish</span>}
        {t.canGoLive        && <span style={{ background: 'rgba(234,179,8,0.1)', color: '#fde047', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 50, padding: '2px 8px', fontSize: 10 }}>Live</span>}
        {t.canOfferSessions && <span style={{ background: 'rgba(13,148,136,0.1)', color: '#2dd4bf', border: '1px solid rgba(13,148,136,0.2)', borderRadius: 50, padding: '2px 8px', fontSize: 10 }}>Sessions</span>}
      </div>

      {/* Action buttons */}
      {!confirmDel ? (
        <div style={{ display: 'flex', gap: 6, borderTop: '1px solid #1e3a5f20', paddingTop: 10 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onPause(t._id, !t.isActive)}
            style={{ flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1px solid ${t.isActive ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`, background: t.isActive ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)', color: t.isActive ? '#f59e0b' : '#22c55e', transition: 'all 0.15s' }}>
            {t.isActive ? '⏸ Pause' : '▶ Resume'}
          </button>
          <button
            onClick={() => setConfirmDel(true)}
            style={{ padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#f87171', transition: 'all 0.15s' }}>
            🗑
          </button>
        </div>
      ) : (
        <div style={{ borderTop: '1px solid rgba(239,68,68,0.2)', paddingTop: 10 }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 11, color: '#f87171', fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Delete {t.name}? This cannot be undone.</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onDelete(t._id)} style={{ flex: 1, padding: '7px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>Yes, Delete</button>
            <button onClick={() => setConfirmDel(false)} style={{ flex: 1, padding: '7px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid #334155', background: 'transparent', color: '#94a3b8' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Trainer Detail Drawer ──────────────────────────────────────────────────────

const TrainerDrawer: React.FC<{
  trainer: AdminTrainer;
  onClose: () => void;
  onSaved: (updated: AdminTrainer) => void;
  onDeleted: (id: string) => void;
}> = ({ trainer, onClose, onSaved, onDeleted }) => {
  const [edit, setEdit] = useState({ ...trainer });
  const [saving, setSaving] = useState(false);
  const [genLink, setGenLink] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const inp: React.CSSProperties = { width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
  const label: React.CSSProperties = { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 5 };
  const section: React.CSSProperties = { marginBottom: 22 };

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const { data } = await adminUpdateTrainerProfile(trainer._id, {
        name:             edit.name,
        avatar:           edit.avatar,
        bio:              edit.bio,
        phone:            edit.phone,
        isActive:         edit.isActive,
        isVerified:       edit.isVerified,
        isVerifiedBadge:  edit.isVerifiedBadge,
        specialties:      edit.specialties,
        experience:       edit.experience,
        trainerLanguages: edit.trainerLanguages,
        sessionPricePaise: edit.sessionPricePaise,
        canPublish:        edit.canPublish,
        canGoLive:         edit.canGoLive,
        canOfferSessions:  edit.canOfferSessions,
        rating:            edit.rating,
        followers:         edit.followers,
        sessionsDisplay:   edit.sessionsDisplay,
        trainerRole:       edit.trainerRole,
        trainerColor:      edit.trainerColor,
        hasPayBooking:     edit.hasPayBooking ?? true,
        hasApplyBooking:   edit.hasApplyBooking ?? false,
      });
      setMsg('Saved!');
      onSaved({ ...trainer, ...data.trainer });
      setTimeout(() => setMsg(''), 2000);
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const generateRazorpay = async () => {
    if (!(edit.sessionPricePaise ?? 0 > 0)) { setMsg('Set a session price first'); return; }
    setGenLink(true); setMsg('');
    try {
      const { data } = await adminGenTrainerRazorpay(trainer._id);
      setEdit(e => ({ ...e, sessionRazorpayLink: data.link }));
      setMsg('Razorpay link created!');
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Razorpay error');
    } finally { setGenLink(false); }
  };

  const Toggle: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({ label: lbl, value, onChange }) => (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '10px 14px', background: '#0f172a', borderRadius: 8, border: '1px solid #334155', marginBottom: 8 }}>
      <span style={{ color: '#cbd5e1', fontSize: 13 }}>{lbl}</span>
      <div onClick={() => onChange(!value)} style={{ width: 36, height: 20, borderRadius: 10, background: value ? '#FF1E56' : '#334155', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
      </div>
    </label>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex' }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />

      {/* Drawer */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 480, maxWidth: '100vw', height: '100%', background: '#1e293b', borderLeft: '1px solid #334155', overflow: 'auto', boxShadow: '-16px 0 60px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#1e293b', zIndex: 1 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#e2e8f0' }}>Edit Trainer</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{trainer.email}</div>
          </div>
          <button onClick={onClose} style={{ background: '#0f172a', border: '1px solid #334155', color: '#94a3b8', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✕</button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Avatar Upload */}
          <div style={section}>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Profile Photo</div>
            <ImageDropZone value={edit.avatar || ''} onChange={v => setEdit(e => ({ ...e, avatar: v }))} size={64} label={edit.name || 'Photo'} />
          </div>

          {/* Basic Info */}
          <div style={section}>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 14, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8 }}>Basic Info</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={label}>Full Name</label>
                <input value={edit.name} onChange={e => setEdit(v => ({ ...v, name: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={label}>Phone</label>
                <input value={edit.phone || ''} onChange={e => setEdit(v => ({ ...v, phone: e.target.value }))} style={inp} />
              </div>
            </div>
            <div>
              <label style={label}>Bio</label>
              <textarea value={edit.bio || ''} onChange={e => setEdit(v => ({ ...v, bio: e.target.value }))} rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
            </div>
          </div>

          {/* Expertise */}
          <div style={section}>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 14, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8 }}>Expertise</div>
            <div style={{ marginBottom: 12 }}>
              <label style={label}>Experience</label>
              <input value={edit.experience || ''} onChange={e => setEdit(v => ({ ...v, experience: e.target.value }))} placeholder="e.g. 12+ Yrs" style={inp} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <ChipSelect options={SPECIALTIES_OPTIONS} selected={edit.specialties || []} onChange={v => setEdit(e => ({ ...e, specialties: v }))} label="Specialties" allowCustom />
            </div>
            <div>
              <ChipSelect options={LANGUAGE_OPTIONS} selected={edit.trainerLanguages || []} onChange={v => setEdit(e => ({ ...e, trainerLanguages: v }))} label="Languages" />
            </div>
          </div>

          {/* Session Pricing */}
          <div style={section}>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 14, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8 }}>Session Pricing</div>
            <div style={{ marginBottom: 12 }}>
              <label style={label}>Rate per Minute (₹/min)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#FF6B8A', fontWeight: 700, fontSize: 15 }}>₹</span>
                <input
                  type="number"
                  value={edit.sessionPricePaise ? Math.round(edit.sessionPricePaise / 100) : ''}
                  onChange={e => setEdit(v => ({ ...v, sessionPricePaise: Math.round(Number(e.target.value) * 100) }))}
                  placeholder="e.g. 100"
                  style={{ ...inp, flex: 1 }}
                />
                <span style={{ color: '#64748b', fontSize: 13, whiteSpace: 'nowrap' }}>/min</span>
              </div>
              {(edit.sessionPricePaise ?? 0) > 0 && (
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{fmt(edit.sessionPricePaise!)}/min · 60 min session = {fmt((edit.sessionPricePaise! ?? 0) * 60)}</div>
              )}
            </div>

            {/* Razorpay link */}
            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#FF6B8A', marginBottom: 8 }}>Razorpay Payment Link</div>
              {edit.sessionRazorpayLink ? (
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#60a5fa', background: '#0a1628', padding: '6px 10px', borderRadius: 6, marginBottom: 8, wordBreak: 'break-all' }}>{edit.sessionRazorpayLink}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={edit.sessionRazorpayLink} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>Open Link ↗</a>
                    <button onClick={generateRazorpay} disabled={genLink} style={{ background: 'rgba(255,30,86,0.1)', color: '#FF6B8A', border: '1px solid rgba(255,30,86,0.3)', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{genLink ? 'Regenerating…' : '🔄 Regenerate'}</button>
                  </div>
                </div>
              ) : (
                <button onClick={generateRazorpay} disabled={genLink || !(edit.sessionPricePaise ?? 0 > 0)}
                  style={{ background: genLink ? '#0f172a' : 'linear-gradient(90deg,#FF1E56,#5b21b6)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 12, fontWeight: 700, cursor: genLink || !(edit.sessionPricePaise ?? 0 > 0) ? 'not-allowed' : 'pointer', opacity: !(edit.sessionPricePaise ?? 0 > 0) ? 0.5 : 1 }}>
                  {genLink ? 'Creating…' : '⚡ Generate Razorpay Link'}
                </button>
              )}
              <div style={{ fontSize: 10, color: '#475569', marginTop: 8 }}>This link is shown on the consultation page — students click it to pay and book a session.</div>
            </div>
          </div>

          {/* Consultation Card Display */}
          <div style={section}>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 14, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8 }}>Consultation Card Display</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={label}>Role / Title</label>
                <input value={edit.trainerRole || ''} onChange={e => setEdit(v => ({ ...v, trainerRole: e.target.value }))} placeholder="Clinical Hypnotherapist" style={inp} />
              </div>
              <div>
                <label style={label}>Card Color</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={edit.trainerColor || '#FF1E56'} onChange={e => setEdit(v => ({ ...v, trainerColor: e.target.value }))}
                    style={{ width: 38, height: 38, border: '1px solid #334155', borderRadius: 8, cursor: 'pointer', padding: 2, background: '#0f172a' }} />
                  <input value={edit.trainerColor || '#FF1E56'} onChange={e => setEdit(v => ({ ...v, trainerColor: e.target.value }))}
                    placeholder="#FF1E56" style={{ ...inp, flex: 1 }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={label}>Rating (0–5)</label>
                <input type="number" min="0" max="5" step="0.1"
                  value={edit.rating ?? ''}
                  onChange={e => setEdit(v => ({ ...v, rating: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
                  placeholder="4.9" style={inp} />
                {(edit.rating ?? 0) > 0 && (
                  <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 3 }}>{'★'.repeat(Math.round(edit.rating ?? 0))}{'☆'.repeat(5 - Math.round(edit.rating ?? 0))} {edit.rating}</div>
                )}
              </div>
              <div>
                <label style={label}>Followers</label>
                <input type="number" min="0"
                  value={edit.followers ?? ''}
                  onChange={e => setEdit(v => ({ ...v, followers: e.target.value === '' ? 0 : parseInt(e.target.value) }))}
                  placeholder="4200" style={inp} />
              </div>
              <div>
                <label style={label}>Sessions Display</label>
                <input value={edit.sessionsDisplay || ''}
                  onChange={e => setEdit(v => ({ ...v, sessionsDisplay: e.target.value }))}
                  placeholder="5,000+" style={inp} />
              </div>
            </div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 8 }}>These fields control how the trainer appears on the consultation page</div>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Booking Options on Consultation Page</div>
              <Toggle label="💳 Pay Button (Razorpay booking)" value={edit.hasPayBooking ?? true} onChange={v => setEdit(e => ({ ...e, hasPayBooking: v }))} />
              <Toggle label="✋ Apply for 1:1 Session (request flow)" value={!!edit.hasApplyBooking} onChange={v => setEdit(e => ({ ...e, hasApplyBooking: v }))} />
              <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>Both can be enabled simultaneously</div>
            </div>
          </div>

          {/* Permissions */}
          <div style={section}>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 14, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8 }}>Permissions & Status</div>
            <Toggle label="Account Active" value={!!edit.isActive} onChange={v => setEdit(e => ({ ...e, isActive: v }))} />
            <Toggle label="Verified Badge" value={!!edit.isVerifiedBadge} onChange={v => setEdit(e => ({ ...e, isVerifiedBadge: v }))} />
            <Toggle label="Can Publish Courses" value={!!edit.canPublish} onChange={v => setEdit(e => ({ ...e, canPublish: v }))} />
            <Toggle label="Can Go Live" value={!!edit.canGoLive} onChange={v => setEdit(e => ({ ...e, canGoLive: v }))} />
            <Toggle label="Can Offer 1:1 Sessions" value={!!edit.canOfferSessions} onChange={v => setEdit(e => ({ ...e, canOfferSessions: v }))} />
          </div>

          {/* Save */}
          {msg && (
            <div style={{ background: msg === 'Saved!' || msg.includes('created') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${msg === 'Saved!' || msg.includes('created') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, color: msg === 'Saved!' || msg.includes('created') ? '#22c55e' : '#f87171', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>
              {msg}
            </div>
          )}
          <button onClick={save} disabled={saving}
            style={{ width: '100%', background: saving ? '#334155' : 'linear-gradient(90deg,#FF1E56,#5b21b6)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontWeight: 800, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving…' : '💾 Save Changes'}
          </button>

          {/* Danger Zone */}
          <div style={{ marginTop: 28, borderTop: '1px solid rgba(239,68,68,0.15)', paddingTop: 20 }}>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Danger Zone</div>

            {/* Pause / Resume */}
            <button
              onClick={async () => {
                setSaving(true);
                try {
                  const { data } = await adminUpdateTrainerProfile(trainer._id, { isActive: !edit.isActive });
                  const updated = { ...trainer, ...data.trainer, isActive: !edit.isActive };
                  setEdit(e => ({ ...e, isActive: !e.isActive }));
                  onSaved(updated);
                  setMsg(edit.isActive ? 'Trainer paused — hidden from consultation page' : 'Trainer resumed — now visible on consultation page');
                  setTimeout(() => setMsg(''), 3000);
                } catch { setMsg('Failed'); }
                finally { setSaving(false); }
              }}
              style={{ width: '100%', padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: `1px solid ${edit.isActive ? 'rgba(245,158,11,0.4)' : 'rgba(34,197,94,0.4)'}`, background: edit.isActive ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)', color: edit.isActive ? '#f59e0b' : '#22c55e', marginBottom: 10 }}>
              {edit.isActive ? '⏸ Pause Trainer (hide from consultation page)' : '▶ Resume Trainer (show on consultation page)'}
            </button>

            {/* Delete */}
            {!confirmDel ? (
              <button onClick={() => setConfirmDel(true)}
                style={{ width: '100%', padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#f87171' }}>
                🗑 Delete Trainer Account
              </button>
            ) : (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '14px' }}>
                <div style={{ color: '#f87171', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Permanently delete {trainer.name}?</div>
                <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 14 }}>This will remove their account, profile, and consultation page listing. This cannot be undone.</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={async () => {
                    setDeleting(true);
                    try {
                      await adminDeleteTrainer(trainer._id);
                      onDeleted(trainer._id);
                      onClose();
                    } catch { setMsg('Delete failed'); setConfirmDel(false); }
                    finally { setDeleting(false); }
                  }} disabled={deleting}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: deleting ? 'not-allowed' : 'pointer', border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>
                    {deleting ? 'Deleting…' : 'Yes, Delete Permanently'}
                  </button>
                  <button onClick={() => setConfirmDel(false)}
                    style={{ padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid #334155', background: 'transparent', color: '#94a3b8' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Add Trainer Form ───────────────────────────────────────────────────────────

interface AddForm {
  name: string; email: string; password: string; phone: string;
  avatar: string; bio: string; experience: string;
  specialties: string[]; trainerLanguages: string[];
  sessionPricePaise: number;
  canPublish: boolean; canGoLive: boolean; canOfferSessions: boolean; isVerifiedBadge: boolean;
  trainerRole: string; trainerColor: string;
  rating: number; followers: number; sessionsDisplay: string;
  hasPayBooking: boolean; hasApplyBooking: boolean;
}

const EMPTY_FORM: AddForm = {
  name: '', email: '', password: '', phone: '',
  avatar: '', bio: '', experience: '',
  specialties: [], trainerLanguages: [],
  sessionPricePaise: 0,
  canPublish: true, canGoLive: false, canOfferSessions: false, isVerifiedBadge: false,
  trainerRole: '', trainerColor: '#FF1E56',
  rating: 0, followers: 0, sessionsDisplay: '',
  hasPayBooking: true, hasApplyBooking: false,
};

const AddTrainerPanel: React.FC<{ onCreated: (t: AdminTrainer) => void }> = ({ onCreated }) => {
  const [form, setForm] = useState<AddForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [success, setSuccess] = useState<AdminTrainer | null>(null);

  const inp: React.CSSProperties = { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
  const label: React.CSSProperties = { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: 0.8, display: 'block', marginBottom: 5 };

  const f = (key: keyof AddForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(v => ({ ...v, [key]: e.target.value }));

  const Toggle: React.FC<{ k: 'canPublish' | 'canGoLive' | 'canOfferSessions' | 'isVerifiedBadge'; label: string }> = ({ k, label: lbl }) => (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '10px 14px', background: '#0f172a', borderRadius: 8, border: '1px solid #334155', marginBottom: 8 }}>
      <span style={{ color: '#cbd5e1', fontSize: 13 }}>{lbl}</span>
      <div onClick={() => setForm(v => ({ ...v, [k]: !v[k] }))} style={{ width: 36, height: 20, borderRadius: 10, background: form[k] ? '#FF1E56' : '#334155', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 2, left: form[k] ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
      </div>
    </label>
  );

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setMsg('Name, email, and password are required'); return;
    }
    setSaving(true); setMsg('');
    try {
      const { data } = await adminCreateTrainer(form);
      setSuccess(data.trainer);
      onCreated(data.trainer);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed to create trainer');
    } finally { setSaving(false); }
  };

  if (success) return (
    <div style={{ maxWidth: 560, background: '#1e293b', border: '1px solid #334155', borderRadius: 20, padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
      <div style={{ fontWeight: 800, fontSize: 20, color: '#e2e8f0', marginBottom: 8 }}>Trainer Created!</div>
      <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>
        <strong style={{ color: '#FF6B8A' }}>{success.name}</strong> ({success.email}) is now a trainer on BSH Healers.
      </div>
      <button onClick={() => setSuccess(null)} style={{ background: 'linear-gradient(90deg,#FF1E56,#5b21b6)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
        + Add Another Trainer
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ color: '#e2e8f0', margin: '0 0 6px', fontSize: 20, fontWeight: 800 }}>Add New Trainer</h3>
        <p style={{ color: '#64748b', margin: 0, fontSize: 13 }}>Create a trainer account with full profile. They can log in immediately with these credentials.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left column */}
        <div>
          {/* Profile photo */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Profile Photo</div>
            <ImageDropZone value={form.avatar} onChange={v => setForm(e => ({ ...e, avatar: v }))} size={68} label={form.name || 'Photo'} />
          </div>

          {/* Account credentials */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Account Credentials</div>
            <div style={{ marginBottom: 10 }}>
              <label style={label}>Full Name *</label>
              <input value={form.name} onChange={f('name')} placeholder="Dr. Pradeep Kumar" style={inp} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={label}>Email Address *</label>
              <input value={form.email} onChange={f('email')} type="email" placeholder="trainer@bsh.com" style={inp} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={label}>Password *</label>
              <input value={form.password} onChange={f('password')} type="text" placeholder="Temp password" style={inp} />
              <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>Trainer will use this to log in</div>
            </div>
            <div>
              <label style={label}>Phone</label>
              <input value={form.phone} onChange={f('phone')} placeholder="+91 98765 43210" style={inp} />
            </div>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Bio</div>
            <textarea value={form.bio} onChange={f('bio')} rows={4} placeholder="Write a compelling trainer bio…" style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
          </div>

          {/* Experience */}
          <div style={{ marginBottom: 20 }}>
            <label style={label}>Experience</label>
            <input value={form.experience} onChange={f('experience')} placeholder="e.g. 12+ Yrs" style={inp} />
          </div>
        </div>

        {/* Right column */}
        <div>
          {/* Specialties */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Specialties</div>
            <ChipSelect options={SPECIALTIES_OPTIONS} selected={form.specialties} onChange={v => setForm(e => ({ ...e, specialties: v }))} allowCustom />
          </div>

          {/* Languages */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Languages</div>
            <ChipSelect options={LANGUAGE_OPTIONS} selected={form.trainerLanguages} onChange={v => setForm(e => ({ ...e, trainerLanguages: v }))} />
          </div>

          {/* Session pricing */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#FF6B8A', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Session Pricing</div>
            <label style={label}>Rate per Minute (₹/min)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ color: '#FF6B8A', fontWeight: 800, fontSize: 16 }}>₹</span>
              <input
                type="number"
                value={form.sessionPricePaise ? Math.round(form.sessionPricePaise / 100) : ''}
                onChange={e => setForm(v => ({ ...v, sessionPricePaise: Math.round(Number(e.target.value) * 100) }))}
                placeholder="e.g. 100"
                style={{ ...inp, flex: 1 }}
              />
              <span style={{ color: '#64748b', fontSize: 13 }}>/min</span>
            </div>
            {form.sessionPricePaise > 0 && (
              <div style={{ fontSize: 12, color: '#64748b' }}>{fmt(form.sessionPricePaise)}/min · 60 min = {fmt(form.sessionPricePaise * 60)} · Razorpay link after save</div>
            )}
          </div>

          {/* Consultation Card Display */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#2dd4bf', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Consultation Card Display</div>
            <div style={{ marginBottom: 10 }}>
              <label style={label}>Role / Title</label>
              <input value={form.trainerRole} onChange={f('trainerRole')} placeholder="Clinical Hypnotherapist" style={inp} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={label}>Card Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={form.trainerColor}
                  onChange={e => setForm(v => ({ ...v, trainerColor: e.target.value }))}
                  style={{ width: 38, height: 38, border: '1px solid #334155', borderRadius: 8, cursor: 'pointer', padding: 2, background: '#1e293b' }} />
                <input value={form.trainerColor} onChange={f('trainerColor')} placeholder="#FF1E56" style={{ ...inp, flex: 1 }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={label}>Rating (0–5)</label>
                <input type="number" min="0" max="5" step="0.1"
                  value={form.rating || ''}
                  onChange={e => setForm(v => ({ ...v, rating: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
                  placeholder="4.9" style={inp} />
              </div>
              <div>
                <label style={label}>Followers</label>
                <input type="number" min="0"
                  value={form.followers || ''}
                  onChange={e => setForm(v => ({ ...v, followers: e.target.value === '' ? 0 : parseInt(e.target.value) }))}
                  placeholder="4200" style={inp} />
              </div>
              <div>
                <label style={label}>Sessions</label>
                <input value={form.sessionsDisplay} onChange={f('sessionsDisplay')} placeholder="5,000+" style={inp} />
              </div>
            </div>
          </div>

          {/* Booking Options */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Booking Options</div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '10px 14px', background: '#1e293b', borderRadius: 8, border: '1px solid #334155', marginBottom: 8 }}>
              <span style={{ color: '#cbd5e1', fontSize: 13 }}>💳 Pay Button (Razorpay booking)</span>
              <div onClick={() => setForm(v => ({ ...v, hasPayBooking: !v.hasPayBooking }))} style={{ width: 36, height: 20, borderRadius: 10, background: form.hasPayBooking ? '#FF1E56' : '#334155', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: form.hasPayBooking ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '10px 14px', background: '#1e293b', borderRadius: 8, border: '1px solid #334155', marginBottom: 4 }}>
              <span style={{ color: '#cbd5e1', fontSize: 13 }}>✋ Apply for 1:1 Session (request flow)</span>
              <div onClick={() => setForm(v => ({ ...v, hasApplyBooking: !v.hasApplyBooking }))} style={{ width: 36, height: 20, borderRadius: 10, background: form.hasApplyBooking ? '#FF1E56' : '#334155', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: form.hasApplyBooking ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
            </label>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>Both can be enabled simultaneously</div>
          </div>

          {/* Permissions */}
          <div>
            <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Permissions</div>
            <Toggle k="isVerifiedBadge" label="✓ Verified Badge" />
            <Toggle k="canPublish" label="📚 Can Publish Courses" />
            <Toggle k="canGoLive" label="🔴 Can Go Live" />
            <Toggle k="canOfferSessions" label="💬 Can Offer 1:1 Sessions" />
          </div>
        </div>
      </div>

      {/* Submit */}
      {msg && (
        <div style={{ marginTop: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
          {msg}
        </div>
      )}
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={submit} disabled={saving}
          style={{ background: saving ? '#334155' : 'linear-gradient(90deg,#FF1E56,#5b21b6)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 36px', fontWeight: 800, fontSize: 16, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Creating…' : '✨ Create Trainer'}
        </button>
      </div>
    </div>
  );
};

// ── Applications Tab ───────────────────────────────────────────────────────────

interface CredentialModal { email: string; password: string; name: string }

const ApplicationsTab: React.FC<{ onPublished?: () => void }> = ({ onPublished }) => {
  const [apps, setApps] = useState<{
    pending: Application[]; approved: Application[]; rejected: Application[];
    pendingEducators: PendingEducator[];
  }>({ pending: [], approved: [], rejected: [], pendingEducators: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});
  const [creds, setCreds] = useState<CredentialModal | null>(null);

  const load = () => {
    setLoading(true);
    adminGetEducatorApplications()
      .then(r => { const d = r.data as any; setApps({ pending: d.pending || [], approved: d.approved || [], rejected: d.rejected || [], pendingEducators: d.pendingEducators || [] }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const publish = async (id: string, name: string) => {
    setActionId(id);
    try {
      const r = await adminApproveApplication(id) as any;
      const d = r.data;
      load();
      onPublished?.();
      if (d.credentials?.password) {
        setCreds({ email: d.credentials.email, password: d.credentials.password, name });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to publish trainer');
    } finally { setActionId(null); }
  };

  const reject = async (id: string) => {
    setActionId(id);
    try {
      await adminRejectApplication(id, rejectNote[id] || '');
      setRejectOpen(null);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Rejection failed');
    } finally { setActionId(null); }
  };

  const upgradeEducator = async (edu: PendingEducator) => {
    setActionId(edu._id);
    try {
      await adminUpdateTrainerProfile(edu._id, { canOfferSessions: true, canPublish: true });
      load();
      onPublished?.();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upgrade educator');
    } finally { setActionId(null); }
  };

  const visible: Application[] = apps[filter];

  const AppCard: React.FC<{ app: Application }> = ({ app }) => {
    const app2 = app as any;
    const color = app2.trainerColor || '#FF1E56';
    const initials = app.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
    return (
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ background: `linear-gradient(135deg,${color}33,${color}11)`, borderBottom: `1px solid ${color}33`, padding: '18px 18px 14px' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 62, height: 62, borderRadius: '50%', border: `2.5px solid ${color}`, overflow: 'hidden', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color, flexShrink: 0 }}>
              {app2.avatar ? <img src={app2.avatar} alt={app.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontWeight: 800, color: '#e2e8f0', fontSize: 15 }}>{app.name}</span>
                {app2.isVerifiedBadge && <span style={{ color: '#3b82f6', fontSize: 14 }}>✓</span>}
                <span style={{ background: filter === 'pending' ? 'rgba(245,158,11,0.15)' : filter === 'approved' ? 'rgba(34,197,94,0.15)' : 'rgba(248,113,113,0.15)', color: filter === 'pending' ? '#f59e0b' : filter === 'approved' ? '#22c55e' : '#f87171', borderRadius: 50, padding: '1px 8px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, marginLeft: 'auto' }}>{filter}</span>
              </div>
              {app2.trainerRole && <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>{app2.trainerRole}</div>}
              <div style={{ fontSize: 11, color: '#64748b' }}>{app.email}</div>
            </div>
          </div>
          {(app2.sessionsDisplay || app2.rating || app2.experience) && (
            <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 11, color: '#94a3b8' }}>
              {app2.experience && <span>⏱ {app2.experience}</span>}
              {app2.sessionsDisplay && <span>💬 {app2.sessionsDisplay} sessions</span>}
              {app2.rating > 0 && <span>⭐ {app2.rating}</span>}
              {app2.followers > 0 && <span>👥 {(app2.followers / 1000).toFixed(1)}k</span>}
            </div>
          )}
        </div>
        <div style={{ padding: '14px 18px' }}>
          {app2.specialties?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
              {app2.specialties.map((s: string) => (
                <span key={s} style={{ background: `${SPECIALTY_COLORS[s] || '#FF1E56'}22`, color: SPECIALTY_COLORS[s] || '#FF6B8A', border: `1px solid ${SPECIALTY_COLORS[s] || '#FF1E56'}44`, borderRadius: 50, padding: '2px 9px', fontSize: 10, fontWeight: 700 }}>{s}</span>
              ))}
            </div>
          )}
          {app2.trainerLanguages?.length > 0 && <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>🌐 {app2.trainerLanguages.join(' · ')}</div>}
          {app.bio && <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{app.bio}</div>}
          {filter === 'pending' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => publish(app._id, app.name)} disabled={actionId === app._id}
                style={{ flex: 1, background: actionId === app._id ? '#334155' : `linear-gradient(135deg,${color},${color}cc)`, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 8px', cursor: actionId === app._id ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 13 }}>
                {actionId === app._id ? '…' : '🚀 Publish as Trainer'}
              </button>
              {rejectOpen === app._id ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <input value={rejectNote[app._id] || ''} onChange={e => setRejectNote(n => ({ ...n, [app._id]: e.target.value }))} placeholder="Note (optional)" style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '6px 10px', color: '#e2e8f0', fontSize: 11, outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
                  <button onClick={() => reject(app._id)} style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '7px', fontSize: 11, fontWeight: 700, cursor: 'pointer', width: '100%' }}>Confirm Reject</button>
                </div>
              ) : (
                <button onClick={() => setRejectOpen(app._id)} style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '11px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>✕</button>
              )}
            </div>
          )}
          {filter === 'approved' && <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>✅ Published — visible on Consultation page</div>}
          {filter === 'rejected' && app2.adminNote && <div style={{ fontSize: 11, color: '#f87171' }}>Note: {app2.adminNote}</div>}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Credentials modal */}
      {creds && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 20, padding: 32, maxWidth: 440, width: '100%' }}>
            <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 16 }}>🎉</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#e2e8f0', marginBottom: 6, textAlign: 'center' }}>{creds.name} is now live!</div>
            <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginBottom: 20 }}>Share these login credentials with the trainer</div>
            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 16, fontFamily: 'monospace', fontSize: 13, marginBottom: 20 }}>
              <div style={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>Login Credentials</div>
              <div style={{ color: '#e2e8f0', marginBottom: 6 }}><span style={{ color: '#94a3b8' }}>Email: </span>{creds.email}</div>
              <div style={{ color: '#e2e8f0' }}><span style={{ color: '#94a3b8' }}>Password: </span><span style={{ color: '#FF6B8A', fontWeight: 700 }}>{creds.password}</span></div>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#fbbf24', marginBottom: 20 }}>
              ⚠️ Save this password now — it cannot be recovered. The trainer should change it after first login.
            </div>
            <button onClick={() => setCreds(null)} style={{ width: '100%', background: 'linear-gradient(90deg,#FF1E56,#5b21b6)', color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>
              Done — I've saved the credentials
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['pending','approved','rejected'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '7px 18px', borderRadius: 50, cursor: 'pointer', fontSize: 12, fontWeight: filter === s ? 700 : 500, border: `1.5px solid ${filter === s ? (s === 'pending' ? '#f59e0b' : s === 'approved' ? '#22c55e' : '#f87171') : '#334155'}`, background: filter === s ? (s === 'pending' ? 'rgba(245,158,11,0.12)' : s === 'approved' ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.12)') : 'transparent', color: filter === s ? (s === 'pending' ? '#f59e0b' : s === 'approved' ? '#22c55e' : '#f87171') : '#64748b' }}>
            {s === 'pending' ? '⏳' : s === 'approved' ? '✅' : '❌'} {s.charAt(0).toUpperCase() + s.slice(1)} <span style={{ marginLeft: 4, opacity: 0.7 }}>({apps[s].length})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="adm-loading"><div className="adm-spinner" /><span>Loading…</span></div>
      ) : (
        <>
          {/* Trainer Applications (EducatorApplication records) */}
          {visible.length > 0 && (
            <>
              {filter === 'pending' && (
                <div style={{ background: 'rgba(255,30,86,0.08)', border: '1px solid rgba(255,30,86,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#FF6B8A', marginBottom: 16 }}>
                  ✨ Trainer applications waiting for review. Click <strong>"Publish as Trainer"</strong> to create their account and show them on the Consultation page.
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16, marginBottom: 28 }}>
                {visible.map(app => <AppCard key={app._id} app={app} />)}
              </div>
            </>
          )}
          {visible.length === 0 && filter !== 'pending' && (
            <div className="adm-empty">No {filter} applications</div>
          )}

          {/* Educator Signups — only show in pending view */}
          {filter === 'pending' && apps.pendingEducators.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Educator Signups ({apps.pendingEducators.length})
                </div>
                <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
              </div>
              <div style={{ background: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#2dd4bf', marginBottom: 16 }}>
                These educators signed up and are waiting to be promoted to consultation trainers. Click <strong>"Upgrade to Trainer"</strong> to add them to the Consultation page.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
                {apps.pendingEducators.map(edu => {
                  const initials = edu.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
                  return (
                    <div key={edu._id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
                      <div style={{ background: 'rgba(13,148,136,0.08)', borderBottom: '1px solid rgba(13,148,136,0.15)', padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid #0d9488', overflow: 'hidden', background: 'rgba(13,148,136,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#2dd4bf', flexShrink: 0 }}>
                            {edu.avatar ? <img src={edu.avatar} alt={edu.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : initials}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{edu.name}</div>
                            <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{edu.email}</div>
                          </div>
                          <span style={{ background: 'rgba(13,148,136,0.15)', color: '#2dd4bf', border: '1px solid rgba(13,148,136,0.3)', borderRadius: 50, padding: '2px 9px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, flexShrink: 0 }}>Educator</span>
                        </div>
                        {edu.experience && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>⏱ {edu.experience}</div>}
                      </div>
                      <div style={{ padding: '12px 16px' }}>
                        {edu.specialties && edu.specialties.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                            {edu.specialties.slice(0, 3).map((s: string) => (
                              <span key={s} style={{ background: `${SPECIALTY_COLORS[s] || '#FF1E56'}22`, color: SPECIALTY_COLORS[s] || '#FF6B8A', border: `1px solid ${SPECIALTY_COLORS[s] || '#FF1E56'}44`, borderRadius: 50, padding: '2px 9px', fontSize: 10, fontWeight: 700 }}>{s}</span>
                            ))}
                          </div>
                        )}
                        {edu.bio && <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{edu.bio}</div>}
                        <button onClick={() => upgradeEducator(edu)} disabled={actionId === edu._id}
                          style={{ width: '100%', background: actionId === edu._id ? '#334155' : 'linear-gradient(135deg,#0d9488,#0891b2)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', cursor: actionId === edu._id ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 13 }}>
                          {actionId === edu._id ? '…' : '⬆️ Upgrade to Trainer'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filter === 'pending' && visible.length === 0 && apps.pendingEducators.length === 0 && (
            <div className="adm-empty">No pending applications</div>
          )}
        </>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

const AdminTrainers: React.FC = () => {
  const [tab, setTab] = useState<'trainers' | 'applications' | 'add'>('trainers');
  const [trainers, setTrainers] = useState<AdminTrainer[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState<AdminTrainer | null>(null);

  const load = () => {
    setLoading(true);
    adminGetTrainers()
      .then(r => {
        const d = r.data as any;
        const ts: AdminTrainer[] = d.trainers ?? d;
        setTrainers(ts);
        // Pre-seed any custom specialties from existing trainer profiles
        ts.forEach(t => t.specialties?.forEach(addGlobalSpecialty));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    !search ? trainers : trainers.filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      (t.specialties || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
    ), [trainers, search]);

  const stats = useMemo(() => ({
    total:    trainers.length,
    active:   trainers.filter(t => t.isActive).length,
    online:   trainers.filter(t => t.isOnline).length,
    sessions: trainers.filter(t => t.canOfferSessions).length,
    revenue:  trainers.reduce((a, t) => a + t.revenuePaise, 0),
  }), [trainers]);

  return (
    <>
      {/* Header + Tabs */}
      <div className="adm-sh" style={{ marginBottom: 0 }}>
        <h2>Trainers</h2>
      </div>

      <div style={{ display: 'flex', gap: 6, margin: '16px 0 20px', borderBottom: '1px solid #1e293b', paddingBottom: 0 }}>
        {[
          { key: 'trainers' as const,     label: '👥 Current Trainers' },
          { key: 'applications' as const, label: '📋 Applications'      },
          { key: 'add' as const,          label: '➕ Add Trainer'        },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: tab === key ? '2.5px solid #FF1E56' : '2.5px solid transparent', color: tab === key ? '#FF6B8A' : '#64748b', fontWeight: tab === key ? 700 : 500, fontSize: 13, cursor: 'pointer', marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Trainers Tab ─────────────────────────────────────────────── */}
      {tab === 'trainers' && (
        <>
          {/* Stats */}
          {!loading && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Total Trainers',  value: stats.total,    color: '#FF6B8A' },
                { label: 'Active',          value: stats.active,   color: '#22c55e' },
                { label: 'Online Now',      value: stats.online,   color: '#ef4444' },
                { label: 'Offer Sessions',  value: stats.sessions, color: '#2dd4bf' },
                { label: 'Total Revenue',   value: fmt(stats.revenue), color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} className="adm-card" style={{ flex: 1, minWidth: 120, padding: '12px 16px' }}>
                  <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color, marginTop: 3 }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="adm-toolbar" style={{ marginBottom: 16 }}>
            <div className="adm-search">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input placeholder="Search by name, email or specialty…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <span style={{ fontSize: 12, color: '#64748b' }}>{filtered.length} trainers</span>
            <button className="adm-btn adm-btn-ghost" onClick={() => {
              const BOM = '﻿';
              const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
              const rows = filtered.map(t => [t.name, t.email, t.phone || '', (t.specialties || []).join('; '), t.experience || '', String(t.courseCount), String(t.studentCount), fmt(t.revenuePaise), t.isActive ? 'Active' : 'Paused'].map(esc).join(','));
              const csv = BOM + ['Name,Email,Phone,Specialties,Experience,Courses,Students,Revenue,Status', ...rows].join('\r\n');
              const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
              Object.assign(document.createElement('a'), { href: url, download: `trainers_${new Date().toISOString().slice(0,10)}.csv` }).click();
              URL.revokeObjectURL(url);
            }}>⬇ CSV</button>
          </div>

          {loading ? (
            <div className="adm-loading"><div className="adm-spinner" /><span>Loading trainers…</span></div>
          ) : filtered.length === 0 ? (
            <div className="adm-empty">{search ? 'No trainers match your search' : 'No trainers yet — use "Add Trainer" to add one'}</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
              {filtered.map(t => (
                <TrainerCard key={t._id} t={t} onClick={() => setSelected(t)}
                  onPause={(id, active) => {
                    adminUpdateTrainerProfile(id, { isActive: active })
                      .then(() => setTrainers(prev => prev.map(x => x._id === id ? { ...x, isActive: active } : x)))
                      .catch(() => {});
                  }}
                  onDelete={id => {
                    adminDeleteTrainer(id)
                      .then(() => setTrainers(prev => prev.filter(x => x._id !== id)))
                      .catch(() => {});
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Applications Tab ─────────────────────────────────────────── */}
      {tab === 'applications' && <ApplicationsTab onPublished={() => load()} />}

      {/* ── Add Trainer Tab ──────────────────────────────────────────── */}
      {tab === 'add' && (
        <AddTrainerPanel onCreated={newT => {
          setTrainers(prev => [{ ...newT, courseCount: 0, studentCount: 0, revenuePaise: 0 } as AdminTrainer, ...prev]);
          setTab('trainers');
        }} />
      )}

      {/* Drawer */}
      {selected && (
        <TrainerDrawer
          trainer={selected}
          onClose={() => setSelected(null)}
          onSaved={updated => setTrainers(prev => prev.map(t => t._id === updated._id ? { ...t, ...updated } : t))}
          onDeleted={id => { setTrainers(prev => prev.filter(t => t._id !== id)); setSelected(null); }}
        />
      )}
    </>
  );
};

export default AdminTrainers;
