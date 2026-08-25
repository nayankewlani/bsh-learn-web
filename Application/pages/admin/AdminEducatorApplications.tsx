import React, { useEffect, useState } from "react";
import { useThemeStore } from "../../stores/themeStore";
import client from "../../api/client";

interface Application {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  expertise: string;
  experience: string;
  bio: string;
  linkedIn?: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  createdAt: string;
}

interface Credentials { email: string; password?: string; note?: string }

const AdminEducatorApplications: React.FC = () => {
  const { t } = useThemeStore();
  const [pending, setPending]   = useState<Application[]>([]);
  const [approved, setApproved] = useState<Application[]>([]);
  const [rejected, setRejected] = useState<Application[]>([]);
  const [tab, setTab]           = useState<"pending" | "approved" | "rejected">("pending");
  const [loading, setLoading]   = useState(true);
  const [creds, setCreds]       = useState<Credentials | null>(null);
  const [copied, setCopied]     = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.get("/admin/educator-applications");
      setPending(data.pending);
      setApproved(data.approved);
      setRejected(data.rejected);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    try {
      const { data } = await client.post(`/admin/educator-applications/${id}/approve`);
      setCreds(data.credentials);
      await load();
    } catch (err: any) { alert(err.response?.data?.message || "Failed"); }
  };

  const reject = async (id: string) => {
    const note = prompt("Reason for rejection (optional):");
    try {
      await client.post(`/admin/educator-applications/${id}/reject`, { adminNote: note });
      await load();
    } catch (err: any) { alert(err.response?.data?.message || "Failed"); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [search, setSearch] = useState("");
  const lists: Record<string, Application[]> = { pending, approved, rejected };
  const current = lists[tab].filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()) || a.expertise.toLowerCase().includes(search.toLowerCase()));

  const badge = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      pending:  { background: "rgba(245,158,11,0.12)",  color: "#d97706" },
      approved: { background: "rgba(22,163,74,0.12)",   color: "#16a34a" },
      rejected: { background: "rgba(239,68,68,0.12)",   color: "#dc2626" },
    };
    return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, ...styles[status] }}>{status.toUpperCase()}</span>;
  };

  return (
    <div>
      {/* Credentials Modal */}
      {creds && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, maxWidth: 440, width: "100%", boxShadow: "0 25px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ fontSize: 40, textAlign: "center", marginBottom: 12 }}>🎉</div>
            <h3 style={{ margin: "0 0 8px", textAlign: "center", color: "#111", fontSize: 18, fontWeight: 800 }}>Educator Account Created</h3>
            <p style={{ margin: "0 0 20px", color: "#666", textAlign: "center", fontSize: 14 }}>Share these credentials with the educator</p>

            <div style={{ background: "#FFF5F7", border: "1.5px solid rgba(255,30,86,0.2)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#FF1E56", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Email</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>{creds.email}</div>
              </div>
              {creds.password && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#FF1E56", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Temporary Password</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111", letterSpacing: 1 }}>{creds.password}</div>
                </div>
              )}
              {creds.note && <div style={{ marginTop: 10, fontSize: 12, color: "#666", fontStyle: "italic" }}>{creds.note}</div>}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => copyToClipboard(`Email: ${creds.email}\nPassword: ${creds.password || "(existing account)"}`)}
                style={{ flex: 1, padding: "11px", background: "#FF1E56", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                {copied ? "Copied!" : "Copy Credentials"}
              </button>
              <button onClick={() => setCreds(null)} style={{ flex: 1, padding: "11px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: t.textPrimary }}>Educator Applications</h2>
        <p style={{ margin: 0, color: t.textSecond, fontSize: 14 }}>Review and approve applicants to create educator accounts</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        {(["pending", "approved", "rejected"] as const).map(k => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding: "7px 16px", borderRadius: 20, border: `1.5px solid ${tab === k ? t.accent : t.border}`, background: tab === k ? "rgba(255,30,86,0.12)" : "transparent", color: tab === k ? t.accent : t.textSecond, fontWeight: tab === k ? 700 : 500, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            {k.charAt(0).toUpperCase() + k.slice(1)}
            <span style={{ background: t.border, borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>{lists[k].length}</span>
          </button>
        ))}
      </div>

      {/* Search + download */}
      <div className="adm-toolbar" style={{ marginBottom: 18 }}>
        <div className="adm-search">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input placeholder="Search name, email or expertise…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span style={{ fontSize: 12, color: '#64748b' }}>{current.length} results</span>
        <button className="adm-btn adm-btn-ghost" onClick={() => {
          const BOM = '﻿';
          const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
          const rows = current.map(a => [a.name, a.email, a.phone || '', a.expertise, a.experience, a.status, new Date(a.createdAt).toLocaleDateString('en-IN')].map(esc).join(','));
          const csv = BOM + ['Name,Email,Phone,Expertise,Experience,Status,Applied On', ...rows].join('\r\n');
          const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
          Object.assign(document.createElement('a'), { href: url, download: `educator-applications_${tab}_${new Date().toISOString().slice(0,10)}.csv` }).click();
          URL.revokeObjectURL(url);
        }}>⬇ CSV</button>
      </div>

      {loading ? (
        <div style={{ color: t.textSecond, padding: 32, textAlign: "center" }}>Loading...</div>
      ) : current.length === 0 ? (
        <div style={{ color: t.textSecond, padding: "32px 0", textAlign: "center", fontSize: 14 }}>No {tab} applications</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {current.map(app => (
            <div key={app._id} style={{ background: t.bgCard, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, color: t.textPrimary, fontSize: 16 }}>{app.name}</span>
                    {badge(app.status)}
                  </div>
                  <div style={{ color: t.textSecond, fontSize: 13 }}>{app.email}{app.phone ? ` · ${app.phone}` : ""}</div>
                  {app.linkedIn && <a href={app.linkedIn} target="_blank" rel="noreferrer" style={{ color: "#0077b5", fontSize: 12, marginTop: 2, display: "block" }}>LinkedIn →</a>}
                </div>
                <div style={{ fontSize: 12, color: t.textSecond }}>{new Date(app.createdAt).toLocaleDateString()}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14, marginBottom: 16 }}>
                <div style={{ background: t.bgPrimary, borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: t.accent, marginBottom: 4, textTransform: "uppercase" }}>Expertise</div>
                  <div style={{ color: t.textPrimary, fontSize: 13 }}>{app.expertise}</div>
                </div>
                <div style={{ background: t.bgPrimary, borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: t.accent, marginBottom: 4, textTransform: "uppercase" }}>Experience</div>
                  <div style={{ color: t.textPrimary, fontSize: 13 }}>{app.experience}</div>
                </div>
              </div>

              <div style={{ background: t.bgPrimary, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: t.accent, marginBottom: 6, textTransform: "uppercase" }}>Bio / Motivation</div>
                <p style={{ margin: 0, color: t.textPrimary, fontSize: 13, lineHeight: 1.6 }}>{app.bio}</p>
              </div>

              {app.status === "pending" && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button onClick={() => approve(app._id)}
                    style={{ padding: "10px 22px", background: "linear-gradient(135deg,#16a34a,#15803d)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    Approve & Create Account
                  </button>
                  <button onClick={() => reject(app._id)}
                    style={{ padding: "10px 22px", background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                    Reject
                  </button>
                </div>
              )}
              {app.status === "rejected" && app.adminNote && (
                <div style={{ fontSize: 13, color: "#dc2626", background: "rgba(239,68,68,0.07)", padding: "8px 12px", borderRadius: 8 }}>
                  Rejection note: {app.adminNote}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminEducatorApplications;
