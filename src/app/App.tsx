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
import { RecordDetailsPage } from "@/pages/RecordDetailsPage";
import { EnvironmentPage } from "@/pages/EnvironmentPage";
import { FamilyPage } from "@/pages/FamilyPage";
import { AccountPage } from "@/pages/AccountPage";
import { MedicationsPage } from "@/pages/MedicationsPage";

import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Protected Routes inside AppShell */}
          <Route path="/" element={<ProtectedRoute><AppShell><HomePage /></AppShell></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><AppShell><AccountPage /></AppShell></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><AppShell><ChatPage /></AppShell></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><AppShell><SearchPage /></AppShell></ProtectedRoute>} />
          <Route path="/hospitals" element={<ProtectedRoute><AppShell><HospitalPage /></AppShell></ProtectedRoute>} />
          <Route path="/nutrition" element={<ProtectedRoute><AppShell><NutritionPage /></AppShell></ProtectedRoute>} />
          <Route path="/schemes" element={<ProtectedRoute><AppShell><SchemesPage /></AppShell></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><AppShell><SettingsPage /></AppShell></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AppShell><AdminDashboardPage /></AppShell></ProtectedRoute>} />
          <Route path="/environment" element={<ProtectedRoute><AppShell><EnvironmentPage /></AppShell></ProtectedRoute>} />
          <Route path="/screening" element={<ProtectedRoute><AppShell><PlaceholderPages page="screening" /></AppShell></ProtectedRoute>} />
          <Route path="/records" element={<ProtectedRoute><AppShell><RecordsPage /></AppShell></ProtectedRoute>} />
          <Route path="/records/:id" element={<ProtectedRoute><AppShell><RecordDetailsPage /></AppShell></ProtectedRoute>} />
          <Route path="/medications" element={<ProtectedRoute><AppShell><MedicationsPage /></AppShell></ProtectedRoute>} />
          <Route path="/resources" element={<ProtectedRoute><AppShell><PlaceholderPages page="resources" /></AppShell></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><AppShell><PlaceholderPages page="alerts" /></AppShell></ProtectedRoute>} />
          <Route path="/family" element={<ProtectedRoute><AppShell><FamilyPage /></AppShell></ProtectedRoute>} />
          <Route path="/disaster" element={<ProtectedRoute><AppShell><PlaceholderPages page="disaster" /></AppShell></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
