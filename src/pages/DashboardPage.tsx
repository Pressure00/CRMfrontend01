import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  FileText,
  Award,
  CheckSquare,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function DashboardPage() {
  const { user, companyMember } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: 'badge-gray',
      submitted: 'badge-info',
      in_progress: 'badge-warning',
      completed: 'badge-success',
      cancelled: 'badge-danger',
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
      expired: 'badge-danger',
    };
    return statusMap[status] || 'badge-gray';
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, string> = {
      low: 'badge-gray',
      medium: 'badge-info',
      high: 'badge-warning',
      urgent: 'badge-danger',
    };
    return priorityMap[priority] || 'badge-gray';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
        <p className="text-gray-600">
          Добро пожаловать, {user?.full_name}! Вот обзор вашей деятельности.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
              <FileText className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Всего деклараций</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_declarations || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Активные сертификаты</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.active_certificates || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
              <CheckSquare className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ожидающие задачи</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pending_tasks || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Всего клиентов</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_clients || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Быстрые действия</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                to="/declarations/new"
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FileText className="h-8 w-8 text-primary-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Новая декларация</span>
              </Link>
              <Link
                to="/certificates/new"
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Award className="h-8 w-8 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Новый сертификат</span>
              </Link>
              <Link
                to="/tasks/new"
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <CheckSquare className="h-8 w-8 text-yellow-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Новая задача</span>
              </Link>
              <Link
                to="/clients/new"
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Users className="h-8 w-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">Новый клиент</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Ваша роль</h2>
          </div>
          <div className="card-body">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
                <span className="text-2xl font-bold text-primary-600">
                  {companyMember?.role === 'director' ? 'D' : companyMember?.role === 'senior' ? 'S' : 'E'}
                </span>
              </div>
              <p className="font-medium text-gray-900">
                {companyMember?.role === 'director' ? 'Директор' : companyMember?.role === 'senior' ? 'Старший сотрудник' : 'Сотрудник'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {companyMember?.role === 'director' 
                  ? 'Полный доступ ко всем функциям' 
                  : companyMember?.role === 'senior'
                  ? 'Расширенные права доступа'
                  : 'Базовые права доступа'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Declarations */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Последние декларации</h2>
          <Link to="/declarations" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Все декларации
          </Link>
        </div>
        <div className="card-body">
          {stats?.recent_declarations && stats.recent_declarations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Номер
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Клиент
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Приоритет
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.recent_declarations.map((declaration) => (
                    <tr key={declaration.id} className="table-row">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {declaration.declaration_number}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {declaration.client_name || 'Не указан'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`badge ${getStatusBadge(declaration.status)}`}>
                          {declaration.status === 'draft' ? 'Черновик' :
                           declaration.status === 'submitted' ? 'Отправлена' :
                           declaration.status === 'in_progress' ? 'В работе' :
                           declaration.status === 'completed' ? 'Завершена' :
                           declaration.status === 'cancelled' ? 'Отменена' : declaration.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`badge ${getPriorityBadge(declaration.priority)}`}>
                          {declaration.priority === 'low' ? 'Низкий' :
                           declaration.priority === 'medium' ? 'Средний' :
                           declaration.priority === 'high' ? 'Высокий' :
                           declaration.priority === 'urgent' ? 'Срочный' : declaration.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(declaration.declaration_date), 'dd MMM yyyy', { locale: ru })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Нет деклараций</p>
              <Link to="/declarations/new" className="btn-primary mt-4">
                Создать первую декларацию
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Предстоящие задачи</h2>
          <Link to="/tasks" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Все задачи
          </Link>
        </div>
        <div className="card-body">
          {stats?.upcoming_tasks && stats.upcoming_tasks.length > 0 ? (
            <div className="space-y-4">
              {stats.upcoming_tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <div className="flex items-center mt-1 space-x-4">
                      <span className={`badge ${getPriorityBadge(task.priority)}`}>
                        {task.priority === 'low' ? 'Низкий' :
                         task.priority === 'medium' ? 'Средний' :
                         task.priority === 'high' ? 'Высокий' :
                         task.priority === 'urgent' ? 'Срочный' : task.priority}
                      </span>
                      {task.due_date && (
                        <span className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(new Date(task.due_date), 'dd MMM yyyy', { locale: ru })}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/tasks/${task.id}`}
                    className="btn-outline text-sm"
                  >
                    Подробнее
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Нет предстоящих задач</p>
              <Link to="/tasks/new" className="btn-primary mt-4">
                Создать задачу
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Expiring Certificates */}
      {stats?.expiring_certificates && stats.expiring_certificates.length > 0 && (
        <div className="card border-orange-200">
          <div className="card-header bg-orange-50">
            <h2 className="text-lg font-semibold text-orange-800 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Сертификаты, срок действия которых истекает
            </h2>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {stats.expiring_certificates.slice(0, 3).map((certificate) => (
                <div key={certificate.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <p className="font-medium text-gray-900">{certificate.certificate_number}</p>
                    <p className="text-sm text-gray-600">
                      Действует до: {format(new Date(certificate.expiry_date), 'dd MMM yyyy', { locale: ru })}
                    </p>
                  </div>
                  <Link
                    to={`/certificates/${certificate.id}`}
                    className="btn-outline text-sm"
                  >
                    Просмотреть
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}