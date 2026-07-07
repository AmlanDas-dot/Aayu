import doctorImg from "@/assets/doctor-leaves.png";

export function NutritionHero() {
  return (
    <section className="nutrition-hero">
      <div className="nutrition-hero-text">
        <h1 className="nutrition-hero-title">Your Nutrition Assistant</h1>
        <p className="nutrition-hero-sub">
          Personalized nutrition guidance based on your app, health conditions, local availability and affordability.
        </p>
        <div className="nutrition-badges">
          <span className="n-badge">📍 Local & Seasonal</span>
          <span className="n-badge">💰 Affordable Options</span>
          <span className="n-badge">🩺 Personalized for You</span>
          <span className="n-badge">⚖️ Backed by Science</span>
        </div>
        <button className="nutrition-ask-btn">💬 Ask Nutrition Assistant</button>
      </div>
      <div className="nutrition-hero-img">
        <img src={doctorImg} alt="Nutrition Assistant" className="nutrition-doc-img" />
      </div>
    </section>
  );
}
