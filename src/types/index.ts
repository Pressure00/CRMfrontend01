export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  activity_type: 'declarant' | 'certification';
  avatar_url: string | null;
  telegram_chat_id: string | null;
  sound_enabled: boolean;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Company {
  id: number;
  name: string;
  inn: string;
  activity_type: 'declarant' | 'certification';
  is_active: boolean;
  is_blocked: boolean;
  created_at: string;
}

export interface CompanyMember {
  id: number;
  user_id: number;
  company_id: number;
  role: 'director' | 'senior' | 'employee';
  is_active: boolean;
  is_blocked: boolean;
  joined_at: string;
  user?: User;
  company?: Company;
}

export interface Declaration {
  id: number;
  declaration_number: string;
  client_id?: number;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  status: 'draft' | 'submitted' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  declaration_date: string;
  deadline: string | null;
  notes: string | null;
  assigned_user_id?: number;
  assigned_user?: User;
  company_id: number;
  company?: Company;
  created_by: number;
  created_by_user?: User;
  created_at: string;
  updated_at: string;
  vehicles?: DeclarationVehicle[];
  attachments?: DeclarationAttachment[];
}

export interface DeclarationVehicle {
  id: number;
  declaration_id: number;
  vehicle_type: string;
  brand: string;
  model: string;
  vin: string;
  year: number;
  license_plate: string;
  created_at: string;
}

export interface DeclarationAttachment {
  id: number;
  declaration_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: number;
  uploaded_by_user?: User;
  uploaded_at: string;
}

export interface Certificate {
  id: number;
  certificate_number: string;
  declarant_user_id?: number;
  declarant_user?: User;
  declarant_company_id?: number;
  declarant_company?: Company;
  certifier_user_id?: number;
  certifier_user?: User;
  certifier_company_id?: number;
  certifier_company?: Company;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'expired';
  issue_date: string;
  expiry_date: string;
  certificate_type: string;
  description: string | null;
  created_by: number;
  created_by_user?: User;
  created_at: string;
  updated_at: string;
  attachments?: CertificateAttachment[];
  actions?: CertificateAction[];
}

export interface CertificateAttachment {
  id: number;
  certificate_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: number;
  uploaded_by_user?: User;
  uploaded_at: string;
}

export interface CertificateAction {
  id: number;
  certificate_id: number;
  action_type: string;
  performed_by: number;
  performed_by_user?: User;
  notes: string | null;
  performed_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  assigned_user_id?: number;
  assigned_user?: User;
  target_company_id?: number;
  target_company?: Company;
  creator_user_id: number;
  creator_user?: User;
  creator_company_id?: number;
  creator_company?: Company;
  related_declaration_id?: number;
  related_certificate_id?: number;
  created_at: string;
  updated_at: string;
  attachments?: TaskAttachment[];
  history?: TaskHistory[];
}

export interface TaskAttachment {
  id: number;
  task_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: number;
  uploaded_by_user?: User;
  uploaded_at: string;
}

export interface TaskHistory {
  id: number;
  task_id: number;
  status: string;
  changed_by: number;
  changed_by_user?: User;
  notes: string | null;
  changed_at: string;
}

export interface Document {
  id: number;
  title: string;
  description: string | null;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  folder_id?: number;
  folder?: Folder;
  uploaded_by: number;
  uploaded_by_user?: User;
  company_id: number;
  company?: Company;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: number;
  name: string;
  description: string | null;
  parent_folder_id?: number;
  parent_folder?: Folder;
  company_id: number;
  company?: Company;
  created_by: number;
  created_by_user?: User;
  created_at: string;
  updated_at: string;
  access_list?: FolderAccess[];
}

export interface FolderAccess {
  id: number;
  folder_id: number;
  user_id: number;
  user?: User;
  permission: 'read' | 'write' | 'admin';
  granted_by: number;
  granted_by_user?: User;
  granted_at: string;
}

export interface Client {
  id: number;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  passport_series: string | null;
  passport_number: string | null;
  passport_issued_by: string | null;
  passport_issued_date: string | null;
  inn: string | null;
  notes: string | null;
  company_id: number;
  company?: Company;
  created_by: number;
  created_by_user?: User;
  created_at: string;
  updated_at: string;
  access_list?: ClientAccess[];
}

export interface ClientAccess {
  id: number;
  client_id: number;
  user_id: number;
  user?: User;
  permission: 'read' | 'write' | 'admin';
  granted_by: number;
  granted_by_user?: User;
  granted_at: string;
}

export interface Partnership {
  id: number;
  requester_company_id: number;
  requester_company?: Company;
  target_company_id: number;
  target_company?: Company;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  partnership_type: string;
  description: string | null;
  initiated_by: number;
  initiated_by_user?: User;
  created_at: string;
  updated_at: string;
}

export interface Request {
  id: number;
  title: string;
  description: string;
  request_type: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  client_id?: number;
  client?: Client;
  assigned_user_id?: number;
  assigned_user?: User;
  company_id: number;
  company?: Company;
  created_by: number;
  created_by_user?: User;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  user?: User;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  related_entity_type?: string;
  related_entity_id?: number;
  created_at: string;
}

export interface AdminCode {
  id: number;
  code: string;
  created_at: string;
  expires_at: string;
  is_used: boolean;
}

export interface DashboardStats {
  total_declarations: number;
  active_declarations: number;
  completed_declarations: number;
  total_certificates: number;
  active_certificates: number;
  expiring_certificates: number;
  total_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  total_clients: number;
  active_clients: number;
  total_documents: number;
  recent_declarations: Declaration[];
  upcoming_tasks: Task[];
  expiring_certificates_list: Certificate[];
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  phone: string;
  activity_type: 'declarant' | 'certification';
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user_id: number;
  is_admin: boolean;
}

export interface RegisterResponse {
  message: string;
  user_id: number;
  needs_company_setup: boolean;
}

export interface CompanySetupCreate {
  company_name: string;
  company_inn: string;
}

export interface CompanyLookupResponse {
  exists: boolean;
  company?: Company;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}