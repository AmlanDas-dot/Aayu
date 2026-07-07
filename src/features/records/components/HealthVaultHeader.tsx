import { UploadButtons } from "./UploadButtons";
import heroFamilyImg from "@/assets/reports.png";

export function HealthVaultHeader() {
  return (
    <section className="records-hero">
      <div className="records-hero-text">
        <h1 className="records-hero-title">My Health Records</h1>
        <p className="records-hero-sub">
          Securely store, manage and access all your health records in one place.
        </p>
        <UploadButtons />
      </div>
      <div className="records-hero-img">
        <img src={heroFamilyImg} alt="Family Health" className="records-family-img" />
      </div>
    </section>
  );
}
