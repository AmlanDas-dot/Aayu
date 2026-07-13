import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/app/AppShell";
import { HomePage } from "@/pages/HomePage";
import { ChatPage } from "@/pages/ChatPage";
import { SearchPage } from "@/pages/SearchPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { NutritionPage } from "@/pages/NutritionPage";
import { SchemesPage } from "@/pages/SchemesPage";
import { HospitalPage } from "@/pages/HospitalPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { PlaceholderPages } from "@/pages/PlaceholderPages";
import { RecordsPage } from "@/pages/RecordsPage";
import { EnvironmentPage } from "@/pages/EnvironmentPage";
import { FamilyPage } from "@/pages/FamilyPage";

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/hospitals" element={<HospitalPage />} />
          <Route path="/nutrition" element={<NutritionPage />} />
          <Route path="/schemes" element={<SchemesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/environment" element={<EnvironmentPage />} />
          <Route path="/screening" element={<PlaceholderPages page="screening" />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/resources" element={<PlaceholderPages page="resources" />} />
          <Route path="/alerts" element={<PlaceholderPages page="alerts" />} />
          <Route path="/family" element={<FamilyPage />} />
          <Route path="/disaster" element={<PlaceholderPages page="disaster" />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
