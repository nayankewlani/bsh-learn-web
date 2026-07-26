import React, { useEffect, useRef, useState, useCallback } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import type {
  IAgoraRTCClient,
  ILocalAudioTrack,
  ILocalVideoTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
} from "agora-rtc-sdk-ng";
import apiClient from "../../api/client";
import { useAuthStore } from "../../stores/authStore";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Props {
  appId: string;
  channel: string;
  token: string;
  uid: number;
  role: "host" | "audience";
  classId: string;
  // True for a 1:1 session class (see /live-classes/:id/join) — the backend hands
  // the audience member a publisher token immediately since both parties on a 1:1
  // call are equal, not a host-broadcasts-to-audience webinar. Drives this client
  // straight into publishing camera/mic instead of waiting on the raise-hand flow.
  oneToOne?: boolean;
  onLeave?: () => void;
}
interface RemoteUser { uid: string | number; videoTrack?: IRemoteVideoTrack; audioTrack?: IRemoteAudioTrack; }
interface ChatMsg    { name: string; text: string; createdAt: string; }
interface RaisedHand { user: string; name: string; }
interface CoHost     { user: string; name: string; token: string; uid?: number; }
interface WbStroke   { id: string; tool: string; color: string; size: number; points: number[][]; userId: string; ts: number; }
interface BreakoutRoom { id: string; name: string; participantCount: number; }
interface MyBreakout   { id: string; name: string; channel: string; }

type Panel = "participants" | "chat" | "whiteboard" | "breakout";
type WbTool = "pen" | "eraser";

/* ─── Video players (safe: play inside own useEffect) ───────────────────── */
const LocalVideo: React.FC<{ track: ILocalVideoTrack; label: string }> = ({ track, label }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    track.play(ref.current);
    return () => { try { track.stop(); } catch {} };
  }, [track]);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 240, background: "#111" }}>
      <div ref={ref} style={{ width: "100%", height: "100%" }} />
      <div style={pill}>{label}</div>
    </div>
  );
};

const RemoteVideo: React.FC<{ track: IRemoteVideoTrack; label: string }> = ({ track, label }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) track.play(ref.current); }, [track]);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 200, background: "#111" }}>
      <div ref={ref} style={{ width: "100%", height: "100%" }} />
      <div style={pill}>{label}</div>
    </div>
  );
};
const pill: React.CSSProperties = { position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.72)", padding: "2px 9px", borderRadius: 5, fontSize: 12, color: "#fff" };

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const nqColor = (n: number) => n === 0 ? "#6b7280" : n <= 2 ? "#22c55e" : n <= 4 ? "#f59e0b" : "#ef4444";
const nqLabel = (n: number) => n === 0 ? "—" : n <= 2 ? "Good" : n <= 4 ? "Fair" : "Poor";

const Av: React.FC<{ name: string; size?: number }> = ({ name, size = 28 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: "#3730a3", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.42, color: "#fff", fontWeight: 700 }}>
    {name?.[0]?.toUpperCase() || "?"}
  </div>
);

const TBtn: React.FC<{ icon: string; label: string; active?: boolean; danger?: boolean; badge?: number; disabled?: boolean; onClick: () => void }> = ({ icon, label, active, danger, badge, disabled, onClick }) => (
  <button onClick={onClick} disabled={disabled} title={label}
    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: danger ? "rgba(220,38,38,0.18)" : active ? "rgba(124,58,237,0.28)" : "transparent", border: `1px solid ${danger ? "rgba(220,38,38,0.5)" : active ? "#7c3aed" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, padding: "8px 10px", cursor: disabled ? "not-allowed" : "pointer", color: danger ? "#f87171" : active ? "#a78bfa" : "#d1d5db", minWidth: 50, position: "relative", opacity: disabled ? 0.45 : 1, transition: "all .15s" }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = "0.78"; }}
    onMouseLeave={e => { e.currentTarget.style.opacity = disabled ? "0.45" : "1"; }}>
    {(badge ?? 0) > 0 && <div style={{ position: "absolute", top: 3, right: 3, background: "#ef4444", borderRadius: "50%", width: 15, height: 15, fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>{(badge ?? 0) > 9 ? "9+" : badge}</div>}
    <span style={{ fontSize: 17 }}>{icon}</span>
    <span style={{ fontSize: 9, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>
  </button>
);

/* ─── Whiteboard Canvas ──────────────────────────────────────────────────── */
const WhiteboardCanvas: React.FC<{
  strokes: WbStroke[];
  canDraw: boolean;
  tool: WbTool;
  color: string;
  size: number;
  onStrokeDone: (stroke: WbStroke) => void;
}> = ({ strokes, canDraw, tool, color, size, onStrokeDone }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const currentPoints = useRef<number[][]>([]);

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#1a1730";
    ctx.fillRect(0, 0, c.width, c.height);
    strokes.forEach(s => drawStroke(ctx, s, c.width, c.height));
  }, [strokes]);

  useEffect(() => { redraw(); }, [redraw]);

  const drawStroke = (ctx: CanvasRenderingContext2D, s: WbStroke, w: number, h: number) => {
    if (s.points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = s.tool === "eraser" ? "#1a1730" : s.color;
    ctx.lineWidth = s.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(s.points[0][0] * w, s.points[0][1] * h);
    for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i][0] * w, s.points[i][1] * h);
    ctx.stroke();
  };

  const getPos = (e: React.MouseEvent): [number, number] => {
    const r = canvasRef.current!.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  };

  const onDown = (e: React.MouseEvent) => {
    if (!canDraw) return;
    drawing.current = true;
    currentPoints.current = [getPos(e)];
  };

  const onMove = (e: React.MouseEvent) => {
    if (!drawing.current || !canDraw) return;
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const [x, y] = getPos(e);
    currentPoints.current.push([x, y]);
    const pts = currentPoints.current;
    if (pts.length >= 2) {
      ctx.beginPath();
      ctx.strokeStyle = tool === "eraser" ? "#1a1730" : color;
      ctx.lineWidth = size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(pts[pts.length - 2][0] * c.width, pts[pts.length - 2][1] * c.height);
      ctx.lineTo(pts[pts.length - 1][0] * c.width, pts[pts.length - 1][1] * c.height);
      ctx.stroke();
    }
  };

  const onUp = () => {
    if (!drawing.current || !canDraw) return;
    drawing.current = false;
    if (currentPoints.current.length >= 2) {
      onStrokeDone({ id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, tool, color, size, points: currentPoints.current, userId: "", ts: Date.now() });
    }
    currentPoints.current = [];
  };

  return (
    <canvas ref={canvasRef} width={800} height={450}
      style={{ width: "100%", height: "auto", cursor: canDraw ? (tool === "eraser" ? "cell" : "crosshair") : "default", display: "block", background: "#1a1730" }}
      onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} />
  );
};

/* ─── Main component ─────────────────────────────────────────────────────── */
const LiveClassRoom: React.FC<Props> = ({ appId, channel, token, uid, role, classId, oneToOne = false, onLeave }) => {
  const { user } = useAuthStore();

  // Agora refs
  const clientRef   = useRef<IAgoraRTCClient | null>(null);
  const tracksRef   = useRef<[ILocalAudioTrack, ILocalVideoTrack] | null>(null);
  const screenRef   = useRef<ILocalVideoTrack | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const panelRef    = useRef<Panel | null>(null);
  const msgCountRef = useRef(0);
  const chatEndRef  = useRef<HTMLDivElement>(null);

  // Connection state
  const [remoteUsers,    setRemoteUsers]    = useState<RemoteUser[]>([]);
  const [joined,         setJoined]         = useState(false);
  const [connecting,     setConnecting]     = useState(true);
  const [joinError,      setJoinError]      = useState("");
  const [localTracks,    setLocalTracks]    = useState<[ILocalAudioTrack, ILocalVideoTrack] | null>(null);
  const [isMuted,        setIsMuted]        = useState(false);
  const [isVideoOff,     setIsVideoOff]     = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [networkQuality, setNetworkQuality] = useState(0);
  const [cameras,        setCameras]        = useState<MediaDeviceInfo[]>([]);
  const [mics,           setMics]           = useState<MediaDeviceInfo[]>([]);
  const [showSettings,   setShowSettings]   = useState(false);

  // UI panels
  const [activePanel,    setActivePanel]    = useState<Panel | null>(null);
  const [unreadChat,     setUnreadChat]     = useState(0);

  // Chat
  const [messages,       setMessages]       = useState<ChatMsg[]>([]);
  const [chatInput,      setChatInput]      = useState("");

  // Hands & co-hosts
  const [raisedHands,    setRaisedHands]    = useState<RaisedHand[]>([]);
  const [isHandRaised,   setIsHandRaised]   = useState(false);
  const [coHosts,        setCoHosts]        = useState<CoHost[]>([]);
  const [isCoHost,       setIsCoHost]       = useState(false);
  const [mutedByHost,    setMutedByHost]    = useState(false);
  const [hostUid,        setHostUid]        = useState<number | null>(null);
  const [activeParticipants, setActiveParticipants] = useState<{ uid: number; name: string; user: string }[]>([]);
  const [mutedUserIds,   setMutedUserIds]   = useState<string[]>([]);
  const [recordingActive, setRecordingActive] = useState(false);
  const [recordingBusy,  setRecordingBusy]  = useState(false);
  const coHostRef        = useRef(false); // track current co-host mode to detect changes

  // Whiteboard
  const [wbStrokes,      setWbStrokes]      = useState<WbStroke[]>([]);
  const [wbTool,         setWbTool]         = useState<WbTool>("pen");
  const [wbColor,        setWbColor]        = useState("#ffffff");
  const [wbSize,         setWbSize]         = useState(3);
  const pendingStrokes   = useRef<WbStroke[]>([]);

  // Breakout rooms
  const [breakoutRooms,  setBreakoutRooms]  = useState<BreakoutRoom[]>([]);
  const [breakoutActive, setBreakoutActive] = useState(false);
  const [myBreakout,     setMyBreakout]     = useState<MyBreakout | null>(null);
  const [inBreakout,     setInBreakout]     = useState(false);
  const [breakoutCount,  setBreakoutCount]  = useState(2);
  const [breakoutNotice, setBreakoutNotice] = useState<string | null>(null);
  const mainChannelRef   = useRef({ channel, token, uid }); // remember original channel for return

  /* ── panel ref sync ──────────────────────────────────────────────────── */
  useEffect(() => { panelRef.current = activePanel; }, [activePanel]);

  /* ── device enumeration (host only) ─────────────────────────────────── */
  useEffect(() => {
    if (role !== "host") return;
    AgoraRTC.getCameras().then(setCameras).catch(() => {});
    AgoraRTC.getMicrophones().then(setMics).catch(() => {});
  }, [role]);

  /* ── disconnect helper ───────────────────────────────────────────────── */
  const disconnectAgora = useCallback((skipOnLeave = false) => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    const client = clientRef.current;
    const tracks = tracksRef.current;
    const screen = screenRef.current;
    clientRef.current = null;
    tracksRef.current = null;
    screenRef.current = null;
    (async () => {
      try {
        if (tracks) tracks.forEach(t => { try { t.stop(); t.close(); } catch {} });
        if (screen) { try { screen.stop(); screen.close(); } catch {} }
        await client?.leave();
      } catch {}
      if (!skipOnLeave) onLeave?.();
    })();
  }, [onLeave]);

  /* ── flush whiteboard strokes to server ──────────────────────────────── */
  const flushStrokes = useCallback(async () => {
    if (pendingStrokes.current.length === 0) return;
    const toSend = [...pendingStrokes.current];
    pendingStrokes.current = [];
    try { await apiClient.post(`/live-classes/${classId}/whiteboard`, { strokes: toSend }); } catch {}
  }, [classId]);

  /* ── polling ─────────────────────────────────────────────────────────── */
  const pollState = useCallback(async () => {
    await flushStrokes();
    try {
      const { data } = await apiClient.get(`/live-classes/${classId}/state`);
      setRaisedHands(data.raisedHands || []);
      setCoHosts(data.coHosts || []);
      if (typeof data.hostUid === "number") setHostUid(data.hostUid);
      setActiveParticipants(data.activeParticipants || []);
      setMutedUserIds(data.mutedUsers || []);
      setRecordingActive(!!data.recordingActive);
      setBreakoutRooms(data.breakoutRooms || []);
      setBreakoutActive(data.breakoutActive || false);
      setMyBreakout(data.myBreakout || null);
      setWbStrokes(data.whiteboardStrokes || []);

      const userId = user?._id;
      if (userId) {
        // Mute-by-host signal
        const muted = (data.mutedUsers || []).includes(String(userId));
        setMutedByHost(muted);

        // Co-host promotion detection
        const myCoHost = (data.coHosts || []).find((c: CoHost) => c.user === String(userId) && c.token);
        const promoted = !!myCoHost;
        if (promoted !== coHostRef.current) {
          coHostRef.current = promoted;
          setIsCoHost(promoted);
          if (promoted && myCoHost?.token) {
            switchToCoHost(myCoHost.token);
          } else if (!promoted && !inBreakout) {
            switchToAudience();
          }
        }

        // Breakout room detection
        const myRoom: MyBreakout | null = data.myBreakout;
        if (myRoom && data.breakoutActive && !inBreakout) {
          setBreakoutNotice(`You've been moved to ${myRoom.name}`);
        }
        if (!data.breakoutActive && inBreakout) {
          returnFromBreakout();
        }
      }

      // Chat unread
      const incoming: ChatMsg[] = data.messages || [];
      if (incoming.length > msgCountRef.current && panelRef.current !== "chat") {
        setUnreadChat(u => u + (incoming.length - msgCountRef.current));
      }
      msgCountRef.current = incoming.length;
      setMessages(incoming);
    } catch {}
  }, [classId, user?._id, flushStrokes, inBreakout]);

  /* ── switch to co-host (audience → publisher) ────────────────────────── */
  const switchToCoHost = async (coHostToken: string) => {
    const client = clientRef.current;
    if (!client) return;
    try {
      await client.setClientRole("host");
      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
      tracksRef.current = tracks;
      setLocalTracks(tracks);
      await client.publish(tracks);
      setIsMuted(false);
      setIsVideoOff(false);
    } catch (e) {
      console.error("[CO-HOST SWITCH]", e);
    }
  };

  /* ── switch back to audience ─────────────────────────────────────────── */
  const switchToAudience = async () => {
    const client = clientRef.current;
    const tracks = tracksRef.current;
    if (!client) return;
    try {
      if (tracks) {
        await client.unpublish(tracks);
        tracks.forEach(t => { try { t.stop(); t.close(); } catch {} });
        tracksRef.current = null;
        setLocalTracks(null);
      }
      await client.setClientRole("audience");
    } catch (e) {
      console.error("[AUDIENCE SWITCH]", e);
    }
  };

  /* ── join Agora channel ──────────────────────────────────────────────── */
  const joinChannel = async (ch: string, tok: string, agoraRole: "host" | "audience", publishTracks = false, joinUid: number = uid) => {
    setConnecting(true);
    setJoinError("");
    try {
      const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
      clientRef.current = client;
      await client.setClientRole(agoraRole === "host" ? "host" : "audience");

      client.on("network-quality", s => setNetworkQuality(Math.max(s.uplinkNetworkQuality, s.downlinkNetworkQuality)));

      client.on("user-published", async (u, mediaType) => {
        await client.subscribe(u, mediaType);
        if (mediaType === "video") setRemoteUsers(prev => { const ex = prev.find(r => r.uid === u.uid); return ex ? prev.map(r => r.uid === u.uid ? { ...r, videoTrack: u.videoTrack } : r) : [...prev, { uid: u.uid, videoTrack: u.videoTrack }]; });
        if (mediaType === "audio") {
          setRemoteUsers(prev => { const ex = prev.find(r => r.uid === u.uid); return ex ? prev.map(r => r.uid === u.uid ? { ...r, audioTrack: u.audioTrack } : r) : [...prev, { uid: u.uid, audioTrack: u.audioTrack }]; });
          u.audioTrack?.play();
        }
      });
      client.on("user-unpublished", (u, mt) => { if (mt === "video") setRemoteUsers(prev => prev.map(r => r.uid === u.uid ? { ...r, videoTrack: undefined } : r)); });
      client.on("user-left", u => { setRemoteUsers(prev => prev.filter(r => r.uid !== u.uid)); setParticipantCount(n => Math.max(1, n - 1)); });
      client.on("user-joined", () => setParticipantCount(n => n + 1));

      await client.join(appId, ch, tok, joinUid);
      setParticipantCount(client.remoteUsers.length + 1);

      if (publishTracks) {
        const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        tracksRef.current = tracks;
        setLocalTracks(tracks);
        await client.publish(tracks);
      }
      setJoined(true);
    } catch (err: unknown) {
      const msg = String(err);
      if (!msg.includes("OPERATION_ABORTED")) setJoinError(msg);
    } finally {
      setConnecting(false);
    }
  };

  /* ── join breakout room ──────────────────────────────────────────────── */
  const joinBreakout = async (room: MyBreakout) => {
    try {
      setBreakoutNotice(null);
      const { data } = await apiClient.post(`/live-classes/${classId}/breakout/${room.id}/join`);
      // leave main, join breakout
      const client = clientRef.current;
      const tracks = tracksRef.current;
      if (client) {
        if (tracks) { await client.unpublish(tracks); }
        await client.leave();
        clientRef.current = null;
      }
      setRemoteUsers([]);
      setInBreakout(true);
      await joinChannel(data.channel, data.token, "host", true, data.uid);
    } catch (e) {
      console.error("[BREAKOUT JOIN]", e);
    }
  };

  /* ── return from breakout ────────────────────────────────────────────── */
  const returnFromBreakout = async () => {
    setInBreakout(false);
    setBreakoutNotice("Returning to main room…");
    const client = clientRef.current;
    const tracks = tracksRef.current;
    if (client) {
      if (tracks) { try { await client.unpublish(tracks); } catch {} }
      await client.leave();
      clientRef.current = null;
    }
    setRemoteUsers([]);
    setLocalTracks(null);
    tracksRef.current = null;
    const { channel: mc, token: mt, uid: mu } = mainChannelRef.current;
    await joinChannel(mc, mt, role, role === "host", mu);
    setBreakoutNotice(null);
  };

  /* ── screen share ────────────────────────────────────────────────────── */
  const toggleScreenShare = async () => {
    const client = clientRef.current;
    const tracks = tracksRef.current;
    if (!client || !tracks) return;
    if (isScreenSharing) {
      const screen = screenRef.current;
      if (screen) { try { await client.unpublish(screen); screen.stop(); screen.close(); } catch {} screenRef.current = null; }
      try { await client.publish(tracks[1]); } catch {}
      setIsScreenSharing(false);
    } else {
      try {
        const result = await AgoraRTC.createScreenVideoTrack({ encoderConfig: "1080p_1" }, "disable");
        const screenVideo = Array.isArray(result) ? result[0] : result;
        screenRef.current = screenVideo;
        await client.unpublish(tracks[1]);
        await client.publish(screenVideo);
        (screenVideo as any).on?.("track-ended", () => toggleScreenShare());
        setIsScreenSharing(true);
      } catch {}
    }
  };

  /* ── whiteboard stroke complete ──────────────────────────────────────── */
  const onStrokeDone = useCallback((stroke: WbStroke) => {
    const s = { ...stroke, userId: String(user?._id || "") };
    setWbStrokes(prev => [...prev, s]);
    pendingStrokes.current.push(s);
  }, [user?._id]);

  /* ── chat send ───────────────────────────────────────────────────────── */
  const sendMessage = async () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput("");
    try { await apiClient.post(`/live-classes/${classId}/chat`, { text }); await pollState(); } catch {}
  };

  /* ── raise hand ──────────────────────────────────────────────────────── */
  const toggleHand = async () => {
    try { const { data } = await apiClient.post(`/live-classes/${classId}/hand`); setIsHandRaised(data.raised); } catch {}
  };

  /* ── host actions ────────────────────────────────────────────────────── */
  const lowerHand = async (userId: string) => {
    try { await apiClient.delete(`/live-classes/${classId}/hand/${userId}`); setRaisedHands(p => p.filter(h => h.user !== userId)); } catch {}
  };
  const promoteUser = async (userId: string) => {
    try { await apiClient.post(`/live-classes/${classId}/promote/${userId}`); await pollState(); } catch {}
  };
  const demoteUser = async (userId: string) => {
    try { await apiClient.delete(`/live-classes/${classId}/promote/${userId}`); await pollState(); } catch {}
  };
  const muteUser = async (userId: string) => {
    try { await apiClient.post(`/live-classes/${classId}/mute/${userId}`); await pollState(); } catch {}
  };
  const clearWhiteboard = async () => {
    try { await apiClient.delete(`/live-classes/${classId}/whiteboard`); setWbStrokes([]); } catch {}
  };
  const createBreakout = async () => {
    try { await apiClient.post(`/live-classes/${classId}/breakout`, { count: breakoutCount }); await pollState(); } catch {}
  };
  const endBreakout = async () => {
    try { await apiClient.delete(`/live-classes/${classId}/breakout`); await pollState(); } catch {}
  };

  /* ── auto-mute when host mutes this participant ──────────────────────── */
  // Only forces mute ON — must never auto re-enable, or it overwrites a self-chosen
  // mute on the next 3s poll (that was the bug: isMuted was shared between "I muted
  // myself" and "host muted me," so this effect kept undoing manual mutes). Once the
  // host unmutes, the user regains the *ability* to unmute via toggleMute, same as Zoom.
  useEffect(() => {
    if (!localTracks) return;
    if (mutedByHost && !isMuted) { localTracks[0].setEnabled(false); setIsMuted(true); }
  }, [mutedByHost]);

  const toggleMute = () => {
    if (mutedByHost) return; // host has muted you — wait for them to unmute first
    if (!localTracks) return;
    localTracks[0].setEnabled(isMuted); setIsMuted(!isMuted);
  };
  const toggleVideo = () => { if (!localTracks) return; localTracks[1].setEnabled(isVideoOff); setIsVideoOff(!isVideoOff); };

  const togglePanel = (p: Panel) => { if (p === "chat") setUnreadChat(0); setActivePanel(prev => prev === p ? null : p); };

  const handleLeave = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    disconnectAgora(true);
    setJoined(false); setLocalTracks(null); setRemoteUsers([]);
    onLeave?.();
  };

  /* ── lifecycle ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const agoraRole = role === "host" || oneToOne ? "host" : "audience";
    joinChannel(channel, token, agoraRole, role === "host" || oneToOne).then(() => {
      pollState();
      pollRef.current = setInterval(pollState, 3000);
    });
    return () => { disconnectAgora(true); };
  }, []);

  /* ── auto-scroll chat ────────────────────────────────────────────────── */
  useEffect(() => { if (activePanel === "chat") chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, activePanel]);

  /* ── full screen ──────────────────────────────────────────────────────── */
  useEffect(() => {
    const onChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullScreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current?.requestFullscreen();
  };

  /* ── cloud recording (host only) ─────────────────────────────────────── */
  const toggleRecording = async () => {
    setRecordingBusy(true);
    try {
      if (recordingActive) {
        await apiClient.post(`/live-classes/${classId}/recording/stop`);
        setRecordingActive(false);
      } else {
        await apiClient.post(`/live-classes/${classId}/recording/start`);
        setRecordingActive(true);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update recording");
    } finally {
      setRecordingBusy(false);
    }
  };

  /* ─── render ─────────────────────────────────────────────────────────── */
  const canPublish = role === "host" || isCoHost || oneToOne;
  const handBadge = role === "host" ? (raisedHands.length + coHosts.length) : 0;
  // Same deterministic-uid trick as mobile: every client derives uids from Mongo ids
  // the same way server-side, so any remote uid can be resolved back to a real name.
  const nameForUid = (uid: string | number): string => {
    const n = Number(uid);
    if (hostUid !== null && n === hostUid) return "Host";
    const ch = coHosts.find(c => c.uid === n);
    if (ch) return ch.name;
    const p = activeParticipants.find(ap => ap.uid === n);
    if (p) return p.name;
    return role === "audience" && !isCoHost ? "Host" : "Participant";
  };
  const mutedRemoteUids = activeParticipants.filter(p => mutedUserIds.includes(p.user)).map(p => p.uid);

  return (
    <div ref={containerRef} style={{ background: "#0a0910", borderRadius: isFullScreen ? 0 : 14, overflow: "hidden", display: "flex", flexDirection: "column", height: isFullScreen ? "100vh" : undefined }}>

      {/* ── Header ── */}
      <div style={{ background: "#13122a", padding: "9px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e1b4b", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {joined && <>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: "2px 9px" }}>
              <span style={{ width: 6, height: 6, background: "#ef4444", borderRadius: "50%", animation: "navLivePulse 1.5s ease-in-out infinite", display: "inline-block" }} />
              <span style={{ color: "#ef4444", fontSize: 10, fontWeight: 700 }}>{inBreakout ? "BREAKOUT" : "LIVE"}</span>
            </span>
            <span style={{ color: "#9ca3af", fontSize: 12 }}>👥 {participantCount}</span>
            {recordingActive && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.4)", borderRadius: 20, padding: "2px 9px" }}>
                <span style={{ width: 6, height: 6, background: "#dc2626", borderRadius: "50%", display: "inline-block" }} />
                <span style={{ color: "#dc2626", fontSize: 10, fontWeight: 700 }}>REC</span>
              </span>
            )}
            {isCoHost && <span style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 10, padding: "2px 8px", color: "#a78bfa", fontSize: 10, fontWeight: 700 }}>CO-HOST</span>}
            {inBreakout && myBreakout && <span style={{ color: "#f59e0b", fontSize: 11 }}>{myBreakout.name}</span>}
          </>}
          {connecting && <span style={{ color: "#9ca3af", fontSize: 12 }}>{breakoutNotice || "Connecting…"}</span>}
          {joinError && <span style={{ color: "#f87171", fontSize: 12 }}>Connection failed</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {joined && <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: nqColor(networkQuality), display: "inline-block" }} />
            <span style={{ color: "#9ca3af", fontSize: 10 }}>{nqLabel(networkQuality)}</span>
          </span>}
          {joined && (
            <button onClick={toggleFullScreen} title={isFullScreen ? "Exit full screen" : "Full screen"}
              style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#9ca3af", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {isFullScreen ? "⤡" : "⛶"}
            </button>
          )}
          {(joined || joinError) && (
            <button onClick={inBreakout ? returnFromBreakout : handleLeave}
              style={{ background: inBreakout ? "#7c3aed" : "#dc2626", border: "none", color: "#fff", borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {inBreakout ? "↩ Main Room" : role === "host" ? "End" : "Leave"}
            </button>
          )}
        </div>
      </div>

      {/* ── Breakout notice ── */}
      {breakoutNotice && !inBreakout && myBreakout && (
        <div style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ color: "#f59e0b", fontSize: 13, fontWeight: 600 }}>🏠 {breakoutNotice}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => joinBreakout(myBreakout)} style={{ background: "#f59e0b", border: "none", color: "#000", borderRadius: 7, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Join Room</button>
            <button onClick={() => setBreakoutNotice(null)} style={{ background: "none", border: "1px solid rgba(245,158,11,0.4)", color: "#f59e0b", borderRadius: 7, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>Dismiss</button>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, minHeight: 340 }}>

        {/* Video area */}
        <div style={{ flex: 1, background: "#000", position: "relative", minHeight: 340 }}>
          {connecting && <div style={{ height: "100%", minHeight: 340, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "#6b7280" }}><div style={{ fontSize: 40 }}>📡</div><p>{breakoutNotice || "Joining live class…"}</p></div>}
          {!connecting && joinError && (
            <div style={{ height: "100%", minHeight: 340, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 40 }}>⚠️</div>
              <p style={{ color: "#f87171", fontWeight: 700, margin: 0 }}>Could not connect</p>
              <p style={{ color: "#9ca3af", fontSize: 13, maxWidth: 320, margin: "4px 0 14px" }}>{joinError}</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => joinChannel(channel, token, role === "host" || oneToOne ? "host" : "audience", role === "host" || oneToOne)} style={{ background: "#7c3aed", border: "none", color: "#fff", borderRadius: 8, padding: "7px 16px", cursor: "pointer" }}>Retry</button>
                <button onClick={handleLeave} style={{ background: "none", border: "1px solid #3730a3", color: "#a78bfa", borderRadius: 8, padding: "7px 16px", cursor: "pointer" }}>Close</button>
              </div>
            </div>
          )}
          {joined && (
            <div style={{ position: "relative", height: "100%", minHeight: 340 }}>
              {/* Main area: the other participant(s) — this is the primary view, like Zoom's speaker view */}
              {remoteUsers.length > 0 ? (
                <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: remoteUsers.length > 1 ? "repeat(auto-fit,minmax(280px,1fr))" : "1fr", gap: 2 }}>
                  {remoteUsers.map(u => (
                    <div key={u.uid}>
                      {u.videoTrack
                        ? <RemoteVideo track={u.videoTrack} label={`${inBreakout ? "Participant" : nameForUid(u.uid)}${mutedRemoteUids.includes(Number(u.uid)) ? " 🔇" : ""}`} />
                        : <div style={{ minHeight: 200, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#14122a", flexDirection: "column", gap: 8 }}>
                            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#3730a3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👤</div>
                            <span style={{ color: "#d1d5db", fontSize: 12, fontWeight: 600 }}>{inBreakout ? "Participant" : nameForUid(u.uid)}</span>
                            <span style={{ color: "#9ca3af", fontSize: 12 }}>{u.audioTrack ? "🎤 Audio on" : "Camera off"}</span>
                          </div>
                      }
                    </div>
                  ))}
                </div>
              ) : canPublish && localTracks ? (
                // Nobody else here yet — nothing to show as "main", so your own video fills the space
                <div style={{ position: "absolute", inset: 0 }}>
                  {isScreenSharing && screenRef.current
                    ? <LocalVideo track={screenRef.current} label="🖥️ You · Screen" />
                    : <LocalVideo track={localTracks[1]} label={`You${role === "host" ? " (Host)" : oneToOne ? "" : " (Co-host)"}${isMuted ? " 🔇" : ""}${isVideoOff ? " 📷✕" : ""}`} />}
                </div>
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "#6b7280" }}>
                  <div style={{ fontSize: 40 }}>⏳</div>
                  <p>Waiting for host…</p>
                  {isHandRaised && <p style={{ color: "#f59e0b", fontSize: 13 }}>✋ Hand raised — host can see your request</p>}
                </div>
              )}

              {/* Your own video — small corner thumbnail once someone else is on the main view */}
              {remoteUsers.length > 0 && canPublish && localTracks && (
                <div style={{ position: "absolute", bottom: 14, right: 14, width: "22%", maxWidth: 180, minWidth: 110, aspectRatio: "4/3", borderRadius: 10, overflow: "hidden", border: "2px solid #3730a3", boxShadow: "0 4px 16px rgba(0,0,0,0.5)", zIndex: 5 }}>
                  {isScreenSharing && screenRef.current
                    ? <LocalVideo track={screenRef.current} label="🖥️ You" />
                    : <LocalVideo track={localTracks[1]} label={`You${isMuted ? " 🔇" : ""}${isVideoOff ? " 📷✕" : ""}`} />}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Side Panel ── */}
        {activePanel && joined && (
          <div style={{ width: 300, background: "#13122a", borderLeft: "1px solid #1e1b4b", display: "flex", flexDirection: "column", flexShrink: 0 }}>

            {/* Tab bar */}
            <div style={{ display: "flex", borderBottom: "1px solid #1e1b4b", flexShrink: 0, overflowX: "auto" }}>
              {(["participants", "chat", "whiteboard", ...(role === "host" ? ["breakout"] : [])] as Panel[]).map(p => (
                <button key={p} onClick={() => { setActivePanel(p); if (p === "chat") setUnreadChat(0); }}
                  style={{ flex: "0 0 auto", padding: "9px 10px", background: "none", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, letterSpacing: 0.4, color: activePanel === p ? "#a78bfa" : "#6b7280", borderBottom: `2px solid ${activePanel === p ? "#7c3aed" : "transparent"}`, textTransform: "uppercase", whiteSpace: "nowrap", position: "relative" }}>
                  {{ participants: "👥 People", chat: "💬 Chat", whiteboard: "🖊 Board", breakout: "🏠 Rooms" }[p]}
                  {p === "chat" && unreadChat > 0 && <span style={{ marginLeft: 3, background: "#ef4444", borderRadius: 10, fontSize: 8, padding: "1px 4px", color: "#fff" }}>{unreadChat}</span>}
                </button>
              ))}
            </div>

            {/* ── Participants Panel ── */}
            {activePanel === "participants" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
                {/* Raised hands */}
                {raisedHands.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ color: "#f59e0b", fontSize: 9, fontWeight: 700, marginBottom: 5, letterSpacing: 0.6 }}>✋ RAISED HANDS ({raisedHands.length})</div>
                    {raisedHands.map(h => (
                      <div key={h.user} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 6px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 8, marginBottom: 3 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Av name={h.name} size={22} /><span style={{ color: "#f3f4f6", fontSize: 12 }}>{h.name}</span></div>
                        {role === "host" && (
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => promoteUser(h.user)} style={{ background: "#7c3aed", border: "none", color: "#fff", borderRadius: 5, padding: "2px 7px", fontSize: 10, cursor: "pointer" }}>Let Speak</button>
                            <button onClick={() => lowerHand(h.user)} style={{ background: "none", border: "1px solid #3730a3", color: "#a78bfa", borderRadius: 5, padding: "2px 6px", fontSize: 10, cursor: "pointer" }}>Lower</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {/* Co-hosts */}
                {coHosts.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ color: "#a78bfa", fontSize: 9, fontWeight: 700, marginBottom: 5, letterSpacing: 0.6 }}>🎤 SPEAKING ({coHosts.length})</div>
                    {coHosts.map(ch => {
                      const isMutedCoHost = false; // TODO: track per-user muted state
                      return (
                        <div key={ch.user} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 6px", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 8, marginBottom: 3 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Av name={ch.name} size={22} /><span style={{ color: "#f3f4f6", fontSize: 12 }}>{ch.name}</span></div>
                          {role === "host" && (
                            <div style={{ display: "flex", gap: 4 }}>
                              <button onClick={() => muteUser(ch.user)} style={{ background: "none", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", borderRadius: 5, padding: "2px 6px", fontSize: 10, cursor: "pointer" }}>Mute</button>
                              <button onClick={() => demoteUser(ch.user)} style={{ background: "none", border: "1px solid #3730a3", color: "#a78bfa", borderRadius: 5, padding: "2px 6px", fontSize: 10, cursor: "pointer" }}>Remove</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* You + remotes */}
                <div style={{ color: "#6b7280", fontSize: 9, fontWeight: 700, marginBottom: 5, letterSpacing: 0.6 }}>IN SESSION ({participantCount})</div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 6px", background: "rgba(124,58,237,0.08)", borderRadius: 8, marginBottom: 3 }}>
                  <Av name={user?.name || "Y"} size={26} />
                  <span style={{ color: "#f3f4f6", fontSize: 12, flex: 1 }}>{user?.name || "You"} {role === "host" ? "(Host)" : isCoHost ? "(Co-host)" : ""}</span>
                  {isMuted && <span style={{ fontSize: 10 }}>🔇</span>}
                  {mutedByHost && <span style={{ fontSize: 10, color: "#ef4444" }}>Muted by host</span>}
                </div>
                {remoteUsers.map(u => {
                  const p = activeParticipants.find(ap => ap.uid === Number(u.uid));
                  const remoteMuted = mutedRemoteUids.includes(Number(u.uid));
                  return (
                    <div key={u.uid} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 6px", borderRadius: 8, marginBottom: 3 }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#1e1b4b", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>👤</div>
                      <span style={{ color: "#d1d5db", fontSize: 12, flex: 1 }}>{inBreakout ? "Participant" : nameForUid(u.uid)}</span>
                      {!u.videoTrack && <span style={{ fontSize: 9, color: "#6b7280" }}>📷✕</span>}
                      {(remoteMuted || !u.audioTrack) && <span style={{ fontSize: 9, color: remoteMuted ? "#ef4444" : "#6b7280" }}>🔇</span>}
                      {role === "host" && p && (
                        <button onClick={() => muteUser(p.user)} style={{ background: "none", border: `1px solid ${remoteMuted ? "#3730a3" : "rgba(239,68,68,0.4)"}`, color: remoteMuted ? "#a78bfa" : "#f87171", borderRadius: 5, padding: "2px 6px", fontSize: 10, cursor: "pointer" }}>
                          {remoteMuted ? "Unmute" : "Mute"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Chat Panel ── */}
            {activePanel === "chat" && (
              <>
                <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 7 }}>
                  {messages.length === 0 && <div style={{ textAlign: "center", color: "#6b7280", fontSize: 12, marginTop: 36 }}>No messages yet 👋</div>}
                  {messages.map((msg, i) => {
                    const isSelf = msg.name === user?.name;
                    return (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isSelf ? "flex-end" : "flex-start" }}>
                        <span style={{ color: "#6b7280", fontSize: 9, marginBottom: 2, padding: "0 4px" }}>{msg.name}</span>
                        <div style={{ background: isSelf ? "#7c3aed" : "#1e1b4b", color: "#f3f4f6", padding: "6px 10px", borderRadius: isSelf ? "12px 12px 3px 12px" : "12px 12px 12px 3px", fontSize: 12, maxWidth: 220, wordBreak: "break-word" }}>{msg.text}</div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
                <div style={{ padding: "7px 10px", borderTop: "1px solid #1e1b4b", flexShrink: 0 }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Message…"
                      style={{ flex: 1, background: "#0a0910", border: "1px solid #1e1b4b", borderRadius: 7, color: "#f3f4f6", padding: "6px 9px", fontSize: 12, outline: "none", fontFamily: "inherit" }} />
                    <button onClick={sendMessage} disabled={!chatInput.trim()} style={{ background: "#7c3aed", border: "none", borderRadius: 7, color: "#fff", padding: "6px 10px", cursor: chatInput.trim() ? "pointer" : "not-allowed", fontSize: 13, opacity: chatInput.trim() ? 1 : 0.5 }}>➤</button>
                  </div>
                </div>
              </>
            )}

            {/* ── Whiteboard Panel ── */}
            {activePanel === "whiteboard" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Toolbar */}
                <div style={{ padding: "7px 8px", borderBottom: "1px solid #1e1b4b", display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
                  {/* Tool */}
                  <button onClick={() => setWbTool("pen")} style={{ padding: "4px 9px", borderRadius: 6, border: `1px solid ${wbTool === "pen" ? "#7c3aed" : "#1e1b4b"}`, background: wbTool === "pen" ? "rgba(124,58,237,0.2)" : "none", color: "#d1d5db", fontSize: 11, cursor: "pointer" }}>✏️ Pen</button>
                  <button onClick={() => setWbTool("eraser")} style={{ padding: "4px 9px", borderRadius: 6, border: `1px solid ${wbTool === "eraser" ? "#7c3aed" : "#1e1b4b"}`, background: wbTool === "eraser" ? "rgba(124,58,237,0.2)" : "none", color: "#d1d5db", fontSize: 11, cursor: "pointer" }}>🧹 Erase</button>
                  {/* Colors */}
                  {["#ffffff", "#f87171", "#34d399", "#60a5fa", "#fbbf24", "#a78bfa"].map(c => (
                    <button key={c} onClick={() => { setWbColor(c); setWbTool("pen"); }}
                      style={{ width: 18, height: 18, borderRadius: "50%", background: c, border: `2px solid ${wbColor === c ? "#fff" : "transparent"}`, cursor: "pointer", flexShrink: 0 }} />
                  ))}
                  {/* Size */}
                  <select value={wbSize} onChange={e => setWbSize(Number(e.target.value))} style={{ background: "#0a0910", border: "1px solid #1e1b4b", color: "#d1d5db", borderRadius: 6, padding: "2px 4px", fontSize: 11 }}>
                    {[2, 4, 8, 14].map(s => <option key={s} value={s}>{s}px</option>)}
                  </select>
                  {role === "host" && <button onClick={clearWhiteboard} style={{ marginLeft: "auto", padding: "4px 8px", background: "none", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", borderRadius: 6, fontSize: 10, cursor: "pointer" }}>🗑 Clear</button>}
                </div>
                {/* Canvas */}
                <div style={{ flex: 1, overflow: "auto", padding: 4 }}>
                  <WhiteboardCanvas
                    strokes={wbStrokes}
                    canDraw={canPublish}
                    tool={wbTool}
                    color={wbColor}
                    size={wbSize}
                    onStrokeDone={onStrokeDone}
                  />
                  {!canPublish && <p style={{ textAlign: "center", color: "#6b7280", fontSize: 11, margin: "4px 0 0" }}>View only — raise hand to request drawing access</p>}
                </div>
              </div>
            )}

            {/* ── Breakout Rooms Panel (host only) ── */}
            {activePanel === "breakout" && role === "host" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
                {!breakoutActive ? (
                  <>
                    <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 12 }}>Split students into small groups for collaborative exercises.</p>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ color: "#a78bfa", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 5 }}>NUMBER OF ROOMS</label>
                      <div style={{ display: "flex", gap: 6 }}>
                        {[2, 3, 4].map(n => (
                          <button key={n} onClick={() => setBreakoutCount(n)}
                            style={{ flex: 1, padding: "7px 0", border: `1.5px solid ${breakoutCount === n ? "#7c3aed" : "#1e1b4b"}`, background: breakoutCount === n ? "rgba(124,58,237,0.2)" : "none", color: breakoutCount === n ? "#a78bfa" : "#9ca3af", borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p style={{ color: "#6b7280", fontSize: 11, marginBottom: 14 }}>Students will be auto-assigned equally. They'll see a notification to join their room.</p>
                    <button onClick={createBreakout} style={{ width: "100%", background: "linear-gradient(135deg,#7c3aed,#5b21b6)", border: "none", color: "#fff", borderRadius: 10, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      🏠 Start Breakout Sessions
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ color: "#22c55e", fontSize: 11, fontWeight: 700, marginBottom: 10 }}>✅ Breakout sessions active</div>
                    {breakoutRooms.map(room => (
                      <div key={room.id} style={{ background: "#1e1b4b", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                        <div style={{ color: "#f3f4f6", fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{room.name}</div>
                        <div style={{ color: "#9ca3af", fontSize: 11, marginBottom: 8 }}>👥 {room.participantCount} participant{room.participantCount !== 1 ? "s" : ""}</div>
                        <button onClick={async () => {
                          try {
                            const { data } = await apiClient.post(`/live-classes/${classId}/breakout/${room.id}/join`);
                            setMyBreakout({ id: room.id, name: room.name, channel: data.channel });
                            await joinBreakout({ id: room.id, name: room.name, channel: data.channel });
                          } catch {}
                        }} style={{ background: "none", border: "1px solid #3730a3", color: "#a78bfa", borderRadius: 7, padding: "4px 12px", fontSize: 11, cursor: "pointer" }}>
                          Monitor Room →
                        </button>
                      </div>
                    ))}
                    <button onClick={endBreakout} style={{ width: "100%", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
                      End All Breakouts
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Toolbar ── */}
      {joined && (
        <div style={{ background: "#13122a", borderTop: "1px solid #1e1b4b", padding: "9px 12px", display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", flexShrink: 0 }}>
          {/* Publisher controls */}
          {canPublish && <>
            <TBtn icon={isMuted ? "🔇" : "🎤"} label={mutedByHost ? "Muted by host" : isMuted ? "Unmute" : "Mute"} active={isMuted} disabled={mutedByHost} onClick={toggleMute} />
            <TBtn icon={isVideoOff ? "📷" : "📹"} label={isVideoOff ? "Start Video" : "Stop Video"} active={isVideoOff} onClick={toggleVideo} />
            {role === "host" && <TBtn icon="🖥️" label={isScreenSharing ? "Stop Share" : "Share Screen"} active={isScreenSharing} onClick={toggleScreenShare} />}
            {role === "host" && <TBtn icon="⏺️" label={recordingActive ? "Stop Recording" : "Record"} active={recordingActive} disabled={recordingBusy} onClick={toggleRecording} />}
            <div style={{ width: 1, height: 36, background: "#2a274a", margin: "0 2px" }} />
          </>}

          {/* Common */}
          <TBtn icon="👥" label="People" active={activePanel === "participants"} badge={handBadge > 0 ? handBadge : undefined} onClick={() => togglePanel("participants")} />
          <TBtn icon="💬" label="Chat" active={activePanel === "chat"} badge={unreadChat > 0 ? unreadChat : undefined} onClick={() => togglePanel("chat")} />
          <TBtn icon="🖊️" label="Board" active={activePanel === "whiteboard"} onClick={() => togglePanel("whiteboard")} />
          {role === "host" && <TBtn icon="🏠" label="Rooms" active={activePanel === "breakout"} badge={breakoutActive ? 1 : undefined} onClick={() => togglePanel("breakout")} />}

          {/* Audience: raise hand */}
          {role === "audience" && !isCoHost && <TBtn icon="✋" label={isHandRaised ? "Lower Hand" : "Raise Hand"} active={isHandRaised} onClick={toggleHand} />}

          {/* Host: settings */}
          {role === "host" && (
            <div style={{ position: "relative" }}>
              <TBtn icon="⚙️" label="Settings" active={showSettings} onClick={() => setShowSettings(!showSettings)} />
              {showSettings && (
                <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, background: "#1a1730", border: "1px solid #1e1b4b", borderRadius: 12, padding: 12, minWidth: 220, zIndex: 50 }}>
                  <div style={{ color: "#a78bfa", fontSize: 10, fontWeight: 700, marginBottom: 6, letterSpacing: 0.6 }}>📷 CAMERA</div>
                  {cameras.map(cam => <button key={cam.deviceId} onClick={() => { (localTracks?.[1] as any)?.setDevice(cam.deviceId); setShowSettings(false); }} style={{ display: "block", width: "100%", background: "none", border: "none", color: "#d1d5db", padding: "4px 6px", cursor: "pointer", textAlign: "left", fontSize: 11, borderRadius: 5 }} onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.18)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>{cam.label || `Camera ${cam.deviceId.slice(0, 6)}`}</button>)}
                  <div style={{ color: "#a78bfa", fontSize: 10, fontWeight: 700, margin: "8px 0 6px", letterSpacing: 0.6 }}>🎤 MICROPHONE</div>
                  {mics.map(mic => <button key={mic.deviceId} onClick={() => { (localTracks?.[0] as any)?.setDevice(mic.deviceId); setShowSettings(false); }} style={{ display: "block", width: "100%", background: "none", border: "none", color: "#d1d5db", padding: "4px 6px", cursor: "pointer", textAlign: "left", fontSize: 11, borderRadius: 5 }} onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.18)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>{mic.label || `Mic ${mic.deviceId.slice(0, 6)}`}</button>)}
                </div>
              )}
            </div>
          )}

          {/* Leave - right end */}
          <div style={{ marginLeft: "auto" }}>
            <TBtn icon="🚪" label={inBreakout ? "Main Room" : role === "host" ? "End" : "Leave"} danger onClick={inBreakout ? returnFromBreakout : handleLeave} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveClassRoom;
