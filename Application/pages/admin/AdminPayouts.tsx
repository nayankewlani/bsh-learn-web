import React, { useEffect, useState } from "react";
import client from "../../api/client";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

interface Payout {
  _id: string;
  trainer: { _id: string; name: string; email: string; avatar?: string };
  course: { _id: string; title: string; thumbnail?: string };
  student: { name: string; email: string };
  totalPaise: number;
  gstPaise: number;
  netPaise: number;
  trainerSharePaise: number;
  adminSharePaise: number;
  status: "pending" | "paid";
  paidAt?: string;
  paymentNote?: string;
  paidBy?: { name: string };
  createdAt: string;
}

interface Summary {
  pendingCount: number;
  pendingTrainerTotal: number;
  pendingAdminTotal: number;
  paidCount: number;
  paidTrainerTotal: number;
}

const fmt = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AdminPayouts: React.FC = () => {
  const [tab, setTab] = useState<"pending" | "paid">("pending");
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{ id: string; trainerName: string; amount: number } | null>(null);
  const [note, setNote] = useState("");

  const load = async (status: "pending" | "paid") => {
    setLoading(true);
    try {
      const { data } = await client.get(`/admin/payouts?status=${status}`);
      setPayouts(data.payouts);
      setSummary(data.summary);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(tab); }, [tab]);

  const openPayModal = (p: Payout) => {
    setNote("");
    setNoteModal({ id: p._id, trainerName: p.trainer.name, amount: p.trainerSharePaise });
  };

  const confirmPay = async () => {
    if (!noteModal) return;
    setPayingId(noteModal.id);
    try {
      await client.post(`/admin/payouts/${noteModal.id}/pay`, { paymentNote: note });
      setNoteModal(null);
      load(tab);
    } catch {
      alert("Failed to mark as paid");
    } finally {
      setPayingId(null);
    }
  };

  const statBox = (label: string, value: string, color: string) => (
    <div style={{ background: "#1A1A1A", border: "1px solid #1A1A1A", borderRadius: 14, padding: "18px 20px", minWidth: 160 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
      <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>{label}</div>
    </div>
  );

  return (
    <div>
      {/* Summary cards */}
      {summary && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
          {statBox("Pending Payouts", summary.pendingCount.toString(), "#f59e0b")}
          {statBox("Trainer Dues (Pending)", fmt(summary.pendingTrainerTotal), "#FF6B8A")}
          {statBox("Admin Share (Pending)", fmt(summary.pendingAdminTotal), "#34d399")}
          {statBox("Paid Payouts", summary.paidCount.toString(), "#4ade80")}
          {statBox("Total Paid to Trainers", fmt(summary.paidTrainerTotal), "#60a5fa")}
        </div>
      )}

      {/* Tabs + search + download */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {(["pending", "paid"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 22px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", border: "none",
              background: tab === t ? "#FF1E56" : "#1A1A1A",
              color: tab === t ? "#fff" : "#9ca3af",
            }}
          >
            {t === "pending" ? "⏳ Pending" : "✅ Paid History"}
          </button>
        ))}
      </div>

      {/* Search + download toolbar */}
      <div className="adm-toolbar" style={{ marginBottom: 16 }}>
        <div className="adm-search">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input placeholder="Search trainer or course…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="adm-btn adm-btn-ghost" onClick={() => {
          const BOM = '﻿';
          const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
          const displayed = payouts.filter(p => !search || p.trainer.name.toLowerCase().includes(search.toLowerCase()) || p.course.title.toLowerCase().includes(search.toLowerCase()));
          const rows = displayed.map(p => [p.trainer.name, p.trainer.email, p.course.title, p.student.name, fmt(p.totalPaise), fmt(p.gstPaise), fmt(p.netPaise), fmt(p.trainerSharePaise), fmt(p.adminSharePaise), p.status, p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '', p.paymentNote || '', new Date(p.createdAt).toLocaleDateString('en-IN')].map(esc).join(','));
          const csv = BOM + ['Trainer,Email,Course,Student,Sale Amount,GST,Net Amount,Trainer Share,Admin Share,Status,Paid On,Note,Date', ...rows].join('\r\n');
          const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
          Object.assign(document.createElement('a'), { href: url, download: `payouts_${tab}_${new Date().toISOString().slice(0,10)}.csv` }).click();
          URL.revokeObjectURL(url);
        }}>⬇ CSV</button>
      </div>

      {/* Table */}
      <div style={{ background: "#1A1A1A", border: "1px solid #1A1A1A", borderRadius: 16, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#FF1E56" }}>Loading...</div>
        ) : payouts.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#6b7280" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💸</div>
            <p>{tab === "pending" ? "No pending payouts" : "No paid payouts yet"}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1A1A1A" }}>
                  {["Trainer", "Course", "Student", "Sale Amount", "GST (18%)", "Net Amount", "Trainer Share (50%)", "Admin Share (50%)", "Date", tab === "pending" ? "Action" : "Paid On"].map((h) => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#9ca3af", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.filter(p => !search || p.trainer.name.toLowerCase().includes(search.toLowerCase()) || p.course.title.toLowerCase().includes(search.toLowerCase()) || p.student.name.toLowerCase().includes(search.toLowerCase())).map((p) => (
                  <tr key={p._id} style={{ borderBottom: "1px solid #1A1A1A" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar src={p.trainer.avatar} name={p.trainer.name} size={28} />
                        <div>
                          <div style={{ color: "#f3f4f6", fontSize: 13, fontWeight: 600 }}>{p.trainer.name}</div>
                          <div style={{ color: "#6b7280", fontSize: 11 }}>{p.trainer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#FF6B8A", fontSize: 13, maxWidth: 200 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.course.title}</div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ color: "#f3f4f6", fontSize: 13 }}>{p.student.name}</div>
                      <div style={{ color: "#6b7280", fontSize: 11 }}>{p.student.email}</div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#f3f4f6", fontSize: 13, fontWeight: 600 }}>{fmt(p.totalPaise)}</td>
                    <td style={{ padding: "12px 14px", color: "#f87171", fontSize: 13 }}>{fmt(p.gstPaise)}</td>
                    <td style={{ padding: "12px 14px", color: "#34d399", fontSize: 13 }}>{fmt(p.netPaise)}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ color: "#FF6B8A", fontSize: 13, fontWeight: 700 }}>{fmt(p.trainerSharePaise)}</span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ color: "#60a5fa", fontSize: 13, fontWeight: 700 }}>{fmt(p.adminSharePaise)}</span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#9ca3af", fontSize: 12, whiteSpace: "nowrap" }}>
                      {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {tab === "pending" ? (
                        <Button size="sm" onClick={() => openPayModal(p)} loading={payingId === p._id}>
                          Pay Trainer
                        </Button>
                      ) : (
                        <div>
                          <div style={{ color: "#4ade80", fontSize: 12, fontWeight: 600 }}>
                            {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </div>
                          {p.paymentNote && <div style={{ color: "#9ca3af", fontSize: 11, marginTop: 2 }}>{p.paymentNote}</div>}
                          {p.paidBy && <div style={{ color: "#6b7280", fontSize: 11 }}>by {p.paidBy.name}</div>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pay confirmation modal */}
      {noteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#1A1A1A", border: "1px solid #1A1A1A", borderRadius: 18, padding: 28, width: "100%", maxWidth: 420 }}>
            <h3 style={{ margin: "0 0 6px", color: "#f3f4f6", fontSize: 18, fontWeight: 800 }}>Confirm Payment</h3>
            <p style={{ color: "#9ca3af", fontSize: 14, margin: "0 0 18px" }}>
              Mark {fmt(noteModal.amount)} as paid to <strong style={{ color: "#FF6B8A" }}>{noteModal.trainerName}</strong>?
            </p>

            <label style={{ display: "block", color: "#9ca3af", fontSize: 13, marginBottom: 6 }}>Payment Note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. UPI transfer ref #123456"
              style={{
                width: "100%", padding: "10px 12px", background: "#111111", border: "1px solid #1A1A1A",
                borderRadius: 10, color: "#f3f4f6", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 20,
              }}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <Button onClick={confirmPay} loading={payingId === noteModal.id}>Confirm Paid</Button>
              <Button variant="secondary" onClick={() => setNoteModal(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayouts;
