import { useState } from "react";
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
