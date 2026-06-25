// Placeholder pages for sidebar routes that are planned but not yet implemented

const PAGE_CONFIG: Record<string, { icon: string; title: string; desc: string; features: string[] }> = {
  screening: {
    icon: "🩺",
    title: "AI Screening & Guidance",
    desc: "Answer simple questions about your symptoms to get possible health insights and guidance on the right next steps.",
    features: [
      "Answer easy questions about your symptoms",
      "Get possible health risk insights",
      "Receive guidance and preventive list",
      "Consult a healthcare professional for confirmation",
    ],
  },
  records: {
    icon: "🗂️",
    title: "My Health Records",
    desc: "Securely store, manage and access all your health records in one place — prescriptions, reports, vaccination history.",
    features: [
      "Store prescriptions and lab reports",
      "Vaccination history tracking",
      "Share records with your doctor",
      "Works offline — always available",
    ],
  },
  resources: {
    icon: "📚",
    title: "Health Resources & Education",
    desc: "Browse verified health articles, videos, and guides curated from WHO, ICMR and Ministry of Health.",
    features: [
      "Verified articles from trusted sources",
      "Videos and visual guides",
      "Disease prevention tips",
      "Community health programs",
    ],
  },
  alerts: {
    icon: "🔔",
    title: "Alerts & Health Updates",
    desc: "Stay informed with real-time local health alerts, outbreak notifications, and important health news in your area.",
    features: [
      "Local disease outbreak alerts",
      "Seasonal health advisories",
      "Vaccination camp announcements",
      "Emergency health notices",
    ],
  },
  family: {
    icon: "👨‍👩‍👧",
    title: "Family & Sharing",
    desc: "Manage health profiles for all your family members and share records securely with caregivers or doctors.",
    features: [
      "Add family member profiles",
      "Share health history securely",
      "Get alerts for family health",
      "Track child growth milestones",
    ],
  },
  disaster: {
    icon: "⚠️",
    title: "Disaster Aid & Emergency",
    desc: "Access emergency health guidance, first aid instructions and connect with relief services during disasters.",
    features: [
      "First aid step-by-step guides",
      "Emergency contacts directory",
      "Nearest relief centre locator",
      "Offline-ready emergency protocols",
    ],
  },
};

export function PlaceholderPages({ page }: { page: string }) {
  const config = PAGE_CONFIG[page] ?? {
    icon: "🏥",
    title: "Coming Soon",
    desc: "This section is being built. Check back soon!",
    features: [],
  };

  return (
    <div className="placeholder-page">
      <div className="placeholder-hero">
        <div className="placeholder-icon-wrap">
          <span className="placeholder-big-icon">{config.icon}</span>
        </div>
        <div className="placeholder-text">
          <span className="placeholder-badge">Coming Soon</span>
          <h1 className="placeholder-title">{config.title}</h1>
          <p className="placeholder-desc">{config.desc}</p>
        </div>
      </div>

      {config.features.length > 0 && (
        <div className="placeholder-features">
          <h3 className="placeholder-features-title">What you'll be able to do:</h3>
          <div className="placeholder-features-grid">
            {config.features.map((f, i) => (
              <div key={i} className="placeholder-feature-card">
                <span className="placeholder-check">✅</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="placeholder-cta">
        <div className="placeholder-cta-card">
          <span className="cta-wa-icon">💬</span>
          <div>
            <div className="cta-title">In the meantime, ask AAYU on WhatsApp</div>
            <p className="cta-desc">Get help with any health questions right now.</p>
          </div>
          <button className="cta-btn">Chat Now →</button>
        </div>
      </div>
    </div>
  );
}
