import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import type { AdminLiveClass, AdminLivePermission } from '../../api/admin';
import { adminGetLiveClasses, adminApproveLiveClass, adminGetRecordingManifestUrl } from '../../api/admin';
import client from '../../api/client';

const fmtDate = (d: string) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Derive type label from live class fields
function classType(c: AdminLiveClass): { label: string; color: string; bg: string } {
  if ((c.maxParticipants ?? 500) <= 2) return { label: '👤 1:1 Session', color: '#0891b2', bg: 'rgba(8,145,178,0.12)' };
  if (c.course)                        return { label: '📚 Course Live',  color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' };
  return                                      { label: '🌍 Free Live',    color: '#16a34a', bg: 'rgba(22,163,74,0.12)' };
}

const AdminLiveClasses: React.FC = () => {
  const [tab, setTab]            = useState<'classes' | 'permissions'>('classes');

  // Scheduled classes
  const [classes, setClasses]    = useState<AdminLiveClass[]>([]);
  const [loading, setLoading]    = useState(true);
  const [search, setSearch]      = useState('');
  const [filter, setFilter]      = useState<'pending' | 'all' | 'live' | 'upcoming' | 'past'>('pending');
  const [actionId, setActionId]     = useState<string | null>(null);
  const [watchingId, setWatchingId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef   = useRef<Hls | null>(null);

  // Hero video upload state
  const [uploadingVideoId, setUploadingVideoId] = useState<string | null>(null);
  const [videoUrlInputId,  setVideoUrlInputId]  = useState<string | null>(null);
  const [videoUrlDraft,    setVideoUrlDraft]     = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const uploadingForId = React.useRef<string | null>(null);

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id   = uploadingForId.current;
    if (!file || !id) return;
    setUploadingVideoId(id);
    // Use XMLHttpRequest directly — Axios's retry interceptor can't re-send
    // FormData (multipart is a one-shot stream) so we bypass it entirely here.
    try {
      const token = localStorage.getItem("accessToken") || "";
      const form  = new FormData();
      form.append("video", file);
      const response = await new Promise<{ heroVideoUrl: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/admin/live-classes/${id}/hero-video`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); }
            catch { reject(new Error("Invalid response from server")); }
          } else {
            try { const body = JSON.parse(xhr.responseText); reject(new Error(body.message || `Server error ${xhr.status}`)); }
            catch { reject(new Error(`Upload error: HTTP ${xhr.status}`)); }
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.ontimeout = () => reject(new Error("Upload timed out"));
        xhr.timeout = 300000; // 5 minutes for large videos
        xhr.send(form);
      });
      setClasses(prev => prev.map(c => c._id === id ? { ...c, heroVideoUrl: response.heroVideoUrl } : c));
      alert("✅ Video uploaded and saved to this session!");
    } catch (err: any) {
      alert(err?.message || "Upload failed");
    } finally { setUploadingVideoId(null); uploadingForId.current = null; e.target.value = ""; }
  };

  const handleSetVideoUrl = async (id: string) => {
    if (!videoUrlDraft.trim()) return;
    try {
      await client.patch(`/admin/live-classes/${id}/hero-video-url`, { heroVideoUrl: videoUrlDraft.trim() });
      setClasses(prev => prev.map(c => c._id === id ? { ...c, heroVideoUrl: videoUrlDraft.trim() } : c));
      setVideoUrlInputId(null); setVideoUrlDraft("");
    } catch (err: any) { alert(err.response?.data?.message || "Failed to save URL"); }
  };

  // Free live permissions
  const [perms, setPerms]        = useState<AdminLivePermission[]>([]);
  const [permsLoading, setPermsLoading] = useState(false);
  const [permActionId, setPermActionId] = useState<string | null>(null);
  const [permFilter, setPermFilter]     = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const now = Date.now();

  const load = () => {
    setLoading(true);
    adminGetLiveClasses()
      .then(r => { const d = r.data as any; setClasses(d.liveClasses ?? d.classes ?? d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadPerms = () => {
    setPermsLoading(true);
    client.get('/admin/live-permissions')
      .then(r => setPerms((r.data as any).requests || []))
      .catch(() => {})
      .finally(() => setPermsLoading(false));
  };

  useEffect(() => { load(); loadPerms(); }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'end') => {
    if (action === 'end' && !window.confirm('End this class for all participants?')) return;
    setActionId(id);
    try {
      await adminApproveLiveClass(id, action as any);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally { setActionId(null); }
  };

  const handlePermAction = async (id: string, action: 'approve' | 'reject') => {
    setPermActionId(id);
    try {
      await client.patch(`/admin/live-permissions/${id}/${action}`);
      loadPerms();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally { setPermActionId(null); }
  };

  // Initialise / tear down hls.js whenever the player modal opens or closes
  useEffect(() => {
    const video = videoRef.current;
    if (!watchingId || !video) return;

    const manifestUrl = adminGetRecordingManifestUrl(watchingId);
    const token = localStorage.getItem("accessToken") || "";

    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr: XMLHttpRequest) => {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        },
      });
      hlsRef.current = hls;
      hls.loadSource(manifestUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = manifestUrl;
      video.play().catch(() => {});
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [watchingId]);

  const getStatus = (c: AdminLiveClass) => {
    if (c.status === 'pending_approval') return 'pending';
    if (c.status === 'rejected')         return 'past';
    if (c.status === 'live')             return 'live';
    if (c.status === 'ended')            return 'past';
    const start = new Date(c.scheduledAt).getTime();
    const end   = start + (c.duration ?? 60) * 60000;
    if (start <= now && end >= now) return 'live';
    if (start > now) return 'upcoming';
    return 'past';
  };

  const filtered = classes.filter(c => {
    const ms = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.educator?.name?.toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'all' ? true : getStatus(c) === filter;
    return ms && mf;
  });

  const pendingClasses     = classes.filter(c => c.status === 'pending_approval').length;
  const pendingPerms       = perms.filter(p => p.status === 'pending').length;
  const liveCount          = classes.filter(c => getStatus(c) === 'live').length;
  const upcomingCount      = classes.filter(c => getStatus(c) === 'upcoming').length;

  const filteredPerms = perms.filter(p => permFilter === 'all' || p.status === permFilter);

  return (
    <>
      <div className="adm-sh">
        <h2>Live Classes</h2>
        {liveCount > 0     && <span className="pill pill-green">🔴 {liveCount} Live Now</span>}
        {(pendingClasses + pendingPerms) > 0 && (
          <span className="pill pill-yellow">⏳ {pendingClasses + pendingPerms} Need Approval</span>
        )}
      </div>

      {/* Tab selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        <button onClick={() => setTab('classes')}
          style={{ padding: '9px 22px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none', background: tab === 'classes' ? '#7c3aed' : '#1e293b', color: tab === 'classes' ? '#fff' : '#94a3b8', position: 'relative' }}>
          📅 Scheduled Classes
          {pendingClasses > 0 && (
            <span style={{ position: 'absolute', top: -6, right: -6, background: '#f59e0b', color: '#000', fontSize: 10, fontWeight: 800, borderRadius: 10, padding: '2px 6px', lineHeight: 1 }}>{pendingClasses}</span>
          )}
        </button>
        <button onClick={() => setTab('permissions')}
          style={{ padding: '9px 22px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none', background: tab === 'permissions' ? '#7c3aed' : '#1e293b', color: tab === 'permissions' ? '#fff' : '#94a3b8', position: 'relative' }}>
          ⚡ Free Live Requests
          {pendingPerms > 0 && (
            <span style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 10, padding: '2px 6px', lineHeight: 1 }}>{pendingPerms}</span>
          )}
        </button>
      </div>

      {/* ── SCHEDULED CLASSES TAB ── */}
      {tab === 'classes' && (
        <>
          <div style={{ display: 'flex', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
            {[
              { label: 'Pending Approval', value: pendingClasses, color: '#f59e0b' },
              { label: 'Live Now',         value: liveCount,      color: '#22c55e' },
              { label: 'Upcoming',         value: upcomingCount,  color: '#3b82f6' },
              { label: 'Total',            value: classes.length, color: '#7c3aed' },
            ].map(s => (
              <div key={s.label} className="adm-card" style={{ flex: 1, minWidth: 110, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="adm-toolbar">
            <div className="adm-search">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input placeholder="Search title or trainer…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['pending', 'all', 'live', 'upcoming', 'past'] as const).map(f => (
                <button key={f} className={`adm-btn adm-btn-sm ${filter === f ? 'adm-btn-primary' : 'adm-btn-ghost'}`} onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
              <button className="adm-btn adm-btn-sm adm-btn-ghost" onClick={() => {
                const BOM = '﻿';
                const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
                const rows = filtered.map(c => [c.title, c.educator?.name ?? '', classType(c).label.replace(/[^ -~]/g,'').trim(), new Date(c.scheduledAt).toLocaleString('en-IN'), String(c.duration ?? 60) + ' min', String(c.maxParticipants ?? ''), c.status, getStatus(c)].map(esc).join(','));
                const csv = BOM + ['Title,Educator,Type,Scheduled,Duration,Max Participants,Status,Phase', ...rows].join('\r\n');
                const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
                Object.assign(document.createElement('a'), { href: url, download: `live-classes_${new Date().toISOString().slice(0,10)}.csv` }).click();
                URL.revokeObjectURL(url);
              }}>⬇ CSV</button>
            </div>
          </div>

          <div className="adm-card" style={{ padding: 0 }}>
            {loading
              ? <div className="adm-loading"><div className="adm-spinner" /><span>Loading…</span></div>
              : filtered.length === 0 ? <div className="adm-empty">No classes found</div>
              : (
                <div className="adm-table-wrap">
                  {/* Hidden file input for hero video uploads — triggered programmatically */}
                  <input ref={fileInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoFileChange} />
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Title</th>
                        <th>Trainer</th>
                        <th>Course</th>
                        <th>Start Time</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Hero Video</th>
                        <th>Recording</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(c => {
                        const status  = getStatus(c);
                        const typeTag = classType(c);
                        return (
                          <tr key={c._id}>
                            <td>
                              <span style={{ background: typeTag.bg, color: typeTag.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                {typeTag.label}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600, color: '#e2e8f0', maxWidth: 200 }}>{c.title}</td>
                            <td style={{ color: '#94a3b8' }}>{c.educator?.name ?? '—'}</td>
                            <td style={{ color: '#64748b', fontSize: 12 }}>{(c.course as any)?.title ?? '—'}</td>
                            <td style={{ color: '#64748b', fontSize: 12 }}>{fmtDate(c.scheduledAt)}</td>
                            <td style={{ color: '#64748b' }}>{c.duration ?? 60} min</td>
                            <td>
                              {status === 'pending'  && <span className="pill" style={{ background: 'rgba(245,158,11,.15)', color: '#f59e0b' }}>⏳ Pending</span>}
                              {status === 'live'     && <span className="pill pill-green">🔴 Live</span>}
                              {status === 'upcoming' && <span className="pill pill-blue">✅ Approved</span>}
                              {status === 'past'     && <span className="pill pill-gray">{c.status === 'rejected' ? 'Rejected' : 'Ended'}</span>}
                            </td>
                            {/* Hero Video column */}
                            <td style={{ minWidth: 160 }}>
                              {uploadingVideoId === c._id ? (
                                <span style={{ color: '#a78bfa', fontSize: 12 }}>⏳ Uploading…</span>
                              ) : c.heroVideoUrl ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 700 }}>✅ Video set</span>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <a href={c.heroVideoUrl} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: '#7c3aed' }}>Preview</a>
                                    <button style={{ fontSize: 10, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                                      onClick={() => { uploadingForId.current = c._id; fileInputRef.current?.click(); }}>Change</button>
                                  </div>
                                </div>
                              ) : videoUrlInputId === c._id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <input value={videoUrlDraft} onChange={e => setVideoUrlDraft(e.target.value)}
                                    placeholder="Paste video URL…"
                                    style={{ fontSize: 11, padding: '3px 6px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', width: 140 }} />
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <button className="adm-btn adm-btn-sm adm-btn-success" style={{ fontSize: 10, padding: '2px 8px' }} onClick={() => handleSetVideoUrl(c._id)}>Save</button>
                                    <button style={{ fontSize: 10, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }} onClick={() => { setVideoUrlInputId(null); setVideoUrlDraft(""); }}>Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button className="adm-btn adm-btn-sm" style={{ fontSize: 10, padding: '3px 8px', background: '#1e3a8a' }}
                                    onClick={() => { uploadingForId.current = c._id; fileInputRef.current?.click(); }}>
                                    📁 Upload File
                                  </button>
                                  <button className="adm-btn adm-btn-sm" style={{ fontSize: 10, padding: '3px 8px', background: '#312e81' }}
                                    onClick={() => { setVideoUrlInputId(c._id); setVideoUrlDraft(""); }}>
                                    🔗 URL
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* Recording column */}
                            <td style={{ minWidth: 120 }}>
                              {c.recordingActive ? (
                                <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                                  Recording…
                                </span>
                              ) : c.recordingGcsKey ? (
                                <button className="adm-btn adm-btn-sm adm-btn-success"
                                  style={{ fontSize: 10, padding: '3px 10px' }}
                                  onClick={() => setWatchingId(c._id)}>
                                  ▶ Watch
                                </button>
                              ) : (
                                <span style={{ color: '#334155', fontSize: 11 }}>—</span>
                              )}
                            </td>

                            <td>
                              {status === 'pending' && (
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button className="adm-btn adm-btn-sm adm-btn-success" onClick={() => handleAction(c._id, 'approve')} disabled={actionId === c._id}>
                                    {actionId === c._id ? '…' : '✓ Approve'}
                                  </button>
                                  <button className="adm-btn adm-btn-sm adm-btn-danger" onClick={() => handleAction(c._id, 'reject')} disabled={actionId === c._id}>
                                    {actionId === c._id ? '…' : '✕ Reject'}
                                  </button>
                                </div>
                              )}
                              {status === 'live' && (
                                <button
                                  className="adm-btn adm-btn-sm adm-btn-danger"
                                  onClick={() => handleAction(c._id, 'end')}
                                  disabled={actionId === c._id}
                                  style={{ fontWeight: 700 }}
                                >
                                  {actionId === c._id ? 'Ending…' : '⏹ End Class'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>
        </>
      )}

      {/* ── FREE LIVE REQUESTS TAB ── */}
      {tab === 'permissions' && (
        <>
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 18, fontSize: 13, color: '#d97706' }}>
            ⚡ <strong>Free Live</strong> — Trainers request permission each time they want to go live for free (without a course or session). Approvals are time-limited (typically 3 hours).
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {[
              { label: 'Pending',  value: perms.filter(p => p.status === 'pending').length,  color: '#f59e0b' },
              { label: 'Approved', value: perms.filter(p => p.status === 'approved').length, color: '#22c55e' },
              { label: 'Total',    value: perms.length,                                       color: '#7c3aed' },
            ].map(s => (
              <div key={s.label} className="adm-card" style={{ flex: 1, minWidth: 110, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
              <button key={f} className={`adm-btn adm-btn-sm ${permFilter === f ? 'adm-btn-primary' : 'adm-btn-ghost'}`} onClick={() => setPermFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {permsLoading ? (
            <div className="adm-loading"><div className="adm-spinner" /><span>Loading…</span></div>
          ) : filteredPerms.length === 0 ? (
            <div className="adm-empty">No free live requests</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredPerms.map(p => {
                const statusColor = p.status === 'approved' ? '#22c55e' : p.status === 'rejected' ? '#ef4444' : '#f59e0b';
                const statusBg    = p.status === 'approved' ? 'rgba(34,197,94,0.1)' : p.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)';
                return (
                  <div key={p._id} className="adm-card" style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#a78bfa', fontSize: 15, flexShrink: 0 }}>
                          {(p.educator?.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0' }}>{p.educator?.name ?? '—'}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{p.educator?.email ?? ''}</div>
                        </div>
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, background: statusBg, color: statusColor, marginLeft: 4 }}>
                          {p.status === 'approved' ? '✅ Approved' : p.status === 'rejected' ? '✕ Rejected' : '⏳ Pending'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: p.reason ? 6 : 0 }}>
                        Requested: {fmtDate(p.createdAt)}
                        {p.status === 'approved' && p.expiresAt && (
                          <span style={{ color: '#22c55e', marginLeft: 10 }}>· Expires: {fmtDate(p.expiresAt)}</span>
                        )}
                      </div>
                      {p.reason && (
                        <div style={{ fontSize: 13, color: '#94a3b8', background: '#0f172a', borderRadius: 8, padding: '8px 12px', marginTop: 6 }}>
                          📝 {p.reason}
                        </div>
                      )}
                    </div>
                    {p.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button
                          onClick={() => handlePermAction(p._id, 'approve')}
                          disabled={permActionId === p._id}
                          className="adm-btn adm-btn-sm adm-btn-success">
                          {permActionId === p._id ? '…' : '✓ Allow Live'}
                        </button>
                        <button
                          onClick={() => handlePermAction(p._id, 'reject')}
                          disabled={permActionId === p._id}
                          className="adm-btn adm-btn-sm adm-btn-danger">
                          {permActionId === p._id ? '…' : '✕ Deny'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── HLS Video Player Modal ── */}
      {watchingId && (() => {
        const cls = classes.find(c => c._id === watchingId);
        return (
          <div
            onClick={e => { if (e.target === e.currentTarget) { hlsRef.current?.destroy(); hlsRef.current = null; setWatchingId(null); } }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <div style={{ background: '#0f172a', borderRadius: 16, width: '100%', maxWidth: 900, border: '1px solid #1e293b', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #1e293b' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>{cls?.title ?? 'Recording'}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>HLS stream from Agora Cloud Recording</div>
                </div>
                <button
                  onClick={() => { hlsRef.current?.destroy(); hlsRef.current = null; setWatchingId(null); }}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4 }}>
                  ✕
                </button>
              </div>
              <div style={{ padding: 20 }}>
                <video
                  ref={videoRef}
                  controls
                  style={{ width: '100%', borderRadius: 10, background: '#000', display: 'block', maxHeight: '70vh' }}
                />
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
};

export default AdminLiveClasses;
