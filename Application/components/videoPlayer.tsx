import React, { useState } from "react";
import axios from "axios";

const VideoPlayer: React.FC = () => {

  const [playbackId, setPlaybackId] = useState<string>("");

  const uploadVideo = async (): Promise<void> => {

    const res = await axios.post("http://localhost:3000/api/upload-video", {
      videoUrl: "https://test-videos.co.uk/video.mp4",
    });

    setPlaybackId(res.data.playbackId);
  };

  return (
    <div>

      <button onClick={uploadVideo}>
        Upload Video
      </button>

      {playbackId && (
        <video
          controls
          width={600}
          src={`https://stream.mux.com/${playbackId}.m3u8`}
        />
      )}

    </div>
  );
};

export default VideoPlayer;