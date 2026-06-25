import { useState } from "react";
import { 
  HealthVaultHeader, 
  RecordCategories, 
  RecordCards, 
  InsightsPanel, 
  ShareSection, 
  QuickActions, 
  MissingDocuments, 
  RecordsFooterBanner 
} from "../components/Records/RecordsComponents";

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
