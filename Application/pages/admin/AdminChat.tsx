import React, { useEffect, useRef, useState } from 'react';
import client from '../../api/client';

interface Trainer {
  _id: string; name: string; avatar?: string; role: string;
  clientCount: number; msgCount: number; lastAt: string | null;
}
interface Conversation {
  _id: string; lastMessage: string; lastAt: string; msgCount: number;
  client: { _id: string; name: string; avatar?: string; email?: string; phone?: string; };
}
interface Message {
  _id: string; text: string; createdAt: string;
  sender: { _id: string; name: string; avatar?: string; role: string; };
}

const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtShort = (d: string) => {
  const dt = new Date(d);
  const today = new Date();
  if (dt.toDateString() === today.toDateString()) return fmtTime(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const Avatar: React.FC<{ name: string; src?: string; size?: number; bg?: string; color?: string }> = ({ name, src, size = 36, bg = '#FF1E5620', color = '#FF1E56' }) => (
  src ? (
    <img src={src} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color, fontSize: size * 0.38, flexShrink: 0 }}>
      {name[0]?.toUpperCase()}
    </div>
  )
);

const AdminChat: React.FC = () => {
  const [trainers, setTrainers]       = useState<Trainer[]>([]);
  const [search, setSearch]           = useState('');
  const [selTrainer, setSelTrainer]   = useState<Trainer | null>(null);
  const [convs, setConvs]             = useState<Conversation[]>([]);
  const [convSearch, setConvSearch]   = useState('');
  const [selConv, setSelConv]         = useState<Conversation | null>(null);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [loadingT, setLoadingT]       = useState(true);
  const [loadingC, setLoadingC]       = useState(false);
  const [loadingM, setLoadingM]       = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    client.get('/admin/chat/trainers')
      .then(r => setTrainers(r.data.trainers ?? []))
      .catch(() => {})
      .finally(() => setLoadingT(false));
  }, []);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0) setTimeout(() => threadRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 80);
  }, [messages]);

  const selectTrainer = (t: Trainer) => {
    if (selTrainer?._id === t._id) return;
    setSelTrainer(t); setSelConv(null); setMessages([]); setConvSearch('');
    setLoadingC(true);
    client.get(`/admin/chat/conversations/${t._id}`)
      .then(r => setConvs(r.data.conversations ?? []))
      .catch(() => {})
      .finally(() => setLoadingC(false));
  };

  const selectConv = (c: Conversation) => {
    if (selConv?._id === c._id) return;
    setSelConv(c); setLoadingM(true);
    client.get(`/admin/chat/thread/${selTrainer!._id}/${c._id}`)
      .then(r => setMessages(r.data.messages ?? []))
      .catch(() => {})
      .finally(() => setLoadingM(false));
  };

  const exportChat = () => {
    if (!selConv || !selTrainer) return;
    const csv = [
      '"Date","Time","Sender","Role","Message"',
      ...messages.map(m => [
        `"${fmtDate(m.createdAt)}"`, `"${fmtTime(m.createdAt)}"`,
        `"${m.sender.name}"`, `"${m.sender.role}"`,
        `"${m.text.replace(/"/g, '""')}"`,
      ].join(',')),
    ].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `chat-${selConv.client.name.replace(/\s+/g, '-')}-${selTrainer.name.replace(/\s+/g, '-')}.csv`;
    a.click();
  };

  // Group messages by date for display
  const grouped = messages.reduce<{ date: string; msgs: Message[] }[]>((acc, m) => {
    const d = fmtDate(m.createdAt);
    const last = acc[acc.length - 1];
    if (last && last.date === d) last.msgs.push(m);
    else acc.push({ date: d, msgs: [m] });
    return acc;
  }, []);

  const filteredTrainers = trainers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  const filteredConvs    = convs.filter(c => c.client.name.toLowerCase().includes(convSearch.toLowerCase()) || (c.client.email ?? '').toLowerCase().includes(convSearch.toLowerCase()));

  const panelBase: React.CSSProperties = { display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111' }}>Chat Viewer</h2>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 13 }}>Read conversations between clients and trainers. Read-only.</p>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 185px)', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>

        {/* ── Panel 1: Trainer list ── */}
        <div style={{ ...panelBase, width: 250, borderRight: '1px solid #e5e7eb', flexShrink: 0 }}>
          <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 8 }}>Trainers</div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingT ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading…</div>
            ) : filteredTrainers.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No trainers with chats yet</div>
            ) : filteredTrainers.map(t => {
              const active = selTrainer?._id === t._id;
              return (
                <div key={t._id} onClick={() => selectTrainer(t)}
                  style={{ padding: '11px 12px', cursor: 'pointer', borderBottom: '1px solid #f8fafc', borderLeft: `3px solid ${active ? '#FF1E56' : 'transparent'}`, background: active ? 'rgba(255,30,86,0.05)' : 'transparent', transition: 'background 0.12s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <Avatar name={t.name} src={t.avatar} size={34} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.clientCount} client{t.clientCount !== 1 ? 's' : ''} · {t.msgCount} msgs</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Panel 2: Conversation list ── */}
        <div style={{ ...panelBase, width: 280, borderRight: '1px solid #e5e7eb', flexShrink: 0, background: '#fafafa' }}>
          {!selTrainer ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: 13 }}>← Select a trainer</div>
          ) : (
            <>
              <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 2 }}>{selTrainer.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>{convs.length} conversation{convs.length !== 1 ? 's' : ''}</div>
                <input value={convSearch} onChange={e => setConvSearch(e.target.value)} placeholder="Search client…"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} />
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {loadingC ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading…</div>
                ) : filteredConvs.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No conversations</div>
                ) : filteredConvs.map(c => {
                  const active = selConv?._id === c._id;
                  return (
                    <div key={c._id} onClick={() => selectConv(c)}
                      style={{ padding: '11px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', borderLeft: `3px solid ${active ? '#FF1E56' : 'transparent'}`, background: active ? 'rgba(255,30,86,0.05)' : 'transparent', transition: 'background 0.12s' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                        <Avatar name={c.client.name} src={c.client.avatar} size={32} bg="#0c246118" color="#0c2461" />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{c.client.name}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>{fmtShort(c.lastAt)}</div>
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>{c.client.email}</div>
                          <div style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMessage}</div>
                          <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 2 }}>{c.msgCount} messages</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Panel 3: Message thread ── */}
        <div style={{ ...panelBase, flex: 1 }}>
          {!selConv ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: 13 }}>← Select a conversation to read messages</div>
          ) : (
            <>
              {/* Thread header */}
              <div style={{ padding: '12px 18px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 10, background: '#fff', flexShrink: 0 }}>
                <Avatar name={selConv.client.name} src={selConv.client.avatar} size={38} bg="#0c246118" color="#0c2461" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>{selConv.client.name}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {selConv.client.email && <span>{selConv.client.email} · </span>}
                    with <strong style={{ color: '#FF1E56' }}>{selTrainer?.name}</strong> · {messages.length} messages
                  </div>
                </div>
                <button onClick={exportChat}
                  style={{ padding: '6px 14px', borderRadius: 12, border: '1.5px solid #16a34a', background: 'rgba(22,163,74,0.08)', color: '#16a34a', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                  ⬇ Export CSV
                </button>
              </div>

              {/* Messages */}
              <div ref={threadRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', background: '#f8fafc' }}>
                {loadingM ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, paddingTop: 40 }}>Loading messages…</div>
                ) : grouped.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, paddingTop: 40 }}>No messages</div>
                ) : grouped.map(group => (
                  <div key={group.date}>
                    {/* Date divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 10px' }}>
                      <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                      <span style={{ fontSize: 11, color: '#94a3b8', background: '#f8fafc', padding: '2px 10px', borderRadius: 20, border: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{group.date}</span>
                      <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                    </div>

                    {group.msgs.map(msg => {
                      const isTrainer = msg.sender._id === selTrainer?._id;
                      return (
                        <div key={msg._id} style={{ display: 'flex', justifyContent: isTrainer ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                          <div style={{ maxWidth: '70%' }}>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3, textAlign: isTrainer ? 'right' : 'left' }}>
                              <strong style={{ color: isTrainer ? '#FF1E56' : '#0c2461' }}>{msg.sender.name}</strong>
                              {' · '}{fmtTime(msg.createdAt)}
                            </div>
                            <div style={{
                              padding: '9px 14px',
                              borderRadius: isTrainer ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                              background: isTrainer ? '#FF1E56' : '#fff',
                              color: isTrainer ? '#fff' : '#1e293b',
                              fontSize: 13.5, lineHeight: 1.55,
                              wordBreak: 'break-word',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                              border: isTrainer ? 'none' : '1px solid #e5e7eb',
                            }}>
                              {msg.text}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Read-only notice */}
              <div style={{ padding: '10px 18px', borderTop: '1px solid #e5e7eb', background: '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>🔒 Read-only view — admin cannot send messages</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
