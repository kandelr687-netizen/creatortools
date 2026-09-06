import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestRoute, ProtectedRoute, AdminRoute } from '@/hooks/RouteGuards'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { PageLoader } from '@/components/ui/loading'

// Public
const LandingPage = lazy(() => import('@/pages/public/LandingPage').then((m) => ({ default: m.LandingPage })))
// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })))
const AdminLoginPage = lazy(() => import('@/pages/auth/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })))

// Customer
const CustomerDashboardPage = lazy(() => import('@/pages/customer/DashboardPage').then((m) => ({ default: m.CustomerDashboardPage })))
const SubmitContentPage = lazy(() => import('@/pages/customer/SubmitContentPage').then((m) => ({ default: m.SubmitContentPage })))
const SubmissionsPage = lazy(() => import('@/pages/customer/SubmissionsPage').then((m) => ({ default: m.SubmissionsPage })))
const SubmissionDetailPage = lazy(() => import('@/pages/customer/SubmissionDetailPage').then((m) => ({ default: m.SubmissionDetailPage })))
const PointsPage = lazy(() => import('@/pages/customer/PointsPage').then((m) => ({ default: m.PointsPage })))
const WithdrawPage = lazy(() => import('@/pages/customer/WithdrawPage').then((m) => ({ default: m.WithdrawPage })))
const WithdrawalHistoryPage = lazy(() => import('@/pages/customer/WithdrawalHistoryPage').then((m) => ({ default: m.WithdrawalHistoryPage })))
const NotificationsPage = lazy(() => import('@/pages/customer/NotificationsPage').then((m) => ({ default: m.NotificationsPage })))
const ProfilePage = lazy(() => import('@/pages/customer/ProfilePage').then((m) => ({ default: m.ProfilePage })))

// Admin
const AdminDashboardPage = lazy(() => import('@/pages/admin/DashboardPage').then((m) => ({ default: m.AdminDashboardPage })))
const AdminSubmissionsPage = lazy(() => import('@/pages/admin/SubmissionsPage').then((m) => ({ default: m.AdminSubmissionsPage })))
const AdminUsersPage = lazy(() => import('@/pages/admin/UsersPage').then((m) => ({ default: m.AdminUsersPage })))
const AdminCategoriesPage = lazy(() => import('@/pages/admin/CategoriesPage').then((m) => ({ default: m.AdminCategoriesPage })))
const AdminCampaignsPage = lazy(() => import('@/pages/admin/CampaignsPage').then((m) => ({ default: m.AdminCampaignsPage })))
const AdminEventsPage = lazy(() => import('@/pages/admin/EventsPage').then((m) => ({ default: m.AdminEventsPage })))
const AdminWithdrawalsPage = lazy(() => import('@/pages/admin/WithdrawalsPage').then((m) => ({ default: m.AdminWithdrawalsPage })))
const AdminPointsPage = lazy(() => import('@/pages/admin/PointsPage').then((m) => ({ default: m.AdminPointsPage })))
const AdminNotificationsPage = lazy(() => import('@/pages/admin/NotificationsPage').then((m) => ({ default: m.AdminNotificationsPage })))
const AdminAuditLogsPage = lazy(() => import('@/pages/admin/AuditLogsPage').then((m) => ({ default: m.AdminAuditLogsPage })))
const AdminSettingsPage = lazy(() => import('@/pages/admin/SettingsPage').then((m) => ({ default: m.AdminSettingsPage })))

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth (guest only) */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
        </Route>

        {/* Customer area */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<CustomerLayout />}>
            <Route index element={<CustomerDashboardPage />} />
            <Route path="submit" element={<SubmitContentPage />} />
            <Route path="submissions" element={<SubmissionsPage />} />
            <Route path="submissions/:id" element={<SubmissionDetailPage />} />
            <Route path="points" element={<PointsPage />} />
            <Route path="withdraw" element={<WithdrawPage />} />
            <Route path="withdrawals" element={<WithdrawalHistoryPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Admin area */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="submissions" element={<AdminSubmissionsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="campaigns" element={<AdminCampaignsPage />} />
            <Route path="events" element={<AdminEventsPage />} />
            <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
            <Route path="points" element={<AdminPointsPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App