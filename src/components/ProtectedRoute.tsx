import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import { useEffect } from 'react';
import { authApi } from '@/lib/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, user, setUser, setCompanyMember, setToken } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        return;
      }

      try {
        const [userResponse, companyStatusResponse] = await Promise.all([
          authApi.getMe(),
          authApi.getCompanyStatus(),
        ]);

        setUser(userResponse.data);
        setToken(token);

        if (companyStatusResponse.data.status === 'active') {
          setCompanyMember({
            company_id: companyStatusResponse.data.company_id!,
            role: companyStatusResponse.data.role!,
            is_active: true,
            user_id: userResponse.data.id,
            id: 0, // We don't need the actual ID
            is_blocked: false,
            joined_at: new Date().toISOString(),
          });
        } else {
          setCompanyMember(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
    };

    if (!isAuthenticated) {
      checkAuth();
    }
  }, [isAuthenticated, setUser, setCompanyMember, setToken]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
