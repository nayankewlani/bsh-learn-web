import React from "react";

const s = {
  page:    { background: "#07090f", minHeight: "100vh" } as React.CSSProperties,
  wrap:    { maxWidth: 780, margin: "0 auto", padding: "56px 24px 96px", color: "#c9d1e0", lineHeight: 1.8, fontSize: 15 } as React.CSSProperties,
  h1:      { color: "#f1f5f9", fontSize: 34, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.5px" } as React.CSSProperties,
  updated: { color: "#64748b", fontSize: 13, marginBottom: 10 } as React.CSSProperties,
  lead:    { color: "#94a3b8", fontSize: 15, marginBottom: 36, lineHeight: 1.7, borderBottom: "1px solid #1e2d45", paddingBottom: 32 } as React.CSSProperties,
  h2:      { color: "#f1f5f9", fontSize: 19, fontWeight: 700, marginTop: 40, marginBottom: 12, paddingLeft: 14, borderLeft: "3px solid #6366f1" } as React.CSSProperties,
  p:       { margin: "0 0 14px" } as React.CSSProperties,
  ul:      { paddingLeft: 22, margin: "10px 0 14px" } as React.CSSProperties,
  li:      { marginBottom: 8 } as React.CSSProperties,
  table:   { width: "100%", borderCollapse: "collapse" as const, margin: "14px 0 24px", fontSize: 14 },
  th:      { background: "#111827", color: "#94a3b8", fontWeight: 600, padding: "10px 14px", textAlign: "left" as const, borderBottom: "1px solid #1e2d45", fontSize: 12, letterSpacing: "0.5px", textTransform: "uppercase" as const },
  td:      { padding: "10px 14px", borderBottom: "1px solid #151f30", color: "#c9d1e0", verticalAlign: "top" as const },
  a:       { color: "#818cf8", textDecoration: "none" as const },
  chip:    { display: "inline-block", background: "#1e2d45", color: "#94a3b8", fontSize: 11, padding: "2px 8px", borderRadius: 4, marginRight: 4, marginBottom: 3 } as React.CSSProperties,
};

const PrivacyPolicyPage: React.FC = () => (
  <div style={s.page}>
    <div style={s.wrap}>
      <h1 style={s.h1}>Privacy Policy</h1>
      <p style={s.updated}>Last updated: September 2026</p>
      <p style={s.lead}>
        Blessings School of Hypnosis ("BSH Healers", "we", "us", or "our") operates the BSH Healers
        website at <a href="https://bshhealers.com" style={s.a}>bshhealers.com</a> and the BSH Healers
        mobile application for iOS and Android (together, the "Platform"). This Privacy Policy describes
        what personal data we collect, how we use and protect it, and the choices you have regarding
        your information.
      </p>

      {/* 1 */}
      <h2 style={s.h2}>1. Information We Collect</h2>
      <p style={s.p}><strong style={{ color: "#f1f5f9" }}>Account information</strong><br />
        When you register, we collect your full name, email address, and phone number. This information
        is used to create and secure your account and to communicate with you about your courses and bookings.
      </p>
      <p style={s.p}><strong style={{ color: "#f1f5f9" }}>Profile information</strong><br />
        You may optionally upload a profile picture and add other details to your profile.
      </p>
      <p style={s.p}><strong style={{ color: "#f1f5f9" }}>Payment information</strong><br />
        Payments for courses and consultations are processed by <strong>Razorpay</strong> on our website.
        We do not store your card number, UPI ID, or bank details. Razorpay shares only a transaction
        status and reference ID with us. <em>No payment processing occurs inside the mobile app.</em>
      </p>
      <p style={s.p}><strong style={{ color: "#f1f5f9" }}>Camera and microphone</strong><br />
        Your camera and microphone are accessed only when you actively join a live class or a 1-on-1
        consultation session. Audio and video are transmitted in real time via Agora and are not stored
        by us unless the session host enables recording.
      </p>
      <p style={s.p}><strong style={{ color: "#f1f5f9" }}>Location (Kundli / Astrology feature)</strong><br />
        If you use the Vedic Kundli feature, we request your birth location for the purpose of
        calculating your birth chart. We use Google Places to look up coordinates. We do not track
        your current or real-time GPS location at any time.
      </p>
      <p style={s.p}><strong style={{ color: "#f1f5f9" }}>Device identifiers and push tokens</strong><br />
        We store your device's push notification token to send you class reminders, booking
        confirmations, and announcements. Tokens are automatically removed when you log out or
        uninstall the app.
      </p>
      <p style={s.p}><strong style={{ color: "#f1f5f9" }}>Usage and activity data</strong><br />
        We collect data about how you use the Platform — including courses you view, lessons you
        complete, live classes you attend, and searches you perform. This data is used to personalise
        your experience and improve the Platform.
      </p>
      <p style={s.p}><strong style={{ color: "#f1f5f9" }}>Crash and diagnostic data</strong><br />
        The mobile app may automatically report crash events to help us identify and fix technical
        issues. This data does not include personally identifiable information.
      </p>

      {/* 2 */}
      <h2 style={s.h2}>2. How We Use Your Information</h2>
      <ul style={s.ul}>
        <li style={s.li}>To create, manage, and secure your account.</li>
        <li style={s.li}>To enroll you in courses and track your learning progress.</li>
        <li style={s.li}>To process and confirm payments and bookings made on our website.</li>
        <li style={s.li}>To operate live video classes and 1-on-1 consultation sessions.</li>
        <li style={s.li}>To send notifications about your scheduled classes, bookings, and platform updates.</li>
        <li style={s.li}>To generate your Vedic birth chart (Kundli) using your birth date, time, and location.</li>
        <li style={s.li}>To respond to customer support requests.</li>
        <li style={s.li}>To improve the Platform by analysing aggregate usage patterns.</li>
        <li style={s.li}>To comply with applicable laws and regulations.</li>
      </ul>

      {/* 3 */}
      <h2 style={s.h2}>3. Data We Do Not Collect</h2>
      <ul style={s.ul}>
        <li style={s.li}>We do not collect or store payment card, UPI, or banking details.</li>
        <li style={s.li}>We do not track your real-time GPS or current location.</li>
        <li style={s.li}>We do not display third-party advertising and do not share data with ad networks.</li>
        <li style={s.li}>We do not sell your personal information to any third party.</li>
        <li style={s.li}>We do not collect data from children under 13 knowingly.</li>
      </ul>

      {/* 4 */}
      <h2 style={s.h2}>4. Third-Party Services</h2>
      <p style={s.p}>We use the following trusted third-party services. Each processes only the minimum data
      necessary to provide their function:</p>
      <div style={{ overflowX: "auto" }}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Service</th>
              <th style={s.th}>Purpose</th>
              <th style={s.th}>Data Shared</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Razorpay", "Payment processing (website only)", "Name, email, order amount"],
              ["Agora", "Real-time audio/video for live classes & consultations", "Audio/video stream during session"],
              ["Mux", "Video hosting & playback for course lessons and recordings", "Video files, playback metadata"],
              ["Google Cloud / Places", "Birth chart location lookup (Kundli)", "City/place name for geocoding"],
              ["MongoDB Atlas", "Application database", "All account and usage data"],
              ["Expo (EAS)", "App distribution & over-the-air updates", "Device platform, update channel"],
            ].map(([svc, purpose, data]) => (
              <tr key={svc}>
                <td style={{ ...s.td, fontWeight: 600, color: "#e2e8f0" }}>{svc}</td>
                <td style={s.td}>{purpose}</td>
                <td style={{ ...s.td, color: "#64748b", fontSize: 13 }}>{data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5 */}
      <h2 style={s.h2}>5. Data Sharing</h2>
      <p style={s.p}>We do not sell, rent, or trade your personal information. We share data only:</p>
      <ul style={s.ul}>
        <li style={s.li}>With the third-party service providers listed above, strictly to operate the Platform.</li>
        <li style={s.li}>With law enforcement, regulators, or courts when required by applicable law.</li>
        <li style={s.li}>In connection with a merger or acquisition, in which case the acquiring entity will be
        bound by this Privacy Policy.</li>
      </ul>

      {/* 6 */}
      <h2 style={s.h2}>6. Data Retention</h2>
      <p style={s.p}>
        We retain your account and usage data for as long as your account is active. Live class recordings
        are retained to allow enrolled students to revisit sessions. You may request deletion of your
        account and all associated data at any time — see Section 8 below.
      </p>

      {/* 7 */}
      <h2 style={s.h2}>7. Data Security</h2>
      <p style={s.p}>
        We use HTTPS/TLS for all data in transit and store passwords using bcrypt hashing. Access tokens
        are stored in your device's secure keychain. We implement role-based access controls to limit
        internal access to personal data.
      </p>

      {/* 8 */}
      <h2 style={s.h2}>8. Your Rights and Choices</h2>
      <ul style={s.ul}>
        <li style={s.li}><strong style={{ color: "#f1f5f9" }}>Access & correction:</strong> Update your name, email, or phone number from your Profile page at any time.</li>
        <li style={s.li}><strong style={{ color: "#f1f5f9" }}>Push notifications:</strong> Disable at any time from your device's system settings. Core app features remain fully functional.</li>
        <li style={s.li}><strong style={{ color: "#f1f5f9" }}>Camera & microphone:</strong> Revoke permissions in system settings. You will not be able to join live video sessions without them.</li>
        <li style={s.li}><strong style={{ color: "#f1f5f9" }}>Account deletion:</strong> Email us at <a href="mailto:support@bshhealers.com" style={s.a}>support@bshhealers.com</a> to request permanent deletion of your account and all associated data. We will process the request within 30 days.</li>
      </ul>

      {/* 9 */}
      <h2 style={s.h2}>9. Children's Privacy</h2>
      <p style={s.p}>
        The Platform is not directed at children under the age of 13. We do not knowingly collect
        personal information from children under 13. If you believe we have inadvertently collected
        such information, please contact us immediately at{" "}
        <a href="mailto:support@bshhealers.com" style={s.a}>support@bshhealers.com</a> and we will
        delete it promptly.
      </p>

      {/* 10 */}
      <h2 style={s.h2}>10. International Users</h2>
      <p style={s.p}>
        BSH Healers is operated from India. If you access the Platform from outside India, your
        information may be transferred to and processed in India. By using the Platform, you consent
        to this transfer.
      </p>

      {/* 11 */}
      <h2 style={s.h2}>11. Changes to This Policy</h2>
      <p style={s.p}>
        We may update this Privacy Policy from time to time. When we do, we will revise the
        "Last updated" date at the top of this page. Continued use of the Platform after changes
        are posted constitutes your acceptance of the revised policy.
      </p>

      {/* 12 */}
      <h2 style={s.h2}>12. Contact Us</h2>
      <p style={s.p}>
        For any privacy-related questions, data requests, or complaints, contact us at:
      </p>
      <div style={{ background: "#0f1420", border: "1px solid #1e2d45", borderRadius: 10, padding: "18px 20px", marginTop: 8 }}>
        <p style={{ margin: 0, color: "#f1f5f9", fontWeight: 700 }}>Blessings School of Hypnosis</p>
        <p style={{ margin: "4px 0 0", color: "#94a3b8" }}>
          Email: <a href="mailto:support@bshhealers.com" style={s.a}>support@bshhealers.com</a><br />
          Website: <a href="https://bshhealers.com" style={s.a}>bshhealers.com</a>
        </p>
      </div>
    </div>
  </div>
);

export default PrivacyPolicyPage;
