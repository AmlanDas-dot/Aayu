import { useNavigate } from "react-router-dom";

const FEATURE_CARDS = [
  { icon: "🗂️", title: "My Health Records", desc: "Store vaccination records, prescriptions, reports and important documents.", path: "/chat" },
  { icon: "🩺", title: "Screening & Guidance", desc: "Check your symptoms with our AI Symptom Assessment & Guidance.", path: "/chat" },
  { icon: "🏥", title: "Nearby Healthcare", desc: "Find hospitals, clinics, health centers, camps and more near you.", path: "/search" },
  { icon: "🥦", title: "Nutrition", desc: "Personalised diet plans based on your needs, local foods and budget.", path: "/chat" },
  { icon: "👨‍👩‍👧", title: "Family Health", desc: "Add family members, get alerts and manage health together.", path: "/chat" },
  { icon: "🏛️", title: "Government Schemes", desc: "Explore health schemes, eligibility, benefits and how to apply.", path: "/search" },
];

const HEALTH_ALERTS = [
  { id: "1", title: "Dengue cases rising in some districts", severity: "high", desc: "Stay safe and follow preventive measures. Use mosquito repellents and keep surroundings clean." },
  { id: "2", title: "Seasonal Flu", severity: "medium", desc: "Cases increasing in some areas. Get vaccinated." },
  { id: "3", title: "Heat Wave Advisory", severity: "medium", desc: "Stay hydrated and avoid direct sunlight." },
];

const WHY_AAYU = [
  "Verified medical knowledge from trusted sources",
  "Voice based interaction for everyone",
  "Works offline – your health, always with you",
  "Secure, private and built for communities",
];

const TRUSTED_PARTNERS = [
  { name: "World Health Organization", abbr: "WHO" },
  { name: "Ministry of Health & Family Welfare", abbr: "MoHFW" },
  { name: "ICMR", abbr: "ICMR" },
  { name: "UNICEF", abbr: "UNICEF" },
];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Hero + Alerts Grid */}
      <div className="home-grid">
        {/* Left: Hero + Talk to AAYU */}
        <div className="home-left">
          {/* Hero */}
          <section className="hero-section">
            <div className="hero-text">
              <p className="hero-greeting">Your AI Health Assistant</p>
              <h1 className="hero-headline">
                Information.<br />Guidance. Care.
              </h1>
              <p className="hero-sub">
                Ask anything about your health, symptoms, nutrition, schemes or nearby healthcare
                services — in your language.
              </p>
              <div className="hero-badges">
                <span className="badge">🌐 Multilingual</span>
                <span className="badge">🏥 Offline First</span>
                <span className="badge">✅ Trusted Sources</span>
                <span className="badge">🔒 Privacy Focused</span>
              </div>
            </div>
            <div className="hero-mascot">
              <div className="mascot-avatar">🩺</div>
              <div className="mascot-bubble">Namaste! 🙏<br />How can I help you today?</div>
            </div>
          </section>

          {/* Talk to AAYU */}
          <section className="talk-section">
            <h2 className="section-title">Talk to AAYU</h2>
            <p className="section-sub">Voice, text or images — your health assistant is here to help.</p>
            <div className="talk-input-area">
              <textarea
                className="talk-textarea"
                placeholder="Type your question here..."
                rows={2}
              />
              <div className="talk-actions">
                <button className="talk-btn" onClick={() => navigate("/chat")}>
                  🎙️ <span>Speak</span><small>Tap to speak</small>
                </button>
                <button className="talk-btn" onClick={() => navigate("/chat")}>
                  📷 <span>Scan / Upload</span><small>OCR / Image</small>
                </button>
                <button className="talk-btn" onClick={() => navigate("/chat")}>
                  🔊 <span>Listen</span><small>Text to speech</small>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Health Alerts */}
        <aside className="home-alerts">
          <div className="alerts-header">
            <h3>🚨 Health Alerts</h3>
            <button className="view-all-btn">View All</button>
          </div>
          {HEALTH_ALERTS.map((alert) => (
            <div key={alert.id} className={`alert-card alert-${alert.severity}`}>
              <div className="alert-badge">{alert.severity === "high" ? "HIGH ALERT" : "ADVISORY"}</div>
              <h4 className="alert-title">{alert.title}</h4>
              <p className="alert-desc">{alert.desc}</p>
              <button className="alert-link">See Advisories →</button>
            </div>
          ))}

          <div className="stay-healthy-box">
            <h4>🌟 Stay Alive, Stay Healthy!</h4>
            <p>Real-time updates on diseases & important health news.</p>
            <button className="view-updates-btn">View All Updates →</button>
          </div>
        </aside>
      </div>

      {/* Feature Cards */}
      <section className="features-section">
        <h2 className="section-title">Start Here — What Would You Like To Do?</h2>
        <div className="features-grid">
          {FEATURE_CARDS.map((card) => (
            <button key={card.title} className="feature-card" onClick={() => navigate(card.path)}>
              <span className="feature-icon">{card.icon}</span>
              <h3 className="feature-title">{card.title}</h3>
              <p className="feature-desc">{card.desc}</p>
              <span className="feature-arrow">→</span>
            </button>
          ))}
        </div>
      </section>

      {/* Why AAYU + Trusted Partners */}
      <div className="why-partners-grid">
        <section className="why-section">
          <h2 className="section-title">Why AAYU?</h2>
          <ul className="why-list">
            {WHY_AAYU.map((item) => (
              <li key={item} className="why-item">
                <span className="why-check">✅</span> {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="partners-section">
          <h2 className="section-title">Trusted Partners</h2>
          <div className="partners-grid">
            {TRUSTED_PARTNERS.map((p) => (
              <div key={p.abbr} className="partner-badge">
                <span className="partner-abbr">{p.abbr}</span>
                <span className="partner-name">{p.name}</span>
              </div>
            ))}
          </div>
          <button className="view-all-btn">View all partners →</button>
        </section>
      </div>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-left">
          <span className="brand-name-footer">🌿 AAYU</span>
          <p>AI-Powered Public Health Assistant</p>
        </div>
        <div className="footer-center">
          <p>Your Health. Your Data. Your Control.</p>
          <div className="footer-badges">
            <span>🔒 Secure & Private</span>
            <span>📍 You Stay In Control</span>
            <span>🩺 Guidance, Not Diagnosis</span>
            <span>👨‍⚕️ Consult Professionals</span>
          </div>
        </div>
        <div className="footer-links">
          <a href="#">Disclaimer</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Use</a>
          <a href="#">Help</a>
          <a href="#">Contact Us</a>
        </div>
      </footer>
    </div>
  );
}
