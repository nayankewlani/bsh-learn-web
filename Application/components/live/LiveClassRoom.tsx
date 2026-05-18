import React, { useEffect, useRef, useState } from "react";
import AgoraRTC, { IAgoraRTCClient, ILocalAudioTrack, ILocalVideoTrack, IRemoteAudioTrack, IRemoteVideoTrack } from "agora-rtc-sdk-ng";
import Button from "../ui/Button";

interface Props {
  appId: string;
  channel: string;
  token: string;
  role: "host" | "audience";
  onLeave?: () => void;
}

const LiveClassRoom: React.FC<Props> = ({ appId, channel, token, role, onLeave }) => {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const [remoteUsers, setRemoteUsers] = useState<{ uid: string | number; videoTrack?: IRemoteVideoTrack; audioTrack?: IRemoteAudioTrack }[]>([]);
  const [joined, setJoined] = useState(false);
  const [localTracks, setLocalTracks] = useState<[ILocalAudioTrack, ILocalVideoTrack] | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  const join = async () => {
    const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
    client.setClientRole(role === "host" ? "host" : "audience");
    clientRef.current = client;

    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === "video") {
        setRemoteUsers((prev) => {
          const exists = prev.find((u) => u.uid === user.uid);
          if (exists) return prev.map((u) => u.uid === user.uid ? { ...u, videoTrack: user.videoTrack } : u);
          return [...prev, { uid: user.uid, videoTrack: user.videoTrack }];
        });
        setTimeout(() => {
          const container = document.getElementById(`remote-${user.uid}`);
          if (container && user.videoTrack) user.videoTrack.play(container);
        }, 100);
      }
      if (mediaType === "audio") user.audioTrack?.play();
    });

    client.on("user-unpublished", (user) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    });

    client.on("user-joined", () => setParticipantCount((n) => n + 1));
    client.on("user-left", () => setParticipantCount((n) => Math.max(0, n - 1)));

    await client.join(appId, channel, token, null);
    setParticipantCount(client.remoteUsers.length + 1);

    if (role === "host") {
      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalTracks(tracks);
      await client.publish(tracks);
      if (localVideoRef.current) tracks[1].play(localVideoRef.current);
    }
    setJoined(true);
  };

  const leave = async () => {
    if (localTracks) { localTracks.forEach((t) => { t.stop(); t.close(); }); }
    await clientRef.current?.leave();
    setJoined(false);
    setRemoteUsers([]);
    onLeave?.();
  };

  const toggleMute = () => {
    if (localTracks) {
      localTracks[0].setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localTracks) {
      localTracks[1].setEnabled(isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  useEffect(() => { return () => { leave(); }; }, []);

  return (
    <div style={{ background: "#0f0e1a", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ background: "#13122a", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e1b4b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {joined && <span style={{ width: 8, height: 8, background: "#ef4444", borderRadius: "50%", display: "inline-block", animation: "pulse 1s infinite" }} />}
          <span style={{ color: "#f3f4f6", fontWeight: 700 }}>Live Class</span>
          {joined && <span style={{ color: "#9ca3af", fontSize: 13 }}>{participantCount} viewers</span>}
        </div>
        {joined && <Button size="sm" variant="danger" onClick={leave}>Leave</Button>}
      </div>

      {!joined ? (
        <div style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎥</div>
          <p style={{ color: "#9ca3af", marginBottom: 20 }}>{role === "host" ? "Start broadcasting to your students" : "Join the live class"}</p>
          <Button onClick={join}>{role === "host" ? "Go Live" : "Join Class"}</Button>
        </div>
      ) : (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: remoteUsers.length === 0 ? "1fr" : "repeat(auto-fit,minmax(320px,1fr))", gap: 4, background: "#000", minHeight: 300 }}>
            {role === "host" && (
              <div style={{ position: "relative", background: "#111" }}>
                <div ref={localVideoRef} style={{ width: "100%", minHeight: 300 }} />
                <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.7)", padding: "2px 8px", borderRadius: 6, fontSize: 12, color: "#fff" }}>You (Host)</div>
              </div>
            )}
            {remoteUsers.map((user) => (
              <div key={user.uid} style={{ position: "relative", background: "#111", minHeight: 200 }}>
                <div id={`remote-${user.uid}`} style={{ width: "100%", minHeight: 200 }} />
                <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.7)", padding: "2px 8px", borderRadius: 6, fontSize: 12, color: "#fff" }}>Student</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#13122a", padding: "14px 20px", display: "flex", gap: 12, justifyContent: "center", borderTop: "1px solid #1e1b4b" }}>
            {role === "host" && (
              <>
                <Button variant={isMuted ? "danger" : "secondary"} size="sm" onClick={toggleMute}>{isMuted ? "🔇 Unmute" : "🎤 Mute"}</Button>
                <Button variant={isVideoOff ? "danger" : "secondary"} size="sm" onClick={toggleVideo}>{isVideoOff ? "📷 Start Video" : "📷 Stop Video"}</Button>
              </>
            )}
            <Button variant="danger" size="sm" onClick={leave}>Leave</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveClassRoom;
