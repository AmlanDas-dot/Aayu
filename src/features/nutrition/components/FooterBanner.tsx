import doctorImg from "@/assets/doctor-leaves.png";

export function FooterBanner() {
  return (
    <section className="nutrition-wa-banner">
      <div className="wa-banner-text">
        <h3 className="wa-banner-title">Need personalized diet tips or have questions?</h3>
        <p className="wa-banner-sub">Chat with AAYU on WhatsApp for simple, practical nutrition guidance.</p>
        <button className="wa-banner-btn">💬 Chat on WhatsApp</button>
      </div>
      <div className="wa-banner-art">
        <img src={doctorImg} alt="Nutrition Help" className="wa-banner-doc" />
      </div>
    </section>
  );
}
