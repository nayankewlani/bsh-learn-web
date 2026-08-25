import React, { useEffect, useState, useCallback } from 'react';
import client from '../../api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BatchMember { _id: string; name: string; email: string; phone?: string; }
interface Batch { _id: string; name: string; startDate?: string; maxStudents: number; members: BatchMember[]; }
interface GHLConfig {
  outboundWebhookUrl?: string; inboundSecret?: string;
  apiKey?: string; locationId?: string; tagId?: string;
  customHeaders?: { key: string; value: string }[];
  isConnected?: boolean; lastTestedAt?: string;
}
interface Item {
  _id: string;
  _type: 'course' | 'program';
  programId?: string;
  title: string; description: string;
  educator?: { _id: string; name: string; email: string };
  category?: string; subcategory?: string; language?: string; level?: string;
  price: number; discountPrice?: number; thumbnail: string;
  previewVideoUrl?: string; tags?: string[];
  isPublished?: boolean; isFeatured?: boolean;
  submittedForReview?: boolean;
  // Program-only extras
  programType?: string;
  duration?: string;
  features?: string[];
  requirements?: string[]; objectives?: string[];
  isActive?: boolean;
  totalDuration?: number; totalLessons?: number; enrollmentCount?: number;
  rating?: number; ratingCount?: number;
  batches: Batch[];
  globalStartDate?: string;
  showcaseWork: boolean; showcaseVideoUrl?: string;
  showcaseTitle?: string; showcaseImageUrl?: string;
  razorpayPaymentLink?: string; razorpayPaymentLinkId?: string;
  ghlConfig?: GHLConfig;
  createdAt: string;
}
interface Enrollment {
  _id: string;
  student?: { _id: string; name: string; email: string; phone?: string };
  user?: { _id: string; name: string; email: string; phone?: string };
  purchasedAt: string; progress?: number; isActive?: boolean;
}

type Tab = 'details' | 'batches' | 'members' | 'razorpay' | 'ghl' | 'showcase';

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  label: { display: 'block', color: '#FF6B8A', fontSize: 12, fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  input: { width: '100%', background: '#111827', border: '1.5px solid #D4003F', borderRadius: 8, color: '#e2e8f0', padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  btn: (c = '#FF1E56') => ({ background: c, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 } as React.CSSProperties),
  card: { background: '#13103a', border: '1.5px solid #D4003F', borderRadius: 12, padding: '16px 18px', marginBottom: 14 },
  row: { display: 'flex', gap: 12, marginBottom: 14 } as React.CSSProperties,
  pill: (c: string, bg: string) => ({ background: bg, color: c, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 10 } as React.CSSProperties),
};

// API base for a given item
const api = (item: Item) =>
  item._type === 'program' ? `/admin-courses/programs/${item._id}` : `/admin-courses/${item._id}`;

// ─── ChipInput ────────────────────────────────────────────────────────────────

const ChipInput: React.FC<{ label: string; values: string[]; onChange: (v: string[]) => void }> = ({ label, values, onChange }) => {
  const [draft, setDraft] = useState('');
  const add = () => { const t = draft.trim(); if (t && !values.includes(t)) onChange([...values, t]); setDraft(''); };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={S.label}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {values.map(v => (
          <span key={v} style={{ background: 'rgba(255,30,86,0.15)', color: '#FF6B8A', border: '1px solid #D4003F', borderRadius: 8, padding: '3px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            {v}
            <button onClick={() => onChange(values.filter(x => x !== v))} style={{ background: 'none', border: 'none', color: '#FF6B8A', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={`Add ${label.toLowerCase()}…`} style={{ ...S.input, flex: 1 }} />
        <button onClick={add} style={S.btn('#D4003F')}>Add</button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const CATEGORIES = ['Advance Hypnosis', 'Hypnosis 2.0', 'Art of shadow work', 'Reiki', 'Akashik'];
const LANGUAGES  = ['Hindi', 'English', 'Tamil', 'Telugu', 'Bengali', 'Marathi'];

const AdminCourseManager: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'program' | 'course' | 'pending'>('all');
  const [selected, setSelected] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateProgram, setShowCreateProgram] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    client.get('/admin-courses').then(r => {
      const { courses = [], programs = [] } = r.data;
      // Programs first, then courses
      setItems([...programs, ...courses]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openItem = async (item: Item) => {
    try {
      const { data } = await client.get(api(item));
      setSelected(data.program ?? data.course);
      setMsg(''); setErr('');
    } catch { setSelected(item); }
  };

  const flash = (m: string, isErr = false) => {
    if (isErr) setErr(m); else setMsg(m);
    setTimeout(() => { setMsg(''); setErr(''); }, 3500);
  };

  const pendingCount = items.filter(i => i._type === 'course' && i.submittedForReview && !i.isPublished).length;

  const filtered = items.filter(item => {
    const ms = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.educator?.name?.toLowerCase().includes(search.toLowerCase()) || item.programId?.includes(search.toLowerCase());
    if (filterType === 'pending') return ms && item._type === 'course' && !!item.submittedForReview && !item.isPublished;
    const mf = filterType === 'all' ? true : item._type === filterType;
    return ms && mf;
  });

  return (
    <div style={{ position: 'relative' }}>
      <div className="adm-sh">
        <div>
          <h2>Course Manager ({items.length})</h2>
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
            {items.filter(i => i._type === 'program').length} programs · {items.filter(i => i._type === 'course').length} courses
            {pendingCount > 0 && <span style={{ color: '#f59e0b', marginLeft: 8, fontWeight: 700 }}>· {pendingCount} pending review</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="adm-btn adm-btn-sm adm-btn-primary" onClick={() => setShowCreate(true)}>
            + New Course
          </button>
          <button className="adm-btn adm-btn-sm" style={{ background: 'rgba(255,30,86,0.2)', color: '#FF6B8A', border: '1.5px solid #D4003F' }} onClick={() => setShowCreateProgram(true)}>
            ⭐ New Program
          </button>
          {(['all', 'pending', 'program', 'course'] as const).map(f => (
            <button key={f} className={`adm-btn adm-btn-sm ${filterType === f ? 'adm-btn-primary' : 'adm-btn-ghost'}`} onClick={() => setFilterType(f)}>
              {f === 'all' ? 'All' : f === 'pending' ? `⏳ Review${pendingCount > 0 ? ` (${pendingCount})` : ''}` : f === 'program' ? '⭐ Programs' : '📚 Courses'}
            </button>
          ))}
          <div className="adm-search" style={{ minWidth: 220 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="adm-loading"><div className="adm-spinner" /><span>Loading…</span></div>
      ) : filtered.length === 0 ? (
        <div className="adm-empty">No items found</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, padding: '16px 0' }}>
          {filtered.map(item => (
            <ItemCard key={item._id} item={item} onManage={() => openItem(item)} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateCoursePanel
          onClose={() => setShowCreate(false)}
          onCreated={course => {
            setItems(prev => [course, ...prev]);
            setShowCreate(false);
            flash('Course created! Open it to add batches, GHL, Razorpay & content.');
          }}
          flash={flash}
        />
      )}

      {showCreateProgram && (
        <CreateProgramPanel
          onClose={() => setShowCreateProgram(false)}
          onCreated={program => {
            setItems(prev => [program, ...prev]);
            setShowCreateProgram(false);
            flash('Program created! Open it to manage batches, members, Razorpay & GHL.');
          }}
          flash={flash}
        />
      )}

      {selected && (
        <ManagementDrawer
          item={selected}
          onClose={() => setSelected(null)}
          onUpdate={updated => {
            setSelected(updated);
            setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
          }}
          onDeleted={id => {
            setItems(prev => prev.filter(i => i._id !== id));
            setSelected(null);
          }}
          flash={flash}
          saving={saving}
          setSaving={setSaving}
        />
      )}

      {(msg || err) && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: err ? '#450a0a' : '#052e16', color: err ? '#f87171' : '#4ade80', border: `1px solid ${err ? '#dc2626' : '#16a34a'}`, borderRadius: 10, padding: '12px 18px', fontSize: 13, fontWeight: 600, zIndex: 9999, maxWidth: 360 }}>
          {err || msg}
        </div>
      )}
    </div>
  );
};

// ─── Item Card ────────────────────────────────────────────────────────────────

const ItemCard: React.FC<{ item: Item; onManage: () => void }> = ({ item, onManage }) => {
  const isProgram = item._type === 'program';
  const priceRs = (item.discountPrice ?? item.price) / 100;

  return (
    <div style={{ background: '#13103a', border: `1.5px solid ${isProgram ? '#D4003F' : '#D4003F'}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 140, background: isProgram ? 'linear-gradient(135deg,#111827,#2e1065)' : '#111827', position: 'relative', overflow: 'hidden' }}>
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
            {isProgram ? '⭐' : '📚'}
          </div>
        )}
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4 }}>
          {isProgram && <span style={S.pill('#FF6B8A', 'rgba(255,30,86,0.5)')}>PROGRAM</span>}
          {!isProgram && item.isPublished && <span style={S.pill('#16a34a', 'rgba(22,163,74,0.25)')}>Live</span>}
          {!isProgram && !item.isPublished && item.submittedForReview && <span style={S.pill('#f59e0b', 'rgba(245,158,11,0.3)')}>⏳ Review</span>}
          {!isProgram && !item.isPublished && !item.submittedForReview && <span style={S.pill('#94a3b8', 'rgba(148,163,184,0.15)')}>Draft</span>}
        </div>
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
          {item.isFeatured && <span style={S.pill('#f59e0b', 'rgba(245,158,11,0.25)')}>⭐</span>}
          {item.showcaseWork && <span style={S.pill('#FF6B8A', 'rgba(167,139,250,0.2)')}>🎬</span>}
        </div>
      </div>
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14, lineHeight: 1.4 }}>{item.title}</div>
        {item.educator && <div style={{ color: '#64748b', fontSize: 12 }}>by {item.educator.name}</div>}
        {isProgram && <div style={{ color: '#FF6B8A', fontSize: 11, fontWeight: 600 }}>ID: {item.programId}</div>}
        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          <span style={{ color: '#FF6B8A', fontWeight: 800, fontSize: 14 }}>
            {priceRs === 0 ? 'Free' : `₹${priceRs.toLocaleString('en-IN')}`}
          </span>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>👥 {item.enrollmentCount || 0}</span>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>🗂 {item.batches?.length || 0}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
          {item.ghlConfig?.isConnected && <span style={{ color: '#16a34a', fontSize: 11, fontWeight: 700 }}>✓ GHL</span>}
          {item.razorpayPaymentLink && <span style={{ color: '#22d3ee', fontSize: 11, fontWeight: 700 }}>✓ Razorpay</span>}
        </div>
        <button onClick={onManage} style={{ ...S.btn('#FF1E56'), marginTop: 'auto', justifyContent: 'center', paddingTop: 10, paddingBottom: 10 }}>
          ⚙️ Manage
        </button>
      </div>
    </div>
  );
};

// ─── Management Drawer ────────────────────────────────────────────────────────

interface DrawerProps {
  item: Item; onClose: () => void; onUpdate: (c: Item) => void;
  onDeleted: (id: string) => void;
  flash: (m: string, isErr?: boolean) => void;
  saving: boolean; setSaving: (v: boolean) => void;
}

const ManagementDrawer: React.FC<DrawerProps> = ({ item, onClose, onUpdate, onDeleted, flash, saving, setSaving }) => {
  const [tab, setTab] = useState<Tab>('details');
  const [pausing, setPausing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isProgram = item._type === 'program';

  const isPaused = isProgram ? !item.isActive : !item.isPublished;

  const togglePause = async () => {
    setPausing(true);
    try {
      const field = isProgram ? 'isActive' : 'isPublished';
      const next  = isPaused; // toggling: if paused, next=true (resume); if live, next=false (pause)
      const { data } = await client.patch(api(item), { [field]: next });
      onUpdate({ ...item, ...(data.program ?? data.course) });
      flash(next ? (isProgram ? 'Program activated!' : 'Course published!') : (isProgram ? 'Program hidden from students.' : 'Course paused (unpublished).'));
    } catch (err: any) { flash(err.response?.data?.message || 'Failed', true); }
    finally { setPausing(false); }
  };

  const handleDelete = async () => {
    const label = isProgram ? 'program' : 'course';
    if (!confirm(`Delete "${item.title}"? This cannot be undone. All enrollments will also be removed.`)) return;
    setDeleting(true);
    try {
      await client.delete(api(item));
      onDeleted(item._id);
      flash(`${label.charAt(0).toUpperCase() + label.slice(1)} deleted.`);
    } catch (err: any) { flash(err.response?.data?.message || 'Delete failed', true); setDeleting(false); }
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'details',  label: '📋 Details'    },
    { key: 'batches',  label: '🗂 Batches'     },
    { key: 'members',  label: '👥 All Members' },
    { key: 'razorpay', label: '💳 Razorpay'   },
    { key: 'ghl',      label: '🔗 GHL'        },
    { key: 'showcase', label: '🎬 Showcase'   },
  ];

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 780, background: '#0f0c2e', borderLeft: '1.5px solid #D4003F', zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.6)' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #D4003F', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20, padding: 0 }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
            {isProgram && <span style={S.pill('#FF6B8A', 'rgba(255,30,86,0.35)')}>PROGRAM</span>}
          </div>
          <div style={{ color: '#64748b', fontSize: 12 }}>
            {isProgram ? `programId: ${item.programId}` : `by ${item.educator?.name || '—'}`}
            {' · '}{item.enrollmentCount || 0} {isProgram ? 'active members' : 'students'}
          </div>
        </div>
        {!isProgram && item.isPublished && (
          <span style={S.pill('#16a34a', 'rgba(22,163,74,0.15)')}>Published</span>
        )}
        {!isProgram && !item.isPublished && item.submittedForReview && (
          <span style={S.pill('#f59e0b', 'rgba(245,158,11,0.15)')}>⏳ Pending Review</span>
        )}
        {!isProgram && !item.isPublished && !item.submittedForReview && (
          <span style={S.pill('#94a3b8', 'rgba(148,163,184,0.1)')}>Draft</span>
        )}
        <button
          onClick={togglePause}
          disabled={pausing}
          title={isPaused ? 'Publish / Resume' : 'Pause / Hide from students'}
          style={{ background: isPaused ? 'rgba(22,163,74,0.15)' : 'rgba(245,158,11,0.15)', color: isPaused ? '#4ade80' : '#fbbf24', border: `1px solid ${isPaused ? 'rgba(22,163,74,0.3)' : 'rgba(245,158,11,0.3)'}`, borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
          {pausing ? '…' : isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Delete permanently"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
          {deleting ? '…' : '🗑 Delete'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 2, padding: '10px 20px 0', borderBottom: '1px solid #111827', flexShrink: 0, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ background: 'none', border: 'none', color: tab === t.key ? '#FF6B8A' : '#64748b', borderBottom: `2px solid ${tab === t.key ? '#FF1E56' : 'transparent'}`, padding: '6px 12px', fontSize: 12, fontWeight: tab === t.key ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {tab === 'details'  && <DetailsTab   item={item}  onUpdate={onUpdate} flash={flash} saving={saving} setSaving={setSaving} />}
        {tab === 'batches'  && <BatchesTab   item={item}  onUpdate={onUpdate} flash={flash} />}
        {tab === 'members'  && <MembersTab   item={item}  />}
        {tab === 'razorpay' && <RazorpayTab  item={item}  onUpdate={onUpdate} flash={flash} />}
        {tab === 'ghl'      && <GHLTab       item={item}  onUpdate={onUpdate} flash={flash} />}
        {tab === 'showcase' && <ShowcaseTab  item={item}  onUpdate={onUpdate} flash={flash} saving={saving} setSaving={setSaving} />}
      </div>
    </div>
  );
};

// ─── Details Tab ──────────────────────────────────────────────────────────────

const DetailsTab: React.FC<{ item: Item; onUpdate: (c: Item) => void; flash: (m: string, e?: boolean) => void; saving: boolean; setSaving: (v: boolean) => void }> = ({ item, onUpdate, flash, saving, setSaving }) => {
  const isProgram = item._type === 'program';
  const [form, setForm] = useState({
    title: item.title, description: item.description,
    category: item.category || '', subcategory: item.subcategory || '',
    language: item.language || 'Hindi', level: item.level || 'beginner',
    price: String((item.price || 0) / 100),
    discountPrice: item.discountPrice ? String(item.discountPrice / 100) : '',
    thumbnail: item.thumbnail || '', previewVideoUrl: item.previewVideoUrl || '',
    isPublished: item.isPublished ?? false, isFeatured: item.isFeatured ?? false,
    globalStartDate: item.globalStartDate ? item.globalStartDate.slice(0, 10) : '',
    // Program-specific
    programType: item.programType || 'certification',
    duration: item.duration || '',
    isActive: item.isActive ?? true,
  });
  const [tags, setTags] = useState(item.tags || []);
  const [features, setFeatures] = useState(item.features || []);
  const [requirements, setRequirements] = useState(item.requirements || []);
  const [objectives, setObjectives] = useState(item.objectives || []);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const payload: any = {
        title: form.title, description: form.description,
        thumbnail: form.thumbnail, previewVideoUrl: form.previewVideoUrl || undefined,
        price: Math.round(parseFloat(form.price || '0') * 100),
        discountPrice: form.discountPrice ? Math.round(parseFloat(form.discountPrice) * 100) : undefined,
      };
      if (!isProgram) {
        payload.category = form.category; payload.subcategory = form.subcategory || undefined;
        payload.language = form.language; payload.level = form.level;
        payload.isPublished = form.isPublished; payload.isFeatured = form.isFeatured;
        payload.globalStartDate = form.globalStartDate || undefined;
        payload.tags = tags; payload.requirements = requirements; payload.objectives = objectives;
      } else {
        payload.language = form.language; payload.level = form.level;
        payload.programType = form.programType; payload.duration = form.duration || undefined;
        payload.isActive = form.isActive;
        payload.tags = tags; payload.features = features;
        payload.requirements = requirements; payload.objectives = objectives;
      }
      const { data } = await client.patch(api(item), payload);
      onUpdate({ ...item, ...(data.program ?? data.course) });
      flash('Details saved!');
    } catch (err: any) { flash(err.response?.data?.message || 'Save failed', true); }
    finally { setSaving(false); }
  };

  return (
    <div>
      {isProgram && (
        <div style={{ background: 'rgba(255,30,86,0.08)', border: '1px solid #D4003F', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#FF6B8A', fontSize: 12 }}>
          ⭐ <strong>Program:</strong> {item.programId} — This is a built-in program with its own dedicated page on the site. You can edit pricing, thumbnail, description, and GHL/Razorpay settings here.
        </div>
      )}

      <div style={S.row}>
        <div style={{ flex: 2 }}>
          <label style={S.label}>Title</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} style={S.input} />
        </div>
        {!isProgram && (
          <div style={{ flex: 1 }}>
            <label style={S.label}>Global Start Date</label>
            <input type="date" value={form.globalStartDate} onChange={e => set('globalStartDate', e.target.value)} style={S.input} />
          </div>
        )}
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={S.label}>Description</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4}
          style={{ ...S.input, resize: 'vertical' }} />
      </div>

      {!isProgram && (
        <div style={S.row}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Category</label>
            <input value={form.category} onChange={e => set('category', e.target.value)} style={S.input} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Sub-category</label>
            <input value={form.subcategory} onChange={e => set('subcategory', e.target.value)} style={S.input} placeholder="Optional" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Level</label>
            <select value={form.level} onChange={e => set('level', e.target.value)} style={{ ...S.input, cursor: 'pointer' }}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Language</label>
            <input value={form.language} onChange={e => set('language', e.target.value)} style={S.input} />
          </div>
        </div>
      )}

      {isProgram && (
        <>
          <div style={S.row}>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Program Type</label>
              <select value={form.programType} onChange={e => set('programType', e.target.value)} style={{ ...S.input, cursor: 'pointer' }}>
                {['certification','workshop','subscription','masterclass','live-program','self-paced','bootcamp'].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace(/-/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Duration</label>
              <input value={form.duration} onChange={e => set('duration', e.target.value)} style={S.input} placeholder="e.g. 6 months / Lifetime" />
            </div>
          </div>
          <div style={S.row}>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Language</label>
              <select value={form.language} onChange={e => set('language', e.target.value)} style={{ ...S.input, cursor: 'pointer' }}>
                {['Hindi','English','Tamil','Telugu','Bengali','Marathi','Gujarati'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Level</label>
              <select value={form.level} onChange={e => set('level', e.target.value)} style={{ ...S.input, cursor: 'pointer' }}>
                {['beginner','intermediate','advanced','all-levels'].map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1).replace(/-/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <ChipInput label="Tags" values={tags} onChange={setTags} />
          <ChipInput label="✅ What's Included / Features" values={features} onChange={setFeatures} />
          <ChipInput label="🎯 Learning Outcomes" values={objectives} onChange={setObjectives} />
          <ChipInput label="📋 Requirements / Who Should Join" values={requirements} onChange={setRequirements} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
            <div onClick={() => set('isActive', !form.isActive)}
              style={{ width: 44, height: 24, borderRadius: 12, background: form.isActive ? '#16a34a' : '#D4003F', position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: form.isActive ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </div>
            <div>
              <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>🟢 Active — Visible on site</div>
              <div style={{ color: '#64748b', fontSize: 11 }}>Toggle off to hide from students while making changes</div>
            </div>
          </label>
        </>
      )}

      <div style={S.row}>
        <div style={{ flex: 1 }}>
          <label style={S.label}>Price (₹)</label>
          <input type="number" value={form.price} onChange={e => set('price', e.target.value)} style={S.input} placeholder="0 for free" min="0" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={S.label}>Discount Price (₹)</label>
          <input type="number" value={form.discountPrice} onChange={e => set('discountPrice', e.target.value)} style={S.input} placeholder="Leave empty if no discount" min="0" />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={S.label}>Thumbnail URL</label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input value={form.thumbnail} onChange={e => set('thumbnail', e.target.value)} style={{ ...S.input, flex: 1 }} placeholder="https://..." />
          {form.thumbnail && <img src={form.thumbnail} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #D4003F', flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={S.label}>Preview Video URL</label>
        <input value={form.previewVideoUrl} onChange={e => set('previewVideoUrl', e.target.value)} style={S.input} placeholder="YouTube or Vimeo URL" />
      </div>

      {!isProgram && (
        <>
          <ChipInput label="Tags" values={tags} onChange={setTags} />
          <ChipInput label="Requirements" values={requirements} onChange={setRequirements} />
          <ChipInput label="Objectives / Outcomes" values={objectives} onChange={setObjectives} />
          <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
            {([{ key: 'isPublished', label: '🟢 Published', color: '#16a34a' }, { key: 'isFeatured', label: '⭐ Featured', color: '#f59e0b' }] as const).map(toggle => (
              <label key={toggle.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#e2e8f0' }}>
                <div onClick={() => set(toggle.key, !(form as any)[toggle.key])}
                  style={{ width: 44, height: 24, borderRadius: 12, background: (form as any)[toggle.key] ? toggle.color : '#D4003F', position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: (form as any)[toggle.key] ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>
                {toggle.label}
              </label>
            ))}
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={save} disabled={saving} style={{ ...S.btn(saving ? '#374151' : '#FF1E56'), padding: '11px 24px', fontSize: 14 }}>
          {saving ? 'Saving…' : '💾 Save Details'}
        </button>
        {!isProgram && !item.isPublished && (
          <PublishButton item={item} onUpdate={onUpdate} flash={flash} />
        )}
      </div>
    </div>
  );
};

// ─── Publish Button ───────────────────────────────────────────────────────────

const PublishButton: React.FC<{ item: Item; onUpdate: (c: Item) => void; flash: (m: string, e?: boolean) => void }> = ({ item, onUpdate, flash }) => {
  const [publishing, setPublishing] = useState(false);

  const publish = async () => {
    if (!confirm(`Publish "${item.title}" now? It will be visible to all students.`)) return;
    setPublishing(true);
    try {
      await client.post(`/courses/${item._id}/publish`);
      onUpdate({ ...item, isPublished: true, submittedForReview: false });
      flash('Course published and live!');
    } catch (err: any) { flash(err.response?.data?.message || 'Publish failed', true); }
    finally { setPublishing(false); }
  };

  return (
    <button onClick={publish} disabled={publishing} style={{ ...S.btn(publishing ? '#374151' : '#16a34a'), padding: '11px 24px', fontSize: 14 }}>
      {publishing ? 'Publishing…' : item.submittedForReview ? '✅ Approve & Publish' : '🚀 Publish Now'}
    </button>
  );
};

// ─── Create Program Panel ─────────────────────────────────────────────────────

const PROGRAM_TYPES = ['certification', 'workshop', 'subscription', 'masterclass', 'live-program', 'self-paced', 'bootcamp'];
const PROG_LANGUAGES = ['Hindi', 'English', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Gujarati'];

const toSlug = (s: string) => s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const CreateProgramPanel: React.FC<{ onClose: () => void; onCreated: (p: Item) => void; flash: (m: string, e?: boolean) => void }> = ({ onClose, onCreated, flash }) => {
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  const [form, setForm] = useState({
    programId: '', title: '', description: '',
    programType: 'certification', duration: '', language: 'Hindi', level: 'beginner', isActive: true,
    thumbnail: '', previewVideoUrl: '',
    price: '0', discountPrice: '',
    showcaseWork: false, showcaseVideoUrl: '', showcaseTitle: '', showcaseImageUrl: '',
    ghlOutboundWebhookUrl: '', ghlApiKey: '', ghlLocationId: '', ghlTagId: '',
    initialBatchName: '', initialBatchStartDate: '', initialBatchMaxStudents: '50',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [ghlHeaders, setGhlHeaders] = useState<{ key: string; value: string }[]>([]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleTitleChange = (v: string) => {
    set('title', v);
    if (!slugEdited) set('programId', toSlug(v));
  };

  const STEPS = ['Identity', 'Media & Content', 'Pricing', 'GHL Setup', 'Showcase + Review'];

  const canNext = [
    form.title.trim().length > 0 && form.programId.trim().length > 0,
    true, true, true, true,
  ];

  const inboundPreviewUrl = form.programId
    ? `https://bshapp.blessingsschoolofhypnosis.com/api/admin-courses/programs/inbound/${toSlug(form.programId)}/[SECRET]`
    : '(generated after creation)';

  const create = async () => {
    setCreating(true);
    try {
      const { data } = await client.post('/admin-courses/programs', {
        ...form,
        price:        Math.round(parseFloat(form.price || '0') * 100),
        discountPrice: form.discountPrice ? Math.round(parseFloat(form.discountPrice) * 100) : undefined,
        tags, features, objectives, requirements,
        ghlCustomHeaders: ghlHeaders.filter(h => h.key && h.value),
        initialBatchName:       form.initialBatchName || undefined,
        initialBatchStartDate:  form.initialBatchStartDate || undefined,
        initialBatchMaxStudents: form.initialBatchMaxStudents ? parseInt(form.initialBatchMaxStudents) : undefined,
      });
      onCreated(data.program);
    } catch (err: any) { flash(err.response?.data?.message || 'Failed to create program', true); }
    finally { setCreating(false); }
  };

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 860, background: '#0d0a2e', borderLeft: '1.5px solid #D4003F', zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 48px rgba(0,0,0,0.7)' }}>
      {/* Header */}
      <div style={{ padding: '16px 22px', borderBottom: '1px solid #D4003F', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'rgba(255,30,86,0.08)' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20, padding: 0 }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>⭐</span>
            <div style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 15 }}>Create New Program</div>
            <span style={S.pill('#FF6B8A', 'rgba(255,30,86,0.35)')}>PROGRAM</span>
          </div>
          <div style={{ color: '#64748b', fontSize: 12 }}>Full configuration — thumbnail, GHL, Razorpay, batches all in one place</div>
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', padding: '0 22px', borderBottom: '1px solid #111827', flexShrink: 0, overflowX: 'auto' }}>
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => i < step && setStep(i)}
            style={{ flex: 1, padding: '10px 4px', background: 'none', border: 'none', borderBottom: `2px solid ${i === step ? '#FF1E56' : i < step ? '#D4003F' : 'transparent'}`, color: i === step ? '#FF6B8A' : i < step ? '#6d4ec4' : '#475569', fontSize: 11, fontWeight: i === step ? 700 : 500, cursor: i < step ? 'pointer' : 'default', whiteSpace: 'nowrap', textAlign: 'center', transition: 'all 0.15s' }}>
            {i < step ? '✓ ' : `${i + 1}. `}{s}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>

        {/* ── Step 0: Identity ── */}
        {step === 0 && (
          <div>
            <div style={{ ...S.card, borderColor: '#D4003F', background: 'rgba(255,30,86,0.05)', marginBottom: 20 }}>
              <div style={{ color: '#FF6B8A', fontSize: 12, lineHeight: 1.7 }}>
                ⭐ <strong>Programs</strong> are premium flagship offerings (like Advance Hypnosis, Hypnosis 2.0) with dedicated pages. The <strong>Program ID</strong> becomes part of the URL and is permanent — choose carefully.
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Program Title *</label>
              <input value={form.title} onChange={e => handleTitleChange(e.target.value)} style={S.input} placeholder="e.g. Advance Reiki Healing Certification" />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Program ID (URL slug) *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={form.programId} onChange={e => { setSlugEdited(true); set('programId', toSlug(e.target.value)); }} style={{ ...S.input, flex: 1, fontFamily: 'monospace', color: '#FF6B8A' }} placeholder="advance-reiki-healing" />
                <button onClick={() => { setSlugEdited(false); set('programId', toSlug(form.title)); }} style={{ ...S.btn('#111827'), fontSize: 11, padding: '6px 12px', whiteSpace: 'nowrap' }}>↺ Auto</button>
              </div>
              <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>
                URL: <code style={{ color: '#FF6B8A' }}>/courses/{form.programId || 'your-slug'}</code> · Used in GHL webhook URL
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Description *</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} style={{ ...S.input, resize: 'vertical' }} placeholder="What makes this program transformational? Who is it for? What will they achieve?" />
            </div>

            <div style={{ ...S.row }}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Program Type</label>
                <select value={form.programType} onChange={e => set('programType', e.target.value)} style={{ ...S.input, cursor: 'pointer' }}>
                  {PROGRAM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace(/-/g, ' ')}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Duration (e.g. "6 months")</label>
                <input value={form.duration} onChange={e => set('duration', e.target.value)} style={S.input} placeholder="6 months / 12 weeks / Lifetime" />
              </div>
            </div>

            <div style={{ ...S.row }}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Language</label>
                <select value={form.language} onChange={e => set('language', e.target.value)} style={{ ...S.input, cursor: 'pointer' }}>
                  {PROG_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Level</label>
                <select value={form.level} onChange={e => set('level', e.target.value)} style={{ ...S.input, cursor: 'pointer' }}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="all-levels">All Levels</option>
                </select>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 4 }}>
              <div onClick={() => set('isActive', !form.isActive)}
                style={{ width: 44, height: 24, borderRadius: 12, background: form.isActive ? '#16a34a' : '#D4003F', position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 3, left: form.isActive ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
              <div>
                <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>🟢 Active — Visible on site</div>
                <div style={{ color: '#64748b', fontSize: 11 }}>Toggle off to hide the program from students while configuring</div>
              </div>
            </label>
          </div>
        )}

        {/* ── Step 1: Media & Content ── */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Thumbnail / Cover Image URL</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input value={form.thumbnail} onChange={e => set('thumbnail', e.target.value)} style={{ ...S.input, flex: 1 }} placeholder="https://..." />
                {form.thumbnail && <img src={form.thumbnail} alt="" style={{ width: 70, height: 46, objectFit: 'cover', borderRadius: 6, border: '1px solid #D4003F', flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Preview / Promo Video URL</label>
              <input value={form.previewVideoUrl} onChange={e => set('previewVideoUrl', e.target.value)} style={S.input} placeholder="YouTube or Vimeo — a short intro or testimonial reel" />
              {form.previewVideoUrl && (
                <div style={{ color: '#FF6B8A', fontSize: 11, marginTop: 4 }}>▶ <a href={form.previewVideoUrl} target="_blank" rel="noreferrer" style={{ color: '#FF6B8A' }}>Preview link</a></div>
              )}
            </div>

            <ChipInput label="Tags (for search & filtering)" values={tags} onChange={setTags} />
            <ChipInput label="✅ What's Included / Features" values={features} onChange={setFeatures} />
            <ChipInput label="🎯 Learning Outcomes / What You'll Achieve" values={objectives} onChange={setObjectives} />
            <ChipInput label="📋 Requirements / Who Should Join" values={requirements} onChange={setRequirements} />
          </div>
        )}

        {/* ── Step 2: Pricing ── */}
        {step === 2 && (
          <div>
            <div style={{ ...S.row }}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Program Price (₹)</label>
                <input type="number" value={form.price} onChange={e => set('price', e.target.value)} style={S.input} placeholder="0 for free" min="0" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Discounted / Offer Price (₹)</label>
                <input type="number" value={form.discountPrice} onChange={e => set('discountPrice', e.target.value)} style={S.input} placeholder="Leave empty if no discount" min="0" />
              </div>
            </div>

            {form.discountPrice && parseFloat(form.price) > parseFloat(form.discountPrice) && (
              <div style={{ ...S.card, borderColor: '#16a34a', background: 'rgba(22,163,74,0.06)', marginBottom: 14 }}>
                <div style={{ color: '#4ade80', fontSize: 13 }}>
                  💰 Saving: ₹{(parseFloat(form.price) - parseFloat(form.discountPrice)).toLocaleString('en-IN')}
                  {' '}({Math.round(((parseFloat(form.price) - parseFloat(form.discountPrice)) / parseFloat(form.price)) * 100)}% off)
                </div>
              </div>
            )}

            <div style={{ ...S.card, marginBottom: 16 }}>
              <div style={{ color: '#64748b', fontSize: 12, marginBottom: 12 }}>Quick price templates</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[['Free', '0'], ['₹999', '999'], ['₹1999', '1999'], ['₹4999', '4999'], ['₹9999', '9999'], ['₹14999', '14999'], ['₹19999', '19999'], ['₹29999', '29999'], ['₹49999', '49999']].map(([label, price]) => (
                  <button key={label} onClick={() => set('price', price)}
                    style={{ ...S.btn(form.price === price ? '#FF1E56' : '#111827'), fontSize: 12 }}>{label}</button>
                ))}
              </div>
            </div>

            <div style={{ ...S.card, borderColor: '#1e3a5f' }}>
              <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>ℹ️ After creation you can</div>
              <ul style={{ color: '#94a3b8', fontSize: 12, lineHeight: 2, paddingLeft: 18, margin: 0 }}>
                <li>Go to the <strong style={{ color: '#e2e8f0' }}>Razorpay tab</strong> to generate a shareable payment link at this price</li>
                <li>Razorpay link auto-uses the discounted price if set, otherwise full price</li>
                <li>Change the price any time — regenerate the Razorpay link to update</li>
              </ul>
            </div>
          </div>
        )}

        {/* ── Step 3: GHL Setup ── */}
        {step === 3 && (
          <div>
            <div style={{ ...S.card, borderColor: '#1e3a5f', background: 'rgba(30,58,95,0.15)', marginBottom: 18 }}>
              <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>🔗 GoHighLevel (GHL) Integration</div>
              <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.8 }}>
                <strong style={{ color: '#e2e8f0' }}>Outbound:</strong> BSH fires your GHL webhook when a student enrolls in this program.<br />
                <strong style={{ color: '#e2e8f0' }}>Inbound:</strong> GHL calls BSH to auto-grant access when a contact is tagged in GHL. Unique secret URL is generated on creation.
              </div>
            </div>

            <div style={{ ...S.card, background: 'rgba(22,163,74,0.04)', borderColor: 'rgba(22,163,74,0.2)', marginBottom: 18 }}>
              <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 12, marginBottom: 6 }}>📥 Inbound Webhook URL (preview)</div>
              <div style={{ color: '#64748b', fontSize: 11, wordBreak: 'break-all', fontFamily: 'monospace' }}>{inboundPreviewUrl}</div>
              <div style={{ color: '#64748b', fontSize: 11, marginTop: 6 }}>The <code>[SECRET]</code> part will be a unique random token generated when you create the program. Paste this URL in GHL → Automations → Webhook action.</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>📤 GHL Outbound Webhook URL</label>
              <input value={form.ghlOutboundWebhookUrl} onChange={e => set('ghlOutboundWebhookUrl', e.target.value)} style={S.input} placeholder="https://hooks.goHighLevel.com/hooks/..." />
              <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>BSH POSTs enrollment data here when a student joins. From GHL → Settings → Integrations → Custom Webhooks.</div>
            </div>

            <div style={{ ...S.row }}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>GHL API Key (optional)</label>
                <input type="password" value={form.ghlApiKey} onChange={e => set('ghlApiKey', e.target.value)} style={S.input} placeholder="sk_..." />
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>GHL Location ID</label>
                <input value={form.ghlLocationId} onChange={e => set('ghlLocationId', e.target.value)} style={S.input} placeholder="Location ID from GHL settings" />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>GHL Tag ID (applied on enrollment)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={form.ghlTagId} onChange={e => set('ghlTagId', e.target.value)} style={{ ...S.input, flex: 1 }} placeholder={`e.g. bsh-enrolled-${form.programId || 'your-program'}`} />
                {form.programId && (
                  <button onClick={() => set('ghlTagId', `bsh-enrolled-${form.programId}`)} style={{ ...S.btn('#111827'), fontSize: 11, whiteSpace: 'nowrap' }}>↺ Auto-fill</button>
                )}
              </div>
              <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>This tag is added to the GHL contact record when a student enrolls. Must match the tag in your GHL workflow.</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={S.label}>Custom HTTP Headers (optional)</label>
                <button onClick={() => setGhlHeaders(h => [...h, { key: '', value: '' }])} style={{ ...S.btn('#111827'), fontSize: 11, padding: '4px 10px' }}>+ Add Header</button>
              </div>
              {ghlHeaders.length === 0 && <div style={{ color: '#475569', fontSize: 12 }}>No custom headers — add if your GHL endpoint requires auth headers.</div>}
              {ghlHeaders.map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input value={h.key} onChange={e => setGhlHeaders(prev => prev.map((x, idx) => idx === i ? { ...x, key: e.target.value } : x))} style={{ ...S.input, flex: 1 }} placeholder="Header name (e.g. Authorization)" />
                  <input value={h.value} onChange={e => setGhlHeaders(prev => prev.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))} style={{ ...S.input, flex: 2 }} placeholder="Value" />
                  <button onClick={() => setGhlHeaders(prev => prev.filter((_, idx) => idx !== i))} style={{ ...S.btn('#450a0a'), padding: '6px 10px', fontSize: 16 }}>×</button>
                </div>
              ))}
            </div>

            <div style={{ ...S.card, borderColor: '#1e3a5f' }}>
              <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: 12, marginBottom: 8 }}>📦 Payload BSH sends to GHL on enrollment</div>
              <pre style={{ color: '#4ade80', fontSize: 11, margin: 0, overflowX: 'auto' }}>{JSON.stringify({ event: 'enrollment', programId: form.programId || 'your-program-id', programTitle: form.title || 'Program Title', tagId: form.ghlTagId || 'bsh-enrolled-...', contact: { email: 'student@example.com', name: 'Student Name', phone: '+91 XXXXXXXXXX' }, enrolledAt: new Date().toISOString() }, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* ── Step 4: Showcase + Initial Batch + Review ── */}
        {step === 4 && (
          <div>
            {/* Showcase */}
            <div style={{ ...S.card, marginBottom: 16 }}>
              <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🎬 Homepage Showcase</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: form.showcaseWork ? 16 : 0 }}>
                <div onClick={() => set('showcaseWork', !form.showcaseWork)}
                  style={{ width: 48, height: 26, borderRadius: 13, background: form.showcaseWork ? '#FF1E56' : '#D4003F', position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: form.showcaseWork ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>
                <div>
                  <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>⭐ Feature as Best Work on Homepage</div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Shows a showcase section on the home page highlighting this program</div>
                </div>
              </label>
              {form.showcaseWork && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={S.label}>Showcase Headline</label><input value={form.showcaseTitle} onChange={e => set('showcaseTitle', e.target.value)} style={S.input} placeholder="e.g. Transform Your Life in 6 Months" /></div>
                  <div>
                    <label style={S.label}>Showcase Video (student testimonial / demo)</label>
                    <input value={form.showcaseVideoUrl} onChange={e => set('showcaseVideoUrl', e.target.value)} style={S.input} placeholder="YouTube / Vimeo URL" />
                    {form.showcaseVideoUrl && <div style={{ color: '#FF6B8A', fontSize: 11, marginTop: 4 }}>▶ <a href={form.showcaseVideoUrl} target="_blank" rel="noreferrer" style={{ color: '#FF6B8A' }}>Preview</a></div>}
                  </div>
                  <div>
                    <label style={S.label}>Showcase Feature Image</label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input value={form.showcaseImageUrl} onChange={e => set('showcaseImageUrl', e.target.value)} style={{ ...S.input, flex: 1 }} placeholder="https://..." />
                      {form.showcaseImageUrl && <img src={form.showcaseImageUrl} alt="" style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 6, border: '1px solid #D4003F' }} onError={e => (e.currentTarget.style.display = 'none')} />}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Initial batch */}
            <div style={{ ...S.card, marginBottom: 16 }}>
              <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>🗂 Initial Batch (optional)</div>
              <div style={{ color: '#64748b', fontSize: 12, marginBottom: 14 }}>Create the first batch right now — you can always add more later from the Batches tab.</div>
              <div style={{ ...S.row }}>
                <div style={{ flex: 2 }}><label style={S.label}>Batch Name</label><input value={form.initialBatchName} onChange={e => set('initialBatchName', e.target.value)} style={S.input} placeholder="e.g. Batch 1 — July 2026" /></div>
                <div style={{ flex: 1 }}><label style={S.label}>Start Date</label><input type="date" value={form.initialBatchStartDate} onChange={e => set('initialBatchStartDate', e.target.value)} style={S.input} /></div>
                <div style={{ flex: 1 }}><label style={S.label}>Max Students</label><input type="number" value={form.initialBatchMaxStudents} onChange={e => set('initialBatchMaxStudents', e.target.value)} style={S.input} min="1" /></div>
              </div>
            </div>

            {/* Review summary */}
            <div style={{ ...S.card }}>
              <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📋 Review Summary</div>
              {[
                ['Program ID', form.programId || '—'],
                ['Title', form.title || '—'],
                ['Type', form.programType],
                ['Duration', form.duration || '—'],
                ['Language', form.language],
                ['Level', form.level],
                ['Price', form.price === '0' ? 'Free' : `₹${form.price}${form.discountPrice ? ` → ₹${form.discountPrice}` : ''}`],
                ['Tags', tags.length ? `${tags.length} tags` : '—'],
                ['Features', features.length ? `${features.length} items` : '—'],
                ['Outcomes', objectives.length ? `${objectives.length} items` : '—'],
                ['GHL Webhook', form.ghlOutboundWebhookUrl || '—'],
                ['GHL Tag', form.ghlTagId || '—'],
                ['Showcase', form.showcaseWork ? '✅ Yes' : 'No'],
                ['Initial Batch', form.initialBatchName || 'None'],
                ['Status', form.isActive ? '🟢 Active' : '🔴 Hidden'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid #111827' }}>
                  <span style={{ color: '#64748b', fontSize: 12, minWidth: 110 }}>{k}</span>
                  <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600, flex: 1, wordBreak: 'break-all' }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ ...S.card, borderColor: '#0f766e', background: 'rgba(15,118,110,0.05)', marginTop: 14 }}>
              <div style={{ color: '#2dd4bf', fontSize: 12, lineHeight: 1.8 }}>
                ✅ After creating, open the program to:<br />
                • <strong>Batches</strong> — add students directly by email with instant access grant<br />
                • <strong>Razorpay</strong> — generate a shareable payment link<br />
                • <strong>GHL</strong> — copy the inbound webhook URL to paste in GHL<br />
                • <strong>Details</strong> — edit any field, update pricing, toggle active status<br />
                • <strong>Showcase</strong> — feature on the home page with video + image
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid #D4003F', display: 'flex', justifyContent: 'space-between', flexShrink: 0, background: 'rgba(255,30,86,0.04)' }}>
        {step > 0 ? (
          <button onClick={() => setStep(s => s - 1)} style={S.btn('#111827')}>← Back</button>
        ) : (
          <button onClick={onClose} style={S.btn('#111827')}>Cancel</button>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ color: '#475569', fontSize: 12, alignSelf: 'center' }}>{step + 1} / {STEPS.length}</span>
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext[step]}
              style={S.btn(!canNext[step] ? '#374151' : '#FF1E56')}>
              Next →
            </button>
          ) : (
            <button onClick={create} disabled={creating || !form.title || !form.programId}
              style={{ ...S.btn(creating ? '#374151' : '#FF1E56'), padding: '10px 28px', fontSize: 14 }}>
              {creating ? 'Creating…' : '⭐ Create Program'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Create Course Panel ──────────────────────────────────────────────────────

const CreateCoursePanel: React.FC<{ onClose: () => void; onCreated: (c: Item) => void; flash: (m: string, e?: boolean) => void }> = ({ onClose, onCreated, flash }) => {
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: 'Advance Hypnosis', subcategory: '',
    language: 'Hindi', level: 'beginner',
    price: '0', discountPrice: '',
    thumbnail: '', previewVideoUrl: '',
    isPublished: false, isFeatured: false,
    globalStartDate: '',
    educatorEmail: '',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const STEPS = ['Basic Info', 'Content Details', 'Pricing & Settings', 'Review & Create'];

  const canNext = [
    form.title.trim().length > 0 && form.description.trim().length > 0,
    true,
    true,
    true,
  ];

  const create = async () => {
    setCreating(true);
    try {
      const { data } = await client.post('/admin-courses', {
        ...form,
        price: Math.round(parseFloat(form.price || '0') * 100),
        discountPrice: form.discountPrice ? Math.round(parseFloat(form.discountPrice) * 100) : undefined,
        subcategory: form.subcategory || undefined,
        previewVideoUrl: form.previewVideoUrl || undefined,
        globalStartDate: form.globalStartDate || undefined,
        educatorEmail: form.educatorEmail || undefined,
        tags, requirements, objectives,
      });
      onCreated(data.course);
    } catch (err: any) { flash(err.response?.data?.message || 'Failed to create course', true); }
    finally { setCreating(false); }
  };

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 820, background: '#0f0c2e', borderLeft: '1.5px solid #D4003F', zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.6)' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #D4003F', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20, padding: 0 }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 15 }}>+ Create New Course</div>
          <div style={{ color: '#64748b', fontSize: 12 }}>Admin-created course — full control, publish immediately or keep as draft</div>
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', padding: '12px 20px 0', borderBottom: '1px solid #111827', flexShrink: 0 }}>
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => i < step && setStep(i)}
            style={{ flex: 1, padding: '6px 4px', background: 'none', border: 'none', borderBottom: `2px solid ${i === step ? '#FF1E56' : i < step ? '#D4003F' : 'transparent'}`, color: i === step ? '#FF6B8A' : i < step ? '#FF1E56' : '#64748b', fontSize: 11, fontWeight: i === step ? 700 : 500, cursor: i < step ? 'pointer' : 'default', whiteSpace: 'nowrap', textAlign: 'center' }}>
            {i < step ? '✓ ' : ''}{s}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {step === 0 && (
          <div>
            <div style={{ ...S.card, borderColor: '#D4003F', marginBottom: 20 }}>
              <div style={{ color: '#FF6B8A', fontSize: 12 }}>📌 This creates a course shell with full admin control. The educator can then add chapters & lessons in their editor. You can publish it immediately or keep it as draft.</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Course Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} style={S.input} placeholder="e.g. Advanced Hypnosis Certification" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Description *</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} style={{ ...S.input, resize: 'vertical' }} placeholder="What will students learn? What makes this course special?" />
            </div>
            <div style={{ ...S.row }}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} style={{ ...S.input, cursor: 'pointer' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Sub-category (optional)</label>
                <input value={form.subcategory} onChange={e => set('subcategory', e.target.value)} style={S.input} placeholder="e.g. Stage Hypnosis" />
              </div>
            </div>
            <div style={{ ...S.row }}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Language</label>
                <select value={form.language} onChange={e => set('language', e.target.value)} style={{ ...S.input, cursor: 'pointer' }}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Level</label>
                <select value={form.level} onChange={e => set('level', e.target.value)} style={{ ...S.input, cursor: 'pointer' }}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Educator Email (optional — assign to educator, leave blank to assign to your account)</label>
              <input value={form.educatorEmail} onChange={e => set('educatorEmail', e.target.value)} style={S.input} placeholder="educator@example.com" type="email" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Thumbnail URL</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input value={form.thumbnail} onChange={e => set('thumbnail', e.target.value)} style={{ ...S.input, flex: 1 }} placeholder="https://..." />
                {form.thumbnail && <img src={form.thumbnail} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #D4003F', flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Preview Video URL (optional)</label>
              <input value={form.previewVideoUrl} onChange={e => set('previewVideoUrl', e.target.value)} style={S.input} placeholder="YouTube or Vimeo link" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Global Start Date (optional)</label>
              <input type="date" value={form.globalStartDate} onChange={e => set('globalStartDate', e.target.value)} style={S.input} />
            </div>
            <ChipInput label="Tags" values={tags} onChange={setTags} />
            <ChipInput label="What students will learn (Objectives)" values={objectives} onChange={setObjectives} />
            <ChipInput label="Requirements / Prerequisites" values={requirements} onChange={setRequirements} />
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ ...S.row }}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Price (₹)</label>
                <input type="number" value={form.price} onChange={e => set('price', e.target.value)} style={S.input} placeholder="0 for free" min="0" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Discount Price (₹, optional)</label>
                <input type="number" value={form.discountPrice} onChange={e => set('discountPrice', e.target.value)} style={S.input} placeholder="Leave empty if no discount" min="0" />
              </div>
            </div>
            <div style={{ ...S.card, marginBottom: 16 }}>
              <div style={{ color: '#64748b', fontSize: 12, marginBottom: 12 }}>Quick price templates</div>
              {[['Free', '0'], ['₹499', '499'], ['₹999', '999'], ['₹1999', '1999'], ['₹4999', '4999'], ['₹9999', '9999']].map(([label, price]) => (
                <button key={label} onClick={() => set('price', price)} style={{ ...S.btn(form.price === price ? '#FF1E56' : '#111827'), margin: '0 6px 6px 0', fontSize: 12 }}>{label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
              {([
                { key: 'isPublished', label: '🚀 Publish Immediately', color: '#16a34a', desc: 'Students can see and enroll right away' },
                { key: 'isFeatured', label: '⭐ Feature on Homepage', color: '#f59e0b', desc: 'Shown in the featured section' },
              ] as const).map(t => (
                <label key={t.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <div onClick={() => set(t.key, !(form as any)[t.key])}
                    style={{ width: 44, height: 24, borderRadius: 12, background: (form as any)[t.key] ? t.color : '#D4003F', position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0, marginTop: 2 }}>
                    <div style={{ position: 'absolute', top: 3, left: (form as any)[t.key] ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </div>
                  <div>
                    <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>{t.label}</div>
                    <div style={{ color: '#64748b', fontSize: 11 }}>{t.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ ...S.card }}>
              <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Course Summary</div>
              {[
                ['Title', form.title],
                ['Category', `${form.category}${form.subcategory ? ' → ' + form.subcategory : ''}`],
                ['Language', form.language],
                ['Level', form.level],
                ['Price', form.price === '0' ? 'Free' : `₹${form.price}${form.discountPrice ? ` (Discount: ₹${form.discountPrice})` : ''}`],
                ['Educator', form.educatorEmail || 'Assigned to admin account'],
                ['Tags', tags.join(', ') || '—'],
                ['Objectives', objectives.length ? `${objectives.length} added` : '—'],
                ['Requirements', requirements.length ? `${requirements.length} added` : '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #111827' }}>
                  <span style={{ color: '#64748b', fontSize: 13, minWidth: 110 }}>{k}</span>
                  <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, flex: 1 }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
                <span style={{ ...S.pill(form.isPublished ? '#16a34a' : '#94a3b8', form.isPublished ? 'rgba(22,163,74,0.15)' : 'rgba(148,163,184,0.1)'), fontSize: 12, padding: '4px 10px' }}>{form.isPublished ? '🚀 Will be Published' : '📝 Will be Draft'}</span>
                {form.isFeatured && <span style={{ ...S.pill('#f59e0b', 'rgba(245,158,11,0.15)'), fontSize: 12, padding: '4px 10px' }}>⭐ Featured</span>}
              </div>
            </div>
            <div style={{ ...S.card, borderColor: '#0f766e', background: 'rgba(15,118,110,0.05)', marginTop: 14 }}>
              <div style={{ color: '#2dd4bf', fontSize: 12 }}>
                ✅ After creating, open the course to:<br />
                • Go to <strong>Batches</strong> to set start dates and add members<br />
                • Go to <strong>Razorpay</strong> to generate a payment link<br />
                • Go to <strong>GHL</strong> to connect GoHighLevel automation<br />
                • Go to <strong>Showcase</strong> to feature it on the home page<br />
                • Use the Course Editor to add chapters and lessons
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '16px 24px', borderTop: '1px solid #D4003F', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
        {step > 0 ? (
          <button onClick={() => setStep(s => s - 1)} style={S.btn('#111827')}>← Back</button>
        ) : (
          <button onClick={onClose} style={S.btn('#111827')}>Cancel</button>
        )}
        {step < 3 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canNext[step]}
            style={S.btn(!canNext[step] ? '#374151' : '#FF1E56')}>
            Next →
          </button>
        ) : (
          <button onClick={create} disabled={creating} style={{ ...S.btn(creating ? '#374151' : '#16a34a'), padding: '10px 28px', fontSize: 14 }}>
            {creating ? 'Creating…' : '✨ Create Course'}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Batches Tab ──────────────────────────────────────────────────────────────

const BatchesTab: React.FC<{ item: Item; onUpdate: (c: Item) => void; flash: (m: string, e?: boolean) => void }> = ({ item, onUpdate, flash }) => {
  const [newBatch, setNewBatch] = useState({ name: '', startDate: '', maxStudents: '50' });
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', startDate: '', maxStudents: '' });
  const [memberEmail, setMemberEmail] = useState<Record<string, string>>({});
  const [addingMember, setAddingMember] = useState<string | null>(null);
  const base = api(item);

  const addBatch = async () => {
    if (!newBatch.name.trim()) return;
    setAdding(true);
    try {
      const { data } = await client.post(`${base}/batches`, { name: newBatch.name, startDate: newBatch.startDate || undefined, maxStudents: parseInt(newBatch.maxStudents) || 50 });
      onUpdate({ ...item, batches: data.batches });
      setNewBatch({ name: '', startDate: '', maxStudents: '50' });
      flash('Batch added!');
    } catch (err: any) { flash(err.response?.data?.message || 'Failed', true); }
    finally { setAdding(false); }
  };

  const deleteBatch = async (batchId: string) => {
    if (!confirm('Delete this batch?')) return;
    try {
      await client.delete(`${base}/batches/${batchId}`);
      onUpdate({ ...item, batches: item.batches.filter(b => b._id !== batchId) });
      flash('Batch removed');
    } catch (err: any) { flash(err.response?.data?.message || 'Failed', true); }
  };

  const saveBatch = async (batchId: string) => {
    try {
      const { data } = await client.patch(`${base}/batches/${batchId}`, { name: editForm.name, startDate: editForm.startDate || undefined, maxStudents: parseInt(editForm.maxStudents) || 50 });
      onUpdate({ ...item, batches: data.batches });
      setEditId(null); flash('Batch updated!');
    } catch (err: any) { flash(err.response?.data?.message || 'Failed', true); }
  };

  const addMember = async (batchId: string) => {
    const email = memberEmail[batchId]?.trim();
    if (!email) return;
    setAddingMember(batchId);
    try {
      await client.post(`${base}/batches/${batchId}/members`, { email });
      const { data } = await client.get(base);
      onUpdate({ ...item, ...(data.program ?? data.course) });
      setMemberEmail(m => ({ ...m, [batchId]: '' }));
      flash('Member added & access granted!');
    } catch (err: any) { flash(err.response?.data?.message || 'Failed', true); }
    finally { setAddingMember(null); }
  };

  const removeMember = async (batchId: string, userId: string) => {
    try {
      await client.delete(`${base}/batches/${batchId}/members/${userId}`);
      onUpdate({ ...item, batches: item.batches.map(b => b._id === batchId ? { ...b, members: b.members.filter(m => m._id !== userId) } : b) });
      flash('Member removed');
    } catch (err: any) { flash(err.response?.data?.message || 'Failed', true); }
  };

  return (
    <div>
      <div style={S.card}>
        <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>➕ Add New Batch</div>
        <div style={S.row}>
          <div style={{ flex: 2 }}><label style={S.label}>Batch Name</label><input value={newBatch.name} onChange={e => setNewBatch(f => ({ ...f, name: e.target.value }))} style={S.input} placeholder="e.g. Batch 1 — June 2026" /></div>
          <div style={{ flex: 1 }}><label style={S.label}>Start Date</label><input type="date" value={newBatch.startDate} onChange={e => setNewBatch(f => ({ ...f, startDate: e.target.value }))} style={S.input} /></div>
          <div style={{ flex: 1 }}><label style={S.label}>Max Students</label><input type="number" value={newBatch.maxStudents} onChange={e => setNewBatch(f => ({ ...f, maxStudents: e.target.value }))} style={S.input} min="1" /></div>
        </div>
        <button onClick={addBatch} disabled={adding || !newBatch.name.trim()} style={S.btn(adding ? '#374151' : '#FF1E56')}>{adding ? 'Adding…' : '+ Add Batch'}</button>
      </div>

      {item.batches.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: 32 }}>No batches yet.</div>
      ) : item.batches.map(batch => (
        <div key={batch._id} style={{ ...S.card, borderColor: editId === batch._id ? '#FF1E56' : '#D4003F' }}>
          {editId === batch._id ? (
            <>
              <div style={S.row}>
                <div style={{ flex: 2 }}><label style={S.label}>Name</label><input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={S.input} /></div>
                <div style={{ flex: 1 }}><label style={S.label}>Start Date</label><input type="date" value={editForm.startDate} onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))} style={S.input} /></div>
                <div style={{ flex: 1 }}><label style={S.label}>Max</label><input type="number" value={editForm.maxStudents} onChange={e => setEditForm(f => ({ ...f, maxStudents: e.target.value }))} style={S.input} /></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => saveBatch(batch._id)} style={S.btn('#16a34a')}>✓ Save</button>
                <button onClick={() => setEditId(null)} style={S.btn('#374151')}>Cancel</button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>{batch.name}</div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 3 }}>
                  {batch.startDate ? `Starts: ${new Date(batch.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'No start date set'}
                  {' · '}{batch.members.length} / {batch.maxStudents} members
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => { setEditId(batch._id); setEditForm({ name: batch.name, startDate: batch.startDate?.slice(0, 10) || '', maxStudents: String(batch.maxStudents) }); }} style={S.btn('#111827')}>✏️</button>
                <button onClick={() => deleteBatch(batch._id)} style={S.btn('#450a0a')}>🗑</button>
              </div>
            </div>
          )}

          {batch.members.length > 0 && (
            <div style={{ marginTop: 14, borderTop: '1px solid #111827', paddingTop: 12 }}>
              <div style={{ color: '#FF6B8A', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>MEMBERS ({batch.members.length})</div>
              {batch.members.map(m => (
                <div key={m._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#111827', borderRadius: 8, padding: '6px 10px', marginBottom: 4 }}>
                  <div><span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{m.name}</span><span style={{ color: '#64748b', fontSize: 12, marginLeft: 8 }}>{m.email}</span></div>
                  <button onClick={() => removeMember(batch._id, m._id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <input value={memberEmail[batch._id] || ''} onChange={e => setMemberEmail(m => ({ ...m, [batch._id]: e.target.value }))}
              placeholder="Add member by email…" style={{ ...S.input, flex: 1 }}
              onKeyDown={e => e.key === 'Enter' && addMember(batch._id)} />
            <button onClick={() => addMember(batch._id)} disabled={addingMember === batch._id} style={S.btn(addingMember === batch._id ? '#374151' : '#FF1E56')}>
              {addingMember === batch._id ? '…' : '+ Add'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Members Tab ──────────────────────────────────────────────────────────────

const MembersTab: React.FC<{ item: Item }> = ({ item }) => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    client.get(`${api(item)}/enrollments`)
      .then(r => setEnrollments(r.data.enrollments || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, [item._id]);

  const getName = (e: Enrollment) => e.student?.name || e.user?.name || '—';
  const getEmail = (e: Enrollment) => e.student?.email || e.user?.email || '';
  const getPhone = (e: Enrollment) => e.student?.phone || e.user?.phone || '';

  const filtered = enrollments.filter(e => {
    const n = getName(e).toLowerCase(); const em = getEmail(e).toLowerCase();
    return !search || n.includes(search.toLowerCase()) || em.includes(search.toLowerCase());
  });

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#e2e8f0', fontWeight: 700 }}>Total: {enrollments.length}</div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ ...S.input, width: 220 }} />
      </div>
      {loading ? <div style={{ textAlign: 'center', color: '#64748b', padding: 32 }}>Loading…</div>
      : filtered.length === 0 ? <div style={{ textAlign: 'center', color: '#64748b', padding: 32 }}>No members found</div>
      : filtered.map(e => (
        <div key={e._id} style={{ background: '#13103a', border: '1px solid #111827', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 13 }}>{getName(e)}</div>
            <div style={{ color: '#64748b', fontSize: 12 }}>{getEmail(e)}{getPhone(e) && ` · ${getPhone(e)}`}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {e.progress !== undefined && <div style={{ color: '#FF6B8A', fontSize: 12 }}>{e.progress}%</div>}
            {e.isActive !== undefined && <div style={S.pill(e.isActive ? '#16a34a' : '#94a3b8', 'transparent')}>{e.isActive ? 'Active' : 'Inactive'}</div>}
            <div style={{ color: '#64748b', fontSize: 11 }}>{new Date(e.purchasedAt).toLocaleDateString('en-IN')}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Razorpay Tab ─────────────────────────────────────────────────────────────

const RazorpayTab: React.FC<{ item: Item; onUpdate: (c: Item) => void; flash: (m: string, e?: boolean) => void }> = ({ item, onUpdate, flash }) => {
  const [generating, setGenerating] = useState(false);
  const priceRs = (item.discountPrice ?? item.price) / 100;

  const generate = async () => {
    setGenerating(true);
    try {
      const { data } = await client.post(`${api(item)}/razorpay-link`);
      onUpdate({ ...item, razorpayPaymentLink: data.link, razorpayPaymentLinkId: data.linkId });
      flash('Payment link created!');
    } catch (err: any) { flash(err.response?.data?.message || 'Failed', true); }
    finally { setGenerating(false); }
  };

  return (
    <div>
      <div style={S.card}>
        <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>💳 Razorpay Payment Link</div>
        <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
          <div><div style={{ color: '#64748b', fontSize: 12 }}>Charge Price</div><div style={{ color: '#FF6B8A', fontWeight: 800, fontSize: 22 }}>₹{priceRs.toLocaleString('en-IN')}</div></div>
          {item.discountPrice && <div><div style={{ color: '#64748b', fontSize: 12 }}>Original</div><div style={{ color: '#64748b', fontSize: 16, textDecoration: 'line-through' }}>₹{(item.price / 100).toLocaleString('en-IN')}</div></div>}
        </div>
        {item.razorpayPaymentLink ? (
          <div>
            <label style={S.label}>Shareable Link</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input readOnly value={item.razorpayPaymentLink} style={{ ...S.input, flex: 1, color: '#22d3ee' }} />
              <button onClick={() => { navigator.clipboard.writeText(item.razorpayPaymentLink!); flash('Copied!'); }} style={S.btn('#111827')}>📋</button>
              <a href={item.razorpayPaymentLink} target="_blank" rel="noreferrer"><button type="button" style={S.btn('#111827')}>↗</button></a>
            </div>
          </div>
        ) : (
          <div style={{ background: 'rgba(255,30,86,0.08)', border: '1px dashed #D4003F', borderRadius: 10, padding: 16, marginBottom: 16, color: '#64748b', fontSize: 13 }}>No payment link yet.</div>
        )}
        <button onClick={generate} disabled={generating || !priceRs} style={S.btn(generating ? '#374151' : '#FF1E56')}>
          {generating ? 'Generating…' : item.razorpayPaymentLink ? '🔄 Regenerate' : '✨ Generate Payment Link'}
        </button>
      </div>
    </div>
  );
};

// ─── GHL Tab ──────────────────────────────────────────────────────────────────

const GHLTab: React.FC<{ item: Item; onUpdate: (c: Item) => void; flash: (m: string, e?: boolean) => void }> = ({ item, onUpdate, flash }) => {
  const ghl = item.ghlConfig || {};
  const [form, setForm] = useState({ outboundWebhookUrl: ghl.outboundWebhookUrl || '', apiKey: ghl.apiKey || '', locationId: ghl.locationId || '', tagId: ghl.tagId || '' });
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>(ghl.customHeaders || []);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const isProgram = item._type === 'program';

  const inboundUrl = ghl.inboundSecret
    ? isProgram
      ? `https://bshapp.blessingsschoolofhypnosis.com/api/admin-courses/programs/inbound/${item.programId}/${ghl.inboundSecret}`
      : `https://bshapp.blessingsschoolofhypnosis.com/api/admin-courses/inbound/${item._id}/${ghl.inboundSecret}`
    : null;

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await client.patch(`${api(item)}/ghl`, { ...form, customHeaders: headers.filter(h => h.key && h.value) });
      onUpdate({ ...item, ghlConfig: data.ghlConfig });
      flash('GHL settings saved!');
    } catch (err: any) { flash(err.response?.data?.message || 'Save failed', true); }
    finally { setSaving(false); }
  };

  const testWebhook = async () => {
    setTesting(true);
    try {
      const { data } = await client.post(`${api(item)}/ghl/test`);
      flash(`✓ ${data.message}`);
      onUpdate({ ...item, ghlConfig: { ...item.ghlConfig, isConnected: true, lastTestedAt: new Date().toISOString() } });
    } catch (err: any) { flash(err.response?.data?.message || 'Test failed', true); }
    finally { setTesting(false); }
  };

  return (
    <div>
      <div style={{ ...S.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: ghl.isConnected ? '#16a34a' : '#94a3b8' }} />
          <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{ghl.isConnected ? 'GHL Connected' : 'Not Connected'}</span>
        </div>
        {ghl.lastTestedAt && <span style={{ color: '#64748b', fontSize: 12 }}>Tested: {new Date(ghl.lastTestedAt).toLocaleString('en-IN')}</span>}
      </div>

      {inboundUrl ? (
        <div style={{ ...S.card, background: 'rgba(22,163,74,0.05)', borderColor: 'rgba(22,163,74,0.25)' }}>
          <div style={{ color: '#4ade80', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>📥 BSH Inbound Webhook (paste this in GHL)</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <input readOnly value={inboundUrl} style={{ ...S.input, flex: 1, fontSize: 11, color: '#4ade80' }} />
            <button onClick={() => { navigator.clipboard.writeText(inboundUrl); flash('Copied!'); }} style={S.btn('#111827')}>📋</button>
          </div>
          {isProgram && ghl.tagId && <div style={{ color: '#64748b', fontSize: 12 }}>GHL Tag: <code style={{ background: '#0f172a', padding: '1px 6px', borderRadius: 4 }}>{ghl.tagId}</code></div>}
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>When GHL calls this URL with a student's email, BSH auto-grants access to this {isProgram ? 'program' : 'course'}.</div>
        </div>
      ) : (
        <div style={{ ...S.card, borderColor: '#D4003F' }}><div style={{ color: '#FF6B8A', fontSize: 13 }}>💡 Save once to generate your unique inbound webhook URL.</div></div>
      )}

      <div style={S.card}>
        <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📤 Outbound: BSH → GHL</div>
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>GHL Webhook / HTTP Action URL</label>
          <input value={form.outboundWebhookUrl} onChange={e => setForm(f => ({ ...f, outboundWebhookUrl: e.target.value }))} style={S.input} placeholder="https://hooks.goHighLevel.com/..." />
        </div>
        <div style={S.row}>
          <div style={{ flex: 1 }}><label style={S.label}>GHL API Key (optional)</label><input type="password" value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} style={S.input} placeholder="sk_..." /></div>
          <div style={{ flex: 1 }}><label style={S.label}>Location ID</label><input value={form.locationId} onChange={e => setForm(f => ({ ...f, locationId: e.target.value }))} style={S.input} placeholder="GHL Location ID" /></div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>GHL Tag ID on Enrollment</label>
          <input value={form.tagId} onChange={e => setForm(f => ({ ...f, tagId: e.target.value }))} style={S.input} placeholder={isProgram ? `e.g. bsh-enrolled-${item.programId}` : 'Tag applied when student enrolls'} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={S.label}>Custom Headers</label>
            <button onClick={() => setHeaders(h => [...h, { key: '', value: '' }])} style={{ ...S.btn('#111827'), fontSize: 11, padding: '4px 10px' }}>+ Add</button>
          </div>
          {headers.length === 0 && <div style={{ color: '#64748b', fontSize: 12 }}>No custom headers.</div>}
          {headers.map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={h.key} onChange={e => setHeaders(prev => prev.map((x, idx) => idx === i ? { ...x, key: e.target.value } : x))} style={{ ...S.input, flex: 1 }} placeholder="Header name" />
              <input value={h.value} onChange={e => setHeaders(prev => prev.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))} style={{ ...S.input, flex: 2 }} placeholder="Header value" />
              <button onClick={() => setHeaders(prev => prev.filter((_, idx) => idx !== i))} style={{ ...S.btn('#450a0a'), padding: '6px 10px', fontSize: 16 }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={save} disabled={saving} style={S.btn(saving ? '#374151' : '#FF1E56')}>{saving ? 'Saving…' : '💾 Save GHL Settings'}</button>
          {form.outboundWebhookUrl && <button onClick={testWebhook} disabled={testing} style={S.btn(testing ? '#374151' : '#0f766e')}>{testing ? 'Testing…' : '🧪 Test Webhook'}</button>}
        </div>
      </div>

      <div style={{ ...S.card, borderColor: '#1e3a5f' }}>
        <button onClick={() => setGuideOpen(g => !g)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0 }}>
          📖 How to Connect GHL {guideOpen ? '▲' : '▼'}
        </button>
        {guideOpen && (
          <div style={{ marginTop: 14, color: '#94a3b8', fontSize: 12, lineHeight: 1.9 }}>
            <div style={{ color: '#60a5fa', fontWeight: 700, marginBottom: 6 }}>Option A — GHL calls BSH (student gets auto-enrolled)</div>
            <ol style={{ paddingLeft: 20, margin: '0 0 14px' }}>
              <li>Save settings once to generate the BSH Inbound Webhook URL (shown above in green).</li>
              <li>In GHL → Automations → + New Workflow → set trigger (Form Submitted / Tag Added / etc.).</li>
              <li>Add Action: <strong style={{ color: '#e2e8f0' }}>Webhook</strong> → paste the BSH URL.</li>
              <li>Map field: <code style={{ background: '#0f172a', padding: '1px 4px', borderRadius: 4 }}>email</code> = contact email.</li>
              <li>Save & Publish. BSH will auto-grant access when GHL fires the webhook.</li>
            </ol>
            <div style={{ color: '#60a5fa', fontWeight: 700, marginBottom: 6 }}>Option B — BSH calls GHL (notify GHL on BSH purchase)</div>
            <ol style={{ paddingLeft: 20, margin: '0 0 14px' }}>
              <li>In GHL → Settings → Integrations → Custom Webhooks, create an endpoint.</li>
              <li>Copy that URL, paste it in the "GHL Webhook URL" field above.</li>
              <li>Add Authorization header if needed. Click Test Webhook.</li>
              <li>When a student buys this {isProgram ? 'program' : 'course'} on BSH Healers, GHL receives their data.</li>
            </ol>
            <div style={{ background: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 8, padding: 12 }}>
              <div style={{ color: '#60a5fa', fontWeight: 700, marginBottom: 6 }}>📦 Payload sent to GHL</div>
              <pre style={{ color: '#4ade80', fontSize: 11, margin: 0 }}>{JSON.stringify({ event: 'enrollment', [isProgram ? 'programId' : 'courseId']: isProgram ? item.programId : item._id, title: item.title, contact: { email: 'student@example.com', name: 'Student Name' }, enrolledAt: new Date().toISOString() }, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Showcase Tab ─────────────────────────────────────────────────────────────

const ShowcaseTab: React.FC<{ item: Item; onUpdate: (c: Item) => void; flash: (m: string, e?: boolean) => void; saving: boolean; setSaving: (v: boolean) => void }> = ({ item, onUpdate, flash, saving, setSaving }) => {
  const [form, setForm] = useState({ showcaseWork: item.showcaseWork || false, showcaseVideoUrl: item.showcaseVideoUrl || '', showcaseTitle: item.showcaseTitle || '', showcaseImageUrl: item.showcaseImageUrl || '' });

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await client.patch(api(item), form);
      onUpdate({ ...item, ...(data.program ?? data.course) });
      flash('Showcase settings saved!');
    } catch (err: any) { flash(err.response?.data?.message || 'Save failed', true); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={S.card}>
        <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🎬 Best Work / Showcase</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 20 }}>
          <div onClick={() => setForm(f => ({ ...f, showcaseWork: !f.showcaseWork }))}
            style={{ width: 52, height: 28, borderRadius: 14, background: form.showcaseWork ? '#FF1E56' : '#D4003F', position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 4, left: form.showcaseWork ? 28 : 4, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </div>
          <div>
            <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>⭐ Show as Best Work</div>
            <div style={{ color: '#64748b', fontSize: 12 }}>Feature in the showcase section of the home page</div>
          </div>
        </label>
        {form.showcaseWork && (
          <>
            <div style={{ marginBottom: 14 }}><label style={S.label}>Showcase Title</label><input value={form.showcaseTitle} onChange={e => setForm(f => ({ ...f, showcaseTitle: e.target.value }))} style={S.input} placeholder="Benefit-focused headline" /></div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Showcase Video URL</label>
              <input value={form.showcaseVideoUrl} onChange={e => setForm(f => ({ ...f, showcaseVideoUrl: e.target.value }))} style={S.input} placeholder="YouTube / Vimeo — student testimonial or demo" />
              {form.showcaseVideoUrl && <div style={{ color: '#FF6B8A', fontSize: 12, marginTop: 4 }}>▶ <a href={form.showcaseVideoUrl} target="_blank" rel="noreferrer" style={{ color: '#FF6B8A' }}>Preview</a></div>}
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Featured Image URL</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input value={form.showcaseImageUrl} onChange={e => setForm(f => ({ ...f, showcaseImageUrl: e.target.value }))} style={{ ...S.input, flex: 1 }} placeholder="https://..." />
                {form.showcaseImageUrl && <img src={form.showcaseImageUrl} alt="" style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 6, border: '1px solid #D4003F', flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />}
              </div>
            </div>
          </>
        )}
        <button onClick={save} disabled={saving} style={{ ...S.btn(saving ? '#374151' : '#FF1E56'), padding: '11px 24px', fontSize: 14 }}>{saving ? 'Saving…' : '💾 Save'}</button>
      </div>
    </div>
  );
};

export default AdminCourseManager;
