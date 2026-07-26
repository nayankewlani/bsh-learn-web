import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useThemeStore } from "../stores/themeStore";
import client from "../api/client";

// Razorpay payment link callback params:
//   razorpay_payment_id, razorpay_payment_link_id,
//   razorpay_payment_link_reference_id, razorpay_payment_link_status,
//   razorpay_signature

type Status = "verifying" | "success" | "failed" | "expired";

const PaymentReturnPage: React.FC = () => {
  const { t } = useThemeStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      const razorpay_payment_id              = params.get("razorpay_payment_id");
      const razorpay_payment_link_id         = params.get("razorpay_payment_link_id");
      const razorpay_payment_link_reference_id = params.get("razorpay_payment_link_reference_id");
      const razorpay_payment_link_status     = params.get("razorpay_payment_link_status");
      const razorpay_signature               = params.get("razorpay_signature");

      // Token was saved in sessionStorage before the redirect
      const token = sessionStorage.getItem("bsh_payment_token")
        || razorpay_payment_link_reference_id;  // reference_id = our token

      if (razorpay_payment_link_status === "cancelled") {
        setStatus("failed");
        setMessage("Payment was cancelled. No charge was made.");
        return;
      }

      if (!razorpay_payment_id || !razorpay_signature || !token) {
        setStatus("failed");
        setMessage("Missing payment details. If you completed the payment, please contact support.");
        return;
      }

      try {
        const { data } = await client.post("/payments/verify-link", {
          token,
          razorpay_payment_id,
          razorpay_payment_link_id,
          razorpay_payment_link_reference_id,
          razorpay_payment_link_status,
          razorpay_signature,
        });

        sessionStorage.removeItem("bsh_payment_token");

        if (data.alreadyFulfilled) {
          setStatus("success");
          setMessage("You are already enrolled in this course!");
        } else {
          setStatus("success");
          setMessage("Payment verified! You now have full access.");
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message || "";
        if (msg.includes("expired") || msg.includes("not found")) {
          setStatus("expired");
          setMessage("This payment session expired. If money was deducted, it will be refunded automatically. Please contact support with your payment ID.");
        } else if (msg.includes("signature")) {
          setStatus("failed");
          setMessage("Payment verification failed (signature mismatch). If you believe this is an error, please contact support.");
        } else {
          setStatus("failed");
          setMessage(msg || "Verification failed. Please contact support.");
        }
      }
    };

    verify();
  }, []);

  const iconMap: Record<Status, string> = {
    verifying: "⏳",
    success:   "✅",
    failed:    "❌",
    expired:   "⚠️",
  };

  const colorMap: Record<Status, string> = {
    verifying: t.accent,
    success:   "#22c55e",
    failed:    "#ef4444",
    expired:   "#f59e0b",
  };

  const headingMap: Record<Status, string> = {
    verifying: "Verifying your payment…",
    success:   "Payment Successful!",
    failed:    "Verification Failed",
    expired:   "Session Expired",
  };

  return (
    <div style={{ minHeight: "100vh", background: t.bgPrimary, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: t.bgCard, border: `1.5px solid ${colorMap[status]}44`, borderRadius: 24, padding: "56px 40px", textAlign: "center", maxWidth: 480, width: "100%", boxShadow: `0 24px 70px ${colorMap[status]}22` }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>{iconMap[status]}</div>

        <h1 style={{ fontSize: 24, fontWeight: 900, color: t.textPrimary, margin: "0 0 12px" }}>
          {headingMap[status]}
        </h1>

        {status === "verifying" && (
          <div style={{ margin: "16px auto 0", width: 40, height: 40, border: `3px solid ${t.border}`, borderTopColor: t.accent, borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
        )}

        {message && (
          <p style={{ color: t.textSecond, fontSize: 15, lineHeight: 1.7, margin: "16px 0 28px" }}>
            {message}
          </p>
        )}

        {status === "success" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => navigate("/dashboard")}
              style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", border: "none", color: "#fff", padding: "14px 32px", borderRadius: 12, cursor: "pointer", fontSize: 15, fontWeight: 800, boxShadow: "0 6px 20px rgba(124,58,237,0.38)" }}>
              Go to My Dashboard →
            </button>
            <button onClick={() => navigate("/explore")}
              style={{ background: "transparent", border: `1.5px solid ${t.border}`, color: t.textSecond, padding: "12px 32px", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
              Browse More Courses
            </button>
          </div>
        )}

        {(status === "failed" || status === "expired") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => navigate(-1)}
              style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", border: "none", color: "#fff", padding: "14px 32px", borderRadius: 12, cursor: "pointer", fontSize: 15, fontWeight: 800 }}>
              Try Again
            </button>
            <a href="mailto:support@bshealers.com"
              style={{ color: t.textSecond, fontSize: 13, textDecoration: "underline" }}>
              Contact Support
            </a>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default PaymentReturnPage;
