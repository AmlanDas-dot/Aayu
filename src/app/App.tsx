import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/app/AppShell";

const HomePage = lazy(() => import("@/pages/HomePage").then(m => ({ default: m.HomePage })));
const ChatPage = lazy(() => import("@/pages/ChatPage").then(m => ({ default: m.ChatPage })));
const SettingsPage = lazy(() => import("@/pages/SettingsPage").then(m => ({ default: m.SettingsPage })));
const HospitalPage = lazy(() => import("@/pages/HospitalPage").then(m => ({ default: m.HospitalPage })));
const AdminDashboardPage = lazy(() => import("@/pages/AdminDashboardPage").then(m => ({ default: m.AdminDashboardPage })));
const DoctorDashboardPage = lazy(() => import("@/pages/DoctorDashboardPage").then(m => ({ default: m.DoctorDashboardPage })));
const AshaDashboardPage = lazy(() => import("@/pages/AshaDashboardPage").then(m => ({ default: m.AshaDashboardPage })));
const RecordsPage = lazy(() => import("@/pages/RecordsPage").then(m => ({ default: m.RecordsPage })));
const RecordDetailsPage = lazy(() => import("@/pages/RecordDetailsPage").then(m => ({ default: m.RecordDetailsPage })));
const EnvironmentPage = lazy(() => import("@/pages/EnvironmentPage").then(m => ({ default: m.EnvironmentPage })));
const AlertsPage = lazy(() => import("@/pages/AlertsPage").then(m => ({ default: m.AlertsPage })));
const AccountPage = lazy(() => import("@/pages/AccountPage").then(m => ({ default: m.AccountPage })));
const MedicationsPage = lazy(() => import("@/pages/MedicationsPage").then(m => ({ default: m.MedicationsPage })));
const LoginPage = lazy(() => import("@/pages/LoginPage").then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import("@/pages/SignupPage").then(m => ({ default: m.SignupPage })));

import { AuthProvider } from "@/contexts/AuthContext";
import { CommunityTwinProvider } from "@/contexts/CommunityTwinContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PERMISSION } from "@/rbac/permissions";
import { LoadingState } from "@/components/ui/LoadingState";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CommunityTwinProvider>
          <Suspense fallback={<LoadingState message="Loading application..." />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              
              {/* Protected Routes inside AppShell */}
              <Route path="/" element={<ProtectedRoute requiredPermission={PERMISSION.DASHBOARD_PERSONAL_VIEW}><AppShell><HomePage /></AppShell></ProtectedRoute>} />
              <Route path="/account" element={<ProtectedRoute requiredPermission={PERMISSION.DASHBOARD_PERSONAL_VIEW}><AppShell><AccountPage /></AppShell></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute requiredPermission={PERMISSION.ASSISTANT_USE}><AppShell><ChatPage /></AppShell></ProtectedRoute>} />
              <Route path="/hospitals" element={<ProtectedRoute requiredPermission={PERMISSION.HOSPITALS_NEARBY}><AppShell><HospitalPage /></AppShell></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute requiredPermission={PERMISSION.DASHBOARD_PERSONAL_VIEW}><AppShell><SettingsPage /></AppShell></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requiredPermission={PERMISSION.DASHBOARD_ADMIN_VIEW}><AppShell><AdminDashboardPage /></AppShell></ProtectedRoute>} />
              <Route path="/asha" element={<ProtectedRoute requiredPermission={PERMISSION.DASHBOARD_ASHA_VIEW}><AppShell><AshaDashboardPage /></AppShell></ProtectedRoute>} />
              <Route path="/doctor" element={<ProtectedRoute requiredPermission={PERMISSION.DASHBOARD_DOCTOR_VIEW}><AppShell><DoctorDashboardPage /></AppShell></ProtectedRoute>} />
              <Route path="/environment" element={<ProtectedRoute requiredPermission={PERMISSION.ENVIRONMENT_VIEW}><AppShell><EnvironmentPage /></AppShell></ProtectedRoute>} />
              <Route path="/records" element={<ProtectedRoute requiredPermission={PERMISSION.RECORDS_READ}><AppShell><RecordsPage /></AppShell></ProtectedRoute>} />
              <Route path="/records/:id" element={<ProtectedRoute requiredPermission={PERMISSION.RECORDS_READ}><AppShell><RecordDetailsPage /></AppShell></ProtectedRoute>} />
              <Route path="/medications" element={<ProtectedRoute requiredPermission={PERMISSION.MEDICATIONS_MANAGE}><AppShell><MedicationsPage /></AppShell></ProtectedRoute>} />
              <Route path="/alerts" element={<ProtectedRoute requiredPermission={PERMISSION.EMERGENCY_USE}><AppShell><AlertsPage /></AppShell></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </CommunityTwinProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
