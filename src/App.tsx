import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import CompanySetupPage from '@/pages/CompanySetupPage';
import DashboardPage from '@/pages/DashboardPage';
import DeclarationsPage from '@/pages/DeclarationsPage';
import DeclarationDetailPage from '@/pages/DeclarationDetailPage';
import CertificatesPage from '@/pages/CertificatesPage';
import CertificateDetailPage from '@/pages/CertificateDetailPage';
import TasksPage from '@/pages/TasksPage';
import TaskDetailPage from '@/pages/TaskDetailPage';
import DocumentsPage from '@/pages/DocumentsPage';
import ClientsPage from '@/pages/ClientsPage';
import ClientDetailPage from '@/pages/ClientDetailPage';
import PartnershipsPage from '@/pages/PartnershipsPage';
import RequestsPage from '@/pages/RequestsPage';
import NotificationsPage from '@/pages/NotificationsPage';
import SettingsPage from '@/pages/SettingsPage';
import AdminPage from '@/pages/AdminPage';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Routes>
      <Route
        path="/login"
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />}
      />
      <Route
        path="/register"
        element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" />}
      />
      <Route
        path="/company-setup"
        element={
          <ProtectedRoute>
            <CompanySetupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="declarations" element={<DeclarationsPage />} />
        <Route path="declarations/:id" element={<DeclarationDetailPage />} />
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="certificates/:id" element={<CertificateDetailPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="tasks/:id" element={<TaskDetailPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="partnerships" element={<PartnershipsPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route
          path="admin"
          element={
            user?.is_admin ? <AdminPage /> : <Navigate to="/dashboard" />
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;