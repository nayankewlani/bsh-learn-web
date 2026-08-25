import React, { useEffect, useState } from 'react';
import type { AdminCourse } from '../../api/admin';
import { adminGetCourses, adminUpdateCourse } from '../../api/admin';

const fmt = (p: number) => p === 0 ? 'Free' : '₹' + (p / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const Toggle: React.FC<{ on: boolean; loading: boolean; onChange: (v: boolean) => void; color?: string }> = ({ on, loading, onChange, color = '#22c55e' }) => (
  <button
    className="adm-toggle"
    style={{ background: on ? color : '#2D2D2D', cursor: loading ? 'wait' : 'pointer' }}
    onClick={() => !loading && onChange(!on)}
    disabled={loading}
  >
    <span className="adm-toggle-thumb" style={{ left: on ? 20 : 3 }} />
  </button>
);

const AdminCourses: React.FC = () => {
  const [courses, setCourses]   = useState<AdminCourse[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<'all' | 'published' | 'draft'>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    adminGetCourses()
      .then(r => { const d = r.data as any; setCourses(d.courses ?? d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggle = async (id: string, field: 'isPublished' | 'isFeatured', val: boolean) => {
    setUpdating(id + field);
    try {
      await adminUpdateCourse(id, { [field]: val });
      setCourses(prev => prev.map(c => c._id === id ? { ...c, [field]: val } : c));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = courses.filter(c => {
    const ms = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.educator?.name?.toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'all' ? true : filter === 'published' ? c.isPublished : !c.isPublished;
    return ms && mf;
  });

  return (
    <>
      <div className="adm-sh">
        <h2>Courses ({courses.length})</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'published', 'draft'] as const).map(f => (
            <button key={f} className={`adm-btn adm-btn-sm ${filter === f ? 'adm-btn-primary' : 'adm-btn-ghost'}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="adm-toolbar">
        <div className="adm-search">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input placeholder="Search course or trainer…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="adm-card" style={{ padding: 0 }}>
        {loading
          ? <div className="adm-loading"><div className="adm-spinner" /><span>Loading…</span></div>
          : filtered.length === 0 ? <div className="adm-empty">No courses found</div>
          : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Title</th><th>Trainer</th><th>Price</th><th>Enrolled</th><th>Published</th><th>Featured</th></tr></thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c._id}>
                      <td style={{ fontWeight: 600, color: '#e2e8f0', maxWidth: 220 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                      </td>
                      <td style={{ color: '#94a3b8' }}>{c.educator?.name ?? '—'}</td>
                      <td style={{ color: '#FF6B8A', fontWeight: 700 }}>{fmt(c.price)}</td>
                      <td style={{ textAlign: 'center' }}>{(c.enrollmentCount ?? 0).toLocaleString()}</td>
                      <td>
                        <Toggle on={c.isPublished} loading={updating === c._id + 'isPublished'} onChange={v => toggle(c._id, 'isPublished', v)} />
                      </td>
                      <td>
                        <Toggle on={c.isFeatured} loading={updating === c._id + 'isFeatured'} onChange={v => toggle(c._id, 'isFeatured', v)} color="#f59e0b" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </>
  );
};

export default AdminCourses;
