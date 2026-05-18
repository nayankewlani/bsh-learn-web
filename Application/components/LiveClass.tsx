import React from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import axios from "axios";

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

const LiveClass: React.FC = () => {

  const startClass = async (): Promise<void> => {

    const res = await axios.get(
      "http://localhost:3000/api/agora-token?channel=class1"
    );

    const token = res.data.token;

    await client.join(
      "AGORA_APP_ID",
      "class1",
      token,
      null
    );

    const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();

    await client.publish(tracks);
  };

  return (
    <button onClick={startClass}>
      Start Live Class
    </button>
  );
};

export default LiveClass;