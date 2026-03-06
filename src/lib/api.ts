import axios from 'axios';
import type {
  User, Company, CompanyMember, Declaration, Certificate,
  Task, Document, Folder, Client, Partnership, Request,
  Notification, AdminCode, DashboardStats,
  AuthRequest, RegisterRequest, LoginResponse, RegisterResponse,
  CompanySetupCreate, CompanyLookupResponse,
  PaginatedResponse
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Clear stored data and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: RegisterRequest) => api.post<RegisterResponse>('/api/auth/register', data),
  login: (data: AuthRequest) => api.post<LoginResponse>('/api/auth/login', data),
  adminLogin: (data: AuthRequest & { secret: string }) => api.post<LoginResponse>('/api/auth/admin/login', data),
  getMe: () => api.get<User>({ url: '/api/auth/me' }),
  getCompanyStatus: () => api.get<{ status: string; message?: string; company_id?: number; company_name?: string; role?: string }>({ url: '/api/auth/me/company-status' }),
  createCompany: (data: CompanySetupCreate) => api.post<Company>({ url: '/api/auth/company/create', data }),
  joinCompany: (data: { company_inn: string }) => api.post<{ message: string }>({ url: '/api/auth/company/join', data }),
  lookupCompany: (inn: string) => api.post<CompanyLookupResponse>({ url: '/api/auth/company/lookup', data: { inn } }),
  forgotPassword: (email: string) => api.post<{ message: string }>({ url: '/api/auth/forgot-password', data: { email } }),
};

// Admin API
export const adminApi = {
  getUsers: (params?: { page?: number; size?: number; search?: string }) => api.get<PaginatedResponse<User>>({ url: '/api/admin/users', params }),
  updateUser: (userId: number, data: Partial<User>) => api.put<User>({ url: `/api/admin/users/${userId}`, data }),
  deleteUser: (userId: number) => api.delete<void>({ url: `/api/admin/users/${userId}` }),
  getAdminCodes: () => api.get<AdminCode[]>('/api/admin/codes'),
  generateAdminCode: () => api.post<AdminCode>('/api/admin/codes/generate'),
  revokeAdminCode: (codeId: number) => api.delete<void>({ url: `/api/admin/codes/${codeId}` }),
  getCompanies: (params?: { page?: number; size?: number; search?: string; is_active?: boolean }) => api.get<PaginatedResponse<Company>>({ url: '/api/admin/companies', params }),
  updateCompany: (companyId: number, data: Partial<Company>) => api.put<Company>({ url: `/api/admin/companies/${companyId}`, data }),
  deleteCompany: (companyId: number) => api.delete<void>({ url: `/api/admin/companies/${companyId}` }),
  getCompanyMembers: (companyId: number) => api.get<CompanyMember[]>({ url: `/api/admin/companies/${companyId}/members` }),
  updateCompanyMember: (companyId: number, memberId: number, data: { role?: string; is_active?: boolean }) => api.put<CompanyMember>({ url: `/api/admin/companies/${companyId}/members/${memberId}`, data }),
  removeCompanyMember: (companyId: number, memberId: number) => api.delete<void>({ url: `/api/admin/companies/${companyId}/members/${memberId}` }),
  getPendingRequests: () => api.get<Request[]>({ url: '/api/admin/requests/pending' }),
  resolveRequest: (requestId: number, status: 'resolved' | 'cancelled') => api.patch<Request>({ url: `/api/admin/requests/${requestId}`, data: { status } }),
  getSystemStats: () => api.get<DashboardStats>('/api/admin/stats'),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get<DashboardStats>('/api/dashboard/stats'),
};

// Declarations API
export const declarationsApi = {
  getAll: (params?: { page?: number; size?: number; status?: string; company_id?: number; assigned_user_id?: number; search?: string }) => api.get<PaginatedResponse<Declaration>>({ url: '/api/declarations', params }),
  getById: (id: number) => api.get<Declaration>({ url: `/api/declarations/${id}` }),
  create: (data: Partial<Declaration>) => api.post<Declaration>({ url: '/api/declarations', data }),
  update: (id: number, data: Partial<Declaration>) => api.put<Declaration>({ url: `/api/declarations/${id}`, data }),
  delete: (id: number) => api.delete<void>({ url: `/api/declarations/${id}` }),
  assignUser: (id: number, userId: number) => api.post<{ message: string }>({ url: `/api/declarations/${id}/assign`, data: { user_id: userId } }),
  changeStatus: (id: number, status: Declaration['status']) => api.patch<Declaration>({ url: `/api/declarations/${id}/status`, data: { status } }),
  addVehicle: (declarationId: number, data: Partial<DeclarationVehicle>) => api.post<DeclarationVehicle>({ url: `/api/declarations/${declarationId}/vehicles`, data }),
  removeVehicle: (declarationId: number, vehicleId: number) => api.delete<void>({ url: `/api/declarations/${declarationId}/vehicles/${vehicleId}` }),
  uploadAttachment: (declarationId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<DeclarationAttachment>({ url: `/api/declarations/${declarationId}/attachments`, data: formData, headers: { 'Content-Type': 'multipart/form-data' } });
  },
  removeAttachment: (declarationId: number, attachmentId: number) => api.delete<void>({ url: `/api/declarations/${declarationId}/attachments/${attachmentId}` }),
};

// Certificates API
export const certificatesApi = {
  getAll: (params?: { page?: number; size?: number; status?: string; company_id?: number; assigned_user_id?: number; search?: string }) => api.get<PaginatedResponse<Certificate>>({ url: '/api/certificates', params }),
  getById: (id: number) => api.get<Certificate>({ url: `/api/certificates/${id}` }),
  create: (data: Partial<Certificate>) => api.post<Certificate>({ url: '/api/certificates', data }),
  update: (id: number, data: Partial<Certificate>) => api.put<Certificate>({ url: `/api/certificates/${id}`, data }),
  delete: (id: number) => api.delete<void>({ url: `/api/certificates/${id}` }),
  assignUser: (id: number, userId: number) => api.post<{ message: string }>({ url: `/api/certificates/${id}/assign`, data: { user_id: userId } }),
  changeStatus: (id: number, status: Certificate['status']) => api.patch<Certificate>({ url: `/api/certificates/${id}/status`, data: { status } }),
  uploadAttachment: (certificateId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<CertificateAttachment>({ url: `/api/certificates/${certificateId}/attachments`, data: formData, headers: { 'Content-Type': 'multipart/form-data' } });
  },
  removeAttachment: (certificateId: number, attachmentId: number) => api.delete<void>({ url: `/api/certificates/${certificateId}/attachments/${attachmentId}` }),
  addAction: (certificateId: number, data: { action_type: string; notes?: string }) => api.post<CertificateAction>({ url: `/api/certificates/${certificateId}/actions`, data }),
};

// Tasks API
export const tasksApi = {
  getAll: (params?: { page?: number; size?: number; status?: string; assigned_user_id?: number; company_id?: number; search?: string }) => api.get<PaginatedResponse<Task>>({ url: '/api/tasks', params }),
  getById: (id: number) => api.get<Task>({ url: `/api/tasks/${id}` }),
  create: (data: Partial<Task>) => api.post<Task>({ url: '/api/tasks', data }),
  update: (id: number, data: Partial<Task>) => api.put<Task>({ url: `/api/tasks/${id}`, data }),
  delete: (id: number) => api.delete<void>({ url: `/api/tasks/${id}` }),
  assignUser: (id: number, userId: number) => api.post<{ message: string }>({ url: `/api/tasks/${id}/assign`, data: { user_id: userId } }),
  changeStatus: (id: number, status: Task['status']) => api.patch<Task>({ url: `/api/tasks/${id}/status`, data: { status } }),
  uploadAttachment: (taskId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<TaskAttachment>({ url: `/api/tasks/${taskId}/attachments`, data: formData, headers: { 'Content-Type': 'multipart/form-data' } });
  },
  removeAttachment: (taskId: number, attachmentId: number) => api.delete<void>({ url: `/api/tasks/${taskId}/attachments/${attachmentId}` }),
};

// Documents API
export const documentsApi = {
  getAll: (params?: { page?: number; size?: number; folder_id?: number; company_id?: number; search?: string }) => api.get<PaginatedResponse<Document>>({ url: '/api/documents', params }),
  getById: (id: number) => api.get<Document>({ url: `/api/documents/${id}` }),
  create: (data: { title: string; description?: string; file: File; folder_id?: number }) => {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    formData.append('file', data.file);
    if (data.folder_id) formData.append('folder_id', data.folder_id.toString());
    return api.post<Document>({ url: '/api/documents', data: formData, headers: { 'Content-Type': 'multipart/form-data' } });
  },
  update: (id: number, data: { title?: string; description?: string; folder_id?: number }) => api.put<Document>({ url: `/api/documents/${id}`, data }),
  delete: (id: number) => api.delete<void>({ url: `/api/documents/${id}` }),
  download: (id: number) => {
    const token = localStorage.getItem('access_token');
    const link = document.createElement('a');
    link.href = `${API_BASE_URL}/api/documents/${id}/download?token=${token}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

// Folders API
export const foldersApi = {
  getAll: (companyId: number) => api.get<Folder[]>({ url: `/api/documents/folders?company_id=${companyId}` }),
  create: (data: { name: string; description?: string; parent_folder_id?: number; company_id: number }) => api.post<Folder>({ url: '/api/documents/folders', data }),
  update: (id: number, data: Partial<Folder>) => api.put<Folder>({ url: `/api/documents/folders/${id}`, data }),
  delete: (id: number) => api.delete<void>({ url: `/api/documents/folders/${id}` }),
  grantAccess: (folderId: number, userId: number, permission: 'read' | 'write' | 'admin') => api.post<FolderAccess>({ url: `/api/documents/folders/${folderId}/access`, data: { user_id: userId, permission } }),
  revokeAccess: (folderId: number, userId: number) => api.delete<void>({ url: `/api/documents/folders/${folderId}/access/${userId}` }),
};

// Clients API
export const clientsApi = {
  getAll: (params?: { page?: number; size?: number; company_id?: number; search?: string }) => api.get<PaginatedResponse<Client>>({ url: '/api/clients', params }),
  getById: (id: number) => api.get<Client>({ url: `/api/clients/${id}` }),
  create: (data: Partial<Client>) => api.post<Client>({ url: '/api/clients', data }),
  update: (id: number, data: Partial<Client>) => api.put<Client>({ url: `/api/clients/${id}`, data }),
  delete: (id: number) => api.delete<void>({ url: `/api/clients/${id}` }),
  grantAccess: (clientId: number, userId: number, permission: 'read' | 'write' | 'admin') => api.post<ClientAccess>({ url: `/api/clients/${clientId}/access`, data: { user_id: userId, permission } }),
  revokeAccess: (clientId: number, userId: number) => api.delete<void>({ url: `/api/clients/${clientId}/access/${userId}` }),
};

// Partnerships API
export const partnershipsApi = {
  getAll: (params?: { page?: number; size?: number; status?: string; company_id?: number; search?: string }) => api.get<PaginatedResponse<Partnership>>({ url: '/api/partnerships', params }),
  getById: (id: number) => api.get<Partnership>({ url: `/api/partnerships/${id}` }),
  create: (data: { target_company_inn: string; partnership_type: string; description?: string }) => api.post<Partnership>({ url: '/api/partnerships', data }),
  update: (id: number, data: Partial<Partnership>) => api.put<Partnership>({ url: `/api/partnerships/${id}`, data }),
  delete: (id: number) => api.delete<void>({ url: `/api/partnerships/${id}` }),
  respond: (id: number, status: 'accepted' | 'rejected') => api.patch<Partnership>({ url: `/api/partnerships/${id}/respond`, data: { status } }),
};

// Requests API
export const requestsApi = {
  getAll: (params?: { page?: number; size?: number; status?: string; company_id?: number; assigned_user_id?: number; search?: string }) => api.get<PaginatedResponse<Request>>({ url: '/api/requests', params }),
  getById: (id: number) => api.get<Request>({ url: `/api/requests/${id}` }),
  create: (data: Partial<Request>) => api.post<Request>({ url: '/api/requests', data }),
  update: (id: number, data: Partial<Request>) => api.put<Request>({ url: `/api/requests/${id}`, data }),
  delete: (id: number) => api.delete<void>({ url: `/api/requests/${id}` }),
  assignUser: (id: number, userId: number) => api.post<{ message: string }>({ url: `/api/requests/${id}/assign`, data: { user_id: userId } }),
  changeStatus: (id: number, status: Request['status']) => api.patch<Request>({ url: `/api/requests/${id}/status`, data: { status } }),
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: { page?: number; size?: number; is_read?: boolean }) => api.get<PaginatedResponse<Notification>>({ url: '/api/notifications', params }),
  getById: (id: number) => api.get<Notification>({ url: `/api/notifications/${id}` }),
  markAsRead: (id: number) => api.patch<Notification>({ url: `/api/notifications/${id}/read`, data: {} }),
  markAllAsRead: () => api.post<{ message: string }>('/api/notifications/read-all'),
  getUnreadCount: () => api.get<{ count: number }>('/api/notifications/unread-count'),
};

// Settings API
export const settingsApi = {
  getProfile: () => api.get<User>('/api/settings/profile'),
  updateProfile: (data: Partial<User>) => api.put<User>({ url: '/api/settings/profile', data }),
  changePassword: (currentPassword: string, newPassword: string) => api.post<{ message: string }>('/api/settings/password', data: { current_password: currentPassword, new_password: newPassword }),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post<User>({ url: '/api/settings/avatar', data: formData, headers: { 'Content-Type': 'multipart/form-data' } });
  },
  toggleSound: (enabled: boolean) => api.patch<User>({ url: '/api/settings/sound', data: { sound_enabled: enabled } }),
};

export default api;