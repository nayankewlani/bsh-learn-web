import React, { useEffect, useState } from 'react';
import type { AdminEarnings } from '../../api/admin';
import { adminGetTransactions, adminGetEarnings } from '../../api/admin';

const fmt     = (p: number) => '₹' + (p / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmtDate = (d: string) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

interface Tx { _id: string; user: { name: string; email: string } | null; amount: number; type: string; status: string; createdAt: string; }

const AdminTransactions: React.FC = () => {
  const [txs, setTxs]           = useState<Tx[]>([]);
  const [earnings, setEarnings] = useState<AdminEarnings | null>(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  useEffect(() => {
    Promise.all([adminGetTransactions(), adminGetEarnings()])
      .then(([tr, er]) => {
        const d = tr.data as any;
        setTxs(d.transactions ?? d.payments ?? d);
        setEarnings(er.data as any);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sPill = (s: string) => {
    if (s === 'completed' || s === 'captured') return <span className="pill pill-green">{s}</span>;
    if (s === 'pending')  return <span className="pill pill-yellow">{s}</span>;
    if (s === 'failed')   return <span className="pill pill-red">{s}</span>;
    return <span className="pill pill-gray">{s}</span>;
  };

  const filtered = txs.filter(t =>
    !search || t.user?.name?.toLowerCase().includes(search.toLowerCase()) || t.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="adm-sh"><h2>Transactions & Earnings</h2></div>

      {earnings && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Revenue', value: fmt(earnings.totalRevenuePaise), color: '#a78bfa' },
            ...(earnings.byType ?? []).map(t => ({ label: t.type, value: fmt(t.revenuePaise), color: '#22c55e' })),
          ].map(s => (
            <div key={s.label} className="adm-card" style={{ flex: 1, minWidth: 130, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="adm-toolbar">
        <div className="adm-search">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input placeholder="Search user…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span style={{ fontSize: 12, color: '#64748b' }}>{filtered.length} records</span>
        <button className="adm-btn adm-btn-ghost" onClick={() => {
          const BOM = '﻿';
          const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
          const rows = filtered.map(t => [t.user?.name ?? 'Unknown', t.user?.email ?? '', fmt(t.amount), t.type, t.status, fmtDate(t.createdAt)].map(esc).join(','));
          const csv = BOM + ['User,Email,Amount,Type,Status,Date', ...rows].join('\r\n');
          const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
          Object.assign(document.createElement('a'), { href: url, download: `transactions_${new Date().toISOString().slice(0,10)}.csv` }).click();
          URL.revokeObjectURL(url);
        }}>⬇ CSV</button>
      </div>

      <div className="adm-card" style={{ padding: 0 }}>
        {loading
          ? <div className="adm-loading"><div className="adm-spinner" /><span>Loading…</span></div>
          : filtered.length === 0 ? <div className="adm-empty">No transactions found</div>
          : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>User</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{t.user?.name ?? 'Unknown'}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{t.user?.email ?? ''}</div>
                      </td>
                      <td><span className="pill pill-blue">{t.type}</span></td>
                      <td style={{ fontWeight: 700, color: '#a78bfa' }}>{fmt(t.amount)}</td>
                      <td>{sPill(t.status)}</td>
                      <td style={{ color: '#64748b', fontSize: 12 }}>{fmtDate(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {earnings?.monthlyBreakdown && earnings.monthlyBreakdown.length > 0 && (
        <div className="adm-card" style={{ marginTop: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 14 }}>📅 Monthly Revenue</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {earnings.monthlyBreakdown.map(m => {
              const max = Math.max(...earnings.monthlyBreakdown.map(x => x.revenuePaise), 1);
              return (
                <div className="adm-bar-row" key={m.month}>
                  <div style={{ width: 66, fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>{m.month}</div>
                  <div className="adm-bar-track">
                    <div className="adm-bar-fill" style={{ width: `${Math.round((m.revenuePaise / max) * 100)}%` }} />
                  </div>
                  <div style={{ width: 86, textAlign: 'right', fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>{fmt(m.revenuePaise)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminTransactions;
