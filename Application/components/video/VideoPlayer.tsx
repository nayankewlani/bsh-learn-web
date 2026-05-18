import React, { useRef, useEffect } from "react";

interface Props {
  muxPlaybackId?: string;
  streamUrl?: string;
  title?: string;
  onEnded?: () => void;
}

const VideoPlayer: React.FC<Props> = ({ muxPlaybackId, streamUrl, title, onEnded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const src = streamUrl || (muxPlaybackId ? `https://stream.mux.com/${muxPlaybackId}.m3u8` : "");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    video.src = src;
  }, [src]);

  if (!src) return (
    <div style={{ aspect: "16/9", background: "#0f0e1a", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#6b7280" }}>No video available</span>
    </div>
  );

  return (
    <div style={{ background: "#000", borderRadius: 12, overflow: "hidden", position: "relative" }}>
      {title && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "12px 16px", background: "linear-gradient(180deg,rgba(0,0,0,0.8),transparent)", zIndex: 10 }}>
          <span style={{ color: "#f3f4f6", fontSize: 14, fontWeight: 600 }}>{title}</span>
        </div>
      )}
      <video
        ref={videoRef}
        controls
        style={{ width: "100%", display: "block", maxHeight: "70vh" }}
        onEnded={onEnded}
        playsInline
      />
    </div>
  );
};

export default VideoPlayer;
