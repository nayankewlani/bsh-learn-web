import React, { useEffect, useRef, useState } from 'react';
import client from '../../api/client';

interface HeroBanner {
  _id: string;
  title: string;
  superTitle: string;
  educatorName: string;
  badgeText: string;
  badgeBg: string;
  showTimer: boolean;
  timerEndsAt?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  ctaLink: string;
  isActive: boolean;
  order: number;
  createdAt: string;
}

const EMPTY_FORM = {
  title: '',
  superTitle: 'WITH EXPERT HEALERS',
  educatorName: '',
  badgeText: '',
  badgeBg: '#7c3aed',
  showTimer: false,
  timerEndsAt: '',
  ctaLink: '',
  order: 0,
  isActive: true,
};

const AdminHeroBanners: React.FC = () => {
  const [banners, setBanners]         = useState<HeroBanner[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState<HeroBanner | null>(null);
  const [form, setForm]               = useState({ ...EMPTY_FORM });
  const [saving, setSaving]           = useState(false);
  const [err, setErr]                 = useState('');

  // Video upload
  const fileInputRef                  = useRef<HTMLInputElement>(null);
  const uploadingForId                = useRef<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [videoUrlInputId, setVideoUrlInputId] = useState<string | null>(null);
  const [videoUrlDraft, setVideoUrlDraft]     = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/hero-banners/admin');
      setBanners(data.banners ?? []);
    } catch { setBanners([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setErr('');
    setModalOpen(true);
  };

  const openEdit = (b: HeroBanner) => {
    setEditing(b);
    setForm({
      title:        b.title,
      superTitle:   b.superTitle,
      educatorName: b.educatorName,
      badgeText:    b.badgeText,
      badgeBg:      b.badgeBg,
      showTimer:    b.showTimer,
      timerEndsAt:  b.timerEndsAt ? b.timerEndsAt.slice(0, 16) : '',
      ctaLink:      b.ctaLink,
      order:        b.order,
      isActive:     b.isActive,
    });
    setErr('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setErr('Title is required'); return; }
    setSaving(true);
    setErr('');
    try {
      const payload = {
        ...form,
        showTimer: form.showTimer,
        timerEndsAt: form.showTimer && form.timerEndsAt ? form.timerEndsAt : undefined,
        order: Number(form.order) || 0,
      };
      if (editing) {
        await client.put(`/hero-banners/${editing._id}`, payload);
      } else {
        await client.post('/hero-banners', payload);
      }
      setModalOpen(false);
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Save failed');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this banner?')) return;
    await client.delete(`/hero-banners/${id}`);
    await load();
  };

  const handleToggle = async (id: string) => {
    await client.patch(`/hero-banners/${id}/toggle`);
    setBanners(prev => prev.map(b => b._id === id ? { ...b, isActive: !b.isActive } : b));
  };

  // Video upload — file
  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id   = uploadingForId.current;
    if (!file || !id) return;
    e.target.value = '';
    setUploadingId(id);
    try {
      const token = localStorage.getItem('accessToken') || '';
      const form  = new FormData();
      form.append('video', file);
      const url = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/hero-banners/${id}/video`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText).videoUrl); }
            catch { reject(new Error('Invalid server response')); }
          } else {
            try { const b = JSON.parse(xhr.responseText); reject(new Error(b.message || `HTTP ${xhr.status}`)); }
            catch { reject(new Error(`Upload failed: HTTP ${xhr.status}`)); }
          }
        };
        xhr.onerror   = () => reject(new Error('Network error'));
        xhr.ontimeout = () => reject(new Error('Upload timed out'));
        xhr.timeout   = 300_000;
        xhr.send(form);
      });
      setBanners(prev => prev.map(b => b._id === id ? { ...b, videoUrl: url } : b));
    } catch (e: any) {
      alert('Video upload failed: ' + e.message);
    }
    setUploadingId(null);
  };

  const handleVideoUrlSave = async (id: string) => {
    await client.patch(`/hero-banners/${id}/video-url`, { videoUrl: videoUrlDraft });
    setBanners(prev => prev.map(b => b._id === id ? { ...b, videoUrl: videoUrlDraft } : b));
    setVideoUrlInputId(null);
    setVideoUrlDraft('');
  };

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

  return (
    <div style={{ padding: '0 0 40px' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, color:'#f5f3ff' }}>Hero Banner Videos</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#9ca3af' }}>
            Videos uploaded here appear in the full-bleed hero carousel on the mobile home screen.
          </p>
        </div>
        <button onClick={openCreate} style={btnStyle('#7c3aed')}>+ Add Banner</button>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="video/*" style={{ display:'none' }} onChange={handleVideoFileChange} />

      {/* Table */}
      {loading ? (
        <p style={{ color:'#9ca3af' }}>Loading…</p>
      ) : banners.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'#6b7280' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🎬</div>
          <p>No hero banners yet. Click <strong>+ Add Banner</strong> to create the first one.</p>
        </div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ backgroundColor:'#1e1b4b', color:'#c4b5fd' }}>
                {['#','Title / Text','Timer','Video','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {banners.map((b, idx) => (
                <tr key={b._id} style={{ borderBottom:'1px solid #2d2b52', verticalAlign:'top' }}>

                  {/* Order */}
                  <td style={{ padding:'12px 14px', color:'#9ca3af', width:40 }}>{idx + 1}</td>

                  {/* Title / text preview */}
                  <td style={{ padding:'12px 14px', maxWidth:280 }}>
                    <div style={{ fontWeight:700, color:'#f5f3ff', marginBottom:2 }} title={b.title}>
                      {b.title.length > 48 ? b.title.slice(0, 48) + '…' : b.title}
                    </div>
                    {b.educatorName && (
                      <div style={{ fontSize:11, color:'#a78bfa', marginBottom:2 }}>👤 {b.educatorName}</div>
                    )}
                    {b.superTitle && (
                      <div style={{ fontSize:10, color:'#6b7280', letterSpacing:'0.08em' }}>{b.superTitle}</div>
                    )}
                    {b.badgeText && (
                      <span style={{ display:'inline-block', marginTop:4, backgroundColor: b.badgeBg + '33', color: b.badgeBg, borderRadius:6, padding:'2px 8px', fontSize:10, fontWeight:700 }}>
                        {b.badgeText}
                      </span>
                    )}
                    <div style={{ fontSize:10, color:'#4b5563', marginTop:4 }}>Order: {b.order} · {fmtDate(b.createdAt)}</div>
                  </td>

                  {/* Timer */}
                  <td style={{ padding:'12px 14px', whiteSpace:'nowrap' }}>
                    {b.showTimer ? (
                      <div>
                        <span style={{ color:'#f59e0b', fontWeight:700, fontSize:12 }}>⏱ ON</span>
                        <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>
                          {b.timerEndsAt ? fmtDate(b.timerEndsAt) : 'No end date'}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color:'#4b5563', fontSize:12 }}>—</span>
                    )}
                  </td>

                  {/* Video */}
                  <td style={{ padding:'12px 14px', minWidth:180 }}>
                    {b.videoUrl ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                        <video src={b.videoUrl} style={{ width:120, height:68, objectFit:'cover', borderRadius:6, border:'1px solid #2d2b52' }} muted />
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={() => { uploadingForId.current = b._id; fileInputRef.current?.click(); }}
                            style={smallBtn('#374151')} disabled={uploadingId === b._id}>
                            {uploadingId === b._id ? '⏳' : '⟳ Replace'}
                          </button>
                          <button onClick={() => { setVideoUrlInputId(b._id); setVideoUrlDraft(b.videoUrl || ''); }}
                            style={smallBtn('#374151')}>🔗 URL</button>
                        </div>
                      </div>
                    ) : uploadingId === b._id ? (
                      <span style={{ color:'#9ca3af', fontSize:12 }}>⏳ Uploading…</span>
                    ) : videoUrlInputId === b._id ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                        <input value={videoUrlDraft} onChange={e => setVideoUrlDraft(e.target.value)}
                          placeholder="Paste video URL…" style={inputSm} />
                        <div style={{ display:'flex', gap:4 }}>
                          <button onClick={() => handleVideoUrlSave(b._id)} style={smallBtn('#7c3aed')}>Save</button>
                          <button onClick={() => setVideoUrlInputId(null)} style={smallBtn('#374151')}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                        <button onClick={() => { uploadingForId.current = b._id; fileInputRef.current?.click(); }}
                          style={smallBtn('#7c3aed')}>📁 Upload Video</button>
                        <button onClick={() => { setVideoUrlInputId(b._id); setVideoUrlDraft(''); }}
                          style={smallBtn('#374151')}>🔗 Paste URL</button>
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td style={{ padding:'12px 14px' }}>
                    <button onClick={() => handleToggle(b._id)} style={{
                      padding:'4px 12px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
                      backgroundColor: b.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)',
                      color: b.isActive ? '#22c55e' : '#6b7280',
                    }}>
                      {b.isActive ? '● Active' : '○ Hidden'}
                    </button>
                  </td>

                  {/* Actions */}
                  <td style={{ padding:'12px 14px', whiteSpace:'nowrap' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => openEdit(b)} style={smallBtn('#7c3aed')}>✏️ Edit</button>
                      <button onClick={() => handleDelete(b._id)} style={smallBtn('#ef4444')}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div style={overlay} onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div style={modal}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ margin:0, color:'#f5f3ff', fontSize:18 }}>{editing ? 'Edit Banner' : 'New Hero Banner'}</h3>
              <button onClick={() => setModalOpen(false)} style={{ background:'none', border:'none', color:'#9ca3af', fontSize:22, cursor:'pointer' }}>×</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={label}>Main Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Unlock the Power of Hypnosis" style={input} />
              </div>

              <div>
                <label style={label}>Super-title (small text above title)</label>
                <input value={form.superTitle} onChange={e => setForm(f => ({ ...f, superTitle: e.target.value }))}
                  placeholder="WITH EXPERT HEALERS" style={input} />
              </div>

              <div>
                <label style={label}>Educator / Host Name</label>
                <input value={form.educatorName} onChange={e => setForm(f => ({ ...f, educatorName: e.target.value }))}
                  placeholder="Dr. Pradeep Kumar" style={input} />
              </div>

              <div>
                <label style={label}>Badge Text (shown on pill)</label>
                <input value={form.badgeText} onChange={e => setForm(f => ({ ...f, badgeText: e.target.value }))}
                  placeholder="e.g. LIVE NOW  or  STARTS TOMORROW" style={input} />
              </div>

              <div>
                <label style={label}>Badge Colour</label>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <input type="color" value={form.badgeBg} onChange={e => setForm(f => ({ ...f, badgeBg: e.target.value }))}
                    style={{ width:40, height:36, padding:2, border:'1px solid #374151', borderRadius:6, cursor:'pointer', background:'none' }} />
                  <input value={form.badgeBg} onChange={e => setForm(f => ({ ...f, badgeBg: e.target.value }))}
                    style={{ ...input, flex:1 }} />
                </div>
              </div>

              {/* Timer toggle */}
              <div style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:8, backgroundColor:'#1e1b4b', border:'1px solid #2d2b52' }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', userSelect:'none', flex:1 }}>
                  <input type="checkbox" checked={form.showTimer} onChange={e => setForm(f => ({ ...f, showTimer: e.target.checked }))}
                    style={{ width:16, height:16, accentColor:'#7c3aed' }} />
                  <span style={{ color:'#c4b5fd', fontWeight:600 }}>Show countdown timer</span>
                  <span style={{ color:'#6b7280', fontSize:12 }}>(overrides Badge Text with live countdown)</span>
                </label>
              </div>

              {form.showTimer && (
                <div style={{ gridColumn:'1/-1' }}>
                  <label style={label}>Timer ends at</label>
                  <input type="datetime-local" value={form.timerEndsAt}
                    onChange={e => setForm(f => ({ ...f, timerEndsAt: e.target.value }))} style={input} />
                </div>
              )}

              <div>
                <label style={label}>Tap destination (CTA link)</label>
                <input value={form.ctaLink} onChange={e => setForm(f => ({ ...f, ctaLink: e.target.value }))}
                  placeholder="e.g. /(tabs)/live  or  /program/hypnosis-2" style={input} />
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
                <label htmlFor="isActiveChk" style={{ ...label, margin:0 }}>Active (visible on mobile)</label>
              </div>
            </div>

            {err && <p style={{ color:'#f87171', marginTop:12, fontSize:13 }}>{err}</p>}

            {!editing && (
              <p style={{ color:'#6b7280', fontSize:12, marginTop:12, lineHeight:1.5 }}>
                After saving, upload a video from the table row using the <strong>📁 Upload Video</strong> button.
              </p>
            )}

            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
              <button onClick={() => setModalOpen(false)} style={btnStyle('#374151')}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={btnStyle('#7c3aed')}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Style helpers ─────────────────────────────────────────────────────────────

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
  padding: '28px 28px 24px', width: '100%', maxWidth: 680, maxHeight: '90vh',
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

const inputSm: React.CSSProperties = {
  ...input, padding: '6px 10px', fontSize: 12,
};

export default AdminHeroBanners;
