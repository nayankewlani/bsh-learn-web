import React, { useEffect, useState } from 'react';
import { adminBroadcast, adminGetBroadcasts } from '../../api/admin';

interface Broadcast {
  _id: string;
  title: string;
  body: string;
  link?: string;
  recipientCount: number;
  createdAt: string;
  sentBy?: { name: string };
}

const fmt = (d: string) =>
  new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const AdminBroadcast: React.FC = () => {
  const [title, setTitle]     = useState('');
  const [body, setBody]       = useState('');
  const [link, setLink]       = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState<{ ok: boolean; msg: string } | null>(null);
  const [history, setHistory] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      const res = await adminGetBroadcasts();
      setHistory(res.data.broadcasts ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setResult({ ok: false, msg: 'Title and message are required.' });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await adminBroadcast({ title: title.trim(), body: body.trim(), link: link.trim() || undefined });
      const count: number = res.data.recipientCount ?? 0;
      setResult({ ok: true, msg: `Sent to ${count} user${count !== 1 ? 's' : ''} successfully.` });
      setTitle('');
      setBody('');
      setLink('');
      loadHistory();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to send broadcast.';
      setResult({ ok: false, msg });
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Compose */}
      <div style={card}>
        <div style={cardHeader}>
          <span style={{ fontSize: 20 }}>📣</span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Send Broadcast Notification</span>
        </div>

        <div style={field}>
          <label style={lbl}>Title</label>
          <input
            style={input}
            placeholder="e.g. New Free Class Available!"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={120}
          />
          <div style={charCount}>{title.length}/120</div>
        </div>

        <div style={field}>
          <label style={lbl}>Message</label>
          <textarea
            style={{ ...input, height: 90, resize: 'vertical' }}
            placeholder="Write your message to all users…"
            value={body}
            onChange={e => setBody(e.target.value)}
            maxLength={300}
          />
          <div style={charCount}>{body.length}/300</div>
        </div>

        <div style={field}>
          <label style={lbl}>Deep Link / URL <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span></label>
          <input
            style={input}
            placeholder="e.g. /live-classes or https://…"
            value={link}
            onChange={e => setLink(e.target.value)}
          />
        </div>

        {/* Preview */}
        {(title || body) && (
          <div style={previewWrap}>
            <div style={previewLabel}>Preview</div>
            <div style={previewBox}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#7c3aed22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🧠</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{title || 'Notification Title'}</div>
                  <div style={{ fontSize: 11, opacity: 0.5 }}>BSH Healers · now</div>
                </div>
              </div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>{body || 'Message text will appear here…'}</div>
              {link && <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 4 }}>{link}</div>}
            </div>
          </div>
        )}

        {result && (
          <div style={{ ...resultBox, background: result.ok ? '#16a34a22' : '#dc262622', color: result.ok ? '#16a34a' : '#dc2626', borderColor: result.ok ? '#16a34a44' : '#dc262644' }}>
            {result.ok ? '✓ ' : '✗ '}{result.msg}
          </div>
        )}

        <button
          style={{ ...sendBtn, opacity: sending ? 0.6 : 1, cursor: sending ? 'not-allowed' : 'pointer' }}
          onClick={handleSend}
          disabled={sending}
        >
          {sending ? 'Sending…' : '📣 Send to All Users'}
        </button>
      </div>

      {/* History */}
      <div style={{ ...card, marginTop: 20 }}>
        <div style={cardHeader}>
          <span style={{ fontSize: 18 }}>📋</span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Broadcast History</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', opacity: 0.5 }}>Loading…</div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', opacity: 0.45, fontSize: 14 }}>No broadcasts sent yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={table}>
              <thead>
                <tr>
                  {['Title', 'Message', 'Sent By', 'Recipients', 'Sent At'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map(b => (
                  <tr key={b._id} style={{ borderBottom: '1px solid #ffffff0a' }}>
                    <td style={td}><strong>{b.title}</strong>{b.link && <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 2 }}>{b.link}</div>}</td>
                    <td style={{ ...td, maxWidth: 220 }}><div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{b.body}</div></td>
                    <td style={td}>{b.sentBy?.name ?? '—'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <span style={{ background: '#7c3aed22', color: '#7c3aed', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: 13 }}>{b.recipientCount}</span>
                    </td>
                    <td style={{ ...td, whiteSpace: 'nowrap', fontSize: 12, opacity: 0.65 }}>{fmt(b.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#ffffff08',
  border: '1px solid #ffffff12',
  borderRadius: 12,
  padding: 24,
};

const cardHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 20,
  paddingBottom: 16,
  borderBottom: '1px solid #ffffff10',
};

const field: React.CSSProperties = { marginBottom: 16, position: 'relative' };

const lbl: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  opacity: 0.65,
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const input: React.CSSProperties = {
  width: '100%',
  background: '#ffffff0c',
  border: '1px solid #ffffff18',
  borderRadius: 8,
  padding: '10px 12px',
  color: 'inherit',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const charCount: React.CSSProperties = {
  position: 'absolute',
  right: 10,
  bottom: -18,
  fontSize: 11,
  opacity: 0.35,
};

const previewWrap: React.CSSProperties = {
  marginBottom: 20,
  marginTop: 8,
};

const previewLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  opacity: 0.45,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  marginBottom: 8,
};

const previewBox: React.CSSProperties = {
  background: '#1a1a2e',
  border: '1px solid #7c3aed40',
  borderRadius: 12,
  padding: '12px 14px',
};

const resultBox: React.CSSProperties = {
  border: '1px solid',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 14,
  marginBottom: 16,
};

const sendBtn: React.CSSProperties = {
  background: '#7c3aed',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '11px 28px',
  fontSize: 14,
  fontWeight: 700,
  width: '100%',
};

const table: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
};

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  opacity: 0.5,
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid #ffffff14',
  whiteSpace: 'nowrap',
};

const td: React.CSSProperties = {
  padding: '12px 12px',
  verticalAlign: 'top',
};

export default AdminBroadcast;
