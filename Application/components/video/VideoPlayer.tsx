import React, { useRef, useEffect, useState } from "react";
import Hls from "hls.js";

interface Props {
  muxPlaybackId?: string;
  streamUrl?: string;
  title?: string;
  onEnded?: () => void;
}

const VideoPlayer: React.FC<Props> = ({ muxPlaybackId, streamUrl, title, onEnded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState("");

  const src = streamUrl || (muxPlaybackId ? `https://stream.mux.com/${muxPlaybackId}.m3u8` : "");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setError("");

    // Destroy any previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = src.includes(".m3u8");

    if (isHls && Hls.isSupported()) {
      // Chrome, Firefox, Edge — use hls.js
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // ready to play
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) setError("Video failed to load. It may still be processing — try again in a minute.");
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari — native HLS
      video.src = src;
    } else {
      // Fallback for non-HLS sources (direct mp4 etc.)
      video.src = src;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  if (!src) return (
    <div style={{ aspectRatio: "16/9", background: "#0f0e1a", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#6b7280" }}>No video available</span>
    </div>
  );

  return (
    <div style={{ background: "#000", borderRadius: 12, overflow: "hidden", position: "relative" }}>
      {title && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "12px 16px", background: "linear-gradient(180deg,rgba(0,0,0,0.8),transparent)", zIndex: 10, pointerEvents: "none" }}>
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
      {error && (
        <div style={{ padding: "12px 16px", background: "#450a0a", color: "#f87171", fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
