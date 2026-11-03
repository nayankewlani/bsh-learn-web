import React, { useEffect, useState, useRef } from "react";
import client from "../../api/client";

// ── Types ──────────────────────────────────────────────────────────────────
type Tier   = "golden" | "diamond" | "platinum";
type Status = "pending" | "active" | "suspended" | "terminated";

interface Membership {
  _id: string;
  userId: { _id: string; name: string; email: string; phone?: string; avatar?: string };
  tier:   Tier;
  status: Status;
  mouStatus: "not_generated" | "pending_sign" | "signed";
  mouSignedAt?: string;
  advancedBatchVerified: boolean;
  diamondPaymentStatus: string;
  mindcrafterStatus: string;
  batchNumber: string;
  qualifications: string;
  certifications: string;
  address: string;
  bankAccountName: string;
  bankAccountNo: string;
  bankIfsc: string;
  bankBranch: string;
  freeCoursesGranted: boolean;
  preferredByBsh: boolean;
  adminNotes: string;
  createdAt: string;
  activatedAt?: string;
  auditLog: { action: string; byName: string; at: string; note?: string }[];
}

interface Clause { id: string; heading: string; body: string; }
interface Template {
  tier: string;
  version: string;
  instituteName: string;
  registeredAddress: string;
  jurisdiction: string;
  authorizedSignatoryName: string;
  authorizedSignatoryDesignation: string;
  additionalClauses: Clause[];
}

interface EarningEntry {
  _id: string;
  userId: { name: string; email: string };
  type: string;
  grossAmountPaise: number;
  sharePercent: number;
  shareAmountPaise: number;
  description: string;
  transactionDate: string;
  settlementStatus: "pending" | "settled" | "cancelled";
}

// ── Styles ─────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  page:    { padding: "24px 28px", fontFamily: "Inter, Arial, sans-serif", color: "#e2e8f0", background: "#0f172a", minHeight: "100vh" },
  h1:      { fontSize: 22, fontWeight: 800, margin: "0 0 20px", color: "#f8fafc" },
  tabs:    { display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" },
  tab:     { padding: "8px 18px", borderRadius: 50, cursor: "pointer", fontWeight: 600, fontSize: 13, border: "1.5px solid #334155", background: "transparent", color: "#94a3b8" },
  tabA:    { padding: "8px 18px", borderRadius: 50, cursor: "pointer", fontWeight: 600, fontSize: 13, border: "1.5px solid #818cf8", background: "#1e1b4b", color: "#a5b4fc" },
  card:    { background: "#1e293b", borderRadius: 12, padding: "18px 22px", marginBottom: 14, border: "1px solid #334155" },
  row:     { display: "flex", gap: 14, alignItems: "center", marginBottom: 12, flexWrap: "wrap" as any },
  label:   { fontSize: 12, color: "#94a3b8", marginBottom: 4, display: "block" },
  input:   { background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 14, width: "100%" },
  select:  { background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 14, width: "100%" },
  btn:     { padding: "9px 20px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", border: "none" },
  btnP:    { padding: "9px 20px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", border: "none", background: "#4f46e5", color: "#fff" },
  btnG:    { padding: "9px 20px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", border: "none", background: "#16a34a", color: "#fff" },
  btnR:    { padding: "9px 20px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", border: "none", background: "#dc2626", color: "#fff" },
  btnO:    { padding: "9px 20px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", border: "none", background: "#d97706", color: "#fff" },
  badge:   { fontSize: 11, fontWeight: 700, borderRadius: 50, padding: "2px 10px", display: "inline-block" },
  chip:    { fontSize: 11, fontWeight: 700, borderRadius: 50, padding: "3px 11px", display: "inline-block", marginRight: 4 },
  table:   { width: "100%", borderCollapse: "collapse" as any },
  th:      { padding: "10px 12px", background: "#1e293b", color: "#94a3b8", fontSize: 12, fontWeight: 700, textAlign: "left" as any, borderBottom: "1px solid #334155" },
  td:      { padding: "10px 12px", color: "#e2e8f0", fontSize: 13, borderBottom: "1px solid #1e293b" },
  textarea:{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 13, width: "100%", resize: "vertical" as any, minHeight: 80 },
  step:    { display: "flex", alignItems: "center", gap: 6, marginBottom: 20 },
  stepDot: { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 },
  modal:   { position: "fixed" as any, inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modalBox:{ background: "#1e293b", borderRadius: 16, padding: "28px 32px", width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto" as any, border: "1px solid #334155" },
};

const TIER_COLOR: Record<Tier, string> = { golden: "#d97706", diamond: "#818cf8", platinum: "#22d3ee" };
const STATUS_COLOR: Record<Status, string> = { pending: "#d97706", active: "#22c55e", suspended: "#ef4444", terminated: "#6b7280" };
const fmt = (p: number) => "₹" + (p / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

// ── Step indicator ─────────────────────────────────────────────────────────
const STEPS = ["Create Educator","Select Tier","Apply Rules","Generate MOU","Educator Signs","Activate"];
const StepBar: React.FC<{ current: number }> = ({ current }) => (
  <div style={{ display: "flex", gap: 0, marginBottom: 28, flexWrap: "wrap" as any }}>
    {STEPS.map((s, i) => {
      const done    = i < current;
      const active  = i === current;
      const bg      = done ? "#22c55e" : active ? "#4f46e5" : "#334155";
      const color   = done || active ? "#fff" : "#64748b";
      return (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <div style={{ display: "flex", flexDirection: "column" as any, alignItems: "center", width: 80 }}>
            <div style={{ ...S.stepDot, background: bg, color: "#fff" }}>{done ? "✓" : i + 1}</div>
            <span style={{ fontSize: 10, color, textAlign: "center" as any, marginTop: 4, lineHeight: 1.3 }}>{s}</span>
          </div>
          {i < STEPS.length - 1 && <div style={{ width: 24, height: 2, background: done ? "#22c55e" : "#334155", marginBottom: 20 }} />}
        </div>
      );
    })}
  </div>
);

// ── Main page ──────────────────────────────────────────────────────────────
const AdminEducatorMembership: React.FC = () => {
  const [tab, setTab] = useState<"list" | "create" | "bulk" | "templates" | "earnings">("list");
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterTier, setFilterTier] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Membership | null>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [mouViewModal, setMouViewModal] = useState(false);
  const [mouHtml, setMouHtml] = useState("");
  const [earningsModal, setEarningsModal] = useState(false);
  const [earningsData, setEarningsData] = useState<EarningEntry[]>([]);

  // Create wizard
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", tier: "golden" as Tier,
    advancedBatchVerified: false, diamondPaymentStatus: "pending", diamondPaymentRef: "",
    mindcrafterStatus: "existing", batchNumber: "",
    adminNotes: "",
    qualifications: "", certifications: "", address: "",
    bankAccountName: "", bankAccountNo: "", bankIfsc: "", bankBranch: "",
  });
  const [createdMembership, setCreatedMembership] = useState<Membership | null>(null);
  const [saving, setSaving] = useState(false);

  // Bulk assign
  const [bulkTrainers, setBulkTrainers]   = useState<any[]>([]);
  const [bulkSelected, setBulkSelected]   = useState<Set<string>>(new Set());
  const [bulkTier, setBulkTier]           = useState<Tier>("golden");
  const [bulkSearch, setBulkSearch]       = useState("");
  const [bulkLoading, setBulkLoading]     = useState(false);
  const [bulkSaving, setBulkSaving]       = useState(false);
  const [bulkResult, setBulkResult]       = useState("");

  // Template editor
  const [tmplTier, setTmplTier] = useState<Tier>("golden");
  const [template, setTemplate] = useState<Template>({
    tier: "golden", version: "1.0",
    instituteName: "Blessings School of Hypnosis Private Limited",
    registeredAddress: "[Registered Office Address, Mumbai]",
    jurisdiction: "Mumbai, Maharashtra",
    authorizedSignatoryName: "", authorizedSignatoryDesignation: "Director",
    additionalClauses: [],
  });
  const [tmplSaving, setTmplSaving] = useState(false);

  // Earnings
  const [earningsAll, setEarningsAll] = useState<EarningEntry[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<any[]>([]);
  const [newEarning, setNewEarning] = useState({
    userId: "", type: "session", grossAmountPaise: "", description: "", referenceType: "manual",
  });

  useEffect(() => { if (tab === "list") fetchMemberships(); }, [tab, filterTier, filterStatus, search]);
  useEffect(() => { if (tab === "templates") fetchTemplate(tmplTier); }, [tmplTier, tab]);
  useEffect(() => { if (tab === "earnings") { fetchEarningsAdmin(); fetchEarningsSummary(); } }, [tab]);
  useEffect(() => { if (tab === "bulk") fetchBulkTrainers(); }, [tab]);

  async function fetchMemberships() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTier)   params.set("tier", filterTier);
      if (filterStatus) params.set("status", filterStatus);
      if (search)       params.set("q", search);
      const { data } = await client.get(`/membership?${params}`);
      setMemberships(data.memberships || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  async function fetchTemplate(tier: Tier) {
    try {
      const { data } = await client.get(`/mou/templates/${tier}`);
      setTemplate({ ...data.template, tier });
    } catch { /* use defaults */ }
  }

  async function fetchEarningsAdmin() {
    try {
      const { data } = await client.get("/earnings/admin");
      setEarningsAll(data.entries || []);
    } catch { /* ignore */ }
  }

  async function fetchEarningsSummary() {
    try {
      const { data } = await client.get("/earnings/summary");
      setEarningsSummary(data.summary || []);
    } catch { /* ignore */ }
  }

  async function handleCreateStep() {
    if (step === 0) {
      if (!form.name || !form.email) { alert("Name and email are required"); return; }
      setStep(1);
    } else if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      // Save educator + membership
      setSaving(true);
      try {
        const { data } = await client.post("/membership", form);
        setCreatedMembership(data.membership);
        setStep(3);
      } catch (e: any) {
        alert(e?.response?.data?.message || "Failed to create");
      } finally { setSaving(false); }
    } else if (step === 3) {
      // Generate MOU
      if (!createdMembership) return;
      setSaving(true);
      try {
        const { data } = await client.post(`/mou/generate/${createdMembership._id}`, {
          authorizedSignatoryName: template.authorizedSignatoryName,
        });
        alert(`MOU generated! Agreement ID: ${data.agreementId}`);
        setStep(4);
      } catch (e: any) {
        alert(e?.response?.data?.message || "Failed to generate MOU");
      } finally { setSaving(false); }
    } else if (step === 4) {
      // Waiting for educator signature — check status
      if (!createdMembership) return;
      try {
        const { data } = await client.get(`/membership/${createdMembership._id}`);
        if (data.membership.mouStatus === "signed") {
          setStep(5);
        } else {
          alert("MOU has not been signed yet by the educator. Please wait.");
        }
      } catch { /* ignore */ }
    } else if (step === 5) {
      // Activate
      if (!createdMembership) return;
      setSaving(true);
      try {
        await client.post(`/membership/${createdMembership._id}/activate`);
        alert("Educator activated successfully!");
        setTab("list");
        setStep(0);
        setCreatedMembership(null);
      } catch (e: any) {
        alert(e?.response?.data?.message || "Failed to activate");
      } finally { setSaving(false); }
    }
  }

  async function handleGenerateMou(m: Membership) {
    setSaving(true);
    try {
      const { data } = await client.post(`/mou/generate/${m._id}`, {});
      alert(`MOU generated: ${data.agreementId}`);
      fetchMemberships();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed");
    } finally { setSaving(false); }
  }

  async function handleViewMou(m: Membership) {
    try {
      const { data } = await client.get("/mou/list");
      const mou = data.mous.find((x: any) => x.membershipId === m._id || (x.userId?._id || x.userId) === (m.userId?._id || m.userId));
      if (mou) { setMouHtml(mou.mouContentHtml); setMouViewModal(true); }
      else alert("No MOU document found");
    } catch { /* ignore */ }
  }

  async function handleActivate(m: Membership) {
    if (!confirm(`Activate ${m.userId?.name}? MOU must already be signed.`)) return;
    try {
      await client.post(`/membership/${m._id}/activate`);
      fetchMemberships();
    } catch (e: any) { alert(e?.response?.data?.message || "Failed"); }
  }

  async function handleSuspend(m: Membership, action: "suspend" | "terminate") {
    const note = prompt(`Reason for ${action}?`) || "";
    try {
      await client.post(`/membership/${m._id}/suspend`, { action, note });
      fetchMemberships();
    } catch (e: any) { alert(e?.response?.data?.message || "Failed"); }
  }

  async function handleSaveTemplate() {
    setTmplSaving(true);
    try {
      await client.put(`/mou/templates/${tmplTier}`, template);
      alert("Template saved!");
    } catch { alert("Failed to save"); } finally { setTmplSaving(false); }
  }

  async function handleSettleEarning(id: string) {
    const note = prompt("Settlement note (e.g. bank transfer ref):") || "";
    try {
      await client.put(`/earnings/${id}/settle`, { note });
      fetchEarningsAdmin();
    } catch { /* ignore */ }
  }

  async function handleAddEarning() {
    if (!newEarning.userId || !newEarning.grossAmountPaise) { alert("User and amount are required"); return; }
    try {
      await client.post("/earnings", { ...newEarning, grossAmountPaise: Number(newEarning.grossAmountPaise) * 100 });
      alert("Earning recorded!");
      setNewEarning({ userId: "", type: "session", grossAmountPaise: "", description: "", referenceType: "manual" });
      fetchEarningsAdmin();
    } catch (e: any) { alert(e?.response?.data?.message || "Failed"); }
  }

  const addClause = () => {
    const id = `clause_${Date.now()}`;
    setTemplate(t => ({ ...t, additionalClauses: [...t.additionalClauses, { id, heading: "", body: "" }] }));
  };
  const removeClause = (id: string) => {
    setTemplate(t => ({ ...t, additionalClauses: t.additionalClauses.filter(c => c.id !== id) }));
  };
  const updateClause = (id: string, field: "heading" | "body", val: string) => {
    setTemplate(t => ({
      ...t,
      additionalClauses: t.additionalClauses.map(c => c.id === id ? { ...c, [field]: val } : c),
    }));
  };

  const filtered = memberships.filter(m => {
    if (filterTier   && m.tier   !== filterTier)   return false;
    if (filterStatus && m.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.userId?.name?.toLowerCase().includes(q) || m.userId?.email?.toLowerCase().includes(q);
    }
    return true;
  });

  async function fetchBulkTrainers() {
    setBulkLoading(true);
    try {
      const [trainersRes, membershipsRes] = await Promise.all([
        client.get("/admin/trainers"),
        client.get("/membership?limit=1000"),
      ]);
      const enrolledIds = new Set((membershipsRes.data.memberships || []).map((m: any) => String(m.userId?._id || m.userId)));
      const trainers = (trainersRes.data.trainers || trainersRes.data || [])
        .filter((t: any) => !enrolledIds.has(String(t._id)));
      setBulkTrainers(trainers);
      setBulkSelected(new Set());
      setBulkResult("");
    } catch { /* ignore */ } finally { setBulkLoading(false); }
  }

  async function handleBulkAssign() {
    if (bulkSelected.size === 0) { alert("Select at least one trainer"); return; }
    if (!confirm(`Assign ${bulkTier} tier to ${bulkSelected.size} trainer(s)?`)) return;
    setBulkSaving(true);
    setBulkResult("");
    try {
      const { data } = await client.post("/membership/bulk", { userIds: Array.from(bulkSelected), tier: bulkTier });
      setBulkResult(data.message || "Done");
      await fetchBulkTrainers();
    } catch (e: any) {
      setBulkResult(e?.response?.data?.message || "Failed");
    } finally { setBulkSaving(false); }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <h1 style={S.h1}>Educator Memberships</h1>

      {/* Tab bar */}
      <div style={S.tabs}>
        {(["list","create","bulk","templates","earnings"] as const).map(t => (
          <button key={t} style={tab === t ? S.tabA : S.tab} onClick={() => { setTab(t); if (t === "create") setStep(0); }}>
            {t === "list" ? "All Educators" : t === "create" ? "+ Onboard Educator" : t === "bulk" ? "⚡ Bulk Assign" : t === "templates" ? "MOU Templates" : "Earnings"}
          </button>
        ))}
      </div>

      {/* ── LIST ── */}
      {tab === "list" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" as any }}>
            <input placeholder="Search name or email…" style={{ ...S.input, maxWidth: 260 }} value={search} onChange={e => setSearch(e.target.value)} />
            <select style={{ ...S.select, maxWidth: 160 }} value={filterTier} onChange={e => setFilterTier(e.target.value)}>
              <option value="">All Tiers</option>
              <option value="golden">Golden</option>
              <option value="diamond">Diamond</option>
              <option value="platinum">Platinum</option>
            </select>
            <select style={{ ...S.select, maxWidth: 180 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          {loading ? <p style={{ color: "#64748b" }}>Loading…</p> : (
            <table style={S.table}>
              <thead>
                <tr>
                  {["Educator","Tier","Status","MOU","Preferred","Actions"].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m._id} style={{ background: "#0f172a" }}>
                    <td style={S.td}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{m.userId?.name}</div>
                      <div style={{ color: "#64748b", fontSize: 12 }}>{m.userId?.email}</div>
                    </td>
                    <td style={S.td}>
                      <span style={{ ...S.chip, background: TIER_COLOR[m.tier] + "22", color: TIER_COLOR[m.tier] }}>
                        {m.tier.charAt(0).toUpperCase() + m.tier.slice(1)}
                      </span>
                    </td>
                    <td style={S.td}>
                      <span style={{ ...S.chip, background: STATUS_COLOR[m.status] + "22", color: STATUS_COLOR[m.status] }}>
                        {m.status}
                      </span>
                    </td>
                    <td style={S.td}>
                      <span style={{ fontSize: 12, color: m.mouStatus === "signed" ? "#22c55e" : m.mouStatus === "pending_sign" ? "#d97706" : "#64748b" }}>
                        {m.mouStatus === "signed" ? "✓ Signed" : m.mouStatus === "pending_sign" ? "⏳ Pending" : "Not Generated"}
                      </span>
                    </td>
                    <td style={S.td}>
                      {m.preferredByBsh ? <span style={{ color: "#22d3ee", fontSize: 12 }}>⭐ Yes</span> : <span style={{ color: "#475569", fontSize: 12 }}>—</span>}
                    </td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as any }}>
                        <button style={{ ...S.btn, background: "#1e293b", color: "#a5b4fc", border: "1px solid #334155", fontSize: 11 }}
                          onClick={() => { setSelected(m); setDetailModal(true); }}>
                          Edit
                        </button>
                        {m.mouStatus === "not_generated" && (
                          <button style={{ ...S.btn, background: "#0c2461", color: "#93c5fd", fontSize: 11 }}
                            onClick={() => handleGenerateMou(m)}>
                            Gen MOU
                          </button>
                        )}
                        {m.mouStatus !== "not_generated" && (
                          <button style={{ ...S.btn, background: "#0f172a", color: "#67e8f9", border: "1px solid #334155", fontSize: 11 }}
                            onClick={() => handleViewMou(m)}>
                            View MOU
                          </button>
                        )}
                        {m.status === "pending" && m.mouStatus === "signed" && (
                          <button style={{ ...S.btn, ...S.btnG, fontSize: 11 }} onClick={() => handleActivate(m)}>Activate</button>
                        )}
                        {m.status === "active" && (
                          <button style={{ ...S.btn, ...S.btnO, fontSize: 11 }} onClick={() => handleSuspend(m, "suspend")}>Suspend</button>
                        )}
                        {m.status !== "terminated" && (
                          <button style={{ ...S.btn, ...S.btnR, fontSize: 11 }} onClick={() => handleSuspend(m, "terminate")}>End</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "#475569", padding: 28 }}>No educators found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── CREATE WIZARD ── */}
      {tab === "create" && (
        <div style={S.card}>
          <StepBar current={step} />

          {step === 0 && (
            <div>
              <h3 style={{ color: "#f8fafc", marginTop: 0 }}>Step 1 — Create Educator</h3>
              <div style={S.row}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={S.label}>Full Name *</label>
                  <input style={S.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={S.label}>Email *</label>
                  <input style={S.input} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div style={S.row}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={S.label}>Mobile Number</label>
                  <input style={S.input} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <p style={{ color: "#64748b", fontSize: 12 }}>If the email already exists, the user will be promoted to educator. A temporary password will be set if creating a new user.</p>
            </div>
          )}

          {step === 1 && (
            <div>
              <h3 style={{ color: "#f8fafc", marginTop: 0 }}>Step 2 — Select Membership Tier</h3>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" as any, marginBottom: 20 }}>
                {(["golden","diamond","platinum"] as Tier[]).map(t => (
                  <div key={t} onClick={() => setForm(f => ({ ...f, tier: t }))}
                    style={{ flex: 1, minWidth: 160, border: `2px solid ${form.tier === t ? TIER_COLOR[t] : "#334155"}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", background: form.tier === t ? TIER_COLOR[t] + "18" : "#0f172a" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: TIER_COLOR[t], textTransform: "capitalize" }}>{t}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, lineHeight: 1.5 }}>
                      {t === "golden"   && "For existing Advanced Batch students.\nSession & course income: 40%"}
                      {t === "diamond"  && "Advanced Batch + ₹50,000 membership fee.\nSession & course income: 50%"}
                      {t === "platinum" && "Mindcrafters only. Session: 60%, BSH course sales: 25%.\nPreferred by BSH tag + priority listing."}
                    </div>
                  </div>
                ))}
              </div>
              {form.tier === "golden" && (
                <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#e2e8f0", cursor: "pointer" }}>
                  <input type="checkbox" checked={form.advancedBatchVerified} onChange={e => setForm(f => ({ ...f, advancedBatchVerified: e.target.checked }))} />
                  Confirm: Advanced Batch student eligibility verified
                </label>
              )}
              {form.tier === "diamond" && (
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#e2e8f0", cursor: "pointer", marginBottom: 10 }}>
                    <input type="checkbox" checked={form.advancedBatchVerified} onChange={e => setForm(f => ({ ...f, advancedBatchVerified: e.target.checked }))} />
                    Confirm: Advanced Batch student eligibility verified
                  </label>
                  <div style={S.row}>
                    <div style={{ flex: 1 }}>
                      <label style={S.label}>₹50,000 Diamond Payment Status</label>
                      <select style={S.select} value={form.diamondPaymentStatus} onChange={e => setForm(f => ({ ...f, diamondPaymentStatus: e.target.value }))}>
                        <option value="pending">Pending</option>
                        <option value="verified">Verified / Paid</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={S.label}>Payment Reference / UTR</label>
                      <input style={S.input} value={form.diamondPaymentRef} onChange={e => setForm(f => ({ ...f, diamondPaymentRef: e.target.value }))} />
                    </div>
                  </div>
                </div>
              )}
              {form.tier === "platinum" && (
                <div>
                  <div style={S.row}>
                    <div style={{ flex: 1 }}>
                      <label style={S.label}>Mindcrafter Status</label>
                      <select style={S.select} value={form.mindcrafterStatus} onChange={e => setForm(f => ({ ...f, mindcrafterStatus: e.target.value }))}>
                        <option value="existing">Existing Mindcrafter</option>
                        <option value="newly_enrolled">Newly Enrolled Mindcrafter</option>
                        <option value="verified">Verified</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={S.label}>Batch Number (L1–L100)</label>
                      <select style={S.select} value={form.batchNumber} onChange={e => setForm(f => ({ ...f, batchNumber: e.target.value }))}>
                        <option value="">Select batch…</option>
                        {Array.from({ length: 100 }, (_, i) => `L${i + 1}`).map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={{ color: "#f8fafc", marginTop: 0 }}>Step 3 — Profile &amp; Banking Details</h3>
              <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 16 }}>These can be updated later. Fill what's available now.</p>
              <div style={S.row}>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Qualifications</label>
                  <input style={S.input} value={form.qualifications} onChange={e => setForm(f => ({ ...f, qualifications: e.target.value }))} placeholder="e.g. Certified Clinical Hypnotherapist" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Certifications</label>
                  <input style={S.input} value={form.certifications} onChange={e => setForm(f => ({ ...f, certifications: e.target.value }))} placeholder="e.g. NLP Practitioner, NGH Member" />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={S.label}>Address</label>
                <input style={S.input} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <h4 style={{ color: "#94a3b8", marginBottom: 10 }}>Bank Details (for earnings settlement)</h4>
              <div style={S.row}>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Account Holder Name</label>
                  <input style={S.input} value={form.bankAccountName} onChange={e => setForm(f => ({ ...f, bankAccountName: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Account Number</label>
                  <input style={S.input} value={form.bankAccountNo} onChange={e => setForm(f => ({ ...f, bankAccountNo: e.target.value }))} />
                </div>
              </div>
              <div style={S.row}>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>IFSC Code</label>
                  <input style={S.input} value={form.bankIfsc} onChange={e => setForm(f => ({ ...f, bankIfsc: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Branch</label>
                  <input style={S.input} value={form.bankBranch} onChange={e => setForm(f => ({ ...f, bankBranch: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={S.label}>Admin Notes</label>
                <textarea style={S.textarea} value={form.adminNotes} onChange={e => setForm(f => ({ ...f, adminNotes: e.target.value }))} />
              </div>
            </div>
          )}

          {step === 3 && createdMembership && (
            <div>
              <h3 style={{ color: "#f8fafc", marginTop: 0 }}>Step 4 — Generate MOU</h3>
              <div style={{ ...S.card, background: "#0c2461", border: "1px solid #1e40af" }}>
                <p style={{ color: "#93c5fd", margin: 0 }}>
                  Educator <strong>{createdMembership.userId?.name || form.name}</strong> created with <strong>{form.tier}</strong> membership.<br/>
                  Click "Generate MOU" to create the agreement document for this educator.
                  The MOU will be pre-populated with their details and the {form.tier} tier terms.
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 style={{ color: "#f8fafc", marginTop: 0 }}>Step 5 — Awaiting Educator Signature</h3>
              <div style={{ ...S.card, background: "#1a1200", border: "1px solid #d97706" }}>
                <p style={{ color: "#fbbf24", margin: 0 }}>
                  The MOU has been generated. The educator must log into the BSH mobile app and sign the agreement.<br/><br/>
                  Click "Check Signature Status" to verify if they have signed. Once signed, you can proceed to Step 6.
                </p>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h3 style={{ color: "#f8fafc", marginTop: 0 }}>Step 6 — Admin Verification &amp; Activation</h3>
              <div style={{ ...S.card, background: "#052e16", border: "1px solid #16a34a" }}>
                <p style={{ color: "#86efac", margin: 0 }}>
                  MOU is signed. Review the eligibility, documents and signed MOU before activating.<br/>
                  Activation will enable the educator's profile, grant permissions, and (for Diamond/Platinum) grant free course access.
                </p>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            {step > 0 && step < 5 && (
              <button style={{ ...S.btn, background: "#334155", color: "#e2e8f0" }} onClick={() => setStep(s => s - 1)}>← Back</button>
            )}
            <button style={S.btnP} onClick={handleCreateStep} disabled={saving}>
              {saving ? "Saving…" :
               step === 0 ? "Next →" :
               step === 1 ? "Next →" :
               step === 2 ? "Create Educator" :
               step === 3 ? "Generate MOU" :
               step === 4 ? "Check Signature Status" :
               "Activate Educator"}
            </button>
          </div>
        </div>
      )}

      {/* ── BULK ASSIGN ── */}
      {tab === "bulk" && (
        <div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
            <input
              style={{ flex: 1, minWidth: 200, background: "#1e1b3a", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13 }}
              placeholder="Search trainer name or email…"
              value={bulkSearch}
              onChange={e => setBulkSearch(e.target.value)}
            />
            <select
              style={{ background: "#1e1b3a", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", color: "#e2e8f0", fontSize: 13 }}
              value={bulkTier}
              onChange={e => setBulkTier(e.target.value as Tier)}
            >
              <option value="golden">🥇 Golden</option>
              <option value="diamond">💎 Diamond</option>
              <option value="platinum">🏆 Platinum</option>
            </select>
            <button
              style={{ background: bulkSelected.size === 0 ? "#334155" : "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}
              onClick={handleBulkAssign}
              disabled={bulkSaving || bulkSelected.size === 0}
            >{bulkSaving ? "Assigning…" : `Assign ${bulkTier} to ${bulkSelected.size} selected`}</button>
            <button
              style={{ background: "#1e1b3a", border: "1px solid #334155", color: "#94a3b8", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12 }}
              onClick={() => setBulkSelected(new Set(bulkTrainers.map((t: any) => t._id)))}
            >Select All</button>
            {bulkSelected.size > 0 && (
              <button
                style={{ background: "#1e1b3a", border: "1px solid #334155", color: "#94a3b8", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12 }}
                onClick={() => setBulkSelected(new Set())}
              >Clear</button>
            )}
          </div>
          {bulkResult && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 8, background: bulkResult.includes("Failed") ? "#7f1d1d" : "#14532d", color: "#fff", fontSize: 13 }}>{bulkResult}</div>}
          {bulkLoading
            ? <div style={{ color: "#94a3b8", padding: 20 }}>Loading trainers…</div>
            : bulkTrainers.length === 0
              ? <div style={{ color: "#64748b", padding: 20 }}>All trainers are already enrolled in a tier.</div>
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {bulkTrainers
                    .filter((t: any) => !bulkSearch || t.name?.toLowerCase().includes(bulkSearch.toLowerCase()) || t.email?.toLowerCase().includes(bulkSearch.toLowerCase()))
                    .map((t: any) => (
                      <div
                        key={t._id}
                        onClick={() => setBulkSelected(prev => { const n = new Set(prev); n.has(t._id) ? n.delete(t._id) : n.add(t._id); return n; })}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, background: bulkSelected.has(t._id) ? "#1e1040" : "#13102b", border: `1px solid ${bulkSelected.has(t._id) ? "#7c3aed" : "#1e293b"}`, cursor: "pointer" }}
                      >
                        <input type="checkbox" checked={bulkSelected.has(t._id)} readOnly style={{ accentColor: "#7c3aed" }} />
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>
                          {t.name?.charAt(0)?.toUpperCase() || "T"}
                        </div>
                        <div>
                          <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                          <div style={{ color: "#64748b", fontSize: 12 }}>{t.email}</div>
                        </div>
                      </div>
                    ))}
                </div>
              )
          }
        </div>
      )}

      {/* ── MOU TEMPLATES ── */}
      {tab === "templates" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {(["golden","diamond","platinum"] as Tier[]).map(t => (
              <button key={t} style={tmplTier === t ? { ...S.tab, border: `2px solid ${TIER_COLOR[t]}`, color: TIER_COLOR[t], background: TIER_COLOR[t] + "15" } : { ...S.tab, color: "#64748b" }}
                onClick={() => setTmplTier(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)} Template
              </button>
            ))}
          </div>
          <div style={S.card}>
            <h3 style={{ color: "#f8fafc", marginTop: 0 }}>
              <span style={{ color: TIER_COLOR[tmplTier] }}>{tmplTier.charAt(0).toUpperCase() + tmplTier.slice(1)}</span> MOU Template
            </h3>
            <p style={{ color: "#64748b", fontSize: 12, marginBottom: 18 }}>
              These settings populate every new MOU generated for {tmplTier} educators. You can also override per-educator after generation.
            </p>

            <div style={S.row}>
              <div style={{ flex: 2 }}>
                <label style={S.label}>Institute Name</label>
                <input style={S.input} value={template.instituteName} onChange={e => setTemplate(t => ({ ...t, instituteName: e.target.value }))} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Template Version</label>
                <input style={S.input} value={template.version} onChange={e => setTemplate(t => ({ ...t, version: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Registered Address</label>
              <input style={S.input} value={template.registeredAddress} onChange={e => setTemplate(t => ({ ...t, registeredAddress: e.target.value }))} />
            </div>
            <div style={S.row}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Jurisdiction (City, State)</label>
                <input style={S.input} value={template.jurisdiction} onChange={e => setTemplate(t => ({ ...t, jurisdiction: e.target.value }))} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Authorised Signatory Name</label>
                <input style={S.input} value={template.authorizedSignatoryName} onChange={e => setTemplate(t => ({ ...t, authorizedSignatoryName: e.target.value }))} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Signatory Designation</label>
                <input style={S.input} value={template.authorizedSignatoryDesignation} onChange={e => setTemplate(t => ({ ...t, authorizedSignatoryDesignation: e.target.value }))} />
              </div>
            </div>

            <h4 style={{ color: "#94a3b8", marginTop: 20, marginBottom: 10 }}>Additional Clauses (shown in bullet-point sections)</h4>
            {template.additionalClauses.map((c, idx) => (
              <div key={c.id} style={{ ...S.card, marginBottom: 10, background: "#0f172a" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ color: "#94a3b8", fontSize: 12 }}>Clause {idx + 1}</span>
                  <button style={{ ...S.btn, ...S.btnR, fontSize: 11, padding: "4px 12px" }} onClick={() => removeClause(c.id)}>Remove</button>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={S.label}>Heading</label>
                  <input style={S.input} value={c.heading} onChange={e => updateClause(c.id, "heading", e.target.value)} placeholder="e.g. Non-Compete Clause" />
                </div>
                <div>
                  <label style={S.label}>Body (bullet points, one per line)</label>
                  <textarea style={S.textarea} value={c.body} onChange={e => updateClause(c.id, "body", e.target.value)} rows={4} />
                </div>
              </div>
            ))}
            <button style={{ ...S.btn, background: "#1e293b", color: "#818cf8", border: "1px solid #334155", marginBottom: 16 }} onClick={addClause}>
              + Add Clause
            </button>

            <button style={S.btnP} onClick={handleSaveTemplate} disabled={tmplSaving}>
              {tmplSaving ? "Saving…" : "Save Template"}
            </button>
          </div>
        </div>
      )}

      {/* ── EARNINGS ── */}
      {tab === "earnings" && (
        <div>
          {/* Summary cards */}
          <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" as any }}>
            {earningsSummary.slice(0, 6).map((s: any) => (
              <div key={s._id} style={{ ...S.card, minWidth: 200, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                <div style={{ color: "#64748b", fontSize: 12, marginBottom: 8 }}>{s.email}</div>
                <div style={{ color: "#fbbf24", fontSize: 13 }}>Pending: {fmt(s.pending || 0)}</div>
                <div style={{ color: "#22c55e", fontSize: 13 }}>Settled: {fmt(s.settled || 0)}</div>
              </div>
            ))}
          </div>

          {/* Record new earning */}
          <div style={{ ...S.card, marginBottom: 24 }}>
            <h4 style={{ color: "#f8fafc", marginTop: 0, marginBottom: 16 }}>Record New Transaction</h4>
            <div style={S.row}>
              <div style={{ flex: 2 }}>
                <label style={S.label}>Educator User ID</label>
                <input style={S.input} placeholder="MongoDB _id of educator" value={newEarning.userId} onChange={e => setNewEarning(n => ({ ...n, userId: e.target.value }))} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Type</label>
                <select style={S.select} value={newEarning.type} onChange={e => setNewEarning(n => ({ ...n, type: e.target.value }))}>
                  <option value="session">Session</option>
                  <option value="personal_course">Personal Course</option>
                  <option value="bsh_course_sale">BSH Course Sale</option>
                  <option value="mindcrafter_referral">Mindcrafter Referral</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Gross Amount (₹)</label>
                <input style={S.input} type="number" placeholder="e.g. 1000" value={newEarning.grossAmountPaise} onChange={e => setNewEarning(n => ({ ...n, grossAmountPaise: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Description</label>
              <input style={S.input} value={newEarning.description} onChange={e => setNewEarning(n => ({ ...n, description: e.target.value }))} placeholder="e.g. Session with client on 20 Oct 2026" />
            </div>
            <button style={S.btnP} onClick={handleAddEarning}>Record Earning</button>
          </div>

          {/* Earnings ledger */}
          <div style={S.card}>
            <h4 style={{ color: "#f8fafc", marginTop: 0 }}>Transaction Ledger</h4>
            <table style={S.table}>
              <thead>
                <tr>
                  {["Educator","Type","Gross","Share %","Payable","Date","Status","Action"].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {earningsAll.map(e => (
                  <tr key={e._id} style={{ background: "#0f172a" }}>
                    <td style={S.td}><div style={{ fontSize: 12 }}>{e.userId?.name || "—"}</div></td>
                    <td style={S.td}><span style={{ fontSize: 11, color: "#818cf8" }}>{e.type.replace(/_/g, " ")}</span></td>
                    <td style={S.td}>{fmt(e.grossAmountPaise)}</td>
                    <td style={S.td}>{e.sharePercent}%</td>
                    <td style={{ ...S.td, color: "#22c55e", fontWeight: 700 }}>{fmt(e.shareAmountPaise)}</td>
                    <td style={S.td}><span style={{ fontSize: 11 }}>{fmtDate(e.transactionDate)}</span></td>
                    <td style={S.td}>
                      <span style={{ ...S.chip, background: e.settlementStatus === "settled" ? "#22c55e22" : "#d9770622", color: e.settlementStatus === "settled" ? "#22c55e" : "#fbbf24", fontSize: 11 }}>
                        {e.settlementStatus}
                      </span>
                    </td>
                    <td style={S.td}>
                      {e.settlementStatus === "pending" && (
                        <button style={{ ...S.btn, ...S.btnG, fontSize: 11, padding: "4px 10px" }} onClick={() => handleSettleEarning(e._id)}>Settle</button>
                      )}
                    </td>
                  </tr>
                ))}
                {earningsAll.length === 0 && (
                  <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", color: "#475569", padding: 28 }}>No transactions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {detailModal && selected && (
        <EditMembershipModal
          membership={selected}
          onClose={() => { setDetailModal(false); fetchMemberships(); }}
        />
      )}

      {/* ── MOU VIEW MODAL ── */}
      {mouViewModal && (
        <div style={S.modal} onClick={() => setMouViewModal(false)}>
          <div style={{ ...S.modalBox, maxWidth: 860, background: "#fff" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: "#111" }}>MOU Document</h3>
              <button style={{ ...S.btn, background: "#f1f5f9", color: "#333" }} onClick={() => setMouViewModal(false)}>Close</button>
            </div>
            <div dangerouslySetInnerHTML={{ __html: mouHtml }} style={{ fontFamily: "Arial, sans-serif", fontSize: 13, color: "#111" }} />
          </div>
        </div>
      )}
    </div>
  );
};

// ── Edit membership modal ──────────────────────────────────────────────────
const EditMembershipModal: React.FC<{ membership: Membership; onClose: () => void }> = ({ membership, onClose }) => {
  const [form, setForm] = useState({ ...membership });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "audit">("details");

  async function save() {
    setSaving(true);
    try {
      await client.put(`/membership/${membership._id}`, form);
      onClose();
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to save");
    } finally { setSaving(false); }
  }

  return (
    <div style={S.modal}>
      <div style={S.modalBox} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#f8fafc" }}>Edit: {membership.userId?.name}</h3>
          <button style={{ ...S.btn, background: "#334155", color: "#e2e8f0" }} onClick={onClose}>✕ Close</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button style={activeTab === "details" ? S.tabA : S.tab} onClick={() => setActiveTab("details")}>Details</button>
          <button style={activeTab === "audit" ? S.tabA : S.tab} onClick={() => setActiveTab("audit")}>Audit Log</button>
        </div>

        {activeTab === "details" && (
          <div>
            <div style={S.row}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Tier</label>
                <select style={S.select} value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value as Tier }))}>
                  <option value="golden">Golden</option>
                  <option value="diamond">Diamond</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Advanced Batch Verified</label>
                <select style={S.select} value={form.advancedBatchVerified ? "yes" : "no"} onChange={e => setForm(f => ({ ...f, advancedBatchVerified: e.target.value === "yes" }))}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>
            {form.tier === "diamond" && (
              <div style={S.row}>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Diamond Payment Status</label>
                  <select style={S.select} value={form.diamondPaymentStatus} onChange={e => setForm(f => ({ ...f, diamondPaymentStatus: e.target.value }))}>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="not_applicable">N/A</option>
                  </select>
                </div>
              </div>
            )}
            {form.tier === "platinum" && (
              <div style={S.row}>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Mindcrafter Status</label>
                  <select style={S.select} value={form.mindcrafterStatus} onChange={e => setForm(f => ({ ...f, mindcrafterStatus: e.target.value }))}>
                    <option value="not_applicable">N/A</option>
                    <option value="existing">Existing</option>
                    <option value="newly_enrolled">Newly Enrolled</option>
                    <option value="verified">Verified</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>Batch Number</label>
                  <select style={S.select} value={form.batchNumber} onChange={e => setForm(f => ({ ...f, batchNumber: e.target.value }))}>
                    <option value="">Select…</option>
                    {Array.from({ length: 100 }, (_, i) => `L${i + 1}`).map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Qualifications</label>
              <input style={S.input} value={form.qualifications} onChange={e => setForm(f => ({ ...f, qualifications: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Certifications</label>
              <input style={S.input} value={form.certifications} onChange={e => setForm(f => ({ ...f, certifications: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Admin Notes</label>
              <textarea style={S.textarea} value={form.adminNotes} onChange={e => setForm(f => ({ ...f, adminNotes: e.target.value }))} />
            </div>
            <button style={S.btnP} onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        )}

        {activeTab === "audit" && (
          <div>
            {membership.auditLog.map((a, i) => (
              <div key={i} style={{ borderLeft: "3px solid #334155", paddingLeft: 12, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0" }}>{a.action}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{a.byName} — {new Date(a.at).toLocaleString("en-IN")}</div>
                {a.note && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{a.note}</div>}
              </div>
            ))}
            {membership.auditLog.length === 0 && <p style={{ color: "#475569" }}>No audit entries yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEducatorMembership;
