import React, { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import client from "../../api/client";

declare global {
  interface Window { Razorpay: new (options: unknown) => { open: () => void }; }
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  courseId?: string;
  courseTitle?: string;
  coursePricePaise?: number;
  plan?: "monthly" | "annual";
  onSuccess?: () => void;
}

const PLAN_DETAILS = {
  monthly: { label: "Pro Monthly", price: 499, description: "All courses + unlimited live classes for 30 days" },
  annual: { label: "Pro Annual", price: 3999, description: "All courses + downloads + recordings for 1 year" },
};

const CheckoutModal: React.FC<Props> = ({ isOpen, onClose, courseId, courseTitle, coursePricePaise, plan, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isPlan = !!plan;
  const displayPrice = isPlan
    ? (PLAN_DETAILS[plan!].price * 100)
    : (coursePricePaise || 0);

  const handleCheckout = async () => {
    setLoading(true);
    setError("");
    try {
      const body = isPlan ? { type: "subscription", plan } : { type: "course", courseId };
      const { data } = await client.post("/payments/create-order", body);
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: "INR",
        name: "BSHLearn",
        description: isPlan ? PLAN_DETAILS[plan!].label : courseTitle,
        order_id: data.order.id,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          await client.post("/payments/verify", {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          onSuccess?.();
          onClose();
        },
        prefill: {},
        theme: { color: "#7c3aed" },
      };
      new window.Razorpay(options).open();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Purchase">
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ background: "#1e1b4b", borderRadius: 12, padding: 16 }}>
          <div style={{ color: "#c4b5fd", fontSize: 13, marginBottom: 4 }}>
            {isPlan ? "Subscription Plan" : "Course"}
          </div>
          <div style={{ color: "#f3f4f6", fontWeight: 700, fontSize: 16 }}>
            {isPlan ? PLAN_DETAILS[plan!].label : courseTitle}
          </div>
          {isPlan && <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>{PLAN_DETAILS[plan!].description}</div>}
          <div style={{ marginTop: 12, fontSize: 26, fontWeight: 800, color: "#a78bfa" }}>
            ₹{(displayPrice / 100).toLocaleString()}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, color: "#9ca3af", fontSize: 13 }}>
          {["Secure payment via Razorpay", "Instant access after payment", "30-day money-back guarantee"].map((t) => (
            <div key={t} style={{ display: "flex", gap: 8 }}>✅ {t}</div>
          ))}
        </div>

        {error && <div style={{ background: "#450a0a", color: "#f87171", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>{error}</div>}

        <Button fullWidth onClick={handleCheckout} loading={loading} size="lg">
          Pay ₹{(displayPrice / 100).toLocaleString()} Now
        </Button>
      </div>
    </Modal>
  );
};

export default CheckoutModal;
