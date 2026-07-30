import heroFamilyImg from "@/assets/hero-family.png";

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
        <img src={heroFamilyImg} alt="Family at Health Centre" className="schemes-family-img" fetchPriority="high" />
      </div>
    </section>
  );
}
