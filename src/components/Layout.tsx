import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore, useUIStore, useNotificationStore } from '@/lib/store';
import { notificationsApi } from '@/lib/api';
import {
  LayoutDashboard,
  FileText,
  Award,
  CheckSquare,
  FolderOpen,
  Users,
  Handshake,
  MessageSquare,
  Bell,
  Settings,
  Shield,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

const navigation = [
  { name: 'Дашборд', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Декларации', href: '/declarations', icon: FileText },
  { name: 'Сертификаты', href: '/certificates', icon: Award },
  { name: 'Задачи', href: '/tasks', icon: CheckSquare },
  { name: 'Документы', href: '/documents', icon: FolderOpen },
  { name: 'Клиенты', href: '/clients', icon: Users },
  { name: 'Партнерства', href: '/partnerships', icon: Handshake },
  { name: 'Запросы', href: '/requests', icon: MessageSquare },
  { name: 'Уведомления', href: '/notifications', icon: Bell, hasBadge: true },
  { name: 'Настройки', href: '/settings', icon: Settings },
  { name: 'Админ', href: '/admin', icon: Shield, adminOnly: true },
];

export default function Layout() {
  const { user, logout, companyMember } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { setNotifications, setUnreadCount, incrementUnreadCount } = useNotificationStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await notificationsApi.getAll({ size: 20 });
        setNotifications(response.data.items);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    const fetchUnreadCount = async () => {
      try {
        const response = await notificationsApi.getUnreadCount();
        setUnreadCount(response.data.count);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchNotifications();
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [setNotifications, setUnreadCount]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Вы вышли из системы');
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'director':
        return <span className="badge badge-info">Директор</span>;
      case 'senior':
        return <span className="badge badge-warning">Старший</span>;
      case 'employee':
        return <span className="badge badge-gray">Сотрудник</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-primary-600">Declarant CRM</h1>
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              if (item.adminOnly && !user?.is_admin) return null;

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                  {item.hasBadge && useNotificationStore.getState().unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {useNotificationStore.getState().unreadCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.full_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {companyMember ? getRoleBadge(companyMember.role) : 'Нет компании'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 rounded-md hover:bg-gray-100"
                title="Выйти"
              >
                <LogOut className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`lg:pl-64 ${sidebarOpen ? 'lg:pl-64' : ''}`}>
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {companyMember && (
                  <span className="flex items-center">
                    <ChevronDown className="h-4 w-4 mr-1" />
                    {companyMember.role === 'director' ? 'Директор' : companyMember.role === 'senior' ? 'Старший' : 'Сотрудник'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}