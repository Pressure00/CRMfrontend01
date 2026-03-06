import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  Users,
  Building2,
  FileText,
  Shield,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { User, Company, Request, AdminCode } from '@/types';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getSystemStats,
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.getUsers({ size: 10 }),
  });

  const { data: companies } = useQuery({
    queryKey: ['admin-companies'],
    queryFn: () => adminApi.getCompanies({ size: 10 }),
  });

  const { data: pendingRequests } = useQuery({
    queryKey: ['admin-pending-requests'],
    queryFn: adminApi.getPendingRequests,
  });

  const { data: adminCodes } = useQuery({
    queryKey: ['admin-codes'],
    queryFn: adminApi.getAdminCodes,
  });

  const generateCodeMutation = useMutation({
    mutationFn: adminApi.generateAdminCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-codes'] });
      toast.success('Код сгенерирован');
    },
  });

  const revokeCodeMutation = useMutation({
    mutationFn: adminApi.revokeAdminCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-codes'] });
      toast.success('Код отозван');
    },
  });

  const activateCompanyMutation = useMutation({
    mutationFn: (companyId: number) => adminApi.updateCompany(companyId, { is_active: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      toast.success('Компания активирована');
    },
  });

  const blockCompanyMutation = useMutation({
    mutationFn: (companyId: number) => adminApi.updateCompany(companyId, { is_blocked: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      toast.success('Компания заблокирована');
    },
  });

  const resolveRequestMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'resolved' | 'cancelled' }) =>
      adminApi.resolveRequest(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-requests'] });
      toast.success('Запрос обработан');
    },
  });

  const tabs = [
    { id: 'overview', name: 'Обзор', icon: Activity },
    { id: 'users', name: 'Пользователи', icon: Users },
    { id: 'companies', name: 'Компании', icon: Building2 },
    { id: 'requests', name: 'Запросы', icon: FileText },
    { id: 'codes', name: 'Коды доступа', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Админ панель</h1>
        <p className="text-gray-600">Управление системой</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
                  <Users className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Всего пользователей</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.total_users || 0}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Активных компаний</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.active_companies || 0}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                  <FileText className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Ожидающих запросов</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.pending_requests || 0}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Всего деклараций</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.total_declarations || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Последние пользователи</h2>
              </div>
              <div className="card-body">
                {users?.items.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-900">{user.full_name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {user.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Ожидающие запросы</h2>
              </div>
              <div className="card-body">
                {pendingRequests && pendingRequests.length > 0 ? (
                  <div className="space-y-3">
                    {pendingRequests.slice(0, 5).map((request) => (
                      <div key={request.id} className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium text-gray-900">{request.title}</p>
                          <p className="text-sm text-gray-500">
                            {request.company?.name} • {request.created_by_user?.full_name}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => resolveRequestMutation.mutate({ id: request.id, status: 'resolved' })}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Одобрить"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => resolveRequestMutation.mutate({ id: request.id, status: 'cancelled' })}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Отклонить"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Нет ожидающих запросов</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пользователь</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Телефон</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата регистрации</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users?.items.map((user) => (
                  <tr key={user.id} className="table-row">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {user.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{user.phone}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {user.activity_type === 'declarant' ? 'Декларант' : 'Сертификатор'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {user.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(user.created_at), 'dd MMM yyyy', { locale: ru })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'companies' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Компания</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ИНН</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата создания</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {companies?.items.map((company) => (
                  <tr key={company.id} className="table-row">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">{company.name}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{company.inn}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {company.activity_type === 'declarant' ? 'Декларант' : 'Сертификатор'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`badge ${company.is_active ? 'badge-success' : 'badge-warning'}`}>
                        {company.is_active ? 'Активна' : 'Неактивна'}
                      </span>
                      {company.is_blocked && (
                        <span className="badge badge-danger ml-1">Заблокирована</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(company.created_at), 'dd MMM yyyy', { locale: ru })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex space-x-1">
                        {!company.is_active && (
                          <button
                            onClick={() => activateCompanyMutation.mutate(company.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Активировать"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {!company.is_blocked && company.is_active && (
                          <button
                            onClick={() => blockCompanyMutation.mutate(company.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Заблокировать"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Запрос</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Компания</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingRequests?.map((request) => (
                  <tr key={request.id} className="table-row">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{request.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{request.description}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {request.company?.name || 'Не указана'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {request.request_type}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="badge badge-warning">Ожидает</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(request.created_at), 'dd MMM yyyy', { locale: ru })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => resolveRequestMutation.mutate({ id: request.id, status: 'resolved' })}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Одобрить"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => resolveRequestMutation.mutate({ id: request.id, status: 'cancelled' })}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Отклонить"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'codes' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Коды администратора</h2>
            <button
              onClick={() => generateCodeMutation.mutate()}
              disabled={generateCodeMutation.isLoading}
              className="btn-primary"
            >
              <Shield className="h-4 w-4 mr-2" />
              Сгенерировать код
            </button>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Код</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Создан</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Истекает</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {adminCodes?.map((code) => (
                    <tr key={code.id} className="table-row">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {code.code}
                        </code>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(code.created_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(code.expires_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`badge ${code.is_used ? 'badge-gray' : 'badge-success'}`}>
                          {code.is_used ? 'Использован' : 'Активен'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {!code.is_used && (
                          <button
                            onClick={() => revokeCodeMutation.mutate(code.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Отозвать
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}