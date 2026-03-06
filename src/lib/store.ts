import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, CompanyMember, Notification } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  companyMember: CompanyMember | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setCompanyMember: (member: CompanyMember | null) => void;
  login: (user: User, token: string, companyMember?: CompanyMember) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      companyMember: null,
      isAuthenticated: false,
      isLoading: false,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setCompanyMember: (companyMember) => set({ companyMember }),
      login: (user, token, companyMember) => {
        localStorage.setItem('access_token', token);
        set({
          user,
          token,
          companyMember,
          isAuthenticated: true,
        });
      },
      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        set({
          user: null,
          token: null,
          companyMember: null,
          isAuthenticated: false,
        });
      },
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  updateNotification: (id: number, updates: Partial<Notification>) => void;
  removeNotification: (id: number) => void;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1,
  })),
  updateNotification: (id, updates) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, ...updates } : n),
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id),
    unreadCount: Math.max(0, state.unreadCount - (state.notifications.find(n => n.id === id)?.is_read ? 0 : 1)),
  })),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, is_read: true })),
    unreadCount: 0,
  })),
}));

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
}));