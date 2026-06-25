import { useState } from "react";
import { type GovernmentScheme } from "../../services/api";
import heroFamilyImg from "../../assets/hero-family.png";
import nurseImg from "../../assets/nurse-phone.png";
import logoHeart from "../../assets/logo-heart.png";
import { 
  ShieldCheck, Baby, Apple, User, Activity, Sparkles, 
  FileText, CreditCard, FileCheck, MapPin, Image as ImageIcon
} from "lucide-react";

export function SchemesHero() {
  return (
    <section className="schemes-hero">
      <div className="schemes-hero-text">
        <h1 className="schemes-hero-title">Government Schemes,<br />Better Health for All</h1>
        <p className="schemes-hero-sub">
          Find and access health & nutrition schemes you are eligible for. Simplified. Guided. Empowering.
        </p>
        <button className="schemes-explore-btn">Explore Schemes</button>
      </div>
      <div className="schemes-hero-img">
        <img src={heroFamilyImg} alt="Family at Health Centre" className="schemes-family-img" />
      </div>
    </section>
  );
}

export function SchemeCard({ scheme }: { scheme: GovernmentScheme }) {
  const [expanded, setExpanded] = useState(false);
  const isNational = scheme.state === "National";

  return (
    <div className="scheme-result-card" onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(13,148,136,0.14)"} onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = ""}>
      <div className="scheme-card-top">
        <div className="scheme-card-title-row">
          <h3 className="scheme-card-name">{scheme.name}</h3>
          <span className={`scheme-state-badge ${isNational ? "badge-national" : "badge-state"}`}>{scheme.state}</span>
        </div>
        <button className="scheme-expand-btn" onClick={() => setExpanded(e => !e)}>{expanded ? "▲ Less" : "▼ More"}</button>
      </div>
      <p className="scheme-card-desc">{scheme.description}</p>
      <div className="scheme-card-grid">
        <div className="scheme-info-box scheme-info-green">
          <p className="info-box-label">BENEFITS</p>
          <p className="info-box-text">{scheme.benefits.slice(0, 120)}{scheme.benefits.length > 120 ? "…" : ""}</p>
        </div>
        <div className="scheme-info-box scheme-info-purple">
          <p className="info-box-label">ELIGIBILITY</p>
          <p className="info-box-text">{scheme.eligibility.slice(0, 120)}{scheme.eligibility.length > 120 ? "…" : ""}</p>
        </div>
      </div>
      {expanded && scheme.documents_required?.length > 0 && (
        <div className="scheme-info-box scheme-info-yellow" style={{ marginTop: 8 }}>
          <p className="info-box-label">DOCUMENTS REQUIRED</p>
          <ul className="scheme-docs-list">{scheme.documents_required.map((d) => <li key={d}>{d}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

const TOP_SCHEMES_STATIC = [
  {
    icon: ShieldCheck, name: "Ayushman Bharat PM-JAY", desc: "Free health cover up to ₹5 lakh per family",
    tag: "Health Insurance", who: "Families (All age groups)", tagColor: "#10b981", tagBg: "rgba(16,185,129,0.12)",
  },
  {
    icon: Baby, name: "Pradhan Mantri Matru Vandana Yojana", desc: "₹5,000 benefit for pregnant women",
    tag: "Maternity Benefit", who: "Pregnant Women", tagColor: "#f59e0b", tagBg: "rgba(245,158,11,0.12)",
  },
];

export function TopSchemes() {
  return (
    <section className="top-schemes-section">
      <div className="section-row">
        <div>
          <h2 className="section-heading">Top Schemes for You</h2>
          <p className="section-sub">Based on your profile and location</p>
        </div>
        <button className="view-all-link">View all Schemes →</button>
      </div>
      <div className="top-schemes-grid">
        {TOP_SCHEMES_STATIC.map((s) => {
          const IconComponent = s.icon;
          return (
            <div key={s.name} className="top-scheme-card">
              <div className="ts-icon-wrap" style={{ color: s.tagColor, background: s.tagBg }}>
                <IconComponent size={24} />
              </div>
              <h3 className="ts-name">{s.name}</h3>
              <p className="ts-desc">{s.desc}</p>
              <span className="ts-tag" style={{ color: s.tagColor, background: s.tagBg }}>{s.tag}</span>
              <div className="ts-who-box">
                <span className="ts-who-label">WHO CAN APPLY?</span>
                <p className="ts-who-text">{s.who}</p>
              </div>
              <button className="ts-apply-btn">Apply Now →</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const CATEGORIES = [
  { icon: ShieldCheck, label: "Health Insurance", desc: "Schemes for financial protection", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  { icon: Baby, label: "Maternity & Child", desc: "Benefits for mothers and children", color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  { icon: Apple, label: "Nutrition Support", desc: "Food & nutrition assistance", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  { icon: User, label: "Senior Citizen", desc: "Support for elderly citizens", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  { icon: Activity, label: "Disability Support", desc: "Schemes for specially abled persons", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  { icon: Sparkles, label: "More", desc: "View more schemes", color: "#7c3aed", bg: "rgba(124,58,237,0.12)" },
];

export function SchemeCategoryGrid() {
  return (
    <section className="categories-section">
      <h2 className="section-heading">Explore by Category</h2>
      <p className="section-sub">Browse schemes by your needs</p>
      <div className="categories-grid">
        {CATEGORIES.map(c => {
          const IconComponent = c.icon;
          return (
            <div key={c.label} className="category-card">
              <div className="cat-icon-wrap" style={{ color: c.color, background: c.bg }}>
                <IconComponent size={24} />
              </div>
              <div className="cat-label">{c.label}</div>
              <p className="cat-desc">{c.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const DOCUMENTS = [
  { icon: FileText, title: "Aadhaar Card", sub: "Identity Proof" },
  { icon: CreditCard, title: "Bank Passbook", sub: "Bank Details" },
  { icon: FileCheck, title: "Income Certificate", sub: "(If applicable)" },
  { icon: MapPin, title: "Address Proof", sub: "Residence Proof" },
  { icon: ImageIcon, title: "Photo", sub: "Passport Size" },
];

export function DocumentsRequired() {
  return (
    <section className="documents-section">
      <h2 className="section-heading">Documents You May Need</h2>
      <p className="section-sub">Keep these documents handy to apply for most schemes</p>
      <div className="docs-grid">
        {DOCUMENTS.map(d => {
          const IconComponent = d.icon;
          return (
            <div key={d.title} className="doc-item-card">
              <div className="doc-item-icon-wrap">
                <IconComponent size={24} />
              </div>
              <div className="doc-item-title">{d.title}</div>
              <div className="doc-item-sub">{d.sub}</div>
            </div>
          );
        })}
      </div>
      <div className="doc-tip">
        💡 <strong>Tip:</strong> Keep scanned or clear photos of documents ready for faster application.
      </div>
    </section>
  );
}

export function ProfileFinder({
  ageGroup, setAgeGroup, gender, setGender, state, setState, district, setDistrict
}: any) {
  return (
    <div className="rail-card">
      <div className="rail-title">Find Schemes for You</div>
      <p className="rail-sub">Tell us about yourself</p>
      <div className="find-scheme-fields">
        {[
          { label: "Age Group", val: ageGroup, setter: setAgeGroup },
          { label: "Gender", val: gender, setter: setGender },
          { label: "State", val: state, setter: setState },
          { label: "District", val: district, setter: setDistrict },
        ].map(({ label, val, setter }) => (
          <label key={label} className="find-scheme-label">
            <span className="fsl-text">{label}</span>
            <select className="fsl-select" value={val} onChange={e => setter(e.target.value)}>
              <option value="">Select</option>
              {label === "Age Group" && ["0-5 years", "6-18 years", "19-45 years", "45+ years"].map(o => <option key={o}>{o}</option>)}
              {label === "Gender" && ["Male", "Female", "Other"].map(o => <option key={o}>{o}</option>)}
              {label === "State" && ["Odisha", "Maharashtra", "Gujarat", "Tamil Nadu"].map(o => <option key={o}>{o}</option>)}
              {label === "District" && ["District 1", "District 2", "District 3"].map(o => <option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
      </div>
      <button className="show-my-schemes-btn">Show My Schemes</button>
    </div>
  );
}

const SCHEME_ALERTS = [
  { name: "PM Matru Vandana Yojana", desc: "New updated increase in benefit amount.", color: "#f59e0b", badge: "New" },
  { name: "Ayushman Bharat Yojana", desc: "Free treatment cover up to ₹5 lakh per family.", color: "#0d9488", badge: "New" },
];

export function SchemeAlerts() {
  return (
    <div className="rail-card">
      <div className="rail-title">Scheme Alerts</div>
      <div className="scheme-alerts-list">
        {SCHEME_ALERTS.map((a, i) => (
          <div key={a.name} className={`scheme-alert-item ${i < SCHEME_ALERTS.length - 1 ? "alert-item-border" : ""}`}>
            <span className="sal-icon" style={{ color: a.color }}>🔔</span>
            <div className="sal-text">
              <div className="sal-name-row">
                <span className="sal-name">{a.name}</span>
                {a.badge && <span className="sal-badge">{a.badge}</span>}
              </div>
              <p className="sal-desc">{a.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="rail-link">View All Alerts →</button>
    </div>
  );
}

export function SchemesFooterBanner() {
  return (
    <footer className="home-footer">
      <div className="footer-brand">
        <img src={logoHeart} alt="AAYU" className="footer-logo-img-main" />
        <div>
          <div className="footer-brand-name">AAYU</div>
          <div className="footer-brand-sub">AI-Powered<br />Public Health Assistant</div>
        </div>
      </div>
      <div className="footer-center">
        <p className="footer-tagline">Your Health. Your Data. Your Control.</p>
        <p className="footer-sub">Secure. Private. Built for everyone.</p>
        <div className="footer-badges-row">
          <span>Secure &amp; Private</span>
          <span>You Stay In Control</span>
          <span>Guidance, Not Diagnosis</span>
          <span>Consult Professionals</span>
        </div>
      </div>
    </footer>
  );
}

export function SchemeNeedHelp() {
  return (
    <div className="rail-help-card">
      <div className="rhc-inner">
        <div className="rhc-content">
          <div className="rhc-title">Need Help Applying?</div>
          <p className="rhc-desc">Our AI Assistant can guide you step-by-step to apply for any scheme.</p>
          <button className="rhc-btn">
            Ask Assistant
          </button>
        </div>
        <div className="rhc-img-wrap">
          <img src={nurseImg} alt="Help" className="rhc-nurse-img" />
        </div>
      </div>
    </div>
  );
}
