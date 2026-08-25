import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import type { AdminSession, AdminSessionApplication } from '../../api/admin';
import { adminGetSessions, adminUpdateSession, adminGetSessionApplications, adminUpdateSessionApplication } from '../../api/admin';
import client from '../../api/client';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const S_COLOR: Record<string, string> = {
  pending: 'pill-yellow', contacted: 'pill-blue', scheduled: 'pill-purple',
  completed: 'pill-green', cancelled: 'pill-red',
};

const AdminSessions: React.FC = () => {
  const [sessions, setSessions]       = useState<AdminSession[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('all');
  const [search, setSearch]           = useState('');
  const [sel, setSel]                 = useState<AdminSession | null>(null);
  const [form, setForm]               = useState({ status: '', adminNotes: '', scheduledAt: '' });
  const [saving, setSaving]           = useState(false);
  const [mainTab, setMainTab]         = useState<'consultations' | 'bookings' | 'permissions' | 'applications'>('consultations');
  const [bookings, setBookings]       = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [bookingFilter, setBookingFilter] = useState('all');
  const [applications, setApplications]   = useState<AdminSessionApplication[]>([]);
  const [appFilter, setAppFilter]         = useState<string>('all');
  const [appActionId, setAppActionId]     = useState<string | null>(null);
  const [appNote, setAppNote]             = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true);
    adminGetSessions()
      .then(r => { const d = r.data as any; setSessions(d.sessions ?? d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadBookings = () => {
    client.get('/admin/session-bookings').then(r => setBookings(r.data.bookings || [])).catch(() => {});
  };

  const loadPermissions = () => {
    client.get('/admin/live-permissions').then(r => setPermissions(r.data.requests || [])).catch(() => {});
  };

  const loadApplications = () => {
    adminGetSessionApplications()
      .then(r => setApplications((r.data as any).applications || []))
      .catch(() => {});
  };

  useEffect(() => { load(); loadBookings(); loadPermissions(); loadApplications(); }, []);

  const openModal = (s: AdminSession) => {
    setSel(s);
    setForm({ status: s.status, adminNotes: s.adminNotes ?? '', scheduledAt: s.scheduledAt ? s.scheduledAt.slice(0, 16) : '' });
  };

  const save = async () => {
    if (!sel) return;
    setSaving(true);
    try {
      await adminUpdateSession(sel._id, { status: form.status, adminNotes: form.adminNotes || undefined, scheduledAt: form.scheduledAt || undefined });
      setSel(null);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const filtered = sessions.filter(s => {
    const mf = filter === 'all' ? true : s.status === filter;
    const ms = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search);
    return mf && ms;
  });

  const pendingCount = sessions.filter(s => s.status === 'pending').length;

  const approveBooking = async (id: string) => {
    try {
      await client.patch(`/admin/session-bookings/${id}/approve`);
      loadBookings();
      alert('Session approved! Live class created and parties notified.');
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  };

  const rejectBooking = async (id: string) => {
    const note = prompt('Reason for rejection (optional):');
    try {
      await client.patch(`/admin/session-bookings/${id}/reject`, { adminNote: note });
      loadBookings();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  };

  const approvePermission = async (id: string) => {
    try {
      await client.patch(`/admin/live-permissions/${id}/approve`);
      loadPermissions();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  };

  const rejectPermission = async (id: string) => {
    try {
      await client.patch(`/admin/live-permissions/${id}/reject`);
      loadPermissions();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  };

  const statusColor: Record<string, string> = {
    pending_payment: '#6b7280', paid: '#3b82f6', trainer_proposed: '#f59e0b',
    admin_approved: '#FF1E56', live: '#ef4444', completed: '#16a34a', cancelled: '#dc2626',
  };

  const pendingBookings      = bookings.filter(b => b.status === 'trainer_proposed').length;
  const pendingPermissions   = permissions.filter(p => p.status === 'pending').length;
  const pendingApplications  = applications.filter(a => a.status === 'trainer_proposed').length;

  const actApp = async (id: string, action: 'approve' | 'reject') => {
    setAppActionId(id);
    try {
      await adminUpdateSessionApplication(id, { action, adminNote: appNote[id] || '' });
      loadApplications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally { setAppActionId(null); }
  };

  return (
    <>
      <div className="adm-sh">
        <h2>Sessions & Calls</h2>
        {(pendingBookings + pendingPermissions) > 0 && <span className="pill pill-yellow">⚡ {pendingBookings + pendingPermissions} Need Action</span>}
      </div>

      {/* Main tab selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {([
          { key: 'consultations', label: `Consultations (${sessions.length})` },
          { key: 'applications',  label: `✋ 1:1 Applications${pendingApplications > 0 ? ` (${pendingApplications} pending)` : ` (${applications.length})`}` },
          { key: 'bookings',      label: `1:1 Bookings${pendingBookings > 0 ? ` (${pendingBookings} pending)` : ` (${bookings.length})`}` },
          { key: 'permissions',   label: `Live Permissions${pendingPermissions > 0 ? ` (${pendingPermissions} pending)` : ''}` },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setMainTab(tab.key)}
            style={{ padding: '8px 18px', borderRadius: 20, border: `1.5px solid ${mainTab === tab.key ? '#FF1E56' : '#e5e7eb'}`, background: mainTab === tab.key ? 'rgba(255,30,86,0.1)' : 'transparent', color: mainTab === tab.key ? '#FF1E56' : '#6b7280', fontWeight: mainTab === tab.key ? 700 : 500, fontSize: 13, cursor: 'pointer' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 1:1 SESSION APPLICATIONS TAB ── */}
      {mainTab === 'applications' && (
        <div>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
            Customers who applied for a 1:1 session. When the trainer proposes a schedule it appears here for admin approval.
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {['all', 'pending', 'trainer_proposed', 'approved', 'rejected', 'completed'].map(s => (
              <button key={s} onClick={() => setAppFilter(s)}
                style={{ padding: '5px 12px', borderRadius: 14, border: `1px solid ${appFilter === s ? '#FF1E56' : '#e5e7eb'}`, background: appFilter === s ? 'rgba(255,30,86,0.1)' : 'transparent', color: appFilter === s ? '#FF1E56' : '#6b7280', fontSize: 12, fontWeight: appFilter === s ? 700 : 400, cursor: 'pointer' }}>
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
            <button
              onClick={() => {
                const rows = applications.filter(a => appFilter === 'all' || a.status === appFilter);
                const headers = ['Client Name', 'Phone', 'Email', 'Trainer', 'Issue / Goal', 'Preferred Time', 'Message', 'Status', 'Proposed Schedule', 'Trainer Note', 'Admin Note', 'Date'];
                const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
                const csv = [
                  headers.map(escape).join(','),
                  ...rows.map(a => [
                    a.clientName, a.clientPhone, a.clientEmail, a.trainerName,
                    a.issue, a.preferredTime ?? '', a.message ?? '',
                    a.status.replace(/_/g, ' '), a.proposedSchedule ?? '',
                    a.trainerNote ?? '', a.adminNote ?? '',
                    new Date(a.createdAt).toLocaleDateString('en-IN'),
                  ].map(escape).join(','))
                ].join('\r\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `1on1-applications-${appFilter}-${new Date().toISOString().slice(0,10)}.csv`;
                a.click(); URL.revokeObjectURL(url);
              }}
              style={{ marginLeft: 'auto', padding: '6px 16px', borderRadius: 14, border: '1.5px solid #16a34a', background: 'rgba(22,163,74,0.08)', color: '#16a34a', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              ⬇ Download Sheet
            </button>
          </div>
          {applications.filter(a => appFilter === 'all' || a.status === appFilter).length === 0 ? (
            <div style={{ color: '#6b7280', padding: '32px 0', textAlign: 'center', fontSize: 14 }}>No applications found</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {applications.filter(a => appFilter === 'all' || a.status === appFilter).map((a) => {
                const statusColor = a.status === 'approved' ? '#16a34a' : a.status === 'rejected' ? '#dc2626' : a.status === 'trainer_proposed' ? '#d97706' : a.status === 'completed' ? '#FF1E56' : '#6b7280';
                return (
                  <div key={a._id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{a.clientName}</span>
                          <span style={{ fontSize: 11 }}>→</span>
                          <span style={{ fontWeight: 700, color: '#FF1E56' }}>{a.trainerName}</span>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: `${statusColor}18`, color: statusColor }}>
                            {a.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{a.clientPhone}{a.clientEmail ? ` · ${a.clientEmail}` : ''} · {new Date(a.createdAt).toLocaleDateString('en-IN')}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Issue / Goal</div>
                        <div style={{ fontSize: 13, color: '#374151' }}>{a.issue}</div>
                      </div>
                      {a.preferredTime && (
                        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Preferred Time</div>
                          <div style={{ fontSize: 13, color: '#374151' }}>{a.preferredTime}</div>
                        </div>
                      )}
                      {a.message && (
                        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', gridColumn: '1 / -1' }}>
                          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Additional Message</div>
                          <div style={{ fontSize: 13, color: '#374151' }}>{a.message}</div>
                        </div>
                      )}
                    </div>
                    {a.status === 'trainer_proposed' && a.proposedSchedule && (
                      <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706', marginBottom: 4 }}>Trainer Proposed Schedule</div>
                        <div style={{ fontSize: 13, color: '#92400e' }}>{a.proposedSchedule}</div>
                        {a.trainerNote && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Note: {a.trainerNote}</div>}
                      </div>
                    )}
                    {a.status === 'approved' && a.agoraChannel && (
                      <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', marginBottom: 2 }}>Agora Channel (Live Session)</div>
                        <code style={{ fontSize: 12, color: '#065f46' }}>{a.agoraChannel}</code>
                      </div>
                    )}
                    {a.status === 'trainer_proposed' && (
                      <div>
                        <textarea
                          value={appNote[a._id] || ''}
                          onChange={e => setAppNote(n => ({ ...n, [a._id]: e.target.value }))}
                          placeholder="Admin note (optional)…"
                          rows={2}
                          style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, resize: 'none', outline: 'none', marginBottom: 10, boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => actApp(a._id, 'approve')} disabled={appActionId === a._id}
                            style={{ flex: 1, padding: '9px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                            {appActionId === a._id ? 'Processing…' : '✓ Approve & Generate Channel'}
                          </button>
                          <button onClick={() => actApp(a._id, 'reject')} disabled={appActionId === a._id}
                            style={{ padding: '9px 18px', background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 1:1 BOOKINGS TAB ── */}
      {mainTab === 'bookings' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {['all','paid','trainer_proposed','admin_approved','completed','cancelled'].map(s => (
              <button key={s} onClick={() => setBookingFilter(s)}
                style={{ padding: '5px 12px', borderRadius: 14, border: `1px solid ${bookingFilter === s ? '#FF1E56' : '#e5e7eb'}`, background: bookingFilter === s ? 'rgba(255,30,86,0.1)' : 'transparent', color: bookingFilter === s ? '#FF1E56' : '#6b7280', fontSize: 12, fontWeight: bookingFilter === s ? 700 : 400, cursor: 'pointer' }}>
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>

          {bookings.filter(b => bookingFilter === 'all' || b.status === bookingFilter).length === 0 ? (
            <div style={{ color: '#6b7280', padding: '32px 0', textAlign: 'center', fontSize: 14 }}>No bookings found</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bookings.filter(b => bookingFilter === 'all' || b.status === bookingFilter).map((b: any) => (
                <div key={b._id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{b.client?.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 700 }}>→</span>
                        <span style={{ fontWeight: 700, fontSize: 15, color: '#FF1E56' }}>{b.trainer?.name}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: `${statusColor[b.status]}22`, color: statusColor[b.status] }}>{b.status.replace('_',' ')}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{b.client?.email} · ₹{(b.amount/100).toLocaleString()}</div>
                      {b.clientNote && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Note: {b.clientNote}</div>}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{fmtDate(b.createdAt)}</div>
                  </div>

                  {b.proposedSlots?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#FF1E56', textTransform: 'uppercase', marginBottom: 8 }}>Proposed Time Slots</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {b.proposedSlots.map((slot: any, i: number) => (
                          <span key={i} style={{ background: '#f5f0ff', color: '#FF1E56', fontSize: 12, padding: '4px 12px', borderRadius: 8, fontWeight: 600 }}>
                            {new Date(slot.datetime).toLocaleString()} · {slot.duration}min
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {b.status === 'trainer_proposed' && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button onClick={() => approveBooking(b._id)}
                        style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        Approve & Create Live Session
                      </button>
                      <button onClick={() => rejectBooking(b._id)}
                        style={{ padding: '9px 18px', background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                        Reject
                      </button>
                    </div>
                  )}
                  {b.confirmedSlot && (
                    <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                      Confirmed: {new Date(b.confirmedSlot.datetime).toLocaleString()} · {b.confirmedSlot.duration}min
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── LIVE PERMISSIONS TAB ── */}
      {mainTab === 'permissions' && (
        <div>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>Educators must get admin approval before going live for free each time.</p>
          {permissions.length === 0 ? (
            <div style={{ color: '#6b7280', padding: '32px 0', textAlign: 'center', fontSize: 14 }}>No permission requests</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {permissions.map((p: any) => (
                <div key={p._id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#111', marginBottom: 2 }}>{p.educator?.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{p.educator?.email} · {fmtDate(p.createdAt)}</div>
                    {p.reason && <div style={{ fontSize: 13, color: '#374151', marginTop: 4 }}>Reason: {p.reason}</div>}
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 700, marginTop: 4, display: 'inline-block',
                      background: p.status === 'pending' ? 'rgba(245,158,11,0.12)' : p.status === 'approved' ? 'rgba(22,163,74,0.12)' : 'rgba(239,68,68,0.12)',
                      color: p.status === 'pending' ? '#d97706' : p.status === 'approved' ? '#16a34a' : '#dc2626' }}>
                      {p.status}
                    </span>
                    {p.status === 'approved' && p.expiresAt && (
                      <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 8 }}>Expires: {new Date(p.expiresAt).toLocaleTimeString()}</span>
                    )}
                  </div>
                  {p.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => approvePermission(p._id)}
                        style={{ padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        Approve
                      </button>
                      <button onClick={() => rejectPermission(p._id)}
                        style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CONSULTATIONS TAB ── */}
      {mainTab === 'consultations' && (<>
      <div className="adm-sh">
        <h2 style={{fontSize:16, margin:0}}>Consultation Requests ({sessions.length})</h2>
        {pendingCount > 0 && <span className="pill pill-yellow">⚡ {pendingCount} Pending</span>}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        {[
          { l: 'Pending',   v: sessions.filter(s => s.status === 'pending').length,   c: '#eab308' },
          { l: 'Scheduled', v: sessions.filter(s => s.status === 'scheduled').length, c: '#FF6A00' },
          { l: 'Completed', v: sessions.filter(s => s.status === 'completed').length, c: '#22c55e' },
          { l: 'Free Calls',v: sessions.filter(s => s.type === 'free_call').length,   c: '#3b82f6' },
        ].map(s => (
          <div key={s.l} className="adm-card" style={{ flex: 1, minWidth: 110, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>{s.l}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.c, marginTop: 4 }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="adm-toolbar">
        <div className="adm-search">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input placeholder="Search name, email, phone…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {['all', 'pending', 'contacted', 'scheduled', 'completed', 'cancelled'].map(f => (
            <button key={f} className={`adm-btn adm-btn-sm ${filter === f ? 'adm-btn-primary' : 'adm-btn-ghost'}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <button className="adm-btn adm-btn-sm adm-btn-ghost" onClick={() => {
            const BOM = '﻿';
            const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
            const rows = filtered.map(s => [s.name, s.email, s.phone, s.type || '', s.status, s.scheduledAt ? fmtDate(s.scheduledAt) : '', fmtDate(s.createdAt)].map(esc).join(','));
            const csv = BOM + ['Name,Email,Phone,Type,Status,Scheduled At,Submitted', ...rows].join('\r\n');
            const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
            Object.assign(document.createElement('a'), { href: url, download: `consultations_${new Date().toISOString().slice(0,10)}.csv` }).click();
            URL.revokeObjectURL(url);
          }}>⬇ CSV</button>
        </div>
      </div>

      <div className="adm-card" style={{ padding: 0 }}>
        {loading
          ? <div className="adm-loading"><div className="adm-spinner" /><span>Loading…</span></div>
          : filtered.length === 0 ? <div className="adm-empty">No sessions found</div>
          : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Name</th><th>Contact</th><th>Type</th><th>Issues</th><th>Status</th><th>Date</th><th></th></tr></thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 600, color: '#e2e8f0' }}>{s.name}</td>
                      <td>
                        <div style={{ color: '#94a3b8', fontSize: 12 }}>{s.email}</div>
                        <div style={{ color: '#64748b', fontSize: 12 }}>{s.phone}</div>
                      </td>
                      <td>
                        <span className={`pill ${s.type === 'free_call' ? 'pill-blue' : 'pill-purple'}`}>
                          {s.type === 'free_call' ? 'Free Call' : 'Private'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {s.issues.slice(0, 2).map(i => <span key={i} className="pill pill-gray" style={{ fontSize: 10 }}>{i}</span>)}
                          {s.issues.length > 2 && <span style={{ fontSize: 10, color: '#64748b' }}>+{s.issues.length - 2}</span>}
                        </div>
                      </td>
                      <td><span className={`pill ${S_COLOR[s.status] ?? 'pill-gray'}`}>{s.status}</span></td>
                      <td style={{ color: '#64748b', fontSize: 12 }}>{fmtDate(s.createdAt)}</td>
                      <td>
                        <button className="adm-btn adm-btn-sm adm-btn-primary" onClick={() => openModal(s)}>Update</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {sel && ReactDOM.createPortal(
        <div className="adm-overlay" onClick={e => e.target === e.currentTarget && setSel(null)}>
          <div className="adm-modal">
            <div className="adm-modal-hd">
              <h3>Update — {sel.name}</h3>
              <button className="adm-modal-x" onClick={() => setSel(null)}>×</button>
            </div>

            <div style={{ background: '#13102b', borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 13 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[{ l: 'Email', v: sel.email }, { l: 'Phone', v: sel.phone }, { l: 'DOB', v: sel.dob ?? '—' }, { l: 'Type', v: sel.type === 'free_call' ? 'Free Call' : 'Private' }].map(r => (
                  <div key={r.l}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{r.l}</div>
                    <div style={{ color: '#e2e8f0', fontWeight: 500 }}>{r.v}</div>
                  </div>
                ))}
              </div>
              {sel.issues.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 5 }}>Issues</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {sel.issues.map(i => <span key={i} className="pill pill-purple" style={{ fontSize: 11 }}>{i}</span>)}
                  </div>
                </div>
              )}
              {sel.detail && <div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8' }}>{sel.detail}</div>}
            </div>

            <div className="adm-fg">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {['pending', 'contacted', 'scheduled', 'completed', 'cancelled'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="adm-fg">
              <label>Schedule Date/Time</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} />
            </div>

            <div className="adm-fg">
              <label>Admin Notes</label>
              <textarea value={form.adminNotes} onChange={e => setForm({ ...form, adminNotes: e.target.value })} placeholder="Internal notes…" />
            </div>

            <div className="adm-modal-actions">
              <button className="adm-btn adm-btn-ghost" onClick={() => setSel(null)}>Cancel</button>
              <button className="adm-btn adm-btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
      </>)}
    </>
  );
};

export default AdminSessions;
