import { useState } from "react";
import { Link } from "react-router-dom";
import { useHealthContext } from "@/hooks/useHealthContext";
import { HealthVaultHeader } from "@/features/records/components/HealthVaultHeader";
import { RecordCategories } from "@/features/records/components/RecordCategories";
import { RecordCards } from "@/features/records/components/RecordCards";
import { InsightsPanel } from "@/features/records/components/InsightsPanel";
import { ShareSection } from "@/features/records/components/ShareSection";
import { QuickActions } from "@/features/records/components/QuickActions";
import { MissingDocuments } from "@/features/records/components/MissingDocuments";
import { RecordsFooterBanner } from "@/features/records/components/RecordsFooterBanner";

export function RecordsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const { selectedMember } = useHealthContext();

  if (!selectedMember) {
    return (
      <div className="records-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '40px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
          <h2 style={{ marginBottom: '8px' }}>No family member selected.</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Please select a family member to view their health vault.</p>
          <Link to="/family" style={{ padding: '12px 24px', background: '#0d9488', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 600 }}>
            Return to Family
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="records-page">
      <div className="records-layout">
        <main className="records-main">
          <HealthVaultHeader />
          <RecordCategories activeTab={activeTab} setActiveTab={setActiveTab} />
          <RecordCards search={search} setSearch={setSearch} />
          <RecordsFooterBanner />
        </main>

        <aside className="records-rail">
          <InsightsPanel />
          <ShareSection />
          <QuickActions />
          <MissingDocuments />
        </aside>
      </div>
    </div>
  );
}

export default RecordsPage;
