import React, { useEffect, useRef, useState } from 'react';
import client from '../../api/client';

interface UpcomingClass {
  _id: string;
  title: string;
  educatorName: string;
  scheduledAt: string;
  status: 'upcoming' | 'live' | 'ended';
  thumbnailUrl?: string;
  ctaLink: string;
  isActive: boolean;
  order: number;
  createdAt: string;
}

const EMPTY_FORM = {
  title: '',
  educatorName: '',
  scheduledAt: '',
  status: 'upcoming' as 'upcoming' | 'live' | 'ended',
  ctaLink: '/(tabs)/live',
  order: 0,
  isActive: true,
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const countdown = (scheduledAt: string, status: string) => {
  if (status === 'live') return { label: '🔴 LIVE NOW', color: '#ef4444' };
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff <= 0) return { label: 'STARTING NOW', color: '#ef4444' };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h < 24) return { label: `IN ${h}h ${m}m`, color: '#7c3aed' };
  const d = Math.floor(diff / 86400000);
  return { label: `IN ${d} DAY${d > 1 ? 'S' : ''}`, color: '#7c3aed' };
};

const AdminUpcomingClasses: React.FC = () => {
  const [classes, setClasses]       = useState<UpcomingClass[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<UpcomingClass | null>(null);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [saving, setSaving]         = useState(false);
  const [err, setErr]               = useState('');

  // Thumbnail upload
  const fileInputRef                = useRef<HTMLInputElement>(null);
  const uploadingForId              = useRef<string | null>(null);
  const [uploadingId, setUploadingId]         = useState<string | null>(null);
  const [thumbUrlInputId, setThumbUrlInputId] = useState<string | null>(null);
  const [thumbUrlDraft, setThumbUrlDraft]     = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/upcoming-classes/admin');
      setClasses(data.classes ?? []);
    } catch { setClasses([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setForm({ ...EMPTY_FORM, scheduledAt: now.toISOString().slice(0, 16) });
    setErr('');
    setModalOpen(true);
  };

  const openEdit = (c: UpcomingClass) => {
    setEditing(c);
    const local = new Date(c.scheduledAt);
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    setForm({
      title:        c.title,
      educatorName: c.educatorName,
      scheduledAt:  local.toISOString().slice(0, 16),
      status:       c.status,
      ctaLink:      c.ctaLink,
      order:        c.order,
      isActive:     c.isActive,
    });
    setErr('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setErr('Title is required'); return; }
    if (!form.scheduledAt)  { setErr('Date & time is required'); return; }
    setSaving(true); setErr('');
    try {
      const payload = { ...form, order: Number(form.order) || 0 };
      if (editing) {
        await client.put(`/upcoming-classes/${editing._id}`, payload);
      } else {
        await client.post('/upcoming-classes', payload);
      }
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Save failed');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this class?')) return;
    await client.delete(`/upcoming-classes/${id}`);
    await load();
  };

  const handleToggle = async (id: string) => {
    await client.patch(`/upcoming-classes/${id}/toggle`);
    setClasses(prev => prev.map(c => c._id === id ? { ...c, isActive: !c.isActive } : c));
  };

  // Thumbnail file upload — converts to base64 JSON to avoid multipart issues
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id   = uploadingForId.current;
    if (!file || !id) return;
    e.target.value = '';
    setUploadingId(id);
    try {
      const token = localStorage.getItem('accessToken') || '';

      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      const res = await fetch(`/api/upcoming-classes/${id}/thumbnail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ imageBase64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);

      setClasses(prev => prev.map(c => c._id === id ? { ...c, thumbnailUrl: data.thumbnailUrl } : c));
    } catch (e: any) {
      alert('Upload failed: ' + e.message);
    }
    setUploadingId(null);
  };

  const handleThumbUrlSave = async (id: string) => {
    await client.patch(`/upcoming-classes/${id}/thumbnail-url`, { thumbnailUrl: thumbUrlDraft });
    setClasses(prev => prev.map(c => c._id === id ? { ...c, thumbnailUrl: thumbUrlDraft } : c));
    setThumbUrlInputId(null);
    setThumbUrlDraft('');
  };

  const statusColor = (s: string) =>
    s === 'live' ? '#ef4444' : s === 'ended' ? '#6b7280' : '#7c3aed';

  return (
    <div style={{ padding: '0 0 40px' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, color:'#f5f3ff' }}>Starting Soon — Upcoming Classes</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#9ca3af' }}>
            These portrait cards appear in the "Starting Soon" carousel on the mobile home screen with a live countdown timer.
          </p>
        </div>
        <button onClick={openCreate} style={btnStyle('#7c3aed')}>+ Add Class</button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFileChange} />

      {loading ? (
        <p style={{ color:'#9ca3af' }}>Loading…</p>
      ) : classes.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'#6b7280' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📅</div>
          <p>No upcoming classes yet. Click <strong>+ Add Class</strong> to create one.</p>
        </div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ backgroundColor:'#1e1b4b', color:'#c4b5fd' }}>
                {['#','Title / Educator','Scheduled','Countdown','Thumbnail','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classes.map((c, idx) => {
                const cd = countdown(c.scheduledAt, c.status);
                return (
                  <tr key={c._id} style={{ borderBottom:'1px solid #2d2b52', verticalAlign:'top' }}>

                    <td style={{ padding:'12px 14px', color:'#9ca3af', width:36 }}>{idx + 1}</td>

                    <td style={{ padding:'12px 14px', maxWidth:220 }}>
                      <div style={{ fontWeight:700, color:'#f5f3ff', marginBottom:2 }}>
                        {c.title.length > 44 ? c.title.slice(0, 44) + '…' : c.title}
                      </div>
                      {c.educatorName && (
                        <div style={{ fontSize:11, color:'#a78bfa' }}>👤 {c.educatorName}</div>
                      )}
                      <div style={{ fontSize:10, color:'#4b5563', marginTop:3 }}>Order: {c.order}</div>
                    </td>

                    <td style={{ padding:'12px 14px', whiteSpace:'nowrap', color:'#d1d5db', fontSize:12 }}>
                      {fmtDate(c.scheduledAt)}
                    </td>

                    <td style={{ padding:'12px 14px', whiteSpace:'nowrap' }}>
                      <span style={{ fontWeight:800, fontSize:12, color: cd.color }}>{cd.label}</span>
                    </td>

                    <td style={{ padding:'12px 14px', minWidth:160 }}>
                      {c.thumbnailUrl ? (
                        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                          <img src={c.thumbnailUrl} alt="thumb"
                            style={{ width:80, height:110, objectFit:'cover', borderRadius:8, border:'1px solid #2d2b52' }} />
                          <div style={{ display:'flex', gap:4 }}>
                            <button onClick={() => { uploadingForId.current = c._id; fileInputRef.current?.click(); }}
                              style={smallBtn('#374151')} disabled={uploadingId === c._id}>
                              {uploadingId === c._id ? '⏳' : '⟳ Replace'}
                            </button>
                            <button onClick={() => { setThumbUrlInputId(c._id); setThumbUrlDraft(c.thumbnailUrl || ''); }}
                              style={smallBtn('#374151')}>🔗</button>
                          </div>
                        </div>
                      ) : uploadingId === c._id ? (
                        <span style={{ color:'#9ca3af', fontSize:12 }}>⏳ Uploading…</span>
                      ) : thumbUrlInputId === c._id ? (
                        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                          <input value={thumbUrlDraft} onChange={e => setThumbUrlDraft(e.target.value)}
                            placeholder="Paste image URL…" style={inputSm} />
                          <div style={{ display:'flex', gap:4 }}>
                            <button onClick={() => handleThumbUrlSave(c._id)} style={smallBtn('#7c3aed')}>Save</button>
                            <button onClick={() => setThumbUrlInputId(null)} style={smallBtn('#374151')}>✕</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                          <button onClick={() => { uploadingForId.current = c._id; fileInputRef.current?.click(); }}
                            style={smallBtn('#7c3aed')}>📁 Upload Image</button>
                          <button onClick={() => { setThumbUrlInputId(c._id); setThumbUrlDraft(''); }}
                            style={smallBtn('#374151')}>🔗 Paste URL</button>
                        </div>
                      )}
                    </td>

                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {/* Status badge */}
                        <span style={{ display:'inline-block', backgroundColor: statusColor(c.status) + '22',
                          color: statusColor(c.status), borderRadius:12, padding:'2px 10px', fontSize:11, fontWeight:700, width:'fit-content' }}>
                          {c.status.toUpperCase()}
                        </span>
                        {/* Active toggle */}
                        <button onClick={() => handleToggle(c._id)} style={{
                          padding:'3px 10px', borderRadius:16, border:'none', cursor:'pointer', fontSize:11, fontWeight:700, width:'fit-content',
                          backgroundColor: c.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)',
                          color: c.isActive ? '#22c55e' : '#6b7280',
                        }}>
                          {c.isActive ? '● Visible' : '○ Hidden'}
                        </button>
                      </div>
                    </td>

                    <td style={{ padding:'12px 14px', whiteSpace:'nowrap' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => openEdit(c)} style={smallBtn('#7c3aed')}>✏️ Edit</button>
                        <button onClick={() => handleDelete(c._id)} style={smallBtn('#ef4444')}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div style={overlay} onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div style={modal}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ margin:0, color:'#f5f3ff', fontSize:18 }}>
                {editing ? 'Edit Upcoming Class' : 'Add Upcoming Class'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background:'none', border:'none', color:'#9ca3af', fontSize:22, cursor:'pointer' }}>×</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

              <div style={{ gridColumn:'1/-1' }}>
                <label style={label}>Class Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Introduction to Hypnotherapy" style={input} />
              </div>

              <div>
                <label style={label}>Educator / Host Name</label>
                <input value={form.educatorName} onChange={e => setForm(f => ({ ...f, educatorName: e.target.value }))}
                  placeholder="Dr. Pradeep Kumar" style={input} />
              </div>

              <div>
                <label style={label}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                  style={{ ...input }}>
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live Now</option>
                  <option value="ended">Ended</option>
                </select>
              </div>

              <div style={{ gridColumn:'1/-1' }}>
                <label style={label}>Scheduled Date & Time *</label>
                <input type="datetime-local" value={form.scheduledAt}
                  onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} style={input} />
                <p style={{ margin:'4px 0 0', fontSize:11, color:'#6b7280' }}>
                  The countdown timer on the card auto-calculates from this date.
                </p>
              </div>

              <div>
                <label style={label}>Tap destination (CTA link)</label>
                <input value={form.ctaLink} onChange={e => setForm(f => ({ ...f, ctaLink: e.target.value }))}
                  placeholder="/(tabs)/live" style={input} />
              </div>

              <div>
                <label style={label}>Display Order (lower = first)</label>
                <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                  style={input} min={0} />
              </div>

              <div style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', gap:8 }}>
                <input type="checkbox" id="isActiveChk" checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  style={{ width:16, height:16, accentColor:'#7c3aed' }} />
                <label htmlFor="isActiveChk" style={{ ...label, margin:0 }}>Visible on mobile</label>
              </div>
            </div>

            {err && <p style={{ color:'#f87171', marginTop:12, fontSize:13 }}>{err}</p>}

            {!editing && (
              <p style={{ color:'#6b7280', fontSize:12, marginTop:12 }}>
                After saving, upload a thumbnail image from the table row.
              </p>
            )}

            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
              <button onClick={() => setModalOpen(false)} style={btnStyle('#374151')}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={btnStyle('#7c3aed')}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Class'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const btnStyle = (bg: string): React.CSSProperties => ({
  padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
  backgroundColor: bg, color: '#fff', fontWeight: 700, fontSize: 13,
});

const smallBtn = (bg: string): React.CSSProperties => ({
  padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
  backgroundColor: bg, color: '#fff', fontSize: 11, fontWeight: 600,
});

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};

const modal: React.CSSProperties = {
  backgroundColor: '#13103a', borderRadius: 14, border: '1px solid #2d2b52',
  padding: '28px 28px 24px', width: '100%', maxWidth: 620, maxHeight: '90vh',
  overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
};

const label: React.CSSProperties = {
  display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 600,
  color: '#a78bfa', letterSpacing: '0.04em',
};

const input: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid #374151', backgroundColor: '#1a1740',
  color: '#f5f3ff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

const inputSm: React.CSSProperties = { ...input, padding: '6px 10px', fontSize: 12 };

export default AdminUpcomingClasses;
