import logoHeart from "@/assets/logo-heart.png";

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
