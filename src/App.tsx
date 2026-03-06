import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import CompanySetupPage from '@/pages/CompanySetupPage';
import DashboardPage from '@/pages/DashboardPage';
import DeclarationsPage from '@/pages/DeclarationsPage';
import DeclarationDetailPage from '@/pages/DeclarationDetailPage';
import NewDeclarationPage from '@/pages/NewDeclarationPage';
import EditDeclarationPage from '@/pages/EditDeclarationPage';
import CertificatesPage from '@/pages/CertificatesPage';
import CertificateDetailPage from '@/pages/CertificateDetailPage';
import NewCertificatePage from '@/pages/NewCertificatePage';
import EditCertificatePage from '@/pages/EditCertificatePage';
import TasksPage from '@/pages/TasksPage';
import TaskDetailPage from '@/pages/TaskDetailPage';
import NewTaskPage from '@/pages/NewTaskPage';
import EditTaskPage from '@/pages/EditTaskPage';
import DocumentsPage from '@/pages/DocumentsPage';
import ClientsPage from '@/pages/ClientsPage';
import ClientDetailPage from '@/pages/ClientDetailPage';
import NewClientPage from '@/pages/NewClientPage';
import EditClientPage from '@/pages/EditClientPage';
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
        
        {/* Declarations */}
        <Route path="declarations" element={<DeclarationsPage />} />
        <Route path="declarations/new" element={<NewDeclarationPage />} />
        <Route path="declarations/:id" element={<DeclarationDetailPage />} />
        <Route path="declarations/:id/edit" element={<EditDeclarationPage />} />
        
        {/* Certificates */}
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="certificates/new" element={<NewCertificatePage />} />
        <Route path="certificates/:id" element={<CertificateDetailPage />} />
        <Route path="certificates/:id/edit" element={<EditCertificatePage />} />
        
        {/* Tasks */}
        <Route path="tasks" element={<TasksPage />} />
        <Route path="tasks/new" element={<NewTaskPage />} />
        <Route path="tasks/:id" element={<TaskDetailPage />} />
        <Route path="tasks/:id/edit" element={<EditTaskPage />} />
        
        {/* Documents */}
        <Route path="documents" element={<DocumentsPage />} />
        
        {/* Clients */}
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/new" element={<NewClientPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="clients/:id/edit" element={<EditClientPage />} />
        
        {/* Partnerships */}
        <Route path="partnerships" element={<PartnershipsPage />} />
        
        {/* Requests */}
        <Route path="requests" element={<RequestsPage />} />
        
        {/* Notifications */}
        <Route path="notifications" element={<NotificationsPage />} />
        
        {/* Settings */}
        <Route path="settings" element={<SettingsPage />} />
        
        {/* Admin */}
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