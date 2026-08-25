import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import type { AdminStudent, AdminTrainer } from '../../api/admin';
import { adminGetStudents, adminGetTrainers, adminUpdatePermissions, adminSuspendUser } from '../../api/admin';

const PROTECTED = ['makhijaniishu2@gmail.com', 'blessingsschoolofhypnosis@gmail.com'];

type Row = { _id: string; name: string; email: string; role: string; isActive: boolean; canPublish: boolean; canGoLive: boolean };

const AdminPermissions: React.FC = () => {
  const [users, setUsers]       = useState<Row[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [sel, setSel]           = useState<Row | null>(null);
  const [form, setForm]         = useState({ role: '', isActive: true, canPublish: false, canGoLive: false });
  const [saving, setSaving]     = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([adminGetStudents({ limit: 200 }), adminGetTrainers()])
      .then(([sr, tr]) => {
        const students: AdminStudent[] = (sr.data as any).students ?? sr.data;
        const trainers: AdminTrainer[] = (tr.data as any).trainers ?? tr.data;
        const all: Row[] = [
          ...trainers.map(t => ({ ...t, role: 'educator', canPublish: (t as any).canPublish ?? false, canGoLive: (t as any).canGoLive ?? false })),
          ...students.map(s => ({ ...s, role: 'student', canPublish: false, canGoLive: false })),
        ].sort((a, b) => a.name.localeCompare(b.name));
        setUsers(all);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (u: Row) => { setSel(u); setForm({ role: u.role, isActive: u.isActive, canPublish: u.canPublish, canGoLive: u.canGoLive }); };

  const save = async () => {
    if (!sel) return;
    setSaving(true);
    try {
      await adminUpdatePermissions(sel._id, { role: form.role, isActive: form.isActive, canPublish: form.canPublish, canGoLive: form.canGoLive });
      setSel(null); load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const quickToggle = async (u: Row) => {
    if (PROTECTED.includes(u.email)) { alert('Cannot modify admin accounts'); return; }
    if (!confirm(`${u.isActive ? 'Suspend' : 'Reactivate'} "${u.name}"?`)) return;
    setActionId(u._id);
    try {
      if (u.isActive) await adminSuspendUser(u._id);
      else await adminUpdatePermissions(u._id, { isActive: true });
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setActionId(null);
    }
  };

  const filtered = users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const rPill = (role: string) => {
    if (role === 'admin')    return <span className="pill pill-purple">Admin</span>;
    if (role === 'educator') return <span className="pill pill-blue">Educator</span>;
    return <span className="pill pill-gray">Student</span>;
  };

  return (
    <>
      <div className="adm-sh"><h2>User Permissions ({users.length})</h2></div>

      <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#fca5a5' }}>
        ⚠️ Admin accounts are protected: {PROTECTED.join(', ')}
      </div>

      <div className="adm-toolbar">
        <div className="adm-search">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span style={{ fontSize: 12, color: '#64748b' }}>{filtered.length} users</span>
        <button className="adm-btn adm-btn-ghost" onClick={() => {
          const BOM = '﻿';
          const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
          const rows = filtered.map(u => [u.name, u.email, u.role, u.isActive ? 'Active' : 'Suspended', u.canPublish ? 'Yes' : 'No', u.canGoLive ? 'Yes' : 'No'].map(esc).join(','));
          const csv = BOM + ['Name,Email,Role,Status,Can Publish,Can Go Live', ...rows].join('\r\n');
          const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
          Object.assign(document.createElement('a'), { href: url, download: `permissions_${new Date().toISOString().slice(0,10)}.csv` }).click();
          URL.revokeObjectURL(url);
        }}>⬇ CSV</button>
      </div>

      <div className="adm-card" style={{ padding: 0 }}>
        {loading
          ? <div className="adm-loading"><div className="adm-spinner" /><span>Loading…</span></div>
          : filtered.length === 0 ? <div className="adm-empty">No users found</div>
          : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Can Publish</th><th>Can Go Live</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map(u => {
                    const locked = PROTECTED.includes(u.email);
                    return (
                      <tr key={u._id}>
                        <td style={{ fontWeight: 600, color: '#e2e8f0' }}>
                          {u.name} {locked && <span style={{ fontSize: 10, color: '#FF6B8A' }}>🔒</span>}
                        </td>
                        <td style={{ color: '#94a3b8' }}>{u.email}</td>
                        <td>{rPill(u.role)}</td>
                        <td><span className={`pill ${u.isActive ? 'pill-green' : 'pill-red'}`}>{u.isActive ? 'Active' : 'Suspended'}</span></td>
                        <td>{u.role === 'educator' ? <span className={`pill ${u.canPublish ? 'pill-green' : 'pill-red'}`}>{u.canPublish ? 'Yes' : 'No'}</span> : <span style={{ color: '#475569' }}>—</span>}</td>
                        <td>{u.role === 'educator' ? <span className={`pill ${u.canGoLive ? 'pill-green' : 'pill-red'}`}>{u.canGoLive ? 'Yes' : 'No'}</span> : <span style={{ color: '#475569' }}>—</span>}</td>
                        <td>
                          {!locked && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="adm-btn adm-btn-sm adm-btn-ghost" onClick={() => openEdit(u)}>Edit Role</button>
                              <button
                                className={`adm-btn adm-btn-sm ${u.isActive ? 'adm-btn-danger' : 'adm-btn-success'}`}
                                onClick={() => quickToggle(u)} disabled={actionId === u._id}
                              >{actionId === u._id ? '…' : u.isActive ? 'Suspend' : 'Reactivate'}</button>
                            </div>
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

      {sel && ReactDOM.createPortal(
        <div className="adm-overlay" onClick={e => e.target === e.currentTarget && setSel(null)}>
          <div className="adm-modal">
            <div className="adm-modal-hd">
              <h3>Edit Permissions — {sel.name}</h3>
              <button className="adm-modal-x" onClick={() => setSel(null)}>×</button>
            </div>
            <div style={{ background: '#13102b', borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 13, color: '#94a3b8' }}>{sel.email}</div>
            <div className="adm-fg">
              <label>Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="student">Student</option>
                <option value="educator">Educator</option>
              </select>
            </div>
            <div className="adm-fg">
              <label>Account Status</label>
              <select value={form.isActive ? 'active' : 'suspended'} onChange={e => setForm({ ...form, isActive: e.target.value === 'active' })}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            {form.role === 'educator' && (
              <div style={{ background: '#0f0a2a', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ color: '#FF6B8A', fontSize: 12, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Educator Permissions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#e2e8f0', fontSize: 14 }}>
                    <input type="checkbox" checked={form.canPublish} onChange={e => setForm({ ...form, canPublish: e.target.checked })} style={{ width: 16, height: 16, accentColor: '#FF1E56' }} />
                    Allow to publish courses
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#e2e8f0', fontSize: 14 }}>
                    <input type="checkbox" checked={form.canGoLive} onChange={e => setForm({ ...form, canGoLive: e.target.checked })} style={{ width: 16, height: 16, accentColor: '#FF1E56' }} />
                    Allow to go live / schedule live classes
                  </label>
                </div>
              </div>
            )}
            <div className="adm-modal-actions">
              <button className="adm-btn adm-btn-ghost" onClick={() => setSel(null)}>Cancel</button>
              <button className="adm-btn adm-btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default AdminPermissions;
