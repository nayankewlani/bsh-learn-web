import React, { useEffect, useRef, useState, useCallback } from "react";
import client from "../api/client";
import { useAuthStore } from "../stores/authStore";
import { useNavigate } from "react-router-dom";

interface Msg {
  _id: string;
  sender: { _id: string; name: string; role: string };
  text: string;
  createdAt: string;
}

interface Props {
  trainerId: string;
  trainerName: string;
  trainerOnline?: boolean;
  onClose: () => void;
}

const ChatPanel: React.FC<Props> = ({ trainerId, trainerName, trainerOnline, onClose }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await client.get(`/chat/messages/${trainerId}`);
      setMessages(data.messages);
    } catch {} finally { setLoading(false); }
  }, [trainerId]);

  useEffect(() => {
    if (!user) return;
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const { data } = await client.post(`/chat/messages/${trainerId}`, { text: text.trim() });
      setMessages(prev => [...prev, data.message]);
      setText("");
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch {} finally { setSending(false); }
  };

  if (!user) return (
    <div style={{ position: "fixed", bottom: 24, right: 24, width: 340, background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", zIndex: 9999, padding: 32, textAlign: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
      <div style={{ fontWeight: 700, marginBottom: 8, color: "#111" }}>Login to Chat</div>
      <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>Sign in to chat with {trainerName}</div>
      <button onClick={() => navigate("/login")} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Login</button>
      <button onClick={onClose} style={{ display: "block", margin: "10px auto 0", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 13 }}>Close</button>
    </div>
  );

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, width: 360, height: 520,
      background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      display: "flex", flexDirection: "column", zIndex: 9999, overflow: "hidden",
      animation: "chatSlideUp 0.25s ease",
    }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
          {trainerName[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{trainerName}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: trainerOnline ? "#22c55e" : "#9ca3af", display: "inline-block" }} />
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>
              {trainerOnline ? "Online" : "Offline · Will reply when back"}
            </span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {loading && <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, paddingTop: 40 }}>Loading...</div>}
        {!loading && messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, marginTop: 48, lineHeight: 1.7 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
            <div style={{ fontWeight: 600, color: "#374151" }}>Start a conversation</div>
            <div style={{ fontSize: 12 }}>
              {trainerOnline ? "They're online and ready to help!" : "They're offline but will reply soon."}
            </div>
          </div>
        )}
        {messages.map(m => {
          const isMe = m.sender._id === user?._id;
          return (
            <div key={m._id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "78%", padding: "9px 13px",
                borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: isMe ? "#7c3aed" : "#f3f4f6",
                color: isMe ? "#fff" : "#111", fontSize: 13, lineHeight: 1.55,
              }}>
                {m.text}
                <div style={{ fontSize: 10, opacity: 0.65, marginTop: 3, textAlign: "right" }}>
                  {new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 12px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 8, flexShrink: 0 }}>
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type a message…"
          style={{ flex: 1, padding: "10px 14px", border: "1.5px solid #e5e7eb", borderRadius: 20, fontSize: 13, outline: "none", background: "#f9fafb", color: "#111" }}
        />
        <button onClick={send} disabled={sending || !text.trim()}
          style={{ width: 40, height: 40, borderRadius: "50%", background: text.trim() ? "#7c3aed" : "#e5e7eb", border: "none", cursor: text.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={text.trim() ? "#fff" : "#9ca3af"} strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      <style>{`@keyframes chatSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
};

export default ChatPanel;
