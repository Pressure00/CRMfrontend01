import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { declarationsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  Plus,
  Search,
  Filter,
  FileText,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  User,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Declaration, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

export default function DeclarationsPage() {
  const { companyMember } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  const { data, isPending, refetch } = useQuery<PaginatedResponse<Declaration>>({
    queryKey: ['declarations', page, search, statusFilter, companyMember?.company_id],
    queryFn: () => declarationsApi.getAll({
      page,
      size: 20,
      search: search || undefined,
      status: statusFilter || undefined,
      company_id: companyMember?.company_id,
    }).then(response => response.data),
  });

  const updateFilters = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: 'badge-gray',
      submitted: 'badge-info',
      in_progress: 'badge-warning',
      completed: 'badge-success',
      cancelled: 'badge-danger',
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

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту декларацию?')) return;
    
    try {
      await declarationsApi.delete(id);
      toast.success('Декларация удалена');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка удаления');
    }
    setMenuOpenId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Декларации</h1>
          <p className="text-gray-600">Управление декларациями на таможню</p>
        </div>
        <Link to="/declarations/new" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Новая декларация
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по номеру, клиенту..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  updateFilters({ search: e.target.value });
                }}
                className="input pl-10"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-outline flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Фильтры
              {statusFilter && (
                <span className="ml-2 bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-xs">
                  1
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Статус</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => updateFilters({ status: e.target.value })}
                    className="input"
                  >
                    <option value="">Все статусы</option>
                    <option value="draft">Черновик</option>
                    <option value="submitted">Отправлена</option>
                    <option value="in_progress">В работе</option>
                    <option value="completed">Завершена</option>
                    <option value="cancelled">Отменена</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {isPending ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет деклараций</h3>
            <p className="text-gray-500 mb-4">
              {search || statusFilter ? 'Попробуйте изменить фильтры' : 'Создайте свою первую декларацию'}
            </p>
            {!search && !statusFilter && (
              <Link to="/declarations/new" className="btn-primary">
                Создать декларацию
              </Link>
            )}
          </div>
        ) : (
          <>
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
                      Срок
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ответственный
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата создания
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data?.items.map((declaration) => (
                    <tr key={declaration.id} className="table-row">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          to={`/declarations/${declaration.id}`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-900"
                        >
                          {declaration.declaration_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
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
                        {declaration.deadline ? (
                          <span className={`flex items-center ${new Date(declaration.deadline) < new Date() ? 'text-red-600' : ''}`}>
                            <Calendar className="h-4 w-4 mr-1" />
                            {format(new Date(declaration.deadline), 'dd MMM yyyy', { locale: ru })}
                          </span>
                        ) : (
                          'Не указан'
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {declaration.assigned_user?.full_name || 'Не назначен'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(declaration.created_at), 'dd MMM yyyy', { locale: ru })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpenId(menuOpenId === declaration.id ? null : declaration.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {menuOpenId === declaration.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <Link
                                to={`/declarations/${declaration.id}`}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setMenuOpenId(null)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Просмотреть
                              </Link>
                              <Link
                                to={`/declarations/${declaration.id}/edit`}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setMenuOpenId(null)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Редактировать
                              </Link>
                              <button
                                onClick={() => handleDelete(declaration.id)}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Удалить
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Показано {data.items.length} из {data.total}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="btn-outline text-sm disabled:opacity-50"
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.pages}
                    className="btn-outline text-sm disabled:opacity-50"
                  >
                    Вперед
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
