import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthLayout } from "./layouts/AuthLayout";
import { AppLayout } from "./layouts/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { DemoRequestPage } from "./pages/DemoRequestPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { Dashboard } from "./pages/Dashboard";
import { SavedCalculationsPage } from "./pages/SavedCalculationsPage";
import { AccountLayout } from "./account/AccountLayout";
import { AccountProfilePage } from "./account/AccountProfilePage";
import { AccountLicensePage } from "./account/AccountLicensePage";
import { AccountSecurityPage } from "./account/AccountSecurityPage";
import { AccountSettingsPage } from "./account/AccountSettingsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SupportPage } from "./pages/SupportPage";
import { AdminLayout } from "./admin/AdminLayout";
import { AdminDashboardPage } from "./admin/pages/AdminDashboardPage";
import { AdminUsersPage } from "./admin/pages/AdminUsersPage";
import { AdminNewUserPage } from "./admin/pages/AdminNewUserPage";
import { AdminUserDetailPage } from "./admin/pages/AdminUserDetailPage";
import { AdminSubscriptionsPage } from "./admin/pages/AdminSubscriptionsPage";
import { AdminUsageAnalyticsPage } from "./admin/pages/AdminUsageAnalyticsPage";
import { AdminCalculationAnalyticsPage } from "./admin/pages/AdminCalculationAnalyticsPage";
import { AdminSessionsAnalyticsPage } from "./admin/pages/AdminSessionsAnalyticsPage";
import { AdminGeoAnalyticsPage } from "./admin/pages/AdminGeoAnalyticsPage";
import { AdminAuditPage } from "./admin/pages/AdminAuditPage";
import { AdminNotificationsPage } from "./admin/pages/AdminNotificationsPage";
import { AdminSupportPage } from "./admin/pages/AdminSupportPage";
import { AdminSupportDetailPage } from "./admin/pages/AdminSupportDetailPage";
import { AdminPricingSurveyPage } from "./admin/pages/AdminPricingSurveyPage";
import { AdminSalesSettingsPage } from "./admin/pages/AdminSalesSettingsPage";
import { AdminDemoRequestsPage } from "./admin/pages/AdminDemoRequestsPage";
import { ThemeProvider } from "./theme/ThemeProvider";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/demo" element={<DemoRequestPage />} />
            <Route path="/sifre-sifirla" element={<ResetPasswordPage />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="users/new" element={<AdminNewUserPage />} />
            <Route path="demo-requests" element={<AdminDemoRequestsPage />} />
            <Route path="users/:id" element={<AdminUserDetailPage />} />
            <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
            <Route path="analytics/usage" element={<AdminUsageAnalyticsPage />} />
            <Route path="analytics/calculations" element={<AdminCalculationAnalyticsPage />} />
            <Route path="analytics/sessions" element={<AdminSessionsAnalyticsPage />} />
            <Route path="analytics/geo" element={<AdminGeoAnalyticsPage />} />
            <Route path="pricing-survey" element={<AdminPricingSurveyPage />} />
            <Route path="sales-settings" element={<AdminSalesSettingsPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="support" element={<AdminSupportPage />} />
            <Route path="support/:number" element={<AdminSupportDetailPage />} />
            <Route path="audit" element={<AdminAuditPage />} />
          </Route>

          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/kayitli-hesaplamalar" element={<SavedCalculationsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/support/:number" element={<SupportPage />} />
            <Route path="/account" element={<AccountLayout />}>
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<AccountProfilePage />} />
              <Route path="license" element={<AccountLicensePage />} />
              <Route path="security" element={<AccountSecurityPage />} />
              <Route path="settings" element={<AccountSettingsPage />} />
            </Route>
            <Route path="/profil" element={<Navigate to="/account/profile" replace />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
