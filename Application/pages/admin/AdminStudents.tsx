import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import type { AdminStudent } from '../../api/admin';
import { adminGetStudents, adminGetStudentDetail, adminSuspendUser, adminUpdatePermissions } from '../../api/admin';

const fmtDate  = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtMoney = (p: number) => '₹' + (p / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });

interface StudentDetail {
  student:     any;
  enrollments: any[];
  payments:    any[];
}

const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [query, setQuery]       = useState('');
  const [page, setPage]         = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);

  // detail modal
  const [detail, setDetail]         = useState<StudentDetail | null>(null);
  const [detailLoading, setDL]      = useState(false);
  const [detailError, setDE]        = useState('');

  const PER = 20;

  const load = useCallback((q: string, p: number) => {
    setLoading(true);
    adminGetStudents({ search: q, page: p, limit: PER })
      .then(r => {
        const d = r.data as any;
        setStudents(d.students ?? d);
        setTotal(d.total ?? (d.students ?? d).length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(query, page); }, [query, page, load]);

  const openDetail = async (id: string) => {
    setDetail(null);
    setDE('');
    setDL(true);
    try {
      const r = await adminGetStudentDetail(id);
      setDetail(r.data as StudentDetail);
    } catch {
      setDE('Failed to load student details.');
    } finally {
      setDL(false);
    }
  };

  const toggle = async (s: AdminStudent) => {
    if (!confirm(`${s.isActive ? 'Suspend' : 'Reactivate'} "${s.name}"?`)) return;
    setActionId(s._id);
    try {
      if (s.isActive) {
        await adminSuspendUser(s._id);
      } else {
        await adminUpdatePermissions(s._id, { isActive: true });
      }
      load(query, page);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  const pages = Math.ceil(total / PER);

  return (
    <>
      <div className="adm-sh">
        <h2>Students ({total.toLocaleString()})</h2>
      </div>

      <div className="adm-toolbar">
        <div className="adm-search">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (setPage(1), setQuery(search))} />
        </div>
        <button className="adm-btn adm-btn-primary" onClick={() => { setPage(1); setQuery(search); }}>Search</button>
        {query && <button className="adm-btn adm-btn-ghost" onClick={() => { setSearch(''); setQuery(''); setPage(1); }}>Clear</button>}
        <button className="adm-btn adm-btn-ghost" onClick={() => {
          const BOM = '﻿';
          const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
          const rows = students.map(s => [s.name, s.email, s.phone || '', String(s.enrollmentCount ?? 0), new Date(s.createdAt).toLocaleDateString('en-IN'), s.isActive ? 'Active' : 'Suspended'].map(esc).join(','));
          const csv = BOM + ['Name,Email,Phone,Enrollments,Joined,Status', ...rows].join('\r\n');
          const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
          Object.assign(document.createElement('a'), { href: url, download: `students_${new Date().toISOString().slice(0,10)}.csv` }).click();
          URL.revokeObjectURL(url);
        }}>⬇ CSV</button>
      </div>

      <div className="adm-card" style={{ padding: 0 }}>
        {loading
          ? <div className="adm-loading"><div className="adm-spinner" /><span>Loading…</span></div>
          : students.length === 0
            ? <div className="adm-empty">No students found</div>
            : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Enrollments</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s._id} style={{ cursor: 'pointer' }}>
                        <td style={{ fontWeight: 600, color: '#e2e8f0' }}>{s.name}</td>
                        <td style={{ color: '#94a3b8' }}>{s.email}</td>
                        <td style={{ color: '#64748b' }}>{s.phone || '—'}</td>
                        <td style={{ textAlign: 'center', color: '#FF6B8A', fontWeight: 600 }}>{s.enrollmentCount ?? 0}</td>
                        <td style={{ color: '#64748b' }}>{fmtDate(s.createdAt)}</td>
                        <td><span className={`pill ${s.isActive ? 'pill-green' : 'pill-red'}`}>{s.isActive ? 'Active' : 'Suspended'}</span></td>
                        <td style={{ display: 'flex', gap: 6 }}>
                          <button className="adm-btn adm-btn-sm adm-btn-primary" onClick={() => openDetail(s._id)}>
                            View
                          </button>
                          <button
                            className={`adm-btn adm-btn-sm ${s.isActive ? 'adm-btn-danger' : 'adm-btn-success'}`}
                            onClick={() => toggle(s)} disabled={actionId === s._id}
                          >{actionId === s._id ? '…' : s.isActive ? 'Suspend' : 'Reactivate'}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="adm-btn adm-btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ padding: '6px 14px', color: '#94a3b8', fontSize: 13 }}>Page {page} of {pages}</span>
          <button className="adm-btn adm-btn-ghost" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {/* ── Student Detail Modal ── */}
      {(detailLoading || detail || detailError) && ReactDOM.createPortal(
        <div className="adm-overlay" onClick={e => { if (e.target === e.currentTarget) { setDetail(null); setDE(''); } }}>
          <div className="adm-modal" style={{ maxWidth: 640, width: '95%' }}>
            <div className="adm-modal-hd">
              <h3>{detail ? detail.student.name : 'Student Details'}</h3>
              <button className="adm-modal-x" onClick={() => { setDetail(null); setDE(''); }}>×</button>
            </div>

            {detailLoading && <div className="adm-loading"><div className="adm-spinner" /><span>Loading…</span></div>}
            {detailError  && <div className="adm-empty" style={{ color: '#ef4444' }}>{detailError}</div>}

            {detail && (
              <>
                {/* Profile */}
                <div style={{ background: '#13102b', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                    {[
                      { l: 'Email',   v: detail.student.email },
                      { l: 'Phone',   v: detail.student.phone || '—' },
                      { l: 'Joined',  v: fmtDate(detail.student.createdAt) },
                      { l: 'Status',  v: detail.student.isActive ? 'Active' : 'Suspended' },
                    ].map(r => (
                      <div key={r.l}>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{r.l}</div>
                        <div style={{ color: '#e2e8f0', fontWeight: 500 }}>{r.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enrollments */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FF6B8A', marginBottom: 8 }}>
                    📚 Enrollments ({detail.enrollments.length})
                  </div>
                  {detail.enrollments.length === 0
                    ? <div style={{ color: '#64748b', fontSize: 13 }}>No enrollments yet</div>
                    : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {detail.enrollments.map((e: any) => (
                          <div key={e._id} style={{ background: '#13102b', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{e.course?.title ?? 'Unknown Course'}</div>
                              <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{fmtDate(e.createdAt)}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: e.progress === 100 ? '#22c55e' : '#f59e0b' }}>
                                {e.progress ?? 0}%
                              </div>
                              <div style={{ fontSize: 10, color: '#64748b' }}>progress</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  }
                </div>

                {/* Payments */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', marginBottom: 8 }}>
                    💳 Payments ({detail.payments.length})
                  </div>
                  {detail.payments.length === 0
                    ? <div style={{ color: '#64748b', fontSize: 13 }}>No payments yet</div>
                    : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {detail.payments.map((p: any) => (
                          <div key={p._id} style={{ background: '#13102b', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{p.course?.title ?? (p.type === 'subscription' ? 'Subscription' : 'Payment')}</div>
                              <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{fmtDate(p.createdAt)} · <span className="pill pill-blue" style={{ fontSize: 10 }}>{p.type}</span></div>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#FF6B8A' }}>{fmtMoney(p.amount)}</div>
                          </div>
                        ))}
                      </div>
                    )
                  }
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default AdminStudents;
