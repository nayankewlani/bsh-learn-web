import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import LiveClassRoom from "../components/live/LiveClassRoom";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import client from "../api/client";

interface LiveClass {
  _id: string;
  title: string;
  description?: string;
  educator: { name: string; avatar?: string };
  scheduledAt: string;
  duration: number;
  status: string;
  enrolledStudents: string[];
}

const LivePage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [activeClass, setActiveClass] = useState<{ appId: string; channel: string; token: string; role: "host" | "audience" } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get("/live-classes").then(({ data }) => setClasses(data.classes)).finally(() => setLoading(false));
  }, []);

  const joinClass = async (liveClassId: string, asHost = false) => {
    if (!user) { navigate("/login"); return; }
    const endpoint = asHost ? `/live-classes/${liveClassId}/start` : `/live-classes/${liveClassId}/join`;
    const { data } = await client.post(endpoint);
    setActiveClass({ appId: data.appId, channel: data.channel, token: data.token, role: asHost ? "host" : "audience" });
  };

  const fmtDate = (d: string) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div style={{ background: "#0a0914", minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#f3f4f6" }}>Live Classes</h1>
            <p style={{ margin: 0, color: "#9ca3af", fontSize: 14 }}>Attend live sessions from top educators</p>
          </div>
          {user?.role === "educator" && (
            <Button onClick={() => navigate("/live/schedule")}>+ Schedule Class</Button>
          )}
        </div>

        {activeClass && (
          <div style={{ marginBottom: 32 }}>
            <LiveClassRoom {...activeClass} onLeave={() => setActiveClass(null)} />
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#7c3aed" }}>Loading classes...</div>
        ) : classes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📡</div>
            <h2 style={{ color: "#f3f4f6", marginBottom: 8 }}>No live classes scheduled</h2>
            <p style={{ color: "#9ca3af" }}>Check back soon for upcoming sessions</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 20 }}>
            {classes.map((cls) => (
              <div key={cls._id} style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <Badge color={cls.status === "live" ? "red" : "purple"}>{cls.status === "live" ? "🔴 LIVE" : "Scheduled"}</Badge>
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>{cls.duration} min</span>
                </div>
                <h3 style={{ color: "#f3f4f6", fontSize: 16, fontWeight: 700, margin: "0 0 8px", lineHeight: 1.3 }}>{cls.title}</h3>
                {cls.description && <p style={{ color: "#9ca3af", fontSize: 13, margin: "0 0 12px" }}>{cls.description}</p>}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Avatar src={cls.educator.avatar} name={cls.educator.name} size={24} />
                  <span style={{ color: "#c4b5fd", fontSize: 13 }}>{cls.educator.name}</span>
                </div>
                <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 16 }}>🗓 {fmtDate(cls.scheduledAt)}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {cls.status === "live" && (
                    <Button fullWidth size="sm" onClick={() => joinClass(cls._id, user?.role === "educator")}>
                      {user?.role === "educator" ? "Go Live" : "Join Now"}
                    </Button>
                  )}
                  {cls.status === "scheduled" && (
                    <Button fullWidth variant="secondary" size="sm" onClick={() => user?.role === "educator" && joinClass(cls._id, true)}>
                      {user?.role === "educator" ? "Start Class" : "Remind Me"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LivePage;
