import React from "react";

const wrap: React.CSSProperties = {
  maxWidth: 760, margin: "0 auto", padding: "48px 20px 80px",
  color: "#d1d5db", lineHeight: 1.7, fontSize: 15,
};
const h1: React.CSSProperties = { color: "#f3f4f6", fontSize: 32, fontWeight: 800, marginBottom: 8 };
const updated: React.CSSProperties = { color: "#9ca3af", fontSize: 13, marginBottom: 32 };
const h2: React.CSSProperties = { color: "#f3f4f6", fontSize: 20, fontWeight: 700, marginTop: 36, marginBottom: 12 };
const ul: React.CSSProperties = { paddingLeft: 22, margin: "8px 0" };

const PrivacyPolicyPage: React.FC = () => (
  <div style={{ background: "#0a0914", minHeight: "100vh" }}>
    <div style={wrap}>
      <h1 style={h1}>Privacy Policy</h1>
      <p style={updated}>Last updated: September 2026</p>

      <p>
        Blessings School of Hypnosis Private Limited ("BSH Healers," "we," "us," or "our") operates the
        BSH Healers website and mobile application (together, the "App"). This Privacy Policy explains
        what information we collect, why we collect it, and how it is used.
      </p>

      <h2 style={h2}>Information We Collect</h2>
      <ul style={ul}>
        <li><strong>Account information:</strong> name, email address, and phone number when you register or log in.</li>
        <li><strong>Payment information:</strong> when you purchase a course or book a session, payments are processed by Razorpay. We do not store your card, UPI, or bank details — Razorpay handles this directly and shares only transaction status and identifiers with us.</li>
        <li><strong>Camera and microphone:</strong> used only while you are actively in a live class or 1:1 session, to transmit your audio/video to other participants and, if the host enables recording, to record the session.</li>
        <li><strong>Push notification tokens:</strong> used to send you class reminders, booking updates, and announcements.</li>
        <li><strong>Usage information:</strong> pages visited, courses viewed, and general app activity, used to improve the product and provide support.</li>
      </ul>

      <h2 style={h2}>How We Use Your Information</h2>
      <ul style={ul}>
        <li>To create and manage your account and enrollments.</li>
        <li>To process payments and bookings for courses and live sessions.</li>
        <li>To operate live video classes, including optional recording for playback afterward.</li>
        <li>To send notifications about your classes, bookings, and platform updates.</li>
        <li>To respond to support requests and improve the App.</li>
      </ul>

      <h2 style={h2}>Third-Party Services</h2>
      <p>We use the following third-party services to operate the App, each of which processes limited data as needed to provide their service:</p>
      <ul style={ul}>
        <li><strong>Razorpay</strong> — payment processing.</li>
        <li><strong>Agora</strong> — real-time audio/video for live classes and 1:1 sessions.</li>
        <li><strong>Mux</strong> — hosting and playback of course videos and class recordings.</li>
        <li><strong>Google Cloud Storage</strong> — temporary storage of live class recordings before they are processed.</li>
        <li><strong>MongoDB Atlas</strong> — our application database.</li>
      </ul>

      <h2 style={h2}>Data Sharing</h2>
      <p>
        We do not sell your personal information. We share information with the third-party services listed
        above only as needed to provide the App's functionality, and with law enforcement or regulators when
        required by law.
      </p>

      <h2 style={h2}>Data Retention</h2>
      <p>
        We retain your account information for as long as your account is active. Live class recordings are
        retained to allow enrolled students to review past sessions, and can be deleted on request.
      </p>

      <h2 style={h2}>Your Choices</h2>
      <ul style={ul}>
        <li>You can update your profile information at any time from within the App.</li>
        <li>You can disable push notifications from your device's system settings.</li>
        <li>You can request deletion of your account and associated data by contacting us at the email below.</li>
      </ul>

      <h2 style={h2}>Children's Privacy</h2>
      <p>The App is not directed at children under 13, and we do not knowingly collect personal information from children under 13.</p>

      <h2 style={h2}>Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date.</p>

      <h2 style={h2}>Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy or your data, contact us at{" "}
        <a href="mailto:support@bshhealers.com" style={{ color: "#a78bfa" }}>support@bshhealers.com</a>.
      </p>
    </div>
  </div>
);

export default PrivacyPolicyPage;
