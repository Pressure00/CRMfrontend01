import axios from 'axios';

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
  register: (data: any) => api.post('/api/auth/register', data),
  login: (data: any) => api.post('/api/auth/login', data),
  adminLogin: (data: any) => api.post('/api/auth/admin/login', data),
  getMe: () => api.get('/api/auth/me'),
  getCompanyStatus: () => api.get('/api/auth/me/company-status'),
  createCompany: (data: any) => api.post('/api/auth/company/create', data),
  joinCompany: (data: { company_inn: string }) => api.post('/api/auth/company/join', data),
  lookupCompany: (inn: string) => api.post('/api/auth/company/lookup', { inn }),
  forgotPassword: (email: string) => api.post('/api/auth/forgot-password', { email }),
};

// Admin API
export const adminApi = {
  getUsers: (params?: any) => api.get('/api/admin/users', { params }),
  updateUser: (userId: number, data: any) => api.put(`/api/admin/users/${userId}`, data),
  deleteUser: (userId: number) => api.delete(`/api/admin/users/${userId}`),
  getAdminCodes: () => api.get('/api/admin/codes'),
  generateAdminCode: () => api.post('/api/admin/codes/generate'),
  revokeAdminCode: (codeId: number) => api.delete(`/api/admin/codes/${codeId}`),
  getCompanies: (params?: any) => api.get('/api/admin/companies', { params }),
  updateCompany: (companyId: number, data: any) => api.put(`/api/admin/companies/${companyId}`, data),
  deleteCompany: (companyId: number) => api.delete(`/api/admin/companies/${companyId}`),
  getCompanyMembers: (companyId: number) => api.get(`/api/admin/companies/${companyId}/members`),
  updateCompanyMember: (companyId: number, memberId: number, data: any) => api.put(`/api/admin/companies/${companyId}/members/${memberId}`, data),
  removeCompanyMember: (companyId: number, memberId: number) => api.delete(`/api/admin/companies/${companyId}/members/${memberId}`),
  getPendingRequests: () => api.get('/api/admin/requests/pending'),
  resolveRequest: (requestId: number, status: 'resolved' | 'cancelled') => api.patch(`/api/admin/requests/${requestId}`, { status }),
  getSystemStats: () => api.get('/api/admin/stats'),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/api/dashboard/stats'),
};

// Declarations API
export const declarationsApi = {
  getAll: (params?: any) => api.get('/api/declarations', { params }),
  getById: (id: number) => api.get(`/api/declarations/${id}`),
  create: (data: any) => api.post('/api/declarations', data),
  update: (id: number, data: any) => api.put(`/api/declarations/${id}`, data),
  delete: (id: number) => api.delete(`/api/declarations/${id}`),
  assignUser: (id: number, userId: number) => api.post(`/api/declarations/${id}/assign`, { user_id: userId }),
  changeStatus: (id: number, status: string) => api.patch(`/api/declarations/${id}/status`, { status }),
  addVehicle: (declarationId: number, data: any) => api.post(`/api/declarations/${declarationId}/vehicles`, data),
  removeVehicle: (declarationId: number, vehicleId: number) => api.delete(`/api/declarations/${declarationId}/vehicles/${vehicleId}`),
  uploadAttachment: (declarationId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/declarations/${declarationId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  removeAttachment: (declarationId: number, attachmentId: number) => api.delete(`/api/declarations/${declarationId}/attachments/${attachmentId}`),
};

// Certificates API
export const certificatesApi = {
  getAll: (params?: any) => api.get('/api/certificates', { params }),
  getById: (id: number) => api.get(`/api/certificates/${id}`),
  create: (data: any) => api.post('/api/certificates', data),
  update: (id: number, data: any) => api.put(`/api/certificates/${id}`, data),
  delete: (id: number) => api.delete(`/api/certificates/${id}`),
  assignUser: (id: number, userId: number) => api.post(`/api/certificates/${id}/assign`, { user_id: userId }),
  changeStatus: (id: number, status: string) => api.patch(`/api/certificates/${id}/status`, { status }),
  uploadAttachment: (certificateId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/certificates/${certificateId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  removeAttachment: (certificateId: number, attachmentId: number) => api.delete(`/api/certificates/${certificateId}/attachments/${attachmentId}`),
  addAction: (certificateId: number, data: { action_type: string; notes?: string }) => api.post(`/api/certificates/${certificateId}/actions`, data),
};

// Tasks API
export const tasksApi = {
  getAll: (params?: any) => api.get('/api/tasks', { params }),
  getById: (id: number) => api.get(`/api/tasks/${id}`),
  create: (data: any) => api.post('/api/tasks', data),
  update: (id: number, data: any) => api.put(`/api/tasks/${id}`, data),
  delete: (id: number) => api.delete(`/api/tasks/${id}`),
  assignUser: (id: number, userId: number) => api.post(`/api/tasks/${id}/assign`, { user_id: userId }),
  changeStatus: (id: number, status: string) => api.patch(`/api/tasks/${id}/status`, { status }),
  uploadAttachment: (taskId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  removeAttachment: (taskId: number, attachmentId: number) => api.delete(`/api/tasks/${taskId}/attachments/${attachmentId}`),
};

// Documents API
export const documentsApi = {
  getAll: (params?: any) => api.get('/api/documents', { params }),
  getById: (id: number) => api.get(`/api/documents/${id}`),
  create: (data: { title: string; description?: string; file: File; folder_id?: number }) => {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    formData.append('file', data.file);
    if (data.folder_id) formData.append('folder_id', data.folder_id.toString());
    return api.post('/api/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id: number, data: { title?: string; description?: string; folder_id?: number }) => api.put(`/api/documents/${id}`, data),
  delete: (id: number) => api.delete(`/api/documents/${id}`),
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
  getAll: (companyId: number) => api.get(`/api/documents/folders?company_id=${companyId}`),
  create: (data: { name: string; description?: string; parent_folder_id?: number; company_id: number }) => api.post('/api/documents/folders', data),
  update: (id: number, data: any) => api.put(`/api/documents/folders/${id}`, data),
  delete: (id: number) => api.delete(`/api/documents/folders/${id}`),
  grantAccess: (folderId: number, userId: number, permission: 'read' | 'write' | 'admin') => api.post(`/api/documents/folders/${folderId}/access`, { user_id: userId, permission }),
  revokeAccess: (folderId: number, userId: number) => api.delete(`/api/documents/folders/${folderId}/access/${userId}`),
};

// Clients API
export const clientsApi = {
  getAll: (params?: any) => api.get('/api/clients', { params }),
  getById: (id: number) => api.get(`/api/clients/${id}`),
  create: (data: any) => api.post('/api/clients', data),
  update: (id: number, data: any) => api.put(`/api/clients/${id}`, data),
  delete: (id: number) => api.delete(`/api/clients/${id}`),
  grantAccess: (clientId: number, userId: number, permission: 'read' | 'write' | 'admin') => api.post(`/api/clients/${clientId}/access`, { user_id: userId, permission }),
  revokeAccess: (clientId: number, userId: number) => api.delete(`/api/clients/${clientId}/access/${userId}`),
};

// Partnerships API
export const partnershipsApi = {
  getAll: (params?: any) => api.get('/api/partnerships', { params }),
  getById: (id: number) => api.get(`/api/partnerships/${id}`),
  create: (data: { target_company_inn: string; partnership_type: string; description?: string }) => api.post('/api/partnerships', data),
  update: (id: number, data: any) => api.put(`/api/partnerships/${id}`, data),
  delete: (id: number) => api.delete(`/api/partnerships/${id}`),
  respond: (id: number, status: 'accepted' | 'rejected') => api.patch(`/api/partnerships/${id}/respond`, { status }),
};

// Requests API
export const requestsApi = {
  getAll: (params?: any) => api.get('/api/requests', { params }),
  getById: (id: number) => api.get(`/api/requests/${id}`),
  create: (data: any) => api.post('/api/requests', data),
  update: (id: number, data: any) => api.put(`/api/requests/${id}`, data),
  delete: (id: number) => api.delete(`/api/requests/${id}`),
  assignUser: (id: number, userId: number) => api.post(`/api/requests/${id}/assign`, { user_id: userId }),
  changeStatus: (id: number, status: string) => api.patch(`/api/requests/${id}/status`, { status }),
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: any) => api.get('/api/notifications', { params }),
  getById: (id: number) => api.get(`/api/notifications/${id}`),
  markAsRead: (id: number) => api.patch(`/api/notifications/${id}/read`, {}),
  markAllAsRead: () => api.post('/api/notifications/read-all'),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
  delete: (id: number) => api.delete(`/api/notifications/${id}`),
};

// Settings API
export const settingsApi = {
  getProfile: () => api.get('/api/settings/profile'),
  updateProfile: (data: any) => api.put('/api/settings/profile', data),
  changePassword: (currentPassword: string, newPassword: string) => api.post('/api/settings/password', { current_password: currentPassword, new_password: newPassword }),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/api/settings/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  toggleSound: (enabled: boolean) => api.patch('/api/settings/sound', { sound_enabled: enabled }),
};

export default api;
