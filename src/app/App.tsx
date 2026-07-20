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
import { DoctorDashboardPage } from "@/pages/DoctorDashboardPage";
import { AshaDashboardPage } from "@/pages/AshaDashboardPage";
import { ScreeningPage } from "@/pages/ScreeningPage";
import { DisasterAidPage } from "@/pages/DisasterAidPage";
import { RecordsPage } from "@/pages/RecordsPage";
import { RecoveryPage } from "@/pages/RecoveryPage";
import { RecordDetailsPage } from "@/pages/RecordDetailsPage";
import { EnvironmentPage } from "@/pages/EnvironmentPage";
import { FamilyPage } from "@/pages/FamilyPage";
import { AlertsPage } from "@/pages/AlertsPage";
import { AccountPage } from "@/pages/AccountPage";
import { MedicationsPage } from "@/pages/MedicationsPage";

import { AuthProvider } from "@/contexts/AuthContext";
import { CommunityTwinProvider } from "@/contexts/CommunityTwinContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { PERMISSION } from "@/rbac/permissions";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CommunityTwinProvider>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Protected Routes inside AppShell */}
          <Route path="/" element={<ProtectedRoute requiredPermission={PERMISSION.DASHBOARD_PERSONAL_VIEW}><AppShell><HomePage /></AppShell></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute requiredPermission={PERMISSION.DASHBOARD_PERSONAL_VIEW}><AppShell><AccountPage /></AppShell></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute requiredPermission={PERMISSION.ASSISTANT_USE}><AppShell><ChatPage /></AppShell></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute requiredPermission={PERMISSION.ASSISTANT_USE}><AppShell><SearchPage /></AppShell></ProtectedRoute>} />
          <Route path="/hospitals" element={<ProtectedRoute requiredPermission={PERMISSION.HOSPITALS_NEARBY}><AppShell><HospitalPage /></AppShell></ProtectedRoute>} />
          <Route path="/nutrition" element={<ProtectedRoute requiredPermission={PERMISSION.ASSISTANT_USE}><AppShell><NutritionPage /></AppShell></ProtectedRoute>} />
          <Route path="/schemes" element={<ProtectedRoute requiredPermission={PERMISSION.ASSISTANT_USE}><AppShell><SchemesPage /></AppShell></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute requiredPermission={PERMISSION.DASHBOARD_PERSONAL_VIEW}><AppShell><SettingsPage /></AppShell></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requiredPermission={PERMISSION.DASHBOARD_ADMIN_VIEW}><AppShell><AdminDashboardPage /></AppShell></ProtectedRoute>} />
          <Route path="/asha" element={<ProtectedRoute requiredPermission={PERMISSION.DASHBOARD_ASHA_VIEW}><AppShell><AshaDashboardPage /></AppShell></ProtectedRoute>} />
          <Route path="/doctor" element={<ProtectedRoute requiredPermission={PERMISSION.DASHBOARD_DOCTOR_VIEW}><AppShell><DoctorDashboardPage /></AppShell></ProtectedRoute>} />
          <Route path="/environment" element={<ProtectedRoute requiredPermission={PERMISSION.ENVIRONMENT_VIEW}><AppShell><EnvironmentPage /></AppShell></ProtectedRoute>} />
          <Route path="/screening" element={<ProtectedRoute requiredPermission={PERMISSION.ASSISTANT_USE}><AppShell><ScreeningPage /></AppShell></ProtectedRoute>} />
          <Route path="/records" element={<ProtectedRoute requiredPermission={PERMISSION.RECORDS_READ}><AppShell><RecordsPage /></AppShell></ProtectedRoute>} />
          <Route path="/records/:id" element={<ProtectedRoute requiredPermission={PERMISSION.RECORDS_READ}><AppShell><RecordDetailsPage /></AppShell></ProtectedRoute>} />
          <Route path="/medications" element={<ProtectedRoute requiredPermission={PERMISSION.MEDICATIONS_MANAGE}><AppShell><MedicationsPage /></AppShell></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute requiredPermission={PERMISSION.EMERGENCY_USE}><AppShell><AlertsPage /></AppShell></ProtectedRoute>} />
          <Route path="/family" element={<ProtectedRoute requiredPermission={PERMISSION.FAMILY_MANAGE}><AppShell><FamilyPage /></AppShell></ProtectedRoute>} />
          <Route path="/disaster" element={<ProtectedRoute requiredPermission={PERMISSION.EMERGENCY_USE}><AppShell><DisasterAidPage /></AppShell></ProtectedRoute>} />
          <Route path="/recovery" element={<ProtectedRoute requiredPermission={PERMISSION.DASHBOARD_PERSONAL_VIEW}><AppShell><RecoveryPage /></AppShell></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute requiredPermission={PERMISSION.DASHBOARD_PERSONAL_VIEW}><AppShell><AlertsPage /></AppShell></ProtectedRoute>} />
        </Routes>
        </CommunityTwinProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
